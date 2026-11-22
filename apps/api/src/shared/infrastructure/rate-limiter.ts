import { AppError } from "../domain/app-error.js";

export interface RateLimitBucket {
  key: string;
  max: number;
  windowMs: number;
  code: string;
  message: string;
}

/**
 * Sliding-window counters, per process.
 *
 * shortcut: counters live in this process only, so running more than one api
 * instance multiplies every limit by the instance count. Moving to a shared
 * store is required before scaling out (Redis with one atomic script doing
 * `INCR` + `PEXPIRE` only when the counter was created, never per request —
 * refreshing the TTL on every call turns a fixed window into a lockout).
 */
interface Window {
  times: number[];
  windowMs: number;
}

const MAX_TRACKED_KEYS = 5000;
const store = new Map<string, Window>();

/** Drops keys whose every stamp is older than that key's own window. */
function sweepExpired(now: number): void {
  for (const [key, window] of store.entries()) {
    if (window.times.every((ts) => now - ts >= window.windowMs)) {
      store.delete(key);
    }
  }
}

function claim(bucket: RateLimitBucket, now: number): boolean {
  if (store.size > MAX_TRACKED_KEYS) {
    sweepExpired(now);
  }
  const times = (store.get(bucket.key)?.times ?? []).filter((ts) => now - ts < bucket.windowMs);
  if (times.length >= bucket.max) {
    store.set(bucket.key, { times, windowMs: bucket.windowMs });
    return false;
  }
  times.push(now);
  store.set(bucket.key, { times, windowMs: bucket.windowMs });
  return true;
}

export async function enforceRateLimit(buckets: RateLimitBucket[], now = Date.now()): Promise<void> {
  for (const bucket of buckets) {
    if (bucket.max <= 0) continue;
    if (!claim(bucket, now)) {
      throw new AppError(429, bucket.code, bucket.message);
    }
  }
}

export function extractClientIp(headers: { get(name: string): string | null | undefined } | undefined): string {
  if (!headers) return "";
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  return headers.get("x-real-ip")?.trim() ?? "";
}

export function resetRateLimiterMemoryForTests(): void {
  store.clear();
}
