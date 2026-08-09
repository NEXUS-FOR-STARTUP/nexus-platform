import { prisma } from "../../../../db.js";

export const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function findManyPaymentsWithCase() {
  return await prisma.payment.findMany({
    include: {
      case: {
        select: {
          case_code: true,
          team_name: true,
          owner: {
            select: { name: true },
          },
        },
      },
      payer: { select: { id: true, name: true, display_username: true } },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function findManyMyPayments(userId: string) {
  return await prisma.payment.findMany({
    where: {
      payer_auth_user_id: userId,
      status: {
        in: ["unpaid", "pending_verification", "paid", "rejected"],
      },
    },
    select: {
      id: true,
      case_id: true,
      currency: true,
      bank_transaction_id: true,
      amount: true,
      status: true,
      verified_at: true,
      created_at: true,
      case: {
        select: {
          case_code: true,
          package: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
}

export async function findPaymentById(id: string) {
  return await prisma.payment.findUnique({
    where: { id },
    include: {
      payer: true,
      case: {
        select: { case_code: true },
      },
    },
  });
}

export async function findPaymentByIdWithCase(id: string) {
  return await prisma.payment.findUnique({
    where: { id },
    include: {
      case: {
        select: { case_code: true, owner_auth_user_id: true },
      },
    },
  });
}

export async function createUnpaidPayment(data: {
  caseId: string;
  packageId: string;
  amount: number;
  metadataJson: Record<string, unknown> | null;
  transferContent: string;
  payerAuthUserId: string;
}) {
  return await prisma.payment.create({
    data: {
      case_id: data.caseId,
      package_id: data.packageId,
      amount: data.amount,
      status: "unpaid",
      metadata_json: (data.metadataJson ?? undefined) as any,
      transfer_content: data.transferContent,
      payer_auth_user_id: data.payerAuthUserId,
      currency: "VND",
      payment_method: "bank_transfer",
    },
  });
}

export async function submitPaymentProof(data: {
  paymentId: string;
  caseId: string;
  proofFileUrl: string;
  userId: string;
}) {
  return await prisma.$transaction(async (tx: any) => {
    const payment = await tx.payment.update({
      where: { id: data.paymentId },
      data: {
        status: "pending_verification",
        proof_file_url: data.proofFileUrl,
      },
    });

    await tx.case.update({
      where: { id: data.caseId },
      data: {
        payment_status: "pending_verification",
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: data.caseId } },
        event_type: "payment_proof_uploaded",
        actor: { connect: { id: data.userId } },
        payment: { connect: { id: data.paymentId } },
        metadata_json: { payment_id: data.paymentId, amount: payment.amount },
      },
    });

    return payment;
  });
}

export async function verifyPayment(data: {
  paymentId: string;
  caseId: string;
  status: "paid" | "rejected";
  rejectionReason: string | null;
  adminId: string;
  verificationSource: "manual" | "auto";
}) {
  const { paymentId, caseId, status, rejectionReason, adminId, verificationSource } = data;
  return await prisma.$transaction(async (tx: any) => {
    const updatedPayment = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status,
        rejection_reason: rejectionReason,
        verified_by_auth_user_id: adminId,
        verification_source: verificationSource,
        verified_at: new Date(),
      },
    });

    await tx.case.update({
      where: { id: caseId },
      data: {
        payment_status: status === "paid" ? "paid" : "unpaid",
      },
    });

    await tx.caseEvent.create({
      data: {
        case: { connect: { id: caseId } },
        event_type: status === "paid" ? "payment_verified" : "payment_rejected",
        actor: { connect: { id: adminId } },
        payment: { connect: { id: paymentId } },
        metadata_json: { payment_id: paymentId, rejection_reason: rejectionReason },
      },
    });

    if (status === "paid") {
      // --- Intake pending → intake ready on successful payment ---
      const caseRecord = await tx.case.findUnique({
        where: { id: caseId },
        select: { user_facing_stage: true },
      });
      if (caseRecord?.user_facing_stage === "intake_pending") {
        await tx.case.update({
          where: { id: caseId },
          data: { user_facing_stage: "intake_ready" },
        });
      }

      // --- Credit purchase on successful verification ---
      const paymentRecord = await tx.payment.findUnique({ where: { id: paymentId } });
      // Read actual credit quantity from metadata_json first (set by CreditQuantityModal)
      // Fallback: derive from payment.amount / CREDIT_PRICE (handles old data where metadata was lost)
      const metaQuantity = (paymentRecord?.metadata_json as Record<string, unknown> | null)?.quantity;
      const quantity = typeof metaQuantity === 'number'
        ? metaQuantity
        : Math.round((paymentRecord?.amount ?? 0) / 39000) || 1;

      // Get current credit balance
      const latestLedger = await tx.creditLedger.findFirst({
        where: { case_id: caseId },
        orderBy: { id: "desc" },
      });
      const currentBalance = latestLedger?.balance_after ?? 0;
      const newBalance = currentBalance + quantity;

      // Create credit ledger purchase entry
      await tx.creditLedger.create({
        data: {
          case_id: caseId,
          amount: quantity,
          balance_after: newBalance,
          type: "purchase",
          reference_id: paymentId,
          idempotency_key: `purchase-${paymentId}`,
        },
      });

      // Create case event for credit purchase
      await tx.caseEvent.create({
        data: {
          case: { connect: { id: caseId } },
          event_type: "credits_purchased",
          actor: { connect: { id: adminId } },
          payment: { connect: { id: paymentId } },
          metadata_json: { quantity, new_balance: newBalance, payment_id: paymentId },
        },
      });
    }

    return updatedPayment;
  });
}
