# Phase 02 — Document Model (#12)

- Priority: P0 | Status: Done | Effort: 8h
- Depends: Phase 01 | Blocks: Phase 03

## Overview

Bỏ khái niệm "tài liệu chính" — mọi tài liệu intake bình đẳng, mỗi tài liệu gắn 1 category code. Thêm soft-supersede để nộp lại không double-count. Sửa 2 bug kỹ thuật: doc_type bị label tiếng Việt đè, unit_code "intake"→"v00".

## Requirements

- Không còn "tài liệu chính" — show hết toàn bộ tài liệu (bỏ show-1-vs-show-nhiều).
- Category codes: `idea_report | pitch_deck | competitor_analysis | customer_research | task_assignment | other`, lưu `metadata_json.category`.
- FE gửi **code** (không label); BE map code→label (single source ở `packages/validation`).
- Nộp lại → record cũ ngoài bộ mới → `superseded_at = now`; user read filter `superseded_at null`.
- Giữ `is_primary` field (report artifacts depend) — chỉ đổi FE label "Tài liệu chính"→category label.
- Legacy Vietnamese-label docs để nguyên (display-only, no backfill).

## Architecture

### 1. Migration `superseded_at` (additive)

`prisma/schema.prisma:414-450` `DocumentRecord` thêm:
```prisma
superseded_at DateTime?
@@index([case_id, superseded_at])
```
- Quy trình an toàn: `prisma migrate dev --create-only` → review SQL → `migrate deploy`. **KHÔNG** destructive ops (đọc `.agents/rules/prisma-migration-safety.md`).

### 2. Category map (shared)

`packages/validation/src/` thêm `DOCUMENT_CATEGORY_CODES` + `docCategoryLabel(code)` — single source FE↔BE. `doc_type` record giữ `"intake_document"` (ngữ nghĩa hệ thống).

### 3. Soft-supersede (BE)

- `submit-intake.usecase.ts:77-87`: sau `upsertDocumentRecordsForUnit` → mark mọi record của unit KHÔNG nằm trong bộ mới `superseded_at=now`.
- `document.repository.ts:119-129` `findDocumentRecordsByCaseId`: thêm filter `superseded_at null` (user read path).
- Admin raw view giữ hết + badge "đã thay thế" (superseded_at ≠ null).

### 4. Fix kỹ thuật

- `document.repository.ts:77`: `doc.doc_type || doc.document_type || defaultDocType` — **Red-team fix M5:** hàm này dùng chung 3 luồng (intake defaultDocType `intake_document`, revision `revision_document`, supporter output). KHÔNG sửa ngang cho mọi luồng — thêm param `category?: string` (hoặc `metadataFactory`) chỉ intake truyền vào: category code → `metadata_json.category`; `doc_type` LUÔN = defaultDocType (system type). FE contract: `IntakeDocument.document_type` mang **code**; BE intake map code → metadata.
- `submit-intake.usecase.ts:81`: `unit_code: "intake"` → `"v00"` (khớp unit thật).

### 5. Read paths (phân biệt rõ)

- `findDocumentRecordsByCaseId` (user workspace + case detail): filter `superseded_at null` — user chỉ thấy bộ mới.
- `listAdminDocumentsUseCase` (admin global raw table): KHÔNG filter — giữ nguyên + badge "đã thay thế" khi `superseded_at ≠ null`. Không dùng chung query với user.
- Rollback: nếu phải revert, phải **cặp đôi** — revert cả filter lẫn cột (chỉ revert 1 bên → user thấy lại toàn bộ doc cũ).

## Related Code Files

| File | Action |
|---|---|
| `prisma/schema.prisma` (414-450) | SỬA: +`superseded_at` + index `[case_id, superseded_at]` trên DocumentRecord |
| `packages/validation/src/index.ts` | SỬA: +`DOCUMENT_CATEGORY_CODES` + `docCategoryLabel` |
| `apps/api/src/modules/documents/application/document.repository.ts` (52-103, 119-129, 224-254) | SỬA: buildDocumentRecordInput đặt category vào metadata_json; findDocumentRecordsByCaseId filter superseded_at null; upsertDocumentRecordsForUnit mark superseded |
| `apps/api/src/modules/cases/application/submit-intake.usecase.ts` (45-87) | SỬA: unit_code v00; sau upsert mark superseded record cũ |
| `apps/web-1/app/intake/_components/DocumentInputStep.tsx` | SỬA: DOCUMENT_TYPE_OPTIONS gửi code (label map riêng) |
| `apps/web-1/_types/document-workspace.types.ts` (56-58) | SỬA: grouping theo category; label switch is_primary→category; +superseded flag |
| `apps/api/src/shared/infrastructure/tests/` | TẠO: supersede integration test |

## Implementation Steps

1. Migration: sửa schema.prisma → `prisma migrate dev --create-only` → review SQL → `migrate deploy`.
2. `packages/validation`: thêm category codes + label map.
3. `document.repository.ts`: fix doc_type overwrite (category vào metadata_json); filter superseded_at null ở read path.
4. `submit-intake.usecase.ts`: unit_code "v00"; sau upsert → mark superseded record cũ (trong tx).
5. FE DocumentInputStep: DOCUMENT_TYPE_OPTIONS gửi code; label render qua `docCategoryLabel`.
6. FE document-workspace.types: grouping theo category, label switch, +superseded flag.
7. Integration test: nộp intake 2 lần → record cũ superseded_at set, read path trả bộ mới nhất.
8. `npm run check-types` + `npm test`.

## Todo List

- [x] Migration `superseded_at` (--create-only + review + deploy) — NOTE: migrate dev bị drift có sẵn (đòi reset → bị chặn); tạo migration SQL thủ công + `migrate deploy` OK
- [x] Category codes + label map (shared validation)
- [x] Fix doc_type overwrite (document.repository.ts:77)
- [x] Filter superseded_at null ở findDocumentRecordsByCaseId
- [x] unit_code "intake"→"v00" (submit-intake.usecase.ts:81)
- [x] Mark superseded sau upsertDocumentRecordsForUnit (submit-intake.usecase.ts:77-87)
- [x] FE: DOCUMENT_TYPE_OPTIONS gửi code; label render qua map
- [x] FE: document-workspace.types.ts grouping + label switch + superseded flag — RESOLVED post-review: BE payload expose `category` (document-contract.ts `DocumentFile.category`); grouping qua `document-groups.ts` `buildCategoryGroups`; label qua `docCategoryLabel` (buildSupportFlowRows); superseded: admin badge + opacity `AdminDocumentsTable.tsx` + user read filter `superseded_at null`
- [x] Integration test supersede (unit-level, fake client + prisma stub)
- [x] `npm run check-types` + `npm test` PASS

## Success Criteria

- Admin/user thấy cùng bộ tài liệu (hết mâu thuẫn nhiều-vs-1), hiển thị đúng category label.
- Nộp lại không double-count: record cũ superseded, user chỉ thấy bộ mới.
- Không còn label tiếng Việt đè doc_type; unit_code khớp "v00".
- Migration deploy sạch (additive, no data loss).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Migration lỗi trên prod (Supabase) | Thấp | Cao | --create-only + review SQL + migrate deploy; additive nullable cột |
| Mark superseded sót record (user thấy doc cũ lẫn mới) | Trung bình | Trung bình | Integration test so sánh set; mark theo "not in new set" |
| Report artifact depend `is_primary` | Trung bình | Trung bình | Giữ field is_primary, chỉ đổi FE label |
| Legacy Vietnamese-label doc hiển thị lệch category | Thấp | Thấp | Display-only fallback, no backfill |

## Next Steps

→ Phase 03: Completion flow (machine T17/T14/T19 + FE).
