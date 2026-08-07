import { AppError } from "../../../shared/domain/app-error.js";
import { findCaseById, requestCaseMoreInfo } from "../../cases/infrastructure/persistence/case.repository.js";
import { isFinalCaseStage } from "../../cases/domain/case.types.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";

export async function closeCaseUseCase(userId: string, caseId: string) {
  const currentCase = await findCaseById(caseId);

  if (!currentCase) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  if (
    currentCase.user_facing_stage === "closed" &&
    currentCase.internal_status === "done"
  ) {
    return currentCase;
  }

  // M2 fix (review): chặn đóng case đã ở trạng thái cuối (completed/rejected) — backdoor qua API
  if (isFinalCaseStage(currentCase.user_facing_stage)) {
    return currentCase;
  }

  const result = await requestCaseMoreInfo(
    caseId,
    userId,
    "case_closed",
    "",
    "closed",
    "done",
  );

  // Fix review: close-case KHÔNG đi qua update-case-status → emit riêng
  emitEvent({
    eventId: crypto.randomUUID(),
    type: DOMAIN_EVENTS.CASE_STAGE_CHANGED,
    actorId: userId,
    occurredAt: new Date(),
    payload: {
      caseId,
      caseCode: currentCase.case_code,
      fromStage: currentCase.user_facing_stage,
      toStage: "closed",
    },
  });

  return result;
}
