import { AppError } from "../../../shared/domain/app-error.js";
import { isFinalCaseStage } from "../../cases/domain/case.types.js";
import { findCaseById, requestCaseMoreInfo } from "../../cases/infrastructure/persistence/case.repository.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function supporterRequestMoreInfoUseCase(
  userId: string,
  caseId: string,
  query: string,
) {
  const start = performance.now();
  try {
    const trimmedQuery = typeof query === "string" ? query.trim() : "";
    if (!trimmedQuery) {
      throw new AppError(400, "VALIDATION_ERROR", "Thiếu nội dung yêu cầu bổ sung");
    }

    const currentCase = await findCaseById(caseId);

    if (!currentCase) {
      throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
    }

    if (isFinalCaseStage(currentCase.user_facing_stage)) {
      throw new AppError(
        400,
        "INVALID_CASE_STAGE",
        "Dự án đã ở trạng thái cuối, không thể yêu cầu bổ sung thông tin",
      );
    }

    if (
      currentCase.user_facing_stage === "need_more_information" &&
      currentCase.internal_status === "waiting_user"
    ) {
      logger.info({ caseId, actorId: userId, queryLength: query?.length, duration_ms: Math.round(performance.now() - start) }, 'more info requested');
      return currentCase;
    }

    const result = await requestCaseMoreInfo(
      caseId,
      userId,
      "request_more_info",
      trimmedQuery,
      "need_more_information",
      "waiting_user",
    );
    logger.info({ caseId, actorId: userId, queryLength: query?.length, duration_ms: Math.round(performance.now() - start) }, 'more info requested');
    return result;
  } catch (error) {
    logger.error({ err: error, caseId, duration_ms: Math.round(performance.now() - start) }, 'more info request failed');
    throw error;
  }
}
