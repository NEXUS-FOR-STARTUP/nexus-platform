import { STAGES, type StageCode } from "@app/shared";
import { SUBMITTED_DOC_EXCLUDED_KINDS } from "../../documents/domain/document-types.js";
import { prisma } from "../../../db.js";
import { STAGE_DOC_EXCLUDED_TYPES } from "../../ai-engine/application/stage-audit-input.js";
import { evaluateCp2FullAnswers, evaluateCp2QuestionnaireAnswers } from "../../ai-engine/application/cp2-audit-input.js";
import { evaluateCp3Answers } from "../../ai-engine/application/cp3-audit-input.js";
import { runningCheckpointCode } from "../../ai-engine/infrastructure/persistence/ai-job.repository.js";

const ACTIVE_JOB_STATUSES = ["queued", "processing"];
const AUDIT_JOB_TYPE = "omp_audit";
const SELF_CHECK_ID_FRAGMENT = "_selfcheck_";

export type StageStatus = "not_started" | "drafting" | "files_submitted" | "grading" | "has_result";

export interface StageSummary {
  checkpoint_code: StageCode;
  status: StageStatus;
  answered_count: number;
  answers_ready_full: boolean;
  /** Questionnaire-scope bar (3 base + bank or attachment). Only meaningful for CP2. */
  answers_ready_questionnaire: boolean;
  file_count: number;
  latest_report: { id: string; report_type: string; created_at: Date } | null;
}

export interface StageSummariesResult {
  stages: StageSummary[];
  active_audit: { checkpoint_code: string } | null;
}

export function pickStageStatus(input: { grading: boolean; hasReport: boolean; fileCount: number; answeredCount: number }): StageStatus {
  if (input.grading) return "grading";
  if (input.hasReport) return "has_result";
  if (input.fileCount > 0) return "files_submitted";
  if (input.answeredCount > 0) return "drafting";
  return "not_started";
}

/** Answer ids are prefixed by their template (`cp1_…`, `cp2_…`); self-checks are not answers. */
export function countAnswersByStage(answers: Array<{ question_id: string; answer_text: string }>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const answer of answers) {
    if (answer.answer_text.trim() === "" || answer.question_id.includes(SELF_CHECK_ID_FRAGMENT)) continue;
    const stage = STAGES.find((s) => answer.question_id.startsWith(`${s.templateKey}_`));
    if (stage) counts.set(stage.code, (counts.get(stage.code) ?? 0) + 1);
  }
  return counts;
}

export async function deriveStageSummaries(caseId: string): Promise<StageSummariesResult> {
  const [checkpoints, docCounts, answers, activeJob, reports] = await Promise.all([
    prisma.checkpoint.findMany({ where: { case_id: caseId }, select: { id: true, checkpoint_code: true } }),
    prisma.documentRecord.groupBy({
      by: ["checkpoint_id"],
      where: { case_id: caseId, superseded_at: null, source_kind: { notIn: [...SUBMITTED_DOC_EXCLUDED_KINDS] }, doc_type: { notIn: STAGE_DOC_EXCLUDED_TYPES } },
      _count: { _all: true },
    }),
    prisma.projectAnswer.findMany({ where: { case_id: caseId }, select: { question_id: true, answer_text: true } }),
    prisma.aiJob.findFirst({
      where: { case_id: caseId, job_type: AUDIT_JOB_TYPE, status: { in: ACTIVE_JOB_STATUSES } },
      orderBy: { created_at: "desc" },
      select: { input_json: true },
    }),
    prisma.report.findMany({
      where: { case_id: caseId },
      orderBy: { created_at: "desc" },
      select: { id: true, report_type: true, created_at: true, checkpoint_id: true },
    }),
  ]);

  const idByCode = new Map(checkpoints.map((c) => [c.checkpoint_code, c.id]));
  const fileCountById = new Map(docCounts.map((d) => [d.checkpoint_id, d._count._all]));
  const answerCounts = countAnswersByStage(answers);
  const answerMap = Object.fromEntries(answers.map((a) => [a.question_id, a.answer_text]));
  const cp2FullReady = evaluateCp2FullAnswers(answerMap).ok;
  const cp3Ready = evaluateCp3Answers(answerMap).ok;
  const cp2QuestionnaireReady = (checkpointId: string | undefined): boolean =>
    checkpointId !== undefined &&
    evaluateCp2QuestionnaireAnswers(answerMap, (fileCountById.get(checkpointId) ?? 0) > 0).ok;
  const grading = activeJob ? runningCheckpointCode(activeJob.input_json) : null;

  const stages = STAGES.map((stage): StageSummary => {
    const checkpointId = idByCode.get(stage.code);
    const latest = checkpointId ? reports.find((r) => r.checkpoint_id === checkpointId) : undefined;
    const fileCount = checkpointId ? (fileCountById.get(checkpointId) ?? 0) : 0;
    const answeredCount = answerCounts.get(stage.code) ?? 0;
    return {
      checkpoint_code: stage.code,
      status: pickStageStatus({ grading: grading === stage.code, hasReport: Boolean(latest), fileCount, answeredCount }),
      answered_count: answeredCount,
      // CP1 has no answer bar here; CP2 and CP3 report the bar their trigger enforces (env-driven, so computed at read time).
      answers_ready_full: stage.code === "CP2" ? cp2FullReady : stage.code === "CP3" ? cp3Ready : true,
      answers_ready_questionnaire: stage.code === "CP2" ? cp2QuestionnaireReady(checkpointId) : true,
      file_count: fileCount,
      latest_report: latest ? { id: latest.id, report_type: latest.report_type, created_at: latest.created_at } : null,
    };
  });

  return { stages, active_audit: grading ? { checkpoint_code: grading } : null };
}
