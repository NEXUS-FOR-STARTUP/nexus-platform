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
  const idempotencyKey = `purchase-${userId}-${packageId}-${quantity}-${Date.now()}`

  return prisma.$transaction(async (tx) => {
    const latest = await tx.creditLedger.findFirst({
      where: { case_id: caseId },
      orderBy: { id: 'desc' },
      select: { balance_after: true },
    })
    const currentBalance = latest?.balance_after ?? 0
    const newBalance = currentBalance + quantity

    await walletService.withdraw(userId, totalPrice, caseId, idempotencyKey)

    await tx.creditLedger.create({
      data: {
        case_id: caseId,
        amount: quantity,
        balance_after: newBalance,
        type: 'purchase',
        reference_id: packageId,
        idempotency_key: idempotencyKey,
        metadata_json: { packageId, pricePerCredit: price } as any,
      },
    })

    return { totalPrice, creditBalance: newBalance }
  })
}
