import { AppError } from "../domain/app-error.js";
import logger from "./logger.js";

export interface RateLimitBucket {
  key: string;
  max: number;
  windowMs: number;
  code: string;
  message: string;
}

export interface RateLimitRedisClient {
  status: string;
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<unknown>;
}

const MAX_TRACKED_KEYS = 5000;
const REDIS_TIMEOUT_MS = 800;
const memoryStore = new Map<string, number[]>();
let redisClient: RateLimitRedisClient | null = null;

export function setRateLimiterRedis(client: RateLimitRedisClient | null): void {
  redisClient = client;
}

function sweepExpired(now: number, maxWindowMs: number) {
  for (const [key, times] of memoryStore.entries()) {
    if (times.every((ts) => now - ts >= maxWindowMs)) {
      memoryStore.delete(key);
    }
  }
}

function claimInMemory(bucket: RateLimitBucket, now: number): boolean {
  if (memoryStore.size > MAX_TRACKED_KEYS) {
    sweepExpired(now, bucket.windowMs);
  }
  const kept = (memoryStore.get(bucket.key) ?? []).filter((ts) => now - ts < bucket.windowMs);
  if (kept.length >= bucket.max) {
    return false;
  }
  kept.push(now);
  memoryStore.set(bucket.key, kept);
  return true;
}

async function claimInRedis(bucket: RateLimitBucket): Promise<boolean | null> {
  if (process.env.NODE_ENV === "test" || !redisClient || redisClient.status !== "ready") {
    return null;
  }

  try {
    const redisKey = `rl:${bucket.key}`;
    const timeout = Promise.withResolvers<never>();
    const timer = setTimeout(() => timeout.reject(new Error("redis timeout")), REDIS_TIMEOUT_MS);

    let count: number;
    try {
      count = await Promise.race([redisClient.incr(redisKey), timeout.promise]);
    } finally {
      clearTimeout(timer);
    }

    if (count === 1) {
      await redisClient.pexpire(redisKey, bucket.windowMs).catch(() => {});
    }
    return count <= bucket.max;
  } catch (err) {
    logger.warn({ err, key: bucket.key }, "Rate limiter Redis fallback to memory");
    return null;
  }
}

export async function enforceRateLimit(buckets: RateLimitBucket[], now = Date.now()): Promise<void> {
  for (const bucket of buckets) {
    if (bucket.max <= 0) continue;
    const redisResult = await claimInRedis(bucket);
    const allowed = redisResult !== null ? redisResult : claimInMemory(bucket, now);
    if (!allowed) {
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
  memoryStore.clear();
}
