import { type Icon } from "@phosphor-icons/react";
import { User, Key as KeyRound, Devices as MonitorSmartphone, Bell } from "@phosphor-icons/react/ssr";

export interface SettingsNavItem {
  href: string;
  label: string;
  icon: Icon;
}

const SETTINGS_NAV_SUB_ITEMS = [
  { href: "/profile", label: "Thông tin cơ bản", icon: User },
  { href: "/password", label: "Đổi mật khẩu", icon: KeyRound },
  { href: "/sessions", label: "Thiết bị & Phiên đăng nhập", icon: MonitorSmartphone },
  { href: "/notifications", label: "Cài đặt thông báo", icon: Bell },
] satisfies { href: string; label: string; icon: Icon }[];

export function getSettingsNav(basePath: string): SettingsNavItem[] {
  return SETTINGS_NAV_SUB_ITEMS.filter(
    (item) => !(basePath !== "/dashboard/settings" && item.href === "/notifications"),
  ).map((item) => ({
    ...item,
    href: `${basePath}${item.href}`,
  }));
}
