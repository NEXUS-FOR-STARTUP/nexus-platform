import type { Prisma } from '@prisma/client'
import { walletService } from '../modules/wallet/application/wallet.service.js'
import { AppError } from '../shared/domain/app-error.js'
import logger from '../shared/infrastructure/logger.js'
import {
  CP1_AUDIT_SERVICE_CODE,
  getCreditBalanceRows,
  type CreditBalanceRow,
} from '../modules/cases/infrastructure/persistence/credit-ledger.repository.js'

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

// CP1 keeps the pre-service-type key so refunds already recorded stay idempotent.
export function refundIdempotencyKey(caseId: string, serviceCode: string = CP1_AUDIT_SERVICE_CODE): string {
  const base = `${REFUND_CREDIT_KEY_PREFIX}-${caseId}`
  return serviceCode === CP1_AUDIT_SERVICE_CODE ? base : `${base}-${serviceCode}`
}

function readExplicitPricePerCredit(metadata: Record<string, unknown>): number | null {
  const pricePerCredit = metadata['price_per_credit'] ?? metadata['pricePerCredit']
  return typeof pricePerCredit === 'number' && pricePerCredit >= 0 ? pricePerCredit : null
}

export async function resolvePurchaseUnitPrice(
  tx: Prisma.TransactionClient,
  metadataJson: Prisma.JsonValue | null | undefined,
  referenceId: string | null,
  creditAmount?: number,
): Promise<number> {
  const metadata = (metadataJson ?? {}) as Record<string, unknown>

  // 1. Explicit per-credit price in metadata (0 is a valid price: discounted/free purchase)
  const explicitPrice = readExplicitPricePerCredit(metadata)
  if (explicitPrice !== null) {
    return explicitPrice
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

interface ServiceRefundPlan {
  row: CreditBalanceRow
  fifoVnd: number
  hasPurchases: boolean
  hasFreePurchase: boolean
}

// FIFO value of the unconsumed credits of ONE service type; other service types never mix in.
async function planServiceRefund(
  tx: Prisma.TransactionClient,
  caseId: string,
  row: CreditBalanceRow,
): Promise<ServiceRefundPlan> {
  const purchases = await tx.creditLedger.findMany({
    where: { case_id: caseId, service_type_id: row.service_type_id, type: 'purchase', amount: { gt: 0 } },
    orderBy: { created_at: 'desc' },
    select: { amount: true, reference_id: true, metadata_json: true },
  })
  const priced: FifoPurchase[] = []
  let hasFreePurchase = false
  for (const purchase of purchases) {
    const unitPrice = await resolvePurchaseUnitPrice(
      tx,
      purchase.metadata_json,
      purchase.reference_id,
      purchase.amount,
    )
    if (readExplicitPricePerCredit((purchase.metadata_json ?? {}) as Record<string, unknown>) === 0) {
      hasFreePurchase = true
    }
    priced.push({ amount: purchase.amount, unit_price: unitPrice })
  }
  return {
    row,
    fifoVnd: row.balance > 0 ? computeFifoRefund(priced, row.balance) : 0,
    hasPurchases: purchases.length > 0,
    hasFreePurchase,
  }
}

async function refundServiceRemaining(
  tx: Prisma.TransactionClient,
  caseId: string,
  owner: string,
  row: CreditBalanceRow,
): Promise<void> {
  const key = refundIdempotencyKey(caseId, row.code)
  const existing = await tx.walletTransaction.findUnique({
    where: { idempotency_key: key },
  })
  if (existing) {
    logger.info({ caseId, key }, 'credit refund skipped — already processed')
    return
  }

  const plan = await planServiceRefund(tx, caseId, row)
  const refundVnd = plan.fifoVnd

  // Zero-priced purchases (100% discount) legitimately refund 0đ and still zero the ledger.
  if (refundVnd <= 0 && !plan.hasFreePurchase) {
    logger.warn({ caseId, service: row.code, balance: row.balance }, 'credit refund skipped — no resolvable purchase price')
    return
  }

  if (refundVnd > 0) {
    try {
      await walletService.refund(owner, refundVnd, 'case_refund', caseId, key, tx)
    } catch (error) {
      if (error instanceof AppError && error.code === 'WALLET_NOT_FOUND') {
        logger.warn({ caseId, ownerId: owner }, 'credit refund skipped — wallet not found')
        return
      }
      throw error
    }
  }

  await tx.creditLedger.create({
    data: {
      case_id: caseId,
      service_type_id: row.service_type_id,
      amount: -row.balance,
      balance_after: 0,
      type: 'refund',
      reference_type: 'case_refund',
      reference_id: caseId,
      idempotency_key: key,
      metadata_json: { refund_vnd: refundVnd },
    },
  })

  logger.info(
    { caseId, ownerId: owner, service: row.code, refundVnd, creditsRefunded: row.balance },
    'remaining credits refunded',
  )
}

export async function refundRemainingCreditInTx(
  tx: Prisma.TransactionClient,
  caseId: string,
  ownerId?: string,
): Promise<void> {
  const rows = (await getCreditBalanceRows(tx, caseId)).filter((r) => r.balance > 0)
  if (rows.length === 0) {
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

  for (const row of rows) {
    await refundServiceRemaining(tx, caseId, owner, row)
  }
}

/**
 * Unified refund for case cancellation (e.g. T13_VETO / T14_FULL_REFUND).
 * When credit purchases exist, refunds the FIFO value of remaining unconsumed credits (fifoVnd),
 * computed per service type and summed into one wallet refund, preventing double-refund since
 * lockedPrice and credits originate from the same payment pot.
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

  const rows = await getCreditBalanceRows(tx, caseId)
  const plans: ServiceRefundPlan[] = []
  for (const row of rows) {
    plans.push(await planServiceRefund(tx, caseId, row))
  }
  const fifoVnd = plans.reduce((sum, p) => sum + p.fifoVnd, 0)
  const hasPurchases = plans.some((p) => p.hasPurchases)

  // When credit purchases exist in CreditLedger, all payments into this case are tracked via credits.
  // Refund the FIFO value of unconsumed credits (fifoVnd) so consumed credits are not refunded.
  // Fall back to lockedPrice only if no credit purchases were ever recorded in CreditLedger.
  const totalRefund = hasPurchases ? fifoVnd : lockedPrice
  if (totalRefund > 0) {
    await walletService.refund(ownerId, totalRefund, 'case_refund', caseId, key, tx)
  }

  // Zero out each service type that still had credits
  for (const plan of plans) {
    if (plan.row.balance <= 0) continue
    await tx.creditLedger.create({
      data: {
        case_id: caseId,
        service_type_id: plan.row.service_type_id,
        amount: -plan.row.balance,
        balance_after: 0,
        type: 'refund',
        reference_type: 'case_refund',
        reference_id: caseId,
        idempotency_key: refundIdempotencyKey(caseId, plan.row.code),
        metadata_json: { refund_vnd: plan.fifoVnd },
      },
    })
  }

  logger.info({ caseId, ownerId, lockedPrice, fifoVnd, totalRefund }, 'refundCaseAllInTx: completed')
}
