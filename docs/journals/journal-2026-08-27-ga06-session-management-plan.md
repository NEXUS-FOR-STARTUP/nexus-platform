# Nhật ký Kỹ thuật: Lập Kế hoạch GA-06 (Session Management UI) - HARD Mode

- **Ngày thực hiện:** 2026-08-27
- **Mã tính năng:** GA-06
- **Mục tiêu:** Thiết lập kế hoạch chi tiết, khảo sát toàn diện hệ thống và rà soát Red Team cho tính năng Quản lý phiên đăng nhập & Thiết bị.
- **Thư mục Plan:** `plans/260827-1800-ga06-session-management-ui/`

---

## 1. Tóm tắt Khảo sát & Nhận thức Kiến trúc
1. **Prisma & Database Schema:** Bảng `sessions` đã có sẵn đầy đủ các trường `id`, `user_id`, `token`, `expires_at`, `ip_address`, `user_agent`, `created_at`. Không cần chạy migration database.
2. **Khóa chính Session:** Better Auth sử dụng chuỗi ID dạng base62/nanoid (không phải UUID v4). Zod schemas được chuẩn hóa sang `z.string().min(1)`.
3. **Cơ chế Server-side Current Session Identification:** So khớp `session.id` thay vì so sánh token thô giúp tránh lỗi desynchronization khi Better Auth kích hoạt rolling session refresh (`updateAge: 24h`).
4. **Lọc phiên hết hạn:** Endpoint tầng Profile Module (`/api/profile/sessions`) tự động lọc `expires_at > now()` để không rò rỉ metadata các phiên cũ.
5. **Frontend Navigation & Layout:** Tab mới `/sessions` được tích hợp vào `settings-nav.ts` (icon `MonitorSmartphone`), dùng chung cho cả `/dashboard/settings` và `/supporter/settings`.

---

## 2. Kết quả Red Team Review & Khắc phục Rủi ro
- **Zod Schema UUID Crash:** Đã sửa sang `z.string().min(1)`.
- **Prisma CamelCase vs Snake_Case:** Đã điều chỉnh toàn bộ usecase sang `user_id`, `expires_at`, `created_at`, `ip_address`, `user_agent`.
- **Axios BaseURL Pathing:** Đã chuyển các lời gọi API trong hooks sang relative path `/profile/sessions` để tránh lỗi double `/api/api/...`.
- **Cache Invalidation:** Chuyển `invalidateQueries` vào `onSettled` của TanStack Mutation để luôn làm mới giao diện ngay cả khi gặp lỗi 404.
- **Scoped Loading:** Trạng thái loading của từng phiên được giới hạn theo `sessionId`.
- **Defensive Regex:** Phân tích User-Agent theo thứ tự Edge/Opera/CocCoc trước Chrome.

---

## 3. Các Phase Triển khai Kế tiếp
1. **Phase 01:** Backend Session Management API & Validation (`phase-01-backend-session-management-api.md`).
2. **Phase 02:** Frontend Session Management UI & Navigation (`phase-02-frontend-session-management-ui.md`).
3. **Phase 03:** Automated Tests & Verification (`phase-03-tests-and-verification.md`).
