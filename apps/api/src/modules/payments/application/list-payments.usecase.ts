/**
 * @deprecated Replaced by deposits/orders modules (2026-08-12).
 * Kept for reference. Routes return 410 Gone.
 */

import {
  findManyPaymentsWithCase,
  PAYMENTS_PAGE_DEFAULT_LIMIT,
} from "../infrastructure/persistence/payment.repository.js";

export type ListPaymentsPagination = {
  limit?: number;
  offset?: number;
};

export async function listPaymentsUseCase(
  { limit = PAYMENTS_PAGE_DEFAULT_LIMIT, offset = 0 }: ListPaymentsPagination = {},
) {
  return await findManyPaymentsWithCase(limit, offset);
}
