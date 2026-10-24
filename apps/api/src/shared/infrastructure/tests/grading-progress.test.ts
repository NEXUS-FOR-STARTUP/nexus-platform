import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { computeProgressSteps } from '@app/shared'
import { prisma } from '../../../db.js'
import { findLatestAiJobForCheckpoint } from '../../../modules/ai-engine/infrastructure/persistence/ai-job.repository.js'

process.env.NODE_ENV = 'test'

const states = (checkpoint: string, files: string[], opts: { finished?: boolean; running?: boolean }) =>
  computeProgressSteps(checkpoint, files, { finished: opts.finished ?? false, running: opts.running ?? false }).map((s) => s.state)

describe('computeProgressSteps', () => {
  it('running with no outputs: first step done, second active', () => {
    assert.deepEqual(states('CP2', [], { running: true }), ['done', 'active', 'pending', 'pending'])
  })

  it('advances as output files appear', () => {
    assert.deepEqual(states('CP2', ['cp2_evidence.json'], { running: true }), ['done', 'done', 'active', 'pending'])
    assert.deepEqual(states('CP2', ['cp2_evidence.json', 'report.md'], { running: true }), ['done', 'done', 'done', 'active'])
  })

  it('CP3 tracks its own evidence file, and CP2 evidence does not advance a CP3 job', () => {
    assert.deepEqual(states('CP3', ['cp3_evidence.json'], { running: true }), ['done', 'done', 'active', 'pending'])
    assert.deepEqual(states('CP3', ['cp2_evidence.json'], { running: true }), ['done', 'active', 'pending', 'pending'])
  })

  it('an optional file the agent skipped does not leave a gap', () => {
    // CP1 triad_handoff_packet.md is optional; a later file present means the triad step is done too.
    assert.deepEqual(states('CP1', ['input_clarification_audit.md'], { running: true }), ['done', 'done', 'done', 'active'])
  })

  it('finished marks every step done and none active', () => {
    assert.deepEqual(states('CP2', [], { finished: true }), ['done', 'done', 'done', 'done'])
  })

  it('failed run keeps what was produced and has no active step', () => {
    assert.deepEqual(states('CP2', ['cp2_evidence.json'], {}), ['done', 'done', 'pending', 'pending'])
  })

  it('report.json on disk does not complete the last step until the report is saved', () => {
    assert.deepEqual(states('CP2', ['cp2_evidence.json', 'report.md', 'report.json'], { running: true }), ['done', 'done', 'done', 'active'])
    // A failed CP2 run that only produced CP1-shaped files must not look finished.
    assert.deepEqual(states('CP2', ['report.json'], {}), ['pending', 'pending', 'pending', 'pending'])
  })

  it('queued job has no done step', () => {
    assert.ok(states('CP1', [], {}).every((s) => s === 'pending'))
  })

  it('unknown checkpoint yields no steps', () => {
    assert.deepEqual(computeProgressSteps('CP9', [], { finished: false, running: true }), [])
  })
})

type MockablePrisma = { aiJob: { findMany: (args: unknown) => Promise<unknown[]> } }
const mockablePrisma = prisma as unknown as MockablePrisma
const realAiJob = mockablePrisma.aiJob

describe('findLatestAiJobForCheckpoint', () => {
  // Newest first, as the repository orders them. Pre-CP2 jobs carry no checkpoint = CP1.
  const jobs = [
    { id: 'job-cp2-new', input_json: { checkpoint: 'CP2' } },
    { id: 'job-cp1-old', input_json: null },
    { id: 'job-cp2-old', input_json: { checkpoint: 'CP2' } },
  ]
  beforeEach(() => {
    mockablePrisma.aiJob = { findMany: async () => jobs }
  })

  it('picks the newest job of the requested checkpoint', async () => {
    assert.equal((await findLatestAiJobForCheckpoint('c', 'CP2'))?.id, 'job-cp2-new')
  })

  it('treats a job without checkpoint as CP1', async () => {
    assert.equal((await findLatestAiJobForCheckpoint('c', 'CP1'))?.id, 'job-cp1-old')
  })

  it('returns null when that checkpoint has no job', async () => {
    mockablePrisma.aiJob = { findMany: async () => [jobs[0]] }
    assert.equal(await findLatestAiJobForCheckpoint('c', 'CP1'), null)
    mockablePrisma.aiJob = realAiJob
  })
})
