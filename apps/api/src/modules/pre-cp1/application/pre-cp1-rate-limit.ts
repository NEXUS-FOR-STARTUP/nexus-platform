import {
  enforceRateLimit,
  resetRateLimiterMemoryForTests,
  type RateLimitBucket,
} from '../../../shared/infrastructure/rate-limiter.js'

const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_MS = Number(process.env.PRE_CP1_LABEL_WINDOW_MINUTES ?? 60) * 60 * 1000
const MAX_REQUESTS = Number(process.env.PRE_CP1_LABEL_MAX_REQUESTS ?? 6)
const DAILY_MAX_REQUESTS = Number(process.env.PRE_CP1_LABEL_DAILY_MAX_REQUESTS ?? 10)
const IP_WINDOW_MS = Number(process.env.PRE_CP1_LABEL_IP_WINDOW_MINUTES ?? 60) * 60 * 1000
const IP_MAX_REQUESTS = Number(process.env.PRE_CP1_LABEL_IP_MAX_REQUESTS ?? 30)

export function buildPreCp1LabelBuckets(userId: string, ip = ''): RateLimitBucket[] {
  const buckets: RateLimitBucket[] = [
    {
      key: `pre-cp1-label:u:h:${userId}`,
      max: MAX_REQUESTS,
      windowMs: WINDOW_MS,
      code: 'PRE_CP1_RATE_LIMITED',
      message: 'Bạn đã dùng hết lượt phân tích trong giờ này. Vui lòng thử lại sau ít phút.',
    },
    {
      key: `pre-cp1-label:u:d:${userId}`,
      max: DAILY_MAX_REQUESTS,
      windowMs: DAY_MS,
      code: 'PRE_CP1_RATE_LIMITED',
      message: 'Bạn đã dùng hết lượt phân tích trong ngày hôm nay. Vui lòng quay lại vào ngày mai.',
    },
  ]

  if (ip) {
    buckets.push({
      key: `pre-cp1-label:ip:h:${ip}`,
      max: IP_MAX_REQUESTS,
      windowMs: IP_WINDOW_MS,
      code: 'PRE_CP1_RATE_LIMITED',
      message: 'Có quá nhiều lượt phân tích từ mạng này. Vui lòng thử lại sau ít phút.',
    })
  }

  return buckets
}

export async function checkPreCp1LabelRateLimit(userId: string, ip = '', now = Date.now()): Promise<void> {
  await enforceRateLimit(buildPreCp1LabelBuckets(userId, ip), now)
}

export function resetPreCp1LabelRateLimitForTests(): void {
  resetRateLimiterMemoryForTests()
}
