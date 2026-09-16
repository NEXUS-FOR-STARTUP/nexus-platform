# Phase 5: Kiểm thử Tích hợp, Không Hồi quy & Nghiệm thu E2E

**Tập tin mục tiêu:** `apps/api/src/shared/infrastructure/tests/admin-workers.test.ts`

---

## 1. Viết Test Suite Backend (`admin-workers.test.ts`)

Sử dụng test runner tích hợp của Node (`node:test` + `node:assert`):

### 1.1. Test Cases Cần Đạt Được:
1. **Bảo mật phân quyền (Auth Guard)**:
   - Request không có cookie/session ➔ Trả về `401 Unauthorized`.
   - Request có session với `role: "user"` hoặc `role: "supporter"` ➔ Trả về `403 Forbidden`.
   - Request có session với `role: "admin"` ➔ Được phép truy cập.
2. **Thống kê Hàng đợi (Stats Endpoint)**:
   - `GET /api/admin/workers/stats` trả về status 200, đầy đủ các trường `concurrencyLimit`, `activeCount`, `waitingCount`, `completed24hCount`, `stuckCount`.
3. **Danh sách Jobs & Tìm kiếm (List & Search)**:
   - `GET /api/admin/workers/jobs?page=1&limit=10` trả về danh sách có cấu trúc đúng DTO.
   - Tìm kiếm theo `search=NX-` trả về đúng các hồ sơ khớp mã case.
4. **Kiểm tra Retry Không Trừ Tiền (Admin Retry Credit Safety)**:
   - Kiểm tra số dư credit của một case trước khi retry.
   - Admin gọi `POST /api/admin/workers/jobs/:id/retry` với `{ model: "google/gemini-2.5-flash" }`.
   - Kiểm tra số dư credit sau khi retry: Số dư credit **giữ nguyên không đổi**.
   - Kiểm tra `ai_jobs.input_json` được ghi nhận `admin_triggered: true`.
5. **Kiểm tra Giải phóng Kẹt (Heal Stuck Job)**:
   - Gọi `POST /api/admin/workers/jobs/:id/heal-stuck`.
   - Kiểm tra trạng thái job chuyển sang `failed`.
   - Kiểm tra credit được hoàn lại (nếu chưa có report).
   - Kiểm tra case stage được khôi phục về trạng thái an toàn (`report_ready` hoặc `intake_ready`).

---

## 2. Kiểm tra Hệ thống & Toàn bộ Monorepo

```bash
# 1. Sinh Prisma client
bun run prisma:generate

# 2. Chạy test suite của API
bun run --filter nexus-platform-api test

# 3. Chạy TypeScript typecheck toàn bộ monorepo
bun run check-types

# 4. Kiểm tra linting
bun run lint
```

---

## 3. Nghiệm thu Thực tế trên Trình duyệt (Browser QA)

1. Mở `http://localhost:3001/admin?tab=workers` bằng tài khoản Admin:
   - Kiểm tra layout navbar 2 tầng, icon Bot hiển thị đúng.
   - Thẻ KPI hiển thị số liệu thực tế từ Redis và Postgres.
   - Danh sách các job hiển thị đầy đủ, badge màu sắc rõ nét.
2. Bấm vào một dòng job:
   - Drawer trượt ra, 4 tab hoạt động mượt mà.
   - Tab terminal hiển thị live logs đúng định dạng mono trên nền đen.
3. Thử nghiệm nút "Chạy lại":
   - Modal mở ra, chọn model Claude 3.5 Sonnet.
   - Bấm Chạy lại: Thông báo thành công hiện ra, job mới xuất hiện trong danh sách.
4. Thử nghiệm nút "Giải phóng kẹt":
   - Thao tác thành công, job đổi badge sang Thất bại / Đã xử lý kẹt.
