import {
  findActivePackages as defaultFindActivePackages,
} from "../infrastructure/persistence/package.repository.js";

type ListPackagesDeps = {
  findActivePackages?: typeof defaultFindActivePackages;
};

const defaultDeps = {
  findActivePackages: defaultFindActivePackages,
};

/**
 * Lists active service packages for customer-facing flows.
 */
export async function listPackagesUseCase(deps: ListPackagesDeps = {}) {
  const { findActivePackages } = {
    ...defaultDeps,
    ...deps,
  };

  const packages = await findActivePackages();
  return packages;
}
