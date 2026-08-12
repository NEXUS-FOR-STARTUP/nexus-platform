# Red Team Review — User Wallet VND Plan

**Plan:** `plans/260811-1100-user-wallet-vnd/`  
**Date:** 2026-08-11  
**Reviewers:** DB Architect, Security Auditor, Failure Mode Hunter

---

## Finding 1 (CRITICAL) — Prisma nested transaction + WalletService

**File:** `phase-05-workflow-integration.md`, `phase-02-wallet-service.md`

WalletService uses `prisma.$transaction()` internally. CaseTransitionService also uses `prisma.$transaction()` (workflow plan F2: L2-L4 trong 1 tx). Prisma does NOT support nested transactions with `$transaction()` — the inner tx is silently promoted to top-level, breaking atomicity.

**Fix:** WalletService methods accept optional `tx: Prisma.TransactionClient` parameter. CaseTransitionService passes its tx into walletService.withdraw(tx, ...). Inner calls use the same tx.

**Impact:** Without fix → withdraw success but case transition fail → money deducted but case not transitioned → user loses money.

---

## Finding 2 (CRITICAL) — Migration: `balance * 39,000` assumes credit price never changed

**File:** `phase-07-legacy-migration.md`

`CREDIT_PRICE_VND = 39000` is the ratio for converting old credits to VND. But what if the system had different prices historically? What if a user paid 50,000 for a "premium credit" and another paid 39,000 for a "standard credit"?

**Fix:** Don't use a flat ratio. Sum the actual `payment.amount` for each case's credit_ledgers entries. Migration = `SUM(credit purchase amount paid)` not `SUM(balance * 39000)`.

Alternatively: if system only ever had 39,000 price → document this assumption explicitly in migration script header.

**Impact:** Users who paid different amounts lose/gain money in migration.

---

## Finding 3 (HIGH) — Lazy-create wallet on first use is race condition

**File:** `phase-02-wallet-service.md:25-27`

`getOrCreateWallet` does findUnique → if null → create. Between find and create, another request could create the wallet, causing unique constraint violation on `userId`.

**Fix:** Either:
- Option A: Use `prisma.userWallet.upsert()` (single atomic op)
- Option B: Create wallet during user registration (auth hook)
- Option C: Catch P2002 unique constraint and retry find

Recommend **Option B** — create wallet row in auth hook after user signs up. Avoids race entirely.

**Impact:** Two concurrent first-uses of wallet → one fails with DB error.

---

## Finding 4 (HIGH) — SePay webhook: topup amount mismatch not validated

**File:** `phase-03-topup-flow.md`

SePay webhook finds pending topup with matching `transferContent`, but does NOT verify the amount matches. User creates topup for 100,000 but bank transfers 50,000 → system deposits 50,000 on a 100,000 topup.

**Fix:** Compare `sepayAmount` from webhook with `topup.amount`. If mismatch → log warning, don't auto-verify, flag for manual review.

```typescript
if (sepayAmount !== topup.amount) {
  console.warn(`Amount mismatch: expected ${topup.amount}, got ${sepayAmount}`);
  // Don't auto-verify — flag for admin review
  await prisma.walletTopup.update({
    where: { id: topup.id },
    data: { metadata: { ...topup.metadata, sepayAmount, mismatch: true } }
  });
  return;
}
```

**Impact:** User underpays but gets full credit. Overpays but only gets topup amount.

---

## Finding 5 (HIGH) — idempotency key: `withdraw-{caseId}-{randomUUID()}` non-deterministic

**File:** `phase-02-wallet-service.md:89`

If `withdraw()` is called without explicit `idempotencyKey`, it generates `withdraw-${caseId}-${randomUUID()}`. This means replay protection doesn't work — every retry creates a unique key and deducts again.

**Fix:** Require `idempotencyKey` parameter (non-optional). Caller (CaseTransitionService) generates deterministic key based on caseId + transition name:

```typescript
const idempotencyKey = `case-${caseId}-${transitionName}`;
```

**Impact:** Retry after timeout → double withdraw → user charged twice for same case.

---

## Finding 6 (HIGH) — No user_wallet row created for existing users on migration

**File:** `phase-01-schema-migration.md`, `phase-07-legacy-migration.md`

Wallet table is new — existing users have no rows. The deposit in migration script silently creates wallet via `getWalletForUpdate` finding null. But `getWalletForUpdate` uses `FOR UPDATE` which cannot lock a non-existent row → returns null.

**Fix:** In phase-01, run a seed script after migration to create `user_wallets` rows for all existing users:

```sql
INSERT INTO user_wallets (user_id, balance)
SELECT id, 0 FROM users
WHERE id NOT IN (SELECT user_id FROM user_wallets);
```

**Impact:** Migration deposit fails for users without pre-existing wallet row.

---

## Finding 7 (MEDIUM) — Feature flag `isWalletCase(createdAt >= date)` fragile

**File:** `phase-05-workflow-integration.md`

Using date comparison as feature flag is fragile:
- Clock skew between servers
- Cases created during deploy window
- Can't backfill old cases to use wallet

**Fix:** Add `use_wallet BOOLEAN DEFAULT false` column to Case table. Set true on new cases post-migration. Migration script sets true for migrated cases.

**Impact:** Cases created at exactly the wrong moment could use wrong credit source.

---

## Finding 8 (MEDIUM) — Balance cached column can drift from ledger sum

**File:** `phase-02-wallet-service.md`

`user_wallets.balance` is a cached column updated atomically with transactions. But if a manual DB fix ever touches wallet_transactions without updating balance, or if a bug skips the update, the cache drifts silently.

**Fix:** Add reconciliation query as a health check endpoint or cron:

```sql
-- Periodic reconciliation check
SELECT w.user_id, w.balance AS cached, SUM(t.amount) AS computed
FROM user_wallets w
JOIN wallet_transactions t ON t.wallet_id = w.id
GROUP BY w.user_id, w.balance
HAVING w.balance != SUM(t.amount);
```

**Impact:** Users see wrong balance. Deposits/withdrawals based on wrong cached value.

---

## Finding 9 (MEDIUM) — WalletTopup: no expiry, no cleanup of stale pending topups

**File:** `phase-03-topup-flow.md`

User creates topup, never transfers money → `wallet_topup` stays `pending` forever. Later, someone else transfers with same `transfer_content` (unlikely but possible with 6-char code) → matches stale topup → deposits to wrong user.

**Fix:** 
- Add `expiresAt` to `wallet_topups` (e.g., created_at + 24h)
- SePay webhook filter: `status = 'pending' AND created_at > NOW() - INTERVAL '24 hours'`
- Cron job to mark expired topups as `failed`

**Impact:** After long time, transfer_content collision could credit wrong user.

---

## Finding 10 (MEDIUM) — No notification after topup completes

**File:** `phase-03-topup-flow.md`

User transfers money, webhook auto-verifies, wallet balance updates silently. User has no idea their money arrived unless they refresh the page or the poll interval fires.

**Fix:** After deposit in sepay-webhook, emit notification event (event bus). FE listens via realtime (Centrifugo) or shows toast on next poll diff.

**Impact:** User refreshes page wondering "where's my money?" → support tickets.

---

## Finding 11 (LOW) — Service catalog migration: `service_packages` has `price_amount` + new `service_pricing` = dual source of truth

**File:** `phase-01-schema-migration.md`

After phase-01, `service_packages.price_amount` still exists alongside `service_pricing.price`. Which one is authoritative? If admin updates via old AdminPackagesSettings.tsx → `price_amount` changes but `service_pricing` doesn't.

**Fix:** Migration step: after creating `service_pricing` rows, set `service_packages.price_amount = NULL` (deprecate). All reads go through `service_pricing`. Update AdminPackagesSettings.tsx in phase-04 or 06 to use new API.

**Impact:** Stale/wrong prices served if old column still read.

---

## Finding 12 (LOW) — FE wallet page: no empty state for new users

**File:** `phase-06-frontend-ui.md`

Balance = 0, no transactions → user sees blank list. No CTA to "nạp tiền ngay".

**Fix:** Add empty state component: "Bạn chưa có giao dịch nào. Nạp tiền để bắt đầu sử dụng dịch vụ." with prominent "Nạp tiền" button.

**Impact:** Minor confusion for first-time users.

---

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| HIGH | 4 |
| MEDIUM | 4 |
| LOW | 2 |
| **Total** | **12** |

### Must-fix before implementation (CRITICAL)
- F1: Pass `tx` parameter to WalletService for nested transaction
- F2: Sum actual payment amounts instead of flat `balance * 39000` for migration

### Should-fix before implementation (HIGH)  
- F3: Create wallet row at user registration (not lazy-create)
- F4: Validate amount match in SePay webhook
- F5: Require non-optional `idempotencyKey` for withdraw
- F6: Backfill user_wallets for existing users in phase-01

### Can-fix during implementation (MEDIUM)
- F7: Add `use_wallet` boolean column to Case
- F8: Add reconciliation health check
- F9: Add expiry to wallet_topups
- F10: Add notification after topup complete

### Nice-to-have (LOW)
- F11: Deprecate `service_packages.price_amount` after catalog migration
- F12: Add empty state CTA in FE wallet page
