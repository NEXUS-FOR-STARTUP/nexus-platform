const COOLDOWN_MS = 1000;
const lastClaimAt = new Map<string, number>();

export function claimMessageSendSlot(userId: string, now = Date.now()) {
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
