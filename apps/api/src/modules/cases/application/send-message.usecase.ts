import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { createCaseMessage, findCaseById } from "../infrastructure/persistence/case.repository.js";
import { isFinalCaseStage, requireCredits } from "../domain/case.types.js";
import { publishToChannel } from "../../realtime/infrastructure/centrifugo.service.js";
import { chatChannel } from "../../realtime/domain/realtime.types.js";

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

  const result = await createCaseMessage({
    caseId,
    userId,
    userRole,
    content: trimmedContent,
  });

  void publishToChannel(chatChannel(caseId), { type: "message", message: toPublishMessage(result) }).catch((e) => {
    logger.error({ caseId, err: e }, "chat publish unexpected failure");
  });

  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPublishMessage(msg: any) {
  return {
    id: msg.id,
    case_id: msg.case_id,
    sender_auth_user_id: msg.sender_auth_user_id,
    sender_role_snapshot: msg.sender_role_snapshot ?? null,
    content: msg.content,
    created_at: msg.created_at,
    sender: msg.sender
      ? { id: msg.sender.id, name: msg.sender.name, role: msg.sender.role, image: msg.sender.image ?? null }
      : null,
  };
}
