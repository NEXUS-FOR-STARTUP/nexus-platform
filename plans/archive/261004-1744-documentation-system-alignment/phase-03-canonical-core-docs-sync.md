# Phase 3: Canonical Core Docs Sync

## Context Links
- `docs/codebase-summary.md`
- `docs/system-architecture.md`
- `docs/code-standards.md`
- `docs/flows/`
- `docs/requirements/`

## Overview
- **Priority:** P2
- **Status:** Completed
- **Description:** Đồng bộ các file tài liệu canonical trong `docs/` để cung cấp bức tranh kiến trúc tổng thể chính xác về backend, worker, frontend và các luồng nghiệp vụ cốt lõi.

## Key Insights
- `docs/codebase-summary.md` là tài liệu được bảo trì tốt nhất nhưng vẫn bị lệch ở số lượng migrations (ghi 23 thay vì 31), số model (30 thay vì 32), và số lượng package (ghi 3 thay vì 4).
- `docs/system-architecture.md` cần bổ sung sơ đồ tương tác giữa `apps/api` và `apps/worker-omp` qua BullMQ và Redis, cũng như làm rõ cơ chế 2 outbox relays.
- `docs/flows/` và `docs/requirements/` có một số file từ đợt MVP đầu tiên (tháng 6-7/2026) vẫn còn ghi nhận tab chat bị cấm hoặc wizard 8 bước cũ, cần có trạng thái/banner rõ ràng.

## Requirements
1. **Cập nhật `docs/codebase-summary.md`**:
   - Cập nhật header ngày tháng mới nhất (`2026-10-04`).
   - Cập nhật số liệu chuẩn: 260 files src API (~31,000 LOC), 112 endpoints (108 module routes + 4 system), 32 Prisma models, 31 migrations (mới nhất: `20260923213000_add_performance_indexes`).
   - Cập nhật bảng packages lên **4 packages**: thêm `packages/shared` (`@app/shared`).
   - Bổ sung thông tin về 2 Outbox Relays: `DomainEventOutbox` (crash recovery 5s) và `NotificationOutbox` (2s tick).
   - Bổ sung ghi chú về `apps/worker-omp`, tab theo dõi worker trên Admin, và chính sách Desktop-only cho Admin/Supporter.
2. **Cập nhật `docs/system-architecture.md`**:
   - Cập nhật sơ đồ module API và các bảng route cho đủ 15 modules và 112 endpoints.
   - Sửa số lượng Prisma models thành 32.
   - Bổ sung mục kiến trúc AI Worker Execution (`apps/worker-omp`):
     - Luồng đẩy job qua BullMQ `omp-queue`.
     - Dual-publish logging qua Redis (`job:log:${jobId}` và `job:log:${caseId}`).
     - Sandbox storage và ranh giới sinh PDF tại `apps/api`.
   - Bổ sung mô tả tầng bền vững sự kiện (Event Bus + `DomainEventOutbox` relay).
3. **Cập nhật `docs/code-standards.md`**:
   - Cập nhật số lượng test files: 48 files (47 test + 1 report).
   - Thêm hướng dẫn an toàn DB: Nghiêm cấm chạy trực tiếp `psql $DATABASE_URL` trên database production; mọi truy vấn kiểm tra dữ liệu phải tuân thủ `docs/db-query-guide.md` (dùng `READONLY_DATABASE_URL` và script an toàn).
4. **Chuẩn hóa trạng thái trong `docs/flows/` và `docs/requirements/`**:
   - Đặt banner trạng thái cho `docs/flows/cp1-mvp-screen-spec.md` (đánh dấu là Historical MVP Spec; hướng dẫn tham chiếu `case-lifecycle-flow.md` và `team-fit-flow.md` cho luồng hiện tại).
   - Cập nhật `docs/requirements/case-workspace-and-status.md`: Sửa nội dung "Phase 1 không có tab hỏi đáp" thành "Hỗ trợ tab thảo luận trực tiếp qua Centrifugo realtime cho các gói có chuyên viên hỗ trợ (ẩn với gói thuần AI)".

## Verification
- Kiểm tra các liên kết chéo và số liệu giữa `codebase-summary.md` và `system-architecture.md` khớp nhau hoàn toàn.
