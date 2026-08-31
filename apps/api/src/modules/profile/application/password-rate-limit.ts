import { AppError } from '../../../shared/domain/app-error.js'

interface RateLimitRecord {
  timestamps: number[]
}

const statusRateLimits = new Map<string, RateLimitRecord>()

const WINDOW_MS = 60 * 1000
const MAX_REQUESTS = 10

function checkLimit(map: Map<string, RateLimitRecord>, key: string): boolean {
  const now = Date.now()
  const record = map.get(key) ?? { timestamps: [] }

  record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS)

  if (record.timestamps.length >= MAX_REQUESTS) {
    return false
  }

  record.timestamps.push(now)
  map.set(key, record)
  return true
}

export function checkPasswordStatusRateLimit(ip: string): void {
  if (!checkLimit(statusRateLimits, ip)) {
    throw new AppError(429, 'RATE_LIMIT_EXCEEDED', 'Quá nhiều yêu cầu, vui lòng thử lại sau 1 phút')
  }
}
