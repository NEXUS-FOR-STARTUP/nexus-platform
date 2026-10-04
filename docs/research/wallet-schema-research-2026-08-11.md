# Wallet Schema & Payment Architecture — Research (2026-08-11)

**Purpose:** Production-grade schema for User Wallet VND, service catalog redesign, pending window analysis.

**Sources:** Double-entry ledger best practices (Blnk, Modern Treasury, freeCodeCamp), service catalog patterns (multi-tenant SaaS, Stripe), payment security (Stripe, Checkout.com, Mastercard), idempotency patterns.

---

## Executive Summary

**Wallet:** Double-entry ledger — immutable `wallet_transactions`, cached balance on `user_wallets`, `SELECT FOR UPDATE` lock on spend. NOT single balance column.

**Service catalog:** 3 tables — `service_types` (enum of service kinds) → `service_packages` (priced products) → `service_pricing` (tiered pricing). Admin CRUD-ready. New service = 1 INSERT, no migration.

**Pending window:** KHÔNG cần. Designed for card networks (chargeback 120 ngày). Bank transfer (SePay) is irreversible once confirmed. Auto-verify webhook is correct for this product. Adding window = latency with zero benefit.

---

## 1. Wallet Schema — Double-Entry Ledger

### Why double-entry, not single balance column

Single `balance` column is antipattern:
- Cannot audit — "99000 → 60000", no trail why
- Cannot reverse — which transaction was wrong?
- Drift risk — concurrent UPDATE race without lock
- Cannot reconstruct balance at point in time

Double-entry: every movement = transaction header + debit/credit entries. Balance = `SELECT SUM(amount) WHERE account_id = ?`. Immutable. Auditable.

### Prisma Schema

```prisma
model UserWallet {
  id           String              @id @default(uuid())
  userId       String              @unique @map("user_id")
  user         User                @relation(fields: [userId], references: [id])
  balance      Int                 @default(0) // cached — updated atomically within tx
  createdAt    DateTime            @default(now()) @map("created_at")
  updatedAt    DateTime            @updatedAt @map("updated_at")
  transactions WalletTransaction[]

  @@map("user_wallets")
}

model WalletTransaction {
  id             String    @id @default(uuid())
  walletId        String    @map("wallet_id")
  wallet         UserWallet @relation(fields: [walletId], references: [id])
  type           WalletTxType // deposit | withdrawal | refund | adjustment | migration
  amount         Int       // VND — dương = vào, âm = ra
  balanceBefore  Int       @map("balance_before")
  balanceAfter   Int       @map("balance_after")
  sourceType     String    @map("source_type") // topup | credit_purchase | case_consume | admin_refund | platform_bonus | migration
  sourceId       String?   @map("source_id") // payment_id | case_id | null
  idempotencyKey String    @unique @map("idempotency_key")
  metadata       Json?     @map("metadata_json")
  createdAt      DateTime  @default(now()) @map("created_at")

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

// Payment hiện tại có case_id NOT NULL — không dùng được cho nạp ví (không có case).
// wallet_topups là entity mới thay thế Payment cho flow nạp VND.
model WalletTopup {
  id              String        @id @default(uuid())
  userId          String        @map("user_id")
  user            User          @relation(fields: [userId], references: [id])
  amount          Int           // VND
  transferContent String        @map("transfer_content") // "CR" + code — SePay matching
  status          String        @default("pending") // pending | completed | failed
  verifiedBy      String?       @map("verified_by") // "auto" (SePay webhook) | admin user_id (proof upload)
  verificationSource String?    @map("verification_source") // "auto" | "manual"
  metadata        Json?         @map("metadata_json")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  @@map("wallet_topups")
}
```

### Top-up flow (thay thế Payment cho nạp VND)

```
User mở modal nạp tiền → POST /api/wallet/topups (amount) → trả QR + transfer_content
User chuyển khoản → SePay webhook match transfer_content → auto-verify
  ├─ Tìm wallet_topup gần nhất pending của user → đánh dấu completed
  └─ WalletService.deposit(userId, amount, 'topup', topupId, idempotencyKey)
       └─ wallet_transactions: INSERT + wallet.balance UPDATE (atomic)
```

Khác biệt với Payment cũ: không có `case_id`. User nạp tiền vào ví cá nhân, không gắn case.

### Key decisions

| Decision | Rationale |
|---|---|
| `amount Int` (VND) | No decimals needed. VND granularity = 1đ. `DECIMAL` overkill. |
| `balanceBefore` + `balanceAfter` | Audit trail — mỗi dòng tự chứa context, không cần JOIN. |
| Cached `balance` on wallet | Đọc nhanh, updated atomically trong cùng tx với transaction insert. Ledger vẫn immutable — reconcile định kỳ `SUM(ledger) === cache`. |
| `idempotency_key` unique | DB-level dedup. Replace current in-memory `Set` (`sepay-webhook.usecase.ts:35`). |

### Balance: cached on `user_wallets.balance`

Balance đọc từ cột `user_wallets.balance`, cập nhật atomically trong cùng `$transaction` với insert `wallet_transactions`. Ledger vẫn immutable — có thể reconcile `SUM(ledger) === cache` định kỳ để phát hiện drift.

---

## 2. Service Catalog Schema

### Why 3 tables, not just `service_packages`

Current `service_packages` is flat: name + price + features[]. Cannot distinguish "AI review 50k" vs "supporter review 39k" — both are just packages.

3-table design separates **what type** of service from **which package** from **what price**:

```prisma
model ServiceType {
  id       String           @id @default(uuid())
  code     String           @unique // "ai_review" | "supporter_review" | "vip_combo" | "team_fit"
  name     String           // "AI đánh giá" | "Supporter chấm" | "VIP AI+Supporter"
  description String?
  isActive Boolean          @default(true) @map("is_active")
  packages ServicePackage[]
  createdAt DateTime        @default(now()) @map("created_at")

  @@map("service_types")
}

model ServicePackage {
  id            String        @id @default(uuid())
  serviceTypeId String        @map("service_type_id")
  serviceType   ServiceType   @relation(fields: [serviceTypeId], references: [id])
  name          String        // "Đánh giá AI cơ bản" | "Chấm bài chuyên sâu"
  isActive      Boolean       @default(true) @map("is_active")
  features      Json          @default("[]") // ["Phân tích SWOT", "Gợi ý cải thiện"]
  pricingTiers  ServicePricing[]
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  @@map("service_packages")
}

model ServicePricing {
  id              String        @id @default(uuid())
  packageId       String        @map("package_id")
  package         ServicePackage @relation(fields: [packageId], references: [id])
  price           Int           // VND
  isCurrent       Boolean       @default(true) @map("is_current")
  previousPrice   Int?          @map("previous_price")
  changedBy       String?       @map("changed_by") // admin user_id
  changedAt       DateTime?     @map("changed_at")

  @@index([packageId, isCurrent])
  @@map("service_pricing")
}
```

### Seed data

```sql
-- Service types
INSERT INTO service_types (code, name) VALUES
  ('ai_review', 'AI đánh giá'),
  ('supporter_review', 'Supporter chấm bài'),
  ('vip_combo', 'VIP AI + Supporter'),
  ('team_fit', 'Team Fit phân tích');

-- Packages
INSERT INTO service_packages (id, service_type_id, name, features) VALUES
  ('pkg_ai_basic', (SELECT id FROM service_types WHERE code='ai_review'), 'AI đánh giá cơ bản', '["Phân tích ý tưởng", "Gợi ý cải thiện", "Chấm điểm SWOT"]'),
  ('pkg_sup_standard', (SELECT id FROM service_types WHERE code='supporter_review'), 'Supporter chấm chuẩn', '["Phân tích chuyên sâu", "Output chi tiết", "Hỗ trợ 1-1"]'),
  ('pkg_vip', (SELECT id FROM service_types WHERE code='vip_combo'), 'VIP AI+Supporter', '["AI đánh giá + Supporter chấm", "Phân tích toàn diện", "Hỗ trợ ưu tiên"]'),
  ('pkg_tf_free', (SELECT id FROM service_types WHERE code='team_fit'), 'Team Fit miễn phí', '["Phân tích nhóm", "Gợi ý vai trò"]');

-- Pricing (current prices)
INSERT INTO service_pricing (package_id, price, is_current) VALUES
  ('pkg_ai_basic', 50000, true),
  ('pkg_sup_standard', 39000, true),
  ('pkg_vip', 150000, true),
  ('pkg_tf_free', 0, true);
```

### Why this works

- **New service type** = 1 INSERT `service_types` + 1 INSERT `service_packages` + 1 INSERT `service_pricing`. No migration, no deploy.
- **Price change** = set old `is_current=false`, INSERT new row. Full audit trail per package.
- **Admin UI**: CRUD trên `service_types` + `service_packages` — đã có pattern `AdminPackagesSettings.tsx`.
- **Case references**: Case giữ `package_id` + `locked_price` snapshot như cũ.

---

## 3. Pending Window — Analysis

### What is a pending window?

Delay between "payment received" and "balance usable." User sees money but cannot spend until window clears.

### What problem does it solve?

**Chargeback protection for card networks.** When customer pays by credit card, card network allows dispute up to 120 days. Merchant can lose funds retroactively. Pending window gives time to detect fraud before funds are spent.

### Does Nexus need it?

**No.** Three reasons:

| Factor | Card payment | Nexus (SePay bank transfer) |
|---|---|---|
| Reversible? | Yes, 120 days chargeback | **No.** Bank transfer irreversible once settled. |
| Fraud vector | Stolen cards, friendly fraud | User must log into bank app, enter amount + transfer_content |
| Settlement delay | T+1 to T+3 | Seconds (SePay webhook) |

Bank transfer is **push payment** — user explicitly authorizes from their bank. No chargeback mechanism exists. Once SePay confirms, money is final.

### When would you add a pending window?

Only if Nexus later accepts **card payments** (Visa/Mastercard via Stripe). Then: 7-day hold for first-time users, 0-day for trusted users. But for bank transfer only: skip.

### Recommendation

**Không implement pending window.** Current auto-verify webhook pattern is correct. Money enters wallet instantly after SePay confirmation.

---

## 4. Combined Architecture — Full Picture

```
┌─────────────────────────────────────────────────────────┐
│                     SERVICE CATALOG                       │
│                                                          │
│  service_types          service_packages   service_pricing│
│  ┌──────────────┐      ┌────────────────┐ ┌────────────┐ │
│  │ ai_review    │──────│ AI cơ bản      │─│ 50,000 VND │ │
│  │ supporter    │──────│ Supporter chuẩn│─│ 39,000 VND │ │
│  │ vip_combo    │──────│ VIP AI+Sup     │─│ 150,000 VND│ │
│  │ team_fit     │──────│ Team Fit free  │─│ 0 VND      │ │
│  └──────────────┘      └────────────────┘ └────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ Case.package_id + locked_price
                           ▼
┌─────────────────────────────────────────────────────────┐
│                         CASE                             │
│                                                          │
│  Case tạo → locked_price = service_pricing.price        │
│  T5 Accept → guard check ví → trừ VND                   │
│  T11 Supporter output → trừ credit (lượt)               │
│  T12 Reject → VND về ví (nếu chưa tiêu credit)          │
│  T13 Veto → VND về ví (đã tiêu credit vẫn hoàn)         │
└─────────────────────────────────────────────────────────┘
                           │
                           │ WalletService.withdraw() / refund()
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     USER WALLET                           │
│                                                          │
│  user_wallets (1-1 user)                                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │ user_id │ balance │ created_at                    │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  wallet_transactions (immutable, append-only)            │
│  ┌────────────────────────────────────────────────┐     │
│  │ type │ amount │ before │ after │ source │ key  │     │
│  │ deposit │ +200000 │ 0 │ 200000 │ sepay │ abc │     │
│  │ withdrawal│ -39000 │ 200000 │ 161000 │ case │ def│     │
│  │ refund  │ +39000  │ 161000 │ 200000 │ admin │ ghi│     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  Balance = SUM(amount) = 200,000 VND (or cache column)  │
└─────────────────────────────────────────────────────────┘
```

### WalletService interface

```typescript
// apps/api/src/modules/wallet/application/wallet.service.ts

interface WalletService {
  deposit(userId: string, amountVnd: number, sourceType: string, sourceId: string, idempotencyKey: string): Promise<WalletTransaction>
  withdraw(userId: string, amountVnd: number, caseId: string, idempotencyKey: string): Promise<WalletTransaction>
  refund(userId: string, amountVnd: number, reason: string, caseId: string, idempotencyKey: string): Promise<WalletTransaction>
  getBalance(userId: string): Promise<number>
  getHistory(userId: string, limit: number, offset: number): Promise<WalletTransaction[]>
}
```

### Concurrency — DB lock on spend

DB tự xử lý concurrent. Không cần `version_no` hay optimistic retry:

```typescript
async withdraw(userId: string, amount: number, caseId: string, idempotencyKey: string) {
  return prisma.$transaction(async (tx) => {
    // Lock wallet row — thằng khác phải chờ
    const [wallet] = await tx.$queryRaw<[{id: string, balance: number}]>`
      SELECT id, balance FROM user_wallets WHERE user_id = ${userId} FOR UPDATE
    `;

    if (!wallet || wallet.balance < amount) {
      throw new InsufficientBalance();
    }

    const newBalance = wallet.balance - amount;

    // Ghi ledger + update cached balance — atomic
    const [txn] = await Promise.all([
      tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "withdrawal",
          amount: -amount,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          sourceType: "case_consume",
          sourceId: caseId,
          idempotencyKey,
        },
      }),
      tx.userWallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      }),
    ]);

    return txn;
  });
}
```

`FOR UPDATE` giữ lock đến khi transaction commit — ngân hàng cũng làm vậy. Không cần `version_no`.

---

## 5. Fixes for Current Gotchas

| # | Gotcha | Fix with new architecture |
|---|---|---|
| G1 | SePay dedup in-memory Set | `wallet_transactions.idempotency_key` UNIQUE — DB-level |
| G2 | `requireCredits` silently skips if table missing | `WalletService.getBalance()` — throws if wallet row missing |
| G3 | `payment_status:"not_required"` undocumented | No change — team_fit flow works, add enum if needed |
| G4 | Veto idempotency key `Date.now()` collision | `crypto.randomUUID()` in key — always unique |
| G5 | 39,000 hardcoded 3 places | Move to `service_pricing.price` — single source of truth |

---

## 6. Migration Strategy

### Phase A: New tables (migration)

1. Create `service_types`, update `service_packages` (add `service_type_id` FK), create `service_pricing`
2. Create `user_wallets`, `wallet_transactions`
3. Migrate data: `service_packages` → seed `service_types` + `service_pricing`
4. Legacy `credit_ledgers` kept read-only for audit

### Phase B: Old → New bridge

1. `WalletService` deployed alongside `credit_ledgers`
2. New cases: use wallet. Old cases: use ledger.
3. Feature flag `USE_WALLET` per case (check `case.created_at > migration_date`)
4. All old cases closed → drop `credit_ledgers`

### Phase C: Cleanup

1. Remove `CreditLedger` model, credit_ledgers table
2. Remove `payment_status`, `locked_price` from Case (keep `package_id`)
3. Remove `sepay-webhook.usecase` in-memory dedup Set

---

## 7. Sources

| Source | Topic |
|---|---|
| Blnk (github.com/blnkfinance/blnk) | Open-source double-entry ledger reference |
| freeCodeCamp — double-entry DB design | Immutable entries, balance derivation |
| Modern Treasury — ledger architecture | API design for financial transactions |
| Stripe — idempotency patterns | Idempotency key + cached balance |
| PostgreSQL docs — `SELECT FOR UPDATE` | Pessimistic locking pattern |
| Checkout.com, Mastercard — chargeback guides | Pending window rationale for card networks |
| ByteByteGo — payment system design | Idempotency + optimistic locking combination |

---

## Unresolved

- **Multi-currency:** VND only for MVP. Schema supports adding `currency` column to `wallet_transactions` later.
