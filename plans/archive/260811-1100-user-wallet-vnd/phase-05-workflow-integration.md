# Phase 05 — Workflow Engine Integration

- Priority: P1 | Status: Done | Effort: 2h
- Depends: Phase 02 (WalletService complete) + Workflow Engine Phase 03 (CaseTransitionService interface)
- Blocks: Phase 07 (legacy migration)

## Overview

Tích hợp WalletService vào workflow engine. **Kiến trúc 3 tầng:** Wallet VND → mua credit → credit tiêu trong workflow. Engine chỉ biết credit (đơn vị tiêu dùng). Ví VND là tầng riêng.

**Nguyên tắc:**
- `hasCredit` guard → check **credit_ledgers** (credit balance ≥ 1). KHÔNG check wallet.
- `subtractCredit` action → ghi **credit_ledgers** (consumption -1). KHÔNG gọi WalletService.
- `refundCredit` action → gọi **WalletService.refund()** hoàn VND về ví (credit → VND).
- **Mua credit = flow riêng, NGOÀI workflow engine** (xem Phase 08 bên dưới).

## 3 Integration Points (CHỈ 1 điểm cần WalletService)

### 1. Guard `hasCredit` — KHÔNG thay đổi

```
HIỆN TẠI (workflow plan — ĐÚNG):
  hasCredit guard check event.data.creditBalance từ credit_ledgers → check >= 1

SAU wallet:
  KHÔNG đổi. hasCredit vẫn check credit_ledgers.
  Data pre-fetched trong L2 (CaseTransitionService), guard sync.
```

```typescript
// Trong case-machine.ts — guard hasCredit (GIỮ NGUYÊN)
hasCredit: ({ event }) => {
  if ((event.data?.lockedPrice as number) === 0) return true  // free case
  return (event.data?.creditBalance as number) >= 1              // check credit, không check ví
},
```

### 2. Action `subtractCredit` — KHÔNG thay đổi

```
HIỆN TẠI (workflow plan — ĐÚNG):
  subtractCredit ghi credit_ledgers (type: consumption, amount: -1)

SAU wallet:
  KHÔNG đổi. subtractCredit vẫn ghi credit_ledgers.
  Credit được mua trước đó bằng ví VND (flow riêng, ngoài engine).
```

```typescript
// Trong case-transition.service.ts — action subtractCredit (GIỮ NGUYÊN)
case 'subtractCredit': {
  // credit_ledgers: trừ 1 credit (đã được mua bằng ví VND trước đó)
  // KHÔNG gọi walletService — ví chỉ bị trừ khi MUA credit, không phải khi DÙNG
  // F2: TRONG tx — SELECT FOR UPDATE + idempotency key
  break
}
```

### 3. Action `refundCredit` — THAY ĐỔI (tích hợp WalletService)

```
HIỆN TẠI (workflow plan):
  refundCredit ghi credit_ledgers (type: refund, zero-out balance)

SAU wallet:
  refundCredit gọi walletService.refund(tx, ownerId, lockedPrice, caseId, key)
  → hoàn VND về ví (credit → VND)
```

```typescript
// Trong case-transition.service.ts — action refundCredit (SỬA)
import { walletService } from '../../wallet/application/wallet.service';

case 'refundCredit': {
  // T13 veto — hoàn giá trị credit về VÍ VND.
  // lockedPrice = giá VND lúc case được tạo (cột locked_price trong bảng cases).
  const ownerId = context.data?.caseOwnerId as string;
  const lockedPrice = context.data?.lockedPrice as number;
  if (!ownerId || !lockedPrice || lockedPrice === 0) return;

  const idempotencyKey = `refund-${caseId}-${crypto.randomUUID()}`;
  await walletService.refund(ownerId, lockedPrice, 'admin_veto', caseId, idempotencyKey);
  break
}
```

## WalletService.refund — chấp nhận tx param

WalletService.refund() cần chấp nhận `tx` parameter để dùng chung transaction với CaseTransitionService:

```typescript
// wallet.service.ts — thêm optional tx param
async refund(
  userId: string,
  amountVnd: number,
  reason: string,
  caseId: string,
  idempotencyKey?: string,
  tx?: Prisma.TransactionClient  // ← thêm param này
) {
  const key = idempotencyKey ?? `refund-${caseId}-${crypto.randomUUID()}`;
  const runner = tx ?? prisma;

  return runner.$transaction(async (innerTx) => {
    // ... logic deposit với innerTx
  });
}
```

**Không nested tx issue:** CaseTransitionService pass `tx` vào refund → dùng chung 1 transaction. Không cần Option A/B.

## Không thay đổi gì ở Machine (Phase 02)

Case machine (`case-machine.ts`) **không cần sửa gì** cho wallet integration. Guard hasCredit vẫn sync, vẫn check `event.data.creditBalance`. Lý do: dữ liệu credit được pre-fetch trong L2 của CaseTransitionService.

## Feature flag: phân biệt case cũ vs mới

Case cũ (trước khi có ví): credit mua ngoài hệ thống. Case mới: credit mua qua ví.
Cả 2 đều dùng `credit_ledgers` cho subtractCredit. Khác biệt duy nhất: **cách credit được tạo ra**.

```typescript
// KHI MUA CREDIT (flow riêng, ngoài engine):
// Case mới: walletService.withdraw() + credit_ledgers.create() trong 1 tx
// Case cũ: credit_ledgers.create() trực tiếp (admin/manual)
```

→ **Không cần `Case.use_wallet` flag trong engine.** Engine chỉ thấy credit_ledgers. Wallet là implementation detail của tầng mua credit.

## Tổng kết: thay đổi thực tế

| Thành phần | Thay đổi |
|---|---|
| `case-machine.ts` (Phase 02) | **KHÔNG ĐỔI** |
| `case-transition.service.ts` (Phase 03) | Sửa action `refundCredit` → gọi `walletService.refund()` |
| `wallet.service.ts` (Phase 02) | Thêm optional `tx` param cho refund() |
| hasCredit guard | **KHÔNG ĐỔI** — vẫn check credit_ledgers |
| subtractCredit action | **KHÔNG ĐỔI** — vẫn ghi credit_ledgers |
| Mua credit flow | **MỚI** — Phase 08 (xem bên dưới) |

---

## Phase 08 (BỔ SUNG) — Purchase Credit Flow

> Phase này là MỚI, chưa có trong plan gốc. Cần thiết để nối tầng Wallet → Credit.

### Overview

User dùng số dư ví VND để mua credit. 1 credit = giá `lockedPrice` VND (từ service_pricing). Flow: ví -VND, credit_ledgers +credit — trong 1 transaction.

### API

```
POST /api/wallet/purchase-credits
  Body: { packageId, quantity }
  → wallet.withdraw(userId, totalPrice, 'credit_purchase', idempotencyKey)
  → credit_ledgers.create({ case_id: null, type: 'purchase', amount: quantity })
  → Trả về: { balance, credits }
```

### Implementation

```typescript
// apps/api/src/modules/wallet/application/purchase-credits.usecase.ts (MỚI)

export async function purchaseCreditsUseCase(
  userId: string,
  packageId: string,
  quantity: number,
) {
  const price = await resolvePackagePrice(packageId); // từ Phase 04
  const totalPrice = price * quantity;
  const idempotencyKey = `purchase-${userId}-${packageId}-${quantity}-${Date.now()}`;

  return prisma.$transaction(async (tx) => {
    // 1. Trừ ví
    await walletService.withdraw(userId, totalPrice, 'credit_purchase', idempotencyKey);

    // 2. Thêm credit
    await tx.creditLedger.create({
      data: {
        owner_id: userId,
        amount: quantity,
        type: 'purchase',
        idempotency_key: idempotencyKey,
        metadata_json: { packageId, pricePerCredit: price },
      },
    });

    return { totalPrice, credits: quantity };
  });
}
```

> `walletService.withdraw` sourceType → sửa thành `'credit_purchase'` thay vì `'case_consume'` (Phase 02 fix).

### Credit balance query (cho hasCredit guard)

```typescript
// Hàm helper — gọi từ CaseTransitionService L2
// LƯU Ý: credit_ledgers không có owner_id. Phải JOIN qua cases.
async function getCreditBalanceInTx(
  tx: Prisma.TransactionClient,
  ownerId: string,
): Promise<number> {
  const result = await tx.creditLedger.aggregate({
    where: { case: { owner_auth_user_id: ownerId } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}
```

### Files

| File | Action |
|---|---|
| `apps/api/src/modules/wallet/application/purchase-credits.usecase.ts` | **MỚI** |
| `apps/api/src/modules/wallet/infrastructure/http/wallet.routes.ts` | **SỬA** — thêm POST /wallet/purchase-credits |
| `apps/api/src/modules/wallet/application/wallet.service.ts` | **SỬA** — withdraw sourceType → credit_purchase |

## Deliverables (Phase 05 + Phase 08)

- [x] Action `refundCredit` trong case-transition.service.ts → gọi `walletService.refund(tx, ...)` (tại `case-transition.service.ts:152`)
- [x] WalletService.refund() thêm optional `tx` param
- [x] Purchase credit flow: POST /wallet/purchase-credits
- [x] `getCreditBalanceInTx()` helper trong CaseTransitionService (tại `case-transition.service.ts:52`)
- [ ] Unit test: hasCredit pass khi credit_ledgers >= 1 <!-- chưa có test file -->
- [ ] Integration test: T13 veto → wallet balance tăng đúng lockedPrice <!-- chưa có test file -->
- [ ] Integration test: T5 accept + T11 submit → KHÔNG đụng wallet balance <!-- chưa có test file -->
- [x] `check-types` PASS

## Related Code Files (đã sửa so với plan cũ)

| File | Action | Change |
|---|---|---|
| `case-transition.service.ts` | **SỬA** | refundCredit → walletService.refund() |
| `case-machine.ts` | **KHÔNG ĐỔI** | hasCredit guard giữ nguyên |
| `wallet.service.ts` | **SỬA** | refund() thêm tx param; withdraw sourceType → credit_purchase |
| `purchase-credits.usecase.ts` | **MỚI** | Flow mua credit bằng ví |
| `wallet.routes.ts` | **SỬA** | POST /wallet/purchase-credits |
