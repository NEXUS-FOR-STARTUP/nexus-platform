import type { ReactNode } from "react";
import SettingsSidebar from "./SettingsSidebar";
import classes from "../settings.module.css";

export default function SettingsLayout({
  children,
  basePath = "/dashboard/settings",
}: {
  children: ReactNode;
  basePath?: string;
}) {
  return (
    <div className={classes.layout}>
      <h1 className={classes.title}>Cài đặt</h1>
      <p className={classes.note}>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
      <div className={classes.body}>
        <SettingsSidebar basePath={basePath} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
