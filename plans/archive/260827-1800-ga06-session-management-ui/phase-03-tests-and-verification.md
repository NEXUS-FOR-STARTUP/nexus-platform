# Phase 03: Automated Tests & Verification

## Context Links
- **Plan Tổng quan**: [plan.md](./plan.md)
- **Phase 01 (Backend)**: [phase-01-backend-session-management-api.md](./phase-01-backend-session-management-api.md)
- **Phase 02 (Frontend)**: [phase-02-frontend-session-management-ui.md](./phase-02-frontend-session-management-ui.md)
- **Files liên quan**:
  - `apps/api/src/shared/infrastructure/tests/session-management.test.ts`
  - `packages/validation/src/index.ts`
  - `apps/web-1/lib/utils/ua-parser.ts`

---

## Overview
- **Mục tiêu**: Thiết lập bộ kiểm thử tự động (Unit Tests) toàn diện cho các UseCase backend (`listSessionsUseCase`, `revokeSessionUseCase`, `revokeOtherSessionsUseCase`) bằng `node:test` theo mô hình Dependency Injection (DI), kiểm thử tính năng phân tích User-Agent và IP formatter, kiểm tra bảo mật (IDOR, Self-Revoke guard, Non-UUID session ID support) và thực hiện Typecheck toàn bộ Monorepo.
- **Trạng thái**: Completed
- **Ước lượng**: 0.5h

---

## Key Insights & Test Coverage Plan
1. **Kiểm thử độc lập với DI (Dependency Injection)**:
   - Các UseCases nhận tham số dependencies tùy chọn (`deps?: { findSessions, deleteSession, deleteOtherSessions, logAudit }`), mặc định trỏ vào `prisma` và `auditLogger`.
   - Cho phép test mọi ca biên (Edge Cases), logic lọc hết hạn, nhận diện phiên hiện tại bất biến qua `session.id` mà không cần khởi chạy PostgreSQL thật.
2. **Kiểm thử User-Agent Parser & IP Formatter**:
   - Viết test suite chuyên biệt kiểm tra chuỗi User-Agent đa dạng: Edge, Opera, Chrome, Safari, Firefox, iPhone, iPad, Android, Windows 10/11, macOS, Linux, Bot, và chuỗi dị dạng / rỗng.
   - Kiểm tra `formatIpAddress` cho IPv4, IPv6, Localhost `::1`, `127.0.0.1`.
3. **Kiểm thử bảo mật (Security Boundaries)**:
   - Bắt buộc kiểm tra việc từ chối tự thu hồi phiên hiện tại (`CANNOT_REVOKE_CURRENT_SESSION`).
   - Bắt buộc kiểm tra việc không thể thu hồi phiên của user khác (IDOR protection).
   - Kiểm tra việc không bao giờ để lộ trường `token` trong kết quả của `listSessionsUseCase`.
   - Kiểm tra guard `INVALID_SESSION_CONTEXT` trong `revokeOtherSessionsUseCase` khi thiếu `currentSessionId`.

---

## Danh sách các Kịch bản Kiểm thử Tự động (Unit Test Scenarios)

### 1. `listSessionsUseCase`:
- [x] **TC01: Lọc phiên hợp lệ & Nhận diện phiên hiện tại bằng `session.id`**: Trả về danh sách session chưa hết hạn, gán đúng `isCurrent: true` cho session có `id === currentSessionId` (hỗ trợ session ID dạng alphanumeric nanoid của Better Auth).
- [x] **TC02: Không rò rỉ Token**: Đảm bảo toàn bộ đối tượng trong mảng trả về không chứa thuộc tính `token`.
- [x] **TC03: Lọc bỏ phiên hết hạn & Giới hạn tối đa 100 phiên**: Kiểm tra truy vấn có điều kiện `expires_at: { gt: now }` và `take: 100`.
- [x] **TC04: Xử lý danh sách rỗng**: Trả về mảng rỗng nếu user chưa có phiên nào khác.
- [x] **TC05: Validation Error khi thiếu `userId`**: Ném lỗi `AppError(400, "VALIDATION_ERROR")`.

### 2. `revokeSessionUseCase`:
- [x] **TC06: Chặn tự thu hồi phiên hiện tại**: Ném lỗi `AppError(400, "CANNOT_REVOKE_CURRENT_SESSION")` khi `targetSessionId === currentSessionId`.
- [x] **TC07: Thu hồi phiên hợp lệ thành công**: Xóa đúng session theo `id` và `user_id`, gọi `auditLogger.log` với action `delete`.
- [x] **TC08: Chặn IDOR / Session không tồn tại**: Ném lỗi `AppError(404, "SESSION_NOT_FOUND")` khi số dòng xóa được trả về là 0 (session thuộc user khác hoặc không tồn tại).

### 3. `revokeOtherSessionsUseCase`:
- [x] **TC09: Thu hồi tất cả phiên khác**: Thực hiện xóa mọi session có `user_id = currentUserId` và `id != currentSessionId`, giữ nguyên phiên hiện tại, gọi `auditLogger.log` ghi lại số lượng phiên đã xóa.
- [x] **TC10: Guard thiếu `currentSessionId`**: Ném lỗi `AppError(500, "INVALID_SESSION_CONTEXT")` khi `currentSessionId` rỗng hoặc null.
- [x] **TC11: Trường hợp chỉ có 1 phiên duy nhất (phiên hiện tại)**: Trả về `{ success: true, count: 0 }` mà không làm gián đoạn phiên hiện tại.

### 4. `parseUserAgent` & `formatIpAddress` (Frontend Utility Tests):
- [x] **TC12: Phân tích đúng Microsoft Edge (Edg/...)**: Trả về `browser: "Microsoft Edge"`, `os: "Windows 10/11"`, `deviceType: "desktop"`.
- [x] **TC13: Phân tích đúng Google Chrome trên macOS**: Trả về `browser: "Google Chrome"`, `os: "macOS"`, `deviceType: "desktop"`.
- [x] **TC14: Phân tích đúng Apple Safari trên iPhone / iPad**: Trả về `browser: "Apple Safari"`, `os: "iOS"` (mobile) / `iPadOS` (tablet).
- [x] **TC15: Fallback an toàn cho User-Agent rỗng / dị dạng**: Không ném exception, trả về `"Trình duyệt không xác định"`.
- [x] **TC16: Format Localhost & IPv6**: `::1` -> `"Localhost"`, `::ffff:192.168.1.1` -> `"192.168.1.1"`.

---

## Verification & Manual Checklist

### 1. Kiểm tra Backend API:
```bash
npm test apps/api/src/shared/infrastructure/tests/session-management.test.ts
```
Yêu cầu: Toàn bộ 16/16 test cases pass 100%.

### 2. Kiểm tra Typecheck toàn Monorepo:
```bash
npm run check-types
```
Yêu cầu: Không có bất kỳ lỗi TypeScript nào ở cả 3 workspaces (`apps/api`, `apps/web-1`, `packages/validation`).

### 3. Kiểm tra Giao diện Người dùng (Manual / Visual Flow):
1. Đăng nhập tài khoản sinh viên -> Truy cập `/dashboard/settings`.
2. Xác nhận xuất hiện tab **"Thiết bị & Phiên đăng nhập"** với icon `MonitorSmartphone`.
3. Nhấp vào tab -> Trang `/dashboard/settings/sessions` tải danh sách phiên.
4. Xác nhận thiết bị hiện tại có badge màu xanh **"Phiên hiện tại"** và không có nút Đăng xuất riêng.
5. Đăng nhập thêm trên một trình duyệt khác (hoặc tab ẩn danh).
6. F5 trang Settings -> Thấy xuất hiện phiên thứ 2 với nút **"Đăng xuất"**.
7. Bấm nút **"Đăng xuất"** của phiên thứ 2 -> Xác nhận phiên biến mất và toast xanh hiển thị.
8. Bấm nút **"Đăng xuất tất cả thiết bị khác"** -> Modal xác nhận bật lên.
9. Bấm **"Xác nhận đăng xuất"** -> Tất cả phiên khác bị thu hồi, phiên hiện tại vẫn duy trì đăng nhập bình thường.
10. Lặp lại bước 1-9 trên tài khoản Supporter (`/supporter/settings/sessions`) -> Hoạt động đồng bộ 100%.

---

## Todo List
- [x] Tạo file test `apps/api/src/shared/infrastructure/tests/session-management.test.ts`
- [x] Chạy `npm test` xác nhận tất cả test cases pass
- [x] Chạy `npm run check-types` trên toàn bộ monorepo
- [x] Thực hiện kiểm tra thủ công giao diện Settings trên Dashboard và Supporter
