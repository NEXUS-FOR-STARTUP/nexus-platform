import { AppError } from "../../../shared/domain/app-error.js";
import { findCaseById, resubmitCase } from "../infrastructure/persistence/case.repository.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function resubmitCaseUseCase(userId: string, caseId: string) {
  const startTime = Date.now();

  if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "ID dự án không hợp lệ");
  }

  const caseItem = await findCaseById(caseId);
  if (!caseItem) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  if (caseItem.user_facing_stage !== "rejected") {
    throw new AppError(400, "INVALID_STAGE", "Dự án không ở trạng thái bị từ chối, không thể nộp lại");
  }

  // Ensure ownership — only the case owner can resubmit
  if (caseItem.owner_auth_user_id !== userId) {
    throw new AppError(403, "FORBIDDEN", "Bạn không phải chủ sở hữu dự án này");
  }

  try {
    const result = await resubmitCase(caseId, userId);
    logger.info({ caseId, transition: 'resubmit', fromState: 'rejected/cancelled', toState: 'submitted/triage_pending', actorId: userId, actorRole: 'user', duration_ms: Date.now() - startTime }, 'case transition: resubmit');
    return result;
  } catch (error) {
    logger.error({ err: error, caseId, transition: 'resubmit', actorId: userId, actorRole: 'user', duration_ms: Date.now() - startTime }, 'case transition failed: resubmit');
    throw error;
  }
}
