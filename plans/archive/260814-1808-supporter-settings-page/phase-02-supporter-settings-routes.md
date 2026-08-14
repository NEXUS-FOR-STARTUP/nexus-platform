# Phase 02 — Supporter settings routes

## Mục tiêu

Tạo thin routes `/supporter/settings/*` tái dùng form/hook student qua relative import. Không tạo form mới.

## Files

```
MỚI  apps/web-1/app/supporter/settings/layout.tsx
MỚI  apps/web-1/app/supporter/settings/page.tsx
MỚI  apps/web-1/app/supporter/settings/profile/page.tsx
MỚI  apps/web-1/app/supporter/settings/password/page.tsx
```

## Chi tiết

### 1. `supporter/settings/layout.tsx` — server component

- [x] Wrap `SettingsLayout` với `basePath="/supporter/settings"`. Nested dưới `supporter/layout.tsx` (client, role guard + DashboardShell) — KHÔNG đụng file đó.

```tsx
import type { ReactNode } from "react";
import SettingsLayout from "../../dashboard/settings/_components/SettingsLayout";

export default function SupporterSettingsLayout({ children }: { children: ReactNode }) {
  return <SettingsLayout basePath="/supporter/settings">{children}</SettingsLayout>;
}
```

### 2. `supporter/settings/page.tsx` — redirect

- [x] Redirect index → profile.

```tsx
import { redirect } from "next/navigation";

export default function SupporterSettingsIndexPage() {
  redirect("/supporter/settings/profile");
}
```

### 3. `supporter/settings/profile/page.tsx` — reuse ProfileInfoForm

- [x] Mirror `dashboard/settings/profile/page.tsx` (useSession + loading + form), import form qua relative import 3 cấp (precedent `supporter/case/[id]`).

```tsx
"use client";

import { useSession } from "@/lib/auth-client";
import { Text } from "@mantine/core";
import { Loader2 } from "lucide-react";
import ProfileInfoForm from "../../../dashboard/settings/profile/_components/ProfileInfoForm";

export default function SupporterSettingsProfilePage() {
  const { data: sessionData, isPending, refetch } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  const user = sessionData?.user;

  if (!user) {
    return (
      <Text size="sm" className="text-text-muted">
        Không thể tải thông tin tài khoản. Vui lòng thử lại sau.
      </Text>
    );
  }

  return <ProfileInfoForm user={user} refetch={refetch} />;
}
```

### 4. `supporter/settings/password/page.tsx` — reuse ChangePasswordForm

- [x] Mirror `dashboard/settings/password/page.tsx`.

```tsx
"use client";

import { useSession } from "@/lib/auth-client";
import { Text } from "@mantine/core";
import { Loader2 } from "lucide-react";
import ChangePasswordForm from "../../../dashboard/settings/password/_components/ChangePasswordForm";

export default function SupporterSettingsPasswordPage() {
  const { data: sessionData, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!sessionData?.user) {
    return (
      <Text size="sm" className="text-text-muted">
        Không thể tải thông tin tài khoản. Vui lòng thử lại sau.
      </Text>
    );
  }

  return <ChangePasswordForm />;
}
```

## Verify phase

- [x] `npm run check-types` — resolve đúng (đặc biệt relative import depth).
- [x] Dev server: login supporter → `/supporter/settings` → redirect `/supporter/settings/profile`, sidebar 2 mục href `/supporter/settings/profile` + `/supporter/settings/password`, active đúng.
- [x] Supporter đổi tên → toast xanh, navbar name refresh.
- [x] Supporter đổi pass → success, field reset.
- [x] `npx eslint` 4 file — 0 warning.

## Trạng thái

`Status: completed`
