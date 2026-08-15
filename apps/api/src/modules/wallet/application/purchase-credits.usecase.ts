/**
 * @deprecated Replaced by deposits/orders modules (2026-08-12).
 * Kept for reference. Routes return 410 Gone.
 */

import { prisma } from '../../../db.js'
import { walletService } from './wallet.service.js'
import { AppError } from '../../../shared/domain/app-error.js'

export async function purchaseCreditsUseCase(
  userId: string,
  packageId: string,
  caseId: string,
  quantity: number,
) {
  const pkg = await prisma.servicePackage.findUnique({
    where: { id: packageId },
    include: {
      pricing_tiers: {
        where: { is_current: true },
        take: 1,
      },
    },
  })

  if (!pkg) {
    throw new AppError(404, 'PACKAGE_NOT_FOUND', 'Không tìm thấy gói dịch vụ')
  }

  const price = pkg.pricing_tiers[0]?.price ?? pkg.price
  const totalPrice = price * quantity
  const idempotencyKey = `purchase-${userId}-${packageId}-${caseId}-${quantity}`

  return prisma.$transaction(async (tx) => {
    const balResult = await tx.creditLedger.aggregate({
      where: { case_id: caseId },
      _sum: { amount: true },
    })
    const currentBalance = balResult._sum.amount ?? 0
    const newBalance = currentBalance + quantity

    await walletService.withdraw(userId, totalPrice, idempotencyKey, { referenceType: 'credit_purchase', referenceId: caseId })

    await tx.creditLedger.create({
      data: {
        case_id: caseId,
        amount: quantity,
        balance_after: newBalance,
        type: 'purchase',
        reference_type: 'credit_purchase',
        reference_id: packageId,
        idempotency_key: idempotencyKey,
        metadata_json: { packageId, pricePerCredit: price } as any,
      },
    })

    return { totalPrice, creditBalance: newBalance }
  })
}
