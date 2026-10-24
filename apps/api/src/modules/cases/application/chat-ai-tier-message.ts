import { findPackageById } from "../../packages/infrastructure/persistence/package.repository.js";

/** Chat-block message for AI-only packages; the package name comes from the DB. */
export async function buildChatAiTierMessage(packageId: string | null | undefined): Promise<string> {
  const pkg = packageId ? await findPackageById(packageId) : null;
  const label = pkg?.name ? `Gói ${pkg.name}` : "Gói này";
  return `${label} được xử lý tự động bằng AI, không bao gồm tính năng trao đổi với Supporter.`;
}
