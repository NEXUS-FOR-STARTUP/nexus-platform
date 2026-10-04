"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getSettingsNav } from "./settings-nav";

export default function SettingsSidebar({
  basePath = "/dashboard/settings",
}: {
  basePath?: string;
}) {
  const pathname = usePathname();
  const items = getSettingsNav(basePath);
  return (
    <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 shrink-0 rounded-lg px-3 py-2 font-body text-sm transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              active
                ? "bg-surface-soft text-brand font-semibold"
                : "text-text-muted hover:text-text-app hover:bg-surface-soft/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
