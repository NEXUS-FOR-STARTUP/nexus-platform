"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isNewsActive = pathname?.startsWith("/news");

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
    if (user?.role === "writer") return "/writer";
    return "/dashboard";
  };

  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-bg-app transition-colors duration-200">
      {/* Top Navbar */}
      <nav className="border-b border-border-app bg-surface-app sticky top-0 z-40 h-16 flex items-center gap-4 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="flex items-center gap-6 sm:gap-8 min-w-0">
          <Link href={getHomeLink()} className="flex items-center shrink-0">
            <Logo height={62} />
          </Link>

          <nav aria-label="Điều hướng chính" className="flex items-center">
            <Link
              href="/news"
              className={`relative py-1 text-sm sm:text-base font-semibold transition-colors duration-200 group ${
                isNewsActive ? "text-text-app" : "text-text-muted hover:text-text-app"
              }`}
            >
              Bài viết
              <span
                className={`absolute left-0 -bottom-1 h-0.5 bg-brand transition-all duration-300 ease-out rounded-full ${
                  isNewsActive ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-4 shrink-0">
          <NotificationBell />
          <ThemeToggler />
          {!isPending && user && <UserMenu />}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col min-h-0">{children}</main>
    </div>
  );
}
