# AI Worker Execution Architecture & Unified Report Naming

_Cập nhật: 2026-09-20. Bám sát codebase thực tế của Nexus Platform._

## 1. Mục tiêu và Bối cảnh (Context & Problem Statement)

Trong kiến trúc vận hành trước đây của hệ thống OMP (Oh My Pi) Worker và tiến trình thẩm định AI:
1. **Trùng lặp và đè dữ liệu Job:** `omp-audit-coordinator.ts` gán cứng `id: "ai-job-${caseId}"` và dùng `upsert`. Khi sinh viên nộp vòng sửa (resubmit) hoặc Admin bấm chạy lại (retry), bản ghi cũ bị ghi đè, làm mất lịch sử các lần chạy và trôi thông tin Model AI thực tế của từng lần chạy.
2. **Ghi đè Sandbox Storage:** Thư mục sandbox phẳng `storage/jobs/${caseId}` bị dọn dẹp sạch sẽ ở mỗi lần chạy mới, xóa sạch hiện trường của các lần chạy trước đó và gây race condition nếu có hai tiến trình kiểm thử đồng thời.
3. **Queue Listener đơn khóa:** BullMQ queue chỉ mang `omp-${caseId}` khiến QueueEvents listener không thể phân biệt được sự kiện thuộc về lần chạy (run) nào của case.
4. **Phân mảnh tên file PDF:** Tên file PDF báo cáo phản biện bị ghép chuỗi tự do tại 3 nơi độc lập (API download, Tab Tài liệu, Tab Phản biện), dẫn đến tình trạng cùng một báo cáo nhưng hiển thị khác tên hoặc trùng tên giữa các vòng nộp.

Để giải quyết triệt để các vấn đề trên, Nexus Platform áp dụng kiến trúc **Tách độc lập Job Run**, **Phân cấp Sandbox Storage**, **Hợp đồng Dual-Publish Redis Logging**, và **Chuẩn hóa đặt tên báo cáo dùng chung qua `@repo/validation`**.

---

## 2. Chuẩn hóa Đặt tên Báo cáo PDF (`@repo/validation`)

### 2.1 Pattern Định dạng Chuẩn

Mọi file PDF báo cáo phản biện được xuất ra hoặc hiển thị trên giao diện đều tuân thủ pattern duy nhất:

$$\text{Tên file} = \texttt{\$\{slug\}\_\$\{submission\_type\}\_\$\{timestamp\}\_v\$\{version\}.pdf}$$

Ví dụ thực tế:
- `farm2dorm_lan_dau_20260920143012_v01.pdf` (Lần nộp đầu tiên, version 1)
- `farm2dorm_da_sua_20260921091520_v02.pdf` (Vòng sửa lại, version 2)
- `farm2dorm_soi_logic_20260920154500_v01.pdf` (Thẩm định soi logic đặc biệt)
- `farm2dorm_phan_bien_20260920143012.pdf` (Trường hợp không có version_no)

### 2.2 Quy tắc Xử lý và Slug Mapping

Module `packages/validation/src/report-naming.ts` đóng vai trò Single Source of Truth cho toàn bộ hệ thống:

| Thành phần | Quy tắc chuẩn hóa | Hàm thực thi |
| :--- | :--- | :--- |
| **`slug`** | Khử hoàn toàn dấu tiếng Việt (`đ`/`Đ` $\rightarrow$ `d`, loại bỏ dấu tổ hợp NFD), chuyển chữ thường, thay khoảng trắng/ký tự đặc biệt bằng `_`, giới hạn tối đa 50 ký tự. Fallback: `de_an`. | `makeDownloadSlug(name)` |
| **`submission_type`** | Ánh xạ loại nộp sang slug không dấu:<br>• `initial` $\rightarrow$ `lan_dau`<br>• `resubmit` $\rightarrow$ `da_sua`<br>• `logic_check` $\rightarrow$ `soi_logic`<br>• Fallback $\rightarrow$ `phan_bien` | `getSubmissionTypeFileSlug(type)` |
| **`timestamp`** | 14 chữ số liên tục `YYYYMMDDHHmmss` lấy từ thời điểm tạo báo cáo (`report.created_at` hoặc `submitted_at`). Xử lý an toàn null/undefined bằng thời điểm hiện tại. | `formatReportTimestamp(date)` |
| **`versionSuffix`** | Hậu tố số phiên bản dạng `_v01`, `_v02` (pad 2 chữ số). Tự động lược bỏ nếu `versionNo` là `null`, `undefined` hoặc `NaN`. | `buildStandardReportPdfFilename(opts)` |
| **`customTypeSlug`** | Cho phép override loại báo cáo đặc thù (ví dụ `reality_check`, `due_diligence`) khi không dùng `submission_type` mặc định. | `opts.customTypeSlug` |

### 2.3 Điểm Tích hợp Toàn Hệ thống

```
                           @repo/validation (report-naming.ts)
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
   [Backend PDF Engine]          [Backend Download API]            [Frontend Display Surfaces]
• pdfService.ts               • reports.controller.ts            • report-rows.ts (Tab Tài liệu)
  (buildReportPdfFilename)      (GET /api/cases/:id/report/pdf)  • report.utils.ts (Tab Phản biện)
• omp-audit-finalizer.ts       • reports.controller.ts            • RoundCard.tsx (Badge & Button)
  (Tên record document)         (GET /api/reports/:id/download)
```

Nghiêm cấm mọi hành vi tự ghép chuỗi thủ công (`template literals`) tại controller hay React component. Mọi thay đổi về định dạng tên báo cáo chỉ được thực hiện tại `@repo/validation`.

---

## 3. Kiến trúc Thực thi OMP Worker & Độc lập Job Run

### 3.1 Vòng đời Bản ghi `AiJob` Độc lập (Run-Based Lifecycle)

Thay vì ghi đè record case cũ, mỗi lần kích hoạt thẩm định (từ sinh viên nộp bài, supporter yêu cầu, hoặc admin chạy lại) đều khởi tạo một bản ghi `AiJob` mới trong PostgreSQL:
- **`id`:** UUID độc lập ngẫu nhiên (ví dụ `clx9...`).
- **`case_id`:** Định danh hồ sơ cần thẩm định.
- **`job_type`:** `"omp_audit"`.
- **`status`:** Chuyển trạng thái độc lập `queued` $\rightarrow$ `processing` $\rightarrow$ `completed` / `failed` / `cancelled`.
- **`attempt_count` (`attemptNo`):** Đánh số thứ tự lần chạy của case (Lần 1, Lần 2, Lần 3...) tính bằng tổng số job đã tạo của case + 1.
- **`input_json`:** Lưu vết chi tiết cấu hình chạy: `submission_type`, `lifecycle_unit_id`, `model`, `prompt_mode`, `attempt_no`, `startedAt`.

Hàm cập nhật `updateAiJobStatusById(jobId, status, outputJson)` trong `ai-job.repository.ts` cập nhật chính xác theo Primary Key `id`, ngăn chặn hoàn toàn việc đổi nhầm trạng thái của các job đã hoàn thành trước đó thuộc cùng case.

### 3.2 Dual-Key BullMQ Queue (`omp-${caseId}--${aiJobId}`)

Queue BullMQ (`omp-queue`) sử dụng cấu trúc định danh kép (Dual-Key) để vừa cô lập tiến trình vừa duy trì liên kết ngữ cảnh case:

$$\text{BullMQ Job ID} = \texttt{omp-\$\{caseId\}--\$\{aiJobId\}}$$

#### Tạo khóa (`buildOmpQueueJobId`):
```typescript
export function buildOmpQueueJobId(caseId: string, aiJobId: string): string {
  return `omp-${caseId}--${aiJobId}`;
}
```

#### Phân tích khóa và Tương thích ngược (`parseOmpQueueJobId`):
```typescript
export function parseOmpQueueJobId(queueJobId: string): { caseId: string; aiJobId?: string } {
  const raw = queueJobId.startsWith("omp-") ? queueJobId.slice(4) : queueJobId;
  const separatorIndex = raw.indexOf("--");
  if (separatorIndex !== -1) {
    return {
      caseId: raw.slice(0, separatorIndex),
      aiJobId: raw.slice(separatorIndex + 2) || undefined,
    };
  }
  // Tương thích ngược: Job cũ chỉ mang caseId
  return { caseId: raw, aiJobId: undefined };
}
```

#### Điều phối Sự kiện (`QueueEvents`):
Khi worker xử lý xong hoặc thất bại, listener `ompQueueEvents` bóc tách `aiJobId` và `caseId`:
- **Cập nhật `AiJob`:** Dùng `aiJobId` để chốt kết quả, persist log và đánh dấu `completed` / `failed`.
- **Cập nhật Case:** Dùng `caseId` để chuyển `user_facing_stage` sang `report_ready` hoặc kích hoạt hoàn trả credit khi có lỗi.

### 3.3 Phân cấp Thư mục Sandbox Storage (`storage/jobs/${caseId}/${jobId}/`)

Để bảo toàn hiện trường và tránh tranh chấp tài nguyên file, sandbox được tổ chức phân cấp:

```
storage/jobs/
└── ${caseId}/
    ├── ${aiJobId_1}/                 # Lần chạy 1 (Lần đầu)
    │   ├── input/                   # File tài liệu đề án nộp lần 1
    │   ├── output/                  # triad_handoff_packet.md, report.json...
    │   ├── models.json              # Khai báo model runtime
    │   └── system_prompt/           # Prompt chuyên biệt (initial)
    │
    └── ${aiJobId_2}/                 # Lần chạy 2 (Vòng sửa - Resubmit)
        ├── input/                   # Tài liệu bản cập nhật mới
        ├── output/                  # Báo cáo phản biện mới
        ├── models.json
        └── system_prompt/           # Prompt chuyên biệt (resubmit)
```

#### Cơ chế Fallback An toàn (`resolveJobSandboxDir`):
Khi API cần đọc lại output hoặc Admin tải file kết quả, hệ thống kiểm tra theo thứ tự ưu tiên:
1. **Phân cấp mới:** `storage/jobs/${caseId}/${aiJobId}`
2. **Thư mục phẳng:** `storage/jobs/${aiJobId}`
3. **Thư mục case cũ (Legacy):** `storage/jobs/${caseId}`

---

## 4. Hợp đồng Dual-Publish Redis Logging

### 4.1 Yêu cầu Nghiệp vụ
Hệ thống cần phục vụ đồng thời hai luồng quan sát với phạm vi khác nhau:
1. **Góc nhìn Sinh viên (Case-centric):** Luồng SSE `/api/cases/:id/ai-events` cần lắng nghe toàn bộ log của case theo `caseId` để render tiến trình trực quan trên trang chi tiết hồ sơ.
2. **Góc nhìn Quản trị viên (Job-centric):** Màn hình Admin Worker Monitoring (`/admin/workers`) cần xem terminal log của riêng từng lần chạy độc lập theo `jobId`.

### 4.2 Cấu trúc Kênh Pub/Sub và Danh sách Lịch sử

Worker OMP (`apps/worker-omp/src/storage.ts`) phát hành song song theo hợp đồng:

| Mục tiêu | Redis Key / Channel | Loại | Mục đích | Thời gian lưu trữ |
| :--- | :--- | :--- | :--- | :--- |
| **Job Run** | `job:log:${jobId}` | Pub/Sub Channel | Stream real-time vào Drawer Admin Worker | Thời gian thực |
| **Job Run** | `job:logs:${jobId}` | Redis List (`RPUSH`) | Replay toàn bộ lịch sử log của Job khi mở lại Drawer | TTL 24 giờ (86,400s) |
| **Case (User)** | `job:log:${caseId}` | Pub/Sub Channel | Stream real-time vào SSE client của sinh viên | Thời gian thực |
| **Case (User)** | `job:logs:${caseId}` | Redis List (`RPUSH`) | Replay lịch sử log cho sinh viên khi reload trang | TTL 24 giờ (86,400s) |

```
Worker logJob(jobId, msg, caseId)
      │
      ├─► rpush('job:logs:' + jobId) & publish('job:log:' + jobId)  ──► Admin Drawer Monitor
      │
      └─► if (caseId && caseId !== jobId)
            ├─► rpush('job:logs:' + caseId)                        ──► User History Replay
            └─► publish('job:log:' + caseId)                       ──► User Realtime SSE
```

### 4.3 Định dạng Dữ liệu Log (`PendingLog`)

```typescript
export interface PendingLog {
  jobId: string;
  caseId?: string;
  agent: "omp";
  message: string;
  timestamp: string; // ISO 8601
}
```

### 4.4 Lớp Bảo vệ An toàn Dữ liệu (Sanitization Guard)
Hàm `logJob` áp dụng bộ lọc triệt để trước khi phát tán lên Redis, ngăn chặn rò rỉ prompt nội bộ:
- Loại bỏ các thông điệp chứa `# SYSTEM PROMPT`.
- Loại bỏ hướng dẫn nhạy cảm `--- HƯỚNG DẪN BỔ SUNG`.
- Loại bỏ cấu trúc phân bước `Fixed Two-Step Workflow`.

---

## 5. Màn hình Giám sát Tiến trình Worker (`Admin Workers`)

Trên giao diện Quản trị viên (`/admin/workers`):
1. **Định danh Job ID:** Cột đầu tiên hiển thị `jobId` định dạng font monospace kèm nút sao chép một chạm (`CopyButton`).
2. **Huy hiệu Lần chạy (`attemptNo`):** Hiển thị rõ `Lần 1`, `Lần 2` để phân biệt các lần retry hoặc resubmit của cùng một case.
3. **Loại nộp (`submissionType`):** Hiển thị badge tương ứng: `Lần đầu` (initial), `Đã sửa` (resubmit), `Soi logic` (logic_check).
4. **Tìm kiếm Kép:** Ô tìm kiếm hỗ trợ tra cứu đồng thời theo:
   - Job ID chính xác (UUID).
   - Mã case (`case_code`), Tên đề án (`team_name`), hoặc Tên sinh viên (`owner_name`).
5. **Drawer Chi tiết:**
   - Đọc trực tiếp danh sách file trong sandbox `storage/jobs/${caseId}/${jobId}/input` và `output`.
   - Kết nối trực tiếp vào luồng log `job:logs:${jobId}` của riêng lần chạy đó.

---

## 6. Minh chứng Kiểm thử & Tính Ổn định (Verification Evidence)

Toàn bộ kiến trúc được bảo vệ bằng các bộ kiểm thử tự động:

1. **Unit Tests Naming (`packages/validation/src/__tests__/report-naming.test.ts`):**
   - 18/18 test case pass: xác thực khử dấu tiếng Việt, loại bỏ ký tự lạ, fallback date/slug, padding version `_v01`, và override `customTypeSlug`.
2. **Unit Tests BullMQ Queue Key (`apps/api/src/modules/ai-engine/infrastructure/queue/__tests__/omp-queue-key.test.ts`):**
   - 9/9 test case pass: kiểm tra tính toàn vẹn của `buildOmpQueueJobId`, `parseOmpQueueJobId` với cấu trúc kép `omp-${caseId}--${aiJobId}` và fallback cấu trúc cũ.
3. **Integration Tests Worker Monitoring (`apps/api/src/shared/infrastructure/tests/admin-workers.test.ts`):**
   - 5/5 test case pass: xác thực API lấy danh sách job, bóc tách `attemptNo`, tìm kiếm theo Job ID, và truy xuất logs theo khóa độc lập.
4. **Integration Tests Audit Trigger & Binding (`apps/api/src/shared/infrastructure/tests/omp-audit-trigger.test.ts`):**
   - Kiểm tra toàn diện luồng dispatch job, trừ credit, gán sandbox độc lập và bảo toàn trạng thái SSE.
