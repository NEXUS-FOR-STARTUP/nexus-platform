import { AppError } from "../../../shared/domain/app-error.js";
import { prisma } from "../../../db.js";
import { PACKAGE_DTO_INCLUDE } from "../infrastructure/persistence/package.repository.js";
import { toPackageDto } from "./package-dto.js";

export async function getPackageUseCase(packageId: string) {
  const pkg = await prisma.servicePackage.findUnique({
    where: { id: packageId },
    include: PACKAGE_DTO_INCLUDE,
  });
  if (!pkg) {
    throw new AppError(404, "PACKAGE_NOT_FOUND", "Không tìm thấy gói dịch vụ");
  }
  const { id, name, price, is_active, credits_granted, service_type } = toPackageDto(pkg);
  return { id, name, price, is_active, credits_granted, service_type };
}
