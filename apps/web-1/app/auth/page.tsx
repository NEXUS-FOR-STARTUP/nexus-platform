"use client";

import AuthShell, { AuthLoading } from "@/components/layout/AuthShell";
import AuthPanel from "./_components/AuthPanel";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";

export default function AuthPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      const role = (session.user as { role?: string } | undefined)?.role;
      if (role === "admin") {
        router.push("/admin");
            } else if (role === "writer") {
        router.push("/writer");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session, router]);

  if (session) {
    return (
      <AuthShell>
        <AuthLoading label="Đang tải phiên làm việc..." />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Suspense fallback={<AuthLoading label="Đang tải..." />}>
        <AuthPanel />
      </Suspense>
    </AuthShell>
  );
}
