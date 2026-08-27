# Phase 02: Frontend Session Management UI & Navigation

## Context Links
- **Plan Tổng quan**: [plan.md](./plan.md)
- **Task Gốc**: `tasks/bugs/ga-06-session-management-ui.md`
- **Báo cáo Khảo sát**: [reports/frontend-ui-scout.md](./reports/frontend-ui-scout.md), [reports/security-edge-cases.md](./reports/security-edge-cases.md)
- **Files liên quan**:
  - `apps/web-1/app/dashboard/settings/_components/settings-nav.ts`
  - `apps/web-1/lib/utils/ua-parser.ts`
  - `apps/web-1/app/dashboard/settings/hooks/useSessionQueries.ts`
  - `apps/web-1/app/dashboard/settings/hooks/useSessionMutations.ts`
  - `apps/web-1/app/dashboard/settings/sessions/page.tsx`
  - `apps/web-1/app/supporter/settings/sessions/page.tsx`
  - `apps/web-1/app/dashboard/settings/sessions/_components/SessionsList.tsx`
  - `apps/web-1/app/dashboard/settings/sessions/_components/SessionItem.tsx`
  - `apps/web-1/app/dashboard/settings/sessions/_components/RevokeOthersModal.tsx`

---

## Overview
- **Mục tiêu**: Xây dựng giao diện trang Quản lý thiết bị & Phiên đăng nhập tại `/dashboard/settings/sessions` và `/supporter/settings/sessions`, bao gồm cập nhật thanh điều hướng cài đặt, phân tích User-Agent thành thông tin thân thiện (OS, Browser, Device Type) với regex theo thứ tự ưu tiên chuẩn xác, hiển thị danh sách phiên, badge phiên hiện tại và các nút thu hồi phiên an toàn với scoped loading.
- **Trạng thái**: Completed
- **Ước lượng**: 1.5h

---

## Key Insights & Fixes từ Red Team Review
1. **Đường dẫn API Client Chuẩn**: `apiClient` trong `apps/web-1/lib/api-client.ts` đã có sẵn `baseURL: ".../api"`. Do đó, các request trong hooks phải gọi relative path `/profile/sessions` (không lặp lại `/api/profile/sessions` để tránh lỗi 404 `/api/api/...`).
2. **Làm mới Cache trong `onSettled`**: Đặt `queryClient.invalidateQueries({ queryKey: ["profile", "sessions"] })` trong `onSettled` của cả 2 mutation (`useRevokeSessionMutation` và `useRevokeOtherSessionsMutation`). Đảm bảo danh sách phiên luôn được refresh ngay cả khi server trả về 404 do phiên đã bị xóa trước đó từ thiết bị khác.
3. **Scoped Loading State theo Session**: Tránh việc disable toàn bộ danh sách phiên khi bấm xóa 1 phiên. Nút bấm của từng `SessionItem` nhận cờ `isRevoking={mutation.isPending && mutation.variables === session.id}`.
4. **Thứ tự Regex Parser chuẩn xác**:
   - Browser: Phải kiểm tra `Edg/` (Edge), `OPR/` hoặc `Opera` (Opera), `CocCoc` (Cốc Cốc), `Brave` (Brave) **TRƯỚC** khi kiểm tra `Chrome`, vì các trình duyệt Chromium đều chứa chuỗi `Chrome/` trong User-Agent.
   - OS: Kiểm tra `iPhone`, `iPad`, `iPod` trước `Macintosh`; kiểm tra `Android` trước `Linux`.
   - Giới hạn độ dài và làm sạch chuỗi input để chống tấn công ReDoS hoặc UI Spoofing.
5. **Tuân thủ Mantine UI v9 & AGENTS.md**:
   - Dùng `Paper p="xl" radius="md" className="bg-surface-app border border-border-app"`.
   - Tuyệt đối không thêm class định vị thủ công (`fixed`, `inset-0`, `flex items-center justify-center`) vào Mantine `Modal`.
   - Tuyệt đối không dùng class đổ bóng (`shadow-sm`, `shadow-md`) trên `Paper` / `Card`.
   - Sử dụng icon từ `lucide-react` và định kích thước qua Tailwind class `className="w-4 h-4"` hoặc `className="w-5 h-5"`.

---

## Component Hierarchy & Architecture

```
[SettingsLayout (Dashboard / Supporter)]
   │
   ├── [SettingsSidebar] (Có mục mới: "Thiết bị & Phiên đăng nhập")
   │
   └── [SessionsPage]
         │
         ├── [SessionsList]
         │     ├── Header & Title + Subtitle
         │     ├── Action Bar (Button: "Đăng xuất tất cả thiết bị khác")
         │     │     └── [RevokeOthersModal] (Modal xác nhận bảo vệ tài khoản)
         │     │
         │     └── List of [SessionItem]
         │           ├── Device Icon (Laptop / Smartphone / Tablet / Globe)
         │           ├── Device Title (e.g. "Windows • Chrome")
         │           ├── IP Address & formatted string
         │           ├── Created time & Expiration time
         │           ├── Status Badge ("Phiên hiện tại" vs Action Button "Đăng xuất")
         │           └── Scoped loading spinner cho item đang được thu hồi
```

---

## Related Code Files

### Files to Modify:
1. `apps/web-1/app/dashboard/settings/_components/settings-nav.ts`:
   - Import `MonitorSmartphone` từ `lucide-react`.
   - Thêm phần tử `{ href: "/sessions", label: "Thiết bị & Phiên đăng nhập", icon: MonitorSmartphone }` vào `SETTINGS_NAV_SUB_ITEMS`.

### Files to Create:
1. `apps/web-1/lib/utils/ua-parser.ts`: Utility phân tích User-Agent chuỗi sang OS, Browser, Device Type & Icon Lucide.
2. `apps/web-1/app/dashboard/settings/hooks/useSessionQueries.ts`: Hook `useActiveSessionsQuery` gọi `GET /profile/sessions`.
3. `apps/web-1/app/dashboard/settings/hooks/useSessionMutations.ts`: Hook `useRevokeSessionMutation` và `useRevokeOtherSessionsMutation`.
4. `apps/web-1/app/dashboard/settings/sessions/page.tsx`: Entry page cho sinh viên.
5. `apps/web-1/app/supporter/settings/sessions/page.tsx`: Entry page cho supporter (re-export/re-use `SessionsList`).
6. `apps/web-1/app/dashboard/settings/sessions/_components/SessionsList.tsx`: Component chứa toàn bộ giao diện danh sách phiên.
7. `apps/web-1/app/dashboard/settings/sessions/_components/SessionItem.tsx`: Component hiển thị từng thẻ thiết bị.
8. `apps/web-1/app/dashboard/settings/sessions/_components/RevokeOthersModal.tsx`: Modal xác nhận đăng xuất hàng loạt.

---

## Implementation Steps

### Bước 1: Cập nhật `settings-nav.ts`
Trong `apps/web-1/app/dashboard/settings/_components/settings-nav.ts`:
```typescript
import { User, KeyRound, MonitorSmartphone, type LucideIcon } from "lucide-react";

export interface SettingsNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const SETTINGS_NAV_SUB_ITEMS = [
  { href: "/profile", label: "Thông tin cơ bản", icon: User },
  { href: "/password", label: "Đổi mật khẩu", icon: KeyRound },
  { href: "/sessions", label: "Thiết bị & Phiên đăng nhập", icon: MonitorSmartphone },
] satisfies { href: string; label: string; icon: LucideIcon }[];

export function getSettingsNav(basePath: string): SettingsNavItem[] {
  return SETTINGS_NAV_SUB_ITEMS.map((item) => ({
    ...item,
    href: `${basePath}${item.href}`,
  }));
}
```

### Bước 2: Viết `apps/web-1/lib/utils/ua-parser.ts`
```typescript
export interface ParsedUserAgent {
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet" | "unknown";
}

export function parseUserAgent(uaString?: string | null): ParsedUserAgent {
  if (!uaString || typeof uaString !== "string") {
    return {
      browser: "Trình duyệt không xác định",
      os: "Hệ điều hành không xác định",
      deviceType: "unknown",
    };
  }

  const ua = uaString.slice(0, 500); // Guard chống ReDoS

  // 1. Phân tích OS
  let os = "Hệ điều hành khác";
  let deviceType: "desktop" | "mobile" | "tablet" | "unknown" = "desktop";

  if (/Windows NT 10.0/i.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6.1/i.test(ua)) os = "Windows 7";
  else if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/iPad/i.test(ua)) {
    os = "iPadOS";
    deviceType = "tablet";
  } else if (/iPhone|iPod/i.test(ua)) {
    os = "iOS";
    deviceType = "mobile";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = "macOS";
    deviceType = "desktop";
  } else if (/Android/i.test(ua)) {
    os = "Android";
    deviceType = /Mobile/i.test(ua) ? "mobile" : "tablet";
  } else if (/CrOS/i.test(ua)) {
    os = "ChromeOS";
    deviceType = "desktop";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
    deviceType = "desktop";
  }

  // 2. Phân tích Browser (Thứ tự ưu tiên: Edge -> Opera -> CocCoc -> Brave -> Chrome -> Safari -> Firefox)
  let browser = "Trình duyệt khác";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/coc_coc/i.test(ua)) browser = "Cốc Cốc";
  else if (/Brave/i.test(ua)) browser = "Brave";
  else if (/Chrome\//i.test(ua)) browser = "Google Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Mozilla Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Apple Safari";

  return { browser, os, deviceType };
}

export function formatIpAddress(ip?: string | null): string {
  if (!ip) return "IP không xác định";
  if (ip === "::1" || ip === "127.0.0.1" || ip.includes("localhost")) {
    return "Localhost";
  }
  return ip.replace(/^::ffff:/, ""); // Bỏ prefix IPv4-mapped IPv6
}
```

### Bước 3: Tạo `useSessionQueries.ts` & `useSessionMutations.ts`
Trong `apps/web-1/app/dashboard/settings/hooks/useSessionQueries.ts`:
```typescript
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ActiveSessionsResponse, ActiveSessionDto } from "@repo/validation";

export function useActiveSessionsQuery() {
  return useQuery({
    queryKey: ["profile", "sessions"],
    queryFn: async () => {
      // apiClient đã có baseURL: ".../api", gọi relative path: "/profile/sessions"
      const res = await apiClient.get<ActiveSessionsResponse>("/profile/sessions");
      return res.data.data;
    },
  });
}
```

Trong `apps/web-1/app/dashboard/settings/hooks/useSessionMutations.ts`:
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { notifications } from "@mantine/notifications";

export function useSessionMutations() {
  const queryClient = useQueryClient();

  const revokeSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiClient.delete<{ success: boolean; message: string }>(
        `/profile/sessions/${sessionId}`
      );
      return res.data;
    },
    onSuccess: (data) => {
      notifications.show({
        title: "Thành công",
        message: data.message || "Đã đăng xuất thiết bị thành công.",
        color: "teal",
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Không thể đăng xuất thiết bị này. Vui lòng thử lại.";
      notifications.show({
        title: "Lỗi",
        message: msg,
        color: "red",
      });
    },
    onSettled: () => {
      // Luôn làm mới danh sách session sau khi hoàn tất mutation (kể cả khi 404)
      queryClient.invalidateQueries({ queryKey: ["profile", "sessions"] });
    },
  });

  const revokeOtherSessions = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ success: boolean; count: number; message: string }>(
        "/profile/sessions/revoke-others"
      );
      return res.data;
    },
    onSuccess: (data) => {
      notifications.show({
        title: "Thành công",
        message: data.message || "Đã đăng xuất khỏi tất cả các thiết bị khác.",
        color: "teal",
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Không thể đăng xuất các thiết bị khác. Vui lòng thử lại.";
      notifications.show({
        title: "Lỗi",
        message: msg,
        color: "red",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "sessions"] });
    },
  });

  return { revokeSession, revokeOtherSessions };
}
```

### Bước 4: Tạo UI Components (`SessionItem.tsx`, `RevokeOthersModal.tsx`, `SessionsList.tsx`)
- `SessionItem.tsx`:
  - Khung `Paper p="md" radius="sm" className="bg-surface-app border border-border-app"`.
  - Icon thiết bị trong hình tròn `bg-brand-soft text-brand`: Laptop (desktop), Smartphone (mobile), Tablet (tablet), Globe (unknown).
  - Tiêu đề: `${parsed.os} • ${parsed.browser}`.
  - Phụ đề: IP: `${formatIpAddress(session.ipAddress)}` | Đăng nhập lúc: `${formatDate(session.createdAt)}`.
  - Cột phải:
    - Nếu `session.isCurrent`: `<Badge color="teal" variant="light">Phiên hiện tại</Badge>`.
    - Nếu không phải `session.isCurrent`: `<Button color="red" variant="light" size="xs" loading={isRevoking} disabled={isRevoking} onClick={() => onRevoke(session.id)}>Đăng xuất</Button>`.
- `RevokeOthersModal.tsx`:
  - `Modal centered size="md" radius="md" opened={opened} onClose={onClose} title="Đăng xuất khỏi tất cả thiết bị khác"`.
  - Nội dung cảnh báo rõ ràng.
  - Nút "Hủy" và nút "Xác nhận đăng xuất" (`color="red"`, `loading={loading}`).
- `SessionsList.tsx`:
  - `Paper p="xl" radius="md" className="bg-surface-app border border-border-app"`.
  - Header: Tiêu đề "Thiết bị & Phiên đăng nhập", mô tả phụ.
  - Nút "Đăng xuất khỏi tất cả thiết bị khác" hiển thị ở header nếu tổng số session > 1.
  - Render `SessionItem` cho từng session.

### Bước 5: Tạo Trang `page.tsx` cho Dashboard và Supporter
- `apps/web-1/app/dashboard/settings/sessions/page.tsx`:
  - Tải dữ liệu từ `useActiveSessionsQuery()`.
  - Hiển thị spinner `Loader2` khi đang tải.
  - Render `SessionsList`.
- `apps/web-1/app/supporter/settings/sessions/page.tsx`:
  - Mirror page tương tự, tái sử dụng `SessionsList`.

---

## Todo List
- [x] Cập nhật `settings-nav.ts` thêm tab `/sessions`
- [x] Tạo `apps/web-1/lib/utils/ua-parser.ts` kèm `formatIpAddress`
- [x] Tạo `useSessionQueries.ts` và `useSessionMutations.ts` (gọi relative `/profile/sessions`, `onSettled` invalidation)
- [x] Tạo `RevokeOthersModal.tsx`
- [x] Tạo `SessionItem.tsx` (scoped `isRevoking` loading)
- [x] Tạo `SessionsList.tsx`
- [x] Tạo `dashboard/settings/sessions/page.tsx`
- [x] Tạo `supporter/settings/sessions/page.tsx`
- [x] Kiểm tra responsive trên Desktop và Mobile

---

## Success Criteria
1. Tab "Thiết bị & Phiên đăng nhập" xuất hiện trên Sidebar cài đặt của cả Dashboard sinh viên và Supporter.
2. Truy cập `/dashboard/settings/sessions` hiển thị danh sách phiên mượt mà, phân tích đúng OS và Trình duyệt (Edge/Chrome/Safari/Firefox/Opera).
3. Thiết bị hiện tại có badge màu xanh "Phiên hiện tại" và không có nút Đăng xuất đơn lẻ.
4. Bấm "Đăng xuất" trên thiết bị khác chỉ hiện loading trên đúng item đó, thu hồi thành công và làm mới danh sách.
5. Bấm "Đăng xuất tất cả thiết bị khác" hiển thị Modal xác nhận, xác nhận xong thu hồi thành công toàn bộ các phiên khác.
6. Tuân thủ 100% quy chuẩn Mantine UI v9, không lỗi hydration hoặc CSS layout.
