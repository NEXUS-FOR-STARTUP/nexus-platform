# Journal: GA-19 Chat Unread-Per-User Plan

- **Date:** 2026-08-27
- **Feature:** GA-19 (Đếm số tin nhắn chưa đọc theo từng người dùng)
- **Status:** Planned
- **Plan directory:** `plans/260827-1600-ga19-chat-unread-per-user`

---

## 1. Bối cảnh & Hiện trạng

Tại trang Case Workspace (`apps/web-1/app/dashboard/case/[id]/page.tsx:116` và `apps/web-1/app/supporter/case/[id]/page.tsx:116`), badge số tin nhắn trên tab "Trao đổi" của `WorkspaceSidebar` hiện đang nhận `messages?.length` — tức là tổng số lượng tin nhắn trong case thay vì số lượng tin chưa đọc theo từng người dùng.

## 2. Giải pháp Kế hoạch

Kế hoạch chia thành 4 phase thực thi chặt chẽ:
1. **Phase 01 — Database & Shared Validation:** Model `CaseChatReadState` (bảng `case_chat_read_states`), khóa chính `(case_id, user_id)`, migration an toàn `--create-only`, Zod schemas trong `@repo/validation`.
2. **Phase 02 — Backend API & Realtime:** Repository `upsertCaseChatReadState`, `getUnreadMessageCount`; usecase `markChatReadUseCase`; endpoints `POST /api/cases/:id/chat/read` & `GET /api/cases/:id/chat/unread`; Centrifugo broadcast event `chat:read`.
3. **Phase 03 — Frontend Hooks & UI Integration:** Hook `useCaseUnreadCount`, cập nhật `WorkspaceSidebar` (badge chỉ hiện khi `unreadCount > 0`), tự động gọi `markAsRead` khi mở tab Trao đổi trong `TabDiscussionChat.tsx`, realtime sync qua `useRealtimeChat`.
4. **Phase 04 — Tests & Verification:** 6 test cases scoped trên Node test runner (`node:test` + `node:assert`), check-types 3 workspaces, audit DB safety.

## 3. Kế hoạch tiếp theo

- Thực hiện triển khai theo thứ tự Phase 01 -> Phase 02 -> Phase 03 -> Phase 04.
- Lệnh thực thi: `/ck:cook plans/260827-1600-ga19-chat-unread-per-user`
