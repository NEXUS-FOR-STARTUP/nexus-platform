import { AppError } from "../../../shared/domain/app-error.js";
import {
  assignCaseSupporter,
  findCaseById,
  findSupporterById,
} from "../../cases/infrastructure/persistence/case.repository.js";

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

  return await assignCaseSupporter(
    caseId,
    adminId,
    supporterId,
    "assigned",
    supporterUser.name,
  );
}
