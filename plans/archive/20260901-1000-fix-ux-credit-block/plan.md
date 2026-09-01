---
title: Fix UX Defect - Credit Blocking Case Completion
status: completed
priority: P1
effort: low
branch: fix/ux-credit-block
tags: [ux, frontend, case-workflow, credits]
created: 2026-09-01
completed: 2026-09-01
---

# Overview

Khắc phục lỗi UX nghiêm trọng trên màn hình chi tiết hồ sơ (`StatusGuidanceCard.tsx`), nơi người dùng bị chặn xác nhận hoàn thành (đóng case) do kiểm tra thiếu chính xác về số dư credit.

**Priority:** High
**Current Status:** Completed

## Key Dependencies
- Không có block bởi plan nào khác.

## Phases

1. [Phase 01: Fix UX Logic trong StatusGuidanceCard](./phase-01-fix-ux-logic.md) - Sửa lại điều kiện hiển thị của trạng thái `report_ready` để luôn cho phép xác nhận hoàn thành.

## Progress & Metrics

| Phase | Tasks | Status | Completion |
|---|---|---|---|
| [Phase 01: Fix UX Logic trong StatusGuidanceCard](./phase-01-fix-ux-logic.md) | 5/5 | Completed | 100% [X] |

## Implementation Summary & Verification
- **Component Updated:** `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`
- **Root Cause Resolved:** Fixed premature `if (!hasCredits) return Alert(...)` early exit in `stage === "report_ready"`, which hid "Xác nhận hoàn thành" (`T17_USER_CONFIRM_COMPLETE`) when student credit reached 0 after evaluation deduction.
- **New Architecture:** Single unified `Alert` with `CheckCircle2` success tone. The "Xác nhận hoàn thành" button is always rendered as the primary CTA. If `!hasCredits`, an inline warning banner notifies user with a secondary "Mua credit" CTA.
- **Code Review:** Approved by CodeReviewer (9.5/10). Zero regressions, no security flaws.
- **Quality Assurance:** Verified by Tester. 128 tests passed. Clean TypeScript check, clean Next.js build, clean ESLint across workspace.