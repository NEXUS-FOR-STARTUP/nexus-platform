import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import { createDeposit } from "../infrastructure/persistence/deposit.repository.js";
import { getDepositBankInfo } from "../../payments/domain/bank-info.js";
import logger from "../../../shared/infrastructure/logger.js";
import { prisma } from "../../../db.js";
import type { CreateDepositResponse } from "./deposits.dto.js";

const DEPOSIT_PREFIX = "CRTOPUP";

function generateTransferContent(): string {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${DEPOSIT_PREFIX}${suffix}`;
}

export async function createDepositUseCase(
  userId: string,
  amount: number,
): Promise<CreateDepositResponse> {
  if (amount < 10000) {
    throw new AppError(400, "INVALID_AMOUNT", "Số tiền tối thiểu là 10,000 VND");
  }

  const transferContent = generateTransferContent();
  const idempotencyKey = `deposit-create-${transferContent}`;
  const deposit = await createDeposit({
    userId,
    amount,
    transferContent,
    idempotencyKey,
    metadataJson: { prefix: DEPOSIT_PREFIX },
  });

  if (process.env["DUAL_WRITE_WALLET_TOPUP"] === "true") {
    await prisma.walletTopup.create({
      data: {
        user_id: userId,
        amount,
        transfer_content: transferContent,
        status: "pending",
        currency: "VND",
      },
    });
  }

  const bankInfo = getDepositBankInfo(transferContent, amount);

  logger.info({ depositId: deposit.id, userId, amount }, "deposit created");

  return {
    depositId: deposit.id,
    amount,
    transferContent,
    bankInfo,
  };
}
