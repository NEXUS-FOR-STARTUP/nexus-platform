# Plan: Fix Pricing Chat Guard, Realtime Lifecycle, and 149k Entrypoints

## Overview
Khắc phục triệt để các lỗ hổng edge case đã phát hiện sau khi rà soát PR #39:
1. Chặn cấp token Centrifugo cho case 79k (`pkg_ai_audit`) ở backend.
2. Tối ưu frontend case workspace: tắt `useCaseUnreadCount` khi là gói AI, bổ sung cleanup cho `useRealtimeChat`.
3. Khóa toàn bộ các đường bypass gói 149k (`pkg_supporter_audit`) qua Landing Page, Intake URL, và Auth Redirect.
4. Cập nhật affordance UI: đổi badge 149k thành "Sắp ra mắt", disable nút hoặc chặn chuyển hướng, chỉnh sửa tiêu đề mục 4 tại bước 6 Intake.

## Phases

| Phase | File | Status | Description |
|---|---|---|---|
| 1 | [phase-01-backend-realtime-token-guard.md](./phase-01-backend-realtime-token-guard.md) | Completed | Chặn subscription token Centrifugo cho gói 79k, thêm unit test |
| 2 | [phase-02-frontend-chat-and-unread-optimizations.md](./phase-02-frontend-chat-and-unread-optimizations.md) | Completed | Gated `useCaseUnreadCount` và sửa cleanup trong `useRealtimeChat` |
| 3 | [phase-03-intake-and-149k-entrypoints-guard.md](./phase-03-intake-and-149k-entrypoints-guard.md) | Completed | Chặn bypass 149k (Landing, Intake, Redirect), sửa badge & heading |
| 4 | [phase-04-verification-and-tests.md](./phase-04-verification-and-tests.md) | Completed | Chạy typecheck, unit test backend, và code review |
