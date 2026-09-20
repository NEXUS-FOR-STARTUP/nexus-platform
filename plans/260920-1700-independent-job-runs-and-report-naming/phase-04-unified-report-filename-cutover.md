# Phase 4: Đồng bộ Hóa Tên File Báo cáo PDF Toàn Hệ thống (BE + FE)

**Mục tiêu:** Thay thế hoàn toàn mọi điểm ghép chuỗi tên file thủ công ở cả Backend và Frontend bằng hàm helper duy nhất `buildStandardReportPdfFilename` từ `@repo/validation`. Triệt tiêu hoàn toàn sự lệch pha tên file giữa các tab.

---

## 1. Cập nhật Backend (`apps/api`)

### 1.1. `apps/api/src/modules/reports/infrastructure/pdf/pdfService.ts`
Chuyển hướng hàm `buildReportPdfFilename` sang sử dụng trực tiếp hàm từ `@repo/validation`:
```typescript
import { buildStandardReportPdfFilename } from "@repo/validation";

export function buildReportPdfFilename(opts: {
  projectName: string;
  reportType?: string;
  submissionType?: string | null;
  markdown?: string;
  createdAt?: Date | string | null;
  versionNo?: number | null;
}): string {
  return buildStandardReportPdfFilename({
    projectName: opts.projectName,
    submissionType: opts.submissionType,
    createdAt: opts.createdAt,
    versionNo: opts.versionNo,
    customTypeSlug: opts.reportType,
  });
}
```

### 1.2. `apps/api/src/modules/ai-engine/application/omp-audit-finalizer.ts`
Khi lưu bản ghi tài liệu vào bảng `document_records` (`upsertReportArtifactDocumentRecord`), truyền đúng `submissionType`:
```typescript
const reportFilename = buildReportPdfFilename({
  projectName,
  submissionType,
  createdAt: savedReport.created_at,
  versionNo,
});

await upsertReportArtifactDocumentRecord(
  caseId,
  savedReport.checkpoint_id,
  savedReport.lifecycle_unit_id,
  null,
  savedReport.id,
  savedReport.created_by,
  prisma,
  {
    fileUrl: pdfUrl,
    downloadUrl: pdfUrl,
    cloudinaryPublicId: pdfPublicId,
    originalName: reportFilename, // <-- Tên file chuẩn hóa có submissionType và timestamp
    extension: "pdf",
    mimeType: "application/pdf",
  },
);
```

### 1.3. `apps/api/src/modules/reports/http/reports.controller.ts`
Trong cả 2 handler tải PDF (`downloadCaseReportPdfHandler` và `downloadReportPdfByIdHandler`):
1. Lấy `submissionType = (parsed?.submission_type as string | undefined) ?? null`.
2. Gọi `buildReportPdfFilename` có truyền `submissionType`.
3. Gắn header `Content-Disposition` với filename chuẩn này.

---

## 2. Cập nhật Frontend (`apps/web-1`)

### 2.1. `apps/web-1/app/dashboard/case/[id]/_components/documents/report-rows.ts`
Thay thế đoạn mã hardcode dòng 23-29:
```typescript
import { buildStandardReportPdfFilename } from "@repo/validation";

// Thay thế:
// const fileName = `${slug}_bao_cao_phan_bien_${vLabel}.pdf`;

// Thành:
const fileName = buildStandardReportPdfFilename({
  projectName: rawName,
  submissionType: round.submission_type,
  createdAt: round.submitted_at || round.report?.created_at,
  versionNo: round.version_no,
});
```

### 2.2. `apps/web-1/app/dashboard/case/[id]/_components/report.utils.ts`
Cập nhật hàm `getReportPdfFilename`:
```typescript
import { buildStandardReportPdfFilename } from "@repo/validation";

export function getReportPdfFilename(
  projectName: string,
  createdAt?: string | Date | null,
  submissionType?: string | null,
  versionNo?: number | null,
): string {
  return buildStandardReportPdfFilename({
    projectName,
    createdAt,
    submissionType,
    versionNo,
  });
}
```

### 2.3. `apps/web-1/app/dashboard/case/[id]/_components/RoundCard.tsx`
Cập nhật `reportFilename` useMemo để truyền thêm `round.submission_type` và `round.version_no`:
```typescript
const reportFilename = useMemo(
  () => getReportPdfFilename(projectName, round.report?.created_at, round.submission_type, round.version_no),
  [projectName, round.report?.created_at, round.submission_type, round.version_no],
);
```

---

## 3. Tiêu chí Nghiệm thu Phase 4
1. Trường hợp 2 lần đánh giá trong cùng 1 version của case NX-785364:
   - Lần 1: Hiển thị `farm2dorm_lan_dau_20260920143012_v01.pdf`
   - Lần 2: Hiển thị `farm2dorm_soi_logic_20260920154500_v01.pdf`
2. Tên hiển thị trong cột **Tên file báo cáo** (Tab Tài liệu), tên tại **Tab Báo cáo phản biện**, và tên file khi bấm **Tải về** khớp nhau 100% từng ký tự.
