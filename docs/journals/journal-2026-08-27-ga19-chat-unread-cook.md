# Journal: GA-19 Chat Unread-Per-User Implementation Complete

- **Date:** 2026-08-27
- **Feature:** GA-19 (Theo dõi và hiển thị số tin nhắn chưa đọc theo từng người dùng)
- **Status:** COMPLETED
- **Plan Directory:** `plans/260827-1600-ga19-chat-unread-per-user/`

---

## 1. Tóm tắt Triển khai (Executive Summary)

Đã hoàn thành toàn bộ 4 Phase của tính năng **GA-19: Chat Unread Per User Tracking**:
1. **Database & Schema:** Thêm bảng `case_chat_read_states` (composite unique key `(case_id, user_id)`), migration script an toàn `20260827170000_add_case_chat_read_states`, Zod validation schemas trong `@repo/validation`.
2. **Backend API & Realtime:** Triển khai persistence methods (`upsertCaseChatReadState`, `getUnreadMessageCount`), use cases (`markChatReadUseCase`, `getChatUnreadCountUseCase`), HTTP endpoints (`POST /api/cases/:id/chat/read`, `GET /api/cases/:id/chat/unread`), và Centrifugo realtime event `chat:read`.
3. **Frontend Integration:** Hook `useCaseUnreadCount`, nâng cấp `useRealtimeChat` lắng nghe và cập nhật unread badge tức thì, kết nối `WorkspaceSidebar` và `TabDiscussionChat`, bổ sung cơ chế phục hồi khi Reconnect và refetch on window focus.
4. **Verification & Testing:** Unit & Integration test suite `ga-19-chat-unread.test.ts` pass 6/6 (100%), type-check pass across all 3 workspaces.

---

## 2. Các tệp tin thay đổi (Affected Files)

- `prisma/schema.prisma`
- `prisma/migrations/20260827170000_add_case_chat_read_states/migration.sql`
- `packages/validation/src/index.ts`
- `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts`
- `apps/api/src/modules/cases/application/mark-chat-read.usecase.ts`
- `apps/api/src/modules/cases/application/get-chat-unread-count.usecase.ts`
- `apps/api/src/modules/cases/http/cases.controller.ts`
- `apps/api/src/modules/cases/http/cases.routes.ts`
- `apps/api/src/modules/realtime/domain/realtime.types.ts`
- `apps/web-1/app/dashboard/case/[id]/hooks/useCaseUnreadCount.ts`
- `apps/web-1/app/dashboard/case/[id]/hooks/useRealtimeChat.ts`
- `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/TabDiscussionChat.tsx`
- `apps/web-1/app/dashboard/case/[id]/page.tsx`
- `apps/web-1/app/supporter/case/[id]/page.tsx`
- `apps/api/src/shared/infrastructure/tests/ga-19-chat-unread.test.ts`
- `tasks/bugs/ga-19-chat-unread-per-user.md`
