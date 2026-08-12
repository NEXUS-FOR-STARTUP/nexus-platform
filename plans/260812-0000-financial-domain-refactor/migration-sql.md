# Financial Domain Migration SQL

> DOCUMENTATION ONLY — do NOT execute these SQL through an agent.
> These scripts are for human operators during production deployment.

## T08.0 — Pre-Phase-04: Migrate pending Payment/WalletTopup → deposits
Run BEFORE deploying Phase 04 (sepay webhook merge).

```sql
-- Payment → deposits
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

-- WalletTopup → deposits
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

## T08.4: Migration — paid Payment → orders + credit ledger
Run AFTER Phase 07 deploy confirmed stable.

```sql
-- Step 1: Create orders for paid payments
INSERT INTO orders (
  id, user_id, total_amount, currency, status, idempotency_key,
  wallet_transaction_id, metadata_json, created_at, updated_at
)
SELECT
  gen_random_uuid() as id,
  COALESCE(p.payer_auth_user_id, c.owner_auth_user_id) as user_id,
  p.amount,
  COALESCE(p.currency, 'VND'),
  'paid',
  'mig-order-' || p.id as idempotency_key,
  p.id as wallet_transaction_id,
  jsonb_build_object(
    'migrated_from', 'payment',
    'payment_id', p.id,
    'case_id', p.case_id,
    'package_id', p.package_id
  ),
  COALESCE(p.verified_at, p.created_at),
  NOW()
FROM payments p
JOIN cases c ON c.id = p.case_id
WHERE p.status = 'paid'
  AND p.type IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM orders o WHERE o.idempotency_key = 'mig-order-' || p.id
  );

-- Step 2: Create order items from paid payments
INSERT INTO order_items (
  id, order_id, service_type, quantity, unit_price, amount,
  metadata_json, created_at
)
SELECT
  gen_random_uuid() as id,
  o.id as order_id,
  'credit_audit',
  1 as quantity,
  p.amount as unit_price,
  p.amount,
  jsonb_build_object(
    'migrated_from', 'payment',
    'payment_id', p.id,
    'case_id', p.case_id
  ),
  NOW()
FROM payments p
JOIN orders o ON o.idempotency_key = 'mig-order-' || p.id
WHERE p.status = 'paid'
  AND p.type IS NULL;

-- Step 3: Credit ledger entries for migrated payments
INSERT INTO credit_ledgers (
  id, case_id, amount, balance_after, type,
  reference_type, reference_id, idempotency_key,
  metadata_json, created_at
)
SELECT
  gen_random_uuid() as id,
  p.case_id,
  1 as amount,
  COALESCE(
    (SELECT cl2.balance_after FROM credit_ledgers cl2
     WHERE cl2.case_id = p.case_id
     ORDER BY cl2.created_at DESC LIMIT 1),
    0
  ) + 1 as balance_after,
  'purchase',
  'order',
  o.id,
  'mig-credit-' || p.id as idempotency_key,
  jsonb_build_object(
    'migrated_from', 'payment',
    'payment_id', p.id,
    'order_id', o.id
  ),
  NOW()
FROM payments p
JOIN orders o ON o.idempotency_key = 'mig-order-' || p.id
WHERE p.status = 'paid'
  AND p.type IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM credit_ledgers cl WHERE cl.idempotency_key = 'mig-credit-' || p.id
  );
```

## T08.5: Migration — completed WalletTopup → deposits
Run AFTER Phase 07 deploy confirmed stable.

```sql
INSERT INTO deposits (
  id, user_id, amount, currency, transfer_content, idempotency_key,
  status, verified_by, verification_source, metadata_json, created_at, updated_at
)
SELECT
  gen_random_uuid() as id,
  wt.user_id,
  wt.amount,
  COALESCE(wt.currency, 'VND'),
  wt.transfer_content,
  'mig-topup-completed-' || wt.id as idempotency_key,
  'verified',
  wt.verified_by,
  'manual',
  jsonb_build_object('migrated_from', 'wallet_topup', 'topup_id', wt.id),
  wt.created_at,
  NOW()
FROM wallet_topups wt
WHERE wt.status = 'completed'
  AND wt.transfer_content IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM deposits d WHERE d.idempotency_key = 'mig-topup-completed-' || wt.id
  );
```

## T08.6: Migration — rejected WalletTopup → deposits

```sql
INSERT INTO deposits (
  id, user_id, amount, currency, transfer_content, idempotency_key,
  status, rejection_reason, metadata_json, created_at, updated_at
)
SELECT
  gen_random_uuid() as id,
  wt.user_id,
  wt.amount,
  COALESCE(wt.currency, 'VND'),
  COALESCE(wt.transfer_content, 'mig-topup-rejected-' || wt.id),
  'mig-topup-rejected-' || wt.id as idempotency_key,
  'rejected',
  'Migrated from legacy wallet_topups (rejected)',
  jsonb_build_object('migrated_from', 'wallet_topup', 'topup_id', wt.id),
  wt.created_at,
  NOW()
FROM wallet_topups wt
WHERE wt.status = 'rejected'
  AND NOT EXISTS (
    SELECT 1 FROM deposits d WHERE d.idempotency_key = 'mig-topup-rejected-' || wt.id
  );
```

## T08.7: Verification queries
Run after each migration step to verify counts.

```sql
-- Verify deposit counts match source
SELECT 'Payment→deposit (pending)' as step,
  (SELECT COUNT(*) FROM payments p JOIN cases c ON c.id = p.case_id
   WHERE p.status NOT IN ('paid', 'rejected') AND p.type IS NULL) as expected,
  (SELECT COUNT(*) FROM deposits WHERE idempotency_key LIKE 'mig-payment-%') as actual;

-- Verify order counts match paid payments
SELECT 'Paid payment→orders' as step,
  (SELECT COUNT(*) FROM payments WHERE status = 'paid' AND type IS NULL) as expected,
  (SELECT COUNT(*) FROM orders WHERE idempotency_key LIKE 'mig-order-%') as actual;

-- Verify credit ledger entries
SELECT 'Credit ledger entries' as step,
  (SELECT COUNT(*) FROM payments WHERE status = 'paid' AND type IS NULL) as expected,
  (SELECT COUNT(*) FROM credit_ledgers WHERE idempotency_key LIKE 'mig-credit-%') as actual;

-- Verify wallet topups → deposits
SELECT 'WalletTopup→deposits (verified)' as step,
  (SELECT COUNT(*) FROM wallet_topups WHERE status = 'completed' AND transfer_content IS NOT NULL) as expected,
  (SELECT COUNT(*) FROM deposits WHERE idempotency_key LIKE 'mig-topup-completed-%') as actual;

SELECT 'WalletTopup→deposits (rejected)' as step,
  (SELECT COUNT(*) FROM wallet_topups WHERE status = 'rejected') as expected,
  (SELECT COUNT(*) FROM deposits WHERE idempotency_key LIKE 'mig-topup-rejected-%') as actual;

-- Overall deposit count
SELECT 'Total deposits' as step, COUNT(*) as count FROM deposits;
SELECT 'By status' as step, status, COUNT(*) as count FROM deposits GROUP BY status;
```
