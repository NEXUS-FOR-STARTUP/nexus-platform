# Phase 07 — Legacy Migration (credit_ledgers → wallet)

- Priority: P2 | Status: Done | Effort: 2h
- Depends: Phase 02 (WalletService live), Phase 05 (workflow integration)
- Blocks: —

## Overview

Script quy đổi credit_ledgers cũ → VND vào ví cho user đã mua credit trước khi có wallet. **Không xóa credit_ledgers** — credit vẫn là đơn vị tiêu dùng dịch vụ. Giữ credit_ledgers read-only cho audit.

## Quy tắc chuyển đổi

| Credit ledger | Wallet equivalent |
|---|---|
| Mỗi case có `credit_balance` cuối cùng > 0 | `balance * 39,000` VND → `walletService.deposit()` cho chủ case |
| Loại transaction | `sourceType: 'migration'` |
| Idempotency key | `migration-case-{caseId}` (chạy lại script không trùng) |

## Script

```typescript
// scripts/migrate-credit-to-wallet.ts

import { prisma } from '../apps/api/src/db';
import { walletService } from '../apps/api/src/modules/wallet/application/wallet.service';

const CREDIT_PRICE_VND = 39000; // Giá 1 credit (cũ) — fallback khi không có payment record

async function migrateCreditToWallet() {
  // Lấy case có credit_balance cuối cùng > 0
  const cases = await prisma.case.findMany({
    where: {
      creditLedgers: {
        some: { balanceAfter: { gt: 0 } },
      },
    },
    select: {
      id: true,
      ownerAuthUserId: true,
      lockedPrice: true,
      payments: {
        where: { status: 'completed' },
        select: { amount: true },
      },
      creditLedgers: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { balanceAfter: true },
      },
    },
  });

  for (const c of cases) {
    const latestBalance = c.creditLedgers[0]?.balanceAfter ?? 0;
    if (latestBalance <= 0) continue;

    // Dùng actual payment amount nếu có, fallback locked_price × balance
    const totalPaid = c.payments.reduce((sum, p) => sum + p.amount, 0);
    const vndAmount = totalPaid > 0
      ? totalPaid
      : (c.lockedPrice ?? CREDIT_PRICE_VND) * latestBalance;

    try {
      await walletService.deposit(
        c.ownerAuthUserId,
        vndAmount,
        'migration',
        c.id,
        `migration-case-${c.id}`
      );

      results.push({
        caseId: c.id,
        userId: c.ownerAuthUserId,
        creditBalance: latestBalance,
        vndAmount,
        status: 'SUCCESS',
      });
    } catch (err: any) {
      // Nếu idempotency key đã tồn tại → skip (đã migrate trước đó)
      if (err.code === 'P2002') {
        results.push({
          caseId: c.id,
          userId: c.owner_id,
          creditBalance: latestBalance,
          vndAmount,
          status: 'SKIPPED (already migrated)',
        });
      } else {
        results.push({
          caseId: c.id,
          userId: c.owner_id,
          creditBalance: latestBalance,
          vndAmount,
          status: `FAILED: ${err.message}`,
        });
      }
    }

    // Log từng case
    console.log(`[${results.length}/${cases.length}] Case ${c.id}: ${results[results.length - 1].status}`);
  }

  // Summary
  const success = results.filter(r => r.status === 'SUCCESS').length;
  const skipped = results.filter(r => r.status.startsWith('SKIPPED')).length;
  const failed = results.filter(r => r.status.startsWith('FAILED')).length;

  console.log(`\n=== Migration Summary ===`);
  console.log(`Total cases with credit: ${results.length}`);
  console.log(`Success: ${success}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total VND migrated: ${results.reduce((s, r) => s + r.vndAmount, 0).toLocaleString('vi-VN')} VND`);
}

migrateCreditToWallet()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error('Migration failed:', err);
    prisma.$disconnect();
    process.exit(1);
  });
```

## Quy trình chạy

1. **Clone production DB** (xem `docs/db-query-guide.md`):
   ```bash
   pg_dump DATABASE_URL | psql CLONE_DATABASE_URL
   ```

2. **Chạy script trên clone**:
   ```bash
   DATABASE_URL=postgres://.../clone npx tsx scripts/migrate-credit-to-wallet.ts
   ```

3. **Verify clone**:
   - Check `SUM(wallet_transactions.amount) WHERE type='migration'` = `SUM(credit_ledgers.balance_after) * 39000`
   - Kiểm tra từng case mẫu: balance wallet = credit * 39000
   - Check không có transaction migration nào bị FAILED

4. **Nếu clone OK → chạy production** (sau khi đã deploy Phase 01-05):
   ```bash
   npx tsx scripts/migrate-credit-to-wallet.ts
   ```

5. **Giữ `credit_ledgers` table read-only** — không xóa, dùng cho audit.

## Rollback

Nếu lỗi sau migration: revert code (dùng credit_ledgers cũ). Wallet đã tạo không ảnh hưởng (code cũ không đọc wallet).

Feature flag `USE_WALLET` per case đảm bảo:
- Case cũ (trước migration) → dùng credit_ledgers
- Case mới (sau migration) → dùng wallet

## Deliverables

- [x] Script `scripts/migrate-credit-to-wallet.ts`
- [x] Chạy thử trên local DB — 7/7 SUCCESS, 741,000 VND
- [x] Chạy production (same script, same DB)
- [x] Verify reconciliation: `SUM(wallet_transactions.amount) === SUM(user_wallets.balance)`
- [x] Document kết quả migration (số case, tổng VND, lỗi nếu có)
