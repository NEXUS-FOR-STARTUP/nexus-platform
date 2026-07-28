# Document Upload MVP

**Date**: 2026-07-01 15:44
**Severity**: Medium
**Component**: Documents module (`apps/api/src/modules/documents/`)
**Status**: Ongoing

## What Happened

Plan post-intake document upload pipeline với Cloudinary. 6 phases tách biệt:

1. **Lock contracts** — xác định write mode split, MIME policy, upload-first semantics
2. **Shared upload pipeline** — Cloudinary helper, cleanup-on-DB-fail, derive server-side metadata
3. **Revision upgrade** — user revision từ URL-only thành file upload
4. **Supporter output** — supporter trả output tài liệu qua file upload
5. **UI modals** — modal actions cho revision, output, evidence upload
6. **Verification** — integration tests + migration cleanup

Status: **pending**. Plan chưa được execute như một effort thống nhất.

## The Brutal Truth

260701-1544 là plan thiết kế tốt nhưng chết yểu. 6 phases thiết kế tuần tự hợp lý, decisions locked chặt — nhưng chưa bao giờ được chạy như một pipeline thống nhất. Hậu quả của việc không có orchestrator gắn plan với execution: design decisions bị phân tán, implementation bị thực hiện cục bộ qua các plan khác (credit system, wave consolidation). Kết quả là MIME allowlist, upload contract, và `document_types` master data nằm rải rác — không ai biết plan này tồn tại trừ người viết nó.

## Technical Details

**Phases breakdown:**

| Phase | Scope | Files affected | Status |
|-------|-------|---------------|--------|
| 1. Lock contracts | brainstorm + decisions | brainstorm-260701-1517 | ✅ Done |
| 2. Shared pipeline | Cloudinary helper, cleanup | `services/cloudinary.ts` | ✅ Partial (existed before) |
| 3. Revision upgrade | revision file-submit endpoint | `modules/documents/` | ❌ Not executed |
| 4. Supporter output | supporter output file submit | `modules/supporter/` | ❌ Not executed |
| 5. UI modals | Revision/evidence/output modals | `apps/web-1/` | ❌ Not executed |
| 6. Verification | Integration tests | `apps/api/src/shared/infrastructure/tests/` | ❌ Not executed |

**Key decisions locked:**

- **Write mode split**: intake = URL-only, post-intake = file-only. Không mixed payload.
- **Upload-first semantics**: upload Cloudinary trước, persist DB sau. DB fail → delete Cloudinary asset.
- **MIME allowlist**: `ALLOWED_DOCUMENT_EXTENSIONS` = `[.pdf, .docx, .xlsx, .pptx, .md, .txt]` (đã implement ở `document-upload-rules.ts`). Max size: 15MB.
- **document_types master data**: DB-backed table thay vì hardcoded enum. Seed canonical list từ NEXUS_DOCUMENT_SYSTEM_COMPLETE_SPEC.md.
- **Payment proof isolation**: image-only, không chung flow với document upload.
- **External evaluation feedback semantics**: evidence types (`lecturer-feedback`, `mentor-note`, `pass-assessment`, `fail-assessment`, `screenshot`) có direction=evidence, gắn với assessment unit (`aNN-vNN`).

**Wireframe IA (3-tab):**

```
┌─────────────────────────────────────────┐
│  [Tổng quan]  [Tài liệu]  [Đánh giá bên ngoài] │
├─────────────────────────────────────────┤
│                                         │
│  Tab Tài liệu:                          │
│  ┌─ revision table ──────────────────┐  │
│  │ v01 ─── doc_A.pdf   [Tải xuống]  │  │
│  │ v02 ─── doc_B.pptx  [Tải xuống]  │  │
│  │         [+ Nộp bản mới]          │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Tab Đánh giá bên ngoài:                │
│  ┌─ evidence table ──────────────────┐  │
│  │ a01-v02 ─ feedback.pdf [Tải]      │  │
│  │ a01-v02 ─ screenshot.png [Tải]    │  │
│  │         [+ Thêm đánh giá]         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Actual artifact implemented:**

```typescript
// document-upload-rules.ts — MIMO allowlist + size limit
export const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf", ".docx", ".xlsx", ".pptx", ".md", ".txt",
] as const;
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 15 * 1024 * 1024;
```

## What We Tried

Không có attempt execute plan này như một thể thống nhất. Các phần riêng lẻ bị kéo vào:

- **Credit system plan**: lấy MIME allowlist và upload pattern
- **Wave consolidation plan**: lấy document_type direction semantics
- **Payment proof isolation**: đã có từ trước, không liên quan

Không có ai chủ động review plan này trước khi implement các feature overlap.

## Root Cause Analysis

1. **Không có plan registry**: 260701-1544 tồn tại trong đầu người viết và file brainstorm/checklist, nhưng không được đăng ký vào bất kỳ hệ thống tracking nào. Các plan sau này (credit, wave) không biết plan này tồn tại.

2. **Thiếu orchestration**: Không có orchestrator/subagent nào được giao nhiệm vụ "đọc tất cả plan pending trước khi implement feature X". Dẫn đến duplicate design effort.

3. **Design decisions bị phân mảnh**: MIME policy được implement ở `document-upload-rules.ts` (đúng chỗ), document_type master data seeding thì chưa, upload-first semantics thì không ai implement revision endpoint theo đúng contract đã định.

4. **Không có execution window**: Plan 6 phases cần ~3-5 ngày dev. Không có timeline nào được allocate.

## Lessons Learned

- **Plan cần registry**: Mỗi plan cần được ghi vào một file index (`plans/registry.md`) để các plan/feature sau có thể tra cứu decisions đã locked.
- **Design decisions cần artifact độc lập**: MIME policy, upload contract, external feedback metadata — những thứ này không nên chôn trong brainstorm report. Cần một `docs/decisions/` với từng decision record riêng.
- **6 phases là đúng**, nhưng execution order sai: đáng lẽ phase 1 (lock contracts) phải được review và approve trước khi phase 2 bắt đầu. Phase 1 decisions đã đúng, nhưng không được "ký off".
- **Cross-plan contamination**: MIME allowlist bị kéo vào credit system plan mà không có reference về nguồn gốc. Sau này ai muốn sửa allowlist không biết phải trace ngược về plan nào.

## Next Steps

1. ~~Archive brainstorm + checklist vào `plans/archive/260701-1544/`~~ — `plans/archive/` đã bị xoá toàn bộ (2026-07-27). Các decision còn valid đã được trích ở mục dưới.
2. Trích các design decisions còn valid thành decision records riêng trong `docs/decisions/`:
   - `doc-upload-write-mode-split.md`
   - `doc-upload-mime-allowlist.md`
   - `doc-upload-external-feedback-metadata.md`
3. Update `document-upload-rules.ts` nếu MIME allowlist cần mở rộng (thiếu image types cho evidence screenshot?)
4. Khi có execution window cho document workspace, dùng phase 2-6 của plan này làm specification — không cần redesign lại.
