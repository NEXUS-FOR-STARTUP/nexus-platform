/**
 * Account Lockout Service (OWASP Authentication Defense)
 *
 * Tracks consecutive failed login attempts per account/email.
 * Enforces temporary account lockout after MAX_FAILED_ATTEMPTS within ATTEMPT_WINDOW_MS.
 */

export interface AccountLockoutConfig {
  maxAttempts: number
  lockoutDurationMs: number
  attemptWindowMs: number
  maxStoreSize: number
}

export interface LockoutStatus {
  isLocked: boolean
  remainingSeconds: number
  attempts: number
  remainingAttempts: number
}

interface AttemptRecord {
  attempts: number
  firstAttemptAt: number
  lastAttemptAt: number
  lockedUntil: number | null
}

const DEFAULT_CONFIG: AccountLockoutConfig = {
  maxAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000,
  attemptWindowMs: 15 * 60 * 1000,
  maxStoreSize: 10000,
}

export class AccountLockoutService {
  private store = new Map<string, AttemptRecord>()
  private config: AccountLockoutConfig

  constructor(config: Partial<AccountLockoutConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  private normalizeKey(email: string): string {
    return email.trim().toLowerCase()
  }

  /**
   * Sweeps expired records to free memory.
   */
  private sweepExpired(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (record.lockedUntil && record.lockedUntil <= now) {
        this.store.delete(key)
      } else if (!record.lockedUntil && now - record.lastAttemptAt > this.config.attemptWindowMs) {
        this.store.delete(key)
      }
    }
  }

  checkLockout(email: string): LockoutStatus {
    const key = this.normalizeKey(email)
    const record = this.store.get(key)
    const now = Date.now()

    if (!record) {
      return {
        isLocked: false,
        remainingSeconds: 0,
        attempts: 0,
        remainingAttempts: this.config.maxAttempts,
      }
    }

    // If locked and lock period is still active
    if (record.lockedUntil && record.lockedUntil > now) {
      const remainingSeconds = Math.ceil((record.lockedUntil - now) / 1000)
      return {
        isLocked: true,
        remainingSeconds,
        attempts: record.attempts,
        remainingAttempts: 0,
      }
    }

    // Lock expired -> auto-reset
    if (record.lockedUntil && record.lockedUntil <= now) {
      this.store.delete(key)
      return {
        isLocked: false,
        remainingSeconds: 0,
        attempts: 0,
        remainingAttempts: this.config.maxAttempts,
      }
    }

    // Attempt window expired -> auto-reset
    if (now - record.lastAttemptAt > this.config.attemptWindowMs) {
      this.store.delete(key)
      return {
        isLocked: false,
        remainingSeconds: 0,
        attempts: 0,
        remainingAttempts: this.config.maxAttempts,
      }
    }

    const remainingAttempts = Math.max(0, this.config.maxAttempts - record.attempts)
    return {
      isLocked: false,
      remainingSeconds: 0,
      attempts: record.attempts,
      remainingAttempts,
    }
  }

  /**
   * Records a failed login attempt for the email.
   */
  recordFailure(email: string): LockoutStatus {
    const key = this.normalizeKey(email)
    const now = Date.now()
    const current = this.checkLockout(key)

    if (current.isLocked) {
      return current
    }

    let record = this.store.get(key)
    if (!record) {
      if (this.store.size >= this.config.maxStoreSize) {
        this.sweepExpired()
        if (this.store.size >= this.config.maxStoreSize) {
          const evictCount = Math.floor(this.config.maxStoreSize * 0.2)
          let i = 0
          for (const [k] of this.store.entries()) {
            if (i++ >= evictCount) break
            this.store.delete(k)
          }
        }
      }

      record = {
        attempts: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
        lockedUntil: null,
      }
    } else {
      record.attempts += 1
      record.lastAttemptAt = now
    }

    if (record.attempts >= this.config.maxAttempts) {
      record.lockedUntil = now + this.config.lockoutDurationMs
      this.store.set(key, record)
      return {
        isLocked: true,
        remainingSeconds: Math.ceil(this.config.lockoutDurationMs / 1000),
        attempts: record.attempts,
        remainingAttempts: 0,
      }
    }

    this.store.set(key, record)
    return {
      isLocked: false,
      remainingSeconds: 0,
      attempts: record.attempts,
      remainingAttempts: this.config.maxAttempts - record.attempts,
    }
  }

  /**
   * Resets failed login attempts after a successful login.
   */
  recordSuccess(email: string): void {
    const key = this.normalizeKey(email)
    this.store.delete(key)
  }

  /**
   * Clear all records (useful for testing or cache eviction).
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Size of currently tracked accounts.
   */
  get size(): number {
    return this.store.size
  }
}

export const accountLockoutService = new AccountLockoutService()
