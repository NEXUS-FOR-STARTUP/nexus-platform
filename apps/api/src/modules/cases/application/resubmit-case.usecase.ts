import { AppError } from "../../../shared/domain/app-error.js";
import { executeTransition } from "./case-transition.service.js";
import type { TransitionName } from "../domain/transition.types.js";
import logger from "../../../shared/infrastructure/logger.js";

export async function resubmitCaseUseCase(
  userId: string,
  caseId: string,
  transition: TransitionName = 'T3_RESUBMIT_AFTER_REJECT',
) {
  const startTime = Date.now();

  if (!caseId || typeof caseId !== "string" || !caseId.trim()) {
    throw new AppError(400, "VALIDATION_ERROR", "ID dự án không hợp lệ");
  }

  if (transition !== 'T3_RESUBMIT_AFTER_REJECT' && transition !== 'T4_RESUBMIT_AFTER_VETO') {
    throw new AppError(400, "VALIDATION_ERROR", "Transition không hợp lệ cho resubmit");
  }

  try {
    const result = await executeTransition({
      transition,
      caseId,
      actorId: userId,
      roleVerified: 'CUSTOMER',
    });

    logger.info({ caseId, transition, actorId: userId, duration_ms: Date.now() - startTime }, `case transition: ${transition}`);

    return result;
  } catch (error) {
    logger.error({ err: error, caseId, transition, actorId: userId, duration_ms: Date.now() - startTime }, `case transition failed: ${transition}`);
    throw error;
  }
}
