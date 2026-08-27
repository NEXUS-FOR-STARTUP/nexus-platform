# Phase 03 — Tests (GA-02 intake stuck fix)

- Priority: P1 | Status: implemented | Effort: 1.5h
- Depends: Phase 01 | Blocks: Phase 04

## Context Links

- Convention: `node:test` + `node:assert`, đặt trong `apps/api/src/shared/infrastructure/tests/*.test.ts`
- Test script: `apps/api/package.json` → `"test": "tsx --test src/shared/infrastructure/tests/*.test.ts"`
- Mẫu machine test: `phase-07-xstate-case-machine.test.ts` (event helper, `tryTransition`, `TARGET_STAGE`)
- Mẫu usecase DI test: `phase-06-core-usecases.test.ts` (import động `await import(...)`, inject fake)
- Stage/status helper: `apps/api/src/modules/cases/domain/case.types.ts` (`isPreSubmissionStage`, `isPaymentComplete`)

## Overview

Tạo 1 file test mới `phase-09-intake-stuck-fix.test.ts`, gồm 2 phần:
- **A — Machine contract (pure, không DB):** khóa bất biến "submit = submitted", "T16 = intake_ready", cả 2 stage pre-submission đều nộp được, paid stamp không đổi.
- **B — Writer-removal (behavioral, DB-free via `mock.method`):** chứng minh `createOrderUseCase` và `verifyPayment` **không còn ghi `user_facing_stage`** sau khi thanh toán.

## Key Insights

- Machine KHÔNG đổi trong fix này — machine test phần A chỉ **khóa bất biến** chống regression (ai đó nối lại T16 làm submit path).
- `submitIntakeUseCase`/`createOrderUseCase`/`verifyPayment` KHÔNG có DI seam. Không thêm DI (ngoài scope). Test phần B dùng `t.mock.method` trên shared `prisma` singleton (`apps/api/src/db.ts`) — cùng object mà các usecase import → mock có hiệu lực.
- `verifyPayment` repo fn hiện là dead code HTTP nhưng vẫn test trực tiếp (đúng bất biến single-writer).
- Import `db.ts` **không** mở kết nối (PrismaClient lazy-connect), nhưng `db.ts` throw nếu `DATABASE_URL` trống → test env phải có `DATABASE_URL` (đã là prerequisite của phase-06 hiện tại, vì phase-06 import `payment.repository.js` transitively).
- `t.mock.method` tự restore sau mỗi test (node:test). Không cần `restoreAll()` thủ công.

## Requirements

- 2 path được phủ: A `intake_pending → (mua credit) → nộp → submitted`; B `intake_ready (mua trước) → nộp → submitted` (không kẹt).
- Verify `createOrderUseCase` + `verifyPayment` không ghi `user_facing_stage`.
- Chỉ dùng `node:test` + `node:assert`. Không DB, không Prisma CLI.

## Architecture

```
Machine contract (A):  tryTransition / TARGET_STAGE / isPreSubmissionStage / isPaymentComplete
Writer-removal (B):    mock prisma.$transaction + (B2) mock prisma.case/servicePackage/walletService
                       → gọi usecase/repo thật → assert tx.case.update data KHÔNG có user_facing_stage
```

## Related Code Files

- **Tạo:** `apps/api/src/shared/infrastructure/tests/phase-09-intake-stuck-fix.test.ts`
- Không sửa/xóa file khác.

## Implementation Steps

### File header + imports

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tryTransition, getAvailableTransitions } from '../../../modules/cases/domain/case-machine.js';
import { TARGET_STAGE } from '../../../modules/cases/domain/transition.types.js';
import type { TransitionEvent, TransitionName } from '../../../modules/cases/domain/transition.types.js';
import { isPreSubmissionStage, isPaymentComplete } from '../../../modules/cases/domain/case.types.js';
import { prisma } from '../../../db.js';

process.env.NODE_ENV = 'test';

function event(t: TransitionName, overrides: Record<string, unknown> = {}): TransitionEvent {
  return {
    type: t,
    actor: { id: 'user-1', role: 'USER' },
    data: { actorId: 'user-1', roleVerified: 'USER', caseOwnerId: 'user-1', creditBalance: 1, lockedPrice: 39000, paymentStatus: 'paid', ...overrides },
  };
}
```

(Event helper copy từ phase-07 để guard `isOwner`/`isBeforeSubmission` đúng.)

### Section A — Machine contract (không DB)

```ts
test('GA-02 path A/B — submit luôn hạ cánh "submitted"', () => {
  assert.equal(TARGET_STAGE.T2_SUBMIT_INTAKE, 'submitted');
  assert.equal(TARGET_STAGE.T16_EDIT_INTAKE, 'intake_ready'); // T16 giữ (compat) nhưng KHÔNG phải submit path
});

test('GA-02 path A/B — T2 khả dụng từ triage_pending (cả intake_pending lẫn intake_ready)', () => {
  // internal_status của cả 2 stage pre-submission đều là "triage_pending"
  assert.ok(tryTransition('triage_pending', event('T2_SUBMIT_INTAKE')));
  assert.ok(getAvailableTransitions('triage_pending').includes('T2_SUBMIT_INTAKE'));
});

test('GA-02 — cả intake_pending lẫn intake_ready là pre-submission stage', () => {
  assert.equal(isPreSubmissionStage('intake_pending'), true);
  assert.equal(isPreSubmissionStage('intake_ready'), true);
});

test('GA-02 — T16 không thể là submit path (guard isBeforeSubmission chặn sau nộp)', () => {
  assert.equal(tryTransition('triage_pending', event('T16_EDIT_INTAKE', { currentStage: 'submitted' })), null);
});

test('GA-02 — paid stamp giữ nguyên (T5 gate dựa vào nó)', () => {
  assert.equal(isPaymentComplete('paid'), true);
});
```

### Section B — Writer-removal (mock prisma singleton)

**B1 — `verifyPayment` không ghi stage:**

```ts
test('GA-02 verifyPayment — paid KHÔNG ghi user_facing_stage', async (t) => {
  process.env.USE_ORDER_DOMAIN = 'true'; // bỏ qua credit branch → tx surface tối thiểu
  const caseUpdateCalls: any[] = [];
  const fakeTx = {
    payment: { update: async () => ({ id: 'pay-1', status: 'paid' }) },
    case: { update: async (args: any) => { caseUpdateCalls.push(args); return {}; } },
    caseEvent: { create: async () => ({}) },
  };
  t.mock.method(prisma, '$transaction', async (cb: any) => cb(fakeTx));

  const { verifyPayment } = await import('../../../modules/payments/infrastructure/persistence/payment.repository.js');
  await verifyPayment({ paymentId: 'pay-1', caseId: 'case-1', status: 'paid', rejectionReason: null, adminId: 'admin-1', verificationSource: 'manual' });

  assert.equal(caseUpdateCalls.length, 1);
  assert.deepEqual(caseUpdateCalls[0].data, { payment_status: 'paid' });
  assert.ok(!('user_facing_stage' in caseUpdateCalls[0].data));
});
```

**B2 — `createOrderUseCase` không ghi stage:**

```ts
test('GA-02 createOrder — mua credit KHÔNG ghi user_facing_stage', async (t) => {
  delete process.env.DUAL_WRITE_PAYMENT; // không đi nhánh payment dual-write
  const caseUpdateCalls: any[] = [];
  const fakeTx = {
    order: { create: async () => ({ id: 'order-1', items: [] }), update: async () => ({}) },
    creditLedger: { aggregate: async () => ({ _sum: { amount: 0 } }), create: async () => ({}) },
    case: {
      findUnique: async () => ({ owner_auth_user_id: 'user-1', internal_status: 'triage_pending', user_facing_stage: 'intake_pending' }),
      update: async (args: any) => { caseUpdateCalls.push(args); return {}; },
    },
    domainEventOutbox: { create: async () => ({}) },
  };
  t.mock.method(prisma, '$transaction', async (cb: any) => cb(fakeTx));
  t.mock.method(prisma.case, 'findUnique', async () => ({ package_id: 'pkg-1' }));      // resolveCreditAuditPrice
  t.mock.method(prisma.servicePackage, 'findUnique', async () => ({ pricing_tiers: [{ price: 39000 }] }));
  const { walletService } = await import('../../../modules/wallet/application/wallet.service.js');
  t.mock.method(walletService, 'withdraw', async () => undefined);

  const { createOrderUseCase } = await import('../../../modules/orders/application/create-order.usecase.js');
  await createOrderUseCase('user-1', {
    items: [{ service_type: 'credit_audit', quantity: 1, metadata_json: { case_id: 'case-1' } }],
  });

  assert.equal(caseUpdateCalls.length, 1);
  assert.deepEqual(caseUpdateCalls[0].data, { payment_status: 'paid' });
  assert.ok(!('user_facing_stage' in caseUpdateCalls[0].data));
});
```

### Fixtures / seed

- Không cần DB seed. `fakeTx` là object ghi nhận (`caseUpdateCalls`) + trả shape tối thiểu cho code chạy qua.
- `event()` helper tái dùng từ phase-07 (guard data).
- Giá trị ghi nhận duy nhất cần assert: `tx.case.update` `data`.

## Todo List

- [x] Tạo `phase-09-intake-stuck-fix.test.ts` đúng thư mục test convention
- [x] Section A: 5 test machine contract (TARGET_STAGE, tryTransition, getAvailableTransitions, isPreSubmissionStage, isPaymentComplete)
- [x] Section B1: verifyPayment không ghi stage (mock `$transaction` + `USE_ORDER_DOMAIN=true`)
- [x] Section B2: createOrder không ghi stage (mock `$transaction` + pre-tx reads + walletService.withdraw)
- [x] Chạy scoped: `npx tsx --test apps/api/src/shared/infrastructure/tests/phase-09-intake-stuck-fix.test.ts` → pass

## Success Criteria

- [x] Path A + B phủ ở mức machine: `T2 → submitted`; `T16 → intake_ready` (không phải submit path); cả 2 pre-submission stage nộp được.
- [x] `verifyPayment` (paid) assert `case.update` data = `{ payment_status: "paid" }`, KHÔNG có key `user_facing_stage`.
- [x] `createOrderUseCase` assert `case.update` data = `{ payment_status: "paid" }`, KHÔNG có key `user_facing_stage`.
- [x] Test chạy xanh khi `npm test` (phase-04) và độc lập với DB (không query thật).

## Risk Assessment

| Rủi ro | Khả năng | Tác động | Giảm thiểu |
|---|---|---|---|
| `mock.method` trên prisma delegate (B2) flaky do Prisma proxy | Thấp | Trung bình | Fallback: nếu flaky, giữ B1 + machine tests, chuyển B2 thành checklist review (xác minh bằng grep source) — nhưng thử mock trước |
| `DATABASE_URL` trống khiến `import db.js` throw | Thấp | Cao | Đã là prerequisite của phase-06; nếu chạy riêng, set `DATABASE_URL` dummy (không query thật) |
| `USE_ORDER_DOMAIN`/`DUAL_WRITE_PAYMENT` env sót từ test khác | Thấp | Trung bình | Set/delete env tường minh đầu mỗi test B1/B2 |

## Security Considerations

- Không chạm DB thật, không query, không mutation.
- Mock chỉ thay method in-memory, tự restore sau test.

## Next Steps

- Phase 04: chạy full `npm test` + `npm run check-types` (apps/api) để xác nhận không regression.
