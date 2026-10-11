import { findStageByCode } from "@app/shared";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { findActiveDocumentTypeByCode } from "../../documents/infrastructure/persistence/document-type.repository.js";
import { validatePostIntakeDocumentInputs } from "../../documents/application/validate-document-write.js";
import { createStageUploadInTx, ensureCheckpoint } from "../infrastructure/persistence/case.repository.js";

const OPENED_CHECKPOINT_STATUS = "draft";
const CASE_CLOSED_STATUS = "cancelled";

/**
 * Student uploads files into one journey stage. Unlike /revisions/upload this
 * runs no state-machine transition: the case keeps its status and only the
 * stage's checkpoint gains documents.
 */
export async function uploadStageDocumentsUseCase(
  userId: string,
  caseId: string,
  checkpointCode: string,
  rawDocuments: unknown[],
) {
  const stage = findStageByCode(checkpointCode);
  if (!stage?.available) {
    throw new AppError(400, "VALIDATION_ERROR", "Giai đoạn này chưa mở");
  }

  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { owner_auth_user_id: true, internal_status: true },
  });
  if (!caseRecord) throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  if (caseRecord.owner_auth_user_id !== userId) {
    throw new AppError(403, "FORBIDDEN", "Không có quyền tải tài liệu cho dự án này");
  }
  if (caseRecord.internal_status === CASE_CLOSED_STATUS) {
    throw new AppError(409, "CASE_CLOSED", "Dự án đã đóng, không thể tải thêm tài liệu");
  }

  const documents = validatePostIntakeDocumentInputs(rawDocuments);
  for (const document of documents) {
    const docType = await findActiveDocumentTypeByCode(document.doc_type);
    if (!docType || docType.flow !== "revision" || docType.unit_scope !== "version") {
      throw new AppError(400, "VALIDATION_ERROR", `Loại tài liệu không hợp lệ: ${document.doc_type}`);
    }
  }

  const unit = await prisma.$transaction(async (tx) => {
    const checkpoint = await ensureCheckpoint(tx, caseId, stage.code, OPENED_CHECKPOINT_STATUS);
    return createStageUploadInTx(tx, { caseId, checkpointId: checkpoint.id, userId, documents });
  });

  logger.info({ caseId, checkpoint_code: stage.code, file_count: documents.length, actorId: userId }, "stage documents uploaded");
  return { lifecycle_unit_id: unit.id, checkpoint_code: stage.code, file_count: documents.length };
}
