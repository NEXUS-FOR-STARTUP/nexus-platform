import type { AuditCheckpointCode, AuditSubmissionType, Cp2InputSource } from "@app/shared";
import { prisma } from "../../../db.js";
import { AUDIT_STAGE_INPUT_RULES } from "../../../env.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { ensureCheckpoint, findFirstIntakeUnit } from "../../cases/infrastructure/persistence/case.repository.js";
import { findLatestCp2FullReport, findLatestCp3FullReport } from "../../reports/infrastructure/persistence/report.repository.js";
import type { SandboxOptions } from "../omp-audit.service.js";
import { cp1Instruction, cp2Instruction, cp3Instruction } from "./audit-instructions.js";
import type { AuditPlan } from "./audit-registry.js";
import { buildCp2AgentsMd, cp2ValidatorSource } from "./cp2-agents-md.js";
import { CP2_CHECKPOINT_CODE, assertCp2InputSource } from "./cp2-audit-input.js";
import { buildCp3AgentsMd } from "./cp3-agents-md.js";
import { CP3_CHECKPOINT_CODE, assertCp3InputSource } from "./cp3-audit-input.js";
import { STAGE_DOC_EXCLUDED_TYPES } from "./stage-audit-input.js";
import { SUBMITTED_DOC_EXCLUDED_KINDS } from "../../documents/domain/document-types.js";
import type { TriggerOpts, TriggerOptsInput } from "./trigger-opts.js";

const CP2_OPENED_STATUS = "draft";

export interface PreflightContext {
  caseId: string;
  plan: AuditPlan;
  submissionType: AuditSubmissionType;
  inputSource?: Cp2InputSource;
  /** Admin retry or force-supersede: the guard may be bypassed. */
  override: boolean;
}

/**
 * Everything that differs between audit services, in one place. The coordinator, finalizer and admin
 * retry call these hooks and never branch on a checkpoint code. Shared infra (queue, credit, PDF,
 * persistence) stays outside the registry. Adding a service = one entry here + its `AUDIT_CHECKPOINTS`
 * row, prompts, input assembler and post-processor.
 */
export interface AuditService {
  /** Selects the scope row of the lookup table (CP1: prompt mode chosen by admin; CP2: the team's scope). */
  planScope: (opts: TriggerOpts) => string;
  /** Rewrites the requested submission type before the plan is resolved. */
  normalizeSubmissionType?: (caseId: string, requested: AuditSubmissionType) => Promise<AuditSubmissionType>;
  /** Cross-field option rules; returns one issue per violation. */
  optsIssues: (opts: TriggerOpts) => Array<{ path: string; message: string }>;
  /** Guards run before the credit is charged; throw an AppError to reject the trigger for free. */
  preflight: (ctx: PreflightContext) => Promise<void>;
  /** Service-only fields stored on `ai_jobs.input_json`. */
  jobInputExtras: (opts: TriggerOpts) => Record<string, unknown>;
  /** Trigger options that re-run a job of this service from its stored `input_json`. */
  rerunInput: (lastInput: Record<string, unknown>) => Partial<TriggerOptsInput>;
  sandbox: (plan: AuditPlan, submissionType: AuditSubmissionType) => SandboxOptions;
  instruction: (plan: AuditPlan, submissionType: AuditSubmissionType) => string;
  /** The markdown report the agent writes next to `report.json`. */
  reportMdName: string;
  /** CP1 reports hang off a lifecycle unit (versioning, dedupe) and render with the legacy PDF template. */
  lifecycleUnit: boolean;
}

const cp1: AuditService = {
  planScope: (opts) => opts.prompt_mode ?? "full",
  optsIssues: (opts) => [
    ...(opts.scope !== undefined ? [{ path: "scope", message: "scope is not accepted for CP1" }] : []),
    ...(opts.input_source !== undefined ? [{ path: "input_source", message: "input_source is not accepted for CP1" }] : []),
  ],
  // An initial report already on the intake unit blocks a second initial (re-grading goes through resubmit).
  // Under AUDIT_STAGE_INPUT_RULES the student re-grades from the stage page with the same input, so it does not.
  preflight: async ({ caseId, submissionType, override }) => {
    if (submissionType !== "initial" || AUDIT_STAGE_INPUT_RULES || override) return;
    const intakeUnit = await findFirstIntakeUnit(caseId);
    if (!intakeUnit) return;
    const existingInitial = await prisma.report.findFirst({
      where: { lifecycle_unit_id: intakeUnit.id, report_type: "input_clarification", created_at: { lt: new Date() } },
      orderBy: { created_at: "asc" },
    });
    if (existingInitial) {
      throw new AppError(409, "AUDIT_IN_PROGRESS", "Báo cáo Ban đầu đã tồn tại. Vui lòng sử dụng Tạo lại (resubmit) nếu cần gửi tài liệu sửa đổi.");
    }
  },
  jobInputExtras: (opts) => ({
    ...(opts.change_summary?.trim() ? { change_summary: opts.change_summary.trim() } : {}),
    ...(opts.user_note?.trim() ? { user_note: opts.user_note.trim() } : {}),
  }),
  rerunInput: () => ({}),
  sandbox: (plan) => ({ promptFiles: plan.prompts }),
  instruction: cp1Instruction,
  reportMdName: "input_clarification_audit.md",
  lifecycleUnit: true,
};

const cp2: AuditService = {
  planScope: (opts) => opts.scope as string,
  // The team may pick resubmit in the modal, but with no previous full report there is nothing to compare with.
  normalizeSubmissionType: async (caseId, requested) => (requested === "resubmit" && !(await findLatestCp2FullReport(caseId)) ? "initial" : requested),
  optsIssues: (opts) => [
    ...(opts.scope === undefined ? [{ path: "scope", message: "scope is required for CP2" }] : []),
    ...(opts.submission_type === "logic_check" ? [{ path: "submission_type", message: "logic_check is not available for CP2" }] : []),
  ],
  // The checkpoint row must exist (files and reports hang off it). Junk answers get a clean 400 here instead
  // of a failed job + refund; the assembler re-checks post-charge (TOCTOU).
  preflight: async ({ caseId, plan, inputSource }) => {
    await ensureCheckpoint(prisma, caseId, CP2_CHECKPOINT_CODE, CP2_OPENED_STATUS);
    const gateRows = await prisma.projectAnswer.findMany({ where: { case_id: caseId }, select: { question_id: true, answer_text: true } });
    const gateAnswers = Object.fromEntries(gateRows.map((r) => [r.question_id, r.answer_text]));
    const gateCheckpoint = await prisma.checkpoint.findUnique({
      where: { case_id_checkpoint_code: { case_id: caseId, checkpoint_code: CP2_CHECKPOINT_CODE } },
      select: { id: true },
    });
    const gateFiles = gateCheckpoint
      ? await prisma.documentRecord.count({
          where: { case_id: caseId, checkpoint_id: gateCheckpoint.id, superseded_at: null, source_kind: { notIn: [...SUBMITTED_DOC_EXCLUDED_KINDS] }, doc_type: { notIn: STAGE_DOC_EXCLUDED_TYPES } },
        })
      : 0;
    assertCp2InputSource(caseId, gateAnswers, plan.scope, inputSource, gateFiles);
  },
  jobInputExtras: (opts) => ({
    input_source: opts.input_source,
    ...(opts.change_summary?.trim() ? { change_summary: opts.change_summary.trim() } : {}),
    ...(opts.user_note?.trim() ? { user_note: opts.user_note.trim() } : {}),
  }),
  rerunInput: (last) => ({
    checkpoint: "CP2",
    scope: last.scope as "questionnaire" | "full",
    input_source: last.input_source as Cp2InputSource | undefined,
    submission_type: last.submission_type as "initial" | "resubmit",
  }),
  sandbox: (plan, submissionType) => ({
    promptFiles: plan.prompts,
    includeKnowledge: false,
    agentsMd: buildCp2AgentsMd(plan.scope, submissionType),
    tools: [cp2ValidatorSource()],
  }),
  instruction: (plan) => cp2Instruction(plan),
  reportMdName: "report.md",
  lifecycleUnit: false,
};

const CP3_OPENED_STATUS = "draft";

const cp3: AuditService = {
  // CP3 has one scope; the table row is keyed by it.
  planScope: () => "full",
  normalizeSubmissionType: async (caseId, requested) => (requested === "resubmit" && !(await findLatestCp3FullReport(caseId)) ? "initial" : requested),
  optsIssues: (opts) => [
    ...(opts.scope !== undefined && opts.scope !== "full" ? [{ path: "scope", message: "CP3 only accepts scope full" }] : []),
    ...(opts.submission_type === "logic_check" ? [{ path: "submission_type", message: "logic_check is not available for CP3" }] : []),
  ],
  // Same pre-charge guard as CP2: junk input gets a clean 400 here instead of a failed job + refund.
  preflight: async ({ caseId, inputSource }) => {
    await ensureCheckpoint(prisma, caseId, CP3_CHECKPOINT_CODE, CP3_OPENED_STATUS);
    const gateRows = await prisma.projectAnswer.findMany({ where: { case_id: caseId }, select: { question_id: true, answer_text: true } });
    const gateAnswers = Object.fromEntries(gateRows.map((r) => [r.question_id, r.answer_text]));
    const gateCheckpoint = await prisma.checkpoint.findUnique({
      where: { case_id_checkpoint_code: { case_id: caseId, checkpoint_code: CP3_CHECKPOINT_CODE } },
      select: { id: true },
    });
    const gateFiles = gateCheckpoint
      ? await prisma.documentRecord.count({
          where: { case_id: caseId, checkpoint_id: gateCheckpoint.id, superseded_at: null, source_kind: { notIn: [...SUBMITTED_DOC_EXCLUDED_KINDS] }, doc_type: { notIn: STAGE_DOC_EXCLUDED_TYPES } },
        })
      : 0;
    assertCp3InputSource(caseId, gateAnswers, inputSource, gateFiles);
  },
  jobInputExtras: (opts) => ({
    input_source: opts.input_source,
    ...(opts.change_summary?.trim() ? { change_summary: opts.change_summary.trim() } : {}),
    ...(opts.user_note?.trim() ? { user_note: opts.user_note.trim() } : {}),
  }),
  rerunInput: (last) => ({
    checkpoint: "CP3",
    scope: "full",
    input_source: last.input_source as Cp2InputSource | undefined,
    submission_type: last.submission_type as "initial" | "resubmit",
  }),
  sandbox: (plan, submissionType) => ({
    promptFiles: plan.prompts,
    includeKnowledge: false,
    agentsMd: buildCp3AgentsMd(submissionType),
    tools: [cp2ValidatorSource()],
  }),
  instruction: (plan) => cp3Instruction(plan),
  reportMdName: "report.md",
  lifecycleUnit: false,
};

/** Complete over `AuditCheckpointCode`: a checkpoint added to `AUDIT_CHECKPOINTS` without a service here fails to compile. */
const AUDIT_SERVICES: Record<AuditCheckpointCode, AuditService> = { CP1: cp1, CP2: cp2, CP3: cp3 };

/** No default: a code without a service (a stage not opened yet, a corrupt job row) is a 400, never CP1. */
export function getAuditService(code: string): AuditService {
  if (!Object.hasOwn(AUDIT_SERVICES, code)) {
    throw new AppError(400, "AUDIT_SERVICE_NOT_AVAILABLE", `Dịch vụ thẩm định ${code} chưa được mở.`);
  }
  return AUDIT_SERVICES[code as AuditCheckpointCode];
}
