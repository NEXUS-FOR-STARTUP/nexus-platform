# GA-21: Trả nợ kỹ thuật kiểm thử (28 Baseline Test Failures Reconcile)

- **ID:** GA-21
- **Priority:** P2
- **Category:** Infrastructure / Testing Quality
- **Status:** Todo
- **Nguồn:** `plans/250825-2100-ga02-intake-flow-fix/reports/tester.md §3`

---

## 1. Mô tả vấn đề
Khi chạy toàn bộ test suite API `npm test` trong `apps/api`, có 28 ca kiểm thử cố hữu bị fail trên baseline gốc (đã được chứng minh qua stash experiment không phải do regression của các tính năng mới). 28 ca lỗi này chia làm 4 nhóm chính:
1. **Nhóm A (7 tests):** Cần kết nối PostgreSQL thật (`Can't reach database server at 127.0.0.1:5432`).
2. **Nhóm B (1 test):** Hardcode Windows path tuyệt đối (`E:/FPT/...`) làm vỡ module resolution khi chạy trên môi trường Linux/WSL/CI.
3. **Nhóm C (14 tests):** Sai lệch mã lỗi assertion do cập nhật logic kinh doanh (`FEATURE_DEPRECATED` vs `VALIDATION_ERROR`, `INVALID_CASE_STAGE`, `FILE_TOO_LARGE` vs `INVALID_FILE_TYPE`).
4. **Nhóm D (6 tests):** Test group cha bị fail kéo theo do lỗi từ các test con ở nhóm A/B/C.

Tình trạng này làm cho thanh trạng thái CI không đạt mức "100% tests pass".

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Sửa đường dẫn môi trường:**
   - Loại bỏ toàn bộ hardcoded Windows path trong các file test, thay bằng `node:path` động.
2. **Mock database trong Unit Test:**
   - Mock Prisma Client trong các unit test không yêu cầu Postgres live để đảm bảo test chạy độc lập và cực nhanh.
3. **Đồng bộ mã lỗi Assertion:**
   - Cập nhật kỳ vọng mã lỗi trong `apps/api/src/shared/infrastructure/tests/` khớp với mã lỗi chuẩn của `AppError` mới.
4. **Mục tiêu:**
   - Đưa tỷ lệ pass của lệnh `npm test` lên 100% không còn lỗi giả.
