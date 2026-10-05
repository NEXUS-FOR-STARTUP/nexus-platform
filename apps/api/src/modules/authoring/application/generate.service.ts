import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { dispatchAuthoringJob } from "../infrastructure/queue/authoring-queue.js";
import {
  CATALOG_VERSION,
  buildGenerateIdempotencyKey,
  checkGenerationGate,
  getTemplate,
} from "../domain/authoring-domain.js";
import {
  loadAnswerRows,
  resolveAuthoringCheckpointId,
  toAnswerStateMap,
} from "./authoring-persistence.js";

// ---------------------------------------------------------------------------
// Generate dispatch + job/document reads (plan §6, clause 8/10/11/14). No credit
// ledger is imported here or anywhere in this module (plan §3 landmine, T9).
// ---------------------------------------------------------------------------

export async function dispatchGenerate(caseId: string, templateKey: string) {
  const template = getTemplate(templateKey);
  if (!template) {
    throw new AppError(404, "TEMPLATE_NOT_FOUND", "Không tìm thấy template");
  }

  const rows = await loadAnswerRows(caseId);
  const answers = toAnswerStateMap(rows);

  const gate = checkGenerationGate(template, answers);
  if (!gate.ok) {
    throw new AppError(409, "GENERATION_BLOCKED", "Chưa đủ điều kiện để tạo tài liệu", {
      missing_required: gate.missing_required,
      stale_required: gate.stale_required,
      warnings: gate.warnings,
    });
  }

  // Snapshot { question_id: revision_no } for every answered question so output
  // provenance is immutable even after later edits (clause 10).
  const revisions = await prisma.answerRevision.findMany({
    where: { case_id: caseId },
    select: { question_id: true, revision_no: true },
  });
  const latestByQuestion: Record<string, number> = {};
  for (const r of revisions) {
    latestByQuestion[r.question_id] = Math.max(latestByQuestion[r.question_id] ?? 0, r.revision_no);
  }
  const snapshot: Record<string, number> = {};
  for (const phase of template.phases) {
    for (const { question_id } of phase.questions) {
      if (answers[question_id]) snapshot[question_id] = latestByQuestion[question_id] ?? 1;
    }
  }

  const idempotencyKey = buildGenerateIdempotencyKey(caseId, templateKey, snapshot);

  // In-progress guard: a second generate while queued/running returns the existing job.
  const inProgress = await prisma.authoringJob.findFirst({
    where: {
      case_id: caseId,
      template_key: templateKey,
      kind: "generate",
      status: { in: ["queued", "running"] },
    },
    orderBy: { created_at: "desc" },
  });
  if (inProgress) {
    return { job_id: inProgress.id, status: inProgress.status, reused: true };
  }

  // Durable idempotency key: same snapshot → existing (possibly succeeded) job.
  const byKey = await prisma.authoringJob.findUnique({ where: { idempotency_key: idempotencyKey } });
  if (byKey) {
    return { job_id: byKey.id, status: byKey.status, reused: true };
  }

  const checkpointId = await resolveAuthoringCheckpointId(caseId);
  if (!checkpointId) {
    throw new AppError(409, "NO_CHECKPOINT", "Hồ sơ chưa có checkpoint để tạo tài liệu");
  }

  const job = await prisma.authoringJob.create({
    data: {
      case_id: caseId,
      checkpoint_id: checkpointId,
      template_key: templateKey,
      kind: "generate",
      status: "queued",
      // SAFETY: snapshot is a JSON-serializable { question_id: number } map.
      input_revision_snapshot: snapshot as unknown as Prisma.InputJsonValue,
      idempotency_key: idempotencyKey,
      catalog_version: CATALOG_VERSION,
    },
  });

  try {
    await dispatchAuthoringJob({
      authoringJobId: job.id,
      caseId,
      kind: "generate",
      templateKey,
      checkpointId,
      inputRevisionSnapshot: snapshot,
    });
  } catch (err) {
    await prisma.authoringJob
      .update({ where: { id: job.id }, data: { status: "failed", error: String(err) } })
      .catch(() => {});
    throw err;
  }

  return { job_id: job.id, status: "queued", reused: false };
}

export async function getAuthoringJob(caseId: string, jobId: string) {
  const job = await prisma.authoringJob.findFirst({ where: { id: jobId, case_id: caseId } });
  if (!job) {
    throw new AppError(404, "JOB_NOT_FOUND", "Không tìm thấy tiến trình");
  }
  return {
    id: job.id,
    kind: job.kind,
    template_key: job.template_key,
    status: job.status,
    error: job.error,
    output_lifecycle_unit_id: job.output_lifecycle_unit_id,
    created_at: job.created_at,
    updated_at: job.updated_at,
  };
}

export async function getGeneratedDocument(caseId: string, unitId: string) {
  const unit = await prisma.lifecycleUnit.findFirst({
    where: { id: unitId, case_id: caseId },
  });
  if (!unit) {
    throw new AppError(404, "DOCUMENT_NOT_FOUND", "Không tìm thấy tài liệu");
  }
  const document = await prisma.documentRecord.findFirst({
    where: { lifecycle_unit_id: unitId, case_id: caseId, superseded_at: null },
    orderBy: { seq: "asc" },
  });
  return {
    unit: {
      id: unit.id,
      unit_code: unit.unit_code,
      unit_type: unit.unit_type,
      checkpoint_id: unit.checkpoint_id,
    },
    document: document
      ? {
          id: document.id,
          canonical_name: document.canonical_name,
          original_name: document.original_name,
          download_url: document.download_url,
          file_url: document.file_url,
          mime_type: document.mime_type,
          created_at: document.created_at,
        }
      : null,
  };
}
