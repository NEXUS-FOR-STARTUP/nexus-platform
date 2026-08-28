# Phase 1 — UI 2 section

## Context

- Plan: [plan.md](./plan.md)
- Luật chơi: [brainstorm-ux-grouping.md](../260828-1900-ga08-notification-preferences/reports/brainstorm-ux-grouping.md)
- Form: `apps/web-1/app/dashboard/settings/notifications/_components/NotificationPreferencesForm.tsx`
- Shared: dashboard + supporter pages import cùng form

## Overview

Priority P2. Status completed.

Chẻ `ACTIVE_SWITCHES` thành 2 nhóm visual. Giữ 4 key, `withReservedTrue`, `setDraft` capture `checked` trước updater, nút Lưu.

## Requirements

- Section **Nhóm thông báo**: `case_status_updates`, `payment_alerts`
- Divider
- Section **Kênh nhận**: `in_app_enabled`, `email_enabled`
- Dòng phụ:
  - Nhóm: "Tắt nhóm thì không nhận loại đó."
  - Kênh: "Tắt kênh thì không gửi qua kênh đó."
- Giữ title "Cài đặt thông báo" + subtitle Lưu
- Không đổi API, hook, schema

## Architecture

```
Paper
  title + subtitle (giữ)
  Text: Nhóm thông báo
  Text size=sm muted: Tắt nhóm thì không nhận loại đó.
  Switch × 2
  Divider (Mantine Divider)
  Text: Kênh nhận
  Text size=sm muted: Tắt kênh thì không gửi qua kênh đó.
  Switch × 2
  Button Lưu
```

Map 2 mảng `GROUP_SWITCHES` / `CHANNEL_SWITCHES` từ `ACTIVE_SWITCHES` hiện tại. Helper render Switch giữ nguyên `onChange` capture `checked`.

## Related files

- Modify: `NotificationPreferencesForm.tsx`
- Không tạo file mới
- Không sửa hook / pages (đã dùng form chung)

## Implementation steps

1. Import `Divider` từ `@mantine/core` nếu chưa có.
2. Tách data 2 mảng. Label/description copy giữ nguyên.
3. Render 2 block. Heading `Text fw={600}` nhỏ hơn title, hoặc `size="sm"` + `fw={600}`.
4. Giữ `disabled={save.isPending}`, capture `event.currentTarget.checked` trước `setDraft`.
5. Không thêm `fixed`/`inset-0`/`flex` lên Switch/Modal.

## Todo

- [x] Tách GROUP / CHANNEL arrays
- [x] Heading + helper + Divider
- [x] File vẫn < 200 dòng (166)

## Success

- 2 trên = nhóm, 2 dưới = kênh, không cần giải thích
- Switch vẫn draft; Lưu vẫn persist
- Student và supporter cùng UI

## Risks

- User vẫn tưởng switch = instant. Subtitle + helper gánh. Không thêm dirty badge (đã duyệt).

## Security

Không. Auth/API không đổi.
