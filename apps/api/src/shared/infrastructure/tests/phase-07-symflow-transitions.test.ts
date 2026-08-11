/**
 * Phase 07 — XState Machine Tests
 *
 * Test case-machine.ts: 16 transitions, guards, actions, self-loops,
 * getAvailableTransitions, CORRUPT_STATE handling.
 *
 * Không cần DB — pure unit tests cho XState machine.
 * Run: node --import tsx --test apps/api/src/shared/infrastructure/tests/phase-07-symflow-transitions.test.ts
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  caseMachine,
  tryTransition,
  getAvailableTransitions,
  isBlockedTransition,
  VALID_STATES,
  isValidState,
} from '../../../modules/cases/domain/case-machine.js'
import type { TransitionEvent, TransitionName } from '../../../modules/cases/domain/transition.types.js'
import { ALL_TRANSITIONS } from '../../../modules/cases/domain/transition.types.js'

function event(t: TransitionName, overrides: Record<string, unknown> = {}): TransitionEvent {
  return {
    type: t,
    actor: { id: 'user-1', role: 'USER' },
    data: {
      actorId: 'user-1',
      roleVerified: 'USER',
      caseOwnerId: 'user-1',
      creditBalance: 1,
      lockedPrice: 39000,
      ...overrides,
    },
  }
}

function adminEvent(t: TransitionName, overrides: Record<string, unknown> = {}): TransitionEvent {
  return event(t, { actorId: 'admin-1', roleVerified: 'ADMIN', ...overrides })
}

function supporterEvent(t: TransitionName, overrides: Record<string, unknown> = {}): TransitionEvent {
  return event(t, {
    actorId: 'supporter-1',
    roleVerified: 'SUPPORTER',
    caseAssignedSupporterId: 'supporter-1',
    ...overrides,
  })
}

// ============================================================
// Nhóm A: Transitions path hợp lệ (guard pass)
// ============================================================

test('T2_SUBMIT_INTAKE — isOwner → self-loop, upsertDoc action', () => {
  const r = tryTransition('triage_pending', event('T2_SUBMIT_INTAKE'))
  assert.ok(r)
  assert.equal(r!.to, 'triage_pending')
  assert.ok(r!.actions.some(a => a.type === 'upsertDoc'))
})

test('T5_ACCEPT — isAdmin + hasCredit → accepted_unassigned', () => {
  const r = tryTransition('triage_pending', adminEvent('T5_ACCEPT'))
  assert.ok(r)
  assert.equal(r!.to, 'accepted_unassigned')
})

test('T16_EDIT_INTAKE — isBeforeSubmission → self-loop, upsertDoc', () => {
  const r = tryTransition('triage_pending', event('T16_EDIT_INTAKE', {
    currentStage: 'intake_pending',
  }))
  assert.ok(r)
  assert.equal(r!.to, 'triage_pending')
  assert.ok(r!.actions.some(a => a.type === 'upsertDoc'))
})

test('T12_REJECT — isAdmin + reason ≥ 10 chars → cancelled', () => {
  const r = tryTransition('triage_pending', adminEvent('T12_REJECT', {
    reason: 'Hồ sơ không đạt yêu cầu đầu vào tối thiểu',
  }))
  assert.ok(r)
  assert.equal(r!.to, 'cancelled')
})

test('T15_CANCEL — isOwner → cancelled (from triage_pending)', () => {
  const r = tryTransition('triage_pending', event('T15_CANCEL'))
  assert.ok(r)
  assert.equal(r!.to, 'cancelled')
})

test('T6_ASSIGN_SUPPORTER — isAdmin → assigned', () => {
  const r = tryTransition('accepted_unassigned', adminEvent('T6_ASSIGN_SUPPORTER'))
  assert.ok(r)
  assert.equal(r!.to, 'assigned')
})

test('T7_START_WORK — isAssignedSupporter → supporter_working, setSlaDeadline', () => {
  const r = tryTransition('assigned', supporterEvent('T7_START_WORK'))
  assert.ok(r)
  assert.equal(r!.to, 'supporter_working')
  assert.ok(r!.actions.some(a => a.type === 'setSlaDeadline'))
})

test('T13_VETO — isAdmin + within 48h → cancelled, refundCredit', () => {
  const r = tryTransition('assigned', adminEvent('T13_VETO', {
    caseCreatedAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
  }))
  assert.ok(r)
  assert.equal(r!.to, 'cancelled')
  assert.ok(r!.actions.some(a => a.type === 'refundCredit'))
})

test('T8_REQUEST_INFO — isAssignedSupporter → waiting_user, notifyUser', () => {
  const r = tryTransition('supporter_working', supporterEvent('T8_REQUEST_INFO'))
  assert.ok(r)
  assert.equal(r!.to, 'waiting_user')
  assert.ok(r!.actions.some(a => a.type === 'notifyUser'))
})

test('T10_START_REVIEW_REVISION — isAssignedSupporter → self-loop', () => {
  const r = tryTransition('supporter_working', supporterEvent('T10_START_REVIEW_REVISION'))
  assert.ok(r)
  assert.equal(r!.to, 'supporter_working')
})

test('T11_SUBMIT_OUTPUT — isAssignedSupporter + hasCredit → report_ready_to_publish', () => {
  const r = tryTransition('supporter_working', supporterEvent('T11_SUBMIT_OUTPUT', {
    creditBalance: 1,
  }))
  assert.ok(r)
  assert.equal(r!.to, 'report_ready_to_publish')
  assert.ok(r!.actions.some(a => a.type === 'subtractCredit'))
  assert.ok(r!.actions.some(a => a.type === 'lockPrice'))
})

test('T9_SUBMIT_REVISION — isOwnerOrMember → supporter_working, upsertDoc', () => {
  const r = tryTransition('waiting_user', event('T9_SUBMIT_REVISION'))
  assert.ok(r)
  assert.equal(r!.to, 'supporter_working')
  assert.ok(r!.actions.some(a => a.type === 'upsertDoc'))
})

test('T14_COMPLETE — isAssignedSupporter → done', () => {
  const r = tryTransition('report_ready_to_publish', supporterEvent('T14_COMPLETE'))
  assert.ok(r)
  assert.equal(r!.to, 'done')
})

test('T3_RESUBMIT_AFTER_REJECT — isOwner + hasCredit → triage_pending (from done)', () => {
  const r = tryTransition('done', event('T3_RESUBMIT_AFTER_REJECT'))
  assert.ok(r)
  assert.equal(r!.to, 'triage_pending')
  assert.ok(r!.actions.some(a => a.type === 'upsertDoc'))
  assert.ok(r!.actions.some(a => a.type === 'resetStatus'))
})

test('T4_RESUBMIT_AFTER_VETO — isOwner (free) → triage_pending (from cancelled)', () => {
  const r = tryTransition('cancelled', event('T4_RESUBMIT_AFTER_VETO', {
    creditBalance: 0,
  }))
  assert.ok(r)
  assert.equal(r!.to, 'triage_pending')
})

test('T3_RESUBMIT_AFTER_REJECT — isOwner + hasCredit → triage_pending (from cancelled)', () => {
  const r = tryTransition('cancelled', event('T3_RESUBMIT_AFTER_REJECT', {
    creditBalance: 1,
  }))
  assert.ok(r)
  assert.equal(r!.to, 'triage_pending')
})

// ============================================================
// Nhóm B: Guard fail — transition bị chặn
// ============================================================

test('T5_ACCEPT — guard fail khi hasCredit=0 (fix #9)', () => {
  const r = tryTransition('triage_pending', adminEvent('T5_ACCEPT', {
    creditBalance: 0,
    lockedPrice: 39000,
  }))
  assert.equal(r, null, 'should be blocked — no credit')
})

test('T5_ACCEPT — guard fail khi không phải admin', () => {
  const r = tryTransition('triage_pending', event('T5_ACCEPT'))
  assert.equal(r, null)
})

test('T12_REJECT — guard fail khi reason < 10 chars', () => {
  const r = tryTransition('triage_pending', adminEvent('T12_REJECT', {
    reason: 'ngắn',
  }))
  assert.equal(r, null)
})

test('T13_VETO — guard fail khi quá 48h', () => {
  const r = tryTransition('assigned', adminEvent('T13_VETO', {
    caseCreatedAt: new Date(Date.now() - 72 * 3600_000).toISOString(),
  }))
  assert.equal(r, null)
})

test('T14_COMPLETE — guard fail khi không phải assigned supporter (Q4)', () => {
  const r = tryTransition('report_ready_to_publish', event('T14_COMPLETE'))
  assert.equal(r, null)
})

test('T11_SUBMIT_OUTPUT — guard fail khi creditBalance=0 (fix #2)', () => {
  const r = tryTransition('supporter_working', supporterEvent('T11_SUBMIT_OUTPUT', {
    creditBalance: 0,
  }))
  assert.equal(r, null)
})

test('T3_RESUBMIT_AFTER_REJECT — guard fail khi creditBalance=0', () => {
  const r = tryTransition('cancelled', event('T3_RESUBMIT_AFTER_REJECT', {
    creditBalance: 0,
  }))
  assert.equal(r, null)
})

test('T15_CANCEL — guard fail khi không phải owner', () => {
  const r = tryTransition('triage_pending', event('T15_CANCEL', {
    actorId: 'other-user',
  }))
  assert.equal(r, null)
})

test('T16_EDIT_INTAKE — guard fail khi đã submitted (isBeforeSubmission=false)', () => {
  const r = tryTransition('triage_pending', event('T16_EDIT_INTAKE', {
    currentStage: 'submitted',
  }))
  assert.equal(r, null)
})

// ============================================================
// Nhóm C: getAvailableTransitions
// ============================================================

test('getAvailableTransitions — triage_pending có 5 transition', () => {
  const ts = getAvailableTransitions('triage_pending')
  assert.ok(ts.includes('T2_SUBMIT_INTAKE'))
  assert.ok(ts.includes('T5_ACCEPT'))
  assert.ok(ts.includes('T16_EDIT_INTAKE'))
  assert.ok(ts.includes('T12_REJECT'))
  assert.ok(ts.includes('T15_CANCEL'))
  assert.equal(ts.length, 5)
})

test('getAvailableTransitions — supporter_working có 5 transition', () => {
  const ts = getAvailableTransitions('supporter_working')
  assert.ok(ts.includes('T8_REQUEST_INFO'))
  assert.ok(ts.includes('T10_START_REVIEW_REVISION'))
  assert.ok(ts.includes('T11_SUBMIT_OUTPUT'))
  assert.ok(ts.includes('T13_VETO'))
  assert.ok(ts.includes('T15_CANCEL'))
})

test('getAvailableTransitions — done có T3+T4 (resubmit)', () => {
  const ts = getAvailableTransitions('done')
  assert.ok(ts.includes('T3_RESUBMIT_AFTER_REJECT'))
  assert.ok(ts.includes('T4_RESUBMIT_AFTER_VETO'))
})

test('getAvailableTransitions — status không hợp lệ → []', () => {
  assert.deepEqual(getAvailableTransitions('invalid'), [])
  assert.deepEqual(getAvailableTransitions(''), [])
})

// ============================================================
// Nhóm D: CORRUPT_STATE handling (F4)
// ============================================================

test('tryTransition — status không hợp lệ → throw CORRUPT_STATE', () => {
  const ev = event('T15_CANCEL')
  assert.throws(() => tryTransition('invalid_status', ev), /internal_status không hợp lệ/)
  assert.throws(() => tryTransition('draft', ev), /internal_status không hợp lệ/)
})

test('isValidState — chỉ chấp nhận 8 states hợp lệ', () => {
  assert.equal(isValidState('triage_pending'), true)
  assert.equal(isValidState('done'), true)
  assert.equal(isValidState('invalid'), false)
  assert.equal(isValidState('draft'), false)
})

// ============================================================
// Nhóm E: Properties
// ============================================================

test('isBlockedTransition — mọi transition active (chốt 2026-08-09)', () => {
  for (const t of ALL_TRANSITIONS) {
    assert.equal(isBlockedTransition(t), false, `${t} should not be blocked`)
  }
})

test('VALID_STATES — 8 states', () => {
  assert.equal(VALID_STATES.length, 8)
  for (const s of VALID_STATES) {
    assert.ok(isValidState(s))
  }
})

test('Machine — 8 state nodes, 16 transitions total', () => {
  const snapshots: TransitionName[] = []
  for (const state of VALID_STATES) {
    const ts = getAvailableTransitions(state)
    ts.forEach(t => snapshots.push(t))
  }
  assert.equal(snapshots.length, 23, '23 transition edges across 8 states')
})

test('Free case (lockedPrice=0) — hasCredit guard tự skip (Amendment #6)', () => {
  const r = tryTransition('triage_pending', adminEvent('T5_ACCEPT', {
    creditBalance: 0,
    lockedPrice: 0,
  }))
  assert.ok(r, 'free case should pass hasCredit guard')
  assert.equal(r!.to, 'accepted_unassigned')
})

// ============================================================
// Nhóm F: Self-loop transitions (Amendment #1)
// ============================================================

test('T2_SUBMIT_INTAKE — self-loop: state unchanged, has actions', () => {
  const r = tryTransition('triage_pending', event('T2_SUBMIT_INTAKE'))
  assert.equal(r!.to, 'triage_pending')
  assert.ok(r!.actions.length > 0, 'self-loop should have actions')
})

test('T10_START_REVIEW_REVISION — self-loop: state unchanged, has notifyUser', () => {
  const r = tryTransition('supporter_working', supporterEvent('T10_START_REVIEW_REVISION'))
  assert.equal(r!.to, 'supporter_working')
  assert.ok(r!.actions.length > 0)
})

test('T16_EDIT_INTAKE — self-loop: state unchanged, has upsertDoc', () => {
  const r = tryTransition('triage_pending', event('T16_EDIT_INTAKE', {
    currentStage: 'intake_pending',
  }))
  assert.equal(r!.to, 'triage_pending')
  assert.ok(r!.actions.some(a => a.type === 'upsertDoc'))
})

// ============================================================
// Nhóm G: Invalid transition from a state (not defined in machine)
// ============================================================

test('T7_START_WORK — from triage_pending → null (not defined)', () => {
  const r = tryTransition('triage_pending', supporterEvent('T7_START_WORK'))
  assert.equal(r, null)
})

test('T9_SUBMIT_REVISION — from triage_pending → null (not defined)', () => {
  const r = tryTransition('triage_pending', event('T9_SUBMIT_REVISION'))
  assert.equal(r, null)
})

test('T1_CREATE_CASE — from done → null (not defined)', () => {
  const r = tryTransition('done', event('T1_CREATE_CASE'))
  assert.equal(r, null)
})
