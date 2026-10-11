import type { Prisma } from "@prisma/client";
import type { PACKAGE_DTO_INCLUDE } from "../infrastructure/persistence/package.repository.js";

type PackageRow = Prisma.ServicePackageGetPayload<{ include: typeof PACKAGE_DTO_INCLUDE }>;

/** Price comes from the current pricing tier; the legacy column is only a fallback. */
export function toPackageDto(pkg: PackageRow) {
  const { pricing_tiers, ...rest } = pkg;
  return { ...rest, price: pricing_tiers?.[0]?.price ?? pkg.price };
}
