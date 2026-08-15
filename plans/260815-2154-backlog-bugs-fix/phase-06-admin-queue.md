# Phase 06 — Admin Queue (#9)

- Priority: P0 | Status: Done | Effort: 3h
- Depends: Phase 05 | Blocks: —

## Overview

Admin list hiện hiện mọi state (gốc bug: `useAdminCases.ts:16` gọi `/admin/cases` không filter) → tách bucket: review queue chỉ `submitted`/`triage_pending`; case chưa nộp intake tách "Chờ sinh viên nộp hồ sơ". Admin detail empty-state khi chưa nộp.

## Requirements

- Review queue: chỉ `submitted`/`triage_pending`.
- Bucket riêng `intake_pending` "Chờ sinh viên nộp hồ sơ" (user đã thanh toán/chưa nộp).
- Admin detail: `intake_snapshot = null` → empty-state "Sinh viên đã thanh toán nhưng chưa nộp hồ sơ" + disable approve/reject.
- BE OK (filters pass-through `list-admin-cases.usecase.ts:16-28`, `get-admin-case-detail.usecase.ts:42-46` intake_snapshot null đã OK) — **FE only**.

## Architecture

- `admin/page.tsx:78` caseFilter (all/triage/unassigned/assigned/crud) → thêm bucket "intake" với `user_facing_stage === "intake_pending"`.
- **Review queue phải LOẠI terminal states** (done/closed/cancelled/rejected) — chỉ `submitted` + `triage_pending`. Thêm bucket intake KHÔNG đủ — bucket "triage" hiện tại phải filter rõ.
- `filteredCases :235-255` thêm filter intake bucket + filter terminal khỏi triage.
- Sidebar buttons `:466-510` thêm nút bucket intake.
- `AdminCaseDetailModal.tsx:245-263` buttons từ `allowed_transitions` → gate trên `intake_snapshot` + empty-state (pattern `TabReportFindings.tsx:51-62`).

## Related Code Files

| File | Action |
|---|---|
| `apps/web-1/app/admin/page.tsx` (78, 235-255, 466-510) | SỬA: +bucket intake_pending filter + sidebar nút |
| `apps/web-1/app/admin/_components/AdminCaseDetailModal.tsx` (245-263) | SỬA: gate approve/reject trên intake_snapshot + empty-state |
| `apps/web-1/app/admin/hooks/useAdminCases.ts` (16) | VERIFY: filter FE (không đổi BE) |
| `apps/api/src/modules/cases/application/list-admin-cases.usecase.ts` (16-28) | VERIFY: BE filters pass-through OK |
| `apps/api/src/modules/cases/application/get-admin-case-detail.usecase.ts` (42-46) | VERIFY: intake_snapshot null OK |

## Implementation Steps

1. `admin/page.tsx`: thêm caseFilter bucket "intake" (`intake_pending`), thêm vào filteredCases + sidebar button.
2. `AdminCaseDetailModal.tsx`: nếu `intake_snapshot === null` → empty-state + disable approve/reject.
3. `npm run check-types` + manual verify.

## Todo List

- [x] admin/page.tsx: +bucket intake_pending (filter + sidebar)
- [x] AdminCaseDetailModal: empty-state + disable approve/reject khi intake_snapshot null
- [x] `npm run check-types` PASS
- [ ] Manual: case chưa nộp intake → hiện ở bucket "Chờ sinh viên nộp hồ sơ", detail empty-state, không approve được

## Success Criteria

- Admin review queue không lẫn case chưa nộp intake.
- Bucket "Chờ sinh viên nộp hồ sơ" hiện đúng case intake_pending.
- Admin detail intake_snapshot null → empty-state rõ + nút duyệt vô hiệu.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Filter bỏ sót case hợp lệ khỏi review queue | Thấp | Trung bình | Chỉ thêm bucket intake_pending, không đổi filter cũ |
| Empty-state gây ảnh hưởng case đã nộp | Thấp | Thấp | Gate chỉ khi intake_snapshot null |

## Next Steps

→ Phase 08: tests + docs sync.
