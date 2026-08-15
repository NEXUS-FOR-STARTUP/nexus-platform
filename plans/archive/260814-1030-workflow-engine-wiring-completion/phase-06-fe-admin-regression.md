# Phase 06 — FE Admin Modal + Regression

- Priority: P1 | Status: Pending | Effort: 3h
- Depends: Phase 03, 05 | Blocks: —

## Overview

Admin modal/table render từ `allowed_transitions` (D9), thêm `triage_waiting` vào bucket triage, regression toàn bộ plan.

## Key Insights

- `AdminCaseDetailModal.tsx:237` hardcode `internal_status === "triage_pending"` → nút Duyệt/Từ chối; `:279` hardcode `accepted_unassigned || assigned` → nút phân công
- `AdminCaseAssignmentTable.tsx:291/316` tương tự — theo D9 giữ hardcode (list logic) NHƯNG thêm triage_waiting vào nhóm triage nếu lọc theo status
- "Yêu cầu làm rõ" admin giờ = T8 (sau phase 1-2) → có thể render từ transitions
- `admin/page.tsx:244-273` filter buckets — thêm `triage_waiting` vào active/triage bucket

## Architecture

### AdminCaseDetailModal

- Thay hardcode bằng `filterTransitions(allowed_transitions, { role: "ADMIN", isOwner: false, isMember: false, isAssignedSupporter: false })` (R9 — field từ phase 03):
  - T5_ACCEPT → "Xác nhận duyệt" (giữ ApproveCaseModal)
  - T12_REJECT → "Từ chối" (giữ RejectCaseModal)
  - T6_ASSIGN_SUPPORTER → "Phân công/Phân công lại" (từ `assigned` hay `accepted_unassigned`)
  - T8_REQUEST_INFO → "Yêu cầu làm rõ" (admin T8 — pass qua rule vì role ADMIN override actor)
- Fallback: `allowed_transitions` undefined → giữ logic cũ (progressive)

### AdminCaseAssignmentTable

- Giữ hardcode (D9) — thêm `triage_waiting` vào nhánh hiển thị hành động triage nếu có

### admin/page.tsx

- Bucket triage: `triage_pending || accepted_unassigned || triage_waiting` → đảm bảo case chờ user trả lời vẫn thấy

### Regression

- `npm run check-types` root
- `npm run lint` (web + ui)
- `npx tsx --test src/shared/infrastructure/tests/` (API — bỏ qua file env-dependent đã biết)
- Update `tasks/README.md` + bug files tương ứng: #2, #4, #7, #17, #18 → đánh dấu trạng thái mới (Done/Partial)
- Update `apps/api/AGENTS.md` module map nếu endpoint/route đổi

## Related Code Files

| File | Action |
|---|---|
| `apps/web-1/app/admin/_components/AdminCaseDetailModal.tsx` | SỬA: transitions-driven |
| `apps/web-1/app/admin/_components/AdminCaseAssignmentTable.tsx` | SỬA: +triage_waiting |
| `apps/web-1/app/admin/page.tsx` | SỬA: buckets |
| `tasks/README.md` + `tasks/bugs/bug-0{2,4,7,17,18}-*.md` | SỬA: status |
| `apps/api/AGENTS.md` | SỬA nếu cần |

## Todo List

- [ ] AdminCaseDetailModal transitions-driven (fallback giữ)
- [ ] AssignmentTable + page buckets: +triage_waiting
- [ ] check-types + lint PASS
- [ ] Test suite API PASS (trừ env-dependent)
- [ ] Cập nhật bug tracker + AGENTS.md
- [ ] Manual: admin duyệt/từ chối/phân công/yêu cầu làm rõ từ modal; reassign hoạt động; triage_waiting hiện đúng bucket

## Success Criteria

- Admin không còn nút sai stage (F12 hoàn chỉnh)
- Toàn bộ 6 phase: 12 use case đi qua executeTransition, FE 3 role render từ allowed_transitions
- Bug #2, #4, #7, #17, #18 đóng; #1 SLA policy còn mở (quyết định sản phẩm)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Modal fallback giữ hardcode lâu → 2 nguồn truth | Trung bình | Thấp | Đánh dấu TODO xóa fallback sau 1 sprint |
| Regression phá UI admin | Thấp | Cao | Manual test đầy đủ 4 action admin |

## Next Steps

- Chốt open decisions còn lại: #1 SLA reset, #13/#14 giới hạn intake, #16 kick user
- Plan riêng: bug #12 data layer sau khi #13/#14 đóng
