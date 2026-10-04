# Independent Run-based AI Jobs & Shared Report Naming Standard

**Date**: 2026-09-20 17:00  
**Status**: Resolved  
**Scope**: Shared Validation, AI Engine, BullMQ Worker, File Naming, Admin Monitoring  
**Plan**: `plans/260920-1700-independent-job-runs-and-report-naming/plan.md`  

---

## 1. What Happened

Hai vấn đề kiến trúc cần được giải quyết dứt điểm:
1. **Đồng nhất Case ID thành Job ID làm hỏng cơ chế Giám sát Worker**: Khi sinh viên sửa bài chạy lại hoặc Admin bấm Retry, record AI job cũ trong DB bị `upsert` ghi đè, và thư mục `storage/jobs/${caseId}` bị xoá sạch, làm mất toàn bộ vết tích của lần chạy trước.
2. **Quy chuẩn Đặt tên File Báo cáo PDF Bị Phân Mảnh**: Có tới 3 nơi sinh tên file PDF khác nhau (API download, Tab Báo cáo, Tab Tài liệu). Khi case chạy 2 lần trên cùng 1 phiên bản (ví dụ lần đầu và soi logic), tab tài liệu hiển thị 2 file cùng tên nhưng khi tải về lại ra tên khác, gây nhầm lẫn lớn cho sinh viên.

## 2. Technical Decisions

1. **Chuẩn hóa Logic Đặt Tên File Báo cáo Duy nhất (`@repo/validation`)**:
   - Viết module dùng chung `packages/validation/src/report-naming.ts` làm Single Source of Truth cho cả frontend và backend.
   - Cung cấp các hàm chuẩn: `buildReportDownloadFilename`, `buildReportDisplayFilename`, `parseReportFilename`, và mapping loại thẩm định tiếng Việt (`Lần đầu`, `Đã sửa`, `Soi logic`).
2. **Tách Độc Lập Job ID Cho Từng Lần Chạy (Run-based AI Jobs)**:
   - Mỗi lần chạy AI sinh ra một `aiJobId` mới (UUID v4), tạo record độc lập trong database, bảo toàn toàn bộ lịch sử chạy của case.
   - Thư mục sandbox được tổ chức phân cấp: `storage/jobs/${caseId}/${jobId}/`, giữ nguyên hiện trường của các lần chạy cũ phục vụ phân tích lỗi.
3. **Queue Key Phức Hợp và Cơ Chế Dual-Publish Logging**:
   - Job ID gửi sang BullMQ mang format: `omp-${caseId}--${aiJobId}` (có fallback `omp-${caseId}` cho tương thích ngược).
   - Worker xuất log đồng thời ra 2 kênh Redis Pub/Sub: `job:logs:${jobId}` (cho Admin xem realtime log chi tiết) và `job:logs:${caseId}` (cho Sinh viên xem thanh tiến trình qua SSE).
4. **Nâng cấp Màn hình Giám Sát Worker Cho Admin**:
   - Hiển thị rõ ràng Job ID, Case ID, thời gian chạy, model AI đã dùng và cung cấp nút mở Terminal Drawer xem log trực tiếp theo từng lần chạy.

## 3. Key Changes

- `packages/validation/src/report-naming.ts`: Tạo mới module chuẩn hóa tên báo cáo.
- `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts`: Sinh Job ID độc lập, tổ chức storage sandbox phân cấp.
- `apps/worker-omp/src/index.ts` & `apps/worker-omp/src/storage.ts`: Hỗ trợ dual-publish Redis log, lưu trữ sandbox theo `caseId/jobId`.
- `apps/web-1/app/admin/workers/`: Tích hợp `WorkerJobTerminal` hiển thị log realtime theo job ID.
- `apps/web-1/app/dashboard/case/[id]/_components/`: Cập nhật tab Báo cáo và tab Tài liệu sử dụng hàm đặt tên chuẩn từ `@repo/validation`.

## 4. Verification

- Kiểm thử chạy audit 2 lần trên cùng 1 case: Hệ thống ghi nhận 2 Job IDs riêng biệt trong DB, 2 thư mục sandbox riêng biệt trong `storage/jobs/`, không có hiện tượng ghi đè dữ liệu.
- Tên file báo cáo hiển thị trên Tab Tài liệu, Tab Báo cáo và file tải về trình duyệt khớp nhau 100%, có đầy đủ slug dự án, loại thẩm định và số phiên bản.
- Admin mở Drawer xem được log realtime của từng job cụ thể trong khi sinh viên vẫn nhận đúng tiến trình thẩm định qua SSE.
