# Phase 01: Schema Migration

**Status:** complete | **Effort:** 3h | **Depends:** — | **Blocked by:** —

## Overview

Add `deposits`, `orders`, `order_items`, `outbox` tables. Modify `Payment` (add `type`), `WalletTransaction` (rename `source_type`→`reference_type`), `WalletTxType` (add `service_payment`), `CreditLedger` (add `reference_type`). All changes are **additive** — no destructive operations.

## Task Breakdown

### T01.1: Add `deposits` table

**File:** `prisma/schema.prisma`

Add new model after `WalletTopup`:

```prisma
model Deposit {
  id                    String    @id @default(uuid())
  user_id               String
  amount                Int
  currency              String    @default("VND")
  transfer_content      String    @unique
  idempotency_key       String    @unique
  status                String    @default("pending")  // pending|verified|rejected|amount_mismatch
  proof_file_url        String?
  rejection_reason      String?
  bank_transaction_id   String?
  bank_credited_at      DateTime?
  verified_by           String?
  verification_source   VerificationSource @default(manual)
  metadata_json         Json?
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  user User @relation(fields: [user_id], references: [id])

  @@index([user_id, created_at])
  @@index([status, created_at])
  @@map("deposits")
}
```

Add to User model:
```prisma
deposits Deposit[]
```

**Risk:** None (additive). Must run `--create-only`.

### T01.2: Add `orders` + `order_items` tables

**File:** `prisma/schema.prisma`

Add new models after `Deposit`:

```prisma
model Order {
  id                     String    @id @default(uuid())
  user_id                String
  total_amount           Int
  currency               String    @default("VND")
  status                 String    @default("pending")  // pending|paid|refunded|cancelled
  idempotency_key        String    @unique
  wallet_transaction_id  String?
  metadata_json          Json?
  created_at             DateTime  @default(now())
  updated_at             DateTime  @updatedAt

  user  User        @relation(fields: [user_id], references: [id])
  items OrderItem[]

  @@index([user_id, created_at])
  @@map("orders")
}

model OrderItem {
  id            String   @id @default(uuid())
  order_id      String
  service_type  String   // "credit_audit" | "team_fit" | ...
  quantity      Int
  unit_price    Int
  amount        Int
  metadata_json Json?
  created_at    DateTime @default(now())

  order Order @relation(fields: [order_id], references: [id])

  @@map("order_items")
}
```

Add to User model:
```prisma
orders Order[]
```

**Risk:** None (additive). `service_type` is String — no enum constraint, future-proof.

### T01.3: Add `service_payment` to WalletTxType

**File:** `prisma/schema.prisma`

Change enum:
```prisma
// BEFORE
enum WalletTxType {
  deposit
  withdrawal
  refund
  adjustment
  migration
}

// AFTER
enum WalletTxType {
  deposit
  withdrawal
  refund
  adjustment
  migration
  service_payment
}
```

**Risk:** Low. Adding enum value is safe. Prisma handles this as `ALTER TYPE ... ADD VALUE`.
**Migration check:** `ALTER TYPE "WalletTxType" ADD VALUE 'service_payment';`

### T01.4: Rename `source_type` → `reference_type` in WalletTransaction

**File:** `prisma/schema.prisma`

```prisma
// IN WalletTransaction model:
// CHANGE:
source_type      String
source_id        String?

// TO:
reference_type   String
reference_id     String
```

**CRITICAL:** Follow expand-contract per `prisma-migration-safety.md` §5:
1. Add `reference_type` (nullable String) — NEW column
2. Add `reference_id` (nullable String) — NEW column
3. Keep `source_type` and `source_id` — DO NOT DROP
4. Manual SQL migration to copy data: `UPDATE wallet_transactions SET reference_type = source_type, reference_id = source_id WHERE reference_type IS NULL`
5. App code reads `reference_type`/`reference_id`, writes to both old + new
6. `source_type`/`source_id` stay until Phase 09

**Risk:** Medium. Must ensure dual-write during transition. No data loss if step-by-step.

### T01.5: Add `type` column to Payment (for transition)

**File:** `prisma/schema.prisma`

Add to Payment model:
```prisma
type String @default("purchase")  // "purchase" (case-bound, old) | "deposit" (new, transition)
```

This allows `Payment` to also hold deposit records during dual-write period. After migration, `type="deposit"` rows have equivalent `deposits` row.

**Risk:** None. Nullable column, default value safe.

### T01.6: Add `reference_type` to CreditLedger

**File:** `prisma/schema.prisma`

Add to CreditLedger model:
```prisma
reference_type   String?   // "order" | "payment" (old) | "audit_round"
```

Already has `reference_id` — just adds the type discriminator.

**Risk:** None. Nullable column.

### T01.7: Add `domain_event_outbox` table

**File:** `prisma/schema.prisma`

```prisma
model DomainEventOutbox {
  id             Int       @id @default(autoincrement())
  event_type     String
  payload_json   Json
  status         String    @default("pending")  // pending|processing|sent|failed
  attempts       Int       @default(0)
  processing_at  DateTime?
  next_retry_at  DateTime?
  sent_at        DateTime?
  last_error     String?
  created_at     DateTime  @default(now())
  updated_at     DateTime  @updatedAt

  @@index([status, next_retry_at])
  @@index([status, created_at])
  @@map("domain_event_outbox")
}
```

**Risk:** None. Additive. No FK constraints. Name `domain_event_outbox` avoids conflict with existing `notification_outbox` table.

### T01.8: Add bank info env vars (already exist, verify)

Verify these env vars exist in `.env`:
```
BANK_SHORT_CODE="MB"
BANK_ACCOUNT_NUMBER="0909090909"
BANK_ACCOUNT_NAME="NEXUS PLATFORM"
BANK_NAME="MB Bank (Ngân hàng Quân Đội)"
SEPAY_WEBHOOK_API_KEY="..."
```

Already used by `create-payment.usecase.ts` → `getBankInfo()`. No changes needed.

## Migration Steps

```bash
# 1. Edit schema.prisma with all changes above
# 2. Validate
npx prisma validate --schema prisma/schema.prisma

# 3. Create migration (local only)
npx prisma migrate dev --create-only --schema prisma/schema.prisma \
  --name add_financial_domain_tables

# 4. Review generated SQL in prisma/migrations/<timestamp>_add_financial_domain_tables/migration.sql
# 5. Run pre-migration safety checks (see below)
# 6. Deploy: npx prisma migrate deploy (human only)
```

## Pre-Migration Safety Checks

```sql
-- 1. Check no conflicts with new table names
SELECT table_name FROM information_schema.tables WHERE table_name IN ('deposits', 'orders', 'order_items', 'domain_event_outbox');
-- Expected: 0 rows

-- 2. Check WalletTransaction source_type has data
SELECT COUNT(*) FROM wallet_transactions WHERE source_type IS NULL;
-- Expected: 0 (verify all rows populated)

-- 3. Check existing WalletTxType usage
SELECT type, COUNT(*) FROM wallet_transactions GROUP BY type;
-- Document current distribution

-- 4. Check CreditLedger rows (for later migration)
SELECT COUNT(*), type FROM credit_ledgers GROUP BY type;
```

## Rollback

T01.1-T01.7 are additive. No rollback needed — old tables untouched.
T01.4 (rename): If `reference_type`/`reference_id` migration fails, app code still reads `source_type`/`source_id`. Safe.

## Deliverables

- [ ] schema.prisma updated with all new models + field changes
- [ ] Migration file `prisma/migrations/<ts>_add_financial_domain_tables/`
- [ ] Safety checks passed
- [ ] `npx prisma generate` run (rebuild client with new types)
- [ ] check-types passes
