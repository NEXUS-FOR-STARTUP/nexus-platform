import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import {
  findDepositById,
  updateDepositStatus,
} from "../infrastructure/persistence/deposit.repository.js";
import { isFinalDepositStatus } from "../domain/deposit.types.js";
import { walletService } from "../../wallet/application/wallet.service.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { insertOutboxEvent } from "../../../shared/infrastructure/persistence/outbox.repository.js";
import logger from "../../../shared/infrastructure/logger.js";

const SYSTEM_USER_ID = "system";

export async function verifyDepositUseCase(
  adminId: string,
  depositId: string,
  status: "verified" | "rejected",
  rejectionReason?: string,
) {
  const deposit = await findDepositById(depositId);
  if (!deposit) {
    throw new AppError(404, "DEPOSIT_NOT_FOUND", "Không tìm thấy thông tin nạp tiền");
  }

  if (isFinalDepositStatus(deposit.status)) {
    throw new AppError(409, "FINAL_STATUS", "Giao dịch đã ở trạng thái cuối");
  }

  if (status === "rejected" && (!rejectionReason || rejectionReason.length < 10)) {
    throw new AppError(400, "VALIDATION_ERROR", "Lý do từ chối tối thiểu 10 ký tự");
  }

  const verificationSource = adminId === SYSTEM_USER_ID ? "auto" as const : "manual" as const;
  const eventType = status === "verified" ? DOMAIN_EVENTS.DEPOSIT_VERIFIED : DOMAIN_EVENTS.DEPOSIT_REJECTED;

  await prisma.$transaction(async (tx) => {
    if (status === "verified") {
      const idempotencyKey = `deposit-verify-${depositId}`;
      await walletService.deposit(
        deposit.user_id,
        deposit.amount,
        "deposit",
        depositId,
        idempotencyKey,
      );
    }

    await updateDepositStatus(depositId, {
      status,
      rejectionReason: rejectionReason ?? null,
      adminId: adminId === SYSTEM_USER_ID ? undefined : adminId,
      verificationSource,
    }, tx);

    await insertOutboxEvent(tx, {
      event_type: eventType,
      payload_json: { depositId, userId: deposit.user_id, amount: deposit.amount, status },
    });
  });

  logger.info({ depositId, userId: deposit.user_id, status, verifier: adminId }, "deposit verified");

  return { success: true, status };
}
