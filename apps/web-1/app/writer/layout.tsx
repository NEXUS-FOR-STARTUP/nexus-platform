"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import DashboardShell from "@/components/layout/DashboardShell";
import DesktopOnlyNotice from "@/components/layout/DesktopOnlyNotice";
import LoadingScreen from "@/components/ui/LoadingScreen";

export default function WriterLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth");
    } else if (!isPending && session) {
      const userRole = (session.user as any).role;
      if (userRole !== "writer" && userRole !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [session, isPending, router]);

  if (isPending) {
    return <LoadingScreen message="Đang kiểm tra quyền người viết bài..." />;
  }

  if (!session) {
    return null;
  }

  const userRole = (session.user as any).role;
  if (userRole !== "writer" && userRole !== "admin") {
    return null;
  }

  return (
    <>
      <div className="block lg:hidden min-h-screen">
        <DesktopOnlyNotice roleName="Người viết bài" />
      </div>
      <div className="hidden lg:block min-h-screen">
        <DashboardShell>{children}</DashboardShell>
      </div>
    </>
  );
}
