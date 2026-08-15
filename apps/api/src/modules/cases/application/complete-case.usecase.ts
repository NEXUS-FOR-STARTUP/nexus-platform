import { AppError } from "../../../shared/domain/app-error.js";
import { executeTransition } from "../../../services/case-transition.service.js";
import logger from "../../../shared/infrastructure/logger.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { findCaseById } from "../infrastructure/persistence/case.repository.js";

export async function completeCaseUseCase(userId: string, role: string, caseId: string) {
  const startTime = Date.now();
  const caseRecord = await findCaseById(caseId);
  if (!caseRecord) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
  }

  if (role === "supporter") {
    throw new AppError(403, "FORBIDDEN", "Supporter không có quyền đóng quy trình — chỉ chủ sở hữu hoặc Admin");
  }

  const isAdmin = role === "admin";
  const isOwner = caseRecord.owner_auth_user_id === userId;

  if (!isAdmin && !isOwner) {
    throw new AppError(403, "FORBIDDEN", "Bạn không có quyền hoàn thành dự án này");
  }

  const transition = isAdmin ? "T14_COMPLETE" : "T17_USER_CONFIRM_COMPLETE";
  const roleVerified = isAdmin ? "ADMIN" : "CUSTOMER";

  try {
    const result = await executeTransition({
      transition,
      caseId,
      actorId: userId,
      roleVerified,
    });

    emitEvent({
      eventId: crypto.randomUUID(),
      type: DOMAIN_EVENTS.CASE_STAGE_CHANGED,
      actorId: userId,
      occurredAt: new Date(),
      payload: {
        caseId,
        caseCode: caseRecord.case_code,
        fromStage: caseRecord.user_facing_stage,
        toStage: 'completed',
      },
    });

    logger.info({ caseId, transition, actorId: userId, actorRole: role, duration_ms: Date.now() - startTime }, 'case transition: complete');

    return { stage: result.stage, status: result.status };
  } catch (error) {
    logger.error({ err: error, caseId, transition, actorId: userId, actorRole: role, duration_ms: Date.now() - startTime }, 'case transition failed: complete');
    throw error;
  }
}
