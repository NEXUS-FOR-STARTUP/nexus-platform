# GA-19: Đếm số tin nhắn chưa đọc theo từng người dùng (Chat Unread-per-User)

- **ID:** GA-19
- **Priority:** P2
- **Category:** Chat / UX
- **Status:** Resolved
- **Completion Date:** 2026-08-27
- **Plan Reference:** `plans/260827-1600-ga19-chat-unread-per-user/`
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`

---

## 1. Mô tả vấn đề
Tại trang Case Workspace (`apps/web-1/app/dashboard/case/[id]/page.tsx` và `apps/web-1/app/supporter/case/[id]/page.tsx`), badge tin nhắn trên tab Chat trước đây hiển thị `messages?.length` — tức là **tổng số tin nhắn** có trong cuộc trò chuyện, thay vì số tin nhắn mới mà người dùng hiện tại chưa đọc (`unread_count`).
Người dùng và Supporter không thể phân biệt được case nào có tin nhắn mới cần phản hồi gấp, dễ dẫn tới bỏ sót tin nhắn quan trọng.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Database & Schema:**
   - Model `CaseChatReadState` lưu: `case_id`, `user_id`, `last_read_message_id`, `last_read_at`.
2. **Backend API & Realtime:**
   - Endpoint: `POST /api/cases/:id/chat/read` (đánh dấu đã đọc tới tin nhắn chỉ định).
   - Endpoint: `GET /api/cases/:id/chat/unread` (lấy số tin chưa đọc và mốc thời gian đọc gần nhất).
   - Broadcast Centrifugo event `chat:read` để đồng bộ đa thiết bị và thông báo trạng thái đã đọc.
3. **Frontend UI & Realtime Sync:**
   - Badge tab Chat trên `WorkspaceSidebar` chỉ hiện số lượng tin chưa đọc thực tế (`unread_count > 0`), ẩn badge khi `unread_count === 0`.
   - Tự động gọi `markAsRead` khi người dùng chuyển sang tab Chat / Trao đổi.
   - Tự động bù đắp tin nhắn bị miss khi mất mạng / sleep máy thông qua listener `connected` của Centrifugo client và `refetchOnWindowFocus`.

## 3. Kiến trúc & Giải pháp Kỹ thuật (Technical Architecture)

### 3.1. Database Model (`prisma/schema.prisma`)
- Model `CaseChatReadState` (bảng `case_chat_read_states`):
  - Primary key: `id` (UUID default)
  - Unique constraint: `@@unique([case_id, user_id])`
  - Indexes: `@@index([case_id])`, `@@index([user_id])`, `@@index([case_id, last_read_at])`
  - Quan hệ cascade với `Case` và `User`.
- Migration an toàn `--create-only` không gây gián đoạn hay phá hủy dữ liệu.

### 3.2. Shared Validation (`packages/validation/src/index.ts`)
- `MarkChatReadRequestSchema` & `MarkChatReadRequest` (`{ last_read_message_id?: string }`)
- `MarkChatReadResponseSchema` & `MarkChatReadResponse` (`{ success: boolean, unread_count: number, last_read_at?: string }`)
- `CaseUnreadCountResponseSchema` & `CaseUnreadCountResponse` (`{ unread_count: number, last_read_at?: string }`)

### 3.3. Backend Layer (`apps/api`)
- **Persistence (`case.repository.ts`):**
  - `upsertCaseChatReadState(caseId, userId, lastReadMessageId)`: Neo timestamp theo `created_at` của message chỉ định (chống lệch đồng hồ).
  - `getCaseChatReadState(caseId, userId)`: Lấy trạng thái đọc của user trong case.
  - `getUnreadMessageCount(caseId, userId)`: Đếm các tin nhắn tạo sau `last_read_at` và `sender_auth_user_id !== userId`.
- **Application Layer:**
  - `markChatReadUseCase`: Upsert DB + phát event `chat:read` qua Centrifugo.
  - `getChatUnreadCountUseCase`: Lấy số tin chưa đọc và mốc `last_read_at`.
- **Realtime Layer (`realtime.types.ts`):**
  - Payload `ChatReadEventPayload` (`type: "chat:read"`, `case_id`, `user_id`, `last_read_message_id`, `last_read_at`).
  - Helper `buildChatReadMessage`.
- **HTTP Routes & Controller (`cases.routes.ts`, `cases.controller.ts`):**
  - `POST /api/cases/:id/chat/read` (bảo vệ bởi `requireAuth`, `requireCaseAccess`).
  - `GET /api/cases/:id/chat/unread` (bảo vệ bởi `requireAuth`, `requireCaseAccess`).

### 3.4. Frontend Layer (`apps/web-1`)
- **Custom Hook `useCaseUnreadCount(caseId)`:**
  - Quản lý TanStack Query với query key `["cases", caseId, "unread-count"]`.
  - Mutation `markAsRead(lastReadMessageId)` kèm debounce/idempotency ref (`lastMarkedMessageIdRef`).
  - Lắng nghe event `connected` từ Centrifugo singleton để tự động refetch khi reconnect.
  - `refetchOnWindowFocus: true` để đồng bộ khi quay lại tab.
- **Realtime Subscription `useRealtimeChat(caseId, { activeTab, markAsRead })`:**
  - Xử lý publication `message`: nếu tin nhắn từ người khác và đang ở tab chat $\rightarrow$ gọi `markAsRead`; nếu ở tab khác $\rightarrow$ tăng `unread_count` badge (+1).
  - Xử lý publication `chat:read`: nếu là chính user đó (từ tab/thiết bị khác) $\rightarrow$ cập nhật cache `unread_count = 0`.
- **Workspace Navigation `WorkspaceSidebar.tsx`:**
  - Nhận prop `unreadCount` cho tab `discussion`.
  - Badge tròn hiển thị khi `count > 0` và tự động ẩn khi `count === 0`.
- **Case Workspace Integration (`page.tsx` & `TabDiscussionChat.tsx`):**
  - Tự động gọi `markAsRead` khi mở tab Trao đổi.

## 4. Tóm tắt Kiểm thử & Nghiệm thu (Verification & Tests)
- **Unit Tests:** `apps/api/src/shared/infrastructure/tests/ga-19-chat-unread.test.ts` (5 test suites kiểm tra Zod validation, Centrifugo payload builder, usecase mark read broadcast, usecase unread count, và first-time user handling).
- **Type Checking:** `npm run check-types` pass 100% không lỗi trên cả 3 package (`apps/api`, `apps/web-1`, `packages/validation`).
- **DB Migration:** Migration an toàn với `CREATE TABLE "case_chat_read_states"` và index kép `(case_id, last_read_at)`.

## 5. Danh sách File thay đổi / bổ sung
| Workspace / Module | File Path | Mục đích |
|---|---|---|
| Prisma | `prisma/schema.prisma` | Thêm model `CaseChatReadState` & relation `chat_read_states` |
| Validation | `packages/validation/src/index.ts` | Thêm Zod schemas & types cho mark read & unread count |
| API Persistence | `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts` | Thêm `upsertCaseChatReadState`, `getCaseChatReadState`, `getUnreadMessageCount` |
| API Application | `apps/api/src/modules/cases/application/mark-chat-read.usecase.ts` | UseCase đánh dấu đã đọc & broadcast Centrifugo |
| API Application | `apps/api/src/modules/cases/application/get-chat-unread-count.usecase.ts` | UseCase lấy số tin chưa đọc |
| API Realtime | `apps/api/src/modules/realtime/domain/realtime.types.ts` | Thêm `ChatReadEventPayload` & `buildChatReadMessage` |
| API HTTP | `apps/api/src/modules/cases/http/cases.controller.ts` | Controller handlers `markChatReadHandler`, `getChatUnreadCountHandler` |
| API HTTP | `apps/api/src/modules/cases/http/cases.routes.ts` | Route bindings `POST /:id/chat/read`, `GET /:id/chat/unread` |
| API Tests | `apps/api/src/shared/infrastructure/tests/ga-19-chat-unread.test.ts` | Test suite tự động cho GA-19 |
| Web Hook | `apps/web-1/app/dashboard/case/[id]/hooks/useCaseUnreadCount.ts` | Hook TanStack Query quản lý unread count & reconnect sync |
| Web Hook | `apps/web-1/app/dashboard/case/[id]/hooks/useRealtimeChat.ts` | Tích hợp publication `chat:read` và tăng/reset unread realtime |
| Web UI | `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx` | Cập nhật badge tab chat theo `unreadCount` |
| Web Workspace | `apps/web-1/app/dashboard/case/[id]/page.tsx` | Kết nối `useCaseUnreadCount` và `useRealtimeChat` |
| Web Workspace | `apps/web-1/app/supporter/case/[id]/page.tsx` | Kết nối `useCaseUnreadCount` và `useRealtimeChat` cho supporter |
