# Document Workspace Refactor

**Date**: 2026-06-30 → 2026-07-01 (abandoned)
**Severity**: High
**Component**: Case workspace — backend modules, Prisma schema, frontend components
**Status**: Blocked (abandoned — direction shifted)

## What Happened

Plan refactor case workspace từ legacy `idea/report` layout sang document-first IA: `Case → Checkpoint → Lifecycle Unit → File`. 6 phases, effort estimate 6-9 ngày.

Phases 1-4 đã implement partial và merged vào `ui/heroui-to-mantine`. Phase 5-6 còn backfill proof, rollout validation, security closure chưa chạm tới. Sau đó plan bị abandon khi product direction thay đổi.

## The Brutal Truth

Mất ~2-3 ngày effort cho implementation, nhưng không bao giờ được finish. Đau nhất là phần migration proof chưa từng chạy trên data thật — toàn bộ backfill script viết xong nhưng chưa execute. `is_primary` derivation, report mapping policy, malformed legacy row quarantine: tất cả mới ở mức code-level, chưa validation.

Cũng may là không có data loss từ plan này — migration additive, không xoá gì. Nhưng effort cho Phase 5-6 giờ phải làm lại nếu sau này quay lại.

## Technical Details

**Done (merged):**
- `apps/api/src/modules/documents/` — domain contract (workspace, checkpoint, unit, file), write validation, URL validation, persistence repository
- `assembleDocumentWorkspace()` — checkpoint selection từ `current_checkpoint` hoặc latest-version fallback (không còn `checkpoints[0]`)
- `document_records` migration applied to Supabase — Prisma schema synced
- `unit_type` canonical alignment: `lifecycle_units` đồng bộ `unit_type: "version"`
- `getCaseDetailUseCase()` returns `document_workspace` + giữ legacy payload
- `DocumentWorkspace.tsx` wired vào dashboard và supporter case pages
- Legacy `TabIdeaContent` và `TabReportFindings` removed
- Tab structure: `"documents" | "discussion" | "timeline" | "settings"`
- URL validation enforced — client `"generated"` URLs rejected
- No SSRF surface (direct URLs, server never fetches user-supplied)

**Not done (gaps):**
- [ ] Backfill script chưa chạy production — hardcode Windows path, `uploaderId` potential FK violation
- [ ] `is_primary` derivation rules chưa validate trên migrated legacy rows
- [ ] Report mapping policy (`aNN-vNN`) chưa quyết định cho mixed artifact cases
- [ ] Drive vs Cloudinary coexistence policy chưa browser verification
- [ ] Malformed legacy row quarantine/audit chưa execution proof
- [ ] Backfill idempotency / duplicate prevention chưa rerun validation
- [ ] Security regression tests: VULN-002 (mass-assignment), VULN-003 (cross-case row drop) chưa coverage

**Verified passing:**
- `npm --workspace apps/api test` ✅
- `npm --workspace apps/api run check-types` ✅
- `npm --workspace apps/web-1 run check-types` ✅

## What We Tried

- Phase 1: Backend contract + domain model — done và verified
- Phase 2: Schema migration — migration files OK, nhưng backfill script chưa production-ready (hardcode path, FK risk)
- Phase 3: API assembly — compatibility projections OK cho current scope
- Phase 4: UI refactor — workspace IA đổi, tab restructure, legacy components removed
- Phase 5 + 6: Chỉ chạm được code-level checks, chưa đủ để close

## Root Cause Analysis

Product direction shift khiến plan không còn priority. Cụ thể:

1. **No stakeholder buy-in cho migration risk** — backfill trên data thật cần verification mà direction lúc đó đang thay đổi
2. **Effort underestimate** — Phase 5-6 validation yêu cầu browser testing, real data matrix, security closure; không fit vào sprint window
3. **Dead code removal premature** — Legacy `TabIdeaContent`/`TabReportFindings` đã xoá nhưng migration chưa hoàn tất, nếu rollback sẽ thiếu UI fallback

Fundamental mistake: implement Phase 4 (UI) trước khi Phase 2 (backfill) verified. UI refactor là visible progress nhưng dependency đúng ra phải là migration proof xong trước.

## Lessons Learned

1. **Migration proof trước UI refactor.** Backfill chưa chạy data thật → workspace mới chưa thể go-live → UI effort wasted.
2. **Additive migration ≠ safe migration.** Không xoá column không ngăn được inconsistent state giữa legacy và normalized model.
3. **Security regression incomplete.** Pass scan không đủ — cần dedicated tests cho từng threat path.
4. **Plan archive protocol.** Cần document rõ artifact nào reusable, decision nào pending, để không phải research lại.

## Next Steps

Plan archived. Các artifact vẫn đang dùng trong codebase:

- `DocumentRecords` model — live trong Prisma schema
- `assemble-document-workspace` — selector logic active
- `checkpoint` / `lifecycle_unit` structure — workspace rendering dùng
- URL validation helpers — protect document write endpoints

Nếu quay lại:
1. Run backfill script trên data thật (cần sửa hardcode path + FK handling)
2. Browser verify workspace UI trên real case
3. Decide `is_primary` + report mapping policy
4. Security regression tests — VULN-002 và VULN-003
5. Cleanup legacy response shape nếu migration confirmed stable
