import { AppError } from "../../../shared/domain/app-error.js";
import {
  assignCaseSupporterInTx,
  findCaseById,
  findSupporterById,
} from "../../cases/infrastructure/persistence/case.repository.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { prisma } from "../../../db.js";
import { transitionInTx } from "../../../services/case-transition.service.js";

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
    if (caseItem.sla_deadline_at && caseItem.sla_deadline_at.getTime() <= Date.now()) {
      return prisma.case.update({
        where: { id: caseId },
        data: { sla_deadline_at: new Date(Date.now() + 48 * 3600_000) },
      })
    }
    return caseItem
  }

  // D12: T6 + gán supporter cùng 1 tx
  const transition = await prisma.$transaction(async (tx) => {
    const t = await transitionInTx(tx, {
      transition: 'T6_ASSIGN_SUPPORTER',
      caseId,
      actorId: adminId,
      roleVerified: 'ADMIN',
    });
    const assigned = await assignCaseSupporterInTx(tx, caseId, adminId, supporterId, supporterUser.name);
    return { stage: t.stage, status: t.status, case: assigned };
  });

  const result = {
    ...transition.case,
    user_facing_stage: transition.stage,
    internal_status: transition.status,
  };

  emitEvent({
    eventId: crypto.randomUUID(),
    type: DOMAIN_EVENTS.CASE_ASSIGNED,
    actorId: adminId,
    occurredAt: new Date(),
    payload: { caseId, caseCode: caseItem.case_code, supporterId, supporterName: supporterUser.name },
  });

  return result;
}
