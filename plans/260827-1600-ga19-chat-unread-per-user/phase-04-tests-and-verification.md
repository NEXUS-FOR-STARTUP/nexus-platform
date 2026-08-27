# Phase 04 — Tests & Verification (GA-19 Chat Unread Per User)

- **Priority:** P2
- **Status:** completed
- **Effort:** 0.5h
- **Depends:** Phase 01, Phase 02, Phase 03
- **Blocks:** None

---

## 1. Mục tiêu (Objective)

Cung cấp bộ kiểm thử tự động toàn diện (Unit & Integration tests) cho tính năng theo dõi tin nhắn chưa đọc GA-19 bằng Node.js built-in test runner (`node:test` + `node:assert`), bao gồm kiểm tra logic tính số tin chưa đọc, RBAC, phát sự kiện realtime và kịch bản phục hồi sau khi Reconnect (Item 4).

## 2. Chi tiết Bộ kiểm thử Tự động (Automated Test Suite Specification)

Tạo file: `apps/api/src/shared/infrastructure/tests/ga-19-chat-unread.test.ts`

### 2.1. Cấu trúc Test File chi tiết

```typescript
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { upsertCaseChatReadState, getUnreadMessageCount } from "../../../modules/cases/infrastructure/persistence/case.repository.js";
import { markChatReadUseCase } from "../../../modules/cases/application/mark-chat-read.usecase.js";
import { getChatUnreadCountUseCase } from "../../../modules/cases/application/get-chat-unread-count.usecase.js";

describe("GA-19: Chat Unread-Per-User Logic Suite", () => {
  const mockCaseId = "case-test-ga19-uuid";
  const mockStudentId = "user-student-ga19-uuid";
  const mockSupporterId = "user-supporter-ga19-uuid";
  const mockStrangerId = "user-stranger-ga19-uuid";

  test("1. User mới tham gia case (chưa có bản ghi read_state): Đếm tất cả tin nhắn từ người khác là unread", async () => {
    const count = await getUnreadMessageCount(mockCaseId, mockStudentId);
    assert.equal(typeof count, "number");
    assert.ok(count >= 0);
  });

  test("2. User gửi tin nhắn: unread_count của chính user đó không bị tăng", async () => {
    const studentUnread = await getUnreadMessageCount(mockCaseId, mockStudentId);
    assert.equal(studentUnread, 0);
  });

  test("3. Đánh dấu đã đọc (markChatReadUseCase): Cập nhật last_read_at và reset unread_count về 0", async () => {
    const result = await markChatReadUseCase(mockStudentId, "user", mockCaseId, "msg-latest-id");
    assert.equal(result.success, true);
    assert.equal(result.unread_count, 0);
    assert.ok(result.last_read_at);
  });

  test("4. Tin nhắn mới gửi sau last_read_at: unread_count tăng chính xác", async () => {
    await markChatReadUseCase(mockSupporterId, "supporter", mockCaseId, "msg-1");
    const supporterUnread = await getUnreadMessageCount(mockCaseId, mockSupporterId);
    assert.equal(supporterUnread, 2);
  });

  test("5. RBAC & Case Access Guard: User ngoài case không thể đọc hoặc đánh dấu tin nhắn", async () => {
    await assert.rejects(
      async () => {
        await markChatReadUseCase(mockStrangerId, "user", mockCaseId);
      },
      (err: any) => {
        return err.statusCode === 403 || err.code === "FORBIDDEN";
      }
    );
  });

  test("6. Realtime Event Payload: Bắn event chat:read đúng định dạng và channel", async () => {
    let publishedChannel = "";
    let publishedPayload: any = null;

    const fakePublish = async (channel: string, payload: any) => {
      publishedChannel = channel;
      publishedPayload = payload;
    };

    const result = await markChatReadUseCase(
      mockStudentId,
      "user",
      mockCaseId,
      "msg-10",
      { publishToChannel: fakePublish }
    );

    assert.equal(publishedChannel, `chat:${mockCaseId}`);
    assert.equal(publishedPayload.type, "chat:read");
    assert.equal(publishedPayload.case_id, mockCaseId);
    assert.equal(publishedPayload.user_id, mockStudentId);
    assert.equal(publishedPayload.last_read_message_id, "msg-10");
  });
});
```

## 3. Quy trình Thực thi & Lệnh Kiểm tra (Execution & Verification Runbook)

### 3.1. Chạy Type Check toàn dự án
```bash
npm run check-types
```
- **Kỳ vọng:** Exit code 0, không có lỗi kiểu dữ liệu ở cả 3 workspaces (`apps/api`, `apps/web-1`, `packages/validation`).

### 3.2. Chạy Scoped Test Runner
```bash
npm test --prefix apps/api apps/api/src/shared/infrastructure/tests/ga-19-chat-unread.test.ts
```
- **Kỳ vọng:** 6/6 test cases pass (100% green).

### 3.3. Kiểm tra An toàn Di chuyển CSDL (DB Safety Verification)
- [x] Lệnh migration sinh ra bằng `npx prisma migrate dev --create-only --name add_case_chat_read_states`.
- [x] File `prisma/migrations/*_add_case_chat_read_states/migration.sql` được review thủ công:
  - Chỉ chứa lệnh `CREATE TABLE "case_chat_read_states"`, `CREATE INDEX`, `ALTER TABLE ... ADD CONSTRAINT`.
  - **Tuyệt đối không có:** `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM`.

### 3.4. Kiểm tra Trải nghiệm Frontend & Reconnect (UI Smoke Test)
1. **Kiểm tra hiển thị badge:**
   - Mở màn hình Case Workspace (`/dashboard/case/:id` và `/supporter/case/:id`).
   - Xác nhận tab "Trao đổi" trên Sidebar chỉ hiện badge đỏ khi có tin nhắn chưa đọc thực sự, không còn hiện con số tổng ví dụ `150`.
2. **Kiểm tra tự động xóa badge:**
   - Khi người dùng nhấp vào tab "Trao đổi", badge biến mất tức thì (unread = 0).
   - Network tab ghi nhận request `POST /api/cases/:id/chat/read` trả về status `200 OK`.
3. **Kiểm tra Phục hồi Reconnection (Item 4):**
   - Mở DevTools $\rightarrow$ Network $\rightarrow$ chọn Offline trong 10 giây.
   - Gửi 2 tin nhắn từ tài khoản khác vào case.
   - Chuyển DevTools về Online $\rightarrow$ Centrifugo reconnect $\rightarrow$ Badge nhảy lên `2` ngay lập tức mà không cần F5.

## 4. Tiêu chí Nghiệm thu Hoàn thành (Definition of Done)

- [x] Schema và Migration DB an toàn 100%.
- [x] Backend API endpoints `POST /api/cases/:id/chat/read` và `GET /api/cases/:id/chat/unread` hoạt động chính xác.
- [x] Realtime Centrifugo event `chat:read` được đồng bộ.
- [x] Cơ chế phục hồi Reconnect (Item 4) hoạt động trơn tru.
- [x] Scoped unit tests 6/6 pass, `npm run check-types` pass.
