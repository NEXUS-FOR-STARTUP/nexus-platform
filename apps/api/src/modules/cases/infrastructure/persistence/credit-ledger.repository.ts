import type { Prisma } from "@prisma/client";
import { prisma } from "../../../../db.js";
import { AppError } from "../../../../shared/domain/app-error.js";

/** ServiceType.code of the credits spent on the CP1 audit flow. */
export const CP1_AUDIT_SERVICE_CODE = "cp1_audit";

/** Accepts the global client or a $transaction client. */
type LedgerDb = Pick<typeof prisma, "creditLedger" | "serviceType">;

export interface CreditBalanceRow {
  service_type_id: string;
  code: string;
  balance: number;
}

export async function getServiceTypeId(db: Pick<typeof prisma, "serviceType">, code: string): Promise<string> {
  const row = await db.serviceType.findUnique({ where: { code }, select: { id: true } });
  if (!row) {
    throw new AppError(500, "SERVICE_TYPE_NOT_FOUND", `Chưa cấu hình loại dịch vụ ${code}`);
  }
  return row.id;
}

/** The only place that sums the ledger for a single service type. */
export async function getCreditBalance(
  db: Pick<typeof prisma, "creditLedger">,
  caseId: string,
  serviceTypeId: string,
): Promise<number> {
  const result = await db.creditLedger.aggregate({
    where: { case_id: caseId, service_type_id: serviceTypeId },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}

/** Balance per service type that has ledger rows on this case. */
export async function getCreditBalanceRows(db: LedgerDb, caseId: string): Promise<CreditBalanceRow[]> {
  const groups = await db.creditLedger.groupBy({
    by: ["service_type_id"],
    where: { case_id: caseId, service_type_id: { not: null } },
    _sum: { amount: true },
  });
  if (groups.length === 0) return [];
  const types = await db.serviceType.findMany({
    where: { id: { in: groups.map((g) => g.service_type_id as string) } },
    select: { id: true, code: true },
  });
  const codeById = new Map(types.map((t) => [t.id, t.code]));
  return groups.map((g) => ({
    service_type_id: g.service_type_id as string,
    code: codeById.get(g.service_type_id as string) ?? (g.service_type_id as string),
    balance: g._sum.amount ?? 0,
  }));
}

/** Balances keyed by ServiceType.code, for the UI. */
export async function getCreditBalances(db: LedgerDb, caseId: string): Promise<Record<string, number>> {
  const rows = await getCreditBalanceRows(db, caseId);
  return Object.fromEntries(rows.map((r) => [r.code, r.balance]));
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
      reference_type: true,
      reference_id: true,
      created_at: true,
    },
  });
}

// First param accepts the global client or a $transaction client so callers
// can join an ambient transaction (credit must never commit without its job).
export async function createCreditEntry(tx: Pick<typeof prisma, "creditLedger">, data: {
  caseId: string;
  serviceTypeId: string;
  amount: number;
  balanceAfter: number;
  type: 'purchase' | 'consumption' | 'refund';
  referenceType?: string;
  referenceId?: string;
  idempotencyKey: string;
  metadataJson?: Prisma.InputJsonValue;
}) {
  return await tx.creditLedger.create({
    data: {
      case_id: data.caseId,
      service_type_id: data.serviceTypeId,
      amount: data.amount,
      balance_after: data.balanceAfter,
      type: data.type,
      reference_type: data.referenceType ?? null,
      reference_id: data.referenceId ?? null,
      idempotency_key: data.idempotencyKey,
      metadata_json: data.metadataJson ?? undefined,
    },
  });
}
