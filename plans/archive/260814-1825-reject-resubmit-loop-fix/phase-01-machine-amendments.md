# Phase 01 — Machine Amendments

- Priority: P0 | Status: Done | Effort: 2h
- Depends: — | Blocks: Phase 02

## Overview

Sửa `apps/api/src/modules/cases/domain/case-machine.ts` 3 việc: T6 self-loop reassign (D12), bỏ T3/T4 khỏi `done` (D6), fix `TARGET_STAGE[T16]` (D8). **KHÔNG thêm state mới** (triage_waiting đã chết — D1 brainstorm).

## Key Insights

- T6 từ `assigned` chưa định nghĩa → `assignSupporterUseCase` throw INVALID_TRANSITION khi reassign (broken hiện tại)
- `tryTransition` trả `null` khi `!stateChanged && !hasActions` (case-machine.ts:237-240) → self-loop KHÔNG action = dead on arrival → T6 self-loop **PHẢI mang action** `emitStageChanged` (no-op executor)
- `done` hiện `type: 'final'` nhưng vẫn có T3/T4 (case-machine.ts:181-195) → trái quy tắc "completed khoá hết" (D6)
- `TARGET_STAGE[T16] = 'intake_pending'` (case-transition.service.ts:31) → sửa nháp `intake_ready` bị demote (D8)

## Changes

### 1. T6 self-loop trên `assigned` (D12 — kế thừa R1)

```
assigned ──T6_ASSIGN_SUPPORTER (guard isAdmin, actions emitStageChanged)──> assigned
```

### 2. Bỏ T3/T4 khỏi `done` (D6)

- Xóa khối `on` khỏi state `done` → `final` thật, `getAvailableTransitions('done')` → `[]`
- `cancelled` giữ nguyên T3/T4 (đây là đường nộp lại hợp lệ duy nhất)

### 3. TARGET_STAGE[T16] = 'intake_ready' (D8)

- `case-transition.service.ts`: T16 → `intake_ready` (giữ stage khi sửa nháp)

### 4. Không thêm gì khác

- KHÔNG thêm `triage_waiting` (bỏ D1 cũ — admin request-info bị xóa ở phase 02)
- KHÔNG đụng T8 supporter (`supporter_working` → `waiting_user` giữ nguyên, D10)

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/cases/domain/case-machine.ts` | SỬA: +T6 self-loop, bỏ T3/T4 khỏi done |
| `apps/api/src/services/case-transition.service.ts` | SỬA: TARGET_STAGE[T16] |
| `apps/api/src/modules/cases/application/update-case-status.usecase.ts` | SỬA: map `assigned:assigned` → T6 |
| `apps/api/src/shared/infrastructure/tests/phase-07-xstate-case-machine.test.ts` | SỬA: test T6 reassign, done terminal, T16 stage |

## Todo List

- [x] T6 self-loop + action emitStageChanged trong `assigned`
- [x] Bỏ khối `on` T3/T4 khỏi `done`
- [x] TARGET_STAGE[T16] = `intake_ready`
- [x] `update-case-status.usecase.ts` XSTATE_TRANSITIONS: thêm `'assigned:assigned': 'T6_ASSIGN_SUPPORTER'`
- [x] Test phase-07: T6 admin → non-null; non-admin → null; `getAvailableTransitions('done')` → `[]`; `getAvailableTransitions('cancelled')` → chứa T3/T4; T16 stage map
- [x] `npx tsx --test src/shared/infrastructure/tests/phase-07-xstate-case-machine.test.ts` → pass toàn bộ

## Success Criteria

- Admin reassign hoạt động (không còn INVALID_TRANSITION)
- Done là terminal thật — không đường nộp lại từ completed
- Sửa nháp intake_ready giữ nguyên stage

## Security Considerations

- T6 guard `isAdmin` — supporter không tự chuyển case
- `cancelled` T3/T4 guard giữ nguyên (`isOwner` / `isOwner` + `hasCredit`)

## Next Steps

→ Phase 02: BE nộp lại loop + wiring.
