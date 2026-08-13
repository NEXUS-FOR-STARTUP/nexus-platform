"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Badge, Modal } from "@mantine/core";
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import { useWalletBalance } from "@/app/dashboard/wallet/hooks/useWallet";

type UserMenuOption = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export default function UserMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: sessionData, isPending } = useSession();
  const { data: walletData } = useWalletBalance();
  const [opened, setOpened] = useState(false);

  const user = sessionData?.user
    ? (sessionData.user as typeof sessionData.user & { role?: string })
    : undefined;

  const walletBalance = walletData?.balance ?? 0;
  const isStudent = !(user?.role === "admin" || user?.role === "supporter");

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

  const handleNavigate = (href: string) => {
    router.push(href);
    setOpened(false);
  };

  if (isPending || !user) return null;

  const options: UserMenuOption[] = [
    ...(user.role === "admin"
      ? [{ href: "/admin", label: "Bàn làm việc Admin", icon: Shield }]
      : []),
    ...(user.role === "supporter"
      ? [
          {
            href: "/supporter",
            label: "Bàn làm việc Supporter",
            icon: LayoutDashboard,
          },
        ]
      : []),
    ...(isStudent
      ? [
          { href: "/dashboard/settings/profile", label: "Hồ sơ", icon: User },
          { href: "/dashboard/wallet", label: "Thanh toán", icon: CreditCard },
          { href: "/dashboard/settings", label: "Cài đặt", icon: Settings },
        ]
      : []),
  ];

  return (
    <>
      <button
        type="button"
        aria-label="Tài khoản"
        onClick={() => setOpened(true)}
        className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Avatar
          src={user.image || undefined}
          alt={user.name || "User"}
          radius="xl"
          className="transition-transform ring-2 ring-transparent hover:ring-brand"
        >
          {user.name?.substring(0, 2).toUpperCase() || "US"}
        </Avatar>
      </button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        size="sm"
        radius="md"
        centered
        withCloseButton={false}
      >
        <div className="flex flex-col gap-4 font-body">
          {/* Info block */}
          <div className="flex flex-col items-center gap-1.5 pb-4 border-b border-border-app">
            <Avatar
              src={user.image || undefined}
              alt={user.name || "User"}
              size={56}
              radius="xl"
            >
              {user.name?.substring(0, 2).toUpperCase() || "US"}
            </Avatar>
            <p className="font-heading font-semibold text-sm text-text-app">
              {user.name || "User"}
            </p>
            <p className="text-xs text-text-muted break-all">{user.email || "—"}</p>
            {getRoleBadge(user.role)}
            {isStudent && walletData && (
              <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-border-app">
                <span className="text-xs text-text-muted">Số dư:</span>
                <span className="text-xs font-semibold text-text-app tabular-nums">
                  {walletBalance.toLocaleString("vi-VN")} VND
                </span>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="flex flex-col gap-1">
            {options.map(({ href, label, icon: Icon }) => (
              <button
                key={href}
                type="button"
                onClick={() => handleNavigate(href)}
                className="w-full flex items-center gap-2.5 text-sm rounded-md px-3 py-2.5 text-left hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand transition-colors cursor-pointer text-text-app"
              >
                <Icon className="w-4 h-4 text-text-muted" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Sign out */}
          <div className="pt-1 border-t border-border-app">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 text-sm rounded-md px-3 py-2.5 text-left hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger transition-colors cursor-pointer text-danger"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
