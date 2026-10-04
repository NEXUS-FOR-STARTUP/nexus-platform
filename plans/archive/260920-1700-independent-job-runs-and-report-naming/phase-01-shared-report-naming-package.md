# Phase 1: Shared Report Naming Package (`@repo/validation`)

**Mục tiêu:** Tạo module chuẩn hóa duy nhất về quy tắc đặt tên file báo cáo PDF dùng chung giữa Backend (`apps/api`) và Frontend (`apps/web-1`), tuân thủ triệt để nguyên tắc DRY.

---

## 1. File mới: `packages/validation/src/report-naming.ts`

### Các hàm và kiểu dữ liệu:

```typescript
/**
 * Mã phân loại loại nộp bài sang slug tên file tiếng Việt không dấu
 */
export const SUBMISSION_TYPE_FILE_SLUGS: Record<string, string> = {
  initial: "lan_dau",
  resubmit: "da_sua",
  logic_check: "soi_logic",
};

/**
 * Nhãn hiển thị tiếng Việt tương ứng cho UI
 */
export const SUBMISSION_TYPE_DISPLAY_LABELS: Record<string, string> = {
  initial: "Lần đầu",
  resubmit: "Đã sửa",
  logic_check: "Soi logic",
};

/**
 * Chuyển tên dự án thành slug an toàn cho tên file (bỏ dấu, ký tự đặc biệt)
 * Ví dụ: "Farm2Dorm — Nông Sản Sạch" -> "farm2dorm_nong_san_sach"
 */
export function makeDownloadSlug(name: string): string {
  return (
    name
      .replace(/[đĐ]/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50) || "de_an"
  );
}

/**
 * Định dạng timestamp 14 ký tự chuẩn YYYYMMDDHHmmss
 */
export function formatReportTimestamp(date?: Date | string | null): string {
  const d = date ? new Date(date) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${validDate.getFullYear()}${pad(validDate.getMonth() + 1)}${pad(validDate.getDate())}${pad(validDate.getHours())}${pad(validDate.getMinutes())}${pad(validDate.getSeconds())}`;
}

/**
 * Lấy slug loại nộp bài cho tên file
 */
export function getSubmissionTypeFileSlug(submissionType?: string | null): string {
  if (!submissionType) return "phan_bien";
  return SUBMISSION_TYPE_FILE_SLUGS[submissionType] || "phan_bien";
}

export interface BuildReportPdfFilenameOptions {
  projectName: string;
  submissionType?: string | null;
  createdAt?: Date | string | null;
  versionNo?: number | null;
  /** Cho phép override loại báo cáo nếu không dùng submissionType (vd: reality_check, due_diligence) */
  customTypeSlug?: string;
}

/**
 * Tạo tên file PDF chuẩn hóa duy nhất toàn hệ thống:
 * Cấu trúc: {slug}_{loai_nop}_{timestamp}_v{version}.pdf
 * Ví dụ:
 * - farm2dorm_lan_dau_20260920143012_v01.pdf
 * - farm2dorm_soi_logic_20260920154500_v01.pdf
 * - farm2dorm_da_sua_20260921091520_v02.pdf
 */
export function buildStandardReportPdfFilename(opts: BuildReportPdfFilenameOptions): string {
  const slug = makeDownloadSlug(opts.projectName);
  const typeSlug = opts.customTypeSlug ? makeDownloadSlug(opts.customTypeSlug) : getSubmissionTypeFileSlug(opts.submissionType);
  const timestamp = formatReportTimestamp(opts.createdAt);
  const versionSuffix = opts.versionNo != null ? `_v${String(opts.versionNo).padStart(2, "0")}` : "";
  return `${slug}_${typeSlug}_${timestamp}${versionSuffix}.pdf`;
}
```

---

## 2. Export qua `packages/validation/src/index.ts`

Bổ sung export vào `packages/validation/src/index.ts`:

```typescript
export * from "./report-naming.js";
```

---

## 3. Tiêu chí Nghiệm thu Phase 1
1. Chạy `bun run check-types` ở root thành công, `@repo/validation` compile không lỗi.
2. Viết test unit cho `buildStandardReportPdfFilename` kiểm tra:
   - Đủ trường hợp: `initial`, `resubmit`, `logic_check`, `null/undefined`.
   - Chứa đúng timestamp của `createdAt`.
   - Có suffix version `_v01`, `_v02`.
   - Loại bỏ sạch sẽ ký tự tiếng Việt có dấu và ký tự đặc biệt.
