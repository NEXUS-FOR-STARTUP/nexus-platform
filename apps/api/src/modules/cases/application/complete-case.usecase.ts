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

  if (role === "supporter" && caseRecord.assigned_supporter_auth_user_id !== userId) {
    throw new AppError(403, "FORBIDDEN", "Bạn không phải là supporter được phân công cho dự án này");
  }

  const roleVerified = role === 'admin' ? 'ADMIN' : 'SUPPORTER';

  try {
    const result = await executeTransition({
      transition: 'T14_COMPLETE',
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

    logger.info({ caseId, transition: 'T14_COMPLETE', actorId: userId, actorRole: role, duration_ms: Date.now() - startTime }, 'case transition: complete');

    return { stage: result.stage, status: result.status };
  } catch (error) {
    logger.error({ err: error, caseId, transition: 'T14_COMPLETE', actorId: userId, actorRole: role, duration_ms: Date.now() - startTime }, 'case transition failed: complete');
    throw error;
  }
}
