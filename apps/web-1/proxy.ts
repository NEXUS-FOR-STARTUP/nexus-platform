import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AuthSession = {
  user?: {
    role?: string;
  };
} | null;

async function getSession(request: NextRequest): Promise<AuthSession> {
  const response = await fetch(`${AUTH_BASE_URL}/api/auth/get-session`, {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function redirectTo(request: NextRequest, pathname: string, preserveReturnUrl = false) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;

  if (preserveReturnUrl) {
    // Encode current pathname+search as returnUrl so auth page knows where to send user back
    const originalPath = request.nextUrl.pathname + request.nextUrl.search;
    redirectUrl.searchParams.set("returnUrl", originalPath);
  }

  return NextResponse.redirect(redirectUrl);
}

export async function proxy(request: NextRequest) {
  const sessionCookie =
    request.cookies.get("__Secure-better-auth.session_token") ||
    request.cookies.get("better-auth.session_token");
  const { pathname } = request.nextUrl;
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isSupporterRoute = pathname.startsWith("/supporter");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!sessionCookie && (isDashboardRoute || isSupporterRoute || isAdminRoute)) {
    return redirectTo(request, "/auth", true);
  }

  if (!sessionCookie || (!isSupporterRoute && !isAdminRoute)) {
    return NextResponse.next();
  }

  const session = await getSession(request);
  const role = session?.user?.role;

  if (!role) {
    return redirectTo(request, "/auth", true);
  }

  if (isAdminRoute && role !== "admin") {
    return redirectTo(request, role === "supporter" ? "/supporter" : "/dashboard");
  }

  if (isSupporterRoute && role !== "supporter" && role !== "admin") {
    return redirectTo(request, "/dashboard");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/supporter/:path*",
    "/admin/:path*",
  ],
};
