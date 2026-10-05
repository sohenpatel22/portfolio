import { buildContext, systemPrompt } from "@/lib/chat/knowledge";
import { LEAK_REPLACEMENT, leaksPrompt, screen, type GateReason } from "@/lib/chat/guard";
import { checkLimits, clientIp, getConfig, isStoreConfigured, sameOrigin } from "@/lib/chat/limits";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_QUESTION = 280;
const MAX_TURNS = 5;
const MAX_TURN_CHARS = 600;
const HOLD_BACK = 60; // chars withheld from the stream so a leaked phrase can be cut before it is sent

type Msg = { role: "user" | "assistant"; content: string };

const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

const text = (body: string, headers: Record<string, string> = {}) =>
  new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });

/** Lets the UI decide whether to show the text box. Touches neither Redis nor the LLM. */
export async function GET() {
  const cfg = getConfig();
  return json({ enabled: cfg.enabled && isStoreConfigured(cfg) }, 200);
}

function clean(s: string): string {
  return s.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
}

function parse(body: unknown): Msg[] | null {
  if (!body || typeof body !== "object") return null;
  const raw = (body as { messages?: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_TURNS) return null;
  const out: Msg[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as { role?: unknown; content?: unknown };
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const t = clean(content);
    if (!t) return null;
    out.push({ role, content: t.slice(0, MAX_TURN_CHARS) });
  }
  const last = out[out.length - 1];
  if (last.role !== "user" || last.content.length > MAX_QUESTION) return null;
  return out;
}

const HARD: GateReason[] = ["injection", "secrets", "private", "advice", "link", "abuse", "safety"];

const gate = (q: string) => screen(q);
const FOLLOW_UP = /^(and|also|what about|how about|tell me more|more|why|how|which|when|where|who|elaborate|go on|continue|details|can you (explain|elaborate|expand)|could you (explain|elaborate|expand))\b/;

export async function POST(req: Request) {
  const cfg = getConfig();
  if (!cfg.enabled) return json({ error: "disabled" }, 503);
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);

  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > 8_000) return json({ error: "too_large" }, 413);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const messages = parse(body);
  if (!messages) return json({ error: "bad_request" }, 400);

  // Client-supplied assistant messages are untrusted (a visitor can forge them to prime the model),
  // so only the user's own questions are used.
  const questions = messages.filter((m) => m.role === "user").map((m) => m.content);
  const current = questions[questions.length - 1];
  const previous = questions.length > 1 ? questions[questions.length - 2] : null;

  // 1. Free, deterministic gate. Nothing below this line runs for refused questions.
  const prevScreen = previous ? gate(previous) : null;
  if (prevScreen && prevScreen.verdict.action === "reply" && HARD.includes(prevScreen.verdict.reason)) {
    return text(prevScreen.verdict.text, { "X-Chat-Gate": prevScreen.verdict.reason });
  }
  const cur = gate(current);
  const useHistory = Boolean(previous && prevScreen?.verdict.action === "allow");
  if (cur.verdict.action === "reply") {
    const v = cur.verdict;
    const followUp =
      v.reason === "off_topic" && useHistory && current.length <= 60 && FOLLOW_UP.test(cur.normalized);
    if (!followUp) return text(v.text, { "X-Chat-Gate": v.reason });
  }

  // 2. Per-visitor and global budgets (only for questions that would cost money).
  const limit = await checkLimits(cfg, clientIp(req));
  if (!limit.ok) {
    if (limit.reason === "store_unavailable") return json({ error: "unavailable" }, 503);
    return json({ error: "rate_limited", reason: limit.reason }, 429, { "Retry-After": "3600" });
  }

  const context = buildContext(useHistory && previous ? [previous, current] : [current]);
  const prompt = `${systemPrompt()}\n\nCONTEXT:\n${context}`;
  const chat: Msg[] = [];
  if (useHistory && previous) chat.push({ role: "user", content: previous });
  chat.push({ role: "user", content: current });

  if (cfg.evalDryRun) {
    return text("[dry-run: model call skipped]", {
      "X-Chat-Gate": "passed",
      "X-Chat-Prompt-Chars": String(prompt.length + chat.reduce((n, m) => n + m.content.length, 0)),
    });
  }

  const payload: Record<string, unknown> = {
    model: cfg.model,
    stream: true,
    [cfg.tokenParam]: cfg.maxOutputTokens,
    messages: [{ role: "system", content: prompt }, ...chat],
    ...cfg.extraBody,
  };
  if (!cfg.omitTemperature) payload.temperature = 0.2;

  let upstream: Response;
  try {
    upstream = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
  } catch {
    return json({ error: "upstream" }, 502);
  }
  if (!upstream.ok || !upstream.body) {
    console.error("chat upstream status", upstream.status);
    return json({ error: "upstream" }, 502);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let acc = "";
  let emitted = 0;
  let stopped = false;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (stopped) return;
      try {
        const { done, value } = await reader.read();
        if (done) {
          if (!stopped) {
            const rest = leaksPrompt(acc) ? LEAK_REPLACEMENT : acc.slice(emitted);
            if (rest) controller.enqueue(encoder.encode(rest));
          }
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const p = t.slice(5).trim();
          if (p === "[DONE]") continue;
          let delta: unknown;
          try {
            delta = JSON.parse(p)?.choices?.[0]?.delta?.content;
          } catch {
            continue;
          }
          if (typeof delta !== "string" || !delta) continue;
          acc += delta;
          if (leaksPrompt(acc)) {
            stopped = true;
            controller.enqueue(encoder.encode(emitted === 0 ? LEAK_REPLACEMENT : ` ${LEAK_REPLACEMENT}`));
            controller.close();
            void reader.cancel();
            return;
          }
          const safeEnd = Math.max(emitted, acc.length - HOLD_BACK);
          if (safeEnd > emitted) {
            controller.enqueue(encoder.encode(acc.slice(emitted, safeEnd)));
            emitted = safeEnd;
          }
        }
      } catch {
        controller.close();
      }
    },
    cancel() {
      void reader.cancel();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Chat-Gate": "passed",
    },
  });
}
