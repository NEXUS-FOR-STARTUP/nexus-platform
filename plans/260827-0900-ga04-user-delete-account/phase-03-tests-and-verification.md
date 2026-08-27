# Phase 3: Automated Unit Tests & Verification

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 1: [phase-01-backend-soft-delete-api.md](./phase-01-backend-soft-delete-api.md)
- Phase 2: [phase-02-frontend-danger-zone-modal.md](./phase-02-frontend-danger-zone-modal.md)
- Test Harness: `apps/api/src/shared/infrastructure/tests/`

## Overview
- **Priority:** P2
- **Status:** Completed
- **Description:** Xây dựng bài kiểm thử đơn vị tự động (Unit Test) cho usecase `deleteAccountUseCase` bằng test runner tích hợp sẵn của Node.js (`node:test` + `node:assert/strict`) trong `apps/api`. Kiểm tra các trường hợp: xóa thành công, người dùng không tồn tại, thu hồi session, scramble email, và bảo toàn tính toàn vẹn dữ liệu. Chạy kiểm tra type check (`check-types`) và lint toàn dự án.

## Key Insights
1. **Testing Conventions:**
   - Sử dụng `node:test` và `node:assert/strict` (không cài thêm thư viện test bên ngoài).
   - Mock Prisma client dependencies để test usecase nhanh, cô lập và độc lập với database mạng.
2. **Key Test Scenarios:**
   - **Scenario 1: Soft delete thành công**
     - Đổi `banned` = true, `ban_reason` = "USER_DELETED_ACCOUNT".
     - Scramble email với tiền tố `deleted_`.
     - Xóa các bản ghi `Session`, `Account`, `TwoFactor`.
     - Ghi audit log.
   - **Scenario 2: Người dùng không tồn tại (User not found)**
     - Ném lỗi `AppError` 404 `NOT_FOUND`.
   - **Scenario 3: Bảo toàn dữ liệu liên quan**
     - Không xóa các bản ghi `Case`, `Order`, `Deposit`, `UserWallet`.

## Related Code Files
- **Files to create:**
  - `apps/api/src/shared/infrastructure/tests/delete-account.test.ts`
- **Files to verify:**
  - `apps/api/src/modules/profile/application/delete-account.usecase.ts`
  - `apps/api/src/modules/profile/http/profile.routes.ts`
  - `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx`

## Implementation Steps
1. **Viết test file `delete-account.test.ts`:**
   - File: `apps/api/src/shared/infrastructure/tests/delete-account.test.ts`.
   - Cấu trúc test:
     ```typescript
     import { describe, it, beforeEach } from "node:test";
     import assert from "node:assert/strict";
     import { deleteAccountUseCase } from "../../../modules/profile/application/delete-account.usecase.js";
     import { AppError } from "../../domain/app-error.js";

     describe("GA-04: User Account Deletion (deleteAccountUseCase)", () => {
       it("should successfully soft delete user, scramble email, and revoke sessions", async () => {
         // Mock Prisma findUnique & $transaction
         // Assert banned is true, ban_reason is set, sessions deleted
       });

       it("should throw 404 NOT_FOUND if user does not exist", async () => {
         // Mock user null
         // Assert throws AppError 404
       });
     });
     ```

2. **Chạy kiểm thử:**
   ```bash
   npm test
   npm run check-types
   ```

3. **Thực hiện Smoke Test & Kiểm tra thủ công:**
   - Đăng nhập tài khoản test (học viên hoặc supporter).
   - Truy cập trang Cài đặt -> Thông tin cơ bản (`/dashboard/settings/profile`).
   - Kéo xuống cuối trang, kiểm tra phần "Vùng nguy hiểm".
   - Nhấn "Xóa tài khoản", kiểm tra Modal hiện ra.
   - Thử nhập text sai (vd: "abc"), kiểm tra nút xóa bị disabled.
   - Nhập đúng "XOA", nhấn "Xác nhận xóa tài khoản".
   - Kiểm tra Toast thông báo hiển thị, ứng dụng đăng xuất và chuyển hướng về `/auth`.
   - Thử đăng nhập lại bằng tài khoản vừa xóa -> kiểm tra bị chặn đăng nhập (banned).

## Todo List
- [x] Tạo file `apps/api/src/shared/infrastructure/tests/delete-account.test.ts`
- [x] Chạy `npm test` trong `apps/api` và đảm bảo toàn bộ tests passed (7/7 passed)
- [x] Chạy `npm run check-types` trên toàn bộ workspace (3/3 packages passed)
- [x] Thực hiện kiểm tra linter và build cho Web UI

## Success Criteria
- Test suite `delete-account.test.ts` chạy thành công 100%.
- Không có lỗi TypeScript (`check-types` exit code 0).
- Không có lỗi ESLint (`npm run lint` zero warnings).
- Luồng xóa tài khoản trên UI hoạt động mượt mà, đúng yêu cầu đặt tại cuối tab thông tin tài khoản.
