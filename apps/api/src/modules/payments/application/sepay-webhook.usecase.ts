import { prisma } from "../../../db.js";
import { verifyPayment as defaultVerifyPayment, SYSTEM_USER_ID } from "../infrastructure/persistence/payment.repository.js";
import logger from "../../../shared/infrastructure/logger.js";
import { emitEvent } from "../../../shared/infrastructure/event-bus.js";
import { DOMAIN_EVENTS } from "../../../shared/domain/domain-events.js";
import { walletService } from "../../wallet/application/wallet.service.js";

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
  action: "verified" | "duplicate" | "ignored" | "no_match";
  paymentId?: string;
}

// ---------------------------------------------------------------------------
// Dedup store — in-memory for dev, replace with Redis for production
// ---------------------------------------------------------------------------

const dedupSet = new Set<number>();
const DEDUP_TTL_MS = 3_600_000; // 1 hour

// ---------------------------------------------------------------------------
// Use case
// ---------------------------------------------------------------------------

export async function sepayWebhookUseCase(
  payload: SePayWebhookPayload,
): Promise<SePayWebhookResult> {
  const { id: txnId, code, content, transferAmount, transferType } = payload;

  // 1. Ignore outgoing transactions
  if (transferType !== "in") {
    return { matched: false, action: "ignored" };
  }

  // 2. Dedup by SePay transaction ID
  if (dedupSet.has(txnId)) {
    return { matched: true, action: "duplicate" };
  }

  // 3. Extract payment code from content
  //    SePay sends `code` (extracted via prefix template CR)
  //    If null, try parsing from raw content
  const paymentCode = code || extractCodeFromContent(content);
  if (!paymentCode) {
    return { matched: false, action: "no_match" };
  }

  // 4a. NEW: Check wallet topup first
  const topup = await prisma.walletTopup.findFirst({
    where: { transfer_content: paymentCode, status: 'pending' },
    orderBy: { created_at: 'desc' },
  })

  if (topup) {
    if (topup.amount !== transferAmount) {
      logger.warn({ txnId, topupId: topup.id, expected: topup.amount, got: transferAmount }, 'sepay: topup amount mismatch')
      return { matched: false, action: 'no_match' }
    }

    try {
      dedupSet.add(txnId)
      setTimeout(() => dedupSet.delete(txnId), DEDUP_TTL_MS)

      const depositKey = `sepay-deposit-${topup.transfer_content}-${txnId}`
      await walletService.deposit(topup.user_id, topup.amount, 'topup', topup.id, depositKey)

      await prisma.walletTopup.update({
        where: { id: topup.id },
        data: {
          status: 'completed',
          verified_by: 'auto',
          verification_source: 'auto',
          metadata_json: { txId: txnId, amount: transferAmount } as any,
        },
      })

      logger.info({ txnId, topupId: topup.id, userId: topup.user_id, amount: transferAmount }, 'sepay: topup auto-verified')
      return { matched: true, action: 'verified' }
    } catch (error) {
      dedupSet.delete(txnId)
      logger.error({ err: error, txnId, topupId: topup.id }, 'sepay: topup deposit failed')
      throw error
    }
  }

  // 4b. OLD: Find payment with matching transfer_content
  const payment = await findPaymentByTransferContent(paymentCode);
  if (!payment) {
    logger.warn({ txnId, paymentCode, content }, "sepay: no matching payment or topup found");
    return { matched: false, action: "no_match" };
  }

  // 5. Verify amount matches (allow small tolerance?)
  if (payment.amount !== transferAmount) {
    logger.warn(
      { txnId, paymentId: payment.id, expected: payment.amount, got: transferAmount },
      "sepay: amount mismatch",
    );
    return { matched: false, action: "no_match" };
  }

  // 6. Check not already final
  if (payment.status === "paid" || payment.status === "rejected") {
    return { matched: true, action: "duplicate" };
  }

  // 7. Auto-verify payment
  try {
    dedupSet.add(txnId);
    setTimeout(() => dedupSet.delete(txnId), DEDUP_TTL_MS);

    await defaultVerifyPayment({
      paymentId: payment.id,
      caseId: payment.case_id,
      status: "paid",
      rejectionReason: null,
      adminId: SYSTEM_USER_ID,
      verificationSource: "auto",
    });

    // Payment đã commit verified → emit ngay (không chờ metadata update — update fail không mất notification)
    emitEvent({
      eventId: crypto.randomUUID(),
      type: DOMAIN_EVENTS.PAYMENT_VERIFIED,
      actorId: null,
      occurredAt: new Date(),
      payload: {
        caseId: payment.case_id,
        caseCode: payment.case?.case_code ?? "",
        paymentId: payment.id,
        amount: payment.amount,
        source: "auto",
      },
    });

    // Store SePay transaction info — columns + metadata (expand-contract)
    const existingMeta = (payment as any).metadata_json as Record<string, unknown> | null ?? {};
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        // NEW — write to dedicated columns
        bank_transaction_id: String(txnId),
        bank_credited_at: new Date(payload.transactionDate),
        // Keep metadata for backward compat (expand-contract)
        metadata_json: {
          ...existingMeta,
          sepay_transaction_id: txnId,
          sepay_gateway: payload.gateway,
          sepay_verified_at: new Date().toISOString(),
        },
      },
    });

    logger.info(
      { txnId, paymentId: payment.id, caseId: payment.case_id, amount: transferAmount },
      "sepay: payment auto-verified",
    );

    return { matched: true, action: "verified", paymentId: payment.id };
  } catch (error) {
    dedupSet.delete(txnId);
    logger.error({ err: error, txnId, paymentId: payment.id }, "sepay: auto-verify failed");
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

/** Find unpaid payment where transfer_content column matches the code */
async function findPaymentByTransferContent(code: string) {
  return await prisma.payment.findFirst({
    where: { transfer_content: code, status: { notIn: ["paid", "rejected"] } },
    include: {
      case: {
        select: { case_code: true },
      },
    },
  });
}
