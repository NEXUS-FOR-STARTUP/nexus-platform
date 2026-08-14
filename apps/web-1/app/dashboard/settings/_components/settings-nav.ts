import { User, KeyRound, type LucideIcon } from "lucide-react";

export interface SettingsNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SETTINGS_NAV_SUB_ITEMS = [
  { href: "/profile", label: "Thông tin cơ bản", icon: User },
  { href: "/password", label: "Đổi mật khẩu", icon: KeyRound },
] satisfies { href: string; label: string; icon: LucideIcon }[];

export function getSettingsNav(basePath: string): SettingsNavItem[] {
  return SETTINGS_NAV_SUB_ITEMS.map((item) => ({
    ...item,
    href: `${basePath}${item.href}`,
  }));
}
