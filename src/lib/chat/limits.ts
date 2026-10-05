import { createHash } from "node:crypto";

/**
 * Cost and abuse controls for the AI assistant.
 *
 * Every request is bounded (short input, capped output, small retrieved context), so a request
 * count is a reliable proxy for spend. Counters live in Redis (Upstash REST) so they are shared
 * across serverless instances. In production the assistant FAILS CLOSED if Redis is unavailable.
 */

export type ChatConfig = {
  enabled: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
  ipHourly: number;
  ipDaily: number;
  globalDaily: number;
  maxOutputTokens: number;
  allowMemoryStore: boolean;
};

function int(v: string | undefined, d: number): number {
  const n = Number.parseInt(v ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : d;
}

export function getConfig(): ChatConfig {
  const apiKey = process.env.LLM_API_KEY ?? "";
  return {
    enabled: apiKey.length > 0 && process.env.CHAT_ENABLED !== "false",
    apiKey,
    baseUrl: (process.env.LLM_BASE_URL ?? "https://api.deepseek.com").replace(/\/+$/, ""),
    model: process.env.LLM_MODEL ?? "deepseek-chat",
    ipHourly: int(process.env.CHAT_IP_HOURLY_LIMIT, 10),
    ipDaily: int(process.env.CHAT_IP_DAILY_LIMIT, 25),
    globalDaily: int(process.env.CHAT_DAILY_LIMIT, 300),
    maxOutputTokens: int(process.env.CHAT_MAX_OUTPUT_TOKENS, 300),
    allowMemoryStore: process.env.CHAT_ALLOW_MEMORY_STORE === "true" || process.env.NODE_ENV === "development",
  };
}

// ---------------------------------------------------------------- store
type Store = { incr(key: string, ttlSeconds: number): Promise<number> };

const mem = new Map<string, { n: number; exp: number }>();
const memoryStore: Store = {
  async incr(key, ttl) {
    const now = Date.now();
    const cur = mem.get(key);
    if (!cur || cur.exp < now) {
      mem.set(key, { n: 1, exp: now + ttl * 1000 });
      return 1;
    }
    cur.n += 1;
    return cur.n;
  },
};

function upstashStore(url: string, token: string): Store {
  return {
    async incr(key, ttl) {
      const res = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", key],
          ["EXPIRE", key, String(ttl)],
        ]),
        signal: AbortSignal.timeout(3000),
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`store ${res.status}`);
      const out = (await res.json()) as { result?: number; error?: string }[];
      const n = out?.[0]?.result;
      if (typeof n !== "number") throw new Error("store bad response");
      return n;
    },
  };
}

/** True when requests can be counted, so the assistant can safely be offered. */
export function isStoreConfigured(cfg: ChatConfig): boolean {
  return getStore(cfg) !== null;
}

function getStore(cfg: ChatConfig): Store | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return upstashStore(url, token);
  return cfg.allowMemoryStore ? memoryStore : null;
}

// ---------------------------------------------------------------- limiter
export type LimitResult =
  | { ok: true }
  | { ok: false; reason: "ip_hourly" | "ip_daily" | "global_daily" | "store_unavailable" };

export function hashIp(ip: string): string {
  return createHash("sha256")
    .update(`${process.env.CHAT_HASH_SALT ?? "portfolio"}:${ip}`)
    .digest("hex")
    .slice(0, 16);
}

export async function checkLimits(cfg: ChatConfig, ip: string): Promise<LimitResult> {
  const store = getStore(cfg);
  if (!store) return { ok: false, reason: "store_unavailable" };
  const d = new Date();
  const day = d.toISOString().slice(0, 10);
  const hour = d.toISOString().slice(0, 13);
  const id = hashIp(ip);
  try {
    // Per-visitor limits first, so one visitor cannot spend the global budget past their own cap.
    if ((await store.incr(`chat:ip:${id}:h:${hour}`, 2 * 3600)) > cfg.ipHourly) return { ok: false, reason: "ip_hourly" };
    if ((await store.incr(`chat:ip:${id}:d:${day}`, 36 * 3600)) > cfg.ipDaily) return { ok: false, reason: "ip_daily" };
    if ((await store.incr(`chat:global:${day}`, 36 * 3600)) > cfg.globalDaily) return { ok: false, reason: "global_daily" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "store_unavailable" };
  }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "unknown";
}

/** Same-origin check: a browser on another site cannot drive this endpoint through a visitor. */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
