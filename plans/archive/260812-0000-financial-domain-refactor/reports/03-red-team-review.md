# Red Team Review — Financial Domain Refactor

**Date:** 2026-08-12
**Reviewer:** code-reviewer subagent (adversarial)
**Scope:** All 10 plan files

---

## CRITICAL (6)

### C1. Race: verifyDeposit wallet credit + status update in separate transactions
**Phase:** 02 | **File:** verify-deposit.usecase.ts (T02.5)
- `walletService.deposit()` and `updateDepositStatus()` run in separate transactions
- If crash between them: money credited, deposit stays "pending" forever
- Admin re-verifies → double-credit
**Fix:** Single `prisma.$transaction` wrapping both operations + outbox insert

### C2. Race: Sepay webhook same split-transaction bug
**Phase:** 04 | **File:** sepay-webhook.usecase.ts (T04.1)
- `walletService.deposit()` (line 56) and `prisma.deposit.update()` (line 58) in separate transactions
- dedupSet.delete(txnId) in catch + throw → webhook retries → double deposit
**Fix:** Single transaction + DB-level idempotency via idempotency_key UNIQUE

### C3. deposits table missing idempotency_key UNIQUE
**Phase:** 01 | **File:** schema T01.1
- No `idempotency_key` column, only `transfer_content @unique`
- Nothing prevents duplicate verification (race between admin + webhook)
**Fix:** Add `idempotency_key String @unique` to Deposit model

### C4. orders table missing idempotency_key
**Phase:** 01 | **File:** schema T01.2
- Same as C3 — no DB-level guard against duplicate orders
**Fix:** Add `idempotency_key String @unique` to Order model

### C5. walletService.withdraw called BEFORE order.id exists
**Phase:** 03 | **File:** create-order.usecase.ts (T03.4)
- `withdraw()` at line 199 passes idempotencyKey as caseId param
- Order created at line 206 — wallet_tx can't reference order.id
**Fix:** Create order FIRST (pending), then withdraw with order.id, then mark paid

### C6. Migration: empty transfer_content UNIQUE violation
**Phase:** 08 | **File:** T08.5 SQL
- `COALESCE(p.transfer_content, '')` → second empty row violates @unique
**Fix:** `COALESCE(NULLIF(p.transfer_content, ''), 'MIGRATED-' || gen_random_uuid())`

## HIGH (8)

### H1. Amount mismatch → no audit trail
**Phase:** 04 | **File:** sepay-webhook (T04.1)
- Mismatch returns "no_match" silently — real money arrived, no record
**Fix:** Create mismatch record or mark deposit status="amount_mismatch"

### H2. DEPOSIT_VERIFIED event never emitted
**Phase:** 06 | **File:** T06.5
- Removing emitEvent for DEPOSIT_VERIFIED but walletService only emits WALLET_BALANCE_CHANGED
- User never gets "Nạp tiền thành công" notification
**Fix:** Keep outbox insert for DEPOSIT_VERIFIED/REJECTED in verify-deposit

### H3. No index on deposits.status
**Phase:** 01 | **File:** schema T01.1
- Admin page queries by status — full table scan
**Fix:** `@@index([status, created_at])`

### H4. Double credit risk from old webhook + new order path
**Phase:** 04 | **File:** sepay-webhook fallback (T04.1)
- Old `verifyPayment` creates credit_ledger directly
- New order path also creates credit_ledger
**Fix:** Guard: check credit_ledger exists with reference_type='order' before old path

### H5. No outbox event for refund flow
**Phase:** 06 | **File:** wallet.service.ts refund method
- Refund credits wallet but no event → no notification
**Fix:** Add outbox insert in refund method

### H6. withdraw type mismatch
**Phase:** 03 | **File:** T03.4 vs wallet.service.ts
- Old signature hardcodes sourceType='credit_purchase', sourceId=caseId
- New call passes idempotencyKey as caseId → wrong reference
**Fix:** Complete T03.9 withdraw refactor BEFORE T03.4 uses it

### H7. No backfill for reference_type on old credit_ledgers
**Phase:** 08 | **File:** migration
- Old entries have reference_type=NULL → FE breaks
**Fix:** `UPDATE credit_ledgers SET reference_type='payment' WHERE reference_id IS NOT NULL AND reference_type IS NULL`

### H8. UnpaidAlertBanner removal kills visibility
**Phase:** 07 | **File:** T07.4
- Old cases with pending payments invisible to users during transition
**Fix:** Gate on `case.payment_status !== 'paid' && (!orders || orders.length === 0)` until Phase 08

## MEDIUM (7)

- M1: No CHECK constraint on deposits.amount > 0
- M2: amount_received column missing despite plan acknowledging it
- M3: In-memory dedup not multi-instance safe (horizontal scaling)
- M4: Migration scripts not transaction-wrapped
- M5: Admin role check only — no financial permission granularity
- M6: CREDIT_PRICE removed without API price fetch
- M7: service_type String — no validation enum, typos propagate

## LOW (4)

- L1: crypto import style inconsistency
- L2: tx as any type escapes (3 new occurrences)
- L3: No test for "webhook arrives before deposit created" race
- L4: DUAL_WRITE flag controls write but not read path in webhook

## Positive Observations

1. Expand-contract for column rename — correct
2. SELECT FOR UPDATE on wallet mutations — already in place
3. Additive migration only — no destructive operations
4. Feature flags for gradual cutover
5. Phase 09 verification gates — thorough
6. Idempotency at wallet_tx layer already protected by @unique
7. Outbox retry with exponential backoff — well-designed

## Recommendation

**BLOCK SHIP** until C1-C6 resolved. These are data-loss and money-integrity bugs.
