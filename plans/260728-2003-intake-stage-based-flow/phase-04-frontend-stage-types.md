---
title: "Phase 04: Frontend — Add stage types and theme map"
phase: 4
risk: low
effort: 0.5h
dependencies: Phase 01
status: pending
---

## Goal

Add the new stages to frontend TypeScript types and the visual theme map used by badge/header components.

## Changes

### 1. `apps/web-1/types/case.ts`

**Update `Case.user_facing_stage` type union** (line 17):
```typescript
// Before:
user_facing_stage: "submitted" | "need_more_information" | "under_review" | "report_ready" | "waiting_for_revision" | "revision_submitted" | "completed" | "rejected" | "closed" | string;

// After:
user_facing_stage: "intake_pending" | "intake_ready" | "submitted" | "need_more_information" | "under_review" | "report_ready" | "waiting_for_revision" | "revision_submitted" | "completed" | "rejected" | "closed" | string;
```

**Add 2 entries to `statusThemeMap`** (after line 215):
```typescript
export const statusThemeMap: Record<string, StatusThemeDetails> = {
  // ... existing entries ...

  // NEW — pre-submission stages
  intake_pending: {
    label: "Chờ thanh toán — Kích hoạt kiểm tra chuyên sâu",
    color: "warning",
  },
  intake_ready: {
    label: "Sẵn sàng — Cập nhật thông tin hồ sơ",
    color: "primary",
  },

  // ... rest of existing entries ...
};
```

### 2. `apps/web-1/app/dashboard/_components/CaseCard.tsx`

No change needed — the `statusThemeMap` lookup is already dynamic (`statusThemeMap[caseData.user_facing_stage]`), so new stages render with correct labels/colors automatically.

## Success Criteria

- [ ] TypeScript compiles without errors (`npm run check-types --workspace=apps/web-1`)
- [ ] `statusThemeMap.intake_pending` returns `{ label: "Chờ thanh toán...", color: "warning" }`
- [ ] `statusThemeMap.intake_ready` returns `{ label: "Sẵn sàng...", color: "primary" }`
- [ ] Case cards in the dashboard list show correct labels for new stages
