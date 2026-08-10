# Phase 05 — Workflow Engine Integration

- Priority: P1 | Status: Pending | Effort: 2h
- Depends: Phase 02 (WalletService complete) + Workflow Engine Phase 03 (CaseTransitionService interface)
- Blocks: Phase 07 (legacy migration)

## Overview

Hook `WalletService` vào workflow engine. Thay guard `hasCredit` (đọc credit_ledgers per-case) → `WalletService.getBalance()`. Thay action `subtractCredit` → `WalletService.withdraw()`. Thay action `refundCredit` → `WalletService.refund()`.

**Nguyên tắc:** Engine chỉ biết credit (đơn vị tiêu dùng = 1 credit = 1 lần dùng). Ví VND là tầng riêng. Bridge: `hasCredit` = `balance >= servicePrice`, `subtractCredit` = `withdraw(servicePrice)`.

## Integration Points

3 chỗ trong CaseTransitionService cần sửa:

### 1. Guard `hasCredit`

```
HIỆN TẠI (workflow plan):
  hasCredit guard đọc event.data.creditBalance từ case ledger → check >= 1

MỚI:
  hasCredit guard gọi walletService.getBalance(actorId) → check >= servicePrice
```

```typescript
// Trong transition-registry.ts — guard hasCredit
hasCredit: async ({ context, event }) => {
  const userId = event.actorId;
  const caseId = event.caseId;

  // Lấy giá dịch vụ từ case (locked_price)
  const caseRecord = await getCaseForTx(tx, caseId);
  const servicePrice = caseRecord.locked_price;

  // Free case (team_fit, price=0) → auto pass
  if (servicePrice === 0) return true;

  // Check ví user
  const balance = await walletService.getBalance(userId);
  return balance >= servicePrice;
},
```

### 2. Action `subtractCredit`

```
HIỆN TẠI (workflow plan):
  subtractCredit action ghi credit_ledgers (type: consumption, amount: -1)

MỚI:
  subtractCredit action gọi walletService.withdraw(userId, servicePrice, caseId, idempotencyKey)
```

```typescript
// Trong case-transition.service.ts — action subtractCredit
subtractCredit: async ({ event, tx }) => {
  const userId = event.actorId;
  const caseId = event.caseId;

  // Lấy locked_price từ case
  const caseRecord = await getCaseForTx(tx, caseId);
  const servicePrice = caseRecord.locked_price;

  // Không trừ nếu free
  if (servicePrice === 0) return;

  const idempotencyKey = `consume-${caseId}-${randomUUID()}`;
  await walletService.withdraw(userId, servicePrice, caseId, idempotencyKey);
},
```

### 3. Action `refundCredit`

```
HIỆN TẠI (workflow plan):
  refundCredit action ghi credit_ledgers (type: refund, amount: +1, balanceAfter: 0)

MỚI:
  refundCredit action gọi walletService.refund(userId, servicePrice, 'admin_veto', caseId, idempotencyKey)
```

```typescript
// Trong case-transition.service.ts — action refundCredit
refundCredit: async ({ event }) => {
  const userId = event.actorId; // owner của case
  const caseId = event.caseId;

  const caseRecord = await getCaseForTx(tx, caseId);
  const servicePrice = caseRecord.locked_price;

  if (servicePrice === 0) return;

  const idempotencyKey = `refund-${caseId}-${randomUUID()}`;
  await walletService.refund(userId, servicePrice, 'admin_veto', caseId, idempotencyKey);
},
```

## Import & Dependency Injection

```typescript
// Trong case-transition.service.ts
import { walletService } from '../../wallet/application/wallet.service';

// Hoặc inject qua constructor nếu service cần testability
export class CaseTransitionService {
  constructor(
    private readonly walletService: WalletService
  ) {}
}
```

## Lưu ý

1. **WalletService phải inject được vào CaseTransitionService** — dùng constructor injection để testable.
2. **Không gọi walletService trong DB transaction của CaseTransitionService** nếu walletService tự mở transaction riêng (Prisma không nested tx). Giải pháp:
   - Option A: WalletService.withdraw chấp nhận `tx` parameter để dùng chung 1 transaction
   - Option B: WalletService gọi riêng transaction, chấp nhận atomicity loss giữa case transition và wallet (nếu wallet fail → throw → case transition rollback ở tầng trên)
   - **Recommend B** cho MVP: case transition service wrap mọi thứ trong 1 outer transaction; wallet service dùng inner transaction riêng. Nếu wallet fail → throw → outer transaction rollback.
3. **`locked_price` phải có trong Case** — cột này đã tồn tại (schema hiện tại có `price_amount`). Dùng nó làm nguồn giá khi trừ tiền.

## Transition from credit_ledgers

Sau khi integration này deploy:
- Case MỚI: dùng ví (WalletService)
- Case CŨ: dùng credit_ledgers (cần feature flag hoặc check `case.created_at`)

```typescript
// Feature flag check
function isWalletCase(case_: Case): boolean {
  // Case tạo sau ngày migration → dùng ví
  const MIGRATION_DATE = new Date('2026-08-15'); // Set sau khi deploy
  return case_.createdAt >= MIGRATION_DATE;
}
```

## Deliverables

- [ ] Guard `hasCredit` trong transition-registry.ts → gọi `walletService.getBalance()`
- [ ] Action `subtractCredit` trong case-transition.service.ts → gọi `walletService.withdraw()`
- [ ] Action `refundCredit` trong case-transition.service.ts → gọi `walletService.refund()`
- [ ] WalletService constructor injection vào CaseTransitionService
- [ ] Feature flag `isWalletCase()` để phân biệt case mới/cũ
- [ ] Unit test: hasCredit pass khi balance >= price, fail khi balance < price
- [ ] Integration test: T5 accept → wallet balance giảm đúng servicePrice
- [ ] Integration test: T13 veto → wallet balance tăng lại servicePrice
- [ ] `check-types` PASS
