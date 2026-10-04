---
title: "GA-19: Đếm số tin nhắn chưa đọc theo từng người dùng (Chat Unread-per-User)"
description: "Theo dõi trạng thái đã đọc/chưa đọc tin nhắn theo từng user cho từng case, hiển thị unread count badge trên WorkspaceSidebar và đồng bộ realtime 100% qua Centrifugo kèm cơ chế phục hồi khi reconnect."
status: completed
progress: 100%
updated_at: "2026-08-27"
priority: P2
category: "Chat / UX"
source: "tasks/bugs/ga-19-chat-unread-per-user.md & docs/research/mandatory-features-gap-analysis-2026-08-24.md"
created_at: "2026-08-27"
estimated_effort: "3.5h"
phases:
  - phase-01-database-and-schema.md
  - phase-02-backend-api-and-realtime.md
  - phase-03-frontend-hooks-and-ui.md
  - phase-04-tests-and-verification.md
blockedBy: []
blocks: []
---

# GA-19: Đếm số tin nhắn chưa đọc theo từng người dùng (Chat Unread-per-User)

## 1. Bối cảnh & Vấn đề (Context & Problem)

Tại trang Case Workspace (`apps/web-1/app/dashboard/case/[id]/page.tsx:116` và `apps/web-1/app/supporter/case/[id]/page.tsx:116`), thanh điều hướng `WorkspaceSidebar` hiện đang nhận prop:
```tsx
messageCount={caseData.messages?.length}
```
Điều này dẫn đến:
- Badge tin nhắn luôn hiển thị **tổng số tin nhắn** đã gửi trong toàn bộ lịch sử trao đổi của case, thay vì số tin nhắn mới mà người dùng hiện tại **chưa đọc**.
- Sinh viên, Supporter và Admin không thể phân biệt được case nào có tin nhắn mới cần phản hồi gấp.

## 2. Trọng tâm Thiết kế Kỹ thuật (Technical Focus)

1. **Phạm vi chuẩn xác (Item 1 — Focused Scope):** Tập trung trực tiếp vào Case Workspace (`/dashboard/case/:id` và `/supporter/case/:id`). Truy vấn `getUnreadMessageCount(caseId, userId)` thực thi 1 câu count duy nhất, tối ưu qua index kép `(case_id, last_read_at)` trên PostgreSQL, không gây over-engineering.
2. **100% Realtime Push & Deduplication (Item 2 & 3):** 
   - Nhận publication event từ Centrifugo channel `chat:${caseId}` cập nhật badge ngay lập tức (0ms).
   - Commit DB bằng `POST /api/cases/:id/chat/read` với `last_read_message_id`. Server neo mốc thời gian `last_read_at` theo `created_at` của message đó trên DB (chống lệch giờ).
   - Client so sánh `latestMessageId !== lastMarkedMessageId` để tránh gửi request dư thừa.
3. **Phục hồi khi Mất mạng / Sleep Reconnection (Item 4 — Reconnection Sync):**
   - Đăng ký listener `client.on("connected", () => refetchUnread())` trên Centrifugo client.
   - Bật `refetchOnWindowFocus: true` trên TanStack Query để tự động bù các tin nhắn bị miss trong lúc máy tính sleep hoặc rớt mạng.

## 3. Kiến trúc & Luồng dữ liệu Realtime (Architecture & Data Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Student as Sinh viên (User A)
    actor Supporter as Supporter (User B)
    participant UI_B as Supporter Web-1
    participant API as Hono Backend
    participant DB as PostgreSQL (case_chat_read_states)
    participant CF as Centrifugo Engine

    Note over Student, API: 1. Sinh viên gửi tin nhắn mới
    Student->>API: POST /api/cases/:id/messages
    API->>DB: INSERT into case_messages
    API->>CF: publishToChannel("chat:case-1", { type: "message", ... })
    
    Note over CF, UI_B: 2. Supporter nhận tin qua WebSocket Stream (0ms)
    CF-->>UI_B: Publication { type: "message", ... }
    alt Supporter đang ở tab khác (Overview/Docs)
        UI_B->>UI_B: Tăng unread_count badge (+1) trên Sidebar tức thì
    else Supporter đang mở tab Trao đổi (Discussion)
        UI_B->>API: POST /api/cases/:id/chat/read { last_read_message_id }
        API->>DB: Upsert last_read_at = message.created_at
        API->>CF: Broadcast "chat:read"
        UI_B->>UI_B: Giữ unread_count = 0
    end

    Note over UI_B, CF: 3. Phục hồi khi Reconnect (Item 4)
    UI_B->>CF: Centrifugo Reconnected ("connected" event)
    UI_B->>API: GET /api/cases/:id/chat/unread (Tự động đồng bộ lại badge)
```

## 4. Danh sách các Phase thực hiện

| Phase | Tên Phase | Trọng tâm | File chi tiết | Ước lượng | Trạng thái |
|---|---|---|---|---|---|
| **Phase 01** | Database & Shared Validation | Model Prisma `CaseChatReadState`, migration `--create-only`, Zod schemas trong `@repo/validation` | `phase-01-database-and-schema.md` | 1.0h | Completed |
| **Phase 02** | Backend API & Realtime Broadcast | Repository `getUnreadMessageCount`, `upsertCaseChatReadState` (timestamp anchor), UseCase `markChatRead`, Endpoint `POST /chat/read`, Centrifugo event `chat:read` | `phase-02-backend-api-and-realtime.md` | 1.0h | Completed |
| **Phase 03** | Frontend Hooks & UI Integration | Hook `useCaseUnreadCount` (Reconnection sync + Focus refetch), cập nhật `useRealtimeChat` stream, cập nhật `WorkspaceSidebar` badge | `phase-03-frontend-hooks-and-ui.md` | 1.0h | Completed |
| **Phase 04** | Tests & Verification | Scoped unit tests (`node:test`), kiểm tra reconnect recovery, DB safety check | `phase-04-tests-and-verification.md` | 0.5h | Completed |
