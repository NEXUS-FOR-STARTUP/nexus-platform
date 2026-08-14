# Phase 04 — FE Student Workspace

- Priority: P0 | Status: Pending | Effort: 4h
- Depends: Phase 02 | Blocks: —

## Overview

Student workspace: render nút từ `allowed_transitions` (D14), nút nộp lại T3/T4 (D3), hiện lý do từ chối (D1), hiện text yêu cầu supporter (D10), fix canSubmitRevision 400.

## Key Insights

- `useCaseDetails.ts:87` đã expose `allowedTransitions` — chưa ai consume
- BUG: `page.tsx:75` `canSubmitRevision` theo stage → user ở report_ready bấm upload → BE 400 (T9 chỉ từ `waiting_user`)
- `StatusGuidanceCard.tsx:36-42` đọc event `case_rejected`/`vetoed` để lấy lý do, nhưng BE ghi `T12_REJECT` → lý do không hiện. Sửa match
- `page.tsx:127` hardcode `openRequestsForMoreInfo={null}` → text yêu cầu supporter không hiện. Truyền prop thật
- `resubmitMutation` (useCaseDetails.ts:72-81) chưa ai gọi — nộp lại giờ qua `/intake` atomic (D3) → xóa mutation chết này
- `TabReportFindings.tsx:54-63` đọc `internal_status` — student không nhận field → dead code
- `TabCaseSettings.tsx:196` delete gated stage — không phải transition, giữ (BE authority)

## Changes

### 1. Shared actor-aware gate (D14)

```typescript
// apps/web-1/_types/transitions.ts (TẠO)
export const TRANSITION_ACTOR_RULES: Record<string, { roles: string[]; actor: "owner" | "ownerOrMember" | "assignedSupporter" | "none" }> = {
  T2_SUBMIT_INTAKE: { roles: ["CUSTOMER"], actor: "ownerOrMember" },
  T3_RESUBMIT_AFTER_REJECT: { roles: ["CUSTOMER"], actor: "owner" },
  T4_RESUBMIT_AFTER_VETO: { roles: ["CUSTOMER"], actor: "owner" },
  T5_ACCEPT: { roles: ["ADMIN"], actor: "none" },
  T6_ASSIGN_SUPPORTER: { roles: ["ADMIN"], actor: "none" },
  T7_START_WORK: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T8_REQUEST_INFO: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T9_SUBMIT_REVISION: { roles: ["CUSTOMER"], actor: "ownerOrMember" },
  T10_START_REVIEW_REVISION: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T11_SUBMIT_OUTPUT: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T12_REJECT: { roles: ["ADMIN"], actor: "none" },
  T13_VETO: { roles: ["ADMIN"], actor: "none" },
  T14_COMPLETE: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T15_CANCEL: { roles: ["CUSTOMER"], actor: "owner" },
  T16_EDIT_INTAKE: { roles: ["CUSTOMER"], actor: "ownerOrMember" },
};
// filterTransitions(transitions, { role, isOwner, isMember, isAssignedSupporter })
```

- T8 giờ chỉ SUPPORTER (admin request-info đã xóa — D1)
- Identity từ case detail: `owner_auth_user_id`, `members[]`, `assigned_supporter_auth_user_id` vs session user

### 2. page.tsx

- `canSubmitRevision` ← `filteredTransitions.includes('T9_SUBMIT_REVISION')` (fix 400)
- `onOpenIntake` condition: `filteredTransitions.includes(T2 || T16 || T3 || T4)` thay hardcode stage
- Truyền `openRequestsForMoreInfo` thật (bỏ `{null}`) — D10
- Truyền isOwner/isMember vào filterTransitions
- Xóa `resubmitMutation` nếu không còn caller (D3 — nộp lại qua /intake)

### 3. StatusGuidanceCard.tsx

- Giữ switch copy theo stage
- Nút action từ `filteredTransitions`:
  - T2/T16 → "Nộp hồ sơ"/"Chỉnh sửa hồ sơ" → onOpenIntake
  - T3/T4 (stage `rejected`) → nút hiện có "Chỉnh sửa hồ sơ để nộp lại" → onOpenIntake (atomic resubmit — D3, không thêm nút mới)
  - T9 → "Nộp tài liệu bổ sung" → StudentDocumentUploadModal
  - T15 → "Hủy hồ sơ" (chỉ owner)
- **Hiện lý do từ chối (D1):** match event thêm `T12_REJECT` + `T13_VETO` bên cạnh `case_rejected`/`vetoed` (đọc reason từ metadata như cũ)

### 4. TabReportFindings.tsx — clean dead code

- Bỏ nhánh đọc `internal_status` → dùng `user_facing_stage`/`allowed_transitions`

## Related Code Files

| File | Action |
|---|---|
| `apps/web-1/_types/transitions.ts` | TẠO: TRANSITION_ACTOR_RULES + filterTransitions |
| `apps/web-1/app/dashboard/case/[id]/page.tsx` | SỬA: canSubmitRevision, onOpenIntake, openRequestsForMoreInfo, identity, xóa resubmitMutation |
| `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx` | SỬA: nút từ transitions, fix event match lý do |
| `apps/web-1/app/dashboard/case/[id]/_components/TabReportFindings.tsx` | SỬA: clean dead code |
| `apps/web-1/app/dashboard/case/[id]/hooks/useCaseDetails.ts` | SỬA: xóa resubmitMutation chết |

## Todo List

- [ ] Tạo `_types/transitions.ts` (D14)
- [ ] page.tsx: canSubmitRevision theo T9, onOpenIntake theo transitions, truyền openRequestsForMoreInfo + identity
- [ ] StatusGuidanceCard: nút từ transitions + fix lý do từ chối
- [ ] TabReportFindings clean
- [ ] `grep resubmitMutation` → 0 caller (xóa)
- [ ] eslint web 0 warning
- [ ] Manual: rejected case → thấy lý do + nút sửa → sửa → lưu → về chờ duyệt (không kẹt)
- [ ] Manual: waiting_user → thấy text yêu cầu supporter + nút T9
- [ ] Manual: report_ready không còn 400 khi bấm upload (nút ẩn)
- [ ] Manual: member không thấy T15

## Success Criteria

- Vòng nộp lại hiển thị trọn vẹn cho sinh viên (lý do → sửa → nộp → chờ duyệt)
- #7: không nút nào hardcode stage cho action gating
- canSubmitRevision không còn 400
- Text yêu cầu supporter hiện đúng (D10)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `allowed_transitions` undefined (case cũ) | Trung bình | Trung bình | Fallback giữ logic stage cũ (progressive) |
| Copy switch dài → file >200 dòng | Trung bình | Thấp | Tách copy map file riêng nếu cần |
| Atomic resubmit UX: bấm lưu là nộp luôn, user chưa quen | Trung bình | Thấp | Copy nút rõ: "Lưu và nộp lại"; chờ chốt 1 nút/2 bước (mục Chưa chốt) |

## Next Steps

→ Phase 05: FE supporter action bar.
