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

async function resolvePurchaseUnitPrice(
  tx: Prisma.TransactionClient,
  metadataJson: Prisma.JsonValue | null | undefined,
  referenceId: string | null,
): Promise<number> {
  const metadata = (metadataJson ?? {}) as Record<string, unknown>
  const metaPrice = metadata['unit_price']
  if (typeof metaPrice === 'number' && metaPrice > 0) {
    return metaPrice
  }
  if (referenceId) {
    const item = await tx.orderItem.findFirst({
      where: { order_id: referenceId },
      select: { unit_price: true },
    })
    if (item && item.unit_price > 0) {
      return item.unit_price
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
 * Unified refund: refund locked price (VND) + remaining credits in one call.
 * Uses single idempotency key so T13_VETO / T14_FULL_REFUND can't double-refund.
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
  const fifoVnd = balance > 0 ? await computeFifoRefundForCase(tx, caseId, balance) : 0

  // Single wallet refund: locked price + FIFO value of unused credits
  const totalRefund = lockedPrice + fifoVnd
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
): Promise<number> {
  const purchases = await tx.creditLedger.findMany({
    where: { case_id: caseId, type: 'purchase', amount: { gt: 0 } },
    orderBy: { created_at: 'desc' },
    select: { amount: true, metadata_json: true, reference_id: true },
  })
  const fifoPurchases: FifoPurchase[] = []
  for (const p of purchases) {
    const unitPrice = await resolvePurchaseUnitPrice(tx, p.metadata_json, p.reference_id)
    fifoPurchases.push({ amount: p.amount, unit_price: unitPrice })
  }
  return computeFifoRefund(fifoPurchases, balance)
}
