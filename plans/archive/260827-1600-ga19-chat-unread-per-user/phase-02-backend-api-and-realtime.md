# Phase 02 — Backend API & Realtime Broadcast

- **Priority:** P2
- **Status:** completed
- **Effort:** 1.0h
- **Depends:** Phase 01
- **Blocks:** Phase 03, Phase 04

---

## 1. Mục tiêu (Objective)

Triển khai tầng Persistence gọn gàng (Item 1 — Focused Scope), Application UseCases, HTTP Controllers và phát event realtime qua Centrifugo cho tính năng đánh dấu đã đọc tin nhắn.

## 2. Chi tiết Triển khai (Implementation Details)

### 2.1. Persistence Layer (`apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts`)

Bổ sung các hàm thao tác dữ liệu:

1. **`upsertCaseChatReadState` (Anchor bằng Message Timestamp):**
   ```typescript
   export async function upsertCaseChatReadState(
     caseId: string,
     userId: string,
     lastReadMessageId?: string,
   ) {
     let readTimestamp = new Date();

     // Lấy chính xác created_at của tin nhắn được chỉ định để chống lệch mili-giây
     if (lastReadMessageId) {
       const message = await prisma.caseMessage.findUnique({
         where: { id: lastReadMessageId },
         select: { created_at: true },
       });
       if (message) {
         readTimestamp = message.created_at;
       }
     }

     return prisma.caseChatReadState.upsert({
       where: {
         case_id_user_id: {
           case_id: caseId,
           user_id: userId,
         },
       },
       update: {
         last_read_message_id: lastReadMessageId ?? undefined,
         last_read_at: readTimestamp,
       },
       create: {
         case_id: caseId,
         user_id: userId,
         last_read_message_id: lastReadMessageId ?? null,
         last_read_at: readTimestamp,
       },
     });
   }
   ```

2. **`getCaseChatReadState`:**
   ```typescript
   export async function getCaseChatReadState(caseId: string, userId: string) {
     return prisma.caseChatReadState.findUnique({
       where: {
         case_id_user_id: {
           case_id: caseId,
           user_id: userId,
         },
       },
     });
   }
   ```

3. **`getUnreadMessageCount` (Item 1 — Tối ưu hóa truy vấn cho Case Workspace):**
   ```typescript
   export async function getUnreadMessageCount(caseId: string, userId: string): Promise<number> {
     const readState = await prisma.caseChatReadState.findUnique({
       where: {
         case_id_user_id: {
           case_id: caseId,
           user_id: userId,
         },
       },
     });

     const lastReadAt = readState?.last_read_at ?? new Date(0);

     // Đếm các tin nhắn trong case tạo sau last_read_at và không phải do chính user gửi
     return prisma.caseMessage.count({
       where: {
         case_id: caseId,
         sender_auth_user_id: { not: userId },
         created_at: { gt: lastReadAt },
       },
     });
   }
   ```

### 2.2. Application Layer (UseCases)

1. **`mark-chat-read.usecase.ts` (`apps/api/src/modules/cases/application/`):**
   - Kiểm tra quyền truy cập case qua `requireCaseAccess`.
   - Gọi `upsertCaseChatReadState`.
   - Bắn event `chat:read` tới Centrifugo channel `chat:${caseId}`.
   - Trả về: `{ success: true, unread_count: 0, last_read_at: readState.last_read_at }`.

2. **`get-chat-unread-count.usecase.ts`:**
   - Lấy `unread_count` cho `(caseId, userId)`.

### 2.3. Realtime Types & Centrifugo (`apps/api/src/modules/realtime/`)

1. Cập nhật `realtime.types.ts`:
   ```typescript
   export interface ChatReadEventPayload {
     type: "chat:read";
     case_id: string;
     user_id: string;
     last_read_message_id?: string | null;
     last_read_at: string;
   }
   ```
2. Bắn event trong UseCase:
   ```typescript
   void publishToChannel(chatChannel(caseId), {
     type: "chat:read",
     case_id: caseId,
     user_id: userId,
     last_read_message_id: lastReadMessageId ?? null,
     last_read_at: readState.last_read_at.toISOString(),
   }).catch((e) => {
     logger.error({ caseId, userId, err: e }, "Failed to publish chat:read event");
   });
   ```

### 2.4. HTTP Layer (`apps/api/src/modules/cases/http/`)

- `casesApp.post("/:id/chat/read", markChatReadHandler);`
- `casesApp.get("/:id/chat/unread", getChatUnreadCountHandler);`

## 3. Tiêu chí hoàn thành (Acceptance Criteria)

- [x] 1. Endpoint `POST /api/cases/:id/chat/read` nhận request, cập nhật DB và phát event Centrifugo thành công.
- [x] 2. Endpoint `GET /api/cases/:id/chat/unread` trả về đúng số tin chưa đọc sau khi có tin nhắn mới từ người khác.
- [x] 3. Không tính các tin do chính user đó gửi vào `unread_count`.
- [x] 4. RBAC: User ngoài case không thể đọc hoặc đánh dấu tin nhắn của case khác (trả 403 Forbidden).
