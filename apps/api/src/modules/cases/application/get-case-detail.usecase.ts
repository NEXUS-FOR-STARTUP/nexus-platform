import { AppError } from "../../../shared/domain/app-error.js";
import { assembleDocumentWorkspace } from "../../documents/application/assemble-document-workspace.js";
import { findDocumentRecordsByCaseId } from "../../documents/infrastructure/persistence/document.repository.js";
import {
  findCaseByIdWithAllRelations,
  findFirstIntakeUnit,
  findFirstUserEvent,
  findLifecycleUnits,
  findOpenRequestsForMoreInfo,
} from "../infrastructure/persistence/case.repository.js";
import {
  findLatestApprovedReport,
  findApprovedReports,
} from "../../reports/infrastructure/persistence/report.repository.js";
import { getCreditBalance, getCreditLedgerByCaseId } from "../infrastructure/persistence/credit-ledger.repository.js";
import { getAvailableTransitions } from "../domain/case-machine.js";
import { prisma } from "../../../db.js";

function normalizeIntakeSnapshot(rawContent: string | null) {
  if (!rawContent) return null;

  try {
    const parsed = JSON.parse(rawContent);
    const legacySituations = Array.isArray(parsed.current_situations)
      ? parsed.current_situations.filter((item: unknown) => typeof item === "string" && item.trim().length > 0)
      : [];

    return {
      ...parsed,
      current_situations: legacySituations,
      current_blocker:
        parsed.current_blocker ||
        parsed.case_summary ||
        legacySituations.join(" ") ||
        "",
    };
  } catch {
    return null;
  }
}

/**
 * Base response shape — safe for all roles (student, supporter, admin).
 * Internal status is excluded for student; payment_status is included so student can view case billing state.
 */
function toBaseResponse(caseDetails: any) {
  return {
    id: caseDetails.id,
    case_code: caseDetails.case_code,
    group_no: caseDetails.group_no,
    owner_auth_user_id: caseDetails.owner_auth_user_id,
    team_name: caseDetails.team_name,
    school: caseDetails.school,
    course_context: caseDetails.course_context,
    current_checkpoint: caseDetails.current_checkpoint,
    package_id: caseDetails.package_id,
    locked_price: caseDetails.locked_price,
    payment_status: caseDetails.payment_status,
    assigned_supporter_auth_user_id: caseDetails.assigned_supporter_auth_user_id,
    user_facing_stage: caseDetails.user_facing_stage,
    deadline: caseDetails.deadline,
    sla_deadline_at: caseDetails.sla_deadline_at
      ? new Date(caseDetails.sla_deadline_at).toISOString()
      : null,
    created_at: caseDetails.created_at,
    updated_at: caseDetails.updated_at,
    owner: caseDetails.owner,
    assigned_supporter: caseDetails.assigned_supporter,
    package: caseDetails.package,
    members: caseDetails.members,
    checkpoints: caseDetails.checkpoints,
    lifecycle_units: caseDetails.lifecycle_units,
    reports: caseDetails.reports,
    team_fit_report: caseDetails.team_fit_report,
    payments: caseDetails.payments,
    messages: caseDetails.messages,
    events: caseDetails.events,
  };
}

/**
 * Extend base response with internal fields for admin/supporter.
 * internal_status only for admin/supporter.
 */
function extendWithInternalFields(baseResponse: any, caseDetails: any) {
  return {
    ...baseResponse,
    internal_status: caseDetails.internal_status,
    payment_status: caseDetails.payment_status,
  };
}

export async function getCaseDetailUseCase(userId: string, userRole: string, caseId: string) {
  const caseDetails = await findCaseByIdWithAllRelations(caseId);

  if (!caseDetails) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  // Authz delegated to controller via requireCaseAccess.
  // This usecase assumes caller has already verified access.

  const intakeUnit = await findFirstIntakeUnit(caseId);
  const intake_snapshot = normalizeIntakeSnapshot(intakeUnit?.content || null);

  const latest_report = await findLatestApprovedReport(caseId);
  const latest_user_action = await findFirstUserEvent(caseId);

  const lifecycleUnits = await findLifecycleUnits(caseId);
  const reports = await findApprovedReports(caseId);

  const team_submissions = lifecycleUnits.filter((u: any) => u.unit_type === "version" && u.unit_code === "v00");
  const team_revisions = lifecycleUnits.filter((u: any) => u.unit_type === "version" && u.unit_code !== "v00");
  const nexus_reports = reports;

  const round_history = lifecycleUnits
    .map((unit: any) => {
      const report = reports.find((r: any) => r.lifecycle_unit_id === unit.id);
      return {
        round_no: unit.version_no,
        submitted_at: unit.created_at,
        submission: unit,
        report: report || null,
      };
    })
    .sort((a: any, b: any) => b.round_no - a.round_no);

  const open_requests_for_more_info = await findOpenRequestsForMoreInfo(caseId);

  const [documentRecords, docTypes] = await Promise.all([
    findDocumentRecordsByCaseId(caseId),
    prisma.documentType.findMany({ where: { is_active: true } }),
  ]);
  const document_workspace = assembleDocumentWorkspace({
    id: caseDetails.id,
    current_checkpoint: caseDetails.current_checkpoint,
    checkpoints: caseDetails.checkpoints || [],
    lifecycle_units: lifecycleUnits || [],
    document_records: documentRecords || [],
  }, docTypes);

  // VERIFY-001 fix: base shape for student, extend for admin/supporter
  const baseCase = toBaseResponse(caseDetails);
  const caseResponse = (userRole === 'admin' || userRole === 'supporter')
    ? extendWithInternalFields(baseCase, caseDetails)
    : baseCase;

  // ── Derived fields ────────────────────────────────────────────────────────
  const [credit_balance, credit_ledger] = await Promise.all([
    getCreditBalance(caseId),
    getCreditLedgerByCaseId(caseId),
  ]);
  const allowed_transitions = getAvailableTransitions(caseDetails.internal_status);

  (caseResponse as Record<string, unknown>).credit_balance = credit_balance;
  (caseResponse as Record<string, unknown>).credit_ledger = credit_ledger;
  (caseResponse as Record<string, unknown>).allowed_transitions = allowed_transitions;

  return {
    case: caseResponse,
    intake_snapshot,
    latest_report,
    latest_user_action,
    document_board_sections: {
      team_submissions,
      nexus_reports,
      team_revisions,
    },
    round_history,
    open_requests_for_more_info,
    document_workspace,
  };
}

/**
 * Lightweight usecase for document workspace only.
 * M3 fix: only loads checkpoints + lifecycle_units + document_records.
 * Skips owner, members, events, payments, reports, etc.
 */
export async function getCaseDocumentWorkspaceUseCase(caseId: string) {
  // Load only what's needed for document workspace assembly
  const [caseBasic, checkpoints, lifecycleUnits, documentRecords, docTypes] = await Promise.all([
    prisma.case.findUnique({
      where: { id: caseId },
      select: { id: true, current_checkpoint: true },
    }),
    prisma.checkpoint.findMany({
      where: { case_id: caseId },
      orderBy: { latest_version_no: "desc" },
    }),
    prisma.lifecycleUnit.findMany({
      where: { case_id: caseId },
      orderBy: { created_at: "asc" },
    }),
    findDocumentRecordsByCaseId(caseId),
    prisma.documentType.findMany({
      where: { is_active: true },
    }),
  ]);

  if (!caseBasic) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  const document_workspace = assembleDocumentWorkspace({
    id: caseBasic.id,
    current_checkpoint: caseBasic.current_checkpoint,
    checkpoints: checkpoints || [],
    lifecycle_units: lifecycleUnits || [],
    document_records: documentRecords || [],
  }, docTypes);

  return { document_workspace };
}
