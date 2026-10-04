# Phase 04 — FE Student Workspace

- Priority: P1 | Status: Pending | Effort: 3h
- Depends: Phase 02 | Blocks: —

## Overview

Student workspace render action buttons từ `allowed_transitions` (D7), fix bug `canSubmitRevision` gây 400 (T9 chỉ từ `waiting_user`).

## Key Insights

- `useCaseDetails.ts:87` đã expose `allowedTransitions` — chưa ai consume
- **BUG hiện tại**: `page.tsx:75` `canSubmitRevision = ["report_ready", "waiting_for_revision", "need_more_information"].includes(stage)` — T9 machine chỉ available từ `waiting_user` → user ở report_ready bấm upload → BE 400
- `StatusGuidanceCard.tsx` switch theo stage — cần render nút từ transitions, giữ copy theo stage
- `TabReportFindings.tsx:54-63` đọc `internal_status` — student không nhận field này (VERIFY-001 strip) → dead code, clean
- `TabCaseSettings.tsx:196` delete gated `stage === "submitted"` — delete không phải transition, giữ (BE là authority)

## Architecture

### 1. Shared actor-aware gate (D7 — AMENDMENT R9)

> **R9 (red-team major #9):** `getAvailableTransitions` trả raw `on` keys KHÔNG tính guard. Guard phân biệt `isOwner` (T15/T3/T4) vs `isOwnerOrMember` (T2/T9) vs `isAssignedSupporter`. Filter theo role THÔI sẽ render nút sai → 400. Gate phải dùng role **+ actor identity** (owner/member/assigned-supporter so với session user).

```typescript
// apps/web-1/_types/transitions.ts (TẠO)
export const TRANSITION_ACTOR_RULES: Record<string, { roles: string[]; actor: "owner" | "ownerOrMember" | "assignedSupporter" | "none" }> = {
  T2_SUBMIT_INTAKE: { roles: ["CUSTOMER"], actor: "ownerOrMember" },
  T3_RESUBMIT_AFTER_REJECT: { roles: ["CUSTOMER"], actor: "owner" },
  T4_RESUBMIT_AFTER_VETO: { roles: ["CUSTOMER"], actor: "owner" },
  T5_ACCEPT: { roles: ["ADMIN"], actor: "none" },
  T6_ASSIGN_SUPPORTER: { roles: ["ADMIN"], actor: "none" },
  T7_START_WORK: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T8_REQUEST_INFO: { roles: ["ADMIN", "SUPPORTER"], actor: "assignedSupporter" },   // admin từ triage không cần assigned — xử lý riêng
  T9_SUBMIT_REVISION: { roles: ["CUSTOMER"], actor: "ownerOrMember" },
  T10_START_REVIEW_REVISION: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T11_SUBMIT_OUTPUT: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T12_REJECT: { roles: ["ADMIN"], actor: "none" },
  T13_VETO: { roles: ["ADMIN"], actor: "none" },
  T14_COMPLETE: { roles: ["SUPPORTER"], actor: "assignedSupporter" },
  T15_CANCEL: { roles: ["CUSTOMER"], actor: "owner" },
  T16_EDIT_INTAKE: { roles: ["CUSTOMER"], actor: "ownerOrMember" },
};

export function filterTransitions(transitions: string[], opts: {
  role: "CUSTOMER" | "SUPPORTER" | "ADMIN";
  isOwner: boolean;
  isMember: boolean;
  isAssignedSupporter: boolean;
}): string[] {
  return (transitions ?? []).filter((t) => {
    const rule = TRANSITION_ACTOR_RULES[t];
    if (!rule || !rule.roles.includes(opts.role)) return false;
    switch (rule.actor) {
      case "owner": return opts.isOwner;
      case "ownerOrMember": return opts.isOwner || opts.isMember;
      case "assignedSupporter": return opts.isAssignedSupporter || opts.role === "ADMIN";
      default: return true;
    }
  });
}
```

- Identity từ case detail: `owner_auth_user_id`, `members[].auth_user_id`, `assigned_supporter_auth_user_id` (đã có trong response) so với session user
- T8 cho admin: actor rule `assignedSupporter` + `role === ADMIN` pass — đúng vì admin T8 guard là isAdmin

### 2. page.tsx

- `canSubmitRevision` ← `filteredTransitions.includes('T9_SUBMIT_REVISION')` (fix 400 bug)
- `onOpenIntake` condition: `filteredTransitions.includes('T16_EDIT_INTAKE') || filteredTransitions.includes('T2_SUBMIT_INTAKE')` thay `isIntakeReady || stage === "rejected"` — **giữ** `stage === "rejected"` riêng (resubmit flow qua /resubmit, intake edit data-only)
- Tab gating giữ theo stage (không phải action gating)

### 3. StatusGuidanceCard.tsx

- Giữ switch copy theo stage
- Nút action render từ `filteredTransitions` (actor-aware, R9):
  - T2/T16 → "Nộp hồ sơ"/"Chỉnh sửa hồ sơ" → onOpenIntake
  - T9 → "Nộp tài liệu bổ sung" → mở StudentDocumentUploadModal
  - T15 → "Hủy hồ sơ" (chỉ owner — đã lọc qua actor rule)
- Xóa hardcode nút (fix #7 hoàn chỉnh)

### 4. TabReportFindings.tsx — clean dead code

- Bỏ nhánh đọc `internal_status` (student không có field) → dùng `user_facing_stage` hoặc `allowed_transitions`

## Related Code Files

| File | Action |
|---|---|
| `apps/web-1/_types/transitions.ts` | TẠO: TRANSITION_ACTOR_RULES + filterTransitions (R9) |
| `apps/web-1/app/dashboard/case/[id]/page.tsx` | SỬA: canSubmitRevision, onOpenIntake, tính identity (owner/member) |
| `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx` | SỬA: render nút từ transitions |
| `apps/web-1/app/dashboard/case/[id]/_components/TabReportFindings.tsx` | SỬA: bỏ dead code internal_status |
| `apps/web-1/app/dashboard/case/[id]/_components/CaseStatusHeader.tsx` | SỬA: isPaused logic giữ (internal_status có cho admin/supporter qua detail — kiểm tra role hiển thị) |

## Todo List

- [ ] Tạo `_types/transitions.ts` (TRANSITION_ACTOR_RULES + filterTransitions — R9)
- [ ] page.tsx: fix canSubmitRevision (T9), onOpenIntake theo transitions, truyền isOwner/isMember
- [ ] StatusGuidanceCard: render nút từ transitions, giữ copy
- [ ] TabReportFindings: clean dead code
- [ ] `grep allowed_transitions` → 3+ consumer
- [ ] eslint web 0 warning
- [ ] Manual: student ở report_ready không còn 400 khi bấm upload (nút ẩn); ở waiting_user thấy nút T9
- [ ] Manual: member (không phải owner) không thấy nút T15 Cancel

## Success Criteria

- #7 hoàn chỉnh: không nút nào hardcode stage cho action gating
- canSubmitRevision không còn 400
- UI student phản ánh đúng khả năng theo machine

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Bỏ nút khi BE field thiếu (case cũ/legacy) | Trung bình | Trung bình | Fallback: nếu `allowed_transitions` undefined → giữ logic stage cũ (progressive) |
| Copy switch dài → file >200 dòng | Trung bình | Thấp | Tách copy map ra file riêng nếu cần |

## Next Steps

→ Phase 05: FE supporter action bar.
