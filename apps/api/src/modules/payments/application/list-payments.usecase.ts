/**
 * @deprecated Replaced by deposits/orders modules (2026-08-12).
 * Kept for reference. Routes return 410 Gone.
 */

import { findManyPaymentsWithCase } from "../infrastructure/persistence/payment.repository.js";

export async function listPaymentsUseCase() {
  return await findManyPaymentsWithCase();
}
