# Phase 01 — Settings layout + sidebar skeleton

## Mục tiêu

Tạo khung khu vực `/dashboard/settings` với sidebar config-driven. Chưa có nội dung page (phase 02-03).

## Files

```
MỚI  apps/web-1/app/dashboard/settings/page.tsx
MỚI  apps/web-1/app/dashboard/settings/layout.tsx
MỚI  apps/web-1/app/dashboard/settings/_components/settings-nav.ts
MỚI  apps/web-1/app/dashboard/settings/_components/SettingsSidebar.tsx
```

## Chi tiết

### 1. `settings-nav.ts` — config (single source)

```ts
import { User, KeyRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SettingsNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  { href: "/dashboard/settings/profile", label: "Thông tin cơ bản", icon: User },
  { href: "/dashboard/settings/password", label: "Đổi mật khẩu", icon: KeyRound },
];
```

Thêm mục sau này = 1 entry ở đây + 1 route.

### 2. `SettingsSidebar.tsx` — client component

- Desktop (md+): `<nav>` cột, mỗi item là `Link` full-width: icon `w-4 h-4` + label `text-sm`, `rounded-lg px-3 py-2`.
- Active: `usePathname()` so khớp `item.href` (chính xác, vì tất cả item nằm trong settings) → `bg-surface-soft text-brand font-semibold`; inactive → `text-text-muted hover:text-text-app hover:bg-surface-soft/50`.
- Transition `transition-colors duration-150`, `cursor-pointer`, giữ focus ring mặc định.
- Mobile (<md): nav ngang cuộn — `flex gap-2 overflow-x-auto pb-1`, item thu gọn thành pill (`px-3 py-1.5`), không cột.

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETTINGS_NAV } from "./settings-nav";

export default function SettingsSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-1 md:pb-0">
      {SETTINGS_NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 shrink-0 rounded-lg px-3 py-2 font-body text-sm transition-colors duration-150 cursor-pointer ${
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

### 3. `layout.tsx` — nested layout

```tsx
"use client";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="pb-4 mb-6 border-b border-border-app">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-text-app">Cài đặt</h1>
        <p className="font-body text-sm text-text-muted mt-1">
          Quản lý thông tin cá nhân và bảo mật tài khoản
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-8 items-start">
        <SettingsSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
```

Lưu ý: không cần `"use client"` nếu layout không dùng hook — nhưng import client component `SettingsSidebar` vẫn OK từ server layout; để layout là server component, bỏ `"use client"`. (Sidebar tự client.) Chọn server layout để đúng Next.js 16 pattern.

### 4. `page.tsx` — redirect về profile

```tsx
import { redirect } from "next/navigation";

export default function SettingsIndexPage() {
  redirect("/dashboard/settings/profile");
}
```

## Verify phase

- `npm run check-types` — pass.
- Dev server: vào `/dashboard/settings` → tự chuyển `/dashboard/settings/profile`; tạm thời profile trả 404 (phase 02 xây sau) — chấp nhận giữa các phase, hoặc tạo placeholder page 1 dòng trong phase này rồi thay ở phase 02.
- Resize 375px: nav ngang cuộn, không horizontal scroll page.

## Trạng thái

`Status: done` — 4 file mới: `settings/layout.tsx` (grid sidebar), `settings/page.tsx` (redirect → profile), `_components/SettingsSidebar.tsx`, `_components/settings-nav.ts`. Không lệch thực tế. Grid sidebar dùng `md:grid-cols-[240px_1fr]` (220px ban đầu → 240px theo spec, xem plan Implementation Notes). Active link có `aria-current="page"` (fix sau review). Verify: `check-types` PASS (sau toàn phase), lint targeted sạch.
