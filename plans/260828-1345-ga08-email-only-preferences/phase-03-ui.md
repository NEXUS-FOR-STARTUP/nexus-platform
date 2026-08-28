---
phase: 3
title: Student email switch, drop supporter tab
status: completed
---

# Phase 03 — UI

## Context Links

- Plan: [plan.md](./plan.md)
- Form: `apps/web-1/app/dashboard/settings/notifications/_components/NotificationPreferencesForm.tsx`
- Hook: `apps/web-1/app/dashboard/settings/hooks/useNotificationPreferences.ts`
- Nav: `apps/web-1/app/dashboard/settings/_components/settings-nav.ts`
- Student page: `.../dashboard/settings/notifications/page.tsx`
- Supporter page: `apps/web-1/app/supporter/settings/notifications/page.tsx`
- Layout supporter: `apps/web-1/app/supporter/settings/layout.tsx` (`basePath=/supporter/settings`)

## Overview

P1. Student 1 switch. Supporter không còn tab thông báo.

## Key Insights

- Form chung student/supporter. Xóa page supporter + ẩn nav theo `basePath`.
- `getSettingsNav` dùng chung. Filter `/notifications` khi `basePath` bắt đầu `/supporter`.
- Giữ nút Lưu. Không auto-save.
- Mantine `Switch` + `Button`. Không `fixed`/`inset-0` trên Switch/Modal.
- File < 200 dòng. Lucide `Bell` student nav giữ.
- `apps/web-1/AGENTS.md` đọc trước khi sửa web.

## Requirements

- 1 switch: label kiểu "Nhận email" / "Gửi thông báo tới email đã đăng ký".
- Không switch in-app, case, payment, chat, marketing, telegram.
- Draft + Save. Save lỗi giữ draft (không sync đè khi pending — v1 đã vá).
- Xóa `withReservedTrue`.
- URL `/supporter/settings/notifications` → 404 sau xóa page.

## Architecture

```text
Student /dashboard/settings/notifications
  → NotificationPreferencesForm (1 Switch email_enabled)
  → useNotificationPreferences GET/PUT { email_enabled }

Supporter settings nav: profile, password, sessions. Không Bell.
```

## Related Code Files

- Modify: `NotificationPreferencesForm.tsx`
- Modify: `useNotificationPreferences.ts` (type 1 field)
- Modify: `settings-nav.ts`
- Delete: `apps/web-1/app/supporter/settings/notifications/page.tsx`
- Keep: student `notifications/page.tsx`

## Implementation Steps

1. Form: một `Switch` bind `email_enabled`. Bỏ `GROUP_SWITCHES` / `CHANNEL_SWITCHES` / divider 2 section.
2. Hook types theo Zod mới.
3. `getSettingsNav`: skip notifications nếu supporter.
4. Xóa supporter notifications page.
5. Không thêm Tailwind layout hack lên Mantine.

## Todo List

- [x] Form 1 switch + Lưu
- [x] Nav ẩn notifications trên supporter
- [x] Delete supporter notifications page
- [x] Hook/types slim

## Success Criteria

- Student thấy 1 công tắc Email.
- Tắt + Lưu → GET lại `email_enabled: false`.
- Supporter settings không có "Cài đặt thông báo".
- In-app bell không có chỗ tắt.

## Risk Assessment

- Bookmark supporter URL cũ → 404. OK.
- Admin không có settings. Không đụng.

## Security Considerations

Hook dùng session cookie qua `apiClient`. Không gọi `apiClient` trực tiếp trong form — giữ hook.

## Next Steps

Phase 04 tests + smoke.
