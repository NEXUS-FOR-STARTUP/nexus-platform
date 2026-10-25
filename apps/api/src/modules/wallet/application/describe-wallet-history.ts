import type { PrismaClient } from "@prisma/client";
import { prisma } from "../../../db.js";

interface HistoryRow {
  id: string;
  type: string;
  source_type: string | null;
  source_id: string | null;
}

const UNNAMED_CASE = "chưa đặt tên";

const caseLabel = (c: { team_name: string | null; case_code: string }) =>
  `dự án ${c.team_name?.trim() || UNNAMED_CASE} (${c.case_code})`;

/**
 * Maps wallet transaction id -> human detail ("Mua Gói X cho dự án Y").
 * Two batched queries per page; rows with no resolvable target keep the generic label.
 */
export async function resolveWalletDetails(
  rows: HistoryRow[],
  db: Pick<PrismaClient, "order" | "creditLedger" | "case"> = prisma,
): Promise<Map<string, string>> {
  const orderIds = [...new Set(rows.filter((r) => r.source_type === "order" && r.source_id).map((r) => r.source_id!))];
  const refundCaseIds = [...new Set(rows.filter((r) => r.type === "refund" && r.source_id).map((r) => r.source_id!))];

  const [orders, ledgers, refundCases] = await Promise.all([
    orderIds.length
      ? db.order.findMany({
          where: { id: { in: orderIds } },
          select: { id: true, items: { select: { quantity: true, package: { select: { name: true } } } } },
        })
      : [],
    orderIds.length
      ? db.creditLedger.findMany({
          where: { reference_type: "order", reference_id: { in: orderIds } },
          select: { reference_id: true, case: { select: { team_name: true, case_code: true } } },
        })
      : [],
    refundCaseIds.length
      ? db.case.findMany({ where: { id: { in: refundCaseIds } }, select: { id: true, team_name: true, case_code: true } })
      : [],
  ]);

  const caseNamesByOrder = new Map<string, Set<string>>();
  for (const l of ledgers) {
    const set = caseNamesByOrder.get(l.reference_id!) ?? new Set<string>();
    set.add(caseLabel(l.case));
    caseNamesByOrder.set(l.reference_id!, set);
  }
  const orderById = new Map(orders.map((o) => [o.id, o]));
  const refundCaseById = new Map(refundCases.map((c) => [c.id, c]));

  const out = new Map<string, string>();
  for (const r of rows) {
    if (!r.source_id) continue;
    if (r.source_type === "order") {
      const order = orderById.get(r.source_id);
      if (!order) continue;
      const items = order.items.map((i) => `${i.package?.name ?? "gói dịch vụ"} ×${i.quantity}`).join(", ");
      const targets = [...(caseNamesByOrder.get(r.source_id) ?? [])].join(", ");
      out.set(r.id, `Mua ${items}${targets ? ` cho ${targets}` : ""}`);
    } else if (r.type === "refund" && refundCaseById.has(r.source_id)) {
      out.set(r.id, `Hoàn tiền cho ${caseLabel(refundCaseById.get(r.source_id)!)}`);
    }
  }
  return out;
}
