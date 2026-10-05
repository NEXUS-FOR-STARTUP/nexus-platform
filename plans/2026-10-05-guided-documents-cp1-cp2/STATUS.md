# STATUS — Guided Documents (CP1–CP2) — 2026-10-05

> Feature: giúp người khởi nghiệp điền tài liệu qua template + Q&A, hệ thống tự sinh tài liệu (DOCX/PDF) để tải về; tài liệu này là nền tảng cho đánh giá phản biện checkpoint 2→4.
> Plan đầy đủ: `plan.md` (573 dòng, Q1–Q4 đã resolved).

## Tóm tắt trạng thái

| # | Phase | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Đọc tài liệu, xác định hướng | ✅ done | |
| 2 | Khảo sát code (scouts) | ✅ done | |
| 3 | Phản biện thiết kế | ✅ done | |
| 4 | Viết + kiểm tra plan | ✅ done | `plan.md` |
| 5 | **P0** Foundation | ✅ done | deps: docx@9.8.1, mammoth@1.13.0, pdf-parse@2.4.5 (vào `apps/api` = package `nexus-platform-api`) |
| 6 | **P1** Migration (create-only) | ⏸️ **TẠM DỪNG (user 2026-10-05)** | Schema + SQL đã soạn xong nhưng **chưa commit, chưa apply**. Drift DB local chưa fix. P3/P4/P6 vẫn blocked. Muốn tiếp tục: fix drift trước, rồi review SQL, apply, `prisma generate`. |
| 7 | **P2** Catalog | ✅ done | `packages/validation/src/catalogs/*` |
| 8 | **P3** API authoring | ✅ done | commit `ad97ddb` — 10 routes `/api/authoring`, DB-free tests 10/10; runtime chờ P1 apply |
| 9 | **P4** Frontend workspace UI | 🔒 blocked by P3 | |
| 10 | **P5** Routing fix | ✅ done | `resolveOmpAuditCheckpoint` |
| 11 | **P6** Hardening | 🔒 blocked by P1 | |

## Đã hoàn thành — chi tiết

### P0 (Foundation)
- Deps cài vào `apps/api`: `docx@9.8.1`, `mammoth@1.13.0`, `pdf-parse@2.4.5`.
- Verified API usage:
  - `mammoth.extractRawText({ buffer })`
  - `import { PDFParse } from "pdf-parse"` → `new PDFParse({ data }).getText()` + `.destroy()` (default export undefined, dùng named `PDFParse`)
  - `docx` `Document`/`Packer` render được (9.4KB).
- Thêm test script `"test": "tsx --test src/__tests__/*.test.ts"` vào `packages/validation/package.json` (18 test sẵn pass).

### P2 (Catalog)
- `packages/validation/src/catalogs/`: `types.ts`, `questions.ts` (48 câu: 22 CP1 + 26 CP2, Vietnamese-first), `cp1.ts`, `cp2.ts`, `validate-catalog.ts` (fail-fast: cycle / missing question_id / invalid classification), `index.ts` (barrel + `CATALOG_VERSION`).
- Test: `packages/validation/src/__tests__/catalog-validation.test.ts` (24 test pass).
- Report: `plans/reports/2026-10-05-P2-catalog.md`.

### P5 (Routing fix)
- `apps/api/src/modules/reports/infrastructure/persistence/report.repository.ts`:
  - Thêm `resolveOmpAuditCheckpoint()` — ưu tiên: (1) checkpoint của lifecycle unit, (2) `case.current_checkpoint`, (3) `latest_version_no` cao nhất, (4) tạo CP1 fallback.
  - `saveOmpAuditReport` giờ route đúng checkpoint thay vì `orderBy created_at asc` (lỗi cũ luôn lấy CP1).
- `apps/api/src/modules/ai-engine/omp-audit.service.ts`: extract `resolveAuditPromptFileName()`.
- `apps/api/src/modules/ai-engine/application/omp-audit-finalizer.ts`: stamp `prompt_version` + `prompt_mode` vào `metadataJson`.
- Test: `apps/api/src/shared/infrastructure/tests/assessment-routing.test.ts` (6/6 pass).
- Type-check toàn monorepo: ✅ pass (exit 0).

## CHỜ QUYẾT ĐỊNH — P1 (migration)

**Cần user gõ "ok P1" để dispatch.** Lý do: dự án có DB safety gate (`.agents/rules/prisma-migration-safety.md`) — migration phải có xác nhận, không tự chạy.

Nội dung P1 (chỉ THÊM, không sửa/xoá):
- 4 bảng mới: `project_answers`, `answer_revisions`, `import_proposals`, `authoring_jobs`
- 1 enum doc type: `generated_document`
- 1 unit code: `gNN`

An toàn: DB đang trỏ `localhost` (local dev, không phải production VPS). Quy trình: `prisma migrate dev --create-only` → user xem SQL → duyệt → `migrate dev` apply.

## QUYẾT ĐỊNH SẢN PHẨM — ĐÃ DUYỆT (user 2026-10-05)

User duyệt theo khuyến nghị (Q5–Q9). Chi tiết đầy đủ → `plan.md` §14. Đây là chữ ký cuối — không code gì thêm khi chưa duyệt.

## BƯỚC TIẾP THEO (khi resume)

1. Hỏi/xác nhận P1 từ user.
2. Dispatch agent P1 (migration create-only).
3. Sau P1: **P6 (worker — merge DOCX trước, AI polish sau)** → rồi **P4 (frontend — Luồng 1 guided Q&A trước)**.
4. Template Builder (Q1 hướng tới B) = phase riêng, thiết kế sau khi lõi chạy.

## Context kỹ thuật cần nhớ

- Package names: `apps/api` = `nexus-platform-api`; `packages/validation` = `@repo/validation`.
- P3 sẽ import từ barrel catalog: `cp1`, `cp2`, `QUESTION_REGISTRY`, `validateCatalog`, `CATALOG_VERSION`.
- Checkpoint đánh giá: nền tảng tài liệu → route đúng checkpoint (P5 đã sửa).
- RunId đã dispatch trước đó (đã xong): P2 = `7a109441-de13-4913-b9ed-1dda8c099e5a`, P5 = `1657a06f-8b05-429d-8647-95599af02c10`.
