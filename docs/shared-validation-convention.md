# Shared Validation Convention

## Rule 1: All zod schemas live in @repo/validation

- Request validation (input DTO)
- Response types visible to FE
- Entity types shared FE↔BE
- AI output schemas (Gemini structured output)

## Rule 2: All new modules must use @repo/validation

- `http/*.schema.ts` imports from `@repo/validation`, never defines own zod
- FE imports types from `@repo/validation`, never copies Prisma
- Schemas inlined in `packages/validation/src/index.ts` (Turbopack can't resolve `.js` ext in package re-exports)

## Rule 3: Domain types vs validation types

- `domain/` = business enums, pure interfaces, workflow rules (NO zod imports)
- `@repo/validation` = zod schemas, inferred types for FE↔BE sharing
- BE-internal DTOs stay in module `application/*.dto.ts`

## Rule 4: New entity types

- After adding Prisma model → add zod schema to `@repo/validation` (even if only FE imports type)
- FE deletes hand-written DTO, re-exports from `@repo/validation`
- FE interfaces with nested Prisma relations (e.g., `Case` with `owner?`, `members[]`) may keep local interface — re-export base entity from `@repo/validation`, extend locally

## Rule 5: Cleanup checklist

- Delete file → grep importers → if 0, safe delete
- After delete → run `bun run knip` → verify warnings
- After schema migration → run `check-types` + `build` as gate

## Rule 6: Shared Report Naming Standard (`packages/validation/src/report-naming.ts`)

- **Pattern chuẩn hóa:** `${slug}_${submission_type}_${timestamp}_v${version}.pdf`
- **Single Source of Truth:** Toàn bộ logic đặt tên file PDF báo cáo phản biện tập trung trong `@repo/validation` (`report-naming.ts`).
- **Hàm và hằng số dùng chung:**
  - `buildStandardReportPdfFilename(opts: BuildReportPdfFilenameOptions): string`
  - `makeDownloadSlug(name: string): string` — khử dấu tiếng Việt (`đ/Đ` -> `d`), loại bỏ ký tự đặc biệt, giới hạn tối đa 50 ký tự, fallback `de_an`.
  - `formatReportTimestamp(date?: Date | string | null): string` — định dạng 14 ký tự chuẩn `YYYYMMDDHHmmss`.
  - `getSubmissionTypeFileSlug(submissionType?: string | null): string` — ánh xạ:
    - `initial` -> `lan_dau`
    - `resubmit` -> `da_sua`
    - `logic_check` -> `soi_logic`
    - fallback -> `phan_bien`
  - Hỗ trợ `customTypeSlug` để override loại báo cáo đặc thù khi cần thiết.
  - Version suffix: `_v${String(versionNo).padStart(2, "0")}` (ví dụ `_v01`, `_v02`); tự động lược bỏ khi `versionNo` là null/undefined/NaN.
- **Nghiêm cấm:** Tự ghép chuỗi tên file thủ công phân mảnh ở Backend hay Frontend. Cả `pdfService.ts`, `reports.controller.ts`, `report-rows.ts` (Tab Tài liệu), và `RoundCard.tsx` (Tab Kết quả phản biện) đều phải import trực tiếp từ `@repo/validation`.
