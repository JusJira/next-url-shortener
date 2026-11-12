import { headers } from "next/headers";

/** Five creations per rolling minute, matching the recommended edge rule. */
const WINDOW_SECONDS = 60;
const MAX_PER_WINDOW = 5;

/** A best-effort daily ceiling per IP, on top of the per-minute limit. */
const MAX_PER_DAY = 25;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "window" | "daily"; retryAfterSeconds: number };

function getKv(): KVNamespace {
  const kv = process.env.MY_KV;
  if (!kv) {
    throw new Error("The MY_KV binding is not configured");
  }
  return kv;
}

/**
 * Cloudflare overwrites these headers at the edge. Only fall back to
 * x-forwarded-for when the request is not coming through Cloudflare (e.g. local
 * development). Keys are sanitised so a header value cannot break the KV key.
 */
export function getClientIp(): string {
  const requestHeaders = headers();
  const raw =
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0] ??
    "unknown";

  const sanitised = raw
    .trim()
    .toLowerCase()
    .replace(/[^0-9a-f:.]/g, "_")
    .slice(0, 64);

  return sanitised || "unknown";
}

function secondsUntilNextUtcDay(now: number): number {
  const nextDay = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate() + 1
  );
  return Math.max(1, Math.ceil((nextDay - now) / 1000));
}

/**
 * Fixed-window limiter backed by the existing KV namespace. KV is eventually
 * consistent, so this is a backstop rather than a hard guarantee; the
 * Cloudflare Rate Limiting rule remains the authoritative control.
 */
export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  const kv = getKv();
  const now = Date.now();

  const windowMs = WINDOW_SECONDS * 1000;
  const windowId = Math.floor(now / windowMs);
  const windowKey = `ratelimit:${ip}:${windowId}`;

  const usedInWindow = Number((await kv.get(windowKey)) ?? "0");
  if (usedInWindow >= MAX_PER_WINDOW) {
    return {
      allowed: false,
      reason: "window",
      retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now % windowMs)) / 1000)),
    };
  }

  await kv.put(windowKey, String(usedInWindow + 1), {
    expirationTtl: WINDOW_SECONDS * 2,
  });

  const dayKey = `quota:${ip}:${new Date(now).toISOString().slice(0, 10)}`;
  const usedToday = Number((await kv.get(dayKey)) ?? "0");
  if (usedToday >= MAX_PER_DAY) {
    return {
      allowed: false,
      reason: "daily",
      retryAfterSeconds: secondsUntilNextUtcDay(now),
    };
  }

  return { allowed: true };
}

/** Count a successfully created link against the IP's daily quota. */
export async function recordCreation(ip: string): Promise<void> {
  const kv = getKv();
  const now = Date.now();
  const dayKey = `quota:${ip}:${new Date(now).toISOString().slice(0, 10)}`;
  const usedToday = Number((await kv.get(dayKey)) ?? "0");

  await kv.put(dayKey, String(usedToday + 1), {
    expirationTtl: secondsUntilNextUtcDay(now) + 3600,
  });
}

export const RATE_LIMIT = {
  windowSeconds: WINDOW_SECONDS,
  maxPerWindow: MAX_PER_WINDOW,
  maxPerDay: MAX_PER_DAY,
} as const;
