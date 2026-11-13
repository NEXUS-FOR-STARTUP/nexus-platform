import {
  enforceRateLimit,
  resetRateLimiterMemoryForTests,
  type RateLimitBucket,
} from '../../../shared/infrastructure/rate-limiter.js'

const DAY_MS = 24 * 60 * 60 * 1000
const TEAM_FIT_WINDOW_MS = Number(process.env.TEAM_FIT_WINDOW_MINUTES ?? 60) * 60 * 1000
const TEAM_FIT_MAX_REQUESTS = Number(process.env.TEAM_FIT_MAX_REQUESTS ?? 3)
const TEAM_FIT_DAILY_MAX_REQUESTS = Number(process.env.TEAM_FIT_DAILY_MAX_REQUESTS ?? 5)
const TEAM_FIT_IP_WINDOW_MS = Number(process.env.TEAM_FIT_IP_WINDOW_MINUTES ?? 60) * 60 * 1000
const TEAM_FIT_IP_MAX_REQUESTS = Number(process.env.TEAM_FIT_IP_MAX_REQUESTS ?? 15)

export function buildTeamFitBuckets(userId: string, ip = ''): RateLimitBucket[] {
  const buckets: RateLimitBucket[] = [
    {
      key: `team-fit:u:h:${userId}`,
      max: TEAM_FIT_MAX_REQUESTS,
      windowMs: TEAM_FIT_WINDOW_MS,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Bạn đã dùng hết lượt phân tích trong giờ này. Vui lòng thử lại sau ít phút.',
    },
    {
      key: `team-fit:u:d:${userId}`,
      max: TEAM_FIT_DAILY_MAX_REQUESTS,
      windowMs: DAY_MS,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Bạn đã dùng hết lượt phân tích trong ngày hôm nay. Vui lòng quay lại vào ngày mai.',
    },
  ]

  if (ip) {
    buckets.push({
      key: `team-fit:ip:h:${ip}`,
      max: TEAM_FIT_IP_MAX_REQUESTS,
      windowMs: TEAM_FIT_IP_WINDOW_MS,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Có quá nhiều lượt phân tích từ mạng này. Vui lòng thử lại sau ít phút.',
    })
  }

  return buckets
}

export async function checkTeamFitRateLimit(userId: string, ip = '', now = Date.now()): Promise<void> {
  await enforceRateLimit(buildTeamFitBuckets(userId, ip), now)
}

export function resetTeamFitRateLimitForTests(): void {
  resetRateLimiterMemoryForTests()
}
