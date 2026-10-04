import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { AccountLockoutService } from '../../../modules/auth/infrastructure/account-lockout.service.js'

describe('AccountLockoutService (GA-03)', () => {
  let lockoutService: AccountLockoutService

  beforeEach(() => {
    lockoutService = new AccountLockoutService({
      maxAttempts: 3,
      lockoutDurationMs: 1000, // 1 second for fast testing
      attemptWindowMs: 2000,
    })
  })

  it('should initially report not locked with full remaining attempts', () => {
    const status = lockoutService.checkLockout('test@example.com')
    assert.equal(status.isLocked, false)
    assert.equal(status.attempts, 0)
    assert.equal(status.remainingAttempts, 3)
    assert.equal(status.remainingSeconds, 0)
  })

  it('should decrement remaining attempts on failed login attempts', () => {
    const r1 = lockoutService.recordFailure('test@example.com')
    assert.equal(r1.isLocked, false)
    assert.equal(r1.attempts, 1)
    assert.equal(r1.remainingAttempts, 2)

    const r2 = lockoutService.recordFailure('test@example.com')
    assert.equal(r2.isLocked, false)
    assert.equal(r2.attempts, 2)
    assert.equal(r2.remainingAttempts, 1)
  })

  it('should lock account when max attempts reached', () => {
    lockoutService.recordFailure('user@domain.com')
    lockoutService.recordFailure('user@domain.com')
    const r3 = lockoutService.recordFailure('user@domain.com')

    assert.equal(r3.isLocked, true)
    assert.equal(r3.attempts, 3)
    assert.equal(r3.remainingAttempts, 0)
    assert.ok(r3.remainingSeconds > 0)

    const checked = lockoutService.checkLockout('user@domain.com')
    assert.equal(checked.isLocked, true)
    assert.ok(checked.remainingSeconds > 0)
  })

  it('should normalize email casing and whitespace', () => {
    lockoutService.recordFailure('  User@Domain.COM  ')
    const status = lockoutService.checkLockout('user@domain.com')
    assert.equal(status.attempts, 1)
  })

  it('should reset failed attempts on successful login', () => {
    lockoutService.recordFailure('user@domain.com')
    lockoutService.recordFailure('user@domain.com')

    lockoutService.recordSuccess('user@domain.com')

    const status = lockoutService.checkLockout('user@domain.com')
    assert.equal(status.isLocked, false)
    assert.equal(status.attempts, 0)
    assert.equal(status.remainingAttempts, 3)
  })

  it('should automatically unlock after lockoutDurationMs expires', async () => {
    lockoutService.recordFailure('user@domain.com')
    lockoutService.recordFailure('user@domain.com')
    lockoutService.recordFailure('user@domain.com')

    assert.equal(lockoutService.checkLockout('user@domain.com').isLocked, true)

    // Wait 1.1s for lockout to expire
    await new Promise((resolve) => setTimeout(resolve, 1100))

    const status = lockoutService.checkLockout('user@domain.com')
    assert.equal(status.isLocked, false)
    assert.equal(status.attempts, 0)
    assert.equal(status.remainingAttempts, 3)
  })
})
