export function getAuthRedirectUrl(searchParams: URLSearchParams): string {
  const raw = searchParams.get("returnUrl");
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) {
    return raw;
  }

  const packageId = searchParams.get("packageId");
  if (packageId) {
    if (packageId === "pkg_tf_free") return "/dashboard/team-fit";
    // Generic forward for any paid package (e.g. pkg_ai_audit, pkg_supporter_audit)
    return `/dashboard/intake?packageId=${packageId}`;
  }
  return "/dashboard";
}
