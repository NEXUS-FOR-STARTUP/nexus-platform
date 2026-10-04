# GA-07: Chính sách Session Timeout (Absolute / Idle Timeout Policy)

- **ID:** GA-07
- **Priority:** P1
- **Category:** Security
- **Status:** Done
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Báo cáo hoàn thành:** `docs/journals/journal-2026-08-24-ga01-ga07-auth.md`
- **Tiêu chuẩn:** OWASP Session Management Guidelines

---

## 1. Mô tả vấn đề
Cấu hình ban đầu của Better Auth chỉ map các trường cơ bản vào Prisma adapter mà không định nghĩa thời gian hết hạn (`expiresIn`) hoặc thời gian làm mới khi có hoạt động (`updateAge`). Phiên đăng nhập có nguy cơ tồn tại vô hạn hoặc không tự làm mới hợp lý, làm tăng rủi ro khi thiết bị người dùng bị chiếm đoạt.

## 2. Giải pháp thực hiện
- Cấu hình tường minh chính sách vòng đời phiên trong `apps/api/src/auth.ts:99-112`:
  - `expiresIn: 60 * 60 * 24 * 7` (Thời hạn phiên tuyệt đối 7 ngày).
  - `updateAge: 60 * 60 * 24` (Làm mới token sau 1 ngày nếu người dùng có hoạt động - rolling session).
- Better Auth tự động kiểm tra tính hợp lệ của `expires_at` trên mỗi request xác thực và xóa cookie nếu phiên hết hạn.

## 3. Bằng chứng mã nguồn (Evidence)
- Backend: `apps/api/src/auth.ts:99-103`.
- Báo cáo: `docs/journals/journal-2026-08-24-ga01-ga07-auth.md`.
