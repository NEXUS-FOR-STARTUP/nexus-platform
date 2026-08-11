"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { disconnectCentrifugeClient } from "@/lib/realtime/centrifuge-client";
import ThemeToggler from "../ui/ThemeToggler";
import Logo from "../ui/Logo";
import NotificationBell from "./NotificationBell";
import {
  Avatar,
  Menu,
  Badge,
} from "@mantine/core";
import { CreditCard, LogOut, LayoutDashboard, Shield, Wallet } from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const { data: sessionData, isPending } = useSession();
  const queryClient = useQueryClient();

  // Disconnect Centrifugo khi đổi tài khoản (connection token sub cũ ≠ session mới)
  const prevUserId = useRef<string | null>(null);
  useEffect(() => {
    const uid = sessionData?.user?.id ?? null;
    if (prevUserId.current && prevUserId.current !== uid) {
      disconnectCentrifugeClient();
    }
    prevUserId.current = uid;
  }, [sessionData?.user?.id]);

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          queryClient.clear();
          router.replace("/auth");
          router.refresh();
        },
      },
    });
  };

  const user = sessionData?.user ? (sessionData.user as typeof sessionData.user & { role?: string }) : undefined;

  // Role display details
  const getRoleBadge = (role?: string) => {
    if (role === "admin") {
      return (
        <Badge color="red" variant="light" className="font-body text-sm py-1">
          <span className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin</span>
          </span>
        </Badge>
      );
    }
    if (role === "supporter") {
      return (
        <Badge color="brand" variant="light" className="font-body text-sm py-1">
          Supporter
        </Badge>
      );
    }
    return (
      <Badge color="gray" variant="light" className="font-body text-sm py-1">
        Student
      </Badge>
    );
  };

  const getHomeLink = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "supporter") return "/supporter";
    return "/dashboard";
  };

  const isStudent = !(user?.role === "admin" || user?.role === "supporter");

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

          {/* User Menu */}
          {!isPending && user && (
            <div className="flex items-center gap-3">
              <Menu shadow="md" width={240} position="bottom-end">
                <Menu.Target>
                  <div className="cursor-pointer">
                    <Avatar
                      src={user.image || undefined}
                      alt={user.name || "User"}
                      radius="xl"
                      className="transition-transform ring-2 ring-transparent hover:ring-brand"
                    >
                      {user.name?.substring(0, 2).toUpperCase() || "US"}
                    </Avatar>
                  </div>
                </Menu.Target>
                <Menu.Dropdown className="bg-surface-app border border-border-app p-1 rounded-lg">
                  <div className="px-3 py-2 border-b border-border-app mb-1 flex flex-col gap-1.5">
                    <p className="font-semibold font-body text-sm text-text-app truncate">{user.name || "User"}</p>
                    <p className="font-semibold text-text-muted font-body text-xs truncate">{user.email}</p>
                    <div className="flex mt-0.5">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                  {user.role === "admin" && (
                    <Menu.Item
                      leftSection={<Shield className="w-4 h-4 text-text-muted" />}
                      onClick={() => router.push("/admin")}
                      className="text-text-app hover:bg-surface-soft cursor-pointer font-body text-xs font-semibold"
                    >
                      Bàn làm việc Admin
                    </Menu.Item>
                  )}
                  {user.role === "supporter" && (
                    <Menu.Item
                      leftSection={<LayoutDashboard className="w-4 h-4 text-text-muted" />}
                      onClick={() => router.push("/supporter")}
                      className="text-text-app hover:bg-surface-soft cursor-pointer font-body text-xs font-semibold"
                    >
                      Bàn làm việc Supporter
                    </Menu.Item>
                  )}
                  {isStudent && (
                    <Menu.Item
                      leftSection={<LayoutDashboard className="w-4 h-4 text-text-muted" />}
                      onClick={() => router.push("/dashboard")}
                      className="text-text-app hover:bg-surface-soft cursor-pointer font-body text-xs font-semibold"
                    >
                      Hồ sơ của tôi
                    </Menu.Item>
                  )}
                  {isStudent && (
                    <Menu.Item
                      leftSection={<CreditCard className="w-4 h-4 text-text-muted" />}
                      onClick={() => router.push("/dashboard/payments")}
                      className="text-text-app hover:bg-surface-soft cursor-pointer font-body text-xs font-semibold"
                    >
                      Lịch sử thanh toán
                    </Menu.Item>
                  )}
                  {isStudent && (
                    <Menu.Item
                      leftSection={<Wallet className="w-4 h-4 text-text-muted" />}
                      onClick={() => router.push("/dashboard/wallet")}
                      className="text-text-app hover:bg-surface-soft cursor-pointer font-body text-xs font-semibold"
                    >
                      Ví của tôi
                    </Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item
                    color="red"
                    leftSection={<LogOut className="w-4 h-4" />}
                    onClick={handleSignOut}
                    className="cursor-pointer font-body text-xs font-semibold"
                  >
                    Đăng xuất
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">{children}</main>
    </div>
  );
}
