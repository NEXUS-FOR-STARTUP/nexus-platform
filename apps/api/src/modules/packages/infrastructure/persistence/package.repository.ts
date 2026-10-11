import { prisma } from "../../../../db.js";

export const PACKAGE_DTO_INCLUDE = {
  service_type: { select: { code: true, name: true } },
  pricing_tiers: { where: { is_current: true }, take: 1 },
} as const;

export async function findActivePackages() {
  return await prisma.servicePackage.findMany({
    where: { is_active: true },
    orderBy: { price: "asc" },
    include: PACKAGE_DTO_INCLUDE,
  });
}

export async function findAllPackages() {
  return await prisma.servicePackage.findMany({
    orderBy: [{ is_active: "desc" }, { price: "asc" }],
  });
}

export async function createPackage(data: { name: string; price: number; features: string[] }) {
  return await prisma.servicePackage.create({
    data,
  });
}

export async function findPackageById(id: string) {
  return await prisma.servicePackage.findUnique({
    where: { id },
  });
}

type PriceChangeMetadata = {
  previousPrice: number;
  changedBy: string;
  changedAt: Date;
};

export async function updatePackagePrice(
  id: string,
  price: number,
  metadata: PriceChangeMetadata,
) {
  return await prisma.servicePackage.update({
    where: { id },
    data: {
      price,
      previous_price: metadata.previousPrice,
      last_price_changed_by: metadata.changedBy,
      last_price_changed_at: metadata.changedAt,
    },
  });
}

export async function updatePackageStatus(id: string, isActive: boolean) {
  return await prisma.servicePackage.update({
    where: { id },
    data: {
      is_active: isActive,
    },
  });
}
