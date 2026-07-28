---
title: "Phase 05: Frontend — Stage-based case detail page"
phase: 5
risk: medium
effort: 3h
dependencies: Phase 03, Phase 04
status: completed
---

## Goal

Replace the broken `canIntake` flag-based gating with a `switch(user_facing_stage)` rendering approach. Fix sidebar tab visibility, IntakeFormModal API call, Bug #1 (canIntake), Bug #2 (PATCH → POST), and Bug #5 (intakeSnapshot prop).

## Changes

### 1. `apps/web-1/app/dashboard/case/[id]/page.tsx` — Stage switch + Bug #1 fix

**Remove the broken `canIntake` line (71):**
```typescript
// DELETE this line:
const canIntake = caseData.allowed_transitions?.includes("intake") ?? false;
```

**Add stage-based helpers:**
```typescript
const stage = caseData.user_facing_stage;
const isPreSubmission = stage === "intake_pending" || stage === "intake_ready";
const isIntakeReady = stage === "intake_ready";
const isIntakePending = stage === "intake_pending";
const isSubmitted = !isPreSubmission; // existing post-submission stages
```

**Pass `stage` and `intakeSnapshot` to child components:**

Change the `WorkspaceSidebar` usage:
```typescript
<WorkspaceSidebar
  activeTab={activeTab}
  onTabChange={setActiveTab}
  messageCount={caseData.messages?.length}
  creditBalance={creditBalance ?? undefined}
  stage={stage}                   // NEW — pass stage for tab gating
/>
```

Change `CaseOverviewPanel` to pass `intakeSnapshot`:
```typescript
// Before:
<CaseOverviewPanel
  caseData={caseData}
  onSelectTab={(tab) => setActiveTab(tab)}
  onEditIntake={() => setIntakeFormOpened(true)}
/>

// After:
<CaseOverviewPanel
  caseData={caseData}
  intakeSnapshot={intakeSnapshot}     // NEW — pass as explicit prop
  onSelectTab={(tab) => setActiveTab(tab)}
  onEditIntake={isIntakeReady ? () => setIntakeFormOpened(true) : undefined}
/>
```

**Replace the `canIntake` conditional in Documents tab (line 112):**
```typescript
// Before:
{canIntake && (
  <Button ... onClick={() => setIntakeFormOpened(true)}>
    Cập nhật thông tin
  </Button>
)}

// After:
{stage === "intake_ready" && (
  <Button ... onClick={() => setIntakeFormOpened(true)}>
    <Users className="w-4 h-4" />
    Cập nhật thông tin
  </Button>
)}
```

**Add `StatusGuidanceCard` to overview for new stages:**
```typescript
{activeTab === "overview" && (
  <div className="space-y-4">
    <StatusGuidanceCard
      caseData={caseData}
      openRequestsForMoreInfo={null}
      onSelectTab={(tab) => setActiveTab(tab)}
      onOpenPayment={isIntakePending ? () => router.push(`/dashboard/case/${id}/payment`) : undefined}
      onOpenIntake={isIntakeReady ? () => setIntakeFormOpened(true) : undefined}
    />
    <CaseOverviewPanel ... />
  </div>
)}
```

### 2. `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx` — Tab gating

**Add `stage` prop:**
```typescript
interface WorkspaceSidebarProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  messageCount?: number;
  creditBalance?: number;
  hideSettings?: boolean;
  hideCredits?: boolean;
  stage?: string;                       // NEW
}
```

**Filter tabs based on stage:**
```typescript
export default function WorkspaceSidebar({ activeTab, onTabChange, messageCount, creditBalance, hideSettings = false, hideCredits = false, stage }: WorkspaceSidebarProps) {
  const isPreSubmission = stage === "intake_pending" || stage === "intake_ready";

  const tabs = [
    { id: "overview" as const, label: "Tổng quan", icon: LayoutDashboard },
    // Hide documents, discussion, timeline, credits for pre-submission
    ...(!isPreSubmission
      ? [
          { id: "documents" as const, label: "Tài liệu", icon: FileText },
          { id: "discussion" as const, label: "Chat với Supporter", icon: MessageSquare, count: messageCount },
          { id: "timeline" as const, label: "Lịch sử hoạt động", icon: History },
        ]
      : []),
    ...(!hideCredits && !isPreSubmission
      ? [{ id: "credits" as const, label: "Quản lý số dư credit", icon: CreditCard, count: creditBalance }]
      : []),
    ...(!hideSettings
      ? [{ id: "settings" as const, label: "Cấu hình", icon: Settings }]
      : []),
  ];
  // ... rest unchanged
}
```

### 3. `apps/web-1/app/dashboard/case/[id]/_components/IntakeFormModal.tsx` — Fix Bug #2

**Change `apiClient.patch()` to `apiClient.post()` (line 42):**
```typescript
// Before:
mutationFn: async (payload: any) => {
  const res = await apiClient.patch(`/cases/${caseId}`, payload);
  return res.data;
},

// After:
mutationFn: async (payload: any) => {
  const res = await apiClient.post(`/cases/${caseId}/intake`, payload);
  return res.data;
},
```

Also fix the payload structure to match what `submitIntakeUseCase` expects (the `IntakeRequest` DTO):

```typescript
const handleSubmit = async () => {
  const payload: any = {
    contact: {
      full_name: contactName,
      email: contactEmail,
      zalo: contactPhone,
    },
    current_blocker: currentBlocker,
    support_needs: {
      primary_need: primaryNeed,
      extra_notes: extraNotes,
    },
    boundary_confirmations: boundaryConfirmations,
    documents: selectedFile ? [{ file_url: "pending_upload" }] : [],
  };
  // ... rest
};
```

### 4. `apps/web-1/app/dashboard/case/[id]/_components/CaseOverviewPanel.tsx` — Fix Bug #5

**Update props interface:**
```typescript
interface CaseOverviewPanelProps {
  caseData: Case;
  intakeSnapshot?: any;                               // NEW
  onSelectTab?: (tab: WorkspaceTab) => void;
  onEditIntake?: () => void;
}
```

**Change intake data source (line 39):**
```typescript
// Before:
const intake = (caseData as any).intake_snapshot || {};

// After:
const intake = intakeSnapshot || {};
```

**Use the new prop in the component function:**
```typescript
export default function CaseOverviewPanel({ caseData, intakeSnapshot, onSelectTab, onEditIntake }: CaseOverviewPanelProps) {
```

### 5. `apps/web-1/app/dashboard/case/[id]/_components/CaseStatusHeader.tsx` — Ping-dot logic

The ping-dot logic (lines 139-153) currently shows for `submitted`, `under_review`, `revision_submitted`, `need_more_information`. Add `intake_ready`:

```typescript
{(caseData.user_facing_stage === "intake_ready" ||     // NEW
  caseData.user_facing_stage === "submitted" ||
  caseData.user_facing_stage === "under_review" ||
  caseData.user_facing_stage === "revision_submitted" ||
  caseData.user_facing_stage === "need_more_information") && (
  <span className="relative flex h-2 w-2 shrink-0">...</span>
)}
```

No ping-dot for `intake_pending` (user hasn't paid yet — no urgency).

## Success Criteria

- [ ] `intake_pending` case shows only "overview" + "settings" tabs in sidebar
- [ ] `intake_ready` case shows "overview", "documents" (placeholder), "settings" tabs
- [ ] `submitted` case shows all 6 tabs (unchanged)
- [ ] "Cập nhật thông tin" button appears only for `intake_ready` stage
- [ ] IntakeFormModal calls `POST /cases/{caseId}/intake` (not PATCH)
- [ ] CaseOverviewPanel reads intake from `intakeSnapshot` prop, not `caseData.intake_snapshot`
- [ ] Ping-dot shows for `intake_ready` but NOT for `intake_pending`
- [ ] TypeScript compiles without errors
