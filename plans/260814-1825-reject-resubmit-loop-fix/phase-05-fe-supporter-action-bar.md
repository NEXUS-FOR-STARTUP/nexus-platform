# Phase 05 — FE Supporter Action Bar

- Priority: P0 | Status: Pending | Effort: 4h
- Depends: Phase 02 | Blocks: Phase 06

## Overview

Supporter UI thêm action bar để thao tác T7/T8/T10/T11/T14 qua machine. Giữ nguyên luồng request-info giữa chừng (D10).

## Key Insights

- `app/supporter/page.tsx` bucket theo internal_status: active (`assigned`/`supporter_working`/`waiting_user`), done, report_ready_to_publish
- `app/supporter/case/[id]/page.tsx:100-107` ĐÃ render "Tải output hỗ trợ" → `SupporterOutputUploadModal` → `/supporter-outputs/upload` — nút này chưa gate state → sau phase-02 sẽ 400 nếu bấm ở `assigned`. Phải gate
- Supporter case detail dùng shared `useCaseDetails` → đã nhận `allowed_transitions` + `internal_status`
- Backend route sẵn có: `/cases/:id/status` (T6/T7/T8/T10/T14 qua map), `/cases/:id/supporter-outputs/upload` (T11 sau phase 02), supporter request-more-info endpoint

## Changes

### Action Bar (trang case chi tiết supporter)

Render từ `filterTransitions(allowed_transitions, { role: "SUPPORTER", isOwner: false, isMember: false, isAssignedSupporter })` (D14 — shared const phase 04):

| Transition | State hiện tại | Nút | Action |
|---|---|---|---|
| T7_START_WORK | assigned | "Bắt đầu phản biện" | POST `/cases/:id/status` {stage:"under_review", status:"supporter_working"} |
| T8_REQUEST_INFO | supporter_working | "Yêu cầu bổ sung" | Modal nhập query → POST supporter request-more-info |
| T10_START_REVIEW_REVISION | supporter_working | "Chấm lại bản sửa" | POST `/cases/:id/status` (self-loop) |
| T11_SUBMIT_OUTPUT | supporter_working | "Tải output" | SupporterOutputUploadModal hiện có — gate theo transition |
| T14_COMPLETE | report_ready_to_publish | "Hoàn thành" | POST `/cases/:id/complete` |

- Board bucket giữ nguyên (list logic)
- Hook mới `apps/web-1/app/supporter/hooks/useSupporterActions.ts` (không apiClient trực tiếp trong component — anti-pattern)
- Invalidate case detail + board sau mỗi mutation

## Related Code Files

| File | Action |
|---|---|
| `apps/web-1/app/supporter/page.tsx` | SỬA: board + điều hướng |
| `apps/web-1/app/supporter/case/[id]/*` | SỬA: action bar từ transitions |
| `apps/web-1/app/supporter/hooks/useSupporterActions.ts` | TẠO: mutations T7/T8/T10/T11/T14 |
| `apps/api/src/modules/supporter/**` | Tham chiếu: verify endpoint shape |

## Todo List

- [ ] useSupporterActions hook
- [ ] Action bar render từ filterTransitions (SUPPORTER + isAssignedSupporter)
- [ ] Gate SupporterOutputUploadModal theo T11
- [ ] Wire T7/T8/T10/T14/T11 → endpoints
- [ ] eslint web 0 warning
- [ ] Manual: supporter nhận case → start work → request info → nhận revision → chấm lại → upload output → complete

## Success Criteria

- Supporter thao tác đủ 5 transition qua machine
- Board bucket phản ánh đúng sau mỗi action
- Bug #5: nút T14 chỉ khi report_ready_to_publish

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supporter detail không trả allowed_transitions | Trung bình | Trung bình | Thêm field BE (pattern phase 03) |
| Query invalidation thiếu → UI stale | Trung bình | Thấp | Invalidate case detail + board sau mỗi mutation |

## Next Steps

→ Phase 06: FE admin modal + regression.
