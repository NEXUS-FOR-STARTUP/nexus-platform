---
title: "GA-08 UI: 2 section nhóm / kênh"
description: "Tách 4 switch thành 2 section (Nhóm thông báo / Kênh nhận), giữ Lưu, luật AND. Không đổi API."
status: completed
priority: P2
effort: 1h
branch: feat/gap-analysis-tasks
tags: [frontend, notification, ux]
blockedBy: []
blocks: []
created: 2026-08-28
ticket: tasks/bugs/ga-08-notification-preferences.md
brainstorm: plans/260828-1900-ga08-notification-preferences/reports/brainstorm-ux-grouping.md
parent: plans/260828-1900-ga08-notification-preferences/plan.md
---

# GA-08 UI: 2 section nhóm / kênh

## Overview

4 switch cùng visual = user đọc 4 việc độc lập. Luật thật: 2 nhóm × 2 kênh AND, commit bằng Lưu.

Sửa UI form: 2 heading + divider + 1 dòng phụ mỗi section. Không đổi hook/API/schema. Không matrix. Không auto-save. Không thêm telegram/chat/marketing.

## Cross-Plan Dependencies

| Relationship | Plan | Status |
|---|---|---|
| Follows | [GA-08 Notification Preferences](../260828-1900-ga08-notification-preferences/plan.md) | completed |
| Design | [brainstorm-ux-grouping](../260828-1900-ga08-notification-preferences/reports/brainstorm-ux-grouping.md) | agreed |

Không `blockedBy`: parent completed.

## Phases

| Phase | Name | Status |
|---|---|---|
| 1 | [UI 2 section](./phase-01-ui-sections.md) | Completed |
| 2 | [Verify](./phase-02-verify.md) | Completed (screenshot; skip browser loop) |

## Dependencies

- Form chung: `apps/web-1/app/dashboard/settings/notifications/_components/NotificationPreferencesForm.tsx`
- Student + supporter cùng import form này
- Mantine `Text` + `Stack` + `Switch` + `Button` (không `fixed`/`inset-0` trên Switch)
- File < 200 dòng

## Non-goals

- Auto-save / bỏ Lưu
- Dirty badge "Chưa lưu"
- Ma trận 2×2
- Đổi `UpdateNotificationPreferenceSchema` / reserved coerce
- Telegram fail-open / group gate
