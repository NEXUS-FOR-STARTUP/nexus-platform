import { AppError } from "../../../shared/domain/app-error.js";
import { acceptCase as defaultAcceptCase, findCaseById as defaultFindCaseById } from "../../cases/infrastructure/persistence/case.repository.js";
import { applyTransition, canTransition } from "../../cases/infrastructure/persistence/case-workflow-engine.js";
import { auditLogger } from "../../../shared/infrastructure/audit-logger.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";

type AcceptCaseDeps = {
  findCaseById?: typeof defaultFindCaseById;
  acceptCase?: typeof defaultAcceptCase;
};

const defaultDeps = {
  findCaseById: defaultFindCaseById,
  acceptCase: defaultAcceptCase,
};

export async function acceptCaseUseCase(adminId: string, caseId: string, deps: AcceptCaseDeps = {}) {
  const { findCaseById, acceptCase } = { ...defaultDeps, ...deps };
  const timer = auditLogger.startTimer();
  if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "ID dự án không hợp lệ");
  }

  const caseItem = await findCaseById(caseId);
  if (!caseItem) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  if (
    caseItem.user_facing_stage === "under_review" &&
    caseItem.internal_status === "accepted_unassigned"
  ) {
    auditLogger.log({
      operation: "admin.accept_case",
      actor_id: adminId,
      actor_role: "admin",
      case_id: caseId,
      action: "no_op",
      old_state: { stage: caseItem.user_facing_stage, status: caseItem.internal_status },
      new_state: { stage: caseItem.user_facing_stage, status: caseItem.internal_status },
      duration_ms: timer(),
    });
    return caseItem;
  }

  // Check symflow transition is valid
  if (!canTransition(caseItem, "accept_case")) {
    throw new AppError(409, "INVALID_TRANSITION",
      `Không thể duyệt hồ sơ từ trạng thái '${caseItem.internal_status}'`);
  }

  // Apply symflow transition (mutates caseItem.internal_status)
  applyTransition(caseItem, "accept_case");

  const result = await acceptCase(caseId, adminId,
    caseItem.internal_status,  // "accepted_unassigned" from symflow
    "under_review");
  auditLogger.log({
    operation: "admin.accept_case",
    actor_id: adminId,
    actor_role: "admin",
    case_id: caseId,
    action: "accept_case",
    old_state: { stage: caseItem.user_facing_stage, status: caseItem.internal_status },
    new_state: { stage: result.user_facing_stage, status: result.internal_status },
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
