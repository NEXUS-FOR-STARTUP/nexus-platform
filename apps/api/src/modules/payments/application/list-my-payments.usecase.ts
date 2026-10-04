/**
 * @deprecated Replaced by deposits/orders modules (2026-08-12).
 * Kept for reference. Routes return 410 Gone.
 */

import {
  findManyMyPayments as defaultFindManyMyPayments,
  PAYMENTS_PAGE_DEFAULT_LIMIT,
} from "../infrastructure/persistence/payment.repository.js";
import type { ListPaymentsPagination } from "./list-payments.usecase.js";
import type {
  ListMyPaymentsResponse,
  PaymentHistoryItem,
  PaymentHistoryStatus,
} from "./payments.dto.js";

type ListMyPaymentsDeps = {
  findManyMyPayments?: typeof defaultFindManyMyPayments;
};

const defaultDeps = {
  findManyMyPayments: defaultFindManyMyPayments,
};

function toPaymentHistoryItem(
  payment: Awaited<ReturnType<typeof defaultFindManyMyPayments>>[number],
): PaymentHistoryItem {
  return {
    id: payment.id,
    case_id: payment.case_id,
    case_code: payment.case.case_code,
    package_name: payment.case.package?.name ?? null,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status as PaymentHistoryStatus,
    verified_at: payment.verified_at ? payment.verified_at.toISOString() : null,
    bank_transaction_id: payment.bank_transaction_id ?? null,
    created_at: payment.created_at.toISOString(),
  };
}

export async function listMyPaymentsUseCase(
  userId: string,
  deps: ListMyPaymentsDeps = {},
  pagination: ListPaymentsPagination = {},
): Promise<ListMyPaymentsResponse> {
  const { findManyMyPayments } = {
    ...defaultDeps,
    ...deps,
  };
  const { limit = PAYMENTS_PAGE_DEFAULT_LIMIT, offset = 0 } = pagination;

  const payments = await findManyMyPayments(userId, limit, offset);

  return {
    payments: payments.map(toPaymentHistoryItem),
  };
}
