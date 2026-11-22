import { createHash } from 'node:crypto'
import {
  buildPreCp1Report,
  deriveTeamFitInput,
  type LabelQuote,
  type PreCp1Input,
  type TeamFitInput,
  type TeamFitSavedResult,
} from '@repo/validation'
import { AppError } from '../../../shared/domain/app-error.js'
import logger from '../../../shared/infrastructure/logger.js'

export interface SavePreCp1Input {
  caseId?: string | null
  reportId?: string | null
  userId: string
  input: PreCp1Input
  aiLabels: LabelQuote[] | null
  aiResult: TeamFitSavedResult | null
}

export interface SavePreCp1Result {
  id: string
  isNew: boolean
  report: unknown
}

export interface CreatePreCp1ReportData {
  caseId: string | null
  userId: string
  inputHash: string
  input: PreCp1Input
  aiLabels: LabelQuote[] | null
  report: unknown
  aiResult: TeamFitSavedResult | null
  teamFit: TeamFitInput | null
}

export interface AttachPreCp1AiData {
  reportId: string
  caseId: string | null
  inputHash: string
  aiLabels: LabelQuote[] | null
  aiResult: TeamFitSavedResult | null
  teamFit: TeamFitInput | null
}

export interface AttachCaseToReportData {
  reportId: string
  caseId: string
  aiLabels: LabelQuote[] | null
  aiResult: TeamFitSavedResult | null
  teamFit: TeamFitInput | null
}

export interface ExistingPreCp1Report {
  id: string
  input_hash?: string
  report_snapshot: unknown
  has_ai_labels: boolean
}

export interface SavePreCp1Deps {
  findCaseOwnedBy: (caseId: string, userId: string) => Promise<{ id: string } | null>
  findReportByHash: (
    caseId: string | null,
    hash: string,
    userId?: string,
  ) => Promise<ExistingPreCp1Report | null>
  findUnlinkedReportById?: (reportId: string, userId: string) => Promise<ExistingPreCp1Report | null>
  attachCaseToReport?: (data: AttachCaseToReportData) => Promise<void>
  createReport: (data: CreatePreCp1ReportData) => Promise<{ id: string }>
  attachAi: (data: AttachPreCp1AiData) => Promise<void>
}

/** Deterministic JSON: same answers always hash the same, whatever the key order. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`)
  return `{${entries.join(',')}}`
}

export function hashPreCp1Input(input: PreCp1Input): string {
  return createHash('sha256').update(stableStringify(input)).digest('hex')
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002'
}

export async function savePreCp1UseCase(
  body: SavePreCp1Input,
  deps: SavePreCp1Deps,
): Promise<SavePreCp1Result> {
  const t0 = Date.now()
  const caseId = body.caseId ?? null
  const teamFit = deriveTeamFitInput(body.input)

  // The AI report is stored next to its idea and team; without them the two
  // NOT NULL snapshot columns would have to be faked.
  if (body.aiResult && (!body.input.madlibs || !teamFit)) {
    throw new AppError(400, 'PRE_CP1_AI_MISMATCH', 'Báo cáo AI cần đủ sáu câu mô tả và nhóm chấm được theo ngành.')
  }

  if (caseId) {
    const owned = await deps.findCaseOwnedBy(caseId, body.userId)
    if (!owned) throw new AppError(404, 'CASE_NOT_FOUND', 'Không tìm thấy dự án của bạn.')
  }

  const inputHash = hashPreCp1Input(body.input)
  const existing = await deps.findReportByHash(caseId, inputHash, body.userId)
  if (existing) {
    // The result step saves before the AI answers. The second save has the same
    // answers, so it lands here; without this the verdict would be dropped.
    if ((body.aiResult && teamFit) || (!existing.has_ai_labels && body.aiLabels?.length)) {
      await deps.attachAi({
        reportId: existing.id,
        caseId,
        inputHash,
        aiLabels: existing.has_ai_labels ? null : body.aiLabels,
        aiResult: body.aiResult,
        teamFit,
      })
    }
    return { id: existing.id, isNew: false, report: existing.report_snapshot }
  }

  if (caseId && body.reportId && deps.findUnlinkedReportById && deps.attachCaseToReport) {
    const unlinked = await deps.findUnlinkedReportById(body.reportId, body.userId)
    if (unlinked && (!unlinked.input_hash || unlinked.input_hash === inputHash)) {
      await deps.attachCaseToReport({
        reportId: unlinked.id,
        caseId,
        aiLabels: unlinked.has_ai_labels ? null : body.aiLabels,
        aiResult: body.aiResult,
        teamFit,
      })
      return { id: unlinked.id, isNew: false, report: unlinked.report_snapshot }
    }
  }

  const report = buildPreCp1Report(body.input)
  const data: CreatePreCp1ReportData = {
    caseId,
    userId: body.userId,
    inputHash,
    input: body.input,
    aiLabels: body.aiLabels,
    report,
    aiResult: body.aiResult,
    teamFit,
  }

  try {
    const created = await deps.createReport(data)
    const flags = report.flags
    logger.info(
      {
        caseId,
        duration_ms: Date.now() - t0,
        emptyRoles: report.coverage.empty.length,
        warnFlags: flags.filter((f) => f.status === 'warn').length,
        hardFlags: flags.filter((f) => f.status === 'hard').length,
        hasAiResult: Boolean(body.aiResult),
      },
      'pre-cp1 report saved',
    )
    return { id: created.id, isNew: true, report }
  } catch (error) {
    // Two tabs saving the same answers: the unique key decides, not the race.
    if (isUniqueViolation(error)) {
      const raced = await deps.findReportByHash(caseId, inputHash, body.userId)
      if (raced) return { id: raced.id, isNew: false, report: raced.report_snapshot }
    }
    throw error
  }
}
