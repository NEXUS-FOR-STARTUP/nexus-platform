import type { ReactNode } from "react";
import SettingsSidebar from "./_components/SettingsSidebar";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="pb-4 mb-6 border-b border-border-app">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-app">Cài đặt</h1>
        <p className="font-body text-sm text-text-muted mt-1">
          Quản lý thông tin cá nhân và bảo mật tài khoản
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-8 items-start">
        <SettingsSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
