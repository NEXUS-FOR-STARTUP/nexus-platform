# Phase 6: Kiểm thử Tích hợp, Không Hồi quy & An toàn Vận hành

**Mục tiêu:** Kiểm thử toàn diện các luồng thay đổi, đảm bảo không hồi quy bất kỳ tính năng nào của sinh viên, cố vấn hoặc quản trị viên; sẵn sàng triển khai an toàn lên Production VPS.

---

## 1. Bộ Kiểm thử Đơn vị (Unit Tests)

### 1.1. Unit Test Đặt tên File Báo cáo (`packages/validation/src/__tests__/report-naming.test.ts`):
- `makeDownloadSlug`: Kiểm tra chuyển đổi tiếng Việt có dấu, ký tự khoảng trắng, ký tự đặc biệt (`đ`, `Đ`, `—`, `/`).
- `buildStandardReportPdfFilename`:
  - Kiểm tra trường hợp `initial` $\rightarrow$ ra slug `lan_dau`.
  - Kiểm tra trường hợp `resubmit` $\rightarrow$ ra slug `da_sua`.
  - Kiểm tra trường hợp `logic_check` $\rightarrow$ ra slug `soi_logic`.
  - Kiểm tra trường hợp null/undefined $\rightarrow$ fallback `phan_bien`.
  - Kiểm tra định dạng timestamp đúng 14 số `YYYYMMDDHHmmss`.
  - Kiểm tra version suffix `_v01`, `_v02`.

### 1.2. Unit Test Phân rã BullMQ Queue Key (`omp-queue.test.ts`):
- Kiểm tra `buildOmpQueueJobId("case-123", "job-456")` $\rightarrow$ `omp-case-123--job-456`.
- Kiểm tra `parseOmpQueueJobId("omp-case-123--job-456")` $\rightarrow$ `{ caseId: "case-123", aiJobId: "job-456" }`.
- Kiểm tra tương thích ngược `parseOmpQueueJobId("omp-case-old")` $\rightarrow$ `{ caseId: "case-old", aiJobId: undefined }`.

---

## 2. Kiểm thử Tích hợp (Integration Tests)

### 2.1. Cập nhật `admin-workers.test.ts`:
- Bổ sung test case tìm kiếm theo `Job ID` (UUID).
- Kiểm tra DTO trả về có đủ `attemptNo` và `id` riêng biệt cho 2 lần chạy của cùng một case.
- Kiểm tra khi retry, job cũ không bị sửa thành trạng thái của job mới.

### 2.2. Kiểm thử Điều phối Viên Thẩm định (`omp-audit-coordinator`):
- Kiểm tra khi gọi `triggerOmpAuditForCase`, hàm `createAiJobQueued` sinh UUID mới thay vì ghi đè record cũ.
- Kiểm tra `attemptNo` tăng lũy tiến (1, 2, 3...) cho từng lượt chạy của Case.

---

## 3. Kịch bản Kiểm tra Thực tế (Smoke Test & E2E Validation)

1. **Kịch bản 1: Case chạy 2 lần (Initial + Soi logic)**
   - Case `farm2dorm`:
     - Lần 1: Chạy ban đầu $\rightarrow$ Job ID 1, tên file: `farm2dorm_lan_dau_20260920143012_v01.pdf`.
     - Lần 2: Bấm Soi logic $\rightarrow$ Job ID 2, tên file: `farm2dorm_soi_logic_20260920154500_v01.pdf`.
   - **Xác minh:**
     - Bảng Admin Worker Monitoring hiển thị 2 dòng riêng biệt với 2 Job ID khác nhau.
     - Tab Tài liệu hiển thị 2 dòng với 2 tên file khác nhau hoàn toàn.
     - Bấm tải file ở cả 2 dòng, tên file tải về trùng khớp 100% với tên hiển thị trên bảng.

2. **Kịch bản 2: Kiểm tra Stream Live Log của Sinh viên**
   - Mở màn hình `/cases/:id` của sinh viên khi một job đang chạy.
   - Quan sát Terminal log stream SSE `/api/cases/:id/ai-events`.
   - **Xác minh:** Log nhảy đều đặn theo thời gian thực (nhờ cơ chế Dual-publish theo cả `caseId`).

3. **Kịch bản 3: Tương thích ngược dữ liệu cũ**
   - Mở xem chi tiết một job cũ đã chạy từ trước (khi chưa nâng cấp).
   - **Xác minh:** Hệ thống fallback tìm đúng thư mục phẳng `storage/jobs/{caseId}`, hiển thị đầy đủ file và log mà không gặp lỗi 404 hay 500.

---

## 4. Kế hoạch Dự phòng & Rollback

- Bảng `ai_jobs` từ trước đến nay đã có sẵn trường `id` (UUID) và index `[case_id, job_type]`. Việc thay đổi hoàn toàn nằm ở tầng mã nguồn ứng dụng (Application Layer), không can thiệp thay đổi cấu trúc bảng trong PostgreSQL $\rightarrow$ Không có rủi ro về Database Migration.
- Cấu trúc Queue Key có cơ chế fallback nhận diện cả `omp-{caseId}` và `omp-{caseId}--{jobId}` $\rightarrow$ Nếu rollback code về phiên bản trước, các job trong queue vẫn tương thích.
