# Phase 5: Verification & Tests

## Mục tiêu
Đảm bảo toàn bộ thay đổi không gây lỗi biên dịch, regression test hay vi phạm kiểu dữ liệu TypeScript trên toàn bộ monorepo.

## Các bước kiểm thử

### 1. Kiểm tra Typecheck Monorepo
Chạy lệnh kiểm tra kiểu trên toàn bộ monorepo:
```bash
bun run check-types
```
Yêu cầu: Zero TypeScript errors trên tất cả các workspace (`apps/api`, `apps/web-1`, `packages/*`).

### 2. Kiểm thử Unit Test Backend
Chạy test suite cho API:
```bash
bun run test --workspace=apps/api
```
Kiểm tra cụ thể các test về messaging và chat access:
- Test case `evaluateChatAccess` với `packageId: "pkg_ai_audit"` trả về `CHAT_AI_TIER` (ok: false).
- Test case gửi tin nhắn bị từ chối với status 409 khi case là AI Audit.

### 3. Kiểm thử Linting & Formatting
Chạy linter:
```bash
bun run lint
```
Yêu cầu: Không vi phạm quy tắc ESLint mới.

### 4. Kiểm thử Thủ công trên Giao diện (Manual UI Smoke Test)
1. **Case 79k ẩn Chat:**
   - Truy cập một case có `package_id: "pkg_ai_audit"`.
   - Kiểm tra thanh điều hướng bên trái: Tab "Chat với Supporter" không còn hiển thị.
   - Thử set URL hoặc state tab thành `discussion`: Giao diện tự fallback về `overview`.
2. **Intake bước 6 không còn Deadline:**
   - Truy cập `/dashboard/intake?packageId=pkg_ai_audit`.
   - Điền form đến bước 6. Xác nhận.
   - Kiểm tra mục "4. Hạn chót & gói dịch vụ": Không còn dòng "Hạn nộp bài mong muốn".
3. **Modal chọn gói chặn 149k:**
   - Tại Dashboard, mở modal chọn gói.
   - Bấm vào "Chọn Premium": Xuất hiện thông báo Mantine notification "Tính năng đang được phát triển".
   - Không bị chuyển trang hay đóng modal bất ngờ.

## Tiêu chí hoàn thành (Acceptance Criteria)
- Toàn bộ lệnh build/check-types/test vượt qua.
- Các hành vi trên giao diện khớp chính xác với yêu cầu của người dùng.
