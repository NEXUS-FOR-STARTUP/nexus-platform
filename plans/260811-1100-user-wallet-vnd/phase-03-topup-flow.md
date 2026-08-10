# Phase 03 — Top-up Flow (SePay)

- Priority: P1 | Status: Pending | Effort: 3h
- Depends: Phase 01 (schema), Phase 02 (WalletService)
- Blocks: Phase 06 (FE)

## Overview

Flow nạp tiền vào ví qua SePay. User tạo topup → nhận QR + `transfer_content` → chuyển khoản ngân hàng → SePay webhook match `transfer_content` → auto-verify → `WalletService.deposit()`.

Khác biệt với Payment cũ: không có `case_id` — tiền vào ví cá nhân. Dùng bảng `wallet_topups` thay vì `payments`.

## Flow Diagram

```
POST /api/wallet/topups { amount }
  └─ Tạo WalletTopup (status: pending, transfer_content: "CR" + random 6-char code)
       └─ Trả về: { id, amount, transfer_content, qr_url, bank_info }

User mở app ngân hàng → chuyển khoản đúng amount + transfer_content
  │
  ▼
SePay webhook POST /api/payments/sepay-webhook (route hiện tại, thêm logic topup)
  ├─ Regex /CR[A-Z0-9]{6,}/ match transfer_content
  ├─ Tìm WalletTopup gần nhất của user với status=pending + amount khớp
  │    └─ Không tìm thấy → tìm Payment cũ (logic hiện tại, backward compat)
  ├─ WalletService.deposit(userId, amount, 'topup', topupId, idempotencyKey)
  │    └─ wallet_transactions INSERT + wallet.balance UPDATE (atomic)
  └─ WalletTopup.status = 'completed', verified_by = 'auto'
```

## Files

```
SỬA  apps/api/src/modules/payments/application/sepay-webhook.usecase.ts  (thêm topup matching)
MỚI  apps/api/src/modules/wallet/application/wallet-topup.usecase.ts     (create topup)
SỬA  apps/api/src/modules/wallet/infrastructure/http/wallet.routes.ts    (POST /wallet/topups)
```

## wallet-topup.usecase.ts

```typescript
// apps/api/src/modules/wallet/application/wallet-topup.usecase.ts

import { prisma } from '../../../db';
import { randomBytes } from 'node:crypto';

const TOPUP_PREFIX = 'CR';

function generateTransferContent(): string {
  // 6 ký tự alphanumeric uppercase → khớp regex /CR[A-Z0-9]{6,}/
  const code = randomBytes(4)
    .toString('base64url')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  return `${TOPUP_PREFIX}${code}`;
}

interface SePayBankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  // ... các field khác từ SePay config
}

export async function createTopupUseCase(
  userId: string,
  amount: number
): Promise<{
  id: string;
  amount: number;
  transferContent: string;
  bankInfo: SePayBankInfo;
}> {
  const transferContent = generateTransferContent();

  const topup = await prisma.walletTopup.create({
    data: {
      userId,
      amount,
      transferContent,
      status: 'pending',
    },
  });

  const bankInfo = getSePayBankInfo(); // Hàm đọc config SePay từ env

  return {
    id: topup.id,
    amount: topup.amount,
    transferContent: topup.transferContent,
    bankInfo,
  };
}

function getSePayBankInfo(): SePayBankInfo {
  return {
    bankName: process.env.SEPAY_BANK_NAME ?? 'ACB',
    accountNumber: process.env.SEPAY_ACCOUNT_NUMBER ?? '',
    accountName: process.env.SEPAY_ACCOUNT_NAME ?? '',
  };
}
```

## Sửa sepay-webhook.usecase.ts

```typescript
// Thêm vào logic hiện tại (apps/api/src/modules/payments/application/sepay-webhook.usecase.ts)

// Sau khi regex match transfer_content /CR[A-Z0-9]{6,}/
// Tìm topup TRƯỚC, fallback payment cũ:

// NEW: Check wallet_topups trước
const topup = await prisma.walletTopup.findFirst({
  where: {
    transferContent,
    status: 'pending',
  },
  orderBy: { createdAt: 'desc' },
});

if (topup) {
  const txDepositKey = `sepay-deposit-${topup.transferContent}-${txId}`;
  await walletService.deposit(
    topup.userId,
    topup.amount,
    'topup',
    topup.id,
    txDepositKey
  );

  await prisma.walletTopup.update({
    where: { id: topup.id },
    data: {
      status: 'completed',
      verifiedBy: 'auto',
      verificationSource: 'auto',
      metadata: { txId, amount: sepayAmount },
    },
  });

  return; // Xong — không fallback xuống Payment cũ
}

// OLD: Fallback sang Payment cũ (logic hiện tại)
// ... giữ nguyên code payment matching
```

## wallet.routes.ts (bổ sung)

```typescript
walletRoutes.post('/topups', async (c) => {
  const userId = c.get('user').id;
  const { amount } = await c.req.json();

  if (!amount || amount < 10000) {
    return c.json({ error: 'Số tiền tối thiểu 10,000 VND' }, 400);
  }

  const result = await createTopupUseCase(userId, amount);
  return c.json(result, 201);
});
```

## Validation

- `transferContent` regex `/CR[A-Z0-9]{6,}/` khớp SePay webhook regex hiện tại (`sepay-webhook.usecase.ts:152`)
- Idempotency: `wallet_transactions.idempotency_key` UNIQUE → trùng webhook = constraint error → catch & ignore (return 200)
- Dedup: bỏ in-memory `Set<number>` (G1 fix) — DB-level dedup thay thế

## Gotcha Fixes

| Gotcha | Fix |
|---|---|
| G1: SePay dedup in-memory Set | `wallet_transactions.idempotency_key` UNIQUE |
| G2: requireCredits silent skip | Không liên quan (credit check chuyển sang WalletService.getBalance sau phase 05) |
| G3: payment_status "not_required" | Giữ nguyên (team_fit flow), không sửa trong phase này |

## Deliverables

- [ ] `wallet-topup.usecase.ts` — createTopupUseCase với random `transferContent`
- [ ] POST `/wallet/topups` route
- [ ] `sepay-webhook.usecase.ts` — thêm topup matching TRƯỚC payment matching
- [ ] SePay webhook idempotency test (2 webhook cùng txId → 1 deposit)
- [ ] `check-types` PASS
