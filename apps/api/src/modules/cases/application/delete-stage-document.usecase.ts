import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";

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
      case: { select: { owner_auth_user_id: true } },
    },
  });
  if (!record || record.superseded_at) {
    throw new AppError(404, "DOCUMENT_NOT_FOUND", "Không tìm thấy tài liệu cần xóa.");
  }
  if (record.case.owner_auth_user_id !== userId) {
    throw new AppError(403, "DOCUMENT_DELETE_FORBIDDEN", "Chỉ chủ đề án mới được xóa tài liệu đã nộp.");
  }
  if (record.source_kind === "generated") {
    throw new AppError(400, "DOCUMENT_DELETE_FORBIDDEN", "Không thể xóa báo cáo do hệ thống tạo.");
  }
  await prisma.documentRecord.update({
    where: { id: record.id },
    data: { superseded_at: new Date() },
  });
  return { deleted: true };
}
