import { buildContext, SYSTEM_PROMPT } from "@/lib/chat/knowledge";
import { checkLimits, clientIp, getConfig, isStoreConfigured, sameOrigin } from "@/lib/chat/limits";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_QUESTION = 280;
const MAX_TURNS = 5;
const MAX_TURN_CHARS = 600;

type Msg = { role: "user" | "assistant"; content: string };

const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

/** Lets the UI decide whether to show the text box. Touches neither Redis nor the LLM. */
export async function GET() {
  const cfg = getConfig();
  return json({ enabled: cfg.enabled && isStoreConfigured(cfg) }, 200);
}

function clean(s: string): string {
  // strip control characters; keep newlines/tabs as spaces
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
    const text = clean(content);
    if (!text) return null;
    out.push({ role, content: text.slice(0, MAX_TURN_CHARS) });
  }
  const last = out[out.length - 1];
  if (last.role !== "user" || last.content.length > MAX_QUESTION) return null;
  return out;
}

export async function POST(req: Request) {
  const cfg = getConfig();
  if (!cfg.enabled) return json({ error: "disabled" }, 503);
  if (!sameOrigin(req)) return json({ error: "forbidden" }, 403);

  // Reject oversized bodies before parsing anything.
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

  const limit = await checkLimits(cfg, clientIp(req));
  if (!limit.ok) {
    if (limit.reason === "store_unavailable") return json({ error: "unavailable" }, 503);
    return json({ error: "rate_limited", reason: limit.reason }, 429, { "Retry-After": "3600" });
  }

  const userTurns = messages.filter((m) => m.role === "user").map((m) => m.content);
  const context = buildContext(userTurns.slice(-2));

  let upstream: Response;
  try {
    upstream = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: cfg.model,
        stream: true,
        temperature: 0.2,
        max_tokens: cfg.maxOutputTokens,
        messages: [{ role: "system", content: `${SYSTEM_PROMPT}\n\nCONTEXT:\n${context}` }, ...messages],
      }),
      signal: AbortSignal.timeout(25_000),
      cache: "no-store",
    });
  } catch {
    return json({ error: "upstream" }, 502);
  }
  if (!upstream.ok || !upstream.body) {
    // Never forward provider error text to the browser.
    console.error("chat upstream status", upstream.status);
    return json({ error: "upstream" }, 502);
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith("data:")) continue;
          const payload = t.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) controller.enqueue(encoder.encode(delta));
          } catch {
            /* ignore partial or non-JSON keep-alive lines */
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
    },
  });
}
