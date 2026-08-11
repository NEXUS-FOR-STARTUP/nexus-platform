# Phase 05 — Tests

- Priority: P1 | Status: Pending | Effort: **4h** (red team F10: verify test infra DB local + executeAction unit tests — 2.5h ảo)
- Depends: Phase 04 (mọi use case chuyển xong)
- Blocks: Không (phase cuối pha 1)

## Overview

Migrate `phase-07-symflow-transitions.test.ts` sang XState. Test: máy trạng thái (16 assertions — path hợp lệ, KHÔNG 32 pass/fail), unit test `executeAction` (mock DB), integration test qua service (nếu test infra DB local tồn tại), regression 14 bugs checklist.

> **Red Team áp dụng:** F10 (cắt 32→16 assertions — over-test máy stateless; thêm unit test executeAction — đang under-test; verify DB test infra trước khi viết integration).

## Key Insights

- Test pattern: `node:test` + `node:assert` (khớp repo). Unit test thuần — không DB, không mock khi test machine
- **F10 — máy stateless**: 16 assertions cho path HỢP LỆ (guard pass) là đủ — guard fail của máy stateless chỉ verify config, không verify business logic. Thay bằng unit test `executeAction` (8 nhánh DB ops) — nơi bug thật sống
- **F10 — verify test infra TRƯỚC khi viết integration**: 15 test file hiện tại đều unit (không import PrismaClient, không seed). KIỂM TRA: có `DATABASE_URL` test env trong CI/local không? Có pattern DB local không?
  - CÓ → viết integration test qua service (DB local, seed trong before())
  - KHÔNG → BỎ integration, chỉ unit test (machine + executeAction mock DB). Ghi rõ trong success criteria
- XState test: `transition(machine, restoredState, event)` trả `[nextState, actions[]]` → assert trực tiếp
- KHÔNG dùng @xstate/test (model-based testing — over-engineering)
- Mẫu từ researcher-02: test guard pass, test action output, test snapshot round-trip

## Requirements

1. Migrate phase-07: thay symflow test = XState test (3 nhóm)
2. **F10:** test máy trạng thái — 16 assertions path hợp lệ (KHÔNG 32 pass/fail)
3. **F10:** unit test `executeAction` — 8 nhánh với mock DB (nơi bug thật sống: upsert, subtractCredit, setSlaDeadline)
4. Test tích hợp (ĐIỀU KIỆN: test infra DB local tồn tại — verify trước): submit-revision, submit-intake, submit-supporter-output, accept qua service
5. Regression checklist 14 bugs: mỗi bug có test verify
6. File size warn: test file có thể dài (~250 dòng) — chấp nhận vì test coverage

## Architecture

### 1. Migrate phase-07 — XState version

```typescript
// apps/api/src/shared/infrastructure/tests/phase-07-symflow-transitions.test.ts (SỬA)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transition } from 'xstate';
import {
  caseMachine, tryTransition,
  isBlockedTransition, getAvailableTransitions
} from '../../../modules/cases/domain/case-machine.js';

// ============================================================
// Nhóm A: transitions path hợp lệ (F10: 16 assertions — KHÔNG pass/fail ×2)
// ============================================================
test('T5_ACCEPT — pass when hasCredit=true + roleVerified=ADMIN', () => {
  const event = {
    type: 'T5_ACCEPT' as const,
    actor: { id: 'admin-1', role: 'ADMIN' },
    data: { paymentStatus: 'paid', roleVerified: 'ADMIN' },   // F6: roleVerified từ session
  };
  // currentStatus: triage_pending → machines state node
  const result = tryTransition('triage_pending', event);
  assert.ok(result, 'transition should be allowed');
  assert.equal(result!.to, 'accepted_unassigned');
});

test('T11_SUBMIT_OUTPUT — từ supporter_working → report_ready_to_publish (guard hasCredit)', () => {
  const event = {
    type: 'T11_SUBMIT_OUTPUT' as const,
    actor: { id: 'supporter-1', role: 'SUPPORTER' },
    data: { creditBalance: 1, roleVerified: 'SUPPORTER' },    // F2: balance fetch trong tx → nạp vào data
  };
  const result = tryTransition('supporter_working', event);
  assert.ok(result);
  assert.equal(result!.to, 'report_ready_to_publish');
});

test('T11_SUBMIT_OUTPUT — guard fail khi creditBalance=0 (fix #2)', () => {
  const event = {
    type: 'T11_SUBMIT_OUTPUT' as const,
    actor: { id: 'supporter-1', role: 'SUPPORTER' },
    data: { creditBalance: 0, roleVerified: 'SUPPORTER' },
  };
  const result = tryTransition('supporter_working', event);
  assert.equal(result, null, 'should be blocked — no credit');
});

test('T9_SUBMIT_REVISION — waiting_user → supporter_working (fix #18)', () => {
  const event = {
    type: 'T9_SUBMIT_REVISION' as const,
    actor: { id: 'user-1', role: 'USER' },
    data: { roleVerified: 'USER' },
  };
  const result = tryTransition('waiting_user', event);
  assert.ok(result);
  assert.equal(result!.to, 'supporter_working');
  // Verify actions chứa 'upsertDoc' (doc version mới)
  const actionTypes = result!.actions.map(a => a.type);
  assert.ok(actionTypes.includes('upsertDoc'), 'should upsert revision docs');
});

test('T16_EDIT_INTAKE — từ triage_pending → triage_pending (giữ nguyên, guard isBeforeSubmission)', () => {
  const event = {
    type: 'T16_EDIT_INTAKE' as const,
    actor: { id: 'user-1', role: 'USER' },
    data: { roleVerified: 'USER', isBeforeSubmission: true },
  };
  const result = tryTransition('triage_pending', event);
  assert.ok(result);
  assert.equal(result!.to, 'triage_pending'); // same state
});

// ============================================================
// Nhóm B: policy transitions T12-T15 (chốt 2026-08-09 — hết blocked)
// ============================================================
test('T12_REJECT — isAdmin + reasonMinLength; reason ngắn → null', () => {
  const ok = { type: 'T12_REJECT' as const, actor: { id: 'admin-1', role: 'ADMIN' }, data: { roleVerified: 'ADMIN', reason: 'Hồ sơ sai quy định đăng ký kinh doanh' } };
  assert.ok(tryTransition('triage_pending', ok), 'T12 từ submitted/triage_pending hợp lệ');
  const short = { type: 'T12_REJECT' as const, actor: { id: 'admin-1', role: 'ADMIN' }, data: { roleVerified: 'ADMIN', reason: 'ngắn' } };
  assert.equal(tryTransition('triage_pending', short), null, 'reason < 10 ký tự → chặn');
});

test('T13_VETO — isWithin48h; quá 48h → null', () => {
  const ok = { type: 'T13_VETO' as const, actor: { id: 'admin-1', role: 'ADMIN' }, data: { roleVerified: 'ADMIN', caseCreatedAt: new Date(Date.now() - 1 * 3600_000).toISOString() } };
  assert.ok(tryTransition('assigned', ok), 'veto trong 48h hợp lệ');
  const expired = { type: 'T13_VETO' as const, actor: { id: 'admin-1', role: 'ADMIN' }, data: { roleVerified: 'ADMIN', caseCreatedAt: new Date(Date.now() - 72 * 3600_000).toISOString() } };
  assert.equal(tryTransition('assigned', expired), null, 'quá 48h → chặn');
});

test('T14_COMPLETE — isAssignedSupporter (Q4); không phải supporter assigned → null', () => {
  const ok = { type: 'T14_COMPLETE' as const, actor: { id: 'supporter-1', role: 'SUPPORTER' }, data: { roleVerified: 'SUPPORTER', caseAssignedSupporterId: 'supporter-1' } };
  assert.ok(tryTransition('report_ready_to_publish', ok));
  const wrong = { type: 'T14_COMPLETE' as const, actor: { id: 'user-1', role: 'USER' }, data: { roleVerified: 'USER', caseAssignedSupporterId: 'supporter-1' } };
  assert.equal(tryTransition('report_ready_to_publish', wrong), null);
});

test('T3_RESUBMIT_AFTER_REJECT — hasCredit (Q1a); balance 0 → null', () => {
  const ok = { type: 'T3_RESUBMIT_AFTER_REJECT' as const, actor: { id: 'user-1', role: 'USER' }, data: { roleVerified: 'USER', creditBalance: 1 } };
  assert.ok(tryTransition('cancelled', ok));
  const broke = { type: 'T3_RESUBMIT_AFTER_REJECT' as const, actor: { id: 'user-1', role: 'USER' }, data: { roleVerified: 'USER', creditBalance: 0 } };
  assert.equal(tryTransition('cancelled', broke), null);
});

test('T4_RESUBMIT_AFTER_VETO — free không cần credit (Q1b); balance 0 vẫn pass', () => {
  const ok = { type: 'T4_RESUBMIT_AFTER_VETO' as const, actor: { id: 'user-1', role: 'USER' }, data: { roleVerified: 'USER', creditBalance: 0 } };
  assert.ok(tryTransition('cancelled', ok), 'veto đã refund → nộp lại free dù balance 0');
});

test('T15_CANCEL — isOwner; không owner → null', () => {
  const ok = { type: 'T15_CANCEL' as const, actor: { id: 'user-1', role: 'USER' }, data: { roleVerified: 'USER', caseOwnerId: 'user-1' } };
  assert.ok(tryTransition('supporter_working', ok), 'user hủy từ mọi stage mở');
  const notOwner = { type: 'T15_CANCEL' as const, actor: { id: 'user-2', role: 'USER' }, data: { roleVerified: 'USER', caseOwnerId: 'user-1' } };
  assert.equal(tryTransition('supporter_working', notOwner), null);
});

// ============================================================
// Nhóm C: getAvailableTransitions (hết blocked — mọi transition active)
// ============================================================
test('getAvailableTransitions — triage_pending có T2, T5, T16, T12, T15', () => {
  const transitions = getAvailableTransitions('triage_pending');
  assert.ok(transitions.includes('T2_SUBMIT_INTAKE'));
  assert.ok(transitions.includes('T5_ACCEPT'));
  assert.ok(transitions.includes('T16_EDIT_INTAKE'));
  assert.ok(transitions.includes('T12_REJECT'));
  assert.ok(transitions.includes('T15_CANCEL'));
});

// ============================================================
// Nhóm D: validate state (F4)
// ============================================================
test('tryTransition — status không hợp lệ → throw CORRUPT_STATE (F4)', () => {
  const event = { type: 'T15_CANCEL' as const, actor: { id: 'u1', role: 'user' }, data: {} };
  assert.throws(() => tryTransition('invalid_status', event), /CORRUPT_STATE/);
  assert.throws(() => tryTransition('null' as any, event), /CORRUPT_STATE/);
});
```

### 2. Unit test executeAction — F10 (mock DB, nơi bug thật sống)

```typescript
// apps/api/src/shared/infrastructure/tests/phase-08-executor.test.ts (MỚI ~150 dòng)
// KHÔNG cần DB thật — mock tx object với các hàm create/update/findFirst

import { test } from 'node:test';
import assert from 'node:assert/strict';

// mock Prisma.TransactionClient — chỉ cần hàm mà executeAction gọi
function mockTx() {
  return {
    documentRecord: {
      upsert: async (args: any) => { upsertCalls.push(args); return { id: 'doc-1' }; },
    },
    creditLedger: {
      create: async (args: any) => { ledgerCalls.push(args); return { id: 'ledger-1' }; },
      findUnique: async () => null,
    },
    // ... theo từng action
  };
}

test('executeAction(upsertDoc) — upsert theo composite unique (F7)', async () => {
  await executeAction('upsertDoc', { lifecycleUnitId: 'unit-1', documents: [...] }, mockTx(), 'case-1', ctx);
  // Assert: upsertCalls[0].where = { lifecycle_unit_id_doc_type_seq: {...} } — KHÔNG where {id}
});

test('executeAction(subtractCredit) — idempotent key version (F2)', async () => {
  // Assert: ledger.create với key `consume-{unitCode}-{caseId}-v{versionNo}-{nonce}`
  //   (AMENDMENT 2026-08-11: + nonce crypto.randomUUID — key không đoán trước được, S7)
  // Assert: key trùng → KHÔNG throw (idempotent)
});

test('executeAction(subtractCredit) — credit = 0 → throw NO_CREDITS (fix #2)', async () => {
  // Assert throw AppError(400, 'NO_CREDITS', ...)
});

test('executeAction(setSlaDeadline) — sla_deadline_at = now + 48h', async () => {
  // Assert: tx.case.update với sla_deadline_at trong khoảng 47.9h..48.1h
});

test('executeAction(notifyUser/emitStageChanged) — no-op trong tx (F2)', async () => {
  // Assert: không gọi DB (side effect chỉ ở L5)
});
// ... + 3 test nữa (resetStatus, lockPrice, autoResumeWork) = 8 nhánh
```

### 3. Test tích hợp use case qua service — CHỈ KHI test infra DB local tồn tại (F10)

```typescript
// apps/api/src/shared/infrastructure/tests/phase-08-workflow-service.test.ts (MỚI ~120 dòng)
// DB local (test environment). Pattern: node:test + prisma test DB

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { executeTransition } from '../../../modules/cases/application/case-transition.service.js';

const prisma = new PrismaClient();

// Setup: seed 1 case intake_pending + 1 payment paid

test('Integration: submit-intake (T2) → stage + status đổi', async () => {
  // Tạo case intake_pending
  // Gọi executeTransition(T2_SUBMIT_INTAKE)
  // Verify DB: user_facing_stage='submitted', internal_status='triage_pending'
});

test('Integration: accept (T5) with hasCredit=true → success', async () => {
  // Verify DB: stage='under_review', status='accepted_unassigned'
});

test('Integration: accept (T5) with hasCredit=false → throw (fix #9)', async () => {
  // Expect AppError
});

test('Integration: submit-revision (T9) → auto-resume (fix #18)', async () => {
  // Case ở waiting_user
  // Gọi executeTransition(T9)
  // Verify: status='supporter_working', stage='revision_submitted' (F1: TARGET_STAGE T9 — KHÔNG phải under_review)
});

test('Integration: submit-supporter-output (T11) with credit=0 → fail (fix #2)', async () => {
  // Expect guard fail
});

test('Integration: submit-supporter-output (T11) idempotent (fix #4)', async () => {
  // Upload version 2 → không P2002
});
```

### 4. Regression checklist — 14 bugs

| # | Bug | Test verify |
|---|---|---|
| 1 | Assign supporter sai | Phase 02 guard `isAdmin` test |
| 2 | Spam output — P2002 | Integration test T11 idempotent |
| 3 | Revision không tự resume | Integration test T9 → autoResumeWork |
| 4 | Output version 2 = NO_CREDITS | Integration test T11 version 2 with credit |
| 5 | Complete không notify | Phase 03 L5 emit test (khi Q4 chốt) |
| 7 | FE render nút sai thời điểm | Phase 04 FE test + manual |
| 9 | Accept khi chưa có credit | Integration test T5 hasCredit=false → fail |
| 12 | Resubmit không update content | Phase 02 check: T3/T4 upsert doc action |
| 13 | Intake lần đầu tạo doc trùng | Phase 01 unique constraint + T2 test |
| 14 | Intake thiếu field → lỗi | L1 validation (zod) — giữ nguyên |
| 17 | Sửa hồ sơ sau khi nộp | Unit test T16 guard isBeforeSubmission |
| 18 | Revision chỉ đổi 1 cột | Integration test T9 → cả 2 cột đổi |
| BP1 | Veto kẹt resubmit | Phase 06 (blocked) |
| 15 | Gói free vs Premium khác gì | Ngoài scope (business decision) |

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/shared/infrastructure/tests/phase-07-symflow-transitions.test.ts` | **SỬA** — Migrate sang XState (machine tests) |
| `apps/api/src/shared/infrastructure/tests/phase-08-executor.test.ts` | **MỚI** — Unit test executeAction (mock DB, F10) |
| `apps/api/src/shared/infrastructure/tests/phase-08-workflow-service.test.ts` | **MỚI (điều kiện)** — Integration test, CHỈ khi test infra DB local tồn tại (F10) |

## Todo List

- [ ] **F10 (ĐẦU PHASE):** verify test infra — có `DATABASE_URL` test env? Có pattern DB local trong repo? → quyết định integration test CÓ/KHÔNG
- [ ] Migrate phase-07: 4 nhóm test (A-D) sang XState — 16 assertions path hợp lệ
- [ ] Unit test: transitions T12-T15 → isBlockedTransition false (mọi transition active — chốt 2026-08-09; dọn wording cũ "true")
- [ ] Unit test: getAvailableTransitions cho mỗi state + KHÔNG trả blocked (F12)
- [ ] Unit test: tryTransition invalid status → CORRUPT_STATE (F4)
- [ ] **F10:** tạo phase-08-executor.test.ts — 8 unit test executeAction (mock DB, không DB thật)
- [ ] NẾU có DB local: tạo phase-08-workflow-service.test.ts — integration 4 use case qua service
- [ ] Regression checklist: map 14 bugs → test
- [ ] Chạy `npm test`: expect 100% pass
- [ ] Verify: check-types root PASS

## Success Criteria

- `npm test` API pass (phase-07 migrated + phase-08 executor + phase-08 service nếu có)
- 16 assertions transition machine (path hợp lệ — F10)
- 8 unit test `executeAction` (mock DB — F10)
- Integration test pass với DB local — HOẶC ghi rõ lý do bỏ (test infra không có — F10)
- 14 bugs có test verify (ghi rõ bug nào chưa test được do blocked)
- check-types root 3/3 PASS

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Test file quá dài (>300 dòng) | Cao | Thấp | Tách 3 file: phase-07 (machine) + phase-08-executor + phase-08-service (F10) |
| **F10:** không có DB local test infra → integration test không chạy | Trung bình | Trung bình | Verify ĐẦU phase. Không có → unit only (machine + executeAction mock). Ghi rõ giới hạn coverage |
| Test fail do symflow vẫn active | Thấp | Trung bình | Phase 07 migrate hoàn toàn sang XState — không còn symflow test |
| Bug #5 (complete) chưa test được | Thấp | Thấp | Ghi rõ blocked Q4. Test thêm khi phase 06 mở |

## Security Considerations

- Test DB local — không chạm production
- Test data cleanup sau mỗi test (pattern chuẩn của repo)
- Không hardcode credential trong test
- Unit test executeAction: mock DB — không cần credential/DB thật (F10)

## Next Steps

→ Phase 06 (BLOCKED): Refund/resubmit policy (T12-T15) sau khi Q1, Q3, Q4 được chốt.
→ Sau phase 06: Xóa symflow, dọn code cũ (case-workflow.ts, case-workflow-engine.ts).
