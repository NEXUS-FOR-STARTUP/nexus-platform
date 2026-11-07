import { prisma } from '../../../db.js'
import { applyPackagePrice } from './package-price-history.js'

export async function setCurrentPricingUseCase(
  packageId: string,
  price: number,
  changedBy: string,
) {
  return prisma.$transaction(async (tx) => {
    await applyPackagePrice(tx, { packageId, price, changedBy })
    return tx.servicePricing.findFirstOrThrow({
      where: { package_id: packageId, is_current: true },
    })
  })
}

export async function getPricingHistoryUseCase(packageId: string) {
  return prisma.servicePricing.findMany({
    where: { package_id: packageId },
    orderBy: { changed_at: 'desc' },
  })
}

export async function resolvePackagePrice(packageId: string): Promise<number> {
  const pricing = await prisma.servicePricing.findFirst({
    where: { package_id: packageId, is_current: true },
    select: { price: true },
  })
  return pricing?.price ?? 0
}
