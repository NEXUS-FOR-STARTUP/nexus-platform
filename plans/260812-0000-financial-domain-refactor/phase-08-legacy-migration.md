# Phase 08: Legacy Dual-Write + Data Migration

**Status:** pending | **Effort:** 2.5h | **Depends:** Phase 01-07 | **Blocked by:** —

## Overview

Ensure every financial operation during transition period writes to BOTH old and new tables (dual-write). Then migrate historical data from old tables to new tables. After verification, Phase 09 will cut over.

**NEW (Solution B):** Migration pending Payment/WalletTopup → deposits **BEFORE Phase 04 deploy** — chuyển hết pending sang deposit để webhook chỉ còn 1 path. Xem T08.0 bên dưới.

## Pre-Phase-04 Migration (Solution B)

### T08.0: Migrate pending Payment/WalletTopup → deposits

**Điều kiện tiên quyết cho Phase 04 (xoá branch 4b khỏi webhook).** Chạy trước khi deploy Phase 04.

**SQL migration script:**

```sql
-- Chuyển pending Payment → deposits
-- Payment có: id, payer_auth_user_id (nullable), amount, transfer_content (nullable unique),
--              bank_transaction_id, bank_credited_at, status, verified_by_auth_user_id,
--              verification_source, proof_file_url, rejection_reason, currency, created_at, updated_at
INSERT INTO deposits (
  id, user_id, amount, currency, transfer_content, idempotency_key,
  status, proof_file_url, rejection_reason,
  bank_transaction_id, bank_credited_at,
  verified_by, verification_source, created_at, updated_at
)
SELECT
  gen_random_uuid() as id,
  COALESCE(p.payer_auth_user_id, c.owner_auth_user_id) as user_id,
  p.amount,
  COALESCE(p.currency, 'VND'),
  COALESCE(p.transfer_content, 'mig-payment-' || p.id),
  'mig-payment-' || p.id as idempotency_key,
  'pending',
  p.proof_file_url,
  p.rejection_reason,
  p.bank_transaction_id,
  p.bank_credited_at,
  p.verified_by_auth_user_id,
  COALESCE(p.verification_source, 'manual'),
  p.created_at,
  NOW()
FROM payments p
JOIN cases c ON c.id = p.case_id
WHERE p.status NOT IN ('paid', 'rejected')
  AND p.type IS NULL;

-- Chuyển pending WalletTopup → deposits
-- WalletTopup có: id, user_id, amount, transfer_content, status, verified_by, verification_source, created_at, updated_at
INSERT INTO deposits (
  id, user_id, amount, currency, transfer_content, idempotency_key,
  status, verification_source, created_at, updated_at
)
SELECT
  gen_random_uuid() as id,
  wt.user_id,
  wt.amount,
  COALESCE(wt.currency, 'VND'),
  wt.transfer_content,
  'mig-topup-' || wt.id as idempotency_key,
  'pending',
  COALESCE(wt.verification_source, 'manual'),
  wt.created_at,
  NOW()
FROM wallet_topups wt
WHERE wt.status = 'pending'
  AND wt.transfer_content IS NOT NULL;
```

**Rollback:** `DELETE FROM deposits WHERE created_at > '<migration_timestamp>'` — các Payment/WalletTopup gốc vẫn còn.

**Lưu ý:** Payment không có cột `user_id` — lấy từ `payer_auth_user_id` hoặc fallback `cases.owner_auth_user_id`. Deposit không có `bank_name`/`bank_account_number`/`bank_account_name` — các cột này không tồn tại trong schema. Webhook matching chỉ dùng `transfer_content`.

## Dual-Write Checklist

### T08.1: Deposit creation — dual-write to WalletTopup

**File:** `apps/api/src/modules/deposits/application/create-deposit.usecase.ts`

Add dual-write after creating deposit:
```typescript
// Dual-write to old WalletTopup for backward compat
await prisma.walletTopup.create({
  data: {
    user_id: userId,
    amount,
    transfer_content: transferContent,
    status: "pending",
    currency: "VND",
  },
});
```

Optionally wrapped in feature flag:
```typescript
if (process.env["DUAL_WRITE_WALLET_TOPUP"] === "true") {
  await prisma.walletTopup.create({ ... });
}
```

### T08.2: Deposit verification — dual-write to WalletTopup

**File:** `apps/api/src/modules/deposits/application/verify-deposit.usecase.ts`

After verifying deposit, also update corresponding WalletTopup (by `transfer_content`):
```typescript
if (process.env["DUAL_WRITE_WALLET_TOPUP"] === "true") {
  await prisma.walletTopup.updateMany({
    where: { transfer_content: deposit.transfer_content, status: "pending" },
    data: { status: "completed", verified_by: "auto", verification_source: "auto" },
  });
}
```

### T08.3: Order creation — dual-write to Payment

**File:** `apps/api/src/modules/orders/application/create-order.usecase.ts`

If order items include `credit_audit` with `case_id`, create a Payment record too (for backward compat during transition):
```typescript
if (process.env["DUAL_WRITE_PAYMENT"] === "true") {
  const creditItem = request.items.find(i => i.service_type === "credit_audit");
  if (creditItem?.metadata_json?.["case_id"]) {
    await tx.payment.create({
      data: {
        case_id: creditItem.metadata_json["case_id"] as string,
        amount: totalAmount,
        status: "paid",
        verified_by_auth_user_id: "system",
        verification_source: "auto",
        verified_at: new Date(),
        type: "deposit",
        transfer_content: idempotencyKey,
        currency: "VND",
      },
    });
  }
}
```

## Data Migration

### T08.4: Migration script — WalletTopup → deposits

**Before running:** Take production backup. Test on clone first.

```sql
-- Step 1: Insert WalletTopup rows into deposits
-- WalletTopup has: id, user_id, amount, currency, transfer_content, status, verified_by, verification_source, metadata_json, created_at, updated_at
-- Deposit has: id, user_id, amount, currency, transfer_content, status, proof_file_url, rejection_reason, bank_transaction_id, bank_credited_at, verified_by, verification_source, metadata_json, created_at, updated_at

INSERT INTO deposits (
  id, user_id, amount, currency, transfer_content, status,
  proof_file_url, rejection_reason, bank_transaction_id, bank_credited_at,
  verified_by, verification_source, metadata_json, created_at, updated_at
)
SELECT
  gen_random_uuid() as id,
  wt.user_id,
  wt.amount,
  wt.currency,
  wt.transfer_content,
  CASE wt.status
    WHEN 'pending' THEN 'pending'
    WHEN 'completed' THEN 'verified'
    WHEN 'cancelled' THEN 'rejected'
    ELSE wt.status
  END,
  NULL as proof_file_url,
  CASE WHEN wt.status = 'cancelled' THEN 'Đã hủy' ELSE NULL END as rejection_reason,
  (wt.metadata_json->>'txId')::text as bank_transaction_id,
  NULL as bank_credited_at,
  wt.verified_by,
  CASE WHEN wt.verified_by IS NOT NULL THEN
    CASE WHEN wt.verification_source = 'auto' THEN 'auto'::"VerificationSource"
    ELSE 'manual'::"VerificationSource" END
  ELSE NULL END,
  wt.metadata_json,
  wt.created_at,
  wt.updated_at
FROM wallet_topups wt
WHERE NOT EXISTS (
  SELECT 1 FROM deposits d WHERE d.transfer_content = wt.transfer_content
);
```

**Safety check before running:**
```sql
SELECT COUNT(*) FROM wallet_topups;
SELECT COUNT(*) FROM deposits;
-- After migration, deposits count should = wallet_topups count
```

### T08.5: Migration script — Payment (case-less) → deposits

Payments that are case-bound purchases should NOT be migrated to deposits (they go to orders). Only Payment rows that look like deposits (no package_id, or type="deposit"):

```sql
-- Step 2: Insert Payment rows that are actually deposits into deposits
-- (Payments without valid case binding, or explicitly marked as type=deposit)
INSERT INTO deposits (
  id, user_id, amount, currency, transfer_content, status,
  proof_file_url, rejection_reason, bank_transaction_id, bank_credited_at,
  verified_by, verification_source, metadata_json, created_at, updated_at
)
SELECT
  gen_random_uuid() as id,
  p.payer_auth_user_id as user_id,
  p.amount,
  COALESCE(p.currency, 'VND'),
  COALESCE(NULLIF(p.transfer_content, ''), 'MIGRATED-' || gen_random_uuid()::text), -- C6 fix: avoid UNIQUE violation on empty strings
  CASE p.status
    WHEN 'pending_verification' THEN 'pending'
    WHEN 'paid' THEN 'verified'
    WHEN 'rejected' THEN 'rejected'
    ELSE 'pending'
  END,
  p.proof_file_url,
  p.rejection_reason,
  p.bank_transaction_id,
  p.bank_credited_at,
  p.verified_by_auth_user_id,
  CASE WHEN p.verification_source = 'auto' THEN 'auto'::"VerificationSource"
       ELSE 'manual'::"VerificationSource" END,
  p.metadata_json,
  p.created_at,
  p.updated_at
FROM payments p
WHERE p.type = 'deposit'
  AND NOT EXISTS (SELECT 1 FROM deposits d WHERE d.transfer_content = p.transfer_content);
```

### T08.6: Migration script — Payment (case-bound purchase) → orders

For credit purchases that went through old Payment path:
```sql
-- Step 3: Insert Payment rows (case-bound, paid) into orders
INSERT INTO orders (
  id, user_id, total_amount, currency, idempotency_key, status, metadata_json, created_at, updated_at
)
SELECT
  gen_random_uuid() as id,
  COALESCE(p.payer_auth_user_id, c.owner_auth_user_id) as user_id,
  p.amount,
  COALESCE(p.currency, 'VND'),
  'mig-order-' || p.id as idempotency_key,
  CASE p.status
    WHEN 'paid' THEN 'paid'
    ELSE 'cancelled'
  END,
  jsonb_build_object('old_payment_id', p.id, 'old_case_id', p.case_id) as metadata_json,
  p.created_at,
  p.updated_at
FROM payments p
JOIN cases c ON c.id = p.case_id
WHERE p.type IS NULL OR p.type = 'purchase'
  AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.metadata_json->>'old_payment_id' = p.id);

-- Create order_items for credit purchases
-- Derive quantity from metadata_json.quantity or amount/39000
-- (handled in app-level migration script, not pure SQL)
```

**Note:** Step 3 is complex due to quantity derivation from `metadata_json.quantity` vs `amount / 39000`. Recommend app-level migration script in Node.js rather than raw SQL.

### T08.7: Verification queries

After migration, run these queries to verify data consistency:

```sql
-- 1. Row count check
SELECT 'wallet_topups' as source, COUNT(*) as count FROM wallet_topups
UNION ALL
SELECT 'deposits' as source, COUNT(*) FROM deposits
UNION ALL
SELECT 'payments (deposit type)' as source, COUNT(*) FROM payments WHERE type = 'deposit'
UNION ALL
SELECT 'payments (purchase)' as source, COUNT(*) FROM payments WHERE type IS NULL OR type = 'purchase'
UNION ALL
SELECT 'orders' as source, COUNT(*) FROM orders;

-- 2. Balance consistency: wallet_transactions SUM = user_wallets balance
SELECT
  w.user_id,
  w.balance as wallet_balance,
  COALESCE(SUM(wt.amount), 0) as ledger_sum,
  w.balance - COALESCE(SUM(wt.amount), 0) as drift
FROM user_wallets w
LEFT JOIN wallet_transactions wt ON wt.wallet_id = w.id
GROUP BY w.user_id, w.balance
HAVING w.balance - COALESCE(SUM(wt.amount), 0) != 0;
-- Expected: 0 rows (no drift)

-- 3. Duplicate transfer_content check
SELECT transfer_content, COUNT(*) FROM deposits GROUP BY transfer_content HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- 4. Null user_id check
SELECT COUNT(*) FROM deposits WHERE user_id IS NULL;
-- Expected: 0

-- 5. H7: Backfill reference_type on old credit_ledgers
UPDATE credit_ledgers
SET reference_type = 'payment'
WHERE reference_id IS NOT NULL
  AND reference_type IS NULL;

SELECT reference_type, COUNT(*) FROM credit_ledgers GROUP BY reference_type;
-- Expected: 'payment' (old), 'order' (new), 'audit_round' (consumption), 'veto' (refund)
```

## Testing

- Integration: Create deposit → check WalletTopup table has matching row (dual-write)
- Integration: Create order → check Payment table has matching row (dual-write)
- Data migration: Run on cloned DB → verify row counts match → verify no duplicate transfer_content → verify wallet balance consistency

## Rollback

1. Disable dual-write: set `DUAL_WRITE_WALLET_TOPUP=false`, `DUAL_WRITE_PAYMENT=false`
2. Data migration: `DELETE FROM deposits WHERE id IN (migrated_ids)` if needed (ONLY with backup)
3. Old tables (WalletTopup, Payment) untouched by migration script (INSERT only, no DELETE)

## Deliverables

- [ ] Dual-write to WalletTopup in create-deposit.usecase.ts
- [ ] Dual-write to WalletTopup in verify-deposit.usecase.ts
- [ ] Dual-write to Payment in create-order.usecase.ts
- [ ] Migration SQL: WalletTopup → deposits
- [ ] Migration SQL: Payment(type=deposit) → deposits
- [ ] Migration script: Payment(type=purchase) → orders + order_items
- [ ] Verification queries run and pass
- [ ] Balance consistency confirmed (no drift)
