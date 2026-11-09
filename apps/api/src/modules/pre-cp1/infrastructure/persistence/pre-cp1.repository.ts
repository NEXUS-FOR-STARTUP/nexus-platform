import { prisma } from '../../../../db.js'
import type { TeamFitInput, TeamFitSavedResult } from '@repo/validation'
import type { AttachPreCp1AiData, CreatePreCp1ReportData } from '../../application/save-pre-cp1.usecase.js'

export function findCaseOwnedBy(caseId: string, userId: string) {
  return prisma.case.findFirst({
    where: { id: caseId, owner_auth_user_id: userId },
    select: { id: true },
  })
}

export async function findReportByHash(caseId: string, inputHash: string) {
  const row = await prisma.preCp1Report.findUnique({
    where: { case_id_input_hash: { case_id: caseId, input_hash: inputHash } },
    select: { id: true, report_snapshot: true, ai_labels: true },
  })
  if (!row) return null
  return { id: row.id, report_snapshot: row.report_snapshot, has_ai_labels: row.ai_labels !== null }
}

/** Fills in the AI part of an already-saved report; a rerun never overwrites a first verdict. */
export function attachAi(data: AttachPreCp1AiData) {
  return prisma.$transaction(async (tx) => {
    if (data.aiLabels?.length) {
      await tx.preCp1Report.update({
        where: { case_id_input_hash: { case_id: data.caseId, input_hash: data.inputHash } },
        data: { ai_labels: data.aiLabels },
      })
    }
    await upsertTeamFit(tx, data.caseId, data.teamFit, data.aiResult)
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
      },
      select: { id: true },
    })

    if (data.aiResult && data.teamFit) {
      await upsertTeamFit(tx, data.caseId, data.teamFit, data.aiResult)
    }

    return created
  })
}
