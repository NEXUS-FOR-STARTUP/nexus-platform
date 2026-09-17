# Phase 1: Backend Chat Access Guard

## Mục tiêu
Chặn gửi tin nhắn chat qua API đối với case thuộc gói 79k (`pkg_ai_audit`), đảm bảo bảo vệ tầng backend nhất quán với việc ẩn giao diện trên frontend.

## Chi tiết kỹ thuật

### 1. `apps/api/src/modules/cases/application/chat-access.ts`
- Cập nhật kiểu `ChatAccessCode`:
  ```ts
  export type ChatAccessCode =
    | "CHAT_FREE_TIER"
    | "CHAT_AI_TIER"
    | "CHAT_REJECTED"
    | "CHAT_CLOSED"
    | "CHAT_LOCKED"
    | "CHAT_OK";
  ```
- Thêm thuộc tính `packageId?: string | null` vào params của hàm `evaluateChatAccess`:
  ```ts
  export function evaluateChatAccess(params: {
    lockedPrice: number;
    stage: string | null;
    creditBalance: number;
    completedAt: Date | null;
    creditExhaustedAt: Date | null;
    packageId?: string | null;
  }): ChatAccessResult {
    const { lockedPrice, stage, creditBalance, completedAt, creditExhaustedAt, packageId } = params;

    if (packageId === "pkg_ai_audit") return { ok: false, code: "CHAT_AI_TIER" };
    if (lockedPrice === 0) return { ok: false, code: "CHAT_FREE_TIER" };
    // ... logic hiện tại
  }
  ```

### 2. `apps/api/src/modules/cases/application/send-message.usecase.ts`
- Truyền `packageId: caseItem.package_id` vào `evaluateChatAccess(...)`.
- Bổ sung thông điệp lỗi cho `CHAT_AI_TIER` trong `messageByCode`:
  ```ts
  const messageByCode: Record<string, string> = {
    CHAT_FREE_TIER: "Chat là đặc quyền cho dự án trả phí. Vui lòng liên hệ admin qua email hoặc điện thoại.",
    CHAT_AI_TIER: "Gói Basic AI Audit được xử lý tự động bằng AI, không bao gồm tính năng trao đổi với Supporter.",
    CHAT_REJECTED: "Dự án đang ở trạng thái từ chối. Vui lòng chỉnh sửa hồ sơ và nộp lại, hoặc liên hệ admin.",
    CHAT_CLOSED: "Hồ sơ đã đóng, không thể gửi tin nhắn. Vui lòng liên hệ admin qua email hoặc điện thoại.",
    CHAT_LOCKED: "Hết lượt kiểm tra và đã qua thời gian ân hạn. Vui lòng nạp thêm credit để tiếp tục chat.",
  };
  ```

### 3. Unit Test bổ sung
- Thêm kiểm thử trong `apps/api/src/shared/infrastructure/tests/phase-03-messaging.test.ts` kiểm tra `evaluateChatAccess` với `packageId: "pkg_ai_audit"` trả về `ok: false` và `code: "CHAT_AI_TIER"`.

## Tiêu chí hoàn thành (Acceptance Criteria)
- Case có `package_id === "pkg_ai_audit"` khi gọi `sendMessageUseCase` ném ra `AppError(409, "CHAT_AI_TIER", ...)`.
- Các case gói khác (hoặc legacy `pkg_tf_audit`) vẫn tuân theo quy tắc chat bình thường.
- `bun run test --workspace=apps/api` vượt qua các test suite liên quan.
