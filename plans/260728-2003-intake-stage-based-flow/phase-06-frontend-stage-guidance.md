---
title: "Phase 06: Frontend — Stage guidance + intake flow fixes"
phase: 6
risk: low
effort: 1.5h
dependencies: Phase 05
status: pending
---

## Goal

Add `StatusGuidanceCard` alerts for `intake_pending` (payment CTA) and `intake_ready` (intake form CTA). Fix `useIntakeForm` UPDATE mode PATCH → POST. Fix team-fit page redirect after save.

## Changes

### 1. `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`

**Update props interface:**
```typescript
interface StatusGuidanceCardProps {
  caseData: Case;
  openRequestsForMoreInfo?: any[] | null;
  onSelectTab: (tab: "documents" | "discussion" | "timeline" | "settings") => void;
  onOpenPayment?: () => void;       // NEW — for intake_pending
  onOpenIntake?: () => void;        // NEW — for intake_ready
}
```

**Add cases for new stages before the default case:**
```typescript
switch (stage) {
  case "intake_pending":
    return (
      <Alert
        variant="light"
        color="orange"
        radius="md"
        title="Kết quả Team-Idea Fit đã sẵn sàng"
        icon={<AlertCircle className="w-4.5 h-4.5 shrink-0" />}
        className="animate-fade-in font-body text-xs shrink-0"
      >
        <div className="space-y-3">
          <p className="text-text-muted text-xs leading-relaxed">
            Bạn đã hoàn thành đánh giá Team-Idea Fit miễn phí. Xem kết quả bên dưới.
            Để nhận phản biện chuyên sâu từ Supporter, vui lòng kích hoạt gói kiểm tra.
          </p>
          {onOpenPayment && (
            <Button
              size="sm"
              color="brand"
              onClick={onOpenPayment}
              leftSection={<CreditCard className="w-4 h-4" />}
              className="font-semibold cursor-pointer"
            >
              Mua kiểm tra chuyên sâu
            </Button>
          )}
        </div>
      </Alert>
    );

  case "intake_ready":
    return (
      <Alert
        variant="light"
        color="blue"
        radius="md"
        title="Cập nhật thông tin hồ sơ để bắt đầu"
        icon={<Activity className="w-4.5 h-4.5 shrink-0" />}
        className="animate-fade-in font-body text-xs shrink-0"
      >
        <div className="space-y-3">
          <p className="text-text-muted text-xs leading-relaxed">
            Thanh toán đã được xác nhận! Vui lòng cập nhật thông tin chi tiết về dự án
            và đội ngũ để Supporter có thể phản biện chính xác nhất.
          </p>
          {onOpenIntake && (
            <Button
              size="sm"
              color="brand"
              onClick={onOpenIntake}
              leftSection={<Edit3 className="w-4 h-4" />}
              className="font-semibold cursor-pointer"
            >
              Cập nhật thông tin hồ sơ
            </Button>
          )}
        </div>
      </Alert>
    );

  // ... existing cases ...
}
```

**Add imports:**
```typescript
import { CreditCard, Edit3 } from "lucide-react";
import { Button } from "@mantine/core";
```

### 2. `apps/web-1/app/dashboard/intake/hooks/useIntakeForm.ts` — Fix Bug #2

**Change UPDATE mode from `patch` to `post` (line 81):**
```typescript
// Before:
if (caseId) {
  const response = await apiClient.patch(`/cases/${caseId}`, data);
  return response.data;
}

// After:
if (caseId) {
  const response = await apiClient.post(`/cases/${caseId}/intake`, data);
  return response.data;
}
```

### 3. `apps/web-1/app/dashboard/team-fit/page.tsx` — Fix redirect after save

**Update `handleUpgrade` function (line 170-229):**

Currently, when user clicks "Mua kiểm tra chuyên sâu" from the team-fit page, it:
1. If saved → redirects to `/dashboard/intake?packageId=pkg_tf_audit&caseId=${savedCaseId}` — this was the old intake wizard path
2. If not saved → pre-fills localStorage and redirects to `/dashboard/intake`

**Change to redirect to case detail page instead:**
```typescript
const handleUpgrade = () => {
  // If case already saved, redirect to case detail page for payment
  if (savedCaseId) {
    router.push(`/dashboard/case/${savedCaseId}`);
    return;
  }

  // If not saved yet, save first then redirect
  // Actually, just redirect — user can save from the result step
  router.push("/dashboard");
};
```

**Update `handleSave` success handler to redirect to case (not intake wizard):**
```typescript
const handleSave = async () => {
  setSaveError(null);
  try {
    // ... existing payload building ...
    const data = await saveMutation.mutateAsync(payload);
    setHasSaved(true);
    setSavedCaseId(data.caseId);
    // NEW — auto-redirect to case detail page showing intake_pending
    router.push(`/dashboard/case/${data.caseId}`);
  } catch (err) {
    setSaveError(err instanceof Error ? err.message : "Lưu kết quả thất bại");
  }
};
```

## Success Criteria

- [ ] `intake_pending` case shows guidance card with "Mua kiểm tra chuyên sâu" button
- [ ] `intake_ready` case shows guidance card with "Cập nhật thông tin hồ sơ" button
- [ ] `useIntakeForm` UPDATE mode calls `POST /cases/{caseId}/intake` (not PATCH)
- [ ] Team-fit save redirects to `/dashboard/case/${caseId}` showing `intake_pending` view
- [ ] The "Mua kiểm tra chuyên sâu" button from team-fit result goes to case detail with payment flow
- [ ] TypeScript compiles without errors
