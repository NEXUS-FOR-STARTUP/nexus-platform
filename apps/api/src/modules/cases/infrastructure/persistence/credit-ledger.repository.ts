import { prisma } from "../../../../db.js";

export async function getCreditBalance(caseId: string): Promise<number> {
  const latest = await prisma.creditLedger.findFirst({
    where: { case_id: caseId },
    orderBy: { id: 'desc' },
    select: { balance_after: true },
  });
  return latest?.balance_after ?? 0;
}

// For use inside transactions (tx is prisma.$transaction client)
export async function getCreditBalanceForTx(tx: any, caseId: string): Promise<number> {
  const latest = await tx.creditLedger.findFirst({
    where: { case_id: caseId },
    orderBy: { id: 'desc' },
    select: { balance_after: true },
  });
  return latest?.balance_after ?? 0;
}

export async function getCreditLedgerByCaseId(caseId: string) {
  return await prisma.creditLedger.findMany({
    where: { case_id: caseId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      amount: true,
      balance_after: true,
      type: true,
      reference_id: true,
      created_at: true,
    },
  });
}

export async function createCreditEntry(data: {
  caseId: string;
  amount: number;
  balanceAfter: number;
  type: 'purchase' | 'consumption' | 'refund';
  referenceId?: string;
  idempotencyKey: string;
  metadataJson?: any;
}): Promise<any> {
  return await prisma.creditLedger.create({
    data: {
      case_id: data.caseId,
      amount: data.amount,
      balance_after: data.balanceAfter,
      type: data.type,
      reference_id: data.referenceId ?? null,
      idempotency_key: data.idempotencyKey,
      metadata_json: data.metadataJson ?? undefined,
    },
  });
}
