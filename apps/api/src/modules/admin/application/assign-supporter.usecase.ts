import { AppError } from "../../../shared/domain/app-error.js";
import {
  assignCaseSupporter,
  findCaseById,
  findSupporterById,
} from "../../cases/infrastructure/persistence/case.repository.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { executeTransition } from "../../../services/case-transition.service.js";

export async function adminAssignSupporterUseCase(
  adminId: string,
  caseId: string,
  supporterId: string,
) {
  if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "ID dự án không hợp lệ");
  }

  if (!supporterId) {
    throw new AppError(400, "VALIDATION_ERROR", "Thiếu ID của supporter chuyên môn");
  }

  const supporterUser = await findSupporterById(supporterId);
  if (!supporterUser || supporterUser.role !== "supporter") {
    throw new AppError(400, "VALIDATION_ERROR", "Supporter được gán không hợp lệ");
  }

  const caseItem = await findCaseById(caseId);
  if (!caseItem) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  if (caseItem.assigned_supporter_auth_user_id === supporterId) {
    return caseItem;
  }

  const { status } = await executeTransition({
    transition: 'T6_ASSIGN_SUPPORTER',
    caseId,
    actorId: adminId,
    roleVerified: 'ADMIN',
  });

  const result = await assignCaseSupporter(
    caseId, adminId, supporterId,
    status, supporterUser.name, "under_review",
  );

  emitEvent({
    eventId: crypto.randomUUID(),
    type: DOMAIN_EVENTS.CASE_ASSIGNED,
    actorId: adminId,
    occurredAt: new Date(),
    payload: { caseId, caseCode: caseItem.case_code, supporterId, supporterName: supporterUser.name },
  });

  return result;
}
