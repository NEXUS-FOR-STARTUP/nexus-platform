# Phase 04: Atomic Write & Resilience

## Target
- `apps/api/src/modules/ai-engine/infrastructure/persistence/job-store.repository.ts`
- `apps/worker-omp/src/storage.ts`
- `apps/api/src/modules/ai-engine/application/omp-audit-finalizer.ts`
- `apps/api/src/modules/ai-engine/infrastructure/queue/omp-queue.ts`

## Context
File `jobs_db.json` bị hỏng (null bytes ở cuối) là do hiện tượng **non-atomic write** khi 2 môi trường (Host API và Worker Docker) cùng ghi đè trực tiếp lên 1 file lớn, dẫn tới race condition hoặc ghi dở dang lúc flush log.

Bằng cách áp dụng kỹ thuật **Atomic Write** (ghi vào file tạm `.tmp` rồi dùng `renameSync` ghi đè nguyên tử), hệ điều hành đảm bảo file luôn toàn vẹn 100%, không bao giờ xuất hiện tình trạng null bytes hay chuỗi dở dang.

Ngoài ra, dọn dẹp các đường dẫn tuyệt đối cũ trỏ tới sandbox (`E:/Workspace/test-agent-sanbox-web/...`) để tránh gây nhiễu khi chạy trong Docker Linux.

---

## Changes

### 1. Atomic Write cho API Repository
**File:** `apps/api/src/modules/ai-engine/infrastructure/persistence/job-store.repository.ts`

1. Xóa bỏ hardcoded Windows path `sandboxFile`:
   ```ts
   // Xóa bỏ dòng trỏ tới E:/Workspace/test-agent-sanbox-web/...
   ```
2. Cập nhật phương thức `writeList()` sang Atomic Write:
   ```ts
   private writeList(list: EvaluationJob[]): void {
     const raw = JSON.stringify(list, null, 2);
     const dir = resolve(this.primaryFile, "..");
     if (!existsSync(dir)) {
       mkdirSync(dir, { recursive: true });
     }
     const tmpFile = resolve(dir, `.jobs_db.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
     try {
       writeFileSync(tmpFile, raw, "utf-8");
       renameSync(tmpFile, this.primaryFile);
     } catch (err) {
       try { unlinkSync(tmpFile); } catch {}
       throw err;
     }
   }
   ```

### 2. Atomic Write & Tự khởi tạo cho Worker Storage
**File:** `apps/worker-omp/src/storage.ts`

1. Tại `flushLogsToStorage()` và `updateJobInStorage()`:
   * Nếu file `jobs_db.json` chưa tồn tại, khởi tạo mảng rỗng `[]` thay vì âm thầm `return`.
   * Ghi file bằng cơ chế atomic (tmp + renameSync):
   ```ts
   function atomicWriteJson(filePath: string, data: unknown): void {
     const dir = resolve(filePath, "..");
     const tmpFile = resolve(dir, `.jobs_db_w.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`);
     try {
       writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
       renameSync(tmpFile, filePath);
     } catch (err) {
       try { unlinkSync(tmpFile); } catch {}
       throw err;
     }
   }
   ```

### 3. Dọn dẹp đường dẫn Sandbox thừa trong `omp-queue.ts`
**File:** `apps/api/src/modules/ai-engine/infrastructure/queue/omp-queue.ts`

Xóa bỏ đường dẫn Windows sandbox `E:/Workspace/test-agent-sanbox-web/storage/jobs/...` trong hàm `getJobMilestones()`.

### 4. Cloudinary Retry trong Finalizer
**File:** `apps/api/src/modules/ai-engine/application/omp-audit-finalizer.ts`

Thêm 1 lần retry khi upload file báo cáo PDF lên Cloudinary thất bại trước khi chấp nhận fallback URL nội bộ:
```ts
} catch (uploadErr) {
  logger.warn({ caseId, uploadErr }, "Cloudinary upload failed, retrying once...");
  try {
    const retryRes = await uploadFile(pdfBuffer, `nexus/reports/${caseId}`, cloudinaryName, "raw");
    if (retryRes?.fileUrl) {
      pdfUrl = retryRes.fileUrl;
      pdfPublicId = retryRes.publicId;
    }
  } catch (retryErr) {
    logger.error({ caseId, retryErr }, "Cloudinary retry also failed, continuing with local PDF");
  }
}
```

---

## Acceptance
- [x] Mọi thao tác ghi `jobs_db.json` ở cả API và Worker đều thực hiện atomic (không bao giờ sinh ra file dở dang).
- [x] Không còn đường dẫn hardcoded `E:/Workspace/test-agent-sanbox-web/...` trong code.
- [x] Cloudinary upload có retry 1 lần khi gặp sự cố mạng.
- [x] `bun run check-types` pass hoàn toàn.
