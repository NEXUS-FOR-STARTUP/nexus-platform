# Brainstorm Report: Admin OMP Worker Monitoring

## 1. Problem Statement
Hệ thống Nexus sử dụng tiến trình nền BullMQ + Redis (`omp-queue`) và Worker container (`nexus-worker-omp`) để chạy OMP Engine thẩm định tài liệu đề án sinh viên. Tuy nhiên, toàn bộ tiến trình này hiện tại là "hộp đen" đối với Quản trị viên (Admin):
- Không có giao diện theo dõi trạng thái hàng đợi (waiting, active, completed, failed, stalled).
- Không biết được Case nào, Job nào đang chạy, Input là gì, Output là gì.
- Khi một job bị kẹt (stuck) do worker restart hoặc LLM timeout, Admin không có công cụ phát hiện và giải phóng, dẫn đến việc sinh viên bị treo hồ sơ ở trạng thái `under_review` và bị giam credit.
- Khi job thất bại do rate limit hoặc quota của một AI provider (ví dụ Gemini), Admin không có cách nào kích hoạt chạy lại (Retry) với một mô hình AI khác (ví dụ Claude, GPT-4o) mà không làm phát sinh thêm phí credit của sinh viên.

## 2. Technical Feasibility & Architecture
1. **Queue & Worker Engine**:
   - BullMQ `ompQueue` trên Redis cung cấp đầy đủ thông tin runtime: `getActive()`, `getWaiting()`, `getCompleted()`, `getFailed()`, `getJobCounts()`.
   - Bảng `ai_jobs` trong PostgreSQL lưu trữ metadata nghiệp vụ: `case_id`, `job_type`, `status`, `input_json`, `output_json`, `created_at`, `updated_at`.
   - Redis key `job:logs:<jobId>` lưu toàn bộ log dòng lệnh của worker.
   - Thư mục sandbox `storage/jobs/<caseId>` lưu trữ đầy đủ tài liệu đầu vào (`input/`) và tài liệu đầu ra (`output/`).
2. **Kế thừa & Không phá vỡ cấu trúc**:
   - Tận dụng 100% logic điều phối của `omp-audit-coordinator.ts`, `omp-queue.ts` và cơ chế hoàn tiền `refundAuditCreditIfNoReport()`.
   - Không cần migration database, không đổi Prisma schema.

## 3. Evaluated Approaches
- **Phương án 1 (Khuyên dùng - Đã chọn)**: Xây dựng Tab "Tiến trình AI" trực tiếp trong Admin Hub (`apps/web-1/app/admin/page.tsx`) sử dụng Mantine UI v9, Lucide React, chuẩn UI/UX Pro Max.
  - *Ưu điểm*: Gắn kết 100% với nghiệp vụ dự án (Mã Case, sinh viên, tiền tệ VND, credit, lịch sử nộp bài), giao diện đồng bộ, bảo mật qua session admin của Better Auth.
- **Phương án 2**: Tích hợp Bull-Board dựng sẵn (`@bull-board/hono`).
  - *Nhược điểm*: Giao diện kỹ thuật thô, không có ngữ cảnh Case/sinh viên, không hỗ trợ nút bấm hoàn tiền hoặc đổi model AI nghiệp vụ.

## 4. Key Decisions
1. **Vị trí Tab**: Thêm tab `workers` vào Admin Hub theo cấu trúc URL query `?tab=workers`.
2. **Admin Retry**:
   - Cho phép chọn model AI (`Gemini 2.5 Flash`, `Claude 3.5 Sonnet`, `GPT-4o`, `Mimo v2.5`, Custom string).
   - Tự động bỏ qua kiểm tra và trừ credit sinh viên (`skip_credit_check: true`).
3. **Giải phóng Job kẹt (Heal Stuck Job)**:
   - Phát hiện job kẹt: `status IN ('queued', 'processing')` và `updated_at < NOW() - 10 phút`.
   - Khi bấm Giải phóng: Hủy job BullMQ, đánh dấu `failed`, tự động hoàn 1 credit cho sinh viên nếu chưa nhận được báo cáo, khôi phục stage của Case về trạng thái an toàn.
4. **Hiệu năng & Tránh Payload Bloat**:
   - API danh sách chỉ trả metadata nhẹ.
   - Drawer xem chi tiết mới tải input/output và log terminal.
