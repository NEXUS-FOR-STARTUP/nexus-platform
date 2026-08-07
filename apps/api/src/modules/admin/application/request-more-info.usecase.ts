import { AppError } from "../../../shared/domain/app-error.js";
import { findCaseById, requestCaseMoreInfo } from "../../cases/infrastructure/persistence/case.repository.js";
import logger from "../../../shared/infrastructure/logger.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";

export async function adminRequestMoreInfoUseCase(
  adminId: string,
  caseId: string,
  query: string,
) {
  if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "ID dự án không hợp lệ");
  }

  if (query.length < 5) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Yêu cầu làm rõ tối thiểu phải 5 ký tự",
    );
  }

  const caseItem = await findCaseById(caseId);
  if (!caseItem) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  if (
    caseItem.user_facing_stage === "need_more_information" &&
    caseItem.internal_status === "waiting_user"
  ) {
    return caseItem;
  }

  logger.info({ caseId, actorId: adminId, queryLength: query.length }, 'admin more info requested');
  const result = await requestCaseMoreInfo(
    caseId,
    adminId,
    "more_info_requested",
    query,
    "need_more_information",
    "waiting_user",
  );
  emitEvent({
    eventId: crypto.randomUUID(),
    type: DOMAIN_EVENTS.REQUEST_MORE_INFO,
    actorId: adminId,
    occurredAt: new Date(),
    payload: { caseId, caseCode: caseItem.case_code, query },
  });
  return result;
}
