# Phase 1: Backend Soft-Delete API & Session Revocation

## Context Links
- Plan: [plan.md](./plan.md)
- Safety Rule: [.agents/rules/prisma-migration-safety.md](../../.agents/rules/prisma-migration-safety.md)
- Auth Middleware: `apps/api/src/shared/infrastructure/middlewares/auth.ts`
- Profile Routes: `apps/api/src/modules/profile/http/profile.routes.ts`
- Ban User Usecase (reference): `apps/api/src/modules/admin/application/ban-user.usecase.ts`
- Audit Logger: `apps/api/src/shared/infrastructure/audit-logger.ts`

## Overview
- **Priority:** P2
- **Status:** Completed
- **Description:** Xây dựng usecase và API endpoint `DELETE /api/profile/account` cho phép người dùng tự xóa tài khoản của mình. Xử lý an toàn: Soft-delete người dùng, ẩn danh hóa thông tin PII, giải phóng email để có thể tái đăng ký nếu cần, thu hồi toàn bộ sessions và tokens để đăng xuất ngay lập tức trên mọi thiết bị.

## Key Insights
1. **Zero Data Loss & Foreign Key Safety:**
   - Bảng `users` có quan hệ foreign key (không cascade) với `Case`, `Deposit`, `Order`, `UserWallet`, `Notification`, `DocumentRecord`, `Report`.
   - Nếu thực hiện hard delete (`prisma.user.delete`), DB Postgres sẽ ném lỗi `P2003` (Foreign key constraint failed).
   - Soft-delete bảo toàn tính toàn vẹn dữ liệu kế toán, tài chính và lịch sử xử lý hồ sơ.
2. **Better Auth Session Check:**
   - Better Auth kiểm tra `user.banned`. Khi `banned: true`, plugin Admin chặn đăng nhập mới và chặn cấp session (`code: "BANNED_USER"`).
   - Xóa các bản ghi trong bảng `sessions` đảm bảo session token hiện tại của user bị vô hiệu hóa ngay lập tức.
3. **Email Scrambling & Anonymization:**
   - Để tránh vi phạm `@@unique([email])` khi người dùng muốn tạo tài khoản mới trong tương lai bằng email cũ, email hiện tại sẽ được scramble thành `deleted_${Date.now()}_${user.email}`.
   - Xóa `name` thành `"Người dùng đã xóa"`, đặt `image` thành `null`.
   - Xóa thông tin đăng nhập trong bảng `accounts` và `two_factors` để không thể đăng nhập bằng OAuth hoặc mật khẩu cũ.

## Requirements
### Functional Requirements
- Endpoint `DELETE /api/profile/account` (hoặc `POST /api/profile/delete-account`) yêu cầu authentication hợp lệ (`requireAuth`).
- Thực hiện trong Prisma Transaction:
  1. Đổi `banned = true`, `ban_reason = "USER_DELETED_ACCOUNT"`.
  2. Scramble email `deleted_${Date.now()}_${email}` để giải phóng email gốc.
  3. Cập nhật `name = "Người dùng đã xóa"`, `image = null`.
  4. Xóa tất cả `Session` của user (`user_id = userId`).
  5. Xóa các bản ghi `Account` (credential / oauth) và `TwoFactor` của user.
- Ghi log kiểm toán `auditLogger.log` với `operation = "USER_DELETE_ACCOUNT"`.
- Trả về response JSON: `{ success: true, message: "Tài khoản đã được xóa thành công." }`.

### Non-Functional Requirements
- Thời gian phản hồi < 200ms.
- An toàn tuyệt đối không làm mất dữ liệu lịch sử (`orders`, `deposits`, `cases`, `wallet`).
- Tuân thủ Clean Architecture của module `profile` (`application/`, `http/`).

## Architecture & Data Flow

```
[Client (Web-1 Settings)]
       │
       ▼ (DELETE /api/profile/account + Cookie Auth)
[Auth Middleware: requireAuth] ──── (Verify session, extract user)
       │
       ▼
[deleteAccountHandler (profile.controller.ts)]
       │
       ▼
[deleteAccountUseCase (delete-account.usecase.ts)]
       │
       ├─► [Prisma Transaction]
       │     ├─ Scramble email: deleted_<timestamp>_<email>
       │     ├─ Set banned: true, ban_reason: "USER_DELETED_ACCOUNT"
       │     ├─ Clear name & image
       │     ├─ Delete all sessions: Session.deleteMany({ user_id })
       │     ├─ Delete credentials: Account.deleteMany({ user_id })
       │     └─ Delete 2FA: TwoFactor.deleteMany({ user_id })
       │
       ├─► [auditLogger.log] (Audit log operation)
       │
       ▼
[HTTP 200 Response: { success: true }]
```

## Related Code Files
- **Files to create:**
  - `apps/api/src/modules/profile/application/delete-account.usecase.ts`
  - `apps/api/src/modules/profile/http/profile.controller.ts`
- **Files to modify:**
  - `apps/api/src/modules/profile/http/profile.routes.ts`

## Implementation Steps
1. **Tạo usecase `deleteAccountUseCase`:**
   - File: `apps/api/src/modules/profile/application/delete-account.usecase.ts`.
   - Tìm user theo `userId`. Nếu không thấy, ném `AppError(404, "NOT_FOUND", "Không tìm thấy người dùng")`.
   - Thực thi `$transaction`:
     - Cập nhật `prisma.user.update`: `banned = true`, `ban_reason = "USER_DELETED_ACCOUNT"`, `email = deleted_${Date.now()}_${user.email.toLowerCase()}`, `name = "Người dùng đã xóa"`, `image = null`, `updated_at = new Date()`.
     - Xóa `prisma.session.deleteMany({ where: { user_id: userId } })`.
     - Xóa `prisma.account.deleteMany({ where: { user_id: userId } })`.
     - Xóa `prisma.twoFactor.deleteMany({ where: { user_id: userId } })`.
   - Ghi audit log qua `auditLogger.log`.
   - Trả về `{ success: true }`.

2. **Tạo controller `deleteAccountHandler`:**
   - File: `apps/api/src/modules/profile/http/profile.controller.ts`.
   - Lấy `user` từ `c.get("user")`.
   - Gọi `deleteAccountUseCase(user.id)`.
   - Trả về `c.json({ success: true, message: "Tài khoản đã được xóa thành công." }, 200)`.
   - Xử lý lỗi qua `handleError(c, error)`.

3. **Cập nhật router `profileRouter`:**
   - File: `apps/api/src/modules/profile/http/profile.routes.ts`.
   - Đăng ký route `DELETE /account`:
     ```ts
     profileRouter.delete("/account", requireAuth, deleteAccountHandler);
     ```

## Todo List
- [ ] Tạo `apps/api/src/modules/profile/application/delete-account.usecase.ts`
- [ ] Tạo `apps/api/src/modules/profile/http/profile.controller.ts`
- [ ] Đăng ký route `DELETE /account` trong `apps/api/src/modules/profile/http/profile.routes.ts`
- [ ] Kiểm tra type check bằng `npm run check-types`

## Success Criteria
- Request `DELETE /api/profile/account` khi có auth cookie hợp lệ trả về status 200 `{ success: true }`.
- User được đánh dấu `banned: true`, email được scramble.
- Toàn bộ session của user bị xóa, không thể gọi các API yêu cầu auth bằng token cũ.
- Dữ liệu `Case`, `Deposit`, `Order`, `UserWallet` của user vẫn được lưu trữ nguyên vẹn.

## Risk Assessment & Mitigation
- **Risk:** User vô tình xóa nhầm hoặc bị bên thứ ba gọi API trái phép.
- **Mitigation:** Yêu cầu auth cookie hợp lệ; phía Frontend có modal xác nhận bắt buộc gõ chữ "XOA".
- **Risk:** Lỗi foreign key khi thực thi xóa.
- **Mitigation:** Áp dụng Soft-delete, không gọi `prisma.user.delete()`.

## Security Considerations
- Chỉ user đã đăng nhập mới có thể yêu cầu xóa tài khoản của chính họ (`user.id` lấy từ session context đã xác thực).
- Sessions và tokens bị thu hồi ngay lập tức để ngăn chặn session hijacking tiếp tục hoạt động.

## Next Steps
- Tiếp tục sang Phase 2 để thiết kế giao diện Danger Zone và Modal xác nhận trên Web UI.
