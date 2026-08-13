"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { disconnectCentrifugeClient } from "@/lib/realtime/centrifuge-client";
import ThemeToggler from "../ui/ThemeToggler";
import Logo from "../ui/Logo";
import NotificationBell from "./NotificationBell";
import UserMenu from "./_components/UserMenu";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { data: sessionData, isPending } = useSession();

  // Disconnect Centrifugo khi đổi tài khoản (connection token sub cũ ≠ session mới)
  const prevUserId = useRef<string | null>(null);
  useEffect(() => {
    const uid = sessionData?.user?.id ?? null;
    if (prevUserId.current && prevUserId.current !== uid) {
      disconnectCentrifugeClient();
    }
    prevUserId.current = uid;
  }, [sessionData?.user?.id]);

  const user = sessionData?.user
    ? (sessionData.user as typeof sessionData.user & { role?: string })
    : undefined;

  const getHomeLink = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "supporter") return "/supporter";
    return "/dashboard";
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg-app transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="border-b border-border-app bg-surface-app sticky top-0 z-40 h-16 flex items-center gap-4 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="flex items-center gap-4 min-w-0">
          <Link href={getHomeLink()} className="flex items-center shrink-0">
            <Logo height={52} />
          </Link>
        </div>

        <div className="ml-auto flex items-center gap-4 shrink-0">
          <NotificationBell />
          <ThemeToggler />
          {!isPending && user && <UserMenu />}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">{children}</main>
    </div>
  );
}
