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
  | 'T17_USER_CONFIRM_COMPLETE'
  | 'T19_REOPEN'

export const ALL_TRANSITIONS: readonly TransitionName[] = [
  'T1_CREATE_CASE', 'T2_SUBMIT_INTAKE', 'T3_RESUBMIT_AFTER_REJECT',
  'T4_RESUBMIT_AFTER_VETO', 'T5_ACCEPT', 'T6_ASSIGN_SUPPORTER',
  'T7_START_WORK', 'T8_REQUEST_INFO', 'T9_SUBMIT_REVISION',
  'T10_START_REVIEW_REVISION', 'T11_SUBMIT_OUTPUT',
  'T12_REJECT', 'T13_VETO', 'T14_COMPLETE', 'T15_CANCEL', 'T16_EDIT_INTAKE',
  'T17_USER_CONFIRM_COMPLETE', 'T19_REOPEN',
]

export const TARGET_STAGE: Partial<Record<TransitionName, CaseStage>> = {
  T1_CREATE_CASE:              'intake_pending',
  T2_SUBMIT_INTAKE:            'submitted',
  T3_RESUBMIT_AFTER_REJECT:    'submitted',
  T4_RESUBMIT_AFTER_VETO:      'submitted',
  T5_ACCEPT:                   'under_review',
  T6_ASSIGN_SUPPORTER:         'under_review',
  T7_START_WORK:               'under_review',
  T8_REQUEST_INFO:             'need_more_information',
  T9_SUBMIT_REVISION:          'revision_submitted',
  T10_START_REVIEW_REVISION:   'under_review',
  T11_SUBMIT_OUTPUT:           'report_ready',
  T12_REJECT:                  'rejected',
  T13_VETO:                    'rejected',
  T14_COMPLETE:                'completed',
  T15_CANCEL:                  'closed',
  T16_EDIT_INTAKE:             'intake_ready',
  T17_USER_CONFIRM_COMPLETE:   'completed',
  T19_REOPEN:                  'under_review',
}

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
  | 'isOwner' | 'isAssignedSupporter'
  | 'isAdmin' | 'isSupporter' | 'hasCredit' | 'hasPaymentComplete'
  | 'isWithin48h' | 'isBeforeSubmission'
  | 'reasonMinLength'
export type ActionName =
  | 'upsertDoc' | 'subtractCredit' | 'refundCredit' | 'refundRemainingCredit'
  | 'setSlaDeadline' | 'emitStageChanged' | 'notifyUser'
  | 'resetStatus' | 'autoResumeWork' | 'lockPrice'

export interface ActionDescriptor {
  type: ActionName
  params?: unknown
}
