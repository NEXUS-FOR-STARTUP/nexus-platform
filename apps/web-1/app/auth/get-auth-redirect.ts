export function getAuthRedirectUrl(searchParams: URLSearchParams): string {
  const raw = searchParams.get("returnUrl");
  if (raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\")) {
    return raw;
  }

  const packageId = searchParams.get("packageId");
  if (packageId === "pkg_tf_free") return "/dashboard/team-fit";
  if (packageId === "pkg_tf_audit") return `/dashboard/intake?packageId=${packageId}`;
  return "/dashboard";
}
