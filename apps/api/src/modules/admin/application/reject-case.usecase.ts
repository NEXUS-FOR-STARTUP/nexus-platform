import { AppError } from "../../../shared/domain/app-error.js";
import { findCaseById, rejectCase } from "../../cases/infrastructure/persistence/case.repository.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function rejectCaseUseCase(
  adminId: string,
  caseId: string,
  reason: string,
) {
  const startTime = Date.now();

  if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "ID dự án không hợp lệ");
  }

  if (reason.length < 10) {
    throw new AppError(400, "VALIDATION_ERROR", "Lý do từ chối tối thiểu phải 10 ký tự");
  }

  const caseItem = await findCaseById(caseId);
  if (!caseItem) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  if (
    caseItem.user_facing_stage === "rejected" &&
    caseItem.internal_status === "cancelled"
  ) {
    logger.info({ caseId, transition: 'reject', actorId: adminId, actorRole: 'admin', action: 'no_op', duration_ms: Date.now() - startTime }, 'case transition: reject (no_op)');
    return caseItem;
  }

  try {
    const result = await rejectCase(caseId, adminId, reason);
    logger.info({ caseId, transition: 'reject', fromState: caseItem.internal_status, toState: 'cancelled', actorId: adminId, actorRole: 'admin', duration_ms: Date.now() - startTime }, 'case transition: reject');
    return result;
  } catch (error) {
    logger.error({ err: error, caseId, transition: 'reject', actorId: adminId, actorRole: 'admin', duration_ms: Date.now() - startTime }, 'case transition failed: reject');
    throw error;
  }
}
