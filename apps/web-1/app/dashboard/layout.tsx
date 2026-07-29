"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import DashboardShell from "@/components/layout/DashboardShell";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isPending) {
      if (!session) {
        router.push("/auth");
      } else if (pathname.startsWith("/dashboard")) {
        const role = (session.user as any).role;
        if (role === "admin" || role === "supporter") {
          const match = pathname.match(/^\/dashboard\/case\/([^\/]+)$/);
          if (match) {
            router.push(`/supporter/case/${match[1]}`);
          } else {
            router.push(role === "admin" ? "/admin" : "/supporter");
          }
        }
      }
    }
  }, [session, isPending, pathname, router]);

  if (isPending) {
    return <LoadingScreen message="Đang xác thực thông tin..." />;
  }

  if (!session) {
    return null;
  }

  // Render-phase role guard: prevent content flash for admin/supporter
  // on /dashboard routes before useEffect redirect fires
  const role = (session.user as any).role;
  if (role === "admin" || role === "supporter") {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
