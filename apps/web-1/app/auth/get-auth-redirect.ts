import { PACKAGE_KEYS } from "@/lib/pricing";

export function getAuthRedirectUrl(searchParams: URLSearchParams): string {
  const raw = searchParams.get("returnUrl");
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) {
    return raw;
  }

  const packageId = searchParams.get("packageId");
  if (packageId) {
    if (packageId === PACKAGE_KEYS.FREE) return "/dashboard/team-fit";
    if (packageId === PACKAGE_KEYS.SUPPORTER_AUDIT) {
      return `/dashboard/intake?packageId=${PACKAGE_KEYS.AI_AUDIT}`;
    }
    return `/dashboard/intake?packageId=${packageId}`;
  }
  return "/dashboard";
}
