"use client";

import React from "react";
import Link from "next/link";
import { Monitor, ArrowLeft, LogOut, Laptop } from "lucide-react";
import { Button } from "@mantine/core";
import { signOut } from "@/lib/auth-client";
import Logo from "../ui/Logo";
import ThemeToggler from "../ui/ThemeToggler";

interface DesktopOnlyNoticeProps {
  roleName: "Quản trị viên" | "Người hỗ trợ" | string;
}

export default function DesktopOnlyNotice({ roleName }: DesktopOnlyNoticeProps) {
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            window.location.href = "/auth";
          },
        },
      });
    } catch {
      // Fallback redirect if network error occurs
      window.location.href = "/auth";
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen min-h-dvh bg-bg-app text-text-app transition-colors duration-200">
      {/* Top bar */}
      <header className="h-16 px-6 border-b border-border-app bg-surface-app/80 backdrop-blur-md flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center">
          <Logo height={46} />
        </Link>
        <ThemeToggler />
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl border border-border-app bg-surface-app shadow-lg flex flex-col items-center text-center space-y-6 animate-fade-in">
          {/* Icon visual */}
          <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-brand/10 border border-brand/20 text-brand">
            <Monitor className="w-10 h-10 stroke-[1.75]" />
            <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-7 h-7 rounded-full bg-surface-app border border-border-app text-text-muted shadow-sm">
              <Laptop className="w-4 h-4 text-brand" />
            </span>
          </div>

          {/* Badge & Headings */}
          <div className="space-y-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-brand/10 text-brand border border-brand/20">
              Chỉ hỗ trợ máy tính (Desktop)
            </span>
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-text-app">
              Yêu cầu màn hình Desktop
            </h1>
            <p className="font-body text-xs sm:text-sm text-text-muted leading-relaxed">
              Không gian làm việc của <strong className="text-text-app">{roleName}</strong> được thiết kế tối ưu cho màn hình lớn để đối chiếu dữ liệu bảng, xử lý hồ sơ và phản biện chuyên sâu.
            </p>
          </div>

          {/* Device notice box */}
          <div className="w-full p-3.5 rounded-xl bg-surface-soft/60 border border-border-app/70 text-left space-y-1.5">
            <p className="text-xs font-semibold text-text-app flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block" />
              Thiết bị hiện tại không được hỗ trợ
            </p>
            <p className="text-[11px] sm:text-xs text-text-subtle leading-normal">
              Giao diện quản trị hiện chưa hỗ trợ thiết bị di động (phone) và máy tính bảng (tablet). Vui lòng đăng nhập trên máy tính có độ phân giải từ <strong>1024px</strong> trở lên.
            </p>
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-2.5 pt-2">
            <Button
              component={Link}
              href="/"
              variant="default"
              fullWidth
              size="md"
              leftSection={<ArrowLeft className="w-4 h-4" />}
              className="font-semibold text-xs h-11"
            >
              Về trang chủ
            </Button>
            <Button
              variant="subtle"
              color="red"
              fullWidth
              size="sm"
              loading={isLoggingOut}
              onClick={handleSignOut}
              leftSection={<LogOut className="w-4 h-4" />}
              className="font-medium text-xs h-9 cursor-pointer"
            >
              Đăng xuất
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-text-subtle border-t border-border-app/40 shrink-0">
        © 2026 Nexus Platform. Không gian quản trị và hỗ trợ.
      </footer>
    </div>
  );
}
