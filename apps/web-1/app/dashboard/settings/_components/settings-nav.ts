import { User, KeyRound, type LucideIcon } from "lucide-react";

export interface SettingsNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  { href: "/dashboard/settings/profile", label: "Thông tin cơ bản", icon: User },
  { href: "/dashboard/settings/password", label: "Đổi mật khẩu", icon: KeyRound },
];
