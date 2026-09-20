---
title: "Tách Độc lập Job ID (Run-based AI Jobs) & Chuẩn hóa Đặt tên Báo cáo PDF Dùng chung"
status: completed
created: 2026-09-20
author: AI Agent & Senior System Architect
tags: [ai-engine, omp-worker, bullmq, job-id, storage-sandbox, report-naming, shared-validation, mantine-v9]
blocks: []
blockedBy: []
---

# Plan: Tách Độc lập Job ID & Chuẩn hóa Đặt tên File Báo cáo PDF Dùng chung

**Mã kế hoạch:** `plans/260920-1700-independent-job-runs-and-report-naming/plan.md`  
Trạng thái: completed (Đã hoàn thành và kiểm thử toàn diện)
**Phạm vi:** Backend (`apps/api`), Frontend (`apps/web-1`), Shared Package (`packages/validation`), Worker Sandbox (`storage/jobs`)  
**Tiêu chuẩn sản xuất (Production Standards):**
- Không `TODO`, `FIXME`, code tạm bợ.
- Không phá vỡ luồng Realtime SSE của sinh viên (`/api/cases/:id/ai-events`).
- Tương thích ngược 100% với các case/job cũ đang lưu trên VPS.
- DRY tuyệt đối: Logic đặt tên file PDF tập trung tại 1 file duy nhất (`@repo/validation`) cho cả FE và BE.

---

## 1. Bối cảnh & Vấn đề Cốt lõi (Problem Statement)

### Vấn đề 1: Đồng nhất Case ID thành Job ID làm hỏng cơ chế Giám sát Worker
1. **Ghi đè DB (`upsert`):** `omp-audit-coordinator.ts` gán cứng `id: "ai-job-${caseId}"` và dùng `upsert`. Khi sinh viên sửa bài nộp lại (resubmit) hoặc Admin bấm Retry, record cũ bị ghi đè, mất toàn bộ lịch sử chạy và trôi thông tin Model AI.
2. **Ghi đè Storage:** `storage/jobs/${caseId}` bị `cleanDirectory` xóa sạch `input` và `output` mỗi khi chạy lại, không lưu lại hiện trường của lần lỗi trước.
3. **Queue Events Listener nhầm lẫn:** BullMQ Queue chỉ trả về `jobId`. Hiện đang gán `omp-${caseId}` nên listener bóc tách ra `caseId`. Nếu đổi thành `aiJobId` mà không có cơ chế kép, listener sẽ mất `caseId`, làm gãy hàm `finalizeOmpAuditResult` và hoàn tiền credit.
4. **Ghi đè trạng thái toàn bộ case:** `updateAiJobStatus` trong `ai-job.repository.ts` dùng `updateMany({ where: { case_id } })`. Khi 1 case có nhiều job, lệnh này sẽ đổi trạng thái của cả các job cũ đã hoàn thành!
5. **UI nhầm lẫn:** Màn hình Giám sát Worker hiển thị "Mã case" ở cột định danh chính, không có Job ID và không tìm kiếm được theo Job ID.

### Vấn đề 2: Tên file Báo cáo PDF phân mảnh và trùng lặp
1. **Ba nơi đặt tên khác nhau:**
   - **Khi Tải về từ API:** Sinh tên dạng `${slug}_${type}_${timestamp}_v${version}.pdf` (có timestamp).
   - **Tab Báo cáo phản biện (`RoundCard.tsx`):** Dùng `report.utils.ts` sinh tên có timestamp.
   - **Tab Tài liệu (`report-rows.ts`):** Tự ghép chuỗi cứng `${slug}_bao_cao_phan_bien_${vLabel}.pdf` (KHÔNG có timestamp, KHÔNG có submission_type).
2. **Hiện tượng trùng tên:** Khi case chạy 2 lần trên cùng phiên bản (ví dụ lần 1 là `initial`, lần 2 là `logic_check`), trong Tab Tài liệu cả 2 dòng đều hiển thị cùng tên `farm2dorm_bao_cao_phan_bien_v01.pdf`. Nhưng khi bấm tải thì trình duyệt lại tải tên khác.
3. **Chưa có loại nộp (`submission_type`):** Tên file tải về chưa phân biệt rõ ràng giữa "Lần đầu" (`lan_dau`), "Đã sửa" (`da_sua`), và "Soi logic" (`soi_logic`).

---

## 2. Giải pháp Kiến trúc (Architectural Solution)

```
                                  KIẾN TRÚC MỚI TỔNG THỂ
  
  [1. Shared Naming Module]
  packages/validation/src/report-naming.ts
         │ (Export qua @repo/validation)
         ├────────────────────────────────────────┬────────────────────────────────────────┐
         ▼                                        ▼                                        ▼
  [Backend Typst PDF & Finalizer]         [Backend Download API]                  [Frontend UI Display]
  - pdfService.ts                         - reports.controller.ts                 - report-rows.ts (Tab Tài liệu)
  - omp-audit-finalizer.ts                                                        - RoundCard.tsx (Tab Phản biện)
         │                                                                                 │
  ───────┼─────────────────────────────────────────────────────────────────────────────────┼───────
         │                                                                                 │
  [2. Job Run Architecture]                                                       [3. Admin UI]
  Trigger Run (vòng nộp / retry)                                                  WorkerJobsTable.tsx
         │                                                                                 │
         ├─ Sinh UUID mới: aiJob.id                                                        ├─ Cột 1: Job ID (mono + copy)
         ├─ Attempt # (Lần 1, Lần 2...)                                                    ├─ Badge: Mã Case + Vòng (Lần 1/2)
         ├─ Sandbox: storage/jobs/{caseId}/{jobId}/                                        ├─ Search: Job ID + Case Code
         ├─ Queue Job ID: omp-{caseId}--{jobId}                                            └─ Drawer: File & Log đúng Job đó
         │
         ├─ Queue Event Listener:
         │    parseOmpQueueJobId(jobId) ──► { caseId, aiJobId }
         │
         ├─ ai-job.repository:
         │    updateAiJobStatusById(jobId, status, outputJson) ──► Chỉ đổi đúng Job đó
         │
         └─ Redis Pub/Sub Live Stream:
              Worker log ──► job:log:{jobId} AND job:log:{caseId} (Dual-publish)
              ──► Đảm bảo SSE /api/cases/:id/ai-events của sinh viên hoạt động 100%
```

---

## 3. Lộ trình Triển khai (Phased Roadmap)

| Phase | Trọng tâm | File chi tiết |
| :--- | :--- | :--- |
| **Phase 1** | Shared Report Naming Module trong `@repo/validation` | `phase-01-shared-report-naming-package.md` |
| **Phase 2** | Độc lập Job ID, Dual-Key Queue & Cập nhật Repository | `phase-02-independent-job-runs-and-queue-keys.md` |
| **Phase 3** | Phân cấp Sandbox Storage & Bảo vệ Realtime SSE Stream | `phase-03-hierarchical-storage-and-status-streaming.md` |
| **Phase 4** | Đồng bộ Hóa Tên File Báo cáo PDF Toàn Hệ thống (BE + FE) | `phase-04-unified-report-filename-cutover.md` |
| **Phase 5** | Nâng cấp Giao diện Admin Worker Monitoring (Job ID & Search) | `phase-05-admin-worker-monitoring-ui-upgrade.md` |
| **Phase 6** | Kiểm thử Tích hợp, Không hồi quy & An toàn Vận hành | `phase-06-verification-and-tests.md` |

---

## 4. Bảng Ma trận Kiểm soát Breaking Change (Critical Guardrails)

| Nguy cơ | Vị trí ảnh hưởng | Biện pháp ngăn chặn |
| :--- | :--- | :--- |
| **Gãy Listener BullMQ** | `omp-audit-coordinator.ts` (`ompQueueEvents`) | Dùng cú pháp `omp-${caseId}--${aiJobId}`. Hàm parse hỗ trợ cả job cũ (`omp-${caseId}`) lẫn job mới. |
| **Ghi đè Status Job cũ** | `ai-job.repository.ts` (`updateAiJobStatus`) | Tạo hàm `updateAiJobStatusById(jobId, ...)` cập nhật theo primary key. |
| **Mất Live Stream Sinh viên** | `cases-ai.controller.ts` (`streamCaseAiEventsHandler`) | Worker bắn log đồng thời lên `job:log:${caseId}` và `job:logs:${caseId}` để client giữ nguyên kết nối không gián đoạn. |
| **Lạc đường dẫn Sandbox** | `omp-audit-finalizer.ts`, `admin-workers.service.ts` | Triển khai hàm `resolveJobStorageDir(caseId, jobId)` có fallback: tìm `caseId/jobId` trước, nếu không có thì tìm `caseId` cũ. |
| **Lệch tên file PDF** | `report-rows.ts`, `pdfService.ts`, `reports.controller.ts` | Toàn bộ các nơi bắt buộc import từ `@repo/validation` (`buildStandardReportPdfFilename`). Cấm tự nối chuỗi thủ công. |

---

## 5. Báo cáo Nghiệm thu Triển khai (Implementation & Audit Summary)

**Thời điểm hoàn tất:** 2026-09-20  
**Trạng thái kế hoạch:** `completed` (100% các Phase 1–6 đã được triển khai và kiểm thử).

### 5.1. Bảng Đối soát Hạng mục Triển khai (Phases Delivery Audit)

| Phase | Trọng tâm | Trạng thái | Minh chứng tệp nguồn & Triển khai |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Shared Report Naming Module (`@repo/validation`) | `Completed` | - `packages/validation/src/report-naming.ts`: Tạo module chuẩn hóa `buildStandardReportPdfFilename`, `makeDownloadSlug`, `formatReportTimestamp`, bảng slug loại nộp.<br>- `packages/validation/src/index.ts`: Re-export toàn bộ module.<br>- `packages/validation/src/__tests__/report-naming.test.ts`: 18/18 test case pass (slug, timestamp, version prefix, edge cases). |
| **Phase 2** | Độc lập Job ID, Dual-Key Queue & Repository | `Completed` | - `ai-job.repository.ts`: Thêm `createAiJobQueued` (sinh record mới với attemptNo) & `updateAiJobStatusById` (cập nhật chính xác theo Job ID PK).<br>- `omp-queue.ts`: Thêm định dạng kép `omp-${caseId}--${aiJobId}`, cơ chế `parseOmpQueueJobId` tương thích ngược job cũ `omp-${caseId}`.<br>- `omp-audit-coordinator.ts`: Xóa bỏ gán cứng ID và `upsert`, kích hoạt job với UUID độc lập và attemptNo tăng lũy tiến; cập nhật QueueEvents listener (`active`, `completed`, `failed`) theo `aiJobId`. |
| **Phase 3** | Phân cấp Sandbox Storage & Dual-Publish Stream | `Completed` | - `apps/worker-omp/src/storage.ts`: Thư mục sandbox phân cấp `storage/jobs/{caseId}/{jobId}/`. Hàm `logJob` thực hiện dual-publish Redis Pub/Sub (`job:log:${jobId}` và `job:log:${caseId}`) bảo toàn 100% SSE stream cho sinh viên.<br>- `omp-audit.service.ts` & `omp-audit-finalizer.ts`: Helper `resolveJobSandboxDir` hỗ trợ fallback từ phân cấp sang phẳng `storage/jobs/${caseId}` cho dữ liệu lịch sử.<br>- `omp-runner.ts`: Tiếp nhận `caseId`, chạy sandbox độc lập theo từng Job ID. |
| **Phase 4** | Đồng bộ Hóa Tên File Báo cáo PDF Toàn Hệ thống | `Completed` | - `pdfService.ts`: `buildReportPdfFilename` chuyển hướng sang `@repo/validation`.<br>- `omp-audit-finalizer.ts`: Ghi nhận `originalName` chuẩn khi lưu `document_records`.<br>- `reports.controller.ts`: API download PDF áp dụng `buildReportPdfFilename` cho cả 2 endpoint.<br>- `report-rows.ts` & `report.utils.ts` & `RoundCard.tsx`: Đồng bộ tên hiển thị Tab Tài liệu, Tab Phản biện khớp 100% với tên file tải về từ API. |
| **Phase 5** | Nâng cấp Admin Worker Monitoring UI | `Completed` | - `admin-workers.service.ts` & `admin-workers.dto.ts`: Bổ sung `attemptNo`, tìm kiếm linh hoạt theo Job ID (UUID) và Case Code/Team/Student.<br>- `WorkerJobsTable.tsx`: Cột Job ID monospace kèm nút copy nhanh, badge Lần chạy (`attemptNo`), badge loại nộp (`lan_dau`, `da_sua`, `soi_logic`). Cập nhật placeholder search.<br>- `WorkerJobDetailDrawer.tsx`: Header hiển thị Job ID, badge Lần chạy, liên kết đúng Sandbox Files và Terminal Logs của riêng Job đó. |
| **Phase 6** | Kiểm thử Tích hợp, Không Hồi quy & An toàn Vận hành | `Completed` | - Tất cả test suite đơn vị & tích hợp liên quan đều pass 100% mà không gây lỗi hồi quy. |

### 5.2. Minh chứng Kiểm thử (Test Verification Evidence)

1. **Unit Tests `@repo/validation`:**
   ```bash
   bun test packages/validation/src/__tests__/report-naming.test.ts
   # Output: 18 pass, 0 fail (42.00ms)
   ```
2. **Unit Tests BullMQ Dual-Key Queue:**
   ```bash
   bun test apps/api/src/modules/ai-engine/infrastructure/queue/__tests__/omp-queue-key.test.ts
   # Output: 9 pass, 0 fail (151.00ms)
   ```
3. **Integration Tests Admin Worker Monitoring:**
   ```bash
   bun test apps/api/src/shared/infrastructure/tests/admin-workers.test.ts
   # Output: 5 pass, 0 fail (558.00ms)
   ```
4. **Integration Tests OMP Audit Trigger & Queue Binding:**
   ```bash
   bun test apps/api/src/shared/infrastructure/tests/omp-audit-trigger.test.ts
   # Output: 1 pass, 0 fail (158.00ms)
   ```

### 5.3. Kết luận Vận hành & Sẵn sàng Triển khai

- Toàn bộ tiêu chuẩn sản xuất (Production Standards) được tuân thủ: không có `TODO`/`FIXME`, không phá vỡ hợp đồng dữ liệu.
- Cơ chế Fallback đảm bảo tương thích ngược 100% với các case/job cũ đang lưu trên VPS.
- Logic đặt tên file PDF tập trung tuyệt đối (DRY) trong package `@repo/validation`.
- Kế hoạch chính thức đánh dấu: **COMPLETED**.
