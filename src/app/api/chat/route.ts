import { buildContext, systemPrompt } from "@/lib/chat/knowledge";
import { LEAK_REPLACEMENT, leaksPrompt, screen, type GateReason } from "@/lib/chat/guard";
import { checkFallback, checkLimits, clientIp, getConfig, isStoreConfigured, sameOrigin, type ChatConfig } from "@/lib/chat/limits";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_QUESTION = 280;
const MAX_TURNS = 5;
const MAX_TURN_CHARS = 600;
const HOLD_BACK = 60; // characters held back so a leaked phrase can be cut before it is sent

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

/** Tells the page whether to show the text box. Does not touch Redis or the model. */
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


class UpstreamError extends Error {
  constructor(public status: number) {
    super(`upstream ${status}`);
  }
  /** Timeouts, 429s and server errors are worth retrying on standard processing. */
  get retryable() {
    return this.status === 0 || this.status === 408 || this.status === 429 || this.status >= 500;
  }
}

type Opened = { reader: ReadableStreamDefaultReader<Uint8Array>; first: Uint8Array | null; done: () => void };

/** Starts a streaming request. With firstByteMs set, gives up if nothing arrives in time. */
async function openStream(cfg: ChatConfig, payload: Record<string, unknown>, firstByteMs: number | null): Promise<Opened> {
  const ac = new AbortController();
  const total = setTimeout(() => ac.abort(), 25_000);
  const done = () => clearTimeout(total);
  // The deadline covers headers and the first chunk, because a queued flex request can delay both.
  let timedOut = false;
  const deadline = firstByteMs
    ? setTimeout(() => {
        timedOut = true;
        ac.abort();
      }, firstByteMs)
    : undefined;
  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ac.signal,
      cache: "no-store",
    });
    if (!res.ok || !res.body) throw new UpstreamError(res.status);
    const reader = res.body.getReader();
    if (!firstByteMs) return { reader, first: null, done };
    const first = await reader.read();
    clearTimeout(deadline);
    return { reader, first: first.done ? null : (first.value ?? null), done };
  } catch (e) {
    clearTimeout(deadline);
    done();
    ac.abort();
    if (timedOut) throw new UpstreamError(408);
    throw e instanceof UpstreamError ? e : new UpstreamError(0);
  }
}

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

  // Assistant messages from the browser can be forged, so only the user's questions are used.
  const questions = messages.filter((m) => m.role === "user").map((m) => m.content);
  const current = questions[questions.length - 1];
  const previous = questions.length > 1 ? questions[questions.length - 2] : null;

  // 1. Free gate. Refused questions stop here.
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

  // 2. Budgets. Only questions that would cost money count.
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

  const base: Record<string, unknown> = {
    model: cfg.model,
    stream: true,
    [cfg.tokenParam]: cfg.maxOutputTokens,
    messages: [{ role: "system", content: prompt }, ...chat],
    ...cfg.extraBody,
  };
  if (!cfg.omitTemperature) base.temperature = 0.2;

  // 3. Call the model. Try flex first, and fall back to standard while the fallback budget lasts.
  let opened: Opened;
  let tier: "flex" | "standard" | "fallback" = cfg.tier;
  try {
    opened = await openStream(cfg, cfg.tier === "flex" ? { ...base, service_tier: "flex" } : base, cfg.tier === "flex" ? cfg.flexFirstByteMs : null);
  } catch (e) {
    const err = e instanceof UpstreamError ? e : new UpstreamError(0);
    console.error("chat upstream failed", { tier: cfg.tier, status: err.status });
    if (!(cfg.tier === "flex" && cfg.fallback && err.retryable)) return json({ error: "upstream" }, 502);
    const fb = await checkFallback(cfg, clientIp(req));
    if (!fb.ok) {
      if (fb.reason === "store_unavailable") return json({ error: "unavailable" }, 503);
      return json({ error: "busy", reason: fb.reason }, 503, { "Retry-After": "600" });
    }
    try {
      opened = await openStream(cfg, base, null);
      tier = "fallback";
    } catch (e2) {
      console.error("chat fallback failed", { status: e2 instanceof UpstreamError ? e2.status : 0 });
      return json({ error: "upstream" }, 502);
    }
  }

  const { reader, done } = opened;
  let pending: Uint8Array | null = opened.first;
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
        // Keep reading until something is sent or the stream ends. A pull that sends nothing
        // is never called again, which stalls the response.
        for (;;) {
          const before = emitted;
          const chunk = pending ? { done: false, value: pending } : await reader.read();
          pending = null;
          if (chunk.done) {
            if (!stopped) {
              const rest = leaksPrompt(acc) ? LEAK_REPLACEMENT : acc.slice(emitted);
              if (rest) controller.enqueue(encoder.encode(rest));
            }
            done();
            controller.close();
            return;
        }
        buffer += decoder.decode(chunk.value, { stream: true });
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
            done();
            controller.close();
            void reader.cancel().catch(() => {});
            return;
          }
          const safeEnd = Math.max(emitted, acc.length - HOLD_BACK);
          if (safeEnd > emitted) {
            controller.enqueue(encoder.encode(acc.slice(emitted, safeEnd)));
            emitted = safeEnd;
          }
        }
        if (emitted > before) return;
        }
      } catch {
        done();
        controller.close();
      }
    },
    cancel() {
      done();
      void reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Chat-Gate": "passed",
      "X-Chat-Tier": tier,
    },
  });
}
