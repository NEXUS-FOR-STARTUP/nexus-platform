import { setup, transition, and } from 'xstate'
import type {
  TransitionName, TransitionEvent, InternalStatus,
  ActionDescriptor,
} from './transition.types.js'
import { AppError } from '../../../shared/domain/app-error.js'

export const caseMachine = setup({
  types: {
    context: {} as Record<string, never>,
    events: {} as TransitionEvent,
  },

  guards: {
    isOwner: ({ event }) =>
      event.data?.actorId === event.data?.caseOwnerId,

    isAssignedSupporter: ({ event }) =>
      event.data?.actorId === event.data?.caseAssignedSupporterId,

    isAdmin: ({ event }) =>
      event.data?.roleVerified === 'ADMIN',

    isSupporter: ({ event }) =>
      event.data?.roleVerified === 'SUPPORTER',

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

    triage_pending: {
      on: {
        T2_SUBMIT_INTAKE: {
          target: 'triage_pending',
          guard: 'isOwner',
          actions: 'upsertDoc',
        },
        T5_ACCEPT: {
          target: 'accepted_unassigned',
          guard: and(['isAdmin', 'hasCredit']),
        },
        T16_EDIT_INTAKE: {
          target: 'triage_pending',
          guard: and(['isBeforeSubmission', 'isOwner']),
          actions: 'upsertDoc',
        },
        T12_REJECT: {
          target: 'cancelled',
          guard: and(['isAdmin', 'reasonMinLength']),
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    accepted_unassigned: {
      on: {
        T6_ASSIGN_SUPPORTER: {
          target: 'assigned',
          guard: 'isAdmin',
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    assigned: {
      on: {
        T6_ASSIGN_SUPPORTER: {
          target: 'assigned',
          guard: 'isAdmin',
          actions: 'emitStageChanged',
        },
        T7_START_WORK: {
          target: 'supporter_working',
          guard: 'isAssignedSupporter',
          actions: 'setSlaDeadline',
        },
        T13_VETO: {
          target: 'cancelled',
          guard: and(['isAdmin', 'isWithin48h']),
          actions: 'refundCredit',
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    supporter_working: {
      on: {
        T8_REQUEST_INFO: {
          target: 'waiting_user',
          guard: 'isAssignedSupporter',
          actions: 'notifyUser',
        },
        T10_START_REVIEW_REVISION: {
          target: 'supporter_working',
          guard: 'isAssignedSupporter',
          actions: 'notifyUser',
        },
        T11_SUBMIT_OUTPUT: {
          target: 'report_ready_to_publish',
          guard: and(['isAssignedSupporter', 'hasCredit']),
          actions: ['subtractCredit', 'lockPrice'],
        },
        T13_VETO: {
          target: 'cancelled',
          guard: and(['isAdmin', 'isWithin48h']),
          actions: 'refundCredit',
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    waiting_user: {
      on: {
        T9_SUBMIT_REVISION: {
          target: 'supporter_working',
          guard: 'isOwner',
          actions: 'upsertDoc',
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    report_ready_to_publish: {
      on: {
        T14_COMPLETE: {
          target: 'done',
          guard: 'isAssignedSupporter',
          actions: 'notifyUser',
        },
        T15_CANCEL: {
          target: 'cancelled',
          guard: 'isOwner',
        },
      },
    },

    done: {
      type: 'final' as const,
    },

    cancelled: {
      type: 'final' as const,
      on: {
        T3_RESUBMIT_AFTER_REJECT: {
          target: 'triage_pending',
          guard: and(['isOwner', 'hasCredit']),
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

export const VALID_STATES: readonly InternalStatus[] = [
  'triage_pending', 'accepted_unassigned', 'assigned', 'supporter_working',
  'waiting_user', 'report_ready_to_publish', 'done', 'cancelled',
]

export function isValidState(status: string): status is InternalStatus {
  return VALID_STATES.includes(status as InternalStatus)
}

export function tryTransition(
  currentStatus: string,
  event: TransitionEvent,
): { to: InternalStatus; actions: ActionDescriptor[] } | null {
  if (!isValidState(currentStatus)) {
    throw new AppError(500, 'CORRUPT_STATE', `internal_status không hợp lệ: ${currentStatus}`)
  }

  const resolved = caseMachine.resolveState({ value: currentStatus, context: {} })

  const [nextSnapshot, actionSnapshots] = transition(caseMachine, resolved, event)

  const stateChanged = nextSnapshot.value !== currentStatus
  const hasActions = actionSnapshots.length > 0

  if (!stateChanged && !hasActions) return null

  const actions: ActionDescriptor[] = actionSnapshots.map(a => ({
    type: (a as any).type as ActionDescriptor['type'],
    params: (a as any).params,
  }))

  return {
    to: nextSnapshot.value as InternalStatus,
    actions,
  }
}

export function isBlockedTransition(_name: TransitionName): boolean {
  return false
}

export function getAvailableTransitions(status: string): TransitionName[] {
  if (!isValidState(status)) return []
  const stateNode = (caseMachine.config as any).states?.[status]
  if (!stateNode?.on) return []
  return Object.keys(stateNode.on) as TransitionName[]
}
