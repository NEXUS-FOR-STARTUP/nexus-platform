"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSettingsNav } from "./settings-nav";
import classes from "../settings.module.css";

export default function SettingsSidebar({
  basePath = "/dashboard/settings",
}: {
  basePath?: string;
}) {
  const pathname = usePathname();
  const items = getSettingsNav(basePath);
  return (
    <nav className={classes.nav} aria-label="Cài đặt tài khoản">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${classes.link} ${active ? classes.linkActive : ""}`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
