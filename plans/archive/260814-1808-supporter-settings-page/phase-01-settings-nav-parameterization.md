# Phase 01 — Settings nav parameterization + layout extraction

## Mục tiêu

Biến nav settings thành config-driven theo `basePath` và extract layout shell dùng chung. **Zero thay đổi hiển thị student** — chỉ refactor nội bộ.

## Files

```
SỬA  apps/web-1/app/dashboard/settings/_components/settings-nav.ts
SỬA  apps/web-1/app/dashboard/settings/_components/SettingsSidebar.tsx
MỚI  apps/web-1/app/dashboard/settings/_components/SettingsLayout.tsx
SỬA  apps/web-1/app/dashboard/settings/layout.tsx
```

## Chi tiết

### 1. `settings-nav.ts` — `getSettingsNav(basePath)`

- [x] Thay const `SETTINGS_NAV` bằng hàm `getSettingsNav`. Sub-path giữ relative (`"/profile"`, `"/password"`), href = `` `${basePath}${subPath}` ``.

```ts
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
```

### 2. `SettingsSidebar.tsx` — `basePath` prop

- [x] Thêm prop `basePath?: string` default `"/dashboard/settings"`; gọi `getSettingsNav(basePath)` thay `SETTINGS_NAV`. Phần render giữ nguyên 100%.

```tsx
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
```

### 3. `SettingsLayout.tsx` — extract shell (MỚI, server component)

- [x] Chuyển nguyên 19 dòng hiện tại của `layout.tsx` vào đây. Server component (KHÔNG `"use client"`), nhận `children` + `basePath`.

```tsx
import type { ReactNode } from "react";
import SettingsSidebar from "./SettingsSidebar";

export default function SettingsLayout({
  children,
  basePath = "/dashboard/settings",
}: {
  children: ReactNode;
  basePath?: string;
}) {
  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="pb-4 mb-6 border-b border-border-app">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-app">Cài đặt</h1>
        <p className="font-body text-sm text-text-muted mt-1">
          Quản lý thông tin cá nhân và bảo mật tài khoản
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 md:gap-8 items-start">
        <SettingsSidebar basePath={basePath} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
```

### 4. `layout.tsx` — thin wrapper

- [x] Thay body layout bằng render `SettingsLayout`. Đổi tên default export tránh trùng import.

```tsx
import type { ReactNode } from "react";
import SettingsLayout from "./_components/SettingsLayout";

export default function DashboardSettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsLayout>{children}</SettingsLayout>;
}
```

## Verify phase

- [x] `npm run check-types` — web-1 pass.
- [x] Dev server `/dashboard/settings` → redirect `/dashboard/settings/profile`, sidebar active đúng, không lệch layout (xác nhận no-op về hiển thị).
- [x] `npx eslint` 4 file — 0 warning.

## Trạng thái

`Status: completed`
