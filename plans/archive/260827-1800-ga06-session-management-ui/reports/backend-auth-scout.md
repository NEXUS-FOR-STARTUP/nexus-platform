# Báo cáo Khảo sát Kỹ thuật: GA-06 Session Management Backend & Better Auth

## 1. Tổng quan cấu hình Better Auth
- Server config: `apps/api/src/auth.ts`
- Bảng cơ sở dữ liệu `sessions` (Prisma):
  - `id`: String (UUID, PK)
  - `expires_at`: DateTime (Mapped to `expiresAt`)
  - `token`: String (Unique index)
  - `created_at`: DateTime (Mapped to `createdAt`)
  - `updated_at`: DateTime (Mapped to `updatedAt`)
  - `ip_address`: String? (Mapped to `ipAddress`)
  - `user_agent`: String? (Mapped to `userAgent`)
  - `impersonated_by`: String? (Mapped to `impersonatedBy`)
  - `user_id`: String (FK -> `users.id`, CASCADE)
- Chính sách session timeout (GA-07):
  - `session.expiresIn = 60 * 60 * 24 * 7` (7 ngày)
  - `session.updateAge = 60 * 60 * 24` (1 ngày rolling)
  - `revokeSessionsOnPasswordReset: true`

## 2. Điểm yếu của Better Auth `listSessions`
- Better Auth core có `listSessions` nhưng **không tự động lọc** các phiên đã hết hạn (`expires_at <= now()`).
- Session token là chuỗi nhạy cảm (httpOnly cookie). Trả về token cho client là vi phạm nguyên tắc bảo mật.
- Giải pháp: Xây dựng endpoint chuẩn tầng Profile Module (`GET /api/profile/sessions`) để:
  1. Lọc `expires_at > new Date()`.
  2. So sánh token của session đang gửi request với danh sách session trong DB để trả về `is_current: boolean`.
  3. Trả về `id`, `ip_address`, `user_agent`, `created_at`, `expires_at`, `is_current` (tuyệt đối không để lộ `token`).

## 3. Kiến trúc Backend Endpoint Đề xuất
- Router: `apps/api/src/modules/profile/http/profile.routes.ts`
- Endpoints:
  1. `GET /api/profile/sessions`: Danh sách các phiên đăng nhập đang hoạt động của user hiện tại kèm `is_current`.
  2. `DELETE /api/profile/sessions/:id`: Thu hồi 1 phiên đăng nhập cụ thể (chặn không cho thu hồi phiên hiện tại qua endpoint này để tránh lỗi trạng thái không đồng bộ).
  3. `POST /api/profile/sessions/revoke-others`: Thu hồi tất cả các phiên khác ngoại trừ phiên hiện tại (thực hiện qua `prisma.$transaction`).
