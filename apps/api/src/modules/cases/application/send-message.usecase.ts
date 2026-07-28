import { AppError } from "../../../shared/domain/app-error.js";
import { createCaseMessage, findCaseById } from "../infrastructure/persistence/case.repository.js";
import { isFinalCaseStage, requireCredits } from "../domain/case.types.js";

export async function sendMessageUseCase(
  userId: string,
  userRole: string,
  caseId: string,
  content: string,
) {
  const trimmedContent = typeof content === "string" ? content.trim() : "";

  if (!trimmedContent) {
    throw new AppError(400, "VALIDATION_ERROR", "Nội dung tin nhắn không được để trống");
  }

  if (trimmedContent.length > 5000) {
    throw new AppError(
      400,
      "VALIDATION_ERROR",
      "Độ dài tin nhắn vượt quá giới hạn cho phép (tối đa 5000 ký tự)",
    );
  }

  const caseItem = await findCaseById(caseId);
  if (!caseItem) {
    throw new AppError(404, "NOT_FOUND", "Không tìm thấy hồ sơ");
  }

  if (isFinalCaseStage(caseItem.user_facing_stage)) {
    throw new AppError(409, "INVALID_CASE_STAGE", "Không thể gửi tin nhắn khi hồ sơ đã đóng hoặc hoàn tất");
  }

  await requireCredits(caseId);

  return await createCaseMessage({
    caseId,
    userId,
    userRole,
    content: trimmedContent,
  });
}
