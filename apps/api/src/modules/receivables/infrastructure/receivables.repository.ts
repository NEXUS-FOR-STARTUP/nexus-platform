import type { Prisma } from "@prisma/client";
import type { AdminReceivable } from "@repo/validation";
import { computeReceivableState, type ReceivableState } from "../domain/receivable.domain.js";

export const receivableInclude = {
  payments: { select: { applied_amount: true, gross_amount: true, paid_at: true } },
  adjustments: { select: { amount: true, kind: true, credits: true, idempotency_key: true } },
  case: { select: { case_code: true } },
} satisfies Prisma.ReceivableInclude;

export type ReceivableRow = Prisma.ReceivableGetPayload<{ include: typeof receivableInclude }>;

/** Row lock so concurrent payments/write-offs on one debt cannot exceed what is owed. */
export async function lockReceivable(tx: Prisma.TransactionClient, id: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM receivables WHERE id = ${id} FOR UPDATE`;
}

export function stateOf(row: ReceivableRow, now = new Date()): ReceivableState {
  return computeReceivableState(
    {
      amountDue: row.amount_due,
      applied: row.payments.reduce((s, p) => s + p.applied_amount, 0),
      gross: row.payments.reduce((s, p) => s + p.gross_amount, 0),
      writtenOff: row.adjustments.reduce((s, a) => s + a.amount, 0),
    },
    row.due_at,
    now,
  );
}

export async function loadReceivable(
  client: Prisma.TransactionClient,
  where: Prisma.ReceivableWhereUniqueInput,
): Promise<ReceivableRow | null> {
  return client.receivable.findUnique({ where, include: receivableInclude });
}

export function toAdminReceivable(row: ReceivableRow, replayed?: boolean): AdminReceivable {
  const state = stateOf(row);
  return {
    id: row.id,
    code: row.code,
    customer_name: row.customer_name,
    customer_contact: row.customer_contact,
    customer_phone: row.customer_phone ?? null,
    customer_email: row.customer_email ?? null,
    case_id: row.case_id,
    case_code: row.case?.case_code ?? null,
    order_id: row.order_id,
    amount_due: row.amount_due,
    paid: state.paid,
    written_off: state.writtenOff,
    outstanding: state.outstanding,
    overpaid: state.overpaid,
    status: state.status,
    review_reason: row.review_reason,
    has_payment_link: row.public_token_hash !== null,
    due_at: row.due_at.toISOString(),
    created_at: row.created_at.toISOString(),
    ...(replayed ? { replayed: true } : {}),
  };
}
