"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSettingsNav } from "./settings-nav";
import classes from "../settings.module.css";

export default function SettingsSidebar({
  basePath = "/dashboard/settings",
  onItemClickAction,
}: {
  basePath?: string;
  onItemClickAction?: () => void;
}) {
  const pathname = usePathname();
  const items = getSettingsNav(basePath);

  return (
    <nav aria-label="Cài đặt tài khoản" className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${classes.navItem} ${active ? classes.active : ""}`}
            onClick={onItemClickAction}
          >
            <Icon size={18} className={classes.navIcon} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
