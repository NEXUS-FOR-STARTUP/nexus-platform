import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { createCaseMessage, findCaseById, findLatestCaseEventByType } from "../infrastructure/persistence/case.repository.js";
import { getCreditBalance, getCreditLedgerByCaseId } from "../infrastructure/persistence/credit-ledger.repository.js";
import { evaluateChatAccess } from "./chat-access.js";
import { claimMessageSendSlot } from "./message-send-rate-limit.js";
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

  const creditBalance = await getCreditBalance(caseId);
  const completedEvent =
    caseItem.user_facing_stage === "completed"
      ? await findLatestCaseEventByType(caseId, "T14_COMPLETE")
      : null;
  const ledgerEntries = creditBalance > 0 ? [] : await getCreditLedgerByCaseId(caseId);
  const exhaustedEntry = ledgerEntries.find((entry) => entry.balance_after === 0);

  const access = evaluateChatAccess({
    lockedPrice: caseItem.locked_price ?? 0,
    stage: caseItem.user_facing_stage,
    creditBalance,
    completedAt: completedEvent?.created_at ?? null,
    creditExhaustedAt: exhaustedEntry?.created_at ?? null,
  });

  if (!access.ok) {
    const messageByCode: Record<string, string> = {
      CHAT_FREE_TIER: "Chat là đặc quyền cho dự án trả phí. Vui lòng liên hệ admin qua email hoặc điện thoại.",
      CHAT_REJECTED: "Dự án đang ở trạng thái từ chối. Vui lòng chỉnh sửa hồ sơ và nộp lại, hoặc liên hệ admin.",
      CHAT_CLOSED: "Hồ sơ đã đóng, không thể gửi tin nhắn. Vui lòng liên hệ admin qua email hoặc điện thoại.",
      CHAT_LOCKED: "Hết lượt kiểm tra. Chat sẽ mở lại sau khi hết thời gian khóa.",
    };
    throw new AppError(
      409,
      access.code,
      messageByCode[access.code],
      access.unlockInMs !== undefined ? { unlockInMs: access.unlockInMs } : undefined,
    );
  }

  const claim = claimMessageSendSlot(userId);
  if (!claim.ok) {
    throw new AppError(
      429,
      "RATE_LIMITED",
      "Gửi tin quá nhanh. Vui lòng đợi một giây.",
      { unlockInMs: claim.unlockInMs },
    );
  }

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
