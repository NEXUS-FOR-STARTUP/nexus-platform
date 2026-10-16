import { prisma } from "../../../db.js";
import logger from "../../../shared/infrastructure/logger.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { walletService } from "../../wallet/application/wallet.service.js";
import { insertOutboxEvent } from "../../../shared/infrastructure/persistence/outbox.repository.js";
import { RECEIVABLE_CODE_LENGTH, RECEIVABLE_CODE_PREFIX } from "../../receivables/domain/receivable.domain.js";
import { recordSepayDebtPayment } from "../../receivables/application/record-receivable-payment.usecase.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SePayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  code: string | null;
  content: string;
  transferType: "in" | "out";
  transferAmount: number;
  accumulated: number;
  subAccount: string | null;
  referenceCode: string;
}

export interface SePayWebhookResult {
  matched: boolean;
  action: "verified" | "duplicate" | "ignored" | "no_match" | "amount_mismatch";
  paymentId?: string;
}

// ---------------------------------------------------------------------------
// Use case
// ---------------------------------------------------------------------------

export async function sepayWebhookUseCase(
  payload: SePayWebhookPayload,
): Promise<SePayWebhookResult> {
  const { id: txnId, code, content, transferAmount, transferType } = payload;

  if (transferType !== "in") return { matched: false, action: "ignored" };

  const paymentCode = code || extractCodeFromContent(content);
  if (!paymentCode) return { matched: false, action: "no_match" };

  // Pay-later debt: its own table, never a Deposit and never a wallet credit.
  if (paymentCode.startsWith(RECEIVABLE_CODE_PREFIX)) {
    const debtCode = paymentCode.slice(0, RECEIVABLE_CODE_LENGTH);
    const result = await recordSepayDebtPayment(debtCode, txnId, transferAmount, new Date(payload.transactionDate));
    if (result === "no_match") {
      logger.warn({ txnId, debtCode }, "sepay: no matching receivable found");
      return { matched: false, action: "no_match" };
    }
    return { matched: true, action: result === "duplicate" ? "duplicate" : "verified" };
  }

  const deposit = await prisma.deposit.findFirst({
    where: { transfer_content: paymentCode, status: { in: ["pending", "amount_mismatch"] } },
    orderBy: { created_at: "desc" },
  });

  if (!deposit) {
    logger.warn({ txnId, paymentCode }, "sepay: no matching deposit found");
    return { matched: false, action: "no_match" };
  }

  if (deposit.amount !== transferAmount) {
    await prisma.deposit.update({
      where: { id: deposit.id },
      data: {
        status: "amount_mismatch",
        metadata_json: {
          ...(deposit.metadata_json as any ?? {}),
          mismatch_txn_id: String(txnId),
          mismatch_received: transferAmount,
          mismatch_at: new Date(payload.transactionDate).toISOString(),
        },
      },
    });
    logger.warn({ txnId, depositId: deposit.id, expected: deposit.amount, got: transferAmount }, "sepay: deposit amount mismatch — marked for manual review");
    return { matched: true, action: "amount_mismatch" };
  }

  try {
    const idempotencyKey = `sepay-deposit-${deposit.transfer_content}-${txnId}`;

    await prisma.$transaction(async (tx) => {
      await walletService.deposit(deposit.user_id, deposit.amount, "deposit", deposit.id, idempotencyKey, tx);

      await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          status: "verified",
          verification_source: "auto",
          bank_transaction_id: String(txnId),
          bank_credited_at: new Date(payload.transactionDate),
        },
      });

      await insertOutboxEvent(tx, {
        event_type: DOMAIN_EVENTS.DEPOSIT_VERIFIED,
        payload_json: { depositId: deposit.id, userId: deposit.user_id, amount: deposit.amount, source: "auto" },
      });
    });

    logger.info({ txnId, depositId: deposit.id, amount: transferAmount }, "sepay: deposit auto-verified");
    return { matched: true, action: "verified" };
  } catch (error) {
    if ((error as any)?.code === "P2002") {
      logger.info({ txnId, depositId: deposit.id }, "sepay: duplicate deposit tx — already processed");
      return { matched: true, action: "verified" };
    }
    logger.error({ err: error, txnId, depositId: deposit.id }, "sepay: deposit verification failed");
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Try to extract CR-prefixed code from raw content */
function extractCodeFromContent(content: string): string | null {
  const match = content.match(/CR[A-Z0-9]{6,}/);
  return match ? match[0] : null;
}
