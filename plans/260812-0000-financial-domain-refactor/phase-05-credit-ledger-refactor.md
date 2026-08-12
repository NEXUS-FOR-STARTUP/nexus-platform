# Phase 05: CreditLedger Refactor

**Status:** pending | **Effort:** 2.5h | **Depends:** Phase 03 | **Blocked by:** —

## Overview

Add `reference_type` to `credit_ledger` entries. Remove direct payment coupling from `verifyPayment`. All new credit entries use `reference_type: "order"` with `reference_id: order_id`. Old entries keep `reference_type: "payment"` for backward compat.

**NEW in this revision:**
- P3: Standardize balance to `aggregate({ _sum: { amount } })` everywhere
- P5: Giữ credit deduction INLINE trong `createSupporterOutput` (Option B — atomic). T11 state machine route BỊ BÁC, xem T05.8 phân tích
- P6: Fix 3 idempotency keys that use `randomUUID()` / `Date.now()`
- H7: Backfill `reference_type` on old credit_ledgers with NULL values
- **ND2/UQ6 fix:** `refundCredit` trong `executeAction` đọc nhầm raw request body thay vì `event.data` → luôn skip. Sửa: truyền `event.data` (có `caseOwnerId` + `lockedPrice` từ `executeTransition` L208-212). Xem T05.9.

## Task Breakdown

### T05.1: CreditLedger schema — verify field exists

**File:** `prisma/schema.prisma`

`reference_type` already added in Phase 01 (T01.6). Verify:

```prisma
model CreditLedger {
  // ...
  reference_type   String?   // "order" | "payment" (legacy) | "audit_round"
  reference_id     String?
  // ...
}
```

### T05.2: verifyPayment — stop creating credit_ledger entries

**File:** `apps/api/src/modules/payments/infrastructure/persistence/payment.repository.ts`

In `verifyPayment` function (lines 175-227), when `status === "paid"`:

**BEFORE:** Creates `credit_ledger` entry with `type: "purchase"`, `reference_id: paymentId`.

**AFTER:** Replace credit_ledger creation with comment:
```typescript
if (status === "paid") {
  // --- Intake pending → intake ready on successful payment ---
  // (keep existing case stage transition logic — lines 177-186)

  // --- Credit purchase moved to Order domain ---
  // Credit entries are now created in create-order.usecase.ts
  // Old credit_ledger entries from legacy Payment path remain for audit
  // This block no longer creates credit_ledger entries
}
```

**CRITICAL:** This means `verifyPayment` no longer creates credit. For old `Payment` records that haven't been verified yet, they must either:
- Be migrated to deposits (Phase 08), OR
- Get credit via the old path (keep code commented out until Phase 08)

**Decision:** Keep old credit_ledger creation code WITH a feature flag check:
```typescript
// Legacy credit purchase — keep for transition period
// Remove after Phase 08 data migration
if (process.env["USE_ORDER_DOMAIN"] !== "true") {
  // ... old credit_ledger creation code ...
}
```

### T05.3: CreditLedger reads — handle reference_type

**File:** `apps/api/src/modules/cases/domain/case.types.ts` (FE type)

CreditLedger interface already has `reference_id`. Add `reference_type`:

```typescript
export interface CreditLedger {
  id: string;
  amount: number;
  balance_after: number;
  type: "purchase" | "consumption" | "refund";
  reference_type: string | null;  // NEW
  reference_id: string | null;
  created_at: string;
}
```

### T05.4: CreditLedger repository — add reference_type to queries

**File:** Search for credit_ledger queries in case repository

**File:** `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts`

Find `credit_ledgers` include in case detail queries. Ensure `reference_type` is selected:

```typescript
// In case detail query:
credit_ledgers: {
  select: {
    id: true,
    amount: true,
    balance_after: true,
    type: true,
    reference_type: true,   // ADD
    reference_id: true,
    created_at: true,
  },
  orderBy: { created_at: "asc" },
},
```

### T05.5: Workflow engine — credit consumption stays same

**File:** `apps/api/src/modules/cases/application/case-transition.service.ts`

Credit consumption (`credit_ledger` with `type: "consumption"`) does NOT change — it already uses `reference_id` for audit_round. Just add `reference_type: "audit_round"`:

```typescript
// In subtractCredit action:
await tx.creditLedger.create({
  data: {
    case_id: caseId,
    amount: -1,
    balance_after: newBalance,
    type: "consumption",
    reference_type: "audit_round",  // ADD
    reference_id: auditRoundId,
    idempotency_key: `consume-${caseId}-${auditRoundId}`,
  },
});
```

### T05.6: CreditLedger — refund entries reference_type

**File:** Wherever refund credit_ledger entries are created (case-transition.service.ts, veto-case.usecase.ts, etc.)

Add `reference_type`:
```typescript
reference_type: "veto",  // veto-case.usecase.ts refunds credit
```

### T05.7: P3 — Standardize credit balance to `aggregate _sum`

**Files:** `credit-ledger.repository.ts`, `case-transition.service.ts`, `case.repository.ts`

Replace ALL occurrences of:
```typescript
// OLD PATTERN (relies on auto-increment id ordering):
const latest = await tx.creditLedger.findFirst({
  where: { case_id: caseId },
  orderBy: { id: 'desc' },
  select: { balance_after: true },
});
const balance = latest?.balance_after ?? 0;
```

With:
```typescript
// NEW PATTERN (mathematically correct):
const result = await tx.creditLedger.aggregate({
  where: { case_id: caseId },
  _sum: { amount: true },
});
const balance = result._sum.amount ?? 0;
```

**Locations to update:**
1. `credit-ledger.repository.ts:getCreditBalance` (line ~3)
2. `payment.repository.ts:verifyPayment` (line ~198-202)
3. `case.repository.ts:createSupporterOutput` (line ~521-525)
4. `case-transition.service.ts:subtractCredit` (line ~124-129)
5. `case-transition.service.ts:getCreditBalanceInTx` (line ~52-61) — already correct, no change needed

### T05.8: P5 — GIỮ credit deduction inline trong createSupporterOutput (Option B, REVISED)

**File:** `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts`
**File:** `apps/api/src/services/case-transition.service.ts` (dead-code alignment)

**Phân tích sâu (Gap 3) — lý do BÁC route qua state machine (T11):**

1. **Phá atomicity**: `createSupporterOutput` (docs + status + events) và `executeTransition` (ledger + status) là **2 tx riêng**. Crash giữa chừng → tài liệu đã upload, credit chưa trừ, case kẹt. Chữa phải truyền `tx` xuống repository + bỏ status update → đổi signature + toàn bộ tests (invasive, sai hướng YAGNI).
2. **Guard chặn admin**: T11 guard `isAssignedSupporter` chặn luồng admin upload — nhưng usecase hiện cho phép `userRole === 'admin'` (submit-revision.usecase.ts:237) → regression.
3. **lockPrice là no-op**: `case 'lockPrice': break` (case-transition.service.ts:169-170). `locked_price` đã được set tại createCase (case.repository.ts:177) / upgrade (upgrade-package.usecase.ts:50). T11 THÊM 0 hành vi.
4. **P3 không tự khỏi**: `subtractCredit` action cũng đọc `findFirst` (L124-128) — cùng bug. Di chuyển xong vẫn phải sửa action.
5. **Event trùng lặp**: T11 → caseEvent(T11) + emit(CASE_STAGE_CHANGED); usecase vẫn emit REPORT_PUBLISHED → student nhận 2 noti cho 1 hành động.
6. **Xung đột blocking plan** `260809-1030-workflow-engine-refactor` (in_progress): kích hoạt T11 = sửa case-transition.service.ts + submit-revision.usecase.ts — chạm vùng workflow engine plan đang chủ quyền.
7. Sample code gốc còn sai shape: `transition: { name: 'T11_SUBMIT_OUTPUT' }` — thực tế `executeTransition` nhận `transition: TransitionName` (string).

**Quyết định (Option B):** `createSupporterOutput` giữ nguyên là writer duy nhất (1 tx atomic). Chỉ:

```typescript
// CHANGE (L521-525) — P3 trên live path:
// OLD:
const latestLedger = await tx.creditLedger.findFirst({
  where: { case_id: caseId },
  orderBy: { id: 'desc' },
});
const currentBalance = latestLedger?.balance_after ?? 0;
// NEW:
const currentBalance = await getCreditBalanceInTx(tx, caseId);  // aggregate _sum
```

- Key ledger (L571) `consume-${unitCode}-${caseId}` — **ĐÃ deterministic**, KHÔNG đổi → P6 đã thỏa trên live path.

**Dead-code alignment (không đổi behavior — T11 hiện không ai gọi, chỉ để sẵn khi workflow-engine plan kích hoạt):**

```typescript
// case-transition.service.ts:subtractCredit (L120-145):
// OLD L121-123: randomUUID nonce
// NEW: const key = `consume-${unitCode}-${caseId}`;
// OLD L124-128: findFirst balance
// NEW: aggregate _sum (getCreditBalanceInTx)

// case-transition.service.ts:refundCredit (L151):
// OLD: `refund-${caseId}-${crypto.randomUUID()}`
// NEW: `refund-${caseId}`
```

**Handoff note cho workflow-engine plan:** khi kích hoạt T11, PHẢI (1) chạy `executeTransition` trong CÙNG tx với createSupporterOutput; (2) bỏ status update khỏi createSupporterOutput; (3) dedup REPORT_PUBLISHED + CASE_STAGE_CHANGED; (4) giữ bypass admin upload.

**ND2/UQ6 (resolved — xem T05.11):** `refundCredit` trong `executeAction` đọc nhầm raw request body `{ reason }` thay vì `event.data` đã enrich (L208-212). Bug nặng hơn plan cũ mô tả: guard `if (!ownerId || !lockedPrice || lockedPrice === 0) break` LUÔN true vì `context.data` là raw request body — cả `caseOwnerId` lẫn `lockedPrice` đều `undefined`. Fix: sửa `executeAction` truyền `event.data` thay vì raw `params.data`. `locked_price` guaranteed set tại createCase / upgrade-package / team-fit. Free case (`locked_price: 0`) vẫn skip — đúng thiết kế (không hoàn gì).

### T05.9: P6 — Fix idempotency keys (remove randomUUID / Date.now)

**3 locations to fix:**

**a) `case-transition.service.ts:subtractCredit` (L120-123)**
```typescript
// BEFORE (idempotency defeated by random nonce):
const nonce = crypto.randomUUID();
const key = `consume-${unitCode}-${caseId}-${nonce}`;

// AFTER (deterministic — one consumption per unitCode+caseId):
const key = `consume-${unitCode}-${caseId}`;
```

**b) `case-transition.service.ts:refundCredit` (L151)**
```typescript
// BEFORE:
const key = `refund-${caseId}-${crypto.randomUUID()}`;

// AFTER (deterministic — one refund per caseId):
const key = `refund-${caseId}`;
```

**c) `purchase-credits.usecase.ts` (L27)**
```typescript
// BEFORE:
const idempotencyKey = `purchase-${userId}-${packageId}-${quantity}-${Date.now()}`;

// AFTER (deterministic — T05.9c):
const idempotencyKey = `purchase-${userId}-${packageId}-${caseId}-${quantity}`;
```

### T05.10: H7 — Backfill reference_type on old credit_ledgers

**SQL migration (run during Phase 08 deployment):**
```sql
UPDATE credit_ledgers
SET reference_type = 'payment'
WHERE reference_id IS NOT NULL
  AND reference_type IS NULL;

-- Verify:
SELECT reference_type, COUNT(*)
FROM credit_ledgers
GROUP BY reference_type;
-- Expected: 'payment' (old), 'order' (new), 'audit_round' (consumption), 'veto' (refund)
```

### T05.11: ND2/UQ6 — Fix executeAction data source for refundCredit

**File:** `apps/api/src/services/case-transition.service.ts`

**Bug:** `executeAction` (`case-transition.service.ts` L228-236) truyền `params.data` (raw request body) làm `context.data`. Hàm `refundCredit` (L147-154) đọc `context.data?.caseOwnerId` + `context.data?.lockedPrice` — cả 2 đều `undefined` vì raw data `{ reason }` không có. Guard `if (!ownerId || !lockedPrice || lockedPrice === 0) break` → **luôn true** → refundCredit là dead code.

**Fix:** Truyền `event.data` (đã enrich tại `executeTransition` L203-217, có `caseOwnerId` + `lockedPrice`) thay vì raw `params.data`.

```typescript
// executeAction (L228-236) — BEFORE:
for (const action of actions) {
  await executeAction(action, tx, caseId, {
    unitCode: (data as any)?.unitCode,
    versionNo: (data as any)?.versionNo,
    actorId,
    nextStage,
    data: data as Record<string, unknown>,   // ← RAW request body
  })
}

// AFTER:
for (const action of actions) {
  await executeAction(action, tx, caseId, {
    unitCode: (data as any)?.unitCode,
    versionNo: (data as any)?.versionNo,
    actorId,
    nextStage,
    data: {
      ...(data as Record<string, unknown>),        // giữ raw fields (reason, ...)
      caseOwnerId: caseRecord.owner_auth_user_id, // enrich từ DB
      lockedPrice: caseRecord.locked_price ?? 0,   // enrich từ DB
    },
  })
}
```

**Lưu ý:** `lockedPrice: 0` cho free case vẫn skip refund — đúng thiết kế (free không hoàn gì). Case upgrade lên audit rồi veto → `lockedPrice: 39000` → refund chạy.

**Test:**
- Unit: T13_VETO trên case audit đã consume credit → `refund-{caseId}` transaction created + wallet balance += locked_price
- Unit: T13_VETO trên case free (`locked_price: 0`) → refundCredit skip, không có wallet transaction

## Testing

- Unit: verifyPayment when USE_ORDER_DOMAIN=true → no credit_ledger created
- Unit: verifyPayment when USE_ORDER_DOMAIN=false → credit_ledger created (legacy path)
- Integration: POST /orders (credit_audit) → credit_ledger entry has reference_type: "order"
- Integration: GET /cases/:id → credit_ledger array includes reference_type field
- Unit: subtractCredit → credit_ledger entry has reference_type: "audit_round"
- **Unit (ND2):** T13_VETO on audit case with consumption → refundCredit creates refund tx + wallet balance restored
- **Unit (ND2):** T13_VETO on free case → refundCredit skip, no wallet change

## Rollback

1. Set `USE_ORDER_DOMAIN=false` → old behavior restored
2. Revert `payment.repository.ts` changes
3. Revert `executeAction` data source → refundCredit back to dead code (old behavior: always skip)

## Deliverables

- [ ] `payment.repository.ts` — feature-flagged credit_ledger creation
- [ ] `case.repository.ts` — credit_ledgers select includes reference_type
- [ ] `case-transition.service.ts` — add reference_type to consumption entries
- [ ] `case.types.ts` — CreditLedger interface has reference_type
- [ ] `credit-ledger.repository.ts` — balance via `aggregate _sum` (P3)
- [ ] `case.repository.ts:createSupporterOutput` — balance via `aggregate _sum` (P3), key deterministic giữ nguyên (P5/P6 Option B)
- [ ] `case-transition.service.ts` — subtractCredit: deterministic key + aggregate _sum; refundCredit: deterministic key (dead-code alignment)
- [ ] `case-transition.service.ts` — executeAction: truyền event.data (caseOwnerId + lockedPrice) thay vì raw data (ND2/UQ6)
- [ ] `purchase-credits.usecase.ts` — fix purchase idempotency key (P6)
- [ ] `credit_ledgers` backfill — SQL UPDATE reference_type WHERE NULL (H7)
- [ ] check-types passes
