import { prisma } from '../../../db.js'

export async function listServiceTypesUseCase() {
  return prisma.serviceType.findMany({
    where: { is_active: true },
    include: {
      packages: {
        where: { is_active: true },
        include: {
          pricing_tiers: {
            where: { is_current: true },
            take: 1,
          },
        },
      },
    },
  })
}

export async function createServiceTypeUseCase(data: {
  code: string
  name: string
  description?: string
}) {
  return prisma.serviceType.create({ data })
}

export async function updateServiceTypeUseCase(
  id: string,
  data: { name?: string; description?: string; is_active?: boolean },
) {
  return prisma.serviceType.update({ where: { id }, data })
}
