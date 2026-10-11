import {
  findActivePackages as defaultFindActivePackages,
} from "../infrastructure/persistence/package.repository.js";
import { toPackageDto } from "./package-dto.js";

type ListPackagesDeps = {
  findActivePackages?: typeof defaultFindActivePackages;
};

const defaultDeps = {
  findActivePackages: defaultFindActivePackages,
};

/**
 * Lists purchasable service packages for customer-facing flows (active, priced, with credits).
 * Free init package (0đ) and unopened packages (e.g. 149k mentor audit) stay hidden here;
 * admin listing uses findAllPackages instead.
 */
export async function listPackagesUseCase(deps: ListPackagesDeps = {}) {
  const { findActivePackages } = {
    ...defaultDeps,
    ...deps,
  };

  const packages = await findActivePackages();
  // Defense in depth: effective price comes from the current pricing tier
  // (see toPackageDto), so re-check the DTO — a tier can zero out a priced base.
  return packages.map(toPackageDto).filter((p) => p.price > 0 && (p.credits_granted ?? 0) > 0);
}
