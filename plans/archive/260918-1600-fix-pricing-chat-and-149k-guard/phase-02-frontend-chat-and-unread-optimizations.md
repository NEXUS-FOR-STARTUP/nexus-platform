# Phase 2: Frontend Chat and Unread Optimizations

## Overview
- **Date:** 2026-09-18
- **Priority:** P1
- **Status:** Completed
- **Target:** `apps/web-1/app/dashboard/case/[id]/page.tsx`, `apps/web-1/app/dashboard/case/[id]/hooks/useCaseUnreadCount.ts`, `apps/web-1/app/dashboard/case/[id]/hooks/useRealtimeChat.ts`

## Key Insights
1. `useCaseUnreadCount(id)` được gọi vô điều kiện trong `case/[id]/page.tsx`. Với case 79k, hook này vẫn gửi HTTP request `GET /cases/:id/chat/unread` và lắng nghe reconnect Centrifugo vô ích.
2. `useRealtimeChat.ts` có nhánh `if (existing) { subRef.current = existing; return; }` không trả về hàm cleanup, làm mất cơ hội cleanup nếu rơi vào nhánh tái sử dụng subscription.

## Requirements
1. `useCaseUnreadCount`:
   - Thêm tham số `{ enabled?: boolean }` (default `true`).
   - Gán `enabled: Boolean(caseId) && (options.enabled ?? true)` vào `useQuery`.
   - Effect lắng nghe reconnect Centrifugo cũng guard theo `if (!caseId || !isEnabled) return;`.
2. `case/[id]/page.tsx`:
   - Truyền `{ enabled: Boolean(caseData && !isAiPackage) }` vào `useCaseUnreadCount(id, ...)`.
3. `useRealtimeChat.ts`:
   - Đảm bảo luôn trả về cleanup function ở mọi nhánh thực thi của effect.

## Success Criteria
- Case 79k không gửi request `unread` và không đăng ký reconnect listener.
- `useRealtimeChat` dọn dẹp subscription sạch sẽ.
