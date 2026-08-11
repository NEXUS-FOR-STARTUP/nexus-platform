import type { CaseStage, InternalStatus } from './case.types.js'

export type { CaseStage, InternalStatus }

export type TransitionName =
  | 'T1_CREATE_CASE'
  | 'T2_SUBMIT_INTAKE'
  | 'T3_RESUBMIT_AFTER_REJECT'
  | 'T4_RESUBMIT_AFTER_VETO'
  | 'T5_ACCEPT'
  | 'T6_ASSIGN_SUPPORTER'
  | 'T7_START_WORK'
  | 'T8_REQUEST_INFO'
  | 'T9_SUBMIT_REVISION'
  | 'T10_START_REVIEW_REVISION'
  | 'T11_SUBMIT_OUTPUT'
  | 'T12_REJECT'
  | 'T13_VETO'
  | 'T14_COMPLETE'
  | 'T15_CANCEL'
  | 'T16_EDIT_INTAKE'

export const ALL_TRANSITIONS: readonly TransitionName[] = [
  'T1_CREATE_CASE', 'T2_SUBMIT_INTAKE', 'T3_RESUBMIT_AFTER_REJECT',
  'T4_RESUBMIT_AFTER_VETO', 'T5_ACCEPT', 'T6_ASSIGN_SUPPORTER',
  'T7_START_WORK', 'T8_REQUEST_INFO', 'T9_SUBMIT_REVISION',
  'T10_START_REVIEW_REVISION', 'T11_SUBMIT_OUTPUT',
  'T12_REJECT', 'T13_VETO', 'T14_COMPLETE', 'T15_CANCEL', 'T16_EDIT_INTAKE',
]

export interface TransitionEvent {
  type: TransitionName
  actor: { id: string; role: string }
  data?: Record<string, unknown>
}

export interface TransitionContext {}

export interface StageStatus {
  stage: CaseStage
  status: InternalStatus
}

export type GuardName =
  | 'isOwnerOrMember' | 'isOwner' | 'isAssignedSupporter'
  | 'isAdmin' | 'isSupporter' | 'hasCredit'
  | 'isWithin48h' | 'isBeforeSubmission'
  | 'reasonMinLength'

export type ActionName =
  | 'upsertDoc' | 'subtractCredit' | 'refundCredit'
  | 'setSlaDeadline' | 'emitStageChanged' | 'notifyUser'
  | 'resetStatus' | 'autoResumeWork' | 'lockPrice'

export interface ActionDescriptor {
  type: ActionName
  params?: unknown
}
