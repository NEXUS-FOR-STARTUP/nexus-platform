import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { recordCaseEvent } from "../infrastructure/persistence/case-event.repository.js";

const CASE_CLOSED_STATUS = "cancelled";

/**
 * Soft-delete a student-uploaded stage document (sets superseded_at so every
 * existing "superseded_at: null" read stops seeing it). Generated reports and
 * other students' files are never deletable through this path.
 */
export async function deleteStageDocumentUseCase(
  userId: string,
  caseId: string,
  documentId: string,
): Promise<{ deleted: boolean }> {
  const record = await prisma.documentRecord.findFirst({
    where: { id: documentId, case_id: caseId },
    select: {
      id: true,
      case_id: true,
      superseded_at: true,
      source_kind: true,
      doc_type: true,
      original_name: true,
      checkpoint: { select: { checkpoint_code: true } },
      case: { select: { owner_auth_user_id: true, internal_status: true } },
    },
  });
  if (!record || record.superseded_at) {
    throw new AppError(404, "DOCUMENT_NOT_FOUND", "Không tìm thấy tài liệu cần xóa.");
  }
  if (record.case.owner_auth_user_id !== userId) {
    throw new AppError(403, "DOCUMENT_DELETE_FORBIDDEN", "Chỉ chủ đề án mới được xóa tài liệu đã nộp.");
  }
  if (record.case.internal_status === CASE_CLOSED_STATUS) {
    throw new AppError(409, "CASE_CLOSED", "Dự án đã đóng, không thể xóa tài liệu.");
  }
  if (record.source_kind === "generated") {
    throw new AppError(400, "DOCUMENT_DELETE_FORBIDDEN", "Không thể xóa báo cáo do hệ thống tạo.");
  }
  const deletedCount = await prisma.$transaction(async (tx) => {
    const result = await tx.documentRecord.updateMany({
      where: { id: record.id, superseded_at: null },
      data: { superseded_at: new Date() },
    });
    if (result.count === 0) return 0;
    await recordCaseEvent(tx, {
      caseId,
      eventType: "stage_document_deleted",
      actorUserId: userId,
      documentId: record.id,
      metadata: { file_name: record.original_name, checkpoint_code: record.checkpoint?.checkpoint_code ?? null },
    });
    return result.count;
  });
  if (deletedCount === 0) {
    throw new AppError(404, "DOCUMENT_NOT_FOUND", "Không tìm thấy tài liệu cần xóa.");
  }
  return { deleted: true };
}
