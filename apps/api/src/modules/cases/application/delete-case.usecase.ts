import { AppError } from "../../../shared/domain/app-error.js";
import {
  findCaseByIdWithMembers,
  deleteCase,
} from "../infrastructure/persistence/case.repository.js";
import logger from "../../../shared/infrastructure/logger.js";

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
    const result = await deleteCase(caseId);
    logger.info({ caseId, actorId: userId, actorRole: userRole, duration_ms: Date.now() - startTime }, 'case deleted');
    return result;
  } catch (error) {
    logger.error({ err: error, caseId, actorId: userId, actorRole: userRole, duration_ms: Date.now() - startTime }, 'case deleted failed');
    throw error;
  }
}
