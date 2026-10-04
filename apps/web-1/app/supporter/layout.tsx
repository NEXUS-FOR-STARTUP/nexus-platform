"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import DashboardShell from "@/components/layout/DashboardShell";
import DesktopOnlyNotice from "@/components/layout/DesktopOnlyNotice";
import LoadingScreen from "@/components/ui/LoadingScreen";
export default function SupporterLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth");
    } else if (!isPending && session) {
      const userRole = (session.user as any).role;
      if (userRole !== "supporter") {
        router.push("/dashboard");
      }
    }
  }, [session, isPending, router]);

  if (isPending) {
    return <LoadingScreen message="Đang kiểm tra quyền Supporter..." />;
  }

  if (!session || (session.user as any).role !== "supporter") {
    return null;
  }

  return (
    <>
      <div className="block lg:hidden min-h-screen">
        <DesktopOnlyNotice roleName="Người hỗ trợ" />
      </div>
      <div className="hidden lg:block min-h-screen">
        <DashboardShell>{children}</DashboardShell>
      </div>
    </>
  );
}
