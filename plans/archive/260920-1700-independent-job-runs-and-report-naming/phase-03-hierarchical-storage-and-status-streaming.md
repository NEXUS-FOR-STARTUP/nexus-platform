# Phase 3: Phân cấp Sandbox Storage & Bảo vệ Realtime SSE Stream

**Mục tiêu:** Chuyển đổi cấu trúc thư mục sandbox sang dạng phân cấp Session $\rightarrow$ Run (`storage/jobs/{caseId}/{jobId}/`), bảo toàn hiện trường các lần chạy trước, và duy trì kênh SSE stream không bị gián đoạn cho sinh viên.

---

## 1. Phân cấp Thư mục Sandbox (`storage/jobs/`)

### 1.1. Cấu trúc thư mục mới:
```
storage/
└── jobs/
    └── {caseId}/
        ├── {jobId_1}/               <-- Lần 1 (initial)
        │   ├── input/
        │   │   └── intake_submission.md
        │   └── output/
        │       ├── triad_handoff_packet.md
        │       ├── input_clarification_audit.md
        │       └── report.json
        └── {jobId_2}/               <-- Lần 2 (soi logic / sửa bài)
            ├── input/
            │   ├── previous_report.md  (kế thừa từ DB)
            │   └── revision_v02.md
            └── output/
                ├── ...
```

### 1.2. Helper giải quyết đường dẫn có Fallback (`resolveJobSandboxDir`):
Tạo helper trong `apps/api/src/modules/ai-engine/omp-audit.service.ts`:
```typescript
export function resolveJobSandboxDir(caseId: string, jobId?: string): string {
  const root = resolveRepoRoot();
  if (jobId) {
    const nested = resolve(root, "storage", "jobs", caseId, jobId);
    if (existsSync(nested)) return nested;
  }
  // Fallback 1: phẳng theo jobId
  if (jobId && existsSync(resolve(root, "storage", "jobs", jobId))) {
    return resolve(root, "storage", "jobs", jobId);
  }
  // Fallback 2: phẳng theo caseId (dữ liệu cũ trước khi nâng cấp)
  return resolve(root, "storage", "jobs", caseId);
}
```

---

## 2. Bảo vệ Luồng Realtime SSE của Sinh viên (Dual-Publish Logging)

Sinh viên theo dõi tiến trình thẩm định tại trang `/cases/:id` thông qua API `GET /api/cases/:id/ai-events` (lắng nghe theo `caseId`).
Admin theo dõi tại bảng Worker Monitoring (`WorkerJobDetailDrawer.tsx`) có thể nghe theo `jobId`.

### Cơ chế Dual-Publish trong `apps/worker-omp/src/storage.ts`:
Cập nhật hàm `logJob`:
```typescript
export function logJob(jobId: string, message: string, caseId?: string): void {
  // ... filter system prompt ...
  const timestamp = new Date().toISOString();
  const payload = JSON.stringify({ jobId, caseId, agent: "omp", message, timestamp });

  const redis = getWorkerRedis();

  // 1. Ghi và phát log theo jobId (cho Admin Worker Detail)
  redis.rpush(`job:logs:${jobId}`, payload);
  redis.expire(`job:logs:${jobId}`, LOG_TTL_SECONDS);
  redis.publish(`job:log:${jobId}`, payload);

  // 2. Dual-publish theo caseId (đảm bảo SSE của Sinh viên hoạt động 100%)
  if (caseId && caseId !== jobId) {
    redis.rpush(`job:logs:${caseId}`, payload);
    redis.expire(`job:logs:${caseId}`, LOG_TTL_SECONDS);
    redis.publish(`job:log:${caseId}`, payload);
  }
}
```

---

## 3. Cập nhật `omp-audit-finalizer.ts`

1. Nhận thêm tham số `aiJobId?: string`:
   ```typescript
   export async function finalizeOmpAuditResult(caseId: string, aiJobId?: string): Promise<boolean>
   ```
2. Đọc thư mục sandbox qua `resolveJobSandboxDir(caseId, aiJobId)`.
3. Khi hoàn tất, gọi `updateAiJobStatusById(aiJobId, "completed", reportJson)` nếu có `aiJobId`, không làm ảnh hưởng các bản ghi cũ của Case.

---

## 4. Tiêu chí Nghiệm thu Phase 3
1. Khi chạy lại lần 2, thư mục của lần 1 (`storage/jobs/{caseId}/{jobId_1}`) vẫn còn nguyên vẹn 100% trên đĩa.
2. Sinh viên mở `/cases/:id` xem thanh Radar và Terminal live log vẫn hiển thị đầy đủ từng dòng log theo thời gian thực (không bị ngắt hoặc rỗng).
3. Các case cũ chạy trước thời điểm nâng cấp vẫn đọc được kết quả nhờ cơ chế fallback.
