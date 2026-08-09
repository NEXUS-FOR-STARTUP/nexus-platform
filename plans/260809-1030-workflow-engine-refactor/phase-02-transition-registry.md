# Phase 02 — Transition Registry

- Priority: P1 | Status: Pending | Effort: 3h
- Depends: Phase 01 (xstate + types)
- Blocks: Phase 03

## Overview

B1: Viết `transition-registry.ts` — XState v5 machine config từ transition table v2. Chỉ T1-T11+T16 active trong machine; T12-T15 KHÔNG khai báo trong `states.*.on` (tránh nút "ma" FE), chỉ tồn tại trong `isBlockedTransition` lookup. Guard + action theo tên (strings).

> **Red Team áp dụng:** F4 (validate state), F9 (spike `._action`), F12 (blocked transitions không khai báo trong machine), F15 (bỏ wrapper thừa).

## Key Insights

- Dùng `setup({ types, guards, actions }).createMachine(...)` — guard/action theo tên string
- Pattern stateless: snapshot = `{value: status}` string đơn giản → `transition(machine, snapshot, event)` → trả `[nextState, actions[]]`
- Actions là **object mô tả** `{type: 'upsertDoc', params: {...}}` — executor loop tự await (phase 03)
- Internal status = state node name trong XState (mapping 1-1 từ internal_status cột DB)
- **KHÔNG có map stage 1:1 ở đây** — `targetStage` của từng transition nằm ở phase-03 `TARGET_STAGE` (F1: map 1:1 sai vì 1 internal_status → nhiều stage tùy ngữ cảnh, VD triage_pending → intake_pending (khởi tạo) nhưng → submitted (sau T2))
- Context rỗng `{}` — dữ liệu từ DB qua executor closure
- **Guard KHÔNG nhận `event.actor.role`** làm nguồn tin cậy — role phải được service inject từ session (F6, chi tiết phase-03)

## Requirements

1. 8 state nodes (internal_status làm state name): triage_pending, accepted_unassigned, assigned, supporter_working, waiting_user, report_ready_to_publish, done, cancelled
2. Transitions ACTIVE trên các state node (theo bảng v2): T2, T5, T6, T7, T8, T9, T10, T11, T16
3. Guards active: isOwnerOrMember, isOwner, isAssignedSupporter, isAdmin, isSupporter, hasCredit, isPaid, isWithin48h, isBeforeSubmission, reasonMinLength
4. Actions active: upsertDoc, subtractCredit, setSlaDeadline, autoResumeWork, resetStatus, notifyUser, emitStageChanged, lockPrice
5. **T12-T15 KHÔNG khai báo trong `states.*.on`** — chỉ giữ `isBlockedTransition` lookup (F12: tránh getAvailableTransitions trả blocked → nút ma)
6. `restoreMachine(status: string)` → validate status ∈ VALID_STATES rồi trả snapshot `{value: status}` (F4: resolveState throw nếu status không hợp lệ — check TRƯỚC)
7. T1 (createCase): KHÔNG phải transition — initial state string `'triage_pending'` trong machine. Bỏ `initialCaseTransition` helper (F15)
8. `isBlockedTransition(name): boolean` → check T3/T4/T12/T13/T14/T15 (T3/T4 resubmit chờ Q1, chưa active)

## Architecture (pseudocode)

```typescript
// apps/api/src/modules/cases/domain/transition-registry.ts (MỚI ~180 dòng)

import { setup, createMachine, transition } from 'xstate';
import type {
  TransitionName, TransitionEvent, TransitionContext,
  StageStatus, GuardName, ActionName
} from './transition.types.js';

// ============================================================
// GUARDS — mỗi guard nhận ({context, event}) → boolean
// ============================================================
const guards = {
  isOwnerOrMember: ({ event }) => { /* event.actor.id === case.owner_id || member of case */ },
  isOwner: ({ event }) => { /* event.actor.id === case.owner_id */ },
  isAssignedSupporter: ({ event }) => { /* event.actor.id === case.assigned_supporter_id */ },
  // F6: role KHÔNG lấy từ event.actor.role — service inject roleVerified (từ session) vào event.data
  isAdmin: ({ event }) => { /* event.data.roleVerified === 'ADMIN' */ },
  isSupporter: ({ event }) => { /* event.data.roleVerified === 'SUPPORTER' */ },
  hasCredit: ({ event }) => { /* event.data.creditBalance >= 1 — fetch trong tx (F2) */ },
  isPaid: ({ event }) => { /* event.data.paymentStatus === 'paid' */ },
  isWithin48h: ({ event }) => { /* case.created_at < 48h ago */ },
  isBeforeSubmission: ({ event }) => { /* case chưa nộp — stage intake_pending|intake_ready */ },
  reasonMinLength: ({ event }) => { /* event.data.reason.length >= 10 */ },
};
// KHÔNG có blocked_Q1/Q3/Q4 guard — T12-T15 không khai báo trong machine (F12)

// ============================================================
// ACTIONS — mỗi action là factory trả object mô tả (async trong executor)
// ============================================================
const actions = {
  upsertDoc: ({ event }) => ({ type: 'upsertDoc' as ActionName, params: event.data }),
  subtractCredit: ({ event }) => ({ type: 'subtractCredit' as ActionName, params: event.data }),
  setSlaDeadline: () => ({ type: 'setSlaDeadline' as ActionName }),
  autoResumeWork: () => ({ type: 'autoResumeWork' as ActionName }),
  resetStatus: () => ({ type: 'resetStatus' as ActionName }),
  notifyUser: () => ({ type: 'notifyUser' as ActionName }),
  emitStageChanged: () => ({ type: 'emitStageChanged' as ActionName }),
  lockPrice: () => ({ type: 'lockPrice' as ActionName }),
};

// ============================================================
// MACHINE DEFINITION
// ============================================================
const caseMachine = setup({
  types: {
    context: {} as TransitionContext,
    events: {} as TransitionEvent,
  },
  guards,
  actions,
}).createMachine({
  context: {},
  initial: 'triage_pending',
  states: {
    triage_pending: {
      on: {
        T2_SUBMIT_INTAKE: {
          target: 'triage_pending',
          guard: 'isOwnerOrMember',
          actions: ['upsertDoc']
        },
        T5_ACCEPT: {
          target: 'accepted_unassigned',
          // F6: isAdmin — roleVerified từ session (service inject). F2: paymentStatus fetch TRONG tx, nạp vào event.data → guard isPaid (sync) check
          guard: ['isAdmin', 'isPaid'],
          actions: []
        },
        // T16: edit intake — giữ nguyên stage
        T16_EDIT_INTAKE: {
          target: 'triage_pending',
          guard: 'isBeforeSubmission',
          actions: ['upsertDoc']
        },
      }
    },
    accepted_unassigned: {
      on: {
        T6_ASSIGN_SUPPORTER: {
          target: 'assigned', guard: 'isAdmin', actions: []
        },
      }
    },
    assigned: {
      on: {
        T7_START_WORK: {
          target: 'supporter_working',
          guard: 'isAssignedSupporter',
          actions: ['setSlaDeadline']
        },
      }
    },
    supporter_working: {
      on: {
        T8_REQUEST_INFO: {
          target: 'waiting_user', guard: 'isAssignedSupporter', actions: ['notifyUser']
        },
        T10_START_REVIEW_REVISION: {
          target: 'supporter_working', guard: 'isAssignedSupporter', actions: []
        },
        T11_SUBMIT_OUTPUT: {
          target: 'report_ready_to_publish',
          // F6: isAssignedSupporter. F2: hasCredit — balance fetch TRONG tx, nạp vào event.data.creditBalance → guard sync
          guard: ['isAssignedSupporter', 'hasCredit'],
          actions: ['subtractCredit']
        },
      }
    },
    waiting_user: {
      on: {
        T9_SUBMIT_REVISION: {
          target: 'supporter_working',
          guard: 'isOwnerOrMember',
          actions: ['upsertDoc', 'autoResumeWork']
        },
      }
    },
    report_ready_to_publish: {
      // T14_COMPLETE, T13_VETO, T15_CANCEL: KHÔNG khai báo — blocked (F12), chờ Q1/Q3/Q4
      on: {}
    },
    done: {
      // T3/T4 resubmit: chờ Q1 — chưa khai báo
      type: 'final' as const,
      on: {}
    },
    cancelled: {
      // T3/T4 resubmit: chờ Q1 — chưa khai báo
      type: 'final' as const,
      on: {}
    }
  }
});

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/** 8 state hợp lệ — F4: validate TRƯỚC khi dùng, tránh resolveState crash với data hỏng */
export const VALID_STATES: readonly InternalStatus[] = [
  'triage_pending', 'accepted_unassigned', 'assigned', 'supporter_working',
  'waiting_user', 'report_ready_to_publish', 'done', 'cancelled',
];

/** Tái lập snapshot từ internal_status string (DB).
 *  F4: status không hợp lệ → throw AppError(500, 'CORRUPT_STATE') — KHÔNG để XState throw lạ. */
export function restoreMachine(status: string): { value: InternalStatus } {
  if (!VALID_STATES.includes(status as InternalStatus)) {
    throw new AppError(500, 'CORRUPT_STATE', `internal_status không hợp lệ: ${status}`);
  }
  return { value: status as InternalStatus };
}

/** Thực thi 1 transition. Returns [nextState, actions[]] hoặc null nếu guard fail.
 *  F15: bỏ wrapper resolveState/historyValue — snapshot = {value: status} string đơn giản.
 *  F9: SPIKE đầu phase — verify `._action` property tồn tại ở xstate@latest.
 *  Nếu không: đổi actions factory trả plain object `{type, params}` (không dùng `._action`). */
export function tryTransition(
  currentStatus: string,
  event: TransitionEvent
): [{ value: InternalStatus }, Array<{ type: string; params?: unknown }>] | null {
  const restored = restoreMachine(currentStatus);
  const [nextState, pendingActions] = transition(caseMachine, restored, event);

  // Guard fail → XState trả state không đổi (self-transition bị chặn)
  if (nextState.value === currentStatus) return null;

  return [nextState, pendingActions.map(a => {
    // Extract action type + params từ XState action object — VERIFY `._action` (F9)
    return typeof a === 'function' ? (a as any)._action ?? { type: 'unknown' } : a;
  })];
}

/** Check transition có bị blocked không (F12: T12-T15 + T3/T4 không khai báo trong machine,
 *  chỉ tồn tại ở đây → getAvailableTransitions không bao giờ trả chúng) */
export function isBlockedTransition(name: TransitionName): boolean {
  const blocked: TransitionName[] = [
    'T3_RESUBMIT_AFTER_REJECT', 'T4_RESUBMIT_AFTER_VETO',
    'T12_REJECT', 'T13_VETO', 'T14_COMPLETE', 'T15_CANCEL'
  ];
  return blocked.includes(name);
}

/** F12: danh sách transition khả dụng từ 1 state — CHỈ transition active trong machine,
 *  không bao giờ trả blocked (không khai báo trong states.*.on) */
export function getAvailableTransitions(status: string): TransitionName[] {
  const node = caseMachine.states[status];
  if (!node) return [];
  return Object.keys(node.on ?? {}) as TransitionName[];
}

// Export machine để test
export { caseMachine };
```

**LƯU Ý quan trọng về guard implementation:**
- Guard trong XState chạy **sync** — không await DB. Pattern: service (phase-03) fetch data TRONG transaction rồi nạp vào `event.data` → guard chỉ check data đã có
- `isOwnerOrMember`, `isAssignedSupporter`, `isPaid`, `isWithin48h`: service fetch case record/payment trong tx, nạp vào `event.data` → guard check data
- `hasCredit` (T11): service fetch credit balance TRONG tx, nạp `event.data.creditBalance` → guard check (F2 — chống TOCTOU)
- **F6:** `isAdmin`/`isSupporter` check `event.data.roleVerified` — service inject từ session, KHÔNG tin `event.actor.role`
- Đây là thiết kế chuẩn XState: guard = pure function, không side effect

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/cases/domain/transition.types.ts` | Tham chiếu (từ phase 01) |
| `apps/api/src/modules/cases/domain/transition-registry.ts` | **MỚI** |
| `apps/api/src/modules/cases/domain/case.types.ts` | Tham chiếu (stage constants) |
| `apps/api/src/modules/cases/domain/case-workflow.ts` | KHÔNG đụng (symflow, giữ song song) |

## Todo List

- [ ] **SPIKE (đầu phase, 15-30ph):** cài `xstate@latest`, verify `(a as any)._action` trên action object sau `transition()`. Không có → đổi actions factory trả plain object `{type, params}` (F9)
- [ ] Tạo `transition-registry.ts`
- [ ] Implement `setup({guards, actions})` với 10 guards + 8 actions (tên hàm, thân trong executor phase 03)
- [ ] Implement `createMachine` với 8 state nodes + transitions ACTIVE (T2/T5/T6/T7/T8/T9/T10/T11/T16) — T12-T15/T3/T4 KHÔNG khai báo (F12)
- [ ] Implement `VALID_STATES` + `restoreMachine` (throw CORRUPT_STATE nếu invalid — F4)
- [ ] Implement `tryTransition` (bỏ wrapper resolveState/historyValue — F15), `isBlockedTransition`, `getAvailableTransitions` (filter blocked — F12)
- [ ] Verify: import trong Node không crash
- [ ] Verify: `tryTransition` trả null khi guard fail
- [ ] Verify: `getAvailableTransitions('triage_pending')` KHÔNG chứa T12/T13/T15

## Success Criteria

- `transition-registry.ts` compile OK
- `restoreMachine('supporter_working')` + `tryTransition(..., T11_SUBMIT_OUTPUT)` → target `report_ready_to_publish`
- `restoreMachine('invalid_status')` → throw AppError CORRUPT_STATE (không crash lạ — F4)
- `isBlockedTransition('T14_COMPLETE')` → true
- `getAvailableTransitions('triage_pending')` → chỉ T2/T5/T16 (KHÔNG T12/T13/T15 — F12)
- `tryTransition('triage_pending', T5_ACCEPT)` với `paymentStatus='paid'` + `roleVerified='ADMIN'` → `accepted_unassigned`
- `tryTransition('triage_pending', T5_ACCEPT)` với `paymentStatus='unpaid'` → null (guard fail)
- Không crash khi import file (XState ESM resolve OK)
- `initialTransition`/`initialCaseTransition` không còn trong code (F15)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Guard sync pattern sai — cố await DB trong guard | Cao (junior trap) | Trung bình | Pseudocode + comment rõ: guard chỉ check data có sẵn trong event. Service fetch TRONG tx (F2) |
| `._action` internal API không tồn tại ở xstate@latest | Trung bình | Trung bình | SPIKE đầu phase (F9). Fallback: actions factory trả plain object — không đổi machine config |
| data prod có internal_status hỏng → restoreMachine crash | Thấp (nhưng data prod đã biết có split-brain) | Cao | VALID_STATES check + AppError CORRUPT_STATE (F4). Script validate data trước deploy (phase-06) |
| Quên import AppError path | Thấp | Trung bình | Verify `shared/domain/app-error.ts` (3-arg: status, code, message, details?) — F3 |

## Security Considerations

- Guard không gọi DB — không SQL injection vector
- Machine không export ra ngoài module (internal domain)
- Transition name được type-check (không string magic)
- Guard role check dùng `roleVerified` từ session (F6) — không tin event.actor.role

## Next Steps

→ Phase 03: Viết CaseTransitionService (executor 5 lớp) + chuyển submitRevisionUseCase qua cổng.
