import { prisma } from "../../../../db.js";
import type { Prisma } from "@prisma/client";
import { upsertReportArtifactDocumentRecord } from "../../../documents/infrastructure/persistence/document.repository.js";
import { ensureCheckpoint } from "../../../cases/infrastructure/persistence/case.repository.js";

export async function findDraftReportByCaseId(caseId: string) {
  return await prisma.report.findFirst({
    where: { case_id: caseId, status: "draft" },
    orderBy: { updated_at: "desc" },
  });
}

export async function findReportById(id: string) {
  return await prisma.report.findUnique({
    where: { id },
    include: {
      case: {
        select: {
          id: true,
          case_code: true,
          owner_auth_user_id: true,
          assigned_supporter_auth_user_id: true,
          user_facing_stage: true,
          internal_status: true,
          members: {
            select: {
              auth_user_id: true,
            },
          },
        },
      },
    },
  });
}

export async function upsertReportDraft(data: {
  caseId: string;
  checkpointId: string;
  lifecycleUnitId: string;
  contentMd: string;
  userId: string;
}) {
  const { caseId, checkpointId, lifecycleUnitId, contentMd, userId } = data;

  return await prisma.$transaction(async (tx: any) => {
    const existingDraft = await tx.report.findFirst({
      where: { case_id: caseId, status: "draft" },
      orderBy: { updated_at: "desc" },
    });

    if (existingDraft) {
      return await tx.report.update({
        where: { id: existingDraft.id },
        data: {
          checkpoint_id: checkpointId,
          lifecycle_unit_id: lifecycleUnitId,
          report_type: "checkpoint_1_review",
          content_md: contentMd,
          created_by: userId,
        },
      });
    }

    return await tx.report.create({
      data: {
        case_id: caseId,
        checkpoint_id: checkpointId,
        lifecycle_unit_id: lifecycleUnitId,
        report_type: "checkpoint_1_review",
        content_md: contentMd,
        status: "draft",
        created_by: userId,
      },
    });
  });
}

export async function updateReportDraftContent(id: string, contentMd: string) {
  return await prisma.report.update({
    where: { id },
    data: { content_md: contentMd },
  });
}

export async function publishReport(reportId: string, caseId: string, userId: string) {
  return await prisma.$transaction(async (tx: any) => {
    const updatedReport = await tx.report.update({
      where: { id: reportId },
      data: {
        status: "APPROVED",
        approved_by_auth_user_id: userId,
        sent_at: new Date(),
      },
    });

    await tx.case.update({
      where: { id: caseId },
      data: {
        user_facing_stage: "report_ready",
        internal_status: "report_ready_to_publish",
      },
    });

    const linkedUnit = updatedReport.lifecycle_unit_id
      ? await tx.lifecycleUnit.findUnique({
          where: { id: updatedReport.lifecycle_unit_id },
        })
      : null;

    await upsertReportArtifactDocumentRecord(
      caseId,
      updatedReport.checkpoint_id,
      updatedReport.lifecycle_unit_id,
      linkedUnit?.unit_code || null,
      updatedReport.id,
      userId,
      tx,
    );

    return updatedReport;
  });
}

export async function findLatestApprovedReport(caseId: string) {
  return await prisma.report.findFirst({
    where: { case_id: caseId, status: "APPROVED" },
    orderBy: { updated_at: "desc" },
  });
}

export async function findApprovedReports(caseId: string) {
  return await prisma.report.findMany({
    where: { case_id: caseId, status: "APPROVED" },
    orderBy: { created_at: "desc" },
  });
}

/**
 * Resolve the checkpoint an OMP audit report belongs to.
 *
 * Priority:
 *  1. The lifecycle unit's own checkpoint — the artifact is versioned under a
 *     specific checkpoint, so this is the authoritative route (fixes the old
 *     CP1 mis-route that always picked the oldest checkpoint by created_at).
 *  2. The case's `current_checkpoint` code, when it matches a real checkpoint.
 *  3. The checkpoint with the highest `latest_version_no`.
 *  4. Create CP1 as a last resort (backward-compatible with fresh cases).
 */
async function resolveOmpAuditCheckpoint(
  caseId: string,
  lifecycleUnitId: string | null | undefined,
  db: Pick<typeof prisma, "checkpoint" | "report" | "lifecycleUnit" | "case">,
) {
  if (lifecycleUnitId) {
    const unit = await db.lifecycleUnit.findUnique({
      where: { id: lifecycleUnitId },
      select: { id: true, case_id: true, checkpoint_id: true },
    });
    if (unit && unit.case_id === caseId) {
      const checkpoint = await db.checkpoint.findUnique({
        where: { id: unit.checkpoint_id },
      });
      if (checkpoint) return checkpoint;
    }
  }

  const caseRecord = await db.case.findUnique({
    where: { id: caseId },
    select: { current_checkpoint: true },
  });
  if (caseRecord?.current_checkpoint) {
    const checkpoint = await db.checkpoint.findFirst({
      where: { case_id: caseId, checkpoint_code: caseRecord.current_checkpoint },
    });
    if (checkpoint) return checkpoint;
  }

  const latestCheckpoint = await db.checkpoint.findFirst({
    where: { case_id: caseId },
    orderBy: [{ latest_version_no: "desc" }, { created_at: "asc" }],
  });
  if (latestCheckpoint) return latestCheckpoint;

  return await ensureCheckpoint(db, caseId, "CP1");
}

/**
 * Create a new OMP automated audit report row. Always inserts — never upserts.
 * Each AI audit run produces a distinct report linked to its lifecycle_unit.
 * Accepts an optional tx client so the caller's duplicate-report check and
 * the insert can commit atomically (code-level race guard, no DB migration).
 */
export async function saveOmpAuditReport(
  params: {
    caseId: string;
    lifecycleUnitId?: string | null;
    contentMd: string;
    metadataJson?: Record<string, unknown> | null;
  },
  db: Pick<typeof prisma, "checkpoint" | "report" | "lifecycleUnit" | "case"> = prisma,
) {
  const { caseId, lifecycleUnitId, contentMd, metadataJson } = params;

  // Route to the checkpoint the audit actually belongs to, not the oldest row.
  const checkpoint = await resolveOmpAuditCheckpoint(caseId, lifecycleUnitId, db);

  return await db.report.create({
    data: {
      case_id: caseId,
      checkpoint_id: checkpoint.id,
      report_type: "input_clarification",
      lifecycle_unit_id: lifecycleUnitId ?? null,
      content_md: contentMd,
      metadata_json: (metadataJson as Prisma.InputJsonValue) ?? undefined,
      status: "APPROVED",
      created_by: "omp_worker",
      sent_at: new Date(),
    },
  });
}
