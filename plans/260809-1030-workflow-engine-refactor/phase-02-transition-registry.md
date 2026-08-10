# Phase 02 — Transition Registry

- Priority: P1 | Status: Pending | Effort: 3h
- Depends: Phase 01 (xstate + types)
- Blocks: Phase 03

## Overview

B1: Viết `transition-registry.ts` — XState v5 machine config từ transition table v2. **Toàn bộ T1-T16 khai báo trong machine** (policy sản phẩm chốt 2026-08-09 — one-shot, hết blocker). Guard + action theo tên (strings).

> **Red Team áp dụng:** F4 (validate state), F9 (spike `._action`), F15 (bỏ wrapper thừa). F12 đã thay đổi: T12-T15 ban đầu bị block chờ Q — giờ Q đã chốt (validation session 2) → **khai báo đầy đủ**, `isBlockedTransition` không còn cần.

## Key Insights

- Dùng `setup({ types, guards, actions }).createMachine(...)` — guard/action theo tên string
- Pattern stateless: snapshot = `{value: status}` string đơn giản → `transition(machine, snapshot, event)` → trả `[nextState, actions[]]`
- Actions là **object mô tả** `{type: 'upsertDoc', params: {...}}` — executor loop tự await (phase 03)
- Internal status = state node name trong XState (mapping 1-1 từ internal_status cột DB)
- **KHÔNG có map stage 1:1 ở đây** — `targetStage` của từng transition nằm ở phase-03 `TARGET_STAGE` (F1: map 1:1 sai vì 1 internal_status → nhiều stage tùy ngữ cảnh, VD triage_pending → intake_pending (khởi tạo) nhưng → submitted (sau T2))
- Context rỗng `{}` — dữ liệu từ DB qua executor closure
- **Guard KHÔNG nhận `event.actor.role`** làm nguồn tin cậy — role phải được service inject từ session (F6, chi tiết phase-03)
- **Policy sản phẩm (chốt 2026-08-09, amended 2026-08-11):** T3 = hasCredit (Q1a), T4 = free (Q1b), T12 = no-refund (Q3), T13 = refund 100% → WalletService.refund() sau wallet plan (Q1b), T14 = isAssignedSupporter (Q4), T15 = isOwner no-refund (Q3), T5 = hasCredit, bỏ isPaid (Amendment #3 — credit mua từ ví VND)

## Requirements

1. 8 state nodes (internal_status làm state name): triage_pending, accepted_unassigned, assigned, supporter_working, waiting_user, report_ready_to_publish, done, cancelled
2. Transitions ACTIVE trên các state node (theo bảng v2): T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16 (mọi transition — hết blocked)
3. Guards active: isOwnerOrMember, isOwner, isAssignedSupporter, isAdmin, isSupporter, hasCredit, isWithin48h, isBeforeSubmission, reasonMinLength
4. Actions active: upsertDoc, subtractCredit, refundCredit (MỚI — T13), setSlaDeadline, autoResumeWork, resetStatus, notifyUser, emitStageChanged, lockPrice
5. `restoreMachine(status: string)` → validate status ∈ VALID_STATES rồi trả snapshot `{value: status}` (F4: resolveState throw nếu status không hợp lệ — check TRƯỚC)
6. T1 (createCase): KHÔNG phải transition — initial state string `'triage_pending'` trong machine. Bỏ `initialCaseTransition` helper (F15)
7. `isBlockedTransition(name): boolean` → **BỎ (trả `false` luôn)** — F12: không còn blocked transitions sau khi Q chốt; giữ signature để service không phải sửa

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
  hasCredit: ({ event }) => {
    // Free case (price=0, team_fit) → always pass. Paid case → check credit_balance >= 1.
    // Credit mua từ ví VND lúc tạo case — engine chỉ biết credit_ledgers, không biết VND.
    if (event.data.packagePrice === 0) return true;
    return event.data.creditBalance >= 1;
  },
  isWithin48h: ({ event }) => { /* case.created_at < 48h ago */ },
  isBeforeSubmission: ({ event }) => { /* case chưa nộp — stage intake_pending|intake_ready */ },
  reasonMinLength: ({ event }) => { /* event.data.reason.length >= 10 */ },
};
// KHÔNG còn blocked guard — T12-T15 + T3/T4 khai báo đầy đủ (policy chốt 2026-08-09)

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
          // F6: isAdmin — roleVerified từ session (service inject).
          // AMENDMENT 2026-08-11: bỏ isPaid — credit mua từ ví VND lúc tạo case.
          // hasCredit: check credit_balance >= 1 (paid) hoặc skip nếu free (price=0).
          // Sau wallet plan → hasCredit thay bằng WalletService.getBalance().
          guard: ['isAdmin', 'hasCredit'],
          actions: []
        },
        // T16: edit intake — giữ nguyên stage. AMENDMENT 2026-08-11: self-loop hợp lệ nhờ
        // actions ['upsertDoc'] — phân biệt với guard-fail (actions rỗng) trong tryTransition
        T16_EDIT_INTAKE: {
          target: 'triage_pending',
          guard: 'isBeforeSubmission',
          actions: ['upsertDoc']
        },
        // T12 reject thường — Q3: no-refund (case chưa duyệt, credit chưa trừ)
        T12_REJECT: {
          target: 'cancelled',
          guard: ['isAdmin', 'reasonMinLength'],
          actions: []
        },
        // T15 user hủy — Q3: no-refund
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
          actions: []
        },
      }
    },
    accepted_unassigned: {
      on: {
        T6_ASSIGN_SUPPORTER: {
          target: 'assigned', guard: 'isAdmin', actions: []
        },
        // T15: user hủy từ mọi stage mở
        T15_CANCEL: {
          target: 'cancelled', guard: 'isOwner', actions: []
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
        // T13 veto: từ under_review (assigned) trong 48h — Q1b: refund 100%
        T13_VETO: {
          target: 'cancelled',
          guard: ['isAdmin', 'isWithin48h'],
          actions: ['refundCredit']
        },
        T15_CANCEL: {
          target: 'cancelled', guard: 'isOwner', actions: []
        },
      }
    },
    supporter_working: {
      on: {
        T8_REQUEST_INFO: {
          target: 'waiting_user', guard: 'isAssignedSupporter', actions: ['notifyUser']
        },
        T10_START_REVIEW_REVISION: {
          target: 'supporter_working', guard: 'isAssignedSupporter',
          // AMENDMENT 2026-08-11: actions KHÔNG được rỗng — tryTransition phân biệt self-loop
          // hợp lệ với guard-fail dựa trên actions.length. notifyUser = no-op trong tx (L5).
          actions: ['notifyUser']
        },
        T11_SUBMIT_OUTPUT: {
          target: 'report_ready_to_publish',
          // F6: isAssignedSupporter. F2: hasCredit — balance fetch TRONG tx, nạp vào event.data.creditBalance → guard sync
          guard: ['isAssignedSupporter', 'hasCredit'],
          actions: ['subtractCredit']
        },
        // T13 veto: từ under_review (supporter_working) trong 48h — refund 100%
        T13_VETO: {
          target: 'cancelled',
          guard: ['isAdmin', 'isWithin48h'],
          actions: ['refundCredit']
        },
        T15_CANCEL: {
          target: 'cancelled', guard: 'isOwner', actions: []
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
        T15_CANCEL: {
          target: 'cancelled', guard: 'isOwner', actions: []
        },
      }
    },
    report_ready_to_publish: {
      // T14 complete — Q4: supporter tự đóng (isAssignedSupporter)
      on: {
        T14_COMPLETE: {
          target: 'done',
          guard: 'isAssignedSupporter',
          actions: ['notifyUser']
        },
        T15_CANCEL: {
          target: 'cancelled', guard: 'isOwner', actions: []
        },
      }
    },
    done: {
      // T3/T4 resubmit — Q1a (hasCredit) / Q1b (free)
      type: 'final' as const,
      on: {
        T3_RESUBMIT_AFTER_REJECT: {
          target: 'triage_pending',
          guard: ['isOwner', 'hasCredit'],   // Q1a: tốn credit nếu chưa hoàn
          actions: ['upsertDoc', 'resetStatus']
        },
        T4_RESUBMIT_AFTER_VETO: {
          target: 'triage_pending',
          guard: 'isOwner',                  // Q1b: free — veto đã refund
          actions: ['upsertDoc', 'resetStatus']
        },
      }
    },
    cancelled: {
      // T3/T4 resubmit — Q1a (hasCredit) / Q1b (free) — fix BP1: hết kẹt cancelled
      type: 'final' as const,
      on: {
        T3_RESUBMIT_AFTER_REJECT: {
          target: 'triage_pending',
          guard: ['isOwner', 'hasCredit'],
          actions: ['upsertDoc', 'resetStatus']
        },
        T4_RESUBMIT_AFTER_VETO: {
          target: 'triage_pending',
          guard: 'isOwner',
          actions: ['upsertDoc', 'resetStatus']
        },
      }
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

/** Thực thi 1 transition. Returns [nextState, actions[]] hoặc null nếu guard fail / không match.
 *  F15: bỏ wrapper resolveState/historyValue — snapshot = {value: status} string đơn giản.
 *  F9: SPIKE đầu phase — verify `._action` property tồn tại ở xstate@latest.
 *  Nếu không: đổi actions factory trả plain object `{type, params}` (không dùng `._action`).
 *  AMENDMENT 2026-08-11 (self-loop): guard fail / không match = XState trả state KHÔNG đổi VÀ actions rỗng.
 *  Self-transition HỢP LỆ (T16 edit intake, T10 start review) = state KHÔNG đổi NHƯNG actions KHÔNG rỗng.
 *  Phân biệt bằng actions. Lỗi cũ (check value giữ nguyên là đủ): T16/T10 luôn bị chặn oan. */
export function tryTransition(
  currentStatus: string,
  event: TransitionEvent
): [{ value: InternalStatus }, Array<{ type: string; params?: unknown }>] | null {
  const restored = restoreMachine(currentStatus);
  const [nextState, pendingActions] = transition(caseMachine, restored, event);

  // Guard fail / không match: state không đổi + không action nào thực thi
  if (nextState.value === currentStatus && pendingActions.length === 0) return null;

  return [nextState, pendingActions.map(a => {
    // Extract action type + params từ XState action object — VERIFY `._action` (F9)
    return typeof a === 'function' ? (a as any)._action ?? { type: 'unknown' } : a;
  })];
}

/** Mọi transition đã active (policy chốt 2026-08-09 — one-shot).
 *  Giữ signature để service không đổi — luôn trả false (F12 đã hết hiệu lực). */
export function isBlockedTransition(_name: TransitionName): boolean {
  return false;
}

/** F12 (hết hiệu lực): danh sách transition khả dụng từ 1 state —
 *  mọi transition khai báo trong machine đều active, không còn blocked */
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
- `isOwnerOrMember`, `isAssignedSupporter`, `hasCredit`, `isWithin48h`: service fetch case record/payment trong tx, nạp vào `event.data` → guard check data
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
- [ ] Implement `createMachine` với 8 state nodes + transitions: T2/T3/T4/T5/T6/T7/T8/T9/T10/T11/T12/T13/T14/T15/T16 (mọi transition — policy chốt)
- [ ] Implement `VALID_STATES` + `restoreMachine` (throw CORRUPT_STATE nếu invalid — F4)
- [ ] Implement `tryTransition` (bỏ wrapper resolveState/historyValue — F15), `isBlockedTransition`, `getAvailableTransitions` (filter blocked — F12)
- [ ] Verify: import trong Node không crash
- [ ] Verify: `tryTransition` trả null khi guard fail
- [ ] Verify: `getAvailableTransitions('triage_pending')` chứa T2/T5/T16/T12/T15 (mọi transition active — hết blocked, chốt 2026-08-09)
- [ ] **AMENDMENT 2026-08-11:** Verify `tryTransition('triage_pending', T16_EDIT_INTAKE)` trả tuple (KHÔNG null) — self-loop hợp lệ; và `tryTransition` trả null khi guard fail (event data thiếu)

## Success Criteria

- `transition-registry.ts` compile OK
- `restoreMachine('supporter_working')` + `tryTransition(..., T11_SUBMIT_OUTPUT)` → target `report_ready_to_publish`
- `restoreMachine('invalid_status')` → throw AppError CORRUPT_STATE (không crash lạ — F4)
- `isBlockedTransition('T14_COMPLETE')` → false (mọi transition active — hết blocked, chốt 2026-08-09)
- `getAvailableTransitions('triage_pending')` → T2/T5/T16/T12/T15 (mọi transition active)
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
