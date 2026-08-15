import { prisma } from '../../../db.js'

export async function setCurrentPricingUseCase(
  packageId: string,
  price: number,
  changedBy: string,
) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.servicePricing.findFirst({
      where: { package_id: packageId, is_current: true },
    })

    if (current) {
      await tx.servicePricing.update({
        where: { id: current.id },
        data: { is_current: false },
      })
    }

    return tx.servicePricing.create({
      data: {
        package_id: packageId,
        price,
        is_current: true,
        previous_price: current?.price ?? null,
        changed_by: changedBy,
        changed_at: new Date(),
      },
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
