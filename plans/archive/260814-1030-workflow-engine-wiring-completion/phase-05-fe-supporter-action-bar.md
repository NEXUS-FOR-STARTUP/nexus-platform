# Phase 05 — FE Supporter Action Bar

- Priority: P1 | Status: Pending | Effort: 4h
- Depends: Phase 02 | Blocks: Phase 06

## Overview

Supporter UI hiện **zero action button** (view-only bucket board, không apiClient call nào). Thêm action bar để supporter thao tác T7/T8/T10/T11/T14 qua machine.

## Key Insights

- `apps/web-1/app/supporter/page.tsx` bucket theo internal_status: active (`assigned`/`supporter_working`/`waiting_user`), done, report_ready_to_publish
- **R10 (red-team minor #10):** `app/supporter/case/[id]/page.tsx:100-107` ĐÃ render "Tải output hỗ trợ" → `SupporterOutputUploadModal` → `/supporter-outputs/upload` — claim "zero action button" sai. Nút này hiện **không gate theo state** → phase-02 xong sẽ 400 nếu bấm ở `assigned`. Phase này phải gate nó
- Supporter case detail dùng shared `useCaseDetails` → đã nhận `allowed_transitions` + `internal_status` (extendWithInternalFields)
- Backend route sẵn có: `/cases/:id/status` (T6/T7/T8/T10/T14/T15 qua map), `/cases/:id/supporter-outputs/upload` (T11 sau phase 2), supporter request-more-info endpoint

## Architecture

### Action Bar (trên trang case chi tiết supporter)

Render từ `filterTransitions(allowed_transitions, { role: "SUPPORTER", isOwner: false, isMember: false, isAssignedSupporter })` (R9 — shared const phase 4, actor-aware):

| Transition | State hiện tại | Nút | Action |
|---|---|---|---|
| T7_START_WORK | assigned | "Bắt đầu phản biện" | POST `/cases/:id/status` {stage:"under_review", status:"supporter_working"} |
| T8_REQUEST_INFO | supporter_working | "Yêu cầu bổ sung" | Modal nhập query → POST (endpoint supporter request-more-info hiện có) |
| T10_START_REVIEW_REVISION | supporter_working | "Chấm lại bản sửa" | POST `/cases/:id/status` {status:"supporter_working"} (self-loop) |
| T11_SUBMIT_OUTPUT | supporter_working | "Tải output" | Mở SupporterOutputUploadModal hiện có — **gate theo transition** (R10) |
| T14_COMPLETE | report_ready_to_publish | "Hoàn thành" | POST `/cases/:id/complete` |

- Board bucket giữ nguyên (list logic)
- Thêm apiClient calls vào hook mới `apps/web-1/app/supporter/hooks/useSupporterActions.ts` (KHÔNG gọi apiClient trực tiếp trong component — anti-pattern)
- Cập nhật board item: nút "Vào xử lý" → điều hướng case detail

## Related Code Files

| File | Action |
|---|---|
| `apps/web-1/app/supporter/page.tsx` | SỬA: board + điều hướng |
| `apps/web-1/app/supporter/case/[id]/*` | SỬA: action bar render từ transitions |
| `apps/web-1/app/supporter/hooks/useSupporterActions.ts` | TẠO: mutations T7/T8/T10/T11/T14 |
| `apps/api/src/modules/supporter/**` | Tham chiếu: verify endpoint shape, thêm allowed_transitions nếu thiếu |

## Todo List

- [ ] Tạo useSupporterActions hook
- [ ] Action bar render từ filterTransitions (role SUPPORTER + isAssignedSupporter — R9)
- [ ] Gate SupporterOutputUploadModal theo T11 transition (R10)
- [ ] Wire T7/T8/T10/T14/T11 nút → endpoints
- [ ] eslint web 0 warning
- [ ] Manual: supporter nhận case → start work → request info → nhận revision → chấm lại → upload output → complete

## Success Criteria

- Supporter thao tác đủ 5 transition qua machine (không đường bypass FE)
- Board bucket phản ánh đúng sau mỗi action (refetch/query invalidation)
- Bug #5 confirm hoàn thành: nút T14 chỉ khi report_ready_to_publish

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Supporter detail endpoint không trả allowed_transitions | Trung bình | Trung bình | Thêm field BE (phase 03 pattern) |
| T11 upload modal hiện tại của student không fit supporter | Cao | Trung bình | Reuse pattern `useCaseDocumentUploads` supporter-outputs path — kiểm tra supporter có modal riêng chưa |
| Query invalidation thiếu → UI stale | Trung bình | Thấp | Invalidate case detail + supporter board sau mỗi mutation |

## Next Steps

→ Phase 06: FE admin modal + regression toàn bộ.
