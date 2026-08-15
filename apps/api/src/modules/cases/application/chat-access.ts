export const CHAT_LOCK_WINDOW_MS = 24 * 3600_000

export type ChatAccessCode =
  | "CHAT_FREE_TIER"
  | "CHAT_REJECTED"
  | "CHAT_CLOSED"
  | "CHAT_LOCKED"
  | "CHAT_OK"

export interface ChatAccessResult {
  ok: boolean
  code: ChatAccessCode
  unlockInMs?: number
}

export function evaluateChatAccess(params: {
  lockedPrice: number
  stage: string | null
  creditBalance: number
  completedAt: Date | null
  creditExhaustedAt: Date | null
}): ChatAccessResult {
  const { lockedPrice, stage, creditBalance, completedAt, creditExhaustedAt } = params

  if (lockedPrice === 0) return { ok: false, code: "CHAT_FREE_TIER" }
  if (stage === "rejected") return { ok: false, code: "CHAT_REJECTED" }
  if (stage === "closed") return { ok: false, code: "CHAT_CLOSED" }

  if (creditBalance > 0) {
    if (stage === "completed" && completedAt) {
      const elapsed = Date.now() - completedAt.getTime()
      if (elapsed >= CHAT_LOCK_WINDOW_MS) return { ok: false, code: "CHAT_CLOSED" }
    }
    return { ok: true, code: "CHAT_OK" }
  }

  if (creditExhaustedAt) {
    const elapsed = Date.now() - creditExhaustedAt.getTime()
    if (elapsed < CHAT_LOCK_WINDOW_MS) {
      return { ok: false, code: "CHAT_LOCKED", unlockInMs: CHAT_LOCK_WINDOW_MS - elapsed }
    }
  }

  return { ok: true, code: "CHAT_OK" }
}
