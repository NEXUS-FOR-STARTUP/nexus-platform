import { prisma } from '../../../../db.js'
import type { TeamFitInput, TeamFitSavedResult } from '@repo/validation'
import type {
  AttachCaseToReportData,
  AttachPreCp1AiData,
  CreatePreCp1ReportData,
} from '../../application/save-pre-cp1.usecase.js'

export function findCaseOwnedBy(caseId: string, userId: string) {
  return prisma.case.findFirst({
    where: { id: caseId, owner_auth_user_id: userId },
    select: { id: true },
  })
}

export async function findReportByHash(caseId: string | null, inputHash: string, userId?: string) {
  const row = caseId
    ? await prisma.preCp1Report.findUnique({
        where: { case_id_input_hash: { case_id: caseId, input_hash: inputHash } },
        select: { id: true, input_hash: true, report_snapshot: true, ai_labels: true },
      })
    : userId
      ? await prisma.preCp1Report.findFirst({
          where: { auth_user_id: userId, case_id: null, input_hash: inputHash },
          orderBy: { created_at: 'desc' },
          select: { id: true, input_hash: true, report_snapshot: true, ai_labels: true },
        })
      : null
  if (!row) return null
  return {
    id: row.id,
    input_hash: row.input_hash,
    report_snapshot: row.report_snapshot,
    has_ai_labels: row.ai_labels !== null,
  }
}

export async function findUnlinkedReportById(reportId: string, userId: string) {
  const row = await prisma.preCp1Report.findFirst({
    where: { id: reportId, auth_user_id: userId, case_id: null },
    select: { id: true, input_hash: true, report_snapshot: true, ai_labels: true },
  })
  if (!row) return null
  return {
    id: row.id,
    input_hash: row.input_hash,
    report_snapshot: row.report_snapshot,
    has_ai_labels: row.ai_labels !== null,
  }
}

/** Fills in the AI part of an already-saved report; a rerun never overwrites a first verdict on team_fit_reports. */
export function attachAi(data: AttachPreCp1AiData) {
  return prisma.$transaction(async (tx) => {
    const updateData: { ai_labels?: object; team_fit_snapshot?: object } = {}
    if (data.aiLabels?.length) updateData.ai_labels = data.aiLabels as object
    if (data.aiResult) updateData.team_fit_snapshot = data.aiResult as object

    if (Object.keys(updateData).length > 0) {
      await tx.preCp1Report.update({
        where: { id: data.reportId },
        data: updateData,
      })
    }
    if (data.caseId && data.aiResult && data.teamFit) {
      await upsertTeamFit(tx, data.caseId, data.teamFit, data.aiResult)
    }
  })
}

export function attachCaseToReport(data: AttachCaseToReportData) {
  return prisma.$transaction(async (tx) => {
    await tx.preCp1Report.update({
      where: { id: data.reportId },
      data: {
        case_id: data.caseId,
        ...(data.aiLabels?.length ? { ai_labels: data.aiLabels as object } : {}),
        ...(data.aiResult ? { team_fit_snapshot: data.aiResult as object } : {}),
      },
    })
    if (data.aiResult && data.teamFit) {
      await upsertTeamFit(tx, data.caseId, data.teamFit, data.aiResult)
    }
  })
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/** team_fit_reports allows one row per case, so an existing report stays untouched. */
function upsertTeamFit(tx: Tx, caseId: string, teamFit: TeamFitInput, aiResult: TeamFitSavedResult) {
  return tx.teamFitReport.upsert({
    where: { case_id: caseId },
    create: {
      case_id: caseId,
      idea_snapshot: teamFit.idea,
      team_snapshot: teamFit.team,
      result_snapshot: aiResult as object,
    },
    update: {},
  })
}

/** One transaction: the result of the flow and, when the AI judged the team, its report. */
export function createReport(data: CreatePreCp1ReportData) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.preCp1Report.create({
      data: {
        case_id: data.caseId,
        auth_user_id: data.userId,
        input_hash: data.inputHash,
        input_snapshot: data.input,
        ai_labels: data.aiLabels ?? undefined,
        report_snapshot: data.report as object,
        team_fit_snapshot: (data.aiResult as object) ?? undefined,
      },
      select: { id: true },
    })

    if (data.caseId && data.aiResult && data.teamFit) {
      await upsertTeamFit(tx, data.caseId, data.teamFit, data.aiResult)
    }

    return created
  })
}

const PRE_CP1_HISTORY_LIMIT = 50
export interface RawPreCp1HistoryRow {
  id: string
  case_id: string | null
  auth_user_id: string
  input_hash: string
  input_snapshot: unknown
  ai_labels: unknown
  report_snapshot: unknown
  team_fit_snapshot: unknown
  created_at: Date
  case: {
    id: string
    case_code: string
    team_name: string | null
    team_fit_report: { result_snapshot: unknown } | null
  } | null
}

export function mapPreCp1HistoryRow(row: RawPreCp1HistoryRow) {
  return {
    id: row.id,
    case_id: row.case_id,
    auth_user_id: row.auth_user_id,
    input_hash: row.input_hash,
    input_snapshot: row.input_snapshot,
    ai_labels: row.ai_labels,
    report_snapshot: row.report_snapshot,
    team_fit_snapshot: row.team_fit_snapshot ?? row.case?.team_fit_report?.result_snapshot ?? null,
    created_at: row.created_at,
    case: row.case
      ? { id: row.case.id, case_code: row.case.case_code, team_name: row.case.team_name }
      : null,
  }
}


export async function findPreCp1HistoryByUser(userId: string) {
  const rows = await prisma.preCp1Report.findMany({
    where: { auth_user_id: userId },
    orderBy: { created_at: 'desc' },
    take: PRE_CP1_HISTORY_LIMIT,
    select: {
      id: true,
      case_id: true,
      auth_user_id: true,
      input_hash: true,
      input_snapshot: true,
      ai_labels: true,
      report_snapshot: true,
      team_fit_snapshot: true,
      created_at: true,
      case: {
        select: {
          id: true,
          case_code: true,
          team_name: true,
          team_fit_report: {
            select: { result_snapshot: true },
          },
        },
      },
    },
  })

  return rows.map(mapPreCp1HistoryRow)
}
