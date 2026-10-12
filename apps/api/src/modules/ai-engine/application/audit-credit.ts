import type { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { createCreditEntry, getCreditBalance, getServiceTypeId } from "../../cases/infrastructure/persistence/credit-ledger.repository.js";

type LedgerTx = Pick<typeof prisma, "creditLedger" | "serviceType">;

/**
 * Charge one audit credit of `serviceTypeCode`. Must run inside the trigger transaction so the
 * balance read and the consumption entry commit together. Throws 402 when the service type has no credit.
 */
export async function consumeAuditCredit(
  tx: LedgerTx,
  args: { caseId: string; serviceTypeCode: string; idempotencyKey: string },
): Promise<void> {
  const serviceTypeId = await getServiceTypeId(tx, args.serviceTypeCode);
  const balance = await getCreditBalance(tx, args.caseId, serviceTypeId);
  if (balance < 1) {
    throw new AppError(402, "NO_CREDITS", "Hết credit. Vui lòng mua thêm credit để tiếp tục.");
  }
  await createCreditEntry(tx, {
    serviceTypeId,
    caseId: args.caseId,
    amount: -1,
    balanceAfter: balance - 1,
    type: "consumption",
    referenceId: args.caseId,
    idempotencyKey: args.idempotencyKey,
  });
}

/** Give back one credit of `serviceTypeCode`; the idempotency key makes a repeat a P2002 the caller ignores. */
export async function grantAuditRefund(
  tx: LedgerTx,
  args: { caseId: string; serviceTypeCode: string; idempotencyKey: string; reason: string },
): Promise<void> {
  const serviceTypeId = await getServiceTypeId(tx, args.serviceTypeCode);
  const balance = await getCreditBalance(tx, args.caseId, serviceTypeId);
  await createCreditEntry(tx, {
    serviceTypeId,
    caseId: args.caseId,
    amount: 1,
    balanceAfter: balance + 1,
    type: "refund",
    referenceId: args.caseId,
    idempotencyKey: args.idempotencyKey,
    metadataJson: { reason: args.reason },
  });
}
