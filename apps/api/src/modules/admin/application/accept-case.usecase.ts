import { AppError } from "../../../shared/domain/app-error.js";
import { executeTransition } from "../../../services/case-transition.service.js";
import { findCaseById as defaultFindCaseById } from "../../cases/infrastructure/persistence/case.repository.js";
import { auditLogger } from "../../../shared/infrastructure/audit-logger.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";

export async function acceptCaseUseCase(
  adminId: string,
  caseId: string,
  _deps?: { findCaseById?: typeof defaultFindCaseById },
) {
  const timer = auditLogger.startTimer();
  if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "ID dự án không hợp lệ");
  }

  const findCaseById = _deps?.findCaseById ?? defaultFindCaseById;
  const caseItem = await findCaseById(caseId);
  if (!caseItem) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  const result = await executeTransition({
    transition: 'T5_ACCEPT',
    caseId,
    actorId: adminId,
    roleVerified: 'ADMIN',
  });

  auditLogger.log({
    operation: "admin.accept_case",
    actor_id: adminId,
    actor_role: "admin",
    case_id: caseId,
    action: "T5_ACCEPT",
    new_state: { stage: result.stage, status: result.status },
    duration_ms: timer(),
  });

  emitEvent({
    eventId: crypto.randomUUID(),
    type: DOMAIN_EVENTS.CASE_APPROVED,
    actorId: adminId,
    occurredAt: new Date(),
    payload: { caseId, caseCode: caseItem.case_code },
  });

  return result;
}
