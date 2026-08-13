"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, Popover } from "@mantine/core";
import {
  CreditCard,
  Home,
  LogOut,
  Settings,
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

  const getHomeLink = (role?: string) => {
    if (role === "admin") return "/admin";
    if (role === "supporter") return "/supporter";
    return "/dashboard";
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
    { href: getHomeLink(user.role), label: "Trang chủ", icon: Home },
    ...(isStudent
      ? [
          { href: "/dashboard/wallet", label: "Thanh toán", icon: CreditCard },
          { href: "/dashboard/settings", label: "Cài đặt", icon: Settings },
        ]
      : []),
  ];

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      offset={8}
      width={280}
      radius="md"
      shadow="md"
      trapFocus
      closeOnEscape
      closeOnClickOutside
    >
      <Popover.Target>
        <button
          type="button"
          aria-label="Tài khoản"
          onClick={() => setOpened((prev) => !prev)}
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
      </Popover.Target>

      <Popover.Dropdown className="font-body">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col border-b border-border-app mb-1">
            <p
              className="px-3 py-2.5 text-xs text-text-muted truncate"
              title={user.email}
            >
              {user.email || "—"}
            </p>
            {isStudent && walletData && (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <span className="text-xs text-text-muted shrink-0">
                  Số dư ví:
                </span>
                <span className="text-sm font-semibold text-danger tabular-nums">
                  {walletBalance.toLocaleString("vi-VN")} VND
                </span>
              </div>
            )}
          </div>

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
        <div className="pt-1 mt-1 border-t border-border-app">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 text-sm rounded-md px-3 py-2.5 text-left hover:bg-danger/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger transition-colors cursor-pointer text-danger"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}
