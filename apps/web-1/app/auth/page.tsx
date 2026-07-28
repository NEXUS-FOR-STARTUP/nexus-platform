"use client";

import AuthShell from "@/components/layout/AuthShell";
import AuthPanel from "./_components/AuthPanel";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader } from "@mantine/core";

export default function AuthPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (session) {
    return (
      <AuthShell>
        <div className="py-12 flex flex-col items-center justify-center min-h-[300px] gap-4">
          <Loader color="blue" size="lg" type="dots" />
          <p className="text-sm font-medium text-text-muted animate-pulse">Đang tải phiên làm việc...</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthPanel />
    </AuthShell>
  );
}
