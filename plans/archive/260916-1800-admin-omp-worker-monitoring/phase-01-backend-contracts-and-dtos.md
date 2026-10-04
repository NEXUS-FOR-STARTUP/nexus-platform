# Phase 1: Hợp đồng Dữ liệu & DTO Backend

**Tập tin mục tiêu:** `apps/api/src/modules/admin/application/admin-workers.dto.ts`  
**Mục đích:** Định nghĩa toàn bộ Zod schemas, TypeScript types cho việc trao đổi dữ liệu giữa Frontend và Backend trong module quản trị worker.

---

## 1. Nội dung Chi tiết Cần Triển Khai

Tạo mới tập tin `apps/api/src/modules/admin/application/admin-workers.dto.ts` bao gồm:

### 1.1. Thống kê Hàng đợi (Queue & Worker Stats)
```typescript
export interface AdminWorkerStatsResponse {
  concurrencyLimit: number;    // Giới hạn chạy song song (mặc định 2)
  activeCount: number;         // Số job đang chạy thực tế trong BullMQ
  waitingCount: number;        // Số job đang nằm trong hàng đợi chờ slot
  completed24hCount: number;   // Số job hoàn thành trong 24 giờ qua
  failed24hCount: number;      // Số job thất bại/hủy trong 24 giờ qua
  stuckCount: number;          // Số job nghi kẹt (> 10 phút chưa hoàn tất)
  avgDurationMs24h: number;    // Thời lượng chạy trung bình (ms) trong 24h
}
```

### 1.2. Danh sách Job Giám sát (Job List Query & Item)
```typescript
import { z } from "zod";

export const AdminWorkerJobListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["all", "active", "waiting", "completed", "failed", "stuck"]).default("all"),
  search: z.string().trim().optional(),
});

export type AdminWorkerJobListQuery = z.infer<typeof AdminWorkerJobListQuerySchema>;

export interface AdminWorkerJobListItem {
  id: string;
  caseId: string;
  caseCode: string;
  projectName: string;
  studentName: string;
  studentEmail: string;
  status: string;              // queued | processing | completed | failed | cancelled
  isStuck: boolean;            // true nếu status in (queued, processing) && updated_at < now - 10m
  submissionType: string;      // initial | resubmit | logic_check
  model: string;               // gemini-2.5-flash | claude-3-5-sonnet | mimo-v2.5...
  startedAt: string;
  updatedAt: string;
  durationMs: number;
}

export interface AdminWorkerJobListResponse {
  items: AdminWorkerJobListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### 1.3. Chi tiết Job & File Sandbox (Job Detail Response)
```typescript
export interface JobSandboxFileInfo {
  name: string;
  sizeBytes: number;
  extension: string;
  downloadPath?: string;
}

export interface AdminWorkerJobDetailResponse {
  id: string;
  caseId: string;
  caseCode: string;
  projectName: string;
  student: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  isStuck: boolean;
  submissionType: string;
  model: string;
  promptMode: "full" | "lite";
  startedAt: string;
  updatedAt: string;
  durationMs: number;
  milestones: {
    sandboxReady: boolean;
    triadPacket: boolean;
    auditReport: boolean;
    reportJson: boolean;
  };
  inputFiles: JobSandboxFileInfo[];
  outputFiles: JobSandboxFileInfo[];
  reportSummary?: {
    id: string;
    overallScore: number | null;
    scores: Record<string, number> | null;
    pdfUrl: string | null;
    createdAt: string;
  } | null;
  failedReason?: string | null;
  inputSnapshot?: {
    idea?: Record<string, unknown>;
    team?: Record<string, unknown>;
  } | null;
}
```

### 1.4. Yêu cầu Can thiệp (Action Request Bodies)
```typescript
export const AdminRetryJobBodySchema = z.object({
  model: z.string().trim().min(1).optional(),
  promptMode: z.enum(["full", "lite"]).default("full"),
  clearOldSandbox: z.boolean().default(true),
});

export type AdminRetryJobBody = z.infer<typeof AdminRetryJobBodySchema>;

export const AdminHealStuckBodySchema = z.object({
  reason: z.string().trim().optional(),
});

export type AdminHealStuckBody = z.infer<typeof AdminHealStuckBodySchema>;
```

---

## 2. Tiêu chí Nghiệm thu Phase 1 (Acceptance Criteria)
- [ ] Tập tin `apps/api/src/modules/admin/application/admin-workers.dto.ts` được tạo và export đầy đủ các interface và Zod schema.
- [ ] Zod schema validate chính xác các kiểu query và body, có giá trị default an toàn.
- [ ] Kiểm tra type check `bun run check-types` không có lỗi.
