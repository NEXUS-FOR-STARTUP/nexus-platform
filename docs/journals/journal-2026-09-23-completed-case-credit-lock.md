# Completed Case Credit Lock & Confirmation Modal

**Date**: 2026-09-23 16:30  
**Status**: Resolved  
**Scope**: Frontend Workspace UI  
**Plan**: `plans/260923-1604-completed-case-credit-lock/plan.md`  

---

## 1. What Happened

Previously, students on `report_ready` cases could trigger `Xác nhận hoàn thành` (`T17_USER_CONFIRM_COMPLETE`) with a single click without confirmation or warning. Furthermore, once a case transitioned to `completed`, the workspace credit tab (`CreditPanel` and `CreditBalanceCard`) still exposed the "Mua thêm credit" call-to-action (CTA), allowing students to open `CreditQuantityModal` and initiate payment for a project already closed.

## 2. Technical Decisions

1. **Terminal Condition Check**:
   - Scope strictly to `user_facing_stage === "completed"` via `const canBuyCredits = stage !== "completed"`.
   - Avoid altering state machine or `rejected`/`closed` policies in the backend.

2. **UI Affordance & State Gating**:
   - In `apps/web-1/app/dashboard/case/[id]/page.tsx`, `canBuyCredits` gates `onBuyCredits`, URL query-param checkout auto-opening, and modals (`packageSelectOpened`, `creditBuyOpened`).
   - In `CreditBalanceCard.tsx` and `CreditPanel.tsx`, `onBuyCredits` was made optional (`onBuyCredits?: () => void`). When undefined, the CTA buttons are not rendered, while existing credit balance and ledger/order transaction histories remain visible.

3. **Confirmation Modal in StatusGuidanceCard**:
   - Added Mantine `Modal` component directly within `StatusGuidanceCard.tsx` to handle the final action confirmation.
   - Prevents accidental completion by requiring student confirmation, while retaining Mantine focus trap and accessible Escape/cancel keyboard navigation.

## 3. Modified Files

- `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`:
  - Added `Modal` with "Xác nhận hoàn tất dự án", warning text, and action buttons ("Xem lại", "Xác nhận hoàn thành").
  - `onConfirmComplete` triggers the API request on modal confirm and closes modal upon completion.
- `apps/web-1/app/dashboard/case/[id]/page.tsx`:
  - Defined `canBuyCredits = stage !== "completed"`.
  - Conditioned `onBuyCredits` passing, quick-action buy button visibility, and modal display states on `canBuyCredits`.
- `apps/web-1/app/dashboard/case/[id]/_components/CreditBalanceCard.tsx`:
  - Made `onBuyCredits` optional; rendered button only when provided.
- `apps/web-1/app/dashboard/case/[id]/_components/CreditPanel.tsx`:
  - Made `onBuyCredits` optional; conditionally rendered action button in header.

## 4. Verification

- Ran `bun run check-types` across workspace; completed with 0 errors.
- Verified modal behavior:
  - User click on `Xác nhận hoàn thành` opens modal without firing API request.
  - Cancel/Escape closes modal, keeping case in `report_ready`.
  - Confirm triggers `T17_USER_CONFIRM_COMPLETE` and refreshes case to `completed`.
- Verified completed state:
  - Case in `completed` stage hides buy credit CTA buttons across both balance card and panel.
  - History and balance remain read-only.
- Non-completed cases retain standard purchasing flow and CTA visibility.
