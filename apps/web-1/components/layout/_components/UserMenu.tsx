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
  const isSupporter = user?.role === "supporter";
  const settingsHref = isStudent
    ? "/dashboard/settings"
    : isSupporter
      ? "/supporter/settings"
      : null;

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
      ? [{ href: "/dashboard/wallet", label: "Thanh toán", icon: CreditCard }]
      : []),
    ...(settingsHref
      ? [{ href: settingsHref, label: "Cài đặt", icon: Settings }]
      : []),
  ];

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      offset={6}
      width={260}
      radius="md"
      shadow="md"
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
            size="md"
            className="transition-transform ring-2 ring-transparent hover:ring-brand"
          >
            {user.name?.substring(0, 2).toUpperCase() || "US"}
          </Avatar>
        </button>
      </Popover.Target>

      <Popover.Dropdown className="font-body p-2">
        {/* User email */}
        <div className="px-2.5 pt-1.5 pb-2">
          <p className="text-base text-text-muted truncate" title={user.email}>
            {user.email || "—"}
          </p>
        </div>

        {/* Wallet balance block: Clear, high contrast, instantly readable */}
        {isStudent && walletData && (
          <div className="mx-1 mb-2 px-3 py-2.5 rounded-lg bg-surface-soft flex items-center justify-between">
            <span className="text-base text-text-muted">Số dư</span>
            <span className="text-base font-bold text-danger tabular-nums">
              {walletBalance.toLocaleString("vi-VN")} VND
            </span>
          </div>
        )}

        {/* Navigation Links & Sign out */}
        <div className="flex flex-col gap-0.5">
          {options.map(({ href, label, icon: Icon }) => (
            <button
              key={href}
              type="button"
              onClick={() => handleNavigate(href)}
              className="w-full flex items-center gap-3 text-base font-medium rounded-md px-3 py-2 text-left hover:bg-surface-soft transition-colors cursor-pointer text-text-app outline-none"
            >
              <Icon className="w-4 h-4 text-text-muted shrink-0" />
              <span>{label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 text-base font-medium rounded-md px-3 py-2 text-left hover:bg-danger-soft transition-colors cursor-pointer text-danger outline-none"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}
