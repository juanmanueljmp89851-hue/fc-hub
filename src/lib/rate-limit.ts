import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const limiters = new Map<string, Ratelimit>();

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      prefix: "rl",
    });
    limiters.set(cacheKey, limiter);
  }
  return limiter;
}

// In-memory fallback (works only within single invocation on serverless)
const hits = new Map<string, { count: number; resetAt: number }>();

function inMemoryLimit(key: string, limit: number, windowMs: number): { ok: boolean } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  entry.count++;
  return { ok: entry.count <= limit };
}

export async function rateLimitAsync(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean }> {
  const limiter = getLimiter(limit, windowMs);
  if (!limiter) return inMemoryLimit(key, limit, windowMs);
  try {
    const { success } = await limiter.limit(key);
    return { ok: success };
  } catch {
    return inMemoryLimit(key, limit, windowMs);
  }
}

/** @deprecated Use rateLimitAsync instead. Sync fallback for gradual migration. */
export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean } {
  return inMemoryLimit(key, limit, windowMs);
}
