import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '../../../db.js'
import { AppError } from '../../../shared/domain/app-error.js'
import { deleteStageDocumentUseCase } from '../../../modules/cases/application/delete-stage-document.usecase.js'

process.env.NODE_ENV = 'test'

type MockablePrisma = {
  documentRecord: {
    findFirst: (args: unknown) => Promise<unknown>
    updateMany: (args: unknown) => Promise<{ count: number }>
  }
}

const mockablePrisma = prisma as unknown as MockablePrisma
const realDocumentRecord = mockablePrisma.documentRecord

const ownerRecord = {
  id: 'doc-1',
  case_id: 'case-1',
  superseded_at: null,
  source_kind: 'cloudinary',
  doc_type: 'revision_attachment',
  case: { owner_auth_user_id: 'owner-1', internal_status: 'active' },
}

const mockRecord = (record: unknown, count = 1) => {
  mockablePrisma.documentRecord = {
    findFirst: async () => record,
    updateMany: async () => ({ count }),
  }
}

beforeEach(() => {
  mockablePrisma.documentRecord = realDocumentRecord
})

describe('deleteStageDocumentUseCase', () => {
  it('soft-deletes an owner upload via superseded_at', async () => {
    let updated: unknown = null
    mockablePrisma.documentRecord = {
      findFirst: async () => ownerRecord,
      updateMany: async (args: unknown) => {
        updated = args
        return { count: 1 }
      },
    }
    const result = await deleteStageDocumentUseCase('owner-1', 'case-1', 'doc-1')
    assert.deepEqual(result, { deleted: true })
    const data = (updated as { where: { id: string; superseded_at: null }; data: { superseded_at: Date } })
    assert.equal(data.where.id, 'doc-1')
    assert.equal(data.where.superseded_at, null)
    assert.ok(data.data.superseded_at instanceof Date)
  })

  it('rejects 404 when the document is missing or already deleted', async () => {
    mockRecord(null)
    await assert.rejects(
      deleteStageDocumentUseCase('owner-1', 'case-1', 'missing'),
      (err: unknown) => err instanceof AppError && err.code === 'DOCUMENT_NOT_FOUND' && err.status === 404,
    )
  })

  it('rejects 404 when a concurrent delete wins the race', async () => {
    mockRecord(ownerRecord, 0)
    await assert.rejects(
      deleteStageDocumentUseCase('owner-1', 'case-1', 'doc-1'),
      (err: unknown) => err instanceof AppError && err.code === 'DOCUMENT_NOT_FOUND' && err.status === 404,
    )
  })

  it('rejects 403 when a non-owner deletes', async () => {
    mockRecord(ownerRecord)
    await assert.rejects(
      deleteStageDocumentUseCase('other-user', 'case-1', 'doc-1'),
      (err: unknown) => err instanceof AppError && err.code === 'DOCUMENT_DELETE_FORBIDDEN' && err.status === 403,
    )
  })

  it('rejects deleting generated reports', async () => {
    mockRecord({ ...ownerRecord, source_kind: 'generated' })
    await assert.rejects(
      deleteStageDocumentUseCase('owner-1', 'case-1', 'doc-1'),
      (err: unknown) => err instanceof AppError && err.code === 'DOCUMENT_DELETE_FORBIDDEN' && err.status === 400,
    )
  })

  it('rejects 409 when the case is closed', async () => {
    mockRecord({ ...ownerRecord, case: { owner_auth_user_id: 'owner-1', internal_status: 'cancelled' } })
    await assert.rejects(
      deleteStageDocumentUseCase('owner-1', 'case-1', 'doc-1'),
      (err: unknown) => err instanceof AppError && err.code === 'CASE_CLOSED' && err.status === 409,
    )
  })
})
