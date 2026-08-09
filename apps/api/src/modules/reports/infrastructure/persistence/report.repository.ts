import { prisma } from "../../../../db.js";
import { upsertReportArtifactDocumentRecord } from "../../../documents/infrastructure/persistence/document.repository.js";

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
