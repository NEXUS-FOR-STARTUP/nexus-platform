import { RecordReceivablePaymentSchema, type AdminReceivable } from "@repo/validation";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { loadReceivable, lockReceivable, stateOf, toAdminReceivable } from "../infrastructure/receivables.repository.js";

interface PaymentInput {
  grossAmount: number;
  bankRef: string;
  paidAt: Date;
  source: "sepay" | "manual";
  recordedBy: string | null;
}

/**
 * One row per bank notification. gross is the real money and is never cut; applied is the part
 * that reduces the debt. Manual entry refuses to overpay; the bank webhook records any overpayment
 * (applied may be 0) and flags the debt for review so the surplus can be returned.
 */
async function recordPaymentInTx(tx: Prisma.TransactionClient, receivableId: string, input: PaymentInput) {
  await lockReceivable(tx, receivableId);
  const row = await loadReceivable(tx, { id: receivableId });
  if (!row) throw new AppError(404, "NOT_FOUND", "Không tìm thấy khoản nợ");

  const { outstanding } = stateOf(row);
  if (input.source === "manual" && input.grossAmount > outstanding) {
    throw new AppError(409, "PAYMENT_EXCEEDS_OUTSTANDING", "Số tiền vượt quá số còn nợ");
  }
  const applied = Math.min(input.grossAmount, outstanding);

  await tx.receivablePayment.create({
    data: {
      receivable_id: receivableId,
      gross_amount: input.grossAmount,
      applied_amount: applied,
      bank_ref: input.bankRef,
      paid_at: input.paidAt,
      source: input.source,
      recorded_by: input.recordedBy,
    },
  });
  if (applied < input.grossAmount) {
    await tx.receivable.update({ where: { id: receivableId }, data: { review_reason: "overpaid" } });
  }
  return { applied, overpaid: input.grossAmount - applied };
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "P2002";
}

export async function recordManualPaymentUseCase(
  adminId: string,
  receivableId: string,
  body: unknown,
): Promise<AdminReceivable> {
  const parsed = RecordReceivablePaymentSchema.safeParse(body);
  if (!parsed.success) {
    throw new AppError(400, "INVALID_PAYMENT", parsed.error.issues[0]?.message ?? "Dữ liệu thanh toán không hợp lệ");
  }
  try {
    await prisma.$transaction((tx) =>
      recordPaymentInTx(tx, receivableId, {
        grossAmount: parsed.data.gross_amount,
        bankRef: parsed.data.bank_ref,
        paidAt: new Date(parsed.data.paid_at),
        source: "manual",
        recordedBy: adminId,
      }),
    );
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError(409, "BANK_REF_DUPLICATE", "Mã giao dịch ngân hàng đã được ghi nhận");
    throw error;
  }
  return toAdminReceivable((await loadReceivable(prisma, { id: receivableId }))!);
}

export type SepayDebtResult = "verified" | "duplicate" | "no_match";

/** SePay webhook branch for `CRDEBT…` codes. Never touches Deposit or the wallet. */
export async function recordSepayDebtPayment(
  code: string,
  txnId: number | string,
  transferAmount: number,
  paidAt: Date,
): Promise<SepayDebtResult> {
  const receivable = await prisma.receivable.findUnique({ where: { code }, select: { id: true } });
  if (!receivable) return "no_match";
  try {
    const result = await prisma.$transaction((tx) =>
      recordPaymentInTx(tx, receivable.id, {
        grossAmount: transferAmount,
        bankRef: String(txnId),
        paidAt,
        source: "sepay",
        recordedBy: null,
      }),
    );
    logger.info({ code, txnId, ...result }, "sepay: receivable payment recorded");
    return "verified";
  } catch (error) {
    if (isUniqueViolation(error)) {
      // Only a replay of the SAME bank transaction on the SAME debt is a duplicate. The same bank id
      // under another debt or amount is an anomaly that must not be acknowledged as processed.
      const prior = await prisma.receivablePayment.findUnique({ where: { bank_ref: String(txnId) } });
      if (prior && prior.receivable_id === receivable.id && prior.gross_amount === transferAmount && prior.source === "sepay") {
        logger.info({ code, txnId }, "sepay: duplicate receivable payment — already processed");
        return "duplicate";
      }
      logger.error({ code, txnId, transferAmount }, "sepay: bank reference already recorded for a different payment");
      throw new AppError(409, "BANK_REF_CONFLICT", "Mã giao dịch ngân hàng đã gắn với một khoản thanh toán khác");
    }
    throw error;
  }
}
