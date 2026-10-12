import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  evaluateCp2FullAnswers,
  evaluateCp2QuestionnaireAnswers,
  assertCp2AnswerQuality,
  assertCp2InputSource,
} from '../../../modules/ai-engine/application/cp2-audit-input.js'
import { AppError } from '../../../shared/domain/app-error.js'
import { CP2_INTERVIEW_AUDIT_REQUIRED, CP2_QUESTION_BANK_ID, TEMPLATE_REGISTRY } from '@repo/validation'

const CP2_IDS: string[] = TEMPLATE_REGISTRY.cp2.phases.flatMap((phase) => phase.questions.map((q) => q.question_id))

const pad = (text: string, words: number): string => Array(words).fill(text).join(' ')
describe('evaluateCp2FullAnswers', () => {
  it('rejects thin junk answers (26 one-word answers fail)', () => {
    const answers: Record<string, string> = {}
    for (const id of CP2_IDS.slice(0, 26)) answers[id] = 'adawd'
    const result = evaluateCp2FullAnswers(answers)
    assert.equal(result.answered, 26)
    assert.ok(result.avgWords < 10)
    assert.equal(result.ok, false)
  })

  it('accepts 5 answers averaging at least 10 words', () => {
    const answers: Record<string, string> = {}
    for (const id of CP2_IDS.slice(0, 5)) answers[id] = pad('nghien cuu', 10)
    const result = evaluateCp2FullAnswers(answers)
    assert.equal(result.ok, true)
  })

  it('rejects fewer than 5 answers even when long', () => {
    const answers: Record<string, string> = { [CP2_IDS[0]]: pad('nghien cuu', 50) }
    assert.equal(evaluateCp2FullAnswers(answers).ok, false)
  })
})

describe('evaluateCp2QuestionnaireAnswers', () => {
  const base: Record<string, string> = {}
  for (const id of CP2_INTERVIEW_AUDIT_REQUIRED) base[id] = pad('cau hoi', 10)

  it('requires the bank answer when no attachment exists', () => {
    const result = evaluateCp2QuestionnaireAnswers(base, false)
    assert.equal(result.ok, false)
    assert.ok(result.missing.includes(CP2_QUESTION_BANK_ID))
  })

  it('accepts an attachment in place of the bank answer', () => {
    assert.equal(evaluateCp2QuestionnaireAnswers(base, true).ok, true)
  })

  it('rejects thin base answers', () => {
    const thin = { ...base, [CP2_INTERVIEW_AUDIT_REQUIRED[0]]: 'ngan' }
    const result = evaluateCp2QuestionnaireAnswers({ ...thin, [CP2_QUESTION_BANK_ID]: pad('bank', 10) }, false)
    assert.equal(result.ok, false)
    assert.ok(result.thinIds.includes(CP2_INTERVIEW_AUDIT_REQUIRED[0]))
  })
})

describe('assertCp2AnswerQuality scope branching', () => {
  it('questionnaire scope ignores full-scope thinness', () => {
    const answers: Record<string, string> = {}
    for (const id of CP2_INTERVIEW_AUDIT_REQUIRED) answers[id] = pad('cau hoi', 10)
    // No bank, no attachment, and far below the full bar — passes questionnaire via attachment.
    assert.doesNotThrow(() => assertCp2AnswerQuality('case-1', answers, 'questionnaire', true))
    assert.throws(
      () => assertCp2AnswerQuality('case-1', answers, 'full', true),
      (err: unknown) => err instanceof AppError && err.code === 'CP2_ANSWERS_TOO_THIN',
    )
  })
})

describe('assertCp2InputSource', () => {
  const junk: Record<string, string> = {}
  for (const id of CP2_IDS.slice(0, 26)) junk[id] = 'adawd'
  const good: Record<string, string> = {}
  for (const id of CP2_IDS.slice(0, 5)) good[id] = pad('nghien cuu', 10)
  const code = (fn: () => void): string | undefined => {
    try {
      fn()
      return undefined
    } catch (err: unknown) {
      return err instanceof AppError ? err.code : 'OTHER'
    }
  }

  it('files only: passes with files even when every answer is junk', () => {
    assert.equal(code(() => assertCp2InputSource('c', junk, 'full', 'files', 2)), undefined)
  })

  it('files only: rejects when there are no files', () => {
    assert.equal(code(() => assertCp2InputSource('c', good, 'full', 'files', 0)), 'CP2_FILES_REQUIRED')
  })

  it('answers only: passes with good answers and no files', () => {
    assert.equal(code(() => assertCp2InputSource('c', good, 'full', 'answers', 0)), undefined)
  })

  it('answers only: still rejects junk answers even when files exist', () => {
    assert.equal(code(() => assertCp2InputSource('c', junk, 'full', 'answers', 3)), 'CP2_ANSWERS_TOO_THIN')
  })

  it('both: needs files AND good answers', () => {
    assert.equal(code(() => assertCp2InputSource('c', good, 'full', 'both', 1)), undefined)
    assert.equal(code(() => assertCp2InputSource('c', good, 'full', 'both', 0)), 'CP2_FILES_REQUIRED')
    assert.equal(code(() => assertCp2InputSource('c', junk, 'full', 'both', 1)), 'CP2_ANSWERS_TOO_THIN')
  })
})
