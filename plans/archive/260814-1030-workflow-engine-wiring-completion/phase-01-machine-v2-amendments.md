# Phase 01 — Machine v2 Amendments

- Priority: P1 | Status: Pending | Effort: 3h
- Depends: — | Blocks: Phase 02

## Overview

Sửa `apps/api/src/modules/cases/domain/case-machine.ts`: thêm state `triage_waiting` (D1), T6 self-loop trên `assigned` (D2), guard `isBeforeSubmission` giữ nguyên. Mở rộng test phase-07.

## Key Insights

- Machine hiện tại: T8 chỉ từ `supporter_working` → admin request-info lúc triage không mô hình được (bug #18 gốc)
- T6 từ `assigned` chưa định nghĩa → `assignSupporterUseCase` throw INVALID_TRANSITION khi reassign (broken hiện tại)
- XState v5: cùng event name định nghĩa ở nhiều state với guard khác nhau là hợp lệ — `transition()` stateless pattern đã dùng sẵn

## Architecture

```
triage_pending ──T8_REQUEST_INFO (guard and([isAdmin]))──> triage_waiting
triage_waiting  ──T2_SUBMIT_INTAKE (guard isOwnerOrMember, actions upsertDoc)──> triage_pending
triage_waiting  ──T12_REJECT (and([isAdmin, reasonMinLength]))──> cancelled
triage_waiting  ──T15_CANCEL (isOwner)──> cancelled
assigned        ──T6_ASSIGN_SUPPORTER (isAdmin, actions emitStageChanged)──> assigned   (self-loop reassign)
```

> **AMENDMENT R1 (red-team blocker #1):** `tryTransition` trả `null` khi `!stateChanged && !hasActions` (case-machine.ts:237-240). Self-loop KHÔNG action = dead on arrival → `executeTransition` throw 400. T6 self-loop **PHẢI mang action** `emitStageChanged` (no-op executor, giống T10 mang notifyUser). Test bắt buộc: `tryTransition('assigned', T6 admin)` trả non-null.

- `triage_waiting` thêm vào `VALID_STATES`
- `TARGET_STAGE` (case-transition.service.ts): T8 → `need_more_information` (đã có, dùng chung 2 state), T2 → `submitted` (đã có)
- Admin request-info trên case đang `supporter_working`: KHÔNG qua T8 — admin dùng T13 veto (documented)

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/cases/domain/case-machine.ts` | SỬA: +1 state, +4 transition, guard cập nhật |
| `apps/api/src/modules/cases/domain/transition.types.ts` | Tham chiếu: `InternalStatus` thêm `triage_waiting` |
| `apps/api/src/shared/infrastructure/tests/phase-07-xstate-case-machine.test.ts` | SỬA: test state mới + T6 reassign + ma trận |
| `apps/api/src/modules/cases/application/update-case-status.usecase.ts` | SỬA: thêm map `triage_pending:triage_waiting` → T8, `triage_waiting:triage_pending` → T2, `assigned:assigned` → T6 |

## Implementation Steps

1. Sửa `case-machine.ts`: thêm state `triage_waiting` với 4 transition trên; thêm T6 self-loop trong `assigned`
2. `VALID_STATES` += `triage_waiting`
3. Cập nhật `transition.types.ts` `InternalStatus` union
4. `update-case-status.usecase.ts` `XSTATE_TRANSITIONS` map: thêm `'triage_pending:triage_waiting': 'T8_REQUEST_INFO'`, `'triage_waiting:triage_pending': 'T2_SUBMIT_INTAKE'`, `'assigned:assigned': 'T6_ASSIGN_SUPPORTER'`
5. Test phase-07 mở rộng:
   - `triage_pending` + T8 admin → `triage_waiting`; supporter → null
   - `triage_waiting` + T2 owner → `triage_pending` + upsertDoc
   - `triage_waiting` + T9 → null (không định nghĩa)
   - `assigned` + T6 admin → **non-null self-loop có action emitStageChanged** (R1); non-admin → null
   - `getAvailableTransitions('triage_waiting')` → [T2, T12, T15]
6. Chạy `node --test` hoặc `npx tsx --test src/shared/infrastructure/tests/phase-07-xstate-case-machine.test.ts` → pass toàn bộ

## Success Criteria

- Machine: 9 states, tổng transitions tăng 16 → 20; test phase-07 pass
- Admin reassign hoạt động (không còn INVALID_TRANSITION)
- Admin request-info lúc triage → case vào `triage_waiting`; user nộp lại → về `triage_pending` stage `submitted` (fix #18 phần state)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| T8 trùng tên 2 state gây nhầm lẫn service | Thấp | Trung bình | Guard phân biệt isAdmin/isAssignedSupporter; test 2 đường |
| `triage_waiting` không sync với admin UI filter | Trung bình | Thấp | Admin page filter vẫn theo status list hiện có — thêm `triage_waiting` vào bucket triage (phase 6) |
| T2 từ `triage_waiting` đụng T2 từ `triage_pending` | Thấp | Thấp | Cùng event, khác state node — XState phân giải theo state hiện tại |

## Security Considerations

- T8 từ `triage_pending`: guard `isAdmin` — supporter không thể request-info trước khi assign
- T6 reassign: guard `isAdmin`
- T2 từ `triage_waiting`: guard `isOwnerOrMember`

## Next Steps

→ Phase 02: wire T2/T16/T11/T8 vào use case.
