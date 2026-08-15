import { AppError } from "../../../shared/domain/app-error.js";
import {
  findCaseByIdWithMembers,
  deleteCase,
} from "../infrastructure/persistence/case.repository.js";
import logger from "../../../shared/infrastructure/logger.js";
import { prisma } from "../../../db.js";
import { refundRemainingCreditInTx } from "../../../services/credit-refund.js";
import { publishToChannel } from "../../realtime/infrastructure/centrifugo.service.js";
import { chatChannel, buildCaseDeletedMessage } from "../../realtime/domain/realtime.types.js";

export async function deleteCaseUseCase(
  userId: string,
  userRole: string,
  caseId: string,
) {
  const startTime = Date.now();
  const existingCase = await findCaseByIdWithMembers(caseId);

  if (!existingCase) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy case");
  }

  const isOwner = existingCase.owner_auth_user_id === userId;
  const isAdmin = userRole === "admin";

  if (!isOwner && !isAdmin) {
    throw new AppError(403, "FORBIDDEN", "Không có quyền xóa dự án này");
  }

  if (!isAdmin && existingCase.user_facing_stage !== "submitted") {
    throw new AppError(
      400,
      "INVALID_CASE_STAGE",
      "Dự án đã được duyệt hoặc đang xử lý, không thể xóa",
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      await refundRemainingCreditInTx(tx, caseId, existingCase.owner_auth_user_id);
      return deleteCase(caseId, tx);
    });
    logger.info({ caseId, actorId: userId, actorRole: userRole, duration_ms: Date.now() - startTime }, 'case deleted');
    void publishToChannel(chatChannel(caseId), buildCaseDeletedMessage(caseId)).catch((e) => {
      logger.error({ caseId, err: e }, "case_deleted publish unexpected failure");
    });
    return result;
  } catch (error) {
    logger.error({ err: error, caseId, actorId: userId, actorRole: userRole, duration_ms: Date.now() - startTime }, 'case deleted failed');
    throw error;
  }
}
