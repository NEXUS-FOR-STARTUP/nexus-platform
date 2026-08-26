import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Prisma } from '@prisma/client'
import { transitionInTx } from '../../../services/case-transition.service.js'

const HOUR = 3600_000
const SLA_MS = 48 * HOUR

type SlaUpdate = { where: { id: string }; data: { sla_deadline_at: Date } }

function fakeTx(sla: Date | null) {
  const updates: SlaUpdate[] = []
  const tx = {
    case: {
      findUniqueOrThrow: async () => ({
        id: 'case-1',
        case_code: 'NX-647364',
        internal_status: 'supporter_working',
        user_facing_stage: 'under_review',
        owner_auth_user_id: 'owner-1',
        assigned_supporter_auth_user_id: 'old-supporter',
        created_at: new Date(),
        locked_price: 0,
        payment_status: 'paid',
        version_no: 1,
        sla_deadline_at: sla,
      }),
      update: async (args: SlaUpdate) => {
        updates.push(args)
        return {}
      },
      updateMany: async () => ({ count: 1 }),
    },
    caseEvent: {
      create: async () => ({}),
    },
  }
  return { tx: tx as unknown as Prisma.TransactionClient, updates }
}

function reassign(tx: Prisma.TransactionClient) {
  return transitionInTx(tx, {
    transition: 'T6_ASSIGN_SUPPORTER',
    caseId: 'case-1',
    actorId: 'admin-1',
    roleVerified: 'ADMIN',
    data: { supporterId: 'new-supporter' },
  })
}

test('resetSlaIfOverdue — overdue T6 updates now+48h', async () => {
  const { tx, updates } = fakeTx(new Date(Date.now() - 1000))
  await reassign(tx)
  assert.equal(updates.length, 1)
  assert.equal(updates[0]!.where.id, 'case-1')
  const next = updates[0]!.data.sla_deadline_at.getTime()
  assert.ok(Math.abs(next - (Date.now() + SLA_MS)) < 1000)
})

test('resetSlaIfOverdue — future T6 does not update sla', async () => {
  const { tx, updates } = fakeTx(new Date(Date.now() + HOUR))
  await reassign(tx)
  assert.equal(updates.length, 0)
})

test('resetSlaIfOverdue — null T6 does not update sla', async () => {
  const { tx, updates } = fakeTx(null)
  await reassign(tx)
  assert.equal(updates.length, 0)
})
