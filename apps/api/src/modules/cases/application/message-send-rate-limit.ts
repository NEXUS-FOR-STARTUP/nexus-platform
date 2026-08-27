const COOLDOWN_MS = 1000;
const MAX_ENTRIES_BEFORE_SWEEP = 1000;
const lastClaimAt = new Map<string, number>();

function sweepExpiredEntries(now: number) {
  for (const [key, timestamp] of lastClaimAt.entries()) {
    if (now - timestamp > COOLDOWN_MS * 5) {
      lastClaimAt.delete(key);
    }
  }
}

export function claimMessageSendSlot(userId: string, now = Date.now()) {
  if (lastClaimAt.size > MAX_ENTRIES_BEFORE_SWEEP) {
    sweepExpiredEntries(now);
  }

  const last = lastClaimAt.get(userId);
  if (last !== undefined && now - last < COOLDOWN_MS) {
    return { ok: false as const, unlockInMs: COOLDOWN_MS - (now - last) };
  }
  lastClaimAt.set(userId, now);
  return { ok: true as const };
}

export function resetMessageSendRateLimitForTests() {
  lastClaimAt.clear();
}
