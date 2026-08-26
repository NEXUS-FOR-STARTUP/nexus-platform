import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import {
  createDeposit,
  findDepositByIdempotencyKey,
} from "../infrastructure/persistence/deposit.repository.js";
import { getDepositBankInfo } from "../../payments/domain/bank-info.js";
import logger from "../../../shared/infrastructure/logger.js";
import { prisma } from "../../../db.js";
import type { CreateDepositResponse } from "./deposits.dto.js";

const DEPOSIT_PREFIX = "CRTOPUP";
const MIN_DEPOSIT_AMOUNT = 2000;

function generateTransferContent(): string {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${DEPOSIT_PREFIX}${suffix}`;
}

export type CreateDepositDeps = {
  findDepositByIdempotencyKey?: typeof findDepositByIdempotencyKey;
  createDeposit?: typeof createDeposit;
};

const defaultDeps: Required<CreateDepositDeps> = {
  findDepositByIdempotencyKey,
  createDeposit,
};

type ExistingDeposit = {
  id: string;
  user_id: string;
  amount: number;
  transfer_content: string;
};

export async function createDepositUseCase(
  userId: string,
  amount: number,
  idempotencyKey?: string,
  deps: CreateDepositDeps = {},
): Promise<CreateDepositResponse> {
  if (amount < MIN_DEPOSIT_AMOUNT) {
    throw new AppError(400, "INVALID_AMOUNT", "Số tiền tối thiểu là 2,000 VND");
  }

  const { findDepositByIdempotencyKey: findExisting, createDeposit: insertDeposit } = {
    ...defaultDeps,
    ...deps,
  };

  // Client-supplied stable key (one per modal-open) → true dedup for double-submit.
  // Fallback: random key, no dedup guarantee (legacy behaviour when no key is sent).
  const key = idempotencyKey?.trim()
    ? idempotencyKey
    : `deposit-create-${crypto.randomUUID()}`;

  const resolveExisting = (existing: ExistingDeposit): CreateDepositResponse => {
    if (existing.user_id !== userId) {
      throw new AppError(409, "IDEMPOTENCY_CONFLICT", "Mã giao dịch đã tồn tại cho người dùng khác");
    }
    logger.info({ depositId: existing.id, userId, amount, idempotent: true }, "deposit returned from idempotency key");
    return {
      depositId: existing.id,
      amount: existing.amount,
      transferContent: existing.transfer_content,
      bankInfo: getDepositBankInfo(existing.transfer_content, existing.amount),
    };
  };

  // Fast path: most double-submits resolve here.
  const existing = await findExisting(key);
  if (existing) {
    return resolveExisting(existing);
  }

  const transferContent = generateTransferContent();

  let deposit;
  try {
    deposit = await insertDeposit({
      userId,
      amount,
      transferContent,
      idempotencyKey: key,
      metadataJson: { prefix: DEPOSIT_PREFIX },
    });
  } catch (error) {
    // Unique constraint is the real guarantee: two concurrent requests both pass the
    // pre-check, one wins the insert, the other hits P2002 and resolves to the winner.
    if ((error as { code?: string }).code === "P2002") {
      const raceWinner = await findExisting(key);
      if (raceWinner) {
        return resolveExisting(raceWinner);
      }
    }
    throw error;
  }

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
