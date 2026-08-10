# Phase 01 — Schema & Migration

- Priority: P1 | Status: Pending | Effort: 2h
- Depends: Không
- Blocks: Phase 02, 03, 04

## Overview

Tạo 5 bảng mới: `user_wallets`, `wallet_transactions`, `wallet_topups`, `service_types`, `service_pricing`. Sửa bảng `service_packages` (thêm `service_type_id` FK). Seed data cho service catalog.

> DB safety: tuân `prisma-migration-safety.md` — migration `--create-only`, không `migrate dev` full.

## Prisma Schema Changes

### 1. `user_wallets` (NEW)

```prisma
model UserWallet {
  id           String              @id @default(uuid())
  userId       String              @unique @map("user_id")
  user         User                @relation(fields: [userId], references: [id])
  balance      Int                 @default(0) // VND — cached, updated atomically trong tx
  createdAt    DateTime            @default(now()) @map("created_at")
  updatedAt    DateTime            @updatedAt @map("updated_at")
  transactions WalletTransaction[]

  @@map("user_wallets")
}
```

- 1-1 với User. Tạo wallet row khi user đăng ký (trigger trong auth hook hoặc lazy-create lần đầu gọi WalletService).
- `balance` là cached column — updated atomically trong cùng `$transaction` với `wallet_transactions` insert.

### 2. `wallet_transactions` (NEW)

```prisma
model WalletTransaction {
  id             String      @id @default(uuid())
  walletId        String      @map("wallet_id")
  wallet         UserWallet  @relation(fields: [walletId], references: [id])
  type           WalletTxType
  amount         Int         // VND — dương = vào, âm = ra
  balanceBefore  Int         @map("balance_before")
  balanceAfter   Int         @map("balance_after")
  sourceType     String      @map("source_type") // topup | credit_purchase | case_consume | admin_refund | platform_bonus | migration
  sourceId       String?     @map("source_id")
  idempotencyKey String      @unique @map("idempotency_key")
  metadata       Json?       @map("metadata_json")
  createdAt      DateTime    @default(now()) @map("created_at")

  @@index([walletId, createdAt])
  @@map("wallet_transactions")
}

enum WalletTxType {
  deposit
  withdrawal
  refund
  adjustment
  migration
}
```

- Immutable append-only ledger. Mỗi dòng tự chứa `balanceBefore` + `balanceAfter` → không cần JOIN để audit.
- `sourceType` = topup (nạp ví), case_consume (trừ tiền case), admin_refund (hoàn veto/reject), platform_bonus (tặng), migration (chuyển từ credit cũ).
- `idempotencyKey` UNIQUE → DB-level dedup (fix G1).

### 3. `wallet_topups` (NEW)

```prisma
model WalletTopup {
  id                  String    @id @default(uuid())
  userId              String    @map("user_id")
  user                User      @relation(fields: [userId], references: [id])
  amount              Int       // VND
  transferContent     String    @map("transfer_content") // "CR" + code — SePay matching
  status              String    @default("pending") // pending | completed | failed
  verifiedBy          String?   @map("verified_by") // "auto" | admin user_id
  verificationSource  String?   @map("verification_source") // "auto" | "manual"
  metadata            Json?     @map("metadata_json")
  createdAt           DateTime  @default(now()) @map("created_at")
  updatedAt           DateTime  @updatedAt @map("updated_at")

  @@map("wallet_topups")
}
```

- Thay thế Payment cho flow nạp VND (Payment cũ có `case_id` NOT NULL, không dùng cho nạp ví được).
- `transferContent` = "CR" + random code 6 ký tự → match với SePay webhook regex `/CR[A-Z0-9]{6,}/`.
- `verifiedBy` = "auto" (SePay webhook) | admin user_id (upload proof fallback).

### 4. `service_types` (NEW)

```prisma
model ServiceType {
  id          String           @id @default(uuid())
  code        String           @unique // "ai_review" | "supporter_review" | "vip_combo" | "team_fit"
  name        String           // "AI đánh giá" | "Supporter chấm" | "VIP AI+Supporter"
  description String?
  isActive    Boolean          @default(true) @map("is_active")
  packages    ServicePackage[]
  createdAt   DateTime         @default(now()) @map("created_at")

  @@map("service_types")
}
```

### 5. `service_packages` (MODIFY — thêm FK)

```prisma
model ServicePackage {
  id            String           @id @default(uuid())
  serviceTypeId String           @map("service_type_id")
  serviceType   ServiceType      @relation(fields: [serviceTypeId], references: [id])
  name          String           // "Đánh giá AI cơ bản" | "Chấm bài chuyên sâu"
  isActive      Boolean          @default(true) @map("is_active")
  features      Json             @default("[]") // ["Phân tích SWOT", "Gợi ý cải thiện"]
  pricingTiers  ServicePricing[]
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")

  @@map("service_packages")
}
```

**Migration note:** `service_packages` hiện tại có `name`, `price_amount`, `price_currency`, `description`, `features`, `is_active`. Thêm `service_type_id` (nullable ban đầu → backfill → NOT NULL sau). Giữ `price_amount` làm fallback nếu chưa có `service_pricing`.

### 6. `service_pricing` (NEW)

```prisma
model ServicePricing {
  id            String          @id @default(uuid())
  packageId     String          @map("package_id")
  package       ServicePackage  @relation(fields: [packageId], references: [id])
  price         Int             // VND
  isCurrent     Boolean         @default(true) @map("is_current")
  previousPrice Int?            @map("previous_price")
  changedBy     String?         @map("changed_by") // admin user_id
  changedAt     DateTime?       @map("changed_at")

  @@index([packageId, isCurrent])
  @@map("service_pricing")
}
```

## Seed Data

```sql
-- Service types
INSERT INTO service_types (id, code, name) VALUES
  (gen_random_uuid(), 'ai_review', 'AI đánh giá'),
  (gen_random_uuid(), 'supporter_review', 'Supporter chấm bài'),
  (gen_random_uuid(), 'vip_combo', 'VIP AI + Supporter'),
  (gen_random_uuid(), 'team_fit', 'Team Fit phân tích');

-- Packages (link to existing service_packages rows via service_type_id update)
UPDATE service_packages SET service_type_id = (SELECT id FROM service_types WHERE code = 'ai_review')
  WHERE name ILIKE '%ai%' OR name ILIKE '%đánh giá%';
UPDATE service_packages SET service_type_id = (SELECT id FROM service_types WHERE code = 'supporter_review')
  WHERE name ILIKE '%supporter%' OR name ILIKE '%chấm%';
UPDATE service_packages SET service_type_id = (SELECT id FROM service_types WHERE code = 'team_fit')
  WHERE name ILIKE '%team%' OR name ILIKE '%fit%';

-- Pricing
INSERT INTO service_pricing (id, package_id, price, is_current) 
SELECT gen_random_uuid(), id, 50000, true FROM service_packages WHERE service_type_id = (SELECT id FROM service_types WHERE code = 'ai_review') LIMIT 1;

INSERT INTO service_pricing (id, package_id, price, is_current)
SELECT gen_random_uuid(), id, 39000, true FROM service_packages WHERE service_type_id = (SELECT id FROM service_types WHERE code = 'supporter_review') LIMIT 1;

INSERT INTO service_pricing (id, package_id, price, is_current)
SELECT gen_random_uuid(), id, 150000, true FROM service_packages WHERE service_type_id = (SELECT id FROM service_types WHERE code = 'vip_combo') LIMIT 1;

INSERT INTO service_pricing (id, package_id, price, is_current)
SELECT gen_random_uuid(), id, 0, true FROM service_packages WHERE service_type_id = (SELECT id FROM service_types WHERE code = 'team_fit') LIMIT 1;
```

## Migration Steps

1. Generate migration file (lệnh `--create-only`, KHÔNG apply):
   ```bash
   npm run prisma:migrate:create -- --name add-wallet-and-service-catalog
   ```

2. Review migration SQL — đảm bảo:
   - `service_type_id` nullable ban đầu → không break data cũ
   - Không `DROP TABLE`, `DROP COLUMN`
   - `wallet_transactions.idempotency_key` UNIQUE constraint

3. Apply migration:
   ```bash
   npx prisma migrate deploy
   ```

4. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```

5. Chạy seed script (file `.ts` hoặc raw SQL qua `psql`).

## Deliverables

- [ ] Migration file `add-wallet-and-service-catalog`
- [ ] Schema `schema.prisma` updated (6 models/enums mới)
- [ ] Prisma client regenerated
- [ ] Seed data applied
- [ ] `check-types` PASS
