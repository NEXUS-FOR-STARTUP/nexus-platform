# Phase 09: Cleanup + Deprecation

**Status:** in_progress | **Effort:** 2h | **Depends:** Phase 08 | **Blocked by:** —

## Overview

After Phase 08 data migration verified and dual-write confirmed stable:
1. Disable old Payment/WalletTopup endpoints
2. Remove dual-write code
3. Remove feature flags
4. Drop old `source_type`/`source_id` columns (future — after grace period)
5. Mark old tables as read-only (keep for audit)

## Task Breakdown

### T09.1: Deprecate old Payment routes

**File:** `apps/api/src/modules/payments/http/payments.routes.ts`

Add deprecation middleware or comment out routes:

```typescript
// OPTION A: Comment out old routes (clean break)
// paymentsRouter.get("/", listPaymentsHandler);
// paymentsRouter.post("/", createPaymentHandler);
// paymentsRouter.get("/my", listMyPaymentsHandler);
// paymentsRouter.get("/:id", getPaymentHandler);
// paymentsRouter.post("/proof", uploadPaymentProofHandler);
// paymentsRouter.post("/:id/verify", verifyPaymentHandler);

// OPTION B: Return 410 Gone on old routes
paymentsRouter.get("/", (c) => c.json({
  error: "GONE",
  message: "API này đã được thay thế bởi /api/deposits và /api/orders. Xem tài liệu mới tại docs.",
  migration_guide: "/api/docs/financial-migration"
}, 410));
paymentsRouter.get("/my", (c) => c.json({
  error: "GONE",
  message: "Xem lịch sử giao dịch tại /api/deposits và /api/orders."
}, 410));
paymentsRouter.post("/", (c) => c.json({
  error: "GONE",
  message: "Tạo đơn nạp tiền tại POST /api/deposits. Tạo đơn mua credit tại POST /api/orders."
}, 410));
// etc.
```

**Decision:** Use OPTION B (410 Gone with migration guide) — provides clear message to any clients still hitting old endpoints.

**Sepay webhook routes KEEP ACTIVE** (sepay.routes.ts — used by SePay's callback, independent of Payment module)

### T09.2: Deprecate old WalletTopup endpoint

**File:** `apps/api/src/modules/wallet/infrastructure/http/wallet.routes.ts`

```typescript
// OLD: POST /wallet/topups — deprecated
walletRouter.post("/topups", (c) => c.json({
  error: "GONE",
  message: "Tạo mã nạp tiền tại POST /api/deposits"
}, 410));
```

### T09.3: Remove dual-write code

**File:** `apps/api/src/modules/deposits/application/create-deposit.usecase.ts`

Remove WalletTopup dual-write block (added in Phase 08 T08.1).

**File:** `apps/api/src/modules/deposits/application/verify-deposit.usecase.ts`

Remove WalletTopup dual-write block (added in Phase 08 T08.2).

**File:** `apps/api/src/modules/orders/application/create-order.usecase.ts`

Remove Payment dual-write block (added in Phase 08 T08.3).

### T09.4: Remove feature flags

Remove all `process.env["DUAL_WRITE_*"]` and `process.env["USE_ORDER_DOMAIN"]` checks:

**File:** `apps/api/src/modules/payments/infrastructure/persistence/payment.repository.ts`

Remove `USE_ORDER_DOMAIN` flag check — always use new behavior (no credit_ledger creation in verifyPayment).

**File:** `apps/api/src/modules/payments/application/sepay-webhook.usecase.ts`

Remove fallback branches for old WalletTopup and old Payment lookup. Keep only deposit lookup.

### T09.5: Clean up old `source_type`/`source_id` columns

**NOT NOW** — keep old columns indefinitely for backward compat with any read queries. Drop in a future PR after all consumers confirmed migrated.

**File:** `prisma/schema.prisma`

Add comment:
```prisma
// OLD — kept for backward compat, drop after all consumers use reference_type/reference_id
source_type      String
source_id        String?
```

### T09.5b: Remove UnpaidAlertBanner

**File:** `apps/web-1/app/dashboard/case/[id]/_components/UnpaidAlertBanner.tsx`

Sau Phase 08 migration complete, tất cả old case đều có orders → gate condition `shouldShowBanner` (T07.4) luôn false. Xoá component + all references trong case detail page.

### T09.6: Mark old tables as read-only (documentation)

Add comments to schema:
```prisma
/// @deprecated Replaced by deposits table. Read-only, will be archived.
model WalletTopup { ... }

/// @deprecated Replaced by deposits (wallet top-up) and orders (purchase). 
/// Read-only, will be archived. Active rows: type='deposit' have deposits equivalent.
model Payment { ... }
```

### T09.7: Payment.type backfill

Ensure all existing Payment rows have `type` populated:
```sql
-- Backfill Payment.type for old records
UPDATE payments SET type = 'purchase' WHERE type IS NULL;
```

### T09.8: Remove deprecated use cases

**Keep files but mark as deprecated** (comments at top):

```
apps/api/src/modules/payments/application/create-payment.usecase.ts
apps/api/src/modules/payments/application/verify-payment.usecase.ts
apps/api/src/modules/payments/application/upload-payment-proof.usecase.ts
apps/api/src/modules/payments/application/list-my-payments.usecase.ts
apps/api/src/modules/payments/application/list-payments.usecase.ts
apps/api/src/modules/payments/application/get-payment.usecase.ts
apps/api/src/modules/wallet/application/wallet-topup.usecase.ts
apps/api/src/modules/wallet/application/purchase-credits.usecase.ts
```

Add to top of each:
```typescript
/**
 * @deprecated Replaced by deposits/orders modules (2026-08-12).
 * Kept for reference. Routes return 410 Gone.
 * Use:
 *   POST /api/deposits — create deposit
 *   POST /api/orders   — create order (purchase credit)
 */
```

### T09.9: Update docs

**File:** `docs/financial-domain-redesign.md`

Update status: `Design proposal` → `Implemented (2026-08)`

Add changelog entry.

**File:** `docs/project-changelog.md`

```markdown
## 2026-08-12 — Financial Domain Refactor
- Add deposits, orders, order_items tables
- Add service_payment to WalletTxType enum
- Sepay webhook unified to single deposits path
- Transactional outbox pattern for financial events
- WalletTopup, old Payment routes deprecated (410 Gone)
- Frontend: WalletTopupModal → POST /deposits, CreditQuantityModal → POST /orders
- Admin verification: unified deposit verification table
```

## Verification Gates (before proceeding to cleanup)

All must pass before executing T09.1-T09.8:
- [ ] Phase 08 data migration verified (row counts match, no balance drift)
- [ ] Production running for ≥ 24 hours with dual-write enabled
- [ ] No errors in logs related to new deposit/order endpoints
- [ ] Frontend E2E test passes (deposit → verify → balance; order → credit_ledger)
- [ ] Backward compat: old Payment/WalletTopup queries returning correct data
- [ ] All monitoring confirms new endpoints handle production traffic

## Post-Cleanup Monitoring

Monitor for 1 week after cleanup:
- [ ] 410 errors from old endpoints — identify any missed clients
- [ ] Deposit/order endpoint error rates — should be near 0
- [ ] Wallet balance consistency — periodic reconciliation query
- [ ] Outbox relay worker health — no pending events older than 5 minutes

## Rollback

If issues discovered post-cleanup:
1. Revert T09.1 (uncomment Payment routes)
2. Revert T09.2 (uncomment WalletTopup route)
3. Re-enable dual-write (T09.3 reverted, T09.4 flags back ON)
4. Frontend can switch back to old API paths (git revert T07.1-T07.9)
5. Old data in Payment/WalletTopup untouched — no data loss

## Deliverables

- [ ] Payment routes return 410 Gone (or commented out)
- [ ] WalletTopup route returns 410 Gone
- [ ] Dual-write code removed
- [ ] Feature flags removed
- [ ] Payment.type backfilled
- [ ] Deprecated use cases marked with `@deprecated` comments
- [ ] Schema comments added for deprecated tables
- [ ] `financial-domain-redesign.md` status updated
- [ ] `project-changelog.md` entry added
- [ ] All verification gates passed
- [ ] check-types passes
- [ ] ESLint web 0 warning
