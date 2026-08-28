import { User, KeyRound, MonitorSmartphone, Bell, type LucideIcon } from "lucide-react";

export interface SettingsNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SETTINGS_NAV_SUB_ITEMS = [
  { href: "/profile", label: "Thông tin cơ bản", icon: User },
  { href: "/password", label: "Đổi mật khẩu", icon: KeyRound },
  { href: "/sessions", label: "Thiết bị & Phiên đăng nhập", icon: MonitorSmartphone },
  { href: "/notifications", label: "Cài đặt thông báo", icon: Bell },
] satisfies { href: string; label: string; icon: LucideIcon }[];

export function getSettingsNav(basePath: string): SettingsNavItem[] {
  return SETTINGS_NAV_SUB_ITEMS.filter(
    (item) => !(basePath.startsWith("/supporter") && item.href === "/notifications"),
  ).map((item) => ({
    ...item,
    href: `${basePath}${item.href}`,
  }));
}
