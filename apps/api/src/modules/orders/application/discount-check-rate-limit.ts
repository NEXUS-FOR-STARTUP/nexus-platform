/** Per-user sliding window that blocks brute-forcing discount codes. */
export const DISCOUNT_CHECK_WINDOW_MS = 60_000;
export const DISCOUNT_CHECK_MAX_ATTEMPTS = 10;
const MAX_ENTRIES_BEFORE_SWEEP = 1000;

const attempts = new Map<string, number[]>();

export function claimDiscountCheckSlot(userId: string, now = Date.now()) {
  if (attempts.size > MAX_ENTRIES_BEFORE_SWEEP) {
    for (const [key, stamps] of attempts.entries()) {
      if (stamps.every((t) => now - t >= DISCOUNT_CHECK_WINDOW_MS)) attempts.delete(key);
    }
  }

  const recent = (attempts.get(userId) ?? []).filter((t) => now - t < DISCOUNT_CHECK_WINDOW_MS);
  if (recent.length >= DISCOUNT_CHECK_MAX_ATTEMPTS) {
    attempts.set(userId, recent);
    return { ok: false as const, unlockInMs: DISCOUNT_CHECK_WINDOW_MS - (now - recent[0]!) };
  }
  recent.push(now);
  attempts.set(userId, recent);
  return { ok: true as const };
}

export function resetDiscountCheckRateLimitForTests() {
  attempts.clear();
}
