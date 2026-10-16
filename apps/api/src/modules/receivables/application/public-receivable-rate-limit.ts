import { AppError } from "../../../shared/domain/app-error.js";

// In-memory per-IP limiter (same approach as password-rate-limit). The page polls every 5s,
// so 60/min leaves room for a couple of open tabs while blocking token guessing.
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
export const PUBLIC_RECEIVABLE_MAX_TRACKED_IPS = 5000;

const hits = new Map<string, number[]>();

function tooMany(): AppError {
  return new AppError(429, "RATE_LIMIT_EXCEEDED", "Quá nhiều yêu cầu, vui lòng thử lại sau ít phút");
}

export function checkPublicReceivableRateLimit(ip: string, now = Date.now()): void {
  const known = hits.get(ip);
  if (!known && hits.size >= PUBLIC_RECEIVABLE_MAX_TRACKED_IPS) {
    for (const [key, stamps] of hits) {
      if (stamps.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
    // Still full of active IPs: fail closed for unseen ones so memory stays bounded.
    if (hits.size >= PUBLIC_RECEIVABLE_MAX_TRACKED_IPS) throw tooMany();
  }
  const recent = (known ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) throw tooMany();
  recent.push(now);
  hits.set(ip, recent);
}

export function resetPublicReceivableRateLimitForTests() {
  hits.clear();
}
