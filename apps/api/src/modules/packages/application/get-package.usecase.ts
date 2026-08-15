import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";

export async function getPackageUseCase(packageId: string) {
  const pkg = await prisma.servicePackage.findUnique({
    where: { id: packageId, is_active: true },
    include: { pricing_tiers: { where: { is_current: true }, take: 1 } },
  });
  if (!pkg) {
    throw new AppError(404, "PACKAGE_NOT_FOUND", "Không tìm thấy gói dịch vụ");
  }
  return {
    id: pkg.id,
    name: pkg.name,
    price: pkg.pricing_tiers[0]?.price ?? pkg.price,
  };
}
