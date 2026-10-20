import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { recordCaseEvent } from '../../../modules/cases/infrastructure/persistence/case-event.repository.js'

type CreateArgs = { data: Record<string, unknown> }

function makeDb(ownerId: string | null) {
  const created: CreateArgs[] = []
  const db = {
    case: { findUnique: async () => (ownerId ? { owner_auth_user_id: ownerId } : null) },
    caseEvent: {
      create: async (args: CreateArgs) => {
        created.push(args)
        return args.data
      },
    },
  }
  return { db: db as unknown as Parameters<typeof recordCaseEvent>[0], created }
}

describe('recordCaseEvent', () => {
  it('records a user event with the given actor and no owner lookup', async () => {
    const { db, created } = makeDb('owner-1')
    await recordCaseEvent(db, { caseId: 'c1', eventType: 'stage_opened', actorUserId: 'user-9', metadata: { checkpoint_code: 'CP2' } })
    assert.equal(created.length, 1)
    assert.equal(created[0]!.data.actor_auth_user_id, 'user-9')
    assert.equal(created[0]!.data.actor_role, 'user')
    assert.deepEqual(created[0]!.data.metadata_json, { checkpoint_code: 'CP2' })
  })

  it('attributes a system event to the case owner with role "system"', async () => {
    const { db, created } = makeDb('owner-1')
    await recordCaseEvent(db, { caseId: 'c1', eventType: 'audit_failed' })
    assert.equal(created[0]!.data.actor_auth_user_id, 'owner-1')
    assert.equal(created[0]!.data.actor_role, 'system')
  })

  it('lets the caller override the role (system refund on behalf of the owner)', async () => {
    const { db, created } = makeDb('owner-1')
    await recordCaseEvent(db, { caseId: 'c1', eventType: 'credit_refunded', actorUserId: 'owner-1', actorRole: 'system' })
    assert.equal(created[0]!.data.actor_role, 'system')
  })

  it('throws 404 for a system event on a missing case instead of writing an orphan row', async () => {
    const { db, created } = makeDb(null)
    await assert.rejects(() => recordCaseEvent(db, { caseId: 'gone', eventType: 'audit_failed' }), { code: 'CASE_NOT_FOUND' })
    assert.equal(created.length, 0)
  })

  it('propagates an insert failure so a surrounding transaction (report save) rolls back', async () => {
    const failing = {
      case: { findUnique: async () => ({ owner_auth_user_id: 'owner-1' }) },
      caseEvent: {
        create: async () => {
          throw new Error('insert failed')
        },
      },
    } as unknown as Parameters<typeof recordCaseEvent>[0]
    await assert.rejects(
      () => recordCaseEvent(failing, { caseId: 'c1', eventType: 'audit_completed', reportId: 'r1' }),
      /insert failed/,
    )
  })
})
