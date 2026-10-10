import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../db.js';
import { AppError } from '../../../shared/domain/app-error.js';
import { ensureCheckpoint } from '../../../modules/cases/infrastructure/persistence/case.repository.js';
import { openCheckpointUseCase } from '../../../modules/cases/application/open-checkpoint.usecase.js';
import { generateDocxUseCase } from '../../../modules/guided-documents/application/generate-docx.usecase.js';

process.env.NODE_ENV = 'test';

const CASE_ID = 'case-1';
const OWNER_ID = 'owner-1';

interface CheckpointRow {
  id: string;
  case_id: string;
  checkpoint_code: string;
  checkpoint_status: string;
}

// In-memory checkpoint table honouring the (case_id, checkpoint_code) unique key.
function fakeCheckpointDb(rows: CheckpointRow[]) {
  const upsertCalls: Array<{ case_id: string; checkpoint_code: string }> = [];
  const db = {
    checkpoint: {
      upsert: async ({
        where,
        create,
      }: {
        where: { case_id_checkpoint_code: { case_id: string; checkpoint_code: string } };
        create: { case_id: string; checkpoint_code: string; checkpoint_status: string };
      }) => {
        const key = where.case_id_checkpoint_code;
        upsertCalls.push(key);
        const existing = rows.find((r) => r.case_id === key.case_id && r.checkpoint_code === key.checkpoint_code);
        if (existing) return existing;
        const created = { id: `cp-${rows.length + 1}`, ...create };
        rows.push(created);
        return created;
      },
    },
  };
  return { db: db as unknown as Parameters<typeof ensureCheckpoint>[0], upsertCalls };
}

test('ensureCheckpoint is idempotent per (case, code) and keeps codes apart', async () => {
  const rows: CheckpointRow[] = [];
  const { db } = fakeCheckpointDb(rows);

  const cp2a = await ensureCheckpoint(db, CASE_ID, 'CP2', 'draft');
  const cp2b = await ensureCheckpoint(db, CASE_ID, 'CP2', 'draft');
  const cp1 = await ensureCheckpoint(db, CASE_ID, 'CP1');

  assert.equal(cp2a.id, cp2b.id);
  assert.notEqual(cp1.id, cp2a.id);
  assert.equal(rows.length, 2);
  assert.equal(cp2a.checkpoint_status, 'draft');
  assert.equal(cp1.checkpoint_status, 'submitted');
});

test('open CP2: owner only, idempotent, never moves current_checkpoint', async () => {
  const rows: CheckpointRow[] = [];
  const { db } = fakeCheckpointDb(rows);
  let caseUpdates = 0;
  mock.method(prisma.case, 'findUnique', (async () => ({ id: CASE_ID, owner_auth_user_id: OWNER_ID })) as never);
  mock.method(prisma.case, 'update', (async () => {
    caseUpdates += 1;
    return {};
  }) as never);
  mock.method(prisma.checkpoint, 'upsert', db.checkpoint.upsert as never);

  try {
    const first = await openCheckpointUseCase(OWNER_ID, CASE_ID, 'CP2');
    const second = await openCheckpointUseCase(OWNER_ID, CASE_ID, 'CP2');

    assert.equal(first.checkpoint_id, second.checkpoint_id);
    assert.equal(first.checkpoint_code, 'CP2');
    assert.equal(rows.length, 1);
    assert.equal(caseUpdates, 0);

    await assert.rejects(
      () => openCheckpointUseCase('someone-else', CASE_ID, 'CP2'),
      (err: unknown) => err instanceof AppError && err.status === 403,
    );
    assert.equal(rows.length, 1);
  } finally {
    mock.restoreAll();
  }
});

test('docx for cp2 resolves/creates CP2 and never falls back to the first checkpoint', async () => {
  const rows: CheckpointRow[] = [
    { id: 'cp-1', case_id: CASE_ID, checkpoint_code: 'CP1', checkpoint_status: 'submitted' },
  ];
  const { db, upsertCalls } = fakeCheckpointDb(rows);
  const STOP = new Error('stop-before-upload');
  mock.method(prisma.case, 'findUnique', (async () => ({
    id: CASE_ID,
    case_code: 'C-1',
    team_name: 'Team',
    current_checkpoint: 'CP1',
    checkpoints: [...rows],
  })) as never);
  mock.method(prisma, '$transaction', (async (fn: (tx: unknown) => Promise<unknown>) =>
    fn({ ...db, case: { update: async () => ({}) } })) as never);
  // Aborts right after checkpoint resolution so no docx is built or uploaded.
  mock.method(prisma.projectAnswer, 'findMany', (async () => {
    throw STOP;
  }) as never);

  try {
    await assert.rejects(() => generateDocxUseCase({ caseId: CASE_ID, userId: OWNER_ID, templateKey: 'cp2' }), STOP);
    assert.deepEqual(upsertCalls, [{ case_id: CASE_ID, checkpoint_code: 'CP2' }]);
    assert.ok(rows.some((r) => r.checkpoint_code === 'CP2'));
    assert.equal(rows.filter((r) => r.checkpoint_code === 'CP1').length, 1);
  } finally {
    mock.restoreAll();
  }
});
