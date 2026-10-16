import type { Prisma } from "@prisma/client";
import { FUNDED_BY_RECEIVABLE_KEY, isFundedPurchase } from "../../orders/application/funded-lot.guard.js";
import {
  allocateRefundToLots,
  computeRefundWriteOff,
  type FundedLot,
} from "../domain/receivable.domain.js";
import { loadReceivable, lockReceivable, stateOf } from "../infrastructure/receivables.repository.js";

/**
 * Called inside the refund transaction, right after the credits are zeroed. Sponsored credits that
 * are given back must not leave their debt open (the customer got nothing), and they refund 0đ to
 * the wallet (price_per_credit 0), so the debt is written off instead, per lot and cumulatively.
 * No sponsored lot on the (case, service type) pair: a single read and an early return.
 */
export async function settleReceivablesForRefundedCreditsInTx(
  tx: Prisma.TransactionClient,
  params: { caseId: string; serviceTypeId: string | null; balanceBefore: number; refundedCredits: number; eventKey: string },
): Promise<void> {
  const purchases = await tx.creditLedger.findMany({
    where: { case_id: params.caseId, service_type_id: params.serviceTypeId, type: "purchase", amount: { gt: 0 } },
    orderBy: { created_at: "desc" },
    select: { amount: true, metadata_json: true },
  });
  // Newest first, the order planServiceRefund prices the lots in.
  const lots: FundedLot[] = purchases
    .filter((p) => isFundedPurchase(p.metadata_json))
    .map((p) => ({
      receivableId: (p.metadata_json as Record<string, string>)[FUNDED_BY_RECEIVABLE_KEY]!,
      credits: p.amount,
    }));
  if (lots.length === 0) return;

  const allocations = allocateRefundToLots(lots, params.balanceBefore, params.refundedCredits);
  for (const { receivableId, credits } of allocations) {
    const key = `refund:${params.eventKey}:${receivableId}`;
    await lockReceivable(tx, receivableId);
    const row = await loadReceivable(tx, { id: receivableId });
    if (!row) continue;
    // Checked under the row lock (not by catching P2002, which would poison the refund transaction):
    // a concurrent delivery of the same event waits for the lock and then sees this key.
    if (row.adjustments.some((a) => a.idempotency_key === key)) continue;
    const refunds = row.adjustments.filter((a) => a.kind === "refund");
    const lotCredits = lots.find((l) => l.receivableId === receivableId)!.credits;

    const amount = computeRefundWriteOff({
      amountDue: row.amount_due,
      lotCredits,
      cumulativeRefundedCredits: refunds.reduce((s, a) => s + (a.credits ?? 0), 0) + credits,
      alreadyWrittenOffByRefund: refunds.reduce((s, a) => s + a.amount, 0),
      outstanding: stateOf(row).outstanding,
    });
    // A zero-amount row still records the credits, so later rounding stays cumulative.
    await tx.receivableAdjustment.create({
      data: {
        receivable_id: receivableId,
        kind: "refund",
        amount,
        credits,
        idempotency_key: key,
        reason: "Hoàn/huỷ lượt đã tài trợ",
      },
    });
  }
}
