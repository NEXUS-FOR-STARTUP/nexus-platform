import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { prisma } from '../../../db.js'
import { AppError } from '../../../shared/domain/app-error.js'
import { deleteStageDocumentUseCase } from '../../../modules/cases/application/delete-stage-document.usecase.js'

process.env.NODE_ENV = 'test'

type MockablePrisma = {
  documentRecord: {
    findFirst: (args: unknown) => Promise<unknown>
    update: (args: unknown) => Promise<unknown>
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
  case: { owner_auth_user_id: 'owner-1' },
}

beforeEach(() => {
  mockablePrisma.documentRecord = realDocumentRecord
})

describe('deleteStageDocumentUseCase', () => {
  it('soft-deletes an owner upload via superseded_at', async () => {
    let updated: unknown = null
    mockablePrisma.documentRecord = {
      findFirst: async () => ownerRecord,
      update: async (args: unknown) => {
        updated = args
        return { id: 'doc-1' }
      },
    }
    const result = await deleteStageDocumentUseCase('owner-1', 'case-1', 'doc-1')
    assert.deepEqual(result, { deleted: true })
    assert.deepEqual((updated as { data: unknown }).data, { superseded_at: (updated as { data: { superseded_at: Date } }).data.superseded_at })
    assert.ok((updated as { data: { superseded_at: Date } }).data.superseded_at instanceof Date)
  })

  it('rejects 404 when the document is missing or already deleted', async () => {
    mockablePrisma.documentRecord = {
      findFirst: async () => null,
      update: async () => ({ id: 'x' }),
    }
    await assert.rejects(
      deleteStageDocumentUseCase('owner-1', 'case-1', 'missing'),
      (err: unknown) => err instanceof AppError && err.code === 'DOCUMENT_NOT_FOUND' && err.status === 404,
    )
  })

  it('rejects 403 when a non-owner deletes', async () => {
    mockablePrisma.documentRecord = {
      findFirst: async () => ownerRecord,
      update: async () => ({ id: 'doc-1' }),
    }
    await assert.rejects(
      deleteStageDocumentUseCase('other-user', 'case-1', 'doc-1'),
      (err: unknown) => err instanceof AppError && err.code === 'DOCUMENT_DELETE_FORBIDDEN' && err.status === 403,
    )
  })

  it('rejects deleting generated reports', async () => {
    mockablePrisma.documentRecord = {
      findFirst: async () => ({ ...ownerRecord, source_kind: 'generated' }),
      update: async () => ({ id: 'doc-1' }),
    }
    await assert.rejects(
      deleteStageDocumentUseCase('owner-1', 'case-1', 'doc-1'),
      (err: unknown) => err instanceof AppError && err.code === 'DOCUMENT_DELETE_FORBIDDEN' && err.status === 400,
    )
  })
})
