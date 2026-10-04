import { AppError } from "../../../shared/domain/app-error.js";
import { executeTransition } from "../../../services/case-transition.service.js";
import logger from "../../../shared/infrastructure/logger.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { findCaseById } from "../infrastructure/persistence/case.repository.js";

export async function vetoCaseUseCase(adminId: string, caseId: string, reason: string) {
  const startTime = Date.now();

  if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "ID dự án không hợp lệ");
  }

  const caseItem = await findCaseById(caseId);
  if (!caseItem) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  try {
    const result = await executeTransition({
      transition: 'T13_VETO',
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
      payload: { caseId, caseCode: caseItem.case_code, reason },
    });

    logger.info({ caseId, transition: 'T13_VETO', actorId: adminId, actorRole: 'admin', duration_ms: Date.now() - startTime }, 'case transition: veto');

    return result;
  } catch (error) {
    logger.error({ err: error, caseId, transition: 'T13_VETO', actorId: adminId, actorRole: 'admin', duration_ms: Date.now() - startTime }, 'case transition failed: veto');
    throw error;
  }
}
