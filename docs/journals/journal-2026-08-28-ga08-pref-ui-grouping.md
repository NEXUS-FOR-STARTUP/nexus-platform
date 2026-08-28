---
title: "GA-08 UI grouping — 2 section nhóm / kênh"
date: 2026-08-28
tags: [ga-08, notification, ux]
---

# Journal — GA-08 UI grouping

## Context

User phản biện màn Cài đặt thông báo bằng lens luật chơi (không review code). 2 trên / 2 dưới nhìn như 4 việc khác nhau.

Cook `--auto` plan `260828-1057-ga08-pref-ui-grouping`. Chỉ sửa form chung.

`NotificationPreferencesForm.tsx`: `GROUP_SWITCHES` / `CHANNEL_SWITCHES`, heading + helper + `Divider`, giữ Lưu + `withReservedTrue` + capture `checked`. 166 dòng. Hook/API/schema không đổi.

User screenshot: 2 section đúng copy, không telegram/chat/marketing. Skip browser smoke loop.

## Decisions

- Không đổi API / reserved / telegram gate
- Form chung student+supporter
- Plan mới, không đè plan GA-08 completed
- Không auto-save, không dirty badge

## Next

Không. Plan completed.
