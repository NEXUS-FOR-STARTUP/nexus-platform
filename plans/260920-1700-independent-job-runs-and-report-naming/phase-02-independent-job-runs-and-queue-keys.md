# Phase 2: Độc lập Job ID, Dual-Key Queue & Cập nhật Repository

**Mục tiêu:** Xóa bỏ việc ghi đè (`upsert`), chuyển sang tạo bản ghi `AiJob` mới cho mỗi lượt chạy thẩm định; xây dựng cấu trúc Queue Key kép an toàn tuyệt đối cho BullMQ.

---

## 1. Cập nhật `ai-job.repository.ts`

### 1.1. Thêm hàm `createAiJobQueued` (thay thế việc `upsert` gán cứng):
```typescript
export interface CreateAiJobData {
  projectName: string;
  inputFilesCount: number;
  startedAt: string;
  submissionType: string;
  attemptNo: number;
  model: string;
  promptMode: string;
  lifecycleUnitId?: string | null;
  adminTriggered?: boolean;
  skipCreditCheck?: boolean;
  [key: string]: unknown;
}

export async function createAiJobQueued(caseId: string, data: CreateAiJobData) {
  const jsonPayload = data as unknown as Prisma.InputJsonValue;
  return await prisma.aiJob.create({
    data: {
      case_id: caseId,
      job_type: "omp_audit",
      status: "queued",
      input_json: jsonPayload,
    },
  });
}
```

### 1.2. Thêm hàm `updateAiJobStatusById` (Cập nhật chuẩn theo Primary Key):
```typescript
/**
 * Cập nhật trạng thái cho đúng MỘT job cụ thể (không làm ảnh hưởng các job cũ trong lịch sử)
 */
export async function updateAiJobStatusById(
  jobId: string,
  status: string,
  outputJson?: unknown,
) {
  return await prisma.aiJob.update({
    where: { id: jobId },
    data: {
      status,
      output_json: outputJson as any,
    },
  });
}
```

---

## 2. Chuẩn hóa BullMQ Queue Key kép (`omp-queue.ts`)

Để Queue Event listener luôn biết cả `caseId` và `aiJobId` mà không cần query redis payload:

```typescript
export function buildOmpQueueJobId(caseId: string, aiJobId: string): string {
  return `omp-${caseId}--${aiJobId}`;
}

export function parseOmpQueueJobId(queueJobId: string): { caseId: string; aiJobId?: string } {
  const raw = queueJobId.startsWith("omp-") ? queueJobId.replace(/^omp-/, "") : queueJobId;
  if (raw.includes("--")) {
    const [caseId, aiJobId] = raw.split("--");
    return { caseId, aiJobId };
  }
  // Tương thích ngược với các job cũ đang chờ dạng omp-<caseId>
  return { caseId: raw, aiJobId: undefined };
}

export interface OmpJobPayload {
  jobId: string;   // aiJob.id (UUID thực tế)
  caseId: string;  // case.id
  documentPath: string;
  documentOriginalName: string;
  title: string;
  model?: string;
  ompModel?: string;
  promptMode?: "full" | "lite";
  submissionType?: "initial" | "resubmit" | "logic_check";
  lifecycleUnitId?: string;
}
```

Trong `dispatchOmpJob`:
```typescript
export async function dispatchOmpJob(payload: OmpJobPayload): Promise<void> {
  const queueJobId = buildOmpQueueJobId(payload.caseId, payload.jobId);
  // ... hủy stale job cũ nếu cần và add vào queue với jobId = queueJobId
}
```

---

## 3. Cập nhật `omp-audit-coordinator.ts`

### 3.1. Khi kích hoạt thẩm định (`triggerOmpAuditForCase`):
1. Tính toán số thứ tự lượt chạy (`attemptNo`):
   ```typescript
   const attemptNo = (await prisma.aiJob.count({
     where: { case_id: caseId, job_type: "omp_audit" },
   })) + 1;
   ```
2. Gọi `createAiJobQueued` để tạo record mới với UUID sinh tự động.
3. Dispatch vào BullMQ mang cả `jobId = newJob.id` và `caseId`.

### 3.2. Cập nhật QueueEvents Listener (`initOmpQueueListener`):
```typescript
ompQueueEvents.on("active", async ({ jobId }) => {
  const { caseId, aiJobId } = parseOmpQueueJobId(jobId);
  logger.info({ caseId, aiJobId }, "BullMQ OMP job active event received");
  if (aiJobId) {
    await updateAiJobStatusById(aiJobId, "processing").catch(() => {});
  } else {
    await updateAiJobStatus(caseId, "processing").catch(() => {});
  }
});

ompQueueEvents.on("completed", async ({ jobId }) => {
  const { caseId, aiJobId } = parseOmpQueueJobId(jobId);
  logger.info({ caseId, aiJobId }, "BullMQ OMP job completed event received");
  const ok = await finalizeOmpAuditResult(caseId, aiJobId);
  if (!ok) {
    if (aiJobId) await updateAiJobStatusById(aiJobId, "failed", { error: "worker produced no output" });
    await refundAuditCreditIfNoReport(caseId, "finalize-no-output");
    await rollbackCaseStageOnFailure(caseId, "finalize-no-output");
  }
});

ompQueueEvents.on("failed", async ({ jobId, failedReason }) => {
  const { caseId, aiJobId } = parseOmpQueueJobId(jobId);
  logger.error({ caseId, aiJobId, failedReason }, "BullMQ OMP job failed event received");
  if (aiJobId) {
    await updateAiJobStatusById(aiJobId, "failed", { error: failedReason }).catch(() => {});
  } else {
    await updateAiJobStatus(caseId, "failed", { error: failedReason }).catch(() => {});
  }
  await refundAuditCreditIfNoReport(caseId, "worker-failed");
  await rollbackCaseStageOnFailure(caseId, "worker-failed");
});
```

---

## 4. Tiêu chí Nghiệm thu Phase 2
1. Chạy thẩm định lần 1 tạo ra row `ai_jobs` thứ nhất (`attempt_no = 1`).
2. Bấm Retry hoặc Resubmit tạo ra row `ai_jobs` thứ hai (`attempt_no = 2`), hàng cũ vẫn giữ nguyên trạng thái và thông tin model.
3. Queue listener xử lý mượt mà, phân rã chính xác `caseId` và `aiJobId`.
