import { AppError } from '../../../shared/domain/app-error.js'

// Giới hạn lượt gọi AI team-fit theo tài khoản. Đọc từ env, có giá trị mặc định.
// TEAM_FIT_MAX_REQUESTS: số lượt tối đa mỗi TEAM_FIT_WINDOW_MINUTES phút.
// TEAM_FIT_MAX_TRACKED_USERS: trần số tài khoản giữ trong Map, chống phình bộ nhớ.
// Map trong bộ nhớ (giống message-send-rate-limit), không thêm bảng.
// Xem lại kết quả đã lưu không qua đây nên không tính lượt.
const TEAM_FIT_WINDOW_MS = Number(process.env.TEAM_FIT_WINDOW_MINUTES ?? 10) * 60 * 1000
const TEAM_FIT_MAX_REQUESTS = Number(process.env.TEAM_FIT_MAX_REQUESTS ?? 10)
const MAX_TRACKED_USERS = Number(process.env.TEAM_FIT_MAX_TRACKED_USERS ?? 1000)

const teamFitTimestamps = new Map<string, number[]>()

function sweepExpiredEntries(now: number) {
  for (const [key, timestamps] of teamFitTimestamps.entries()) {
    if (timestamps.every((ts) => now - ts >= TEAM_FIT_WINDOW_MS)) {
      teamFitTimestamps.delete(key)
    }
  }
}

export function claimTeamFitSlot(userId: string, now = Date.now()) {
  if (teamFitTimestamps.size > MAX_TRACKED_USERS) {
    sweepExpiredEntries(now)
  }

  const timestamps = (teamFitTimestamps.get(userId) ?? []).filter((ts) => now - ts < TEAM_FIT_WINDOW_MS)
  if (timestamps.length >= TEAM_FIT_MAX_REQUESTS) {
    return { ok: false as const }
  }
  timestamps.push(now)
  teamFitTimestamps.set(userId, timestamps)
  return { ok: true as const }
}

export function checkTeamFitRateLimit(userId: string, now = Date.now()): void {
  if (!claimTeamFitSlot(userId, now).ok) {
    throw new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Nhóm đã dùng hết lượt kiểm tra nhanh. Vui lòng thử lại sau ít phút.')
  }
}

export function resetTeamFitRateLimitForTests() {
  teamFitTimestamps.clear()
}
