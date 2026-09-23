import type { Prisma } from '@prisma/client'
import { walletService } from '../modules/wallet/application/wallet.service.js'
import { AppError } from '../shared/domain/app-error.js'
import logger from '../shared/infrastructure/logger.js'

export const REFUND_CREDIT_KEY_PREFIX = 'refund-credit'
export const REFUND_CASE_KEY_PREFIX = 'refund-case'

export interface FifoPurchase {
  amount: number
  unit_price: number
}

export function computeFifoRefund(
  purchases: FifoPurchase[],
  balance: number,
): number {
  let remaining = balance
  let refundVnd = 0
  for (const purchase of purchases) {
    if (remaining <= 0) break
    const take = Math.min(remaining, purchase.amount)
    refundVnd += take * purchase.unit_price
    remaining -= take
  }
  return refundVnd
}

export function refundIdempotencyKey(caseId: string): string {
  return `${REFUND_CREDIT_KEY_PREFIX}-${caseId}`
}

export async function resolvePurchaseUnitPrice(
  tx: Prisma.TransactionClient,
  metadataJson: Prisma.JsonValue | null | undefined,
  referenceId: string | null,
  creditAmount?: number,
): Promise<number> {
  const metadata = (metadataJson ?? {}) as Record<string, unknown>

  // 1. Explicit per-credit price in metadata
  const pricePerCredit = metadata['price_per_credit'] ?? metadata['pricePerCredit']
  if (typeof pricePerCredit === 'number' && pricePerCredit > 0) {
    return pricePerCredit
  }

  // 2. Metadata with credits_granted and unit_price (stored by create-order.usecase)
  // unit_price was package price, quantity is number of packages, credits_granted is total credits received.
  const metaCreditsGranted = metadata['credits_granted']
  const metaUnitPrice = metadata['unit_price']
  const metaQuantity = metadata['quantity']

  if (
    typeof metaCreditsGranted === 'number' &&
    metaCreditsGranted > 0 &&
    typeof metaUnitPrice === 'number' &&
    metaUnitPrice > 0
  ) {
    const qty = typeof metaQuantity === 'number' && metaQuantity > 0 ? metaQuantity : 1
    const totalPaid = qty * metaUnitPrice
    return Math.round(totalPaid / metaCreditsGranted)
  }

  // 3. Metadata has unit_price and creditAmount > 0
  if (typeof metaUnitPrice === 'number' && metaUnitPrice > 0) {
    if (typeof metaQuantity === 'number' && metaQuantity > 0 && creditAmount && creditAmount > 0) {
      const totalPaid = metaQuantity * metaUnitPrice
      return Math.round(totalPaid / creditAmount)
    }
    return metaUnitPrice
  }

  // 4. Resolve from referenced orderItem
  if (referenceId) {
    const item = await tx.orderItem.findFirst({
      where: { order_id: referenceId },
      select: { unit_price: true, amount: true },
    })
    if (item) {
      if (item.amount > 0 && creditAmount && creditAmount > 0) {
        return Math.round(item.amount / creditAmount)
      }
      if (item.unit_price > 0) {
        return item.unit_price
      }
    }

    // 5. Fallback for legacy payment reference (where referenceId is paymentId)
    const payment = await (tx as any).payment?.findUnique?.({
      where: { id: referenceId },
      select: { amount: true },
    })
    if (payment && payment.amount > 0) {
      if (creditAmount && creditAmount > 0) {
        return Math.round(payment.amount / creditAmount)
      }
      return payment.amount
    }
  }

  return 0
}

export async function refundRemainingCreditInTx(
  tx: Prisma.TransactionClient,
  caseId: string,
  ownerId?: string,
): Promise<void> {
  const balResult = await tx.creditLedger.aggregate({
    where: { case_id: caseId },
    _sum: { amount: true },
  })
  const balance = balResult._sum.amount ?? 0
  if (balance <= 0) {
    return
  }

  const owner =
    ownerId ??
    (
      await tx.case.findUnique({
        where: { id: caseId },
        select: { owner_auth_user_id: true },
      })
    )?.owner_auth_user_id
  if (!owner) {
    logger.warn({ caseId }, 'credit refund skipped — case owner missing')
    return
  }

  const key = refundIdempotencyKey(caseId)
  const existing = await tx.walletTransaction.findUnique({
    where: { idempotency_key: key },
  })
  if (existing) {
    logger.info({ caseId, key }, 'credit refund skipped — already processed')
    return
  }

  const purchases = await tx.creditLedger.findMany({
    where: { case_id: caseId, type: 'purchase' },
    orderBy: { created_at: 'desc' },
    select: { amount: true, reference_id: true, metadata_json: true },
  })

  const pricedPurchases: FifoPurchase[] = []
  for (const purchase of purchases) {
    pricedPurchases.push({
      amount: purchase.amount,
      unit_price: await resolvePurchaseUnitPrice(
        tx,
        purchase.metadata_json,
        purchase.reference_id,
        purchase.amount,
      ),
    })
  }

  const refundVnd = computeFifoRefund(pricedPurchases, balance)

  if (refundVnd <= 0) {
    logger.warn({ caseId, balance }, 'credit refund skipped — no resolvable purchase price')
    return
  }

  try {
    await walletService.refund(owner, refundVnd, 'case_refund', caseId, key, tx)
  } catch (error) {
    if (error instanceof AppError && error.code === 'WALLET_NOT_FOUND') {
      logger.warn({ caseId, ownerId: owner }, 'credit refund skipped — wallet not found')
      return
    }
    throw error
  }

  await tx.creditLedger.create({
    data: {
      case_id: caseId,
      amount: -balance,
      balance_after: 0,
      type: 'refund',
      reference_type: 'case_refund',
      reference_id: caseId,
      idempotency_key: key,
      metadata_json: { refund_vnd: refundVnd },
    },
  })

  logger.info(
    { caseId, ownerId: owner, refundVnd, creditsRefunded: balance },
    'remaining credits refunded',
  )
}

/**
 * Unified refund for case cancellation (e.g. T13_VETO / T14_FULL_REFUND).
 * When credit purchases exist, refunds the FIFO value of remaining unconsumed credits (fifoVnd),
 * preventing double-refund since lockedPrice and credits originate from the same payment pot.
 * Falls back to lockedPrice only for legacy cases with no credit purchases in CreditLedger.
 */
export async function refundCaseAllInTx(
  tx: Prisma.TransactionClient,
  caseId: string,
  ownerId: string,
  lockedPrice: number,
): Promise<void> {
  const key = `${REFUND_CASE_KEY_PREFIX}-${caseId}`
  const existing = await tx.walletTransaction.findUnique({
    where: { idempotency_key: key },
  })
  if (existing) {
    logger.info({ caseId }, 'refundCaseAllInTx: already refunded, skipping')
    return
  }

  // Compute FIFO value of remaining credits
  const balResult = await tx.creditLedger.aggregate({
    where: { case_id: caseId },
    _sum: { amount: true },
  })
  const balance = balResult._sum.amount ?? 0
  const { fifoVnd, hasPurchases } = await computeFifoRefundForCase(tx, caseId, balance)

  // When credit purchases exist in CreditLedger, all payments into this case are tracked via credits.
  // Refund the FIFO value of unconsumed credits (fifoVnd) so consumed credits are not refunded.
  // Fall back to lockedPrice only if no credit purchases were ever recorded in CreditLedger.
  const totalRefund = hasPurchases ? fifoVnd : lockedPrice
  if (totalRefund > 0) {
    await walletService.refund(ownerId, totalRefund, 'case_refund', caseId, key, tx)
  }

  // Zero out ledger if there were remaining credits
  if (balance > 0) {
    await tx.creditLedger.create({
      data: {
        case_id: caseId,
        amount: -balance,
        balance_after: 0,
        type: 'refund',
        reference_type: 'case_refund',
        reference_id: caseId,
        idempotency_key: `${REFUND_CREDIT_KEY_PREFIX}-${caseId}`,
        metadata_json: { refund_vnd: fifoVnd },
      },
    })
  }

  logger.info({ caseId, ownerId, lockedPrice, fifoVnd, totalRefund, balance }, 'refundCaseAllInTx: completed')
}

async function computeFifoRefundForCase(
  tx: Prisma.TransactionClient,
  caseId: string,
  balance: number,
): Promise<{ fifoVnd: number; hasPurchases: boolean }> {
  const purchases = await tx.creditLedger.findMany({
    where: { case_id: caseId, type: 'purchase', amount: { gt: 0 } },
    orderBy: { created_at: 'desc' },
    select: { amount: true, metadata_json: true, reference_id: true },
  })
  const fifoPurchases: FifoPurchase[] = []
  for (const p of purchases) {
    const unitPrice = await resolvePurchaseUnitPrice(tx, p.metadata_json, p.reference_id, p.amount)
    fifoPurchases.push({ amount: p.amount, unit_price: unitPrice })
  }
  return {
    fifoVnd: balance > 0 ? computeFifoRefund(fifoPurchases, balance) : 0,
    hasPurchases: purchases.length > 0,
  }
}
