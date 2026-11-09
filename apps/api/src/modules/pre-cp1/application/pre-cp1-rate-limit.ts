import { AppError } from '../../../shared/domain/app-error.js'

// Sliding window per account for the pre-CP1 label endpoint.
// PRE_CP1_LABEL_MAX_REQUESTS / PRE_CP1_LABEL_WINDOW_MINUTES read from env.
// PRE_CP1_LABEL_MAX_TRACKED_USERS caps the Map so memory cannot grow without bound.
const WINDOW_MS = Number(process.env.PRE_CP1_LABEL_WINDOW_MINUTES ?? 60) * 60 * 1000
const MAX_REQUESTS = Number(process.env.PRE_CP1_LABEL_MAX_REQUESTS ?? 20)
const MAX_TRACKED_USERS = Number(process.env.PRE_CP1_LABEL_MAX_TRACKED_USERS ?? 1000)

const timestamps = new Map<string, number[]>()

function sweepExpiredEntries(now: number) {
  for (const [key, times] of timestamps.entries()) {
    if (times.every((ts) => now - ts >= WINDOW_MS)) timestamps.delete(key)
  }
}

export function claimPreCp1LabelSlot(userId: string, now = Date.now()) {
  if (timestamps.size > MAX_TRACKED_USERS) sweepExpiredEntries(now)
  const kept = (timestamps.get(userId) ?? []).filter((ts) => now - ts < WINDOW_MS)
  if (kept.length >= MAX_REQUESTS) return { ok: false as const }
  kept.push(now)
  timestamps.set(userId, kept)
  return { ok: true as const }
}

export function checkPreCp1LabelRateLimit(userId: string, now = Date.now()): void {
  if (!claimPreCp1LabelSlot(userId, now).ok) {
    throw new AppError(429, 'PRE_CP1_RATE_LIMITED', 'Bạn đã thử nhiều lần. Thử lại sau ít phút.')
  }
}

export function resetPreCp1LabelRateLimitForTests() {
  timestamps.clear()
}
