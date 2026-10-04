# Phase 2: App-level AGENTS & Worker

## Context Links
- `apps/api/AGENTS.md`
- `apps/web-1/AGENTS.md`
- `apps/worker-omp/`
- `apps/worker-omp/src/index.ts`
- `apps/worker-omp/src/storage.ts`

## Overview
- **Priority:** P1
- **Status:** Completed
- **Description:** Đồng bộ tài liệu cho từng app độc lập (`apps/api`, `apps/web-1`) và tạo mới `apps/worker-omp/AGENTS.md` để agent làm việc trong từng app không bị sai lệch.

## Key Insights
- `apps/api/AGENTS.md` hiện tại tuyên bố API chỉ có 10 modules và ~74 endpoints (thực tế 15 modules, 112 endpoints), tuyên bố "không có event bus/message broker" (trong khi thực tế có Event Bus, 2 Outbox Relays, BullMQ, Redis Pub/Sub), và viết sai phạm vi CORS.
- `apps/web-1/AGENTS.md` thiếu 1 tab workspace (`report`), thiếu thông tin về tab worker monitoring trên admin, bỏ sót hơn 16 custom hooks, và không trỏ tới tài liệu chuẩn hóa từ ngữ `design-system/wording/`.
- `apps/worker-omp` là một daemon độc lập quan trọng nhưng hoàn toàn chưa có bất kỳ file `AGENTS.md` nào hướng dẫn.

## Requirements
1. **Đại tu `apps/api/AGENTS.md`**:
   - Cập nhật Module Map lên đủ 15 modules: `admin, ai-engine, auth, cases, deposits, documents, notifications, orders, packages, payments, profile, realtime, reports, supporter, wallet`.
   - Cập nhật số endpoint thực tế: 112 endpoints (108 module routes + 4 system endpoints + Better Auth catch-all).
   - Mô tả đúng cấu trúc thư mục `src/`: bổ sung `modules/`, `shared/`, `services/`, `scripts/`.
   - Đính chính nhận định sai: Ghi nhận sự tồn tại của Event Bus nội bộ (`domain-events.ts` - 14 event types), hai Outbox Relays (`DomainEventOutbox` 5s tick cho crash recovery, `NotificationOutbox` 2s tick), hàng đợi BullMQ `omp-queue`, Redis logging channels.
   - Sửa cấu hình CORS: mount trên `/api/*`, nhận origins `localhost:3000`, `localhost:3001` và domain production `nexusforstartup.site`.
   - Làm rõ vị trí Typst PDF: Runtime và template Typst nằm tại `apps/api/src/modules/reports/infrastructure/pdf/`, API nhận `report.json` từ worker để biên dịch ra file PDF.
2. **Cập nhật `apps/web-1/AGENTS.md`**:
   - Sửa mục `AUTH PATTERN`: Ghi nhận `proxy.ts` (Next.js 16 server-side auth guard + `MAINTENANCE_MODE`).
   - Cập nhật Case Workspace: Khẳng định có đủ **7 tabs** (`overview, documents, report, discussion, timeline, settings, credits`), cơ chế URL sync `?tab=`, stage-gating (ví dụ: `pkg_ai_audit` ẩn tab discussion).
   - Cập nhật Admin: Khẳng định có **7 tabs** (`payments, cases, documents, packages, stats, users, workers`), bổ sung thông tin tab `workers` (theo dõi KPI, jobs, logs realtime, hủy job).
   - Cập nhật số lượng custom hooks: 37 hooks thực tế.
   - Bổ sung quy định Persona Device Scope: Student dashboard hỗ trợ mobile responsive (drawer, card view table); Admin & Supporter là Desktop-only (`DesktopOnlyNotice.tsx` chặn < 1024px).
   - Bổ sung mục `DOCUMENTATION REFERENCE`: Trỏ đường dẫn tới `design-system/wording/` cho agent tra cứu quy chuẩn từ ngữ UX tiếng Việt.
3. **Tạo mới `apps/worker-omp/AGENTS.md`**:
   - **Overview:** Daemon worker độc lập xử lý thẩm định AI chuyên sâu bằng Bun + BullMQ.
   - **Queue contract:** Hàng đợi `omp-queue`, job ID format `omp-${caseId}--${aiJobId}` (fallback `omp-${caseId}`).
   - **Storage & Sandbox:** Mỗi job chạy trong thư mục riêng `storage/jobs/${caseId}/${jobId}/` với `input/`, `output/`, `models.json`, `system_prompt/`.
   - **Redis Pub/Sub Dual-Publish:** Ghi log đồng thời lên `job:logs:${jobId}` (Admin Worker Drawer) và `job:logs:${caseId}` (Student SSE), kèm cơ chế lọc rò rỉ prompt (`prompt-leak guard`).
   - **Cancellation:** Lắng nghe kênh Redis Pub/Sub `job-cancellation`.
   - **Ranh giới:** Worker OMP chỉ tạo file `report.json`; việc biên dịch Typst PDF do `apps/api` đảm nhận.

## Verification
- Kiểm tra các file `apps/api/AGENTS.md`, `apps/web-1/AGENTS.md`, `apps/worker-omp/AGENTS.md` đầy đủ, chính xác, không còn thông tin mâu thuẫn.
