# Phase 02 — Machine Definition (XState là Single Source of Truth)

- Priority: P1 | Status: Pending | Effort: **2h** (giảm từ 3h — bỏ transition table tay)
- Depends: Phase 01 (xstate + types)
- Blocks: Phase 03

## Overview

Định nghĩa XState machine `caseMachine` — **single source of truth** cho toàn bộ workflow. Mọi thứ: state, transition, guard, action — đều khai báo trong machine. Runtime dùng `transition()` + `resolveState()` (XState v5 native, KHÔNG actor). Không có transition table tay, không duplicate code.

> **CORRECTION 2026-08-11:** `transition(machine, state, event)` standalone VẪN TỒN TẠI trong XState v5.20.1 (verified từ source repo). Chỉ `machine.transition(state, event)` instance method bị bỏ. Plan trước nhầm — giờ điều chỉnh về đúng thiết kế của researcher-02.

> **Red Team áp dụng:** F4 (validate state), F12 (T12-T15 đầy đủ — policy chốt), F15 (bỏ wrapper thừa).

## Key Insights

- **Machine là source of truth.** Chỉ 1 nơi định nghĩa: state nào → transition nào → guard nào → action nào. Không có bảng TRANSITIONS tay để drift.
- **Stateless pattern canonical của XState:** `resolveState(value)` restore từ DB → `transition(machine, snapshot, event)` → được `[nextSnapshot, actionDescriptors]` → ghi DB + executor loop.
- **`transition()` trả về tuple `[MachineSnapshot, ActionSnapshot[]]`.** Actions là object mô tả `{ type, ... }` — KHÔNG tự chạy. Executor loop (Phase 03) chịu trách nhiệm await từng action.
- **Guard được XState kiểm tra.** `transition()` chạy tất cả guard của transition đó. Nếu guard fail → trả về snapshot KHÔNG ĐỔI (cùng value, 0 action). Nếu guard pass → snapshot mới + action list.
- **Self-transition detection:** self-loop (vd T2 triage_pending → triage_pending) có `value` không đổi NHƯNG `actions.length > 0`. Guard fail có `value` không đổi VÀ `actions.length === 0`. Phân biệt được.
- **Context rỗng `{}`** — dữ liệu case nằm trong event (pre-fetched từ DB trong transaction — Phase 03). Machine không giữ data.
- **KHÔNG map stage ở đây** — `TARGET_STAGE` từng transition nằm ở Phase 03 (F1).
- **Guard KHÔNG nhận `event.actor.role`** làm nguồn tin cậy — role được service inject từ session (F6). Guard đọc `event.data.roleVerified`.

## Requirements

1. XState machine `caseMachine` — 8 state nodes, 16 transitions, 9 guards, 9 actions
2. Machine compile với `setup({ types, guards, actions }).createMachine({...})`
3. `tryTransition(currentStatus, event)` — wrap XState `resolveState()` + `transition()` → return `{ to, actions[] }` hoặc null
4. `getAvailableTransitions(status)` — derive từ `caseMachine.states[status].on` keys
5. `isValidState(status)` — validate status string trước khi restore
6. `isBlockedTransition(name)` — luôn false (policy đã chốt, giữ compatibility)
7. Tất cả guard/action khai báo trong `setup()` — 1 nơi duy nhất
8. **KHÔNG** có bảng TRANSITIONS tay. **KHÔNG** có `tryTransition` table lookup. **KHÔNG** có `ACTION_FACTORIES` object riêng.

## Architecture

```
apps/api/src/modules/cases/domain/case-machine.ts (MỚI ~180 dòng)

  ┌─ setup({ types, guards, actions }) ─┐
  │                                       │
  │  9 guards (pure, sync):               │
  │    isOwnerOrMember, isOwner,          │
  │    isAssignedSupporter, isAdmin,      │
  │    isSupporter, hasCredit,            │
  │    isWithin48h, isBeforeSubmission,   │
  │    reasonMinLength                    │
  │                                       │
  │  9 actions (descriptor, no-op):       │
  │    upsertDoc, subtractCredit,         │
  │    refundCredit, setSlaDeadline,      │
  │    autoResumeWork, resetStatus,       │
  │    notifyUser, emitStageChanged,      │
  │    lockPrice                          │
  │                                       │
  └───────────────────────────────────────┘
                    │
                    ▼
  ┌─ createMachine({...}) ───────────────┐
  │                                       │
  │  states: {                            │
  │    triage_pending:    5 transitions   │
  │    accepted_unassigned: 2 transitions │
  │    assigned:          3 transitions   │
  │    supporter_working: 5 transitions   │
  │    waiting_user:      2 transitions   │
  │    report_ready_to_publish: 2 trans.  │
  │    done (final):      2 transitions   │
  │    cancelled (final): 2 transitions   │
  │  }                                    │
  │                                       │
  └───────────────────────────────────────┘
                    │
                    ▼
  ┌─ Runtime helpers ────────────────────┐
  │                                       │
  │  tryTransition(status, event)         │
  │    → resolveState() + transition()    │
  │    → { to, actions[] } | null         │
  │                                       │
  │  getAvailableTransitions(status)      │
  │    → TransitionName[]                 │
  │                                       │
  │  isValidState(status) → bool          │
  │  isBlockedTransition(name) → bool     │
  │                                       │
  └───────────────────────────────────────┘
```

## Implementation

### case-machine.ts

```typescript
// apps/api/src/modules/cases/domain/case-machine.ts (MỚI)

import { setup, transition } from 'xstate'
import type {
  TransitionName, TransitionEvent, InternalStatus,
  CaseStage, ActionDescriptor,
} from './transition.types.js'
import { AppError } from '../../../shared/domain/app-error.js'

// ── XState Machine (SINGLE SOURCE OF TRUTH) ────────────────────────────────

export const caseMachine = setup({
  types: {
    context: {} as Record<string, never>,
    events: {} as TransitionEvent,
  },

  // ── Guards (pure functions, sync — checked by XState) ──────────────────
  //
  // Guard CHỈ check data có sẵn trong event (pre-fetched trong tx — Phase 03).
  // KHÔNG gọi DB, KHÔNG side effect, KHÔNG async.
  // F6: roleVerified từ session (service inject), KHÔNG tin event.actor.role.

  guards: {
    isOwnerOrMember: ({ event }) =>
      event.data?.actorId === event.data?.caseOwnerId,

    isOwner: ({ event }) =>
      event.data?.actorId === event.data?.caseOwnerId,

    isAssignedSupporter: ({ event }) =>
      event.data?.actorId === event.data?.caseAssignedSupporterId,

    isAdmin: ({ event }) =>
      event.data?.roleVerified === 'ADMIN',

    isSupporter: ({ event }) =>
      event.data?.roleVerified === 'SUPPORTER',

    // Kiến trúc 3 tầng: Wallet VND → mua credit → credit tiêu trong workflow.
    // Guard này check credit_ledgers (đơn vị dịch vụ), KHÔNG check wallet VND.
    // Wallet balance nằm ở tầng riêng — được check khi MUA credit, không phải khi DÙNG.
    // Free case (team_fit, price=0) → credit không cần → auto pass.
    hasCredit: ({ event }) => {
      if ((event.data?.lockedPrice as number) === 0) return true
      return (event.data?.creditBalance as number) >= 1
    },

    isWithin48h: ({ event }) =>
      (Date.now() - new Date(event.data?.caseCreatedAt as string).getTime()) < 48 * 3600_000,

    isBeforeSubmission: ({ event }) =>
      event.data?.currentStage === 'intake_pending' || event.data?.currentStage === 'intake_ready',

    reasonMinLength: ({ event }) =>
      ((event.data?.reason as string)?.length ?? 0) >= 10,
  },

  // ── Actions (descriptors — KHÔNG thực thi ở đây) ───────────────────────
  //
  // XState gọi sync các hàm này trong transition(), nhưng chúng là no-op.
  // Action thật được Phase 03 executor loop xử lý (await DB trong tx).
  // Đây là thiết kế chuẩn XState: action = mô tả, thực thi = application code.

  actions: {
    upsertDoc:         () => {},
    subtractCredit:    () => {},
    refundCredit:      () => {},
    setSlaDeadline:    () => {},
    autoResumeWork:    () => {},
    resetStatus:       () => {},
    notifyUser:        () => {},
    emitStageChanged:  () => {},
    lockPrice:         () => {},
  },

}).createMachine({

  id: 'caseWorkflow',
  context: {},
  initial: 'triage_pending',

  states: {

    // ── triage_pending ───────────────────────────────────────────────────
    triage_pending: {
      on: {
        T2_SUBMIT_INTAKE: {
          target: 'triage_pending',        // self-loop — upsert doc, giữ stage
          guard: 'isOwnerOrMember',
          actions: 'upsertDoc',
        },
        T5_ACCEPT: {
          target: 'accepted_unassigned',   // admin duyệt → gán supporter
          guard: ['isAdmin', 'hasCredit'],
        },
        T16_EDIT_INTAKE: {
          target: 'triage_pending',        // self-loop — chỉnh sửa intake
          guard: 'isBeforeSubmission',
          actions: 'upsertDoc',
        },
        T12_REJECT: {
          target: 'cancelled',             // admin từ chối → case đóng
          guard: ['isAdmin', 'reasonMinLength'],
        },
        T15_CANCEL: {
          target: 'cancelled',             // chủ case tự hủy
          guard: 'isOwner',
        },
      },
    },

    // ── accepted_unassigned ──────────────────────────────────────────────
    accepted_unassigned: {
      on: {
        T6_ASSIGN_SUPPORTER: {
          target: 'assigned',              // admin gán supporter
          guard: 'isAdmin',
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    // ── assigned ─────────────────────────────────────────────────────────
    assigned: {
      on: {
        T7_START_WORK: {
          target: 'supporter_working',     // supporter bắt đầu làm
          guard: 'isAssignedSupporter',
          actions: 'setSlaDeadline',
        },
        T13_VETO: {
          target: 'cancelled',             // admin phủ quyết trong 48h
          guard: ['isAdmin', 'isWithin48h'],
          actions: 'refundCredit',
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    // ── supporter_working ────────────────────────────────────────────────
    supporter_working: {
      on: {
        T8_REQUEST_INFO: {
          target: 'waiting_user',          // supporter yêu cầu thêm thông tin
          guard: 'isAssignedSupporter',
          actions: 'notifyUser',
        },
        T10_START_REVIEW_REVISION: {
          target: 'supporter_working',     // self-loop — bắt đầu chấm bản sửa
          guard: 'isAssignedSupporter',
          actions: 'notifyUser',
        },
        T11_SUBMIT_OUTPUT: {
          target: 'report_ready_to_publish', // supporter nộp kết quả
          guard: ['isAssignedSupporter', 'hasCredit'],
          actions: ['subtractCredit', 'lockPrice'],
        },
        T13_VETO: {
          target: 'cancelled',             // admin phủ quyết
          guard: ['isAdmin', 'isWithin48h'],
          actions: 'refundCredit',
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    // ── waiting_user ─────────────────────────────────────────────────────
    waiting_user: {
      on: {
        T9_SUBMIT_REVISION: {
          target: 'supporter_working',     // user nộp bản sửa → tự resume
          guard: 'isOwnerOrMember',
          actions: 'upsertDoc',
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    // ── report_ready_to_publish ──────────────────────────────────────────
    report_ready_to_publish: {
      on: {
        T14_COMPLETE: {
          target: 'done',                  // supporter hoàn thành
          guard: 'isAssignedSupporter',
          actions: 'notifyUser',
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    // ── done (final) ─────────────────────────────────────────────────────
    done: {
      type: 'final' as const,
      on: {
        T3_RESUBMIT_AFTER_REJECT: {
          target: 'triage_pending',        // làm lại case bị reject
          guard: ['isOwner', 'hasCredit'],
          actions: ['upsertDoc', 'resetStatus'],
        },
        T4_RESUBMIT_AFTER_VETO: {
          target: 'triage_pending',        // làm lại case bị veto
          guard: 'isOwner',
          actions: ['upsertDoc', 'resetStatus'],
        },
      },
    },

    // ── cancelled (final) ────────────────────────────────────────────────
    cancelled: {
      type: 'final' as const,
      on: {
        T3_RESUBMIT_AFTER_REJECT: {
          target: 'triage_pending',
          guard: ['isOwner', 'hasCredit'],
          actions: ['upsertDoc', 'resetStatus'],
        },
        T4_RESUBMIT_AFTER_VETO: {
          target: 'triage_pending',
          guard: 'isOwner',
          actions: ['upsertDoc', 'resetStatus'],
        },
      },
    },

  },
})

// ── Runtime Helpers ────────────────────────────────────────────────────────

export const VALID_STATES: readonly InternalStatus[] = [
  'triage_pending', 'accepted_unassigned', 'assigned', 'supporter_working',
  'waiting_user', 'report_ready_to_publish', 'done', 'cancelled',
]

/** F4: validate status trước khi restore vào machine */
export function isValidState(status: string): status is InternalStatus {
  return VALID_STATES.includes(status as InternalStatus)
}

/**
 * tryTransition — stateless transition dùng XState native API.
 *
 * Pattern:
 *   1. resolveState(value) → khôi phục snapshot từ DB string
 *   2. transition(machine, snapshot, event) → XState chạy guard + trả [nextSnapshot, actions]
 *   3. Phân biệt guard-fail vs self-transition:
 *      - Guard fail:   value không đổi + actions.length === 0
 *      - Self-loop OK:  value không đổi + actions.length > 0
 *      - Transition OK: value thay đổi (actions có thể có hoặc không)
 *
 * Returns { to, actions[] } nếu transition hợp lệ, null nếu guard fail.
 */
export function tryTransition(
  currentStatus: string,
  event: TransitionEvent,
): { to: InternalStatus; actions: ActionDescriptor[] } | null {
  if (!isValidState(currentStatus)) {
    throw new AppError(500, 'CORRUPT_STATE', `internal_status không hợp lệ: ${currentStatus}`)
  }

  // Khôi phục snapshot từ DB string — XState native
  const resolved = caseMachine.resolveState({ value: currentStatus })

  // Chạy transition — XState native (chạy guard bên trong)
  const [nextSnapshot, actionSnapshots] = transition(caseMachine, resolved, event)

  const stateChanged = nextSnapshot.value !== currentStatus
  const hasActions = actionSnapshots.length > 0

  // Guard fail: không đổi state, không có action
  if (!stateChanged && !hasActions) return null

  // Trích xuất action descriptors từ XState action snapshots
  const actions: ActionDescriptor[] = actionSnapshots.map(a => ({
    type: (a as any).type as ActionDescriptor['type'],
    params: (a as any).params,
  }))

  return {
    to: nextSnapshot.value as InternalStatus,
    actions,
  }
}

/** Mọi transition đã active (policy chốt 2026-08-09) */
export function isBlockedTransition(_name: TransitionName): boolean {
  return false
}

/**
 * Danh sách transition khả dụng từ 1 state.
 * Derive từ XState machine config — KHÔNG viết tay.
 */
export function getAvailableTransitions(status: string): TransitionName[] {
  if (!isValidState(status)) return []
  const stateNode = (caseMachine.config as any).states?.[status]
  if (!stateNode?.on) return []
  return Object.keys(stateNode.on) as TransitionName[]
}
```

## Design Decisions

| Quyết định | Lý do |
|---|---|
| Machine là single source of truth | Tránh drift giữa TRANSITIONS table tay và machine — nguyên nhân #1 bug workflow |
| `transition()` + `resolveState()` | XState native API cho stateless pattern. Verified tồn tại trong v5.20.1 |
| Actions trong setup() là no-op | XState action = sync, không await DB. No-op trong machine, thực thi ở Phase 03 executor |
| Guard check `event.data.roleVerified` | F6: role từ session, không tin `event.actor.role` từ caller |
| Self-transition detect bằng `actions.length > 0` | Self-loop (T2, T10, T16) có action (upsertDoc/notifyUser). Guard fail có 0 action. Phân biệt được |
| Context rỗng `{}` | Dữ liệu case qua event.data (pre-fetched trong tx). Machine giữ thuần logic, không giữ data |
| BỎ `TransitionDef`, bỎ `ACTION_FACTORIES` | Không còn transition table tay. Machine `states.on` thay thế hoàn toàn |
| BỎ `case-machine` (doc only) như cũ | Machine giờ LÀ runtime — không còn "machine doc song song table" |
| `getAvailableTransitions` derive từ machine config | Không có bảng thứ 2 để drift. Mọi thứ từ machine |

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/cases/domain/case-machine.ts` | **MỚI** — machine + helpers |
| `apps/api/src/modules/cases/domain/transition.types.ts` | Tham chiếu (types từ Phase 01) |
| `apps/api/src/modules/cases/domain/case-workflow.ts` | KHÔNG đụng (symflow, giữ song song) |

## Todo List

- [ ] Tạo `case-machine.ts` — XState machine với `setup({ types, guards, actions })`
- [ ] Định nghĩa 9 guards trong setup() — pure functions, sync
- [ ] Định nghĩa 9 actions trong setup() — no-op descriptors
- [ ] Định nghĩa 8 state nodes + 16 transitions trong createMachine()
- [ ] Implement `tryTransition` — resolveState + transition + self-loop detection
- [ ] Implement `getAvailableTransitions` — derive từ machine config
- [ ] Implement `isValidState` + `isBlockedTransition`
- [ ] Verify: `tryTransition('triage_pending', { type:'T5_ACCEPT', data:{ roleVerified:'ADMIN', creditBalance:1 } })` → `{ to:'accepted_unassigned', actions:[] }`
- [ ] Verify: `tryTransition('triage_pending', { type:'T5_ACCEPT', data:{ roleVerified:'ADMIN', creditBalance:0 } })` → null (guard hasCredit fail)
- [ ] Verify: self-loop `tryTransition('triage_pending', { type:'T2_SUBMIT_INTAKE', data:{ actorId:'u1', caseOwnerId:'u1' } })` → `{ to:'triage_pending', actions:[{ type:'upsertDoc' }] }` — **KHÔNG null**
- [ ] Verify: `tryTransition('supporter_working', { type:'T11_SUBMIT_OUTPUT', data:{...} })` → `{ to:'report_ready_to_publish', actions:[{ type:'subtractCredit' }, { type:'lockPrice' }] }`
- [ ] Verify: `tryTransition('invalid_status', ...)` → throw AppError CORRUPT_STATE
- [ ] Verify: `getAvailableTransitions('triage_pending')` → [T2, T5, T16, T12, T15]
- [ ] Verify: XState import trong Node không crash (ESM resolve OK)
- [ ] Verify: `npm run check-types` PASS

## Success Criteria

- `caseMachine` compile với `setup({ types, guards, actions }).createMachine({...})`
- `transition()` + `resolveState()` import được từ 'xstate' (v5.20.1)
- `tryTransition('triage_pending', T5 valid)` → `{ to: 'accepted_unassigned', actions: [] }`
- `tryTransition('triage_pending', T5 no-credit)` → null (guard fail — XState chặn)
- `tryTransition('triage_pending', T2 valid)` → `{ to: 'triage_pending', actions: [{ type: 'upsertDoc' }] }` (self-loop hợp lệ)
- `getAvailableTransitions` derive từ machine, không viết tay
- **KHÔNG** có TRANSITIONS table tay. **KHÔNG** có ACTION_FACTORIES object riêng
- **KHÔNG** có tryTransition table lookup. **KHÔNG** có `fromTransition()` hay `reducer table`
- Machine là nơi DUY NHẤT định nghĩa: state, transition, guard, action
- check-types root PASS

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `transition()` bị crash với event có data lớn/nested | Thấp | Thấp | event.data là flat object — không nested sâu. Verified pattern từ XState test suite |
| Self-transition detection sai (nhầm guard-fail với self-loop) | Thấp | Cao | Unit test verify: T2 → self-loop có action. T5 fail-credit → null. Action count là signal đáng tin |
| Machine config internal shape thay đổi trong XState minor version → getAvailableTransitions break | Thấp | Trung bình | Access `.config.states` là public API. Nếu đổi → unit test catch ngay. Fallback: map tay (10 dòng) |
| `actionSnapshots` type cast `as any` → type safety yếu | Trung bình | Thấp | XState ActionSnapshot type chưa public rõ params field. Cast an toàn vì chỉ extract type + params. Unit test verify đúng action names |

## Security Considerations

- Guard không gọi DB — không SQL injection vector
- Machine không export ra ngoài module (internal domain)
- Transition name được type-check qua `setup({ types: { events: {} as TransitionEvent } })`
- Guard role check dùng `roleVerified` từ session (F6)

## Next Steps

→ Phase 03: Viết CaseTransitionService dùng `tryTransition()` từ machine này. Executor loop xử lý actions.
