# Phase 2: Mở rộng Coordinator & Dịch vụ Quản trị Worker

**Tập tin mục tiêu:**
1. `apps/api/src/modules/ai-engine/application/omp-audit-coordinator.ts`
2. `apps/api/src/modules/admin/application/admin-workers.service.ts`

---

## 1. Mở rộng `omp-audit-coordinator.ts`

### 1.1. Cập nhật `TriggerOptsSchema` và `triggerOmpAuditForCase`
Thêm các tùy chọn mới:
```typescript
const TriggerOptsSchema = z.object({
  submission_type: SubmissionTypeSchema.default("initial"),
  lifecycle_unit_id: z.string().uuid().optional(),
  model: z.string().optional(),
  prompt_mode: z.enum(["full", "lite"]).optional(),
  skip_credit_check: z.boolean().optional(),
  admin_triggered: z.boolean().optional(),
  force_supersede: z.boolean().optional(),
});
```

### 1.2. Logic Bỏ qua Trừ Credit khi Admin Retry
Trong khối transaction `prisma.$transaction(async (tx) => { ... })`:
```typescript
const skipCredit = opts?.skip_credit_check === true;

if (!skipCredit) {
  const inTxBalance = await getCreditBalanceForTx(tx, caseId);
  if (inTxBalance < 1) {
    throw new AppError(402, "NO_CREDITS", "Hết credit. Vui lòng mua thêm credit để tiếp tục.");
  }

  await createCreditEntry(tx, {
    caseId,
    amount: -1,
    balanceAfter: inTxBalance - 1,
    type: "consumption",
    referenceId: caseId,
    idempotencyKey,
  });
}
```

### 1.3. Lưu trữ Metadata & Dispatch sang BullMQ với Model ghi đè
- Ghi vào `ai_jobs.input_json`:
```typescript
input_json: {
  submission_type: submissionType,
  lifecycle_unit_id: lifecycleUnitId ?? null,
  startedAt,
  model: opts?.model,
  prompt_mode: opts?.prompt_mode ?? "full",
  skip_credit_check: opts?.skip_credit_check ?? false,
  admin_triggered: opts?.admin_triggered ?? false,
}
```
- Khi gọi `dispatchOmpJob`:
```typescript
await dispatchOmpJob({
  jobId: caseId,
  documentPath: resolve(jobDir, "input", primaryFileName),
  documentOriginalName: primaryFileName,
  title: projectName,
  ompModel: opts?.model || process.env.OMP_MODEL || "mimo/mimo-v2.5",
  promptMode: opts?.prompt_mode ?? "full",
  submissionType,
  lifecycleUnitId: resolvedLifecycleUnitId ?? undefined,
});
```
- Trong `jobStore.set`:
```typescript
message: opts?.admin_triggered
  ? `[Quản trị viên] Bắt đầu chạy lại thẩm định với mô hình ${opts?.model || "mặc định"}`
  : `Khởi tạo tiến trình thẩm định đề án ${projectName} - Mã case ${caseRecord.case_code}`
```

### 1.4. Xử lý Tránh 409 AUDIT_IN_PROGRESS & Chống Lạm phát Credit khi Hoàn tiền
1. **Tránh 409 AUDIT_IN_PROGRESS khi Admin Retry**:
   - Tại dòng 370-373 của `omp-audit-coordinator.ts`:
     ```typescript
     const inTxJob = await tx.aiJob.findFirst({ where: { case_id: caseId, job_type: "omp_audit" }, orderBy: { created_at: "desc" } });
     if (inTxJob && (inTxJob.status === "queued" || inTxJob.status === "processing")) {
       if (opts?.force_supersede || opts?.admin_triggered) {
         // Ghi đè hủy job cũ đang kẹt
         await tx.aiJob.update({
           where: { id: inTxJob.id },
           data: { status: "cancelled", output_json: { reason: "Superseded by admin retry", cancelledAt: new Date().toISOString() } },
         });
       } else {
         throw new AppError(409, "AUDIT_IN_PROGRESS", "Đã có tiến trình thẩm định đang chạy. Vui lòng đợi hoàn thành.");
       }
     }
     ```
2. **Chống lạm phát Credit (Double Refund Prevention)**:
   - Trong `refundAuditCreditIfNoReport(caseId, reason)`:
     ```typescript
     const job = await findLatestAiJobByCase(caseId);
     const inputJson = job?.input_json as { startedAt?: string; admin_triggered?: boolean; skip_credit_check?: boolean } | null;
     // Nếu job này do Admin chạy lại miễn phí (skip_credit_check: true), KHÔNG hoàn credit vào ví
     if (inputJson?.skip_credit_check === true || inputJson?.admin_triggered === true) {
       logger.info({ caseId, reason }, "Skipping refund: this job was triggered by admin with credit check bypassed");
       return false;
     }
     ```

---

## 2. Xây dựng `admin-workers.service.ts`

Tạo mới `apps/api/src/modules/admin/application/admin-workers.service.ts` triển khai các nghiệp vụ:

### 2.1. `getAdminWorkerStats()`
1. Đọc số liệu BullMQ:
   ```typescript
   const counts = await ompQueue.getJobCounts();
   ```
2. Query Postgres `prisma.aiJob`:
   ```typescript
   const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
   const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

   const [completed24h, failed24h, stuckCount] = await Promise.all([
     prisma.aiJob.count({
       where: { job_type: "omp_audit", status: "completed", updated_at: { gte: since24h } },
     }),
     prisma.aiJob.count({
       where: { job_type: "omp_audit", status: { in: ["failed", "cancelled"] }, updated_at: { gte: since24h } },
     }),
     prisma.aiJob.count({
       where: { job_type: "omp_audit", status: { in: ["queued", "processing"] }, updated_at: { lt: tenMinutesAgo } },
     }),
   ]);
   ```
3. Trả về `AdminWorkerStatsResponse`.

### 2.2. `listAdminWorkerJobs(query: AdminWorkerJobListQuery)`
- Tính toán `skip = (query.page - 1) * query.limit`.
- Xây dựng điều kiện `where`:
  - `job_type: "omp_audit"`
  - Xử lý filter `status`:
    - `active` -> `status: "processing"`
    - `waiting` -> `status: "queued"`
    - `completed` -> `status: "completed"`
    - `failed` -> `status: { in: ["failed", "cancelled"] }`
    - `stuck` -> `status: { in: ["queued", "processing"] }, updated_at: { lt: tenMinutesAgo }`
  - Xử lý `search`: tìm kiếm không phân biệt hoa thường trong `case_code` hoặc `team_name`.
- Thực hiện `findMany` kết hợp quan hệ `case` và `case.user`.
- Map danh sách sang `AdminWorkerJobListItem[]` (tính `durationMs` và cờ `isStuck`).

### 2.3. `getAdminWorkerJobDetail(jobId: string)`
- Tìm `ai_jobs` theo `id` hoặc `case_id`.
- Đọc milestones: `getJobMilestones(caseId)`.
- Quét thư mục `storage/jobs/<caseId>` (lấy file size và file name của input/output).
- Query báo cáo mới nhất từ `prisma.report` (nếu có).
- Trả về `AdminWorkerJobDetailResponse`.

### 2.4. `retryAdminWorkerJob(caseId: string, body: AdminRetryJobBody, adminUserId: string)`
- Gọi `cancelOmpJob(caseId)` để xóa job đang chờ trong BullMQ nếu có.
- Đánh dấu job đang chạy trước đó (nếu có) thành `cancelled`.
- Gọi `triggerOmpAuditForCase(caseId, { model: body.model, prompt_mode: body.promptMode, skip_credit_check: true, admin_triggered: true, force_supersede: true })`.
- Tạo `CaseEvent` với `event_type: "ADMIN_RETRY_AI_JOB"`, `actor_auth_user_id: adminUserId`.

### 2.5. `healStuckAdminWorkerJob(caseId: string, adminUserId: string, reason?: string)`
- Gọi `cancelOmpJob(caseId)`.
- Cập nhật `ai_jobs` thành `status = 'failed'` kèm lý do can thiệp của admin.
- Gọi `refundAuditCreditIfNoReport(caseId, reason || "admin-healed-stuck")`.
- Rollback `case.user_facing_stage`: nếu đã có report chuyển về `report_ready`, ngược lại chuyển về `intake_ready`.
- Tạo `CaseEvent` với `event_type: "ADMIN_HEALED_STUCK_JOB"`.

### 2.6. `cancelAdminWorkerJob(caseId: string, adminUserId: string)`
- Gọi `cancelOmpAuditForCase(caseId)`.
- Tạo `CaseEvent` với `event_type: "ADMIN_CANCEL_AI_JOB"`.

---

## 3. Tiêu chí Nghiệm thu Phase 2
- [ ] `triggerOmpAuditForCase` hỗ trợ tham số ghi đè `model` và `skip_credit_check: true` mà không báo lỗi 402 hoặc trừ tiền.
- [ ] Toàn bộ 6 hàm service trong `admin-workers.service.ts` được triển khai đầy đủ, bắt lỗi và log structured pino.
- [ ] Typecheck `bun run check-types` vượt qua sạch sẽ.
