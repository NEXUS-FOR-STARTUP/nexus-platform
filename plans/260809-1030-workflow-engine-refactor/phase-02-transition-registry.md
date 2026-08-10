# Phase 02 — Transition Registry

- Priority: P1 | Status: Pending | Effort: 3h
- Depends: Phase 01 (xstate + types)
- Blocks: Phase 03

## Overview

B1: Viết `transition-registry.ts` — **XState v5-correct:** runtime dùng transition table (plain data, không `machine.transition()` — API v4 đã bỏ). XState machine `setup({types, guards}).createMachine({...})` giữ lại cho type-check + documentation. Guards/actions khai báo trong `setup()` trước, dùng string reference trong machine.

> **Red Team áp dụng:** F4 (validate state), F9 (spike `._action`), F15 (bỏ wrapper thừa). F12 đã thay đổi: T12-T15 ban đầu bị block chờ Q — giờ Q đã chốt (validation session 2) → **khai báo đầy đủ**, `isBlockedTransition` không còn cần.

## Key Insights

- **V5 API:** `transition()` standalone + `machine.transition(state, event)` → **bị bỏ trong v5**. Runtime dùng transition table (plain data). XState machine giữ lại cho type-check + documentation.
- Dùng `setup({ types, guards, actions }).createMachine(...)` — guard/action theo tên string, khai báo trong setup() trước.
- Pattern stateless: `tryTransition(status, event)` → lookup transition table → run guards sync → return `{to, actions[]}`. Không cần actor, không restore snapshot.
- Actions là **plain object** `{type: ActionName, params?: unknown}` — executor loop tự await (phase 03).
- Internal status = state node name (mapping 1-1 từ internal_status cột DB).
- **KHÔNG có map stage 1:1 ở đây** — `targetStage` của từng transition nằm ở phase-03 `TARGET_STAGE` (F1).
- Context rỗng `{}` — dữ liệu từ DB qua executor closure.
- **Guard KHÔNG nhận `event.actor.role`** làm nguồn tin cậy — role phải được service inject từ session (F6).

## Requirements

1. 8 state nodes (internal_status làm key): triage_pending, accepted_unassigned, assigned, supporter_working, waiting_user, report_ready_to_publish, done, cancelled
2. Transition table: mọi transition T2-T16 khai báo trong TRANSITIONS object (plain data)
3. Guards: 9 pure functions sync — isOwnerOrMember, isOwner, isAssignedSupporter, isAdmin, isSupporter, hasCredit, isWithin48h, isBeforeSubmission, reasonMinLength
4. Actions: 9 factory functions trả `ActionDescriptor` — upsertDoc, subtractCredit, refundCredit, setSlaDeadline, autoResumeWork, resetStatus, notifyUser, emitStageChanged, lockPrice
5. `tryTransition(status, event)` → lookup table → run guards → return `{to, actions[]}` hoặc null
6. `getAvailableTransitions(status)` → trả TransitionName[] từ TRANSITIONS table
7. XState machine `caseMachine` (documentation only): `setup({ types, guards }).createMachine({...})` — dùng để type-check + visual doc
8. T1 (createCase): initial state = 'triage_pending' trong machine. Bỏ `initialCaseTransition` helper (F15) — không bao giờ dùng

## Architecture (pseudocode) — XState v5

> **V5 changes from v4 (đã verify với docs 2026-08-11):**
> - `transition()` standalone import → **không tồn tại trong v5**. Thay bằng `fromTransition()` + reducer table.
> - `machine.transition(state, event)` → **bị bỏ**. V5 dùng `actor.getSnapshot().can(event)` hoặc transition table.
> - `._action` internal property → **không dùng**. Dùng plain data object `{type, params}` từ đầu.
> - `setup({ types, guards, actions }).createMachine({...})` → guards/actions bắt buộc khai báo trong `setup()` trước, machine dùng string reference.

### Pattern: Transition Table + XState Machine (song song)

XState machine dùng cho **documentation, type-checking, và visual diagram**. Runtime `tryTransition` dùng **plain transition table** — không cần actor, không có `.can()` overhead, không restore snapshot. Lý do: stateless workflow (16 transitions, không actor nền chạy dài) → transition table đơn giản hơn, nhanh hơn, và không phụ thuộc XState internal API.

```typescript
// apps/api/src/modules/cases/domain/transition-registry.ts (MỚI ~200 dòng)

import type {
  TransitionName, TransitionEvent, TransitionContext,
  InternalStatus, GuardName, ActionName, TransitionDef
} from './transition.types.js';
import { AppError } from '../../../shared/domain/app-error.js';

// ── Transition Table (plain data — runtime engine) ────────────────────────

/**
 * Mỗi transition: { name, guard[], from, to, actions[] }
 * Guards check event.data (pre-fetched trong tx bởi CaseTransitionService — F2).
 * Actions trả plain object {type, params} — executor loop tự await (phase 03).
 * T1 (createCase) KHÔNG phải transition → initial state = 'triage_pending'.
 */
const TRANSITIONS: Record<string, TransitionDef[]> = {
  triage_pending: [
    T2('T2_SUBMIT_INTAKE',    ['isOwnerOrMember'],                         'triage_pending',             ['upsertDoc']),
    T5('T5_ACCEPT',           ['isAdmin', 'hasCredit'],                    'accepted_unassigned',        []),
    T16('T16_EDIT_INTAKE',    ['isBeforeSubmission'],                      'triage_pending',             ['upsertDoc']),
    T12('T12_REJECT',         ['isAdmin', 'reasonMinLength'],              'cancelled',                  []),
    T15('T15_CANCEL',         ['isOwner'],                                 'cancelled',                  []),
  ],
  accepted_unassigned: [
    T6('T6_ASSIGN_SUPPORTER', ['isAdmin'],                                 'assigned',                   []),
    T15('T15_CANCEL',         ['isOwner'],                                 'cancelled',                  []),
  ],
  assigned: [
    T7('T7_START_WORK',       ['isAssignedSupporter'],                     'supporter_working',          ['setSlaDeadline']),
    T13('T13_VETO',           ['isAdmin', 'isWithin48h'],                  'cancelled',                  ['refundCredit']),
    T15('T15_CANCEL',         ['isOwner'],                                 'cancelled',                  []),
  ],
  supporter_working: [
    T8('T8_REQUEST_INFO',     ['isAssignedSupporter'],                     'waiting_user',               ['notifyUser']),
    T10('T10_START_REVIEW_REVISION', ['isAssignedSupporter'],              'supporter_working',          ['notifyUser']),
    T11('T11_SUBMIT_OUTPUT',  ['isAssignedSupporter', 'hasCredit'],        'report_ready_to_publish',    ['subtractCredit']),
    T13('T13_VETO',           ['isAdmin', 'isWithin48h'],                  'cancelled',                  ['refundCredit']),
    T15('T15_CANCEL',         ['isOwner'],                                 'cancelled',                  []),
  ],
  waiting_user: [
    T9('T9_SUBMIT_REVISION',  ['isOwnerOrMember'],                         'supporter_working',          ['upsertDoc', 'autoResumeWork']),
    T15('T15_CANCEL',         ['isOwner'],                                 'cancelled',                  []),
  ],
  report_ready_to_publish: [
    T14('T14_COMPLETE',       ['isAssignedSupporter'],                     'done',                       ['notifyUser']),
    T15('T15_CANCEL',         ['isOwner'],                                 'cancelled',                  []),
  ],
  done: [
    T3('T3_RESUBMIT_AFTER_REJECT', ['isOwner', 'hasCredit'],                 'triage_pending',             ['upsertDoc', 'resetStatus']),
    T4('T4_RESUBMIT_AFTER_VETO',   ['isOwner'],                                 'triage_pending',             ['upsertDoc', 'resetStatus']),
  ],
  cancelled: [
    T3('T3_RESUBMIT_AFTER_REJECT', ['isOwner', 'hasCredit'],                 'triage_pending',             ['upsertDoc', 'resetStatus']),
    T4('T4_RESUBMIT_AFTER_VETO',   ['isOwner'],                                 'triage_pending',             ['upsertDoc', 'resetStatus']),
  ],
};

/** Builder helper — tránh lặp type object literal */
function T(
  name: TransitionName, guard: GuardName[], to: InternalStatus,
  actions: ActionName[],
): TransitionDef {
  return { name, guard, to, actions };
}

// ── Guards (pure functions, sync, no DB) ─────────────────────────────────

/**
 * Mỗi guard nhận ({event}) → boolean.
 * Guard CHỈ check data có sẵn trong event (pre-fetched TRONG tx — F2).
 * KHÔNG gọi DB, KHÔNG side effect, KHÔNG async.
 * F6: role lấy từ event.data.roleVerified (session), không tin event.actor.role.
 */
const GUARDS: Record<GuardName, (ctx: { event: TransitionEvent }) => boolean> = {
  isOwnerOrMember: ({ event }) => event.data.actorId === event.data.caseOwnerId,
  isOwner:          ({ event }) => event.data.actorId === event.data.caseOwnerId,
  isAssignedSupporter: ({ event }) => event.data.actorId === event.data.assignedSupporterId,
  isAdmin:          ({ event }) => event.data.roleVerified === 'ADMIN',
  isSupporter:      ({ event }) => event.data.roleVerified === 'SUPPORTER',
  hasCredit:        ({ event }) => {
    if (event.data.packagePrice === 0) return true;
    return event.data.creditBalance >= 1;
  },
  isWithin48h:      ({ event }) => {
    return (Date.now() - new Date(event.data.caseCreatedAt).getTime()) < 48 * 3600_000;
  },
  isBeforeSubmission: ({ event }) => {
    return event.data.currentStage === 'intake_pending' || event.data.currentStage === 'intake_ready';
  },
  reasonMinLength:  ({ event }) => (event.data.reason?.length ?? 0) >= 10,
};

// ── Action factories (trả plain object — executor loop tự await) ─────────

const ACTION_FACTORIES: Record<ActionName, (event: TransitionEvent) => ActionDescriptor> = {
  upsertDoc:         (e) => ({ type: 'upsertDoc' as const,         params: e.data }),
  subtractCredit:    (e) => ({ type: 'subtractCredit' as const,    params: e.data }),
  refundCredit:      (e) => ({ type: 'refundCredit' as const,      params: e.data }),
  setSlaDeadline:    ()  => ({ type: 'setSlaDeadline' as const }),
  autoResumeWork:    ()  => ({ type: 'autoResumeWork' as const }),
  resetStatus:       ()  => ({ type: 'resetStatus' as const }),
  notifyUser:        ()  => ({ type: 'notifyUser' as const }),
  emitStageChanged:  ()  => ({ type: 'emitStageChanged' as const }),
  lockPrice:         ()  => ({ type: 'lockPrice' as const }),
};

// ── Helper functions ──────────────────────────────────────────────────────

export const VALID_STATES: readonly InternalStatus[] = [
  'triage_pending', 'accepted_unassigned', 'assigned', 'supporter_working',
  'waiting_user', 'report_ready_to_publish', 'done', 'cancelled',
];

/** F4: validate status TRƯỚC khi dùng */
export function isValidState(status: string): status is InternalStatus {
  return VALID_STATES.includes(status as InternalStatus);
}

/**
 * Stateless transition check — v5 không có machine.transition().
 * Dùng transition table thay vì actor snapshot (không cần restore, không overhead).
 *
 * Returns { to, actions[] } nếu guard pass → null nếu không match hoặc guard fail.
 * Self-transition (to === from) hợp lệ khi actions.length > 0 — phân biệt với guard-fail.
 */
export function tryTransition(
  currentStatus: string,
  event: TransitionEvent,
): { to: InternalStatus; actions: ActionDescriptor[] } | null {
  if (!isValidState(currentStatus)) {
    throw new AppError(500, 'CORRUPT_STATE', `internal_status không hợp lệ: ${currentStatus}`);
  }

  const transitions = TRANSITIONS[currentStatus];
  if (!transitions) return null;

  const def = transitions.find(t => t.name === event.type);
  if (!def) return null;

  // Run all guards
  const allPassed = def.guard.every(gName => {
    const guardFn = GUARDS[gName];
    return guardFn({ event });
  });

  if (!allPassed) return null;

  // Build action descriptors
  const actions = def.actions.map(aName => ACTION_FACTORIES[aName](event));

  return { to: def.to, actions };
}

/** Mọi transition đã active (policy chốt). Giữ signature cho compatibility. */
export function isBlockedTransition(_name: TransitionName): boolean {
  return false;
}

/** Danh sách transition khả dụng từ 1 state (cho FE render nút) */
export function getAvailableTransitions(status: string): TransitionName[] {
  const transitions = TRANSITIONS[status];
  if (!transitions) return [];
  return transitions.map(t => t.name);
}

// ── XState machine (documentation + types, NOT runtime engine) ────────────
//
// Machine này tồn tại để:
// 1. Type-check transition names (setup types → TS error nếu sai tên)
// 2. Visual document statechart (export ra Stately Studio nếu cần)
// 3. Unit test snapshot (verify machine structure khớp transition table)
// KHÔNG dùng cho runtime tryTransition — dùng transition table ở trên.

import { setup } from 'xstate';

const caseMachine = setup({
  types: {
    context: {} as TransitionContext,
    events: {} as TransitionEvent,
  },
  guards: {
    isOwnerOrMember:     GUARDS.isOwnerOrMember as any,
    isOwner:             GUARDS.isOwner as any,
    isAssignedSupporter: GUARDS.isAssignedSupporter as any,
    isAdmin:             GUARDS.isAdmin as any,
    isSupporter:         GUARDS.isSupporter as any,
    hasCredit:           GUARDS.hasCredit as any,
    isWithin48h:         GUARDS.isWithin48h as any,
    isBeforeSubmission:  GUARDS.isBeforeSubmission as any,
    reasonMinLength:     GUARDS.reasonMinLength as any,
  },
  actions: {},
}).createMachine({
  id: 'caseWorkflow',
  context: {},
  initial: 'triage_pending',
  states: {
    triage_pending: {
      on: {
        T2_SUBMIT_INTAKE:   { target: 'triage_pending',           guard: ['isOwnerOrMember'] },
        T5_ACCEPT:          { target: 'accepted_unassigned',      guard: ['isAdmin', 'hasCredit'] },
        T16_EDIT_INTAKE:    { target: 'triage_pending',           guard: 'isBeforeSubmission' },
        T12_REJECT:         { target: 'cancelled',                guard: ['isAdmin', 'reasonMinLength'] },
        T15_CANCEL:         { target: 'cancelled',                guard: 'isOwner' },
      }
    },
    accepted_unassigned: {
      on: {
        T6_ASSIGN_SUPPORTER:{ target: 'assigned',                 guard: 'isAdmin' },
        T15_CANCEL:         { target: 'cancelled',                guard: 'isOwner' },
      }
    },
    assigned: {
      on: {
        T7_START_WORK:      { target: 'supporter_working',        guard: 'isAssignedSupporter' },
        T13_VETO:           { target: 'cancelled',                guard: ['isAdmin', 'isWithin48h'] },
        T15_CANCEL:         { target: 'cancelled',                guard: 'isOwner' },
      }
    },
    supporter_working: {
      on: {
        T8_REQUEST_INFO:    { target: 'waiting_user',             guard: 'isAssignedSupporter' },
        T10_START_REVIEW_REVISION: { target: 'supporter_working',        guard: 'isAssignedSupporter' },
        T11_SUBMIT_OUTPUT:  { target: 'report_ready_to_publish',  guard: ['isAssignedSupporter', 'hasCredit'] },
        T13_VETO:           { target: 'cancelled',                guard: ['isAdmin', 'isWithin48h'] },
        T15_CANCEL:         { target: 'cancelled',                guard: 'isOwner' },
      }
    },
    waiting_user: {
      on: {
        T9_SUBMIT_REVISION: { target: 'supporter_working',        guard: 'isOwnerOrMember' },
        T15_CANCEL:         { target: 'cancelled',                guard: 'isOwner' },
      }
    },
    report_ready_to_publish: {
      on: {
        T14_COMPLETE:       { target: 'done',                     guard: 'isAssignedSupporter' },
        T15_CANCEL:         { target: 'cancelled',                guard: 'isOwner' },
      }
    },
    done: {
      type: 'final' as const,
      on: {
        T3_RESUBMIT_AFTER_REJECT: { target: 'triage_pending',           guard: ['isOwner', 'hasCredit'] },
        T4_RESUBMIT_AFTER_VETO:   { target: 'triage_pending',           guard: 'isOwner' },
      }
    },
    cancelled: {
      type: 'final' as const,
      on: {
        T3_RESUBMIT_AFTER_REJECT: { target: 'triage_pending',           guard: ['isOwner', 'hasCredit'] },
        T4_RESUBMIT_AFTER_VETO:   { target: 'triage_pending',           guard: 'isOwner' },
      }
    },
  }
});

export { caseMachine };
```

**LƯU Ý quan trọng về guard implementation (v5):**
- Guard trong XState v5 chạy **sync** — không await DB. Pattern: service (phase-03) fetch data TRONG transaction rồi nạp vào `event.data` → guard chỉ check data đã có
- `isOwnerOrMember`, `isAssignedSupporter`, `hasCredit`, `isWithin48h`: service fetch case record/payment trong tx, nạp vào `event.data` → guard check data
- `hasCredit` (T11): service fetch credit balance TRONG tx, nạp `event.data.creditBalance` → guard check (F2 — chống TOCTOU)
- **F6:** `isAdmin`/`isSupporter` check `event.data.roleVerified` — service inject từ session, KHÔNG tin `event.actor.role`
- Đây là thiết kế chuẩn XState: guard = pure function, không side effect
- **Không dùng `transition()`, `machine.transition()`, `snapshot.can()`** cho runtime — đây là API v4 đã bỏ hoặc không phù hợp stateless pattern. Dùng transition table lookup.

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/cases/domain/transition.types.ts` | Tham chiếu (từ phase 01) |
| `apps/api/src/modules/cases/domain/transition-registry.ts` | **MỚI** |
| `apps/api/src/modules/cases/domain/case.types.ts` | Tham chiếu (stage constants) |
| `apps/api/src/modules/cases/domain/case-workflow.ts` | KHÔNG đụng (symflow, giữ song song) |

## Todo List

- [ ] Tạo `transition-registry.ts`
- [ ] Implement TRANSITIONS table (plain data — 8 state keys, 15 transition entries)
- [ ] Implement 9 GUARDS (pure functions, sync, check event.data)
- [ ] Implement 9 ACTION_FACTORIES (trả plain object `{type, params}`)
- [ ] Implement `tryTransition` (table lookup → guards → return `{to, actions}` hoặc null)
- [ ] Implement `getAvailableTransitions` (trả TransitionName[] từ table)
- [ ] Implement `isValidState` + `isBlockedTransition` (compatibility)
- [ ] Build XState machine `caseMachine` với `setup({types, guards}).createMachine({...})` cho doc
- [ ] Verify: `tryTransition('triage_pending', T5_ACCEPT)` với roleVerified='ADMIN' + creditBalance=1 → `{to:'accepted_unassigned', actions:[]}`
- [ ] Verify: `tryTransition('triage_pending', T5_ACCEPT)` với creditBalance=0 → null (guard fail)
- [ ] Verify: self-loop `tryTransition('triage_pending', T16_EDIT_INTAKE)` → `{to:'triage_pending', actions:[{type:'upsertDoc'}]}` — KHÔNG null
- [ ] Verify: `getAvailableTransitions('triage_pending')` → ['T2_SUBMIT_INTAKE','T5_ACCEPT','T16_EDIT_INTAKE','T12_REJECT','T15_CANCEL']
- [ ] Verify: `tryTransition('invalid_status', ...)` → throw AppError CORRUPT_STATE (F4)
- [ ] Verify: import trong Node không crash (XState ESM resolve OK)
- [ ] Verify: XState machine compile OK với `setup({types, guards})` — type-check guard names

## Success Criteria

- `transition-registry.ts` compile OK
- `tryTransition('supporter_working', T11_SUBMIT_OUTPUT)` → `{to:'report_ready_to_publish', actions:[{type:'subtractCredit',...}]}`
- `tryTransition('invalid_status', ...)` → throw AppError CORRUPT_STATE (F4)
- `tryTransition('triage_pending', T5_ACCEPT)` creditBalance=0 → null (guard fail)
- `tryTransition('triage_pending', T16_EDIT_INTAKE)` → `{to:'triage_pending', actions:...}` — self-loop hợp lệ
- `getAvailableTransitions('triage_pending')` → T2/T5/T16/T12/T15
- Không có `transition()` import, không có `._action`, không có `restoreMachine`, không có `machine.transition()`
- XState `caseMachine` compile với `setup({types, guards})` — guard names type-checked
- `initialTransition`/`initialCaseTransition` không còn trong code (F15)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Guard sync pattern sai — cố await DB trong guard | Cao (junior trap) | Trung bình | Pseudocode + comment rõ: guard chỉ check data có sẵn trong event. Service fetch TRONG tx (F2) |
| Transition table + XState machine diverge (manual edit quên sync) | Trung bình | Cao | Unit test: build map từ XState machine states.on keys → assert = TRANSITIONS keys. Chạy CI mỗi PR |
| data prod có internal_status hỏng → isValidState fail | Thấp | Cao | VALID_STATES check + AppError CORRUPT_STATE (F4). Script validate data trước deploy (phase-06) |
| Quên import AppError path | Thấp | Trung bình | Verify `shared/domain/app-error.ts` (3-arg code) — F3 |
| XState ESM import fail trong Node (bundler issue) | Thấp | Thấp | Machine bị comment-out fallback vẫn hoạt động (runtime dùng table). Verify import đầu phase |

## Security Considerations

- Guard không gọi DB — không SQL injection vector
- Machine không export ra ngoài module (internal domain)
- Transition name được type-check (không string magic)
- Guard role check dùng `roleVerified` từ session (F6) — không tin event.actor.role

## Next Steps

→ Phase 03: Viết CaseTransitionService (executor 5 lớp) + chuyển submitRevisionUseCase qua cổng.
