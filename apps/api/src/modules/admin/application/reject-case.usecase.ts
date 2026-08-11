import { AppError } from "../../../shared/domain/app-error.js";
import { executeTransition } from "../../../services/case-transition.service.js";
import logger from "../../../shared/infrastructure/logger.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";

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

  try {
    const result = await executeTransition({
      transition: 'T12_REJECT',
      caseId,
      actorId: adminId,
      roleVerified: 'ADMIN',
      data: { reason },
    });

    emitEvent({
      eventId: crypto.randomUUID(),
      type: DOMAIN_EVENTS.CASE_REJECTED,
      actorId: adminId,
      occurredAt: new Date(),
      payload: { caseId, reason },
    });

    logger.info({ caseId, transition: 'T12_REJECT', actorId: adminId, actorRole: 'admin', duration_ms: Date.now() - startTime }, 'case transition: reject');

    return result;
  } catch (error) {
    logger.error({ err: error, caseId, transition: 'T12_REJECT', actorId: adminId, actorRole: 'admin', duration_ms: Date.now() - startTime }, 'case transition failed: reject');
    throw error;
  }
}
