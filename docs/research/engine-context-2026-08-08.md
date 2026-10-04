# Engine Redesign — Context Pack (2026-08-08)

> Context gói gọn cho agent thiết kế transition-table v2 + interface workflow engine.
> Nguồn: code thật + backlog. Không cần đọc thêm file gốc — trừ khi cần chi tiết (path ghi rõ).

## 0. Path map — file gốc

| File | Path |
|---|---|
| Prisma schema | `prisma/schema.prisma` (495 lines, 21 models) |
| Symflow definition (transition table) | `apps/api/src/modules/cases/domain/case-workflow.ts` |
| Symflow engine wrapper | `apps/api/src/modules/cases/infrastructure/persistence/case-workflow-engine.ts` |
| Stage transition rule (manual map) | `apps/api/src/modules/cases/domain/case.types.ts` — `isValidStageTransition` (line 54-68) |
| Backlog | `tasks/bugs/` — 18 files + `tasks/README.md` master table |
| Research tổng | `docs/research/rca-research-brainstorm-2026-08-08.md` |
| Research ngành | `docs/research/document-centric-audit-service-reference-2026-08-08.md` |

---

## 1. Symflow transition table — `case-workflow.ts` (VERBATIM)

```typescript
import { type WorkflowDefinition } from "symflow/engine";

export const caseWorkflow: WorkflowDefinition = {
  name: "case_workflow",
  type: "state_machine",
  places: [
    { name: "triage_pending" },
    { name: "accepted_unassigned" },
    { name: "assigned" },
    { name: "waiting_user" },
    { name: "supporter_working" },
    { name: "report_ready_to_publish" },
    { name: "done" },
    { name: "cancelled" },
  ],
  transitions: [
    { name: "accept_case",        froms: ["triage_pending"],             tos: ["accepted_unassigned"] },
    { name: "assign_supporter",   froms: ["accepted_unassigned"],        tos: ["assigned"] },
    { name: "start_work",         froms: ["assigned"],                   tos: ["supporter_working"] },
    { name: "request_info",       froms: ["supporter_working"],          tos: ["waiting_user"] },
    { name: "resume_work",        froms: ["waiting_user"],               tos: ["supporter_working"] },
    { name: "publish_report",     froms: ["supporter_working"],          tos: ["report_ready_to_publish"] },
    { name: "complete_case",      froms: ["report_ready_to_publish"],    tos: ["done"] },
    { name: "cancel",             froms: ["triage_pending", "accepted_unassigned"], tos: ["cancelled"] },
    { name: "reopen",            froms: ["cancelled"],                  tos: ["triage_pending"] },
  ],
  initialMarking: ["triage_pending"],
};

export const statusToPlace: Record<string, string> = {
  "triage_pending": "triage_pending",
  "accepted_unassigned": "accepted_unassigned",
  "assigned": "assigned",
  "waiting_user": "waiting_user",
  "supporter_working": "supporter_working",
  "report_ready_to_publish": "report_ready_to_publish",
  "done": "done",
  "cancelled": "cancelled",
};
```

## 2. Engine wrapper — `case-workflow-engine.ts` (VERBATIM)

```typescript
import { Workflow, propertyMarkingStore } from "symflow/subject";
import { caseWorkflow } from "../../domain/case-workflow.js";

const workflow = new Workflow<any>(caseWorkflow, {
  markingStore: propertyMarkingStore("internal_status"),
});

// SLA trigger: set 48h when entering supporter_working
workflow.on("entered", (event) => {
  if (event.transition.tos.includes("supporter_working")) {
    event.subject.sla_deadline_at = new Date(Date.now() + 48 * 60 * 60 * 1000);
  }
});

export function applyTransition(caseRecord: any, transitionName: string): void {
  workflow.apply(caseRecord, transitionName);
}

export function canTransition(caseRecord: any, transitionName: string): boolean {
  const result = workflow.can(caseRecord, transitionName);
  return result.allowed;
}
```

## 3. Stage map phụ — `case.types.ts` `isValidStageTransition` (VERBATIM)

```typescript
export const VALID_CASE_STAGES = [
  "intake_pending", "intake_ready", "submitted", "need_more_information",
  "under_review", "report_ready", "waiting_for_revision", "revision_submitted",
  "completed", "rejected", "closed",
] as const;

export const VALID_INTERNAL_STATUSES = [
  "triage_pending", "accepted_unassigned", "assigned", "waiting_user",
  "supporter_working", "report_ready_to_publish", "done", "cancelled",
] as const;

export function isValidStageTransition(from: string, to: string): boolean {
  if (from === to) return true;
  if (isFinalCaseStage(from)) return false;  // closed|completed|rejected

  const allowed: Record<string, string[]> = {
    submitted: ["need_more_information", "under_review", "rejected", "closed"],
    need_more_information: ["revision_submitted", "closed"],
    under_review: ["report_ready", "need_more_information", "closed"],
    report_ready: ["waiting_for_revision", "completed", "closed"],
    waiting_for_revision: ["revision_submitted", "closed"],
    revision_submitted: ["under_review", "need_more_information", "closed"],
  };
  return allowed[from]?.includes(to) ?? false;
}
```

---

## 4. Schema — 5 model quan trọng (VERBATIM fields)

### Case
```prisma
model Case {
  id                              String   @id @default(uuid())
  case_code                       String   @unique
  group_no                        String?
  owner_auth_user_id              String
  team_name                       String?
  school                          String?
  course_context                  String?
  current_checkpoint              String?
  package_id                      String?
  locked_price                    Int?
  assigned_supporter_auth_user_id String?
  user_facing_stage               String   @default("intake")
  internal_status                 String   @default("triage_pending")
  payment_status                  String   @default("unpaid")
  deadline                        DateTime?
  sla_deadline_at                 DateTime?
  created_at                      DateTime @default(now())
  updated_at                      DateTime @updatedAt
  // relations: owner, assigned_supporter, package, members, checkpoints,
  // lifecycle_units, reports, payments, messages, events, ai_jobs,
  // document_records, team_fit_report, credit_ledgers, notifications
}
```

### LifecycleUnit
```prisma
model LifecycleUnit {
  id                 String   @id @default(uuid())
  case_id            String
  checkpoint_id      String
  unit_code          String
  unit_type          String      // "version" | "assessment"
  version_no         Int      @default(1)
  assessment_no      Int      @default(0)
  linked_version_no  Int?
  drive_folder_id    String?
  content            String?  @db.Text
  file_url           String?
  created_at         DateTime @default(now())
  // relations: case, checkpoint, reports, document_records
  // NOTE: KHÔNG có updated_at — immutable insert, upsert phải update checkpoint counters
}
```

### DocumentRecord
```prisma
model DocumentRecord {
  id                        String    @id @default(uuid())
  case_id                   String
  checkpoint_id             String
  lifecycle_unit_id         String?
  unit_code                 String?
  direction                 String?     // "inbound" | "outbound"
  doc_type                  String    @default("generic")
  seq                       Int       @default(0)
  is_primary                Boolean   @default(false)
  source_kind               String
  canonical_name            String?
  original_name             String?
  extension                 String?
  mime_type                 String?
  file_url                  String?
  download_url              String?
  cloudinary_public_id      String?
  metadata_json             Json?
  uploaded_by_auth_user_id  String
  created_at                DateTime  @default(now())
  updated_at                DateTime  @updatedAt
  // NOTE: KHÔNG có unique trên (lifecycle_unit_id, doc_type, seq) — upsert phải định nghĩa
}
```

### CreditLedger
```prisma
model CreditLedger {
  id              String   @id @default(cuid())
  case_id         String
  amount          Int
  balance_after   Int
  type            String      // "purchase" | "consumption" | "refund"
  reference_id    String?
  idempotency_key String   @unique
  metadata_json   Json?
  created_at      DateTime @default(now())
  // index: [case_id, created_at]
}
```

### Report
```prisma
model Report {
  id                        String    @id @default(uuid())
  case_id                   String
  checkpoint_id             String
  lifecycle_unit_id         String?
  report_type               String
  content_md                String    @db.Text
  status                    String    @default("draft")   // draft|sent|APPROVED
  created_by                String
  approved_by_auth_user_id  String?
  sent_at                   DateTime?
  document_id               String?
  created_at                DateTime  @default(now())
  updated_at                DateTime  @updatedAt
}
```

---

## 5. Use case inventory — `cases/application/*.ts` (17 files)

| Use case | File | Gate hiện tại |
|---|---|---|
| `createCaseUseCase` | create-case.usecase.ts | CÓ (validateCp1Intake, package active, price lock) |
| `submitIntakeUseCase` | submit-intake.usecase.ts | ❌ requireCredits trước stage check; insert v00 mới; không đổi internal_status khi resubmit |
| `submitRevisionUseCase` | submit-revision.usecase.ts | ⚠️ Gate thủ công (validStages array), KHÔNG qua symflow, không đổi internal_status |
| `submitRevisionUploadUseCase` | submit-revision.usecase.ts | ⚠️ Giống trên |
| `submitSupporterOutputUploadUseCase` | submit-revision.usecase.ts | ❌ Chỉ check auth supporter, không gate stage |
| `submitExternalFeedbackUploadUseCase` | submit-revision.usecase.ts | ❌ Chỉ credit + auth |
| `vetoCaseUseCase` | veto-case.usecase.ts | ✅ symflow `cancel` + refund balance + 48h window |
| `resubmitCaseUseCase` | resubmit-case.usecase.ts | ⚠️ Chỉ check stage='rejected' + owner; đổi BOTH stage='submitted' + status='triage_pending' nhưng KHÔNG cập nhật content |
| `updateCaseStatusUseCase` | update-case-status.usecase.ts | ✅ symflow qua SYMFLOW_TRANSITION_MAP + isValidStageTransition |
| `assignSupporterUseCase` | assign-supporter.usecase.ts | ✅ symflow |
| `completeCaseUseCase` | complete-case.usecase.ts | Chưa đọc sâu |
| `deleteCaseUseCase` | delete-case.usecase.ts | Chưa đọc sâu |
| `updateCaseSettingsUseCase` | update-case-settings.usecase.ts | Chưa đọc sâu |
| `upgradePackageUseCase` | upgrade-package.usecase.ts | Chưa đọc sâu |
| `sendMessageUseCase` | send-message.usecase.ts | — |
| `listCasesUseCase` / `listMessagesUseCase` / `listSupportersUseCase` / `getCaseDetailUseCase` | list-*.ts, get-case-detail.usecase.ts | Read-only |

## 6. Backlog master (tasks/README.md) — 18 bugs

| # | Bug | Sev | Effort | Status |
|---|---|---|---|---|
| 1 | Supporter ốm → reassign, SLA reset? | High | XL | Backlog — **quyết định cần** |
| 2 | Supporter gửi report chưa chat/upload → "lỗi hệ thống" | Low | S | Backlog |
| 3 | User không hiểu "lần 2: mua credit → chat → upload" | Med | M | Backlog |
| 4 | Supporter hết credit gửi report lần 2 | Med | M | Backlog |
| 5 | Ai xác nhận hoàn thành (user/supporter)? | High | M | Backlog — **quyết định cần** |
| 6 | Lịch sử chữ nhỏ | Low | S | **Done** |
| 7 | Giấu nút upload sinh viên khi chờ duyệt | Med | M | Backlog |
| 8 | Message chữ nhỏ | Low | S | **Done** |
| 9 | Trả tiền nhưng intake trống → admin duyệt trống | Med | L | Backlog |
| 10 | Chưa căn giữa | Low | S | **Done** |
| 11 | Không realtime (SePay) | High | — | **Done** (Centrifugo merged) |
| 12 | Admin thấy nhiều doc, user thấy 1 | High | L | Backlog |
| 13 | Intake spam doc không giới hạn | Med | M | Backlog |
| 14 | Intake không giới hạn chữ (FE+BE) | Med | M | Backlog |
| 15 | Rework bị ép form upload riêng → trống "YÊU CẦU HIỆN TẠI" | High | L | Backlog (dep #17 #18) |
| 16 | Không kick user khi admin xóa case | Med | M | Backlog |
| 17 | Update intake mọi trạng thái | Med | M | Backlog |
| 18 | Kẹt luồng: request-more-info → submit → kẹt | **Crit** | XL | Backlog — block #7 #15 #17 |

### #15 chi tiết (đã đọc)
Rework flow dùng sai endpoint — form upload riêng thay vì intake form. Admin nhận case bị trống "YÊU CẦU HIỆN TẠI" (current_blocker). Fix: rework phải đi qua intake form cũ. **Bonus:** gói free vs Premium khác gì? — chưa trả lời.

### #16 chi tiết (đã đọc)
User ở trang case khi admin xóa → không kick/redirect. Fix: tận dụng realtime đã Done (#11) — subscription case channel phát hiện case deleted → redirect.

### #1 chi tiết (đã đọc)
SLA: `sla_deadline_at` set khi vào `supporter_working` (48h, workflow.on entered — case-workflow-engine.ts:9-13). Quyết định: reassign có reset SLA? User hủy được ở stage nào? Gợi ý gốc: "sla vẫn đếm không reset, user không cần biết supporter".

### #3 chi tiết (đã đọc)
UX: banner/block hướng dẫn "lần 2 = mua credit → chat → upload". Dep #4.

### #5 chi tiết (đã đọc)
Ai confirm hoàn thành? Hiện `complete_case` transition từ `report_ready_to_publish` → `done` — cần xác định actor (user confirm hay supporter auto-complete sau publish).

### #14 chi tiết (đã đọc)
Intake text không giới hạn ký tự FE+BE. Quyết định: limit bao nhiêu?

---

## 7. Verify đã làm — phát hiện quan trọng

1. **Split-brain engine:** 4 use case admin dùng symflow (accept, assign, update-status, veto) — 4 use case submit path (intake, revision x2, supporter-output, external-feedback) bỏ qua.
2. **Kẹt resubmit 2 tầng:** veto → `applyTransition('cancel')` → status='cancelled' (final). `submitIntakeUseCase` resubmit chỉ đổi stage='submitted' line 91-98, KHÔNG đổi internal_status → symflow không accept lại được. Bỏ `requireCredits` cũng kẹt.
3. **Reject thường cũng kẹt:** `rejectCase` repo (case.repository.ts:267) default `internal_status: nextStatus || "cancelled"` — rejectCaseUseCase không truyền → 'cancelled'. Giống veto về state, khác: không refund.
4. **Đường resubmit đúng đã tồn tại:** `resubmitCaseUseCase` (POST /:id/resubmit) → `resubmitCase` (case.repository.ts:284-304) đổi BOTH `user_facing_stage='submitted'` + `internal_status='triage_pending'`. Nhưng không cập nhật intake content + không requireCredits. FE dùng `submitIntake` (POST /:id/intake) — có content nhưng kẹt credit. **2 đường nửa đúng nửa sai.**
5. **Bug #2 cơ chế:** `createSupporterOutput` (case.repository.ts:521-573) có credit check trong tx + idempotency_key `consume-{unitCode}-{caseId}`. Upload lần 2 cùng version → trùng key → P2002 → "Lỗi hệ thống". #4: lần 2 khác version → balance 0 → NO_CREDITS.
6. **Bug #18 gốc:** `submitCaseRevision` (case.repository.ts:466-471) đổi stage='revision_submitted' nhưng KHÔNG đổi internal_status (dính 'waiting_user'). `resume_work` transition tồn tại (waiting_user → supporter_working) nhưng không ai gọi.
7. **SLA trigger:** chỉ set khi vào `supporter_working` (engine middleware). Không có enforcement/notification khi quá hạn.

---

## 8. Quyết định sản phẩm treo (chặn refund/resubmit phase)

1. Resubmit sau refund: trả credit mới hay free re-triage?
2. Reject sau khi report đã giao (service rendered): refund hay không?
3. Credit check tại `submit_intake` hay tại `accept`?

## 9. Unresolved

- `completeCaseUseCase`, `deleteCaseUseCase`, `updateCaseSettingsUseCase`, `upgradePackageUseCase` — chưa đọc sâu, chỉ có tên file. Đọc khi cần (path trong section 5).
- `resubmitCase` route có tồn tại trong cases.controller.ts không — cần check trước khi thiết kế resubmit flow.
