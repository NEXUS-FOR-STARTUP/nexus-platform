# Phase 06 — FE Admin Modal + Regression

- Priority: P0 | Status: Pending | Effort: 3h
- Depends: Phase 03, 05 | Blocks: —

## Overview

Admin modal render từ `allowed_transitions` (T5/T12/T6), **xóa nút "Yêu cầu làm rõ"** (D1), regression toàn bộ plan + cập nhật bug tracker.

## Key Insights

- `AdminCaseDetailModal.tsx:237` hardcode `triage_pending` → nút Duyệt/Từ chối; `:279` hardcode `accepted_unassigned || assigned` → nút phân công
- Nút "Yêu cầu làm rõ" admin hiện tại → ghi thẳng, đã xóa ở BE (phase 02) → **FE phải bỏ nút này**, nếu không bấm sẽ 404
- `admin/page.tsx:244-273` filter buckets — KHÔNG có triage_waiting (state không tồn tại — phase 01)
- Admin "yêu cầu làm rõ" giờ = lý do trong RejectCaseModal (T12) — lý do hiện cho sinh viên (phase 04)

## Changes

### AdminCaseDetailModal

- Thay hardcode bằng `filterTransitions(allowed_transitions, { role: "ADMIN", isOwner: false, isMember: false, isAssignedSupporter: false })` (D14 — field từ phase 03):
  - T5_ACCEPT → "Xác nhận duyệt" (giữ ApproveCaseModal)
  - T12_REJECT → "Từ chối" (giữ RejectCaseModal — đây là nút DUY NHẤT để "yêu cầu làm rõ" qua lý do)
  - T6_ASSIGN_SUPPORTER → "Phân công/Phân công lại"
- **XÓA nút "Yêu cầu làm rõ"** khỏi modal (T8 không còn trong rule ADMIN — phase 04)
- Fallback: `allowed_transitions` undefined → giữ logic cũ (progressive)

### AdminCaseAssignmentTable

- Giữ hardcode (list logic) — bỏ nhánh liên quan admin request-info nếu có

### admin/page.tsx

- Buckets giữ nguyên (không thêm triage_waiting)

### Regression

- `npm run check-types` root + `npm run lint`
- `npx tsx --test src/shared/infrastructure/tests/` (bỏ env-dependent đã biết)
- Update `tasks/README.md` + bug files: #2, #4, #7, #15, #17, #18 → Done/Partial; #12 → Partial (dedupe v00)
- Update `apps/api/AGENTS.md` nếu route đổi (xóa request-more-info admin)

## Related Code Files

| File | Action |
|---|---|
| `apps/web-1/app/admin/_components/AdminCaseDetailModal.tsx` | SỬA: transitions-driven, xóa nút yêu cầu làm rõ |
| `apps/web-1/app/admin/_components/AdminCaseAssignmentTable.tsx` | SỬA: clean nhánh request-info nếu có |
| `apps/web-1/app/admin/page.tsx` | Kiểm tra bucket (không đổi dự kiến) |
| `tasks/README.md` + `tasks/bugs/bug-0{2,4,7,12,15,17,18}-*.md` | SỬA: status |
| `apps/api/AGENTS.md` | SỬA nếu cần |

## Todo List

- [ ] AdminCaseDetailModal transitions-driven (fallback giữ)
- [ ] Xóa nút "Yêu cầu làm rõ" FE
- [ ] check-types + lint PASS
- [ ] Test suite API PASS (trừ env-dependent)
- [ ] Cập nhật bug tracker + AGENTS.md
- [ ] Manual: admin duyệt/từ chối (kèm lý do)/phân công/reassign; KHÔNG còn nút yêu cầu làm rõ; case nộp lại hiện đúng bucket

## Success Criteria

- Admin không còn nút sai stage; không còn đường request-info ghi thẳng
- Toàn bộ 6 phase: vòng reject → nộp lại chạy trọn; 3 role render từ allowed_transitions
- Bug #2, #4, #7, #15, #17, #18 đóng; #12 hỗ trợ

## Next Steps

- Chốt 3 câu hỏi mở (plan.md): gỡ tay case kẹt hiện hữu (nếu cần thêm phase data repair), chat ưu đãi, 1 nút/2 bước
- Sau khi đóng vòng này: quyết định số phận `/resubmit` endpoint (dead — giữ deprecated hoặc xóa)
