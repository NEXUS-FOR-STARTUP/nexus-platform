# Researcher-01 — Code Facts: Workflow Engine Refactor

Ngày: 2026-08-09. Phương pháp: codegraph_explore (3 calls) + bash grep/sed (2 calls). Không sửa code.

---

## 1. Routes cases module

`apps/api/src/modules/cases/http/cases.controller.ts`:
- `POST /api/cases/:id/intake` — `intakeHandler` **:442** (comment route :439)
- `POST /api/cases/:id/resubmit` — `resubmitCaseHandler` **:537** (comment :534)
- `POST /api/cases/:id/complete` — `completeCaseHandler` **:491**
- `POST /api/cases/:id/upgrade-package` — `upgradePackageHandler` **:516**

⚠️ Chưa verify file đăng ký route (cases.routes.ts / index.ts) — handler export xác nhận, mapping path chỉ ở comment. Cần check nếu plan đụng route layer.

## 2. 4 use case chưa đọc trong brainstorm

| Use case | file:line | Đổi stage/status? | Check tay | Symflow |
|---|---|---|---|---|
| `completeCaseUseCase` | `complete-case.usecase.ts:9` | Có. Trong `$transaction`: `applyTransition(caseRecord,'complete_case')` rồi ghi `internal_status` (từ symflow = done) + `user_facing_stage:'completed'` (:32-37) | role supporter phải là assigned supporter (:17) | ✅ `canTransition` :22, `applyTransition` :29 |
| `deleteCaseUseCase` | `delete-case.usecase.ts:8` | Không đổi — **hard delete** `prisma.case.delete` (:36) | owner/admin (:20-25); non-admin chỉ khi `user_facing_stage==='submitted'` (:27) | ❌ |
| `updateCaseSettingsUseCase` | `update-case-settings.usecase.ts:12` | Không đổi stage. Merge intake snapshot JSON vào `lifecycleUnit.content` (:152-157) | guard `isFinalCaseStage` (:32); owner/member/admin (:28) | ❌ |
| `upgradePackageUseCase` | `upgrade-package.usecase.ts:12` | Không đổi stage/status. `upgradeCasePackage` + caseEvent `package_upgraded` (:45-51) | target cố định `pkg_tf_audit` (:9); giá locked `39000` (:10); guard final stage (:34); idempotent nếu đã là gói đích (:39-41) | ❌ |

## 3. case.types.ts — stages / transition map / requireCredits

`apps/api/src/modules/cases/domain/case.types.ts`:
- `VALID_CASE_STAGES` **:1-13** — đủ **11 stages**: intake_pending, intake_ready, submitted, need_more_information, under_review, report_ready, waiting_for_revision, revision_submitted, completed, rejected, closed
- `VALID_INTERNAL_STATUSES` **:17-26** — 8 trạng thái: triage_pending, accepted_unassigned, assigned, waiting_user, supporter_working, report_ready_to_publish, done, cancelled
- `isValidStageTransition(from,to)` **:54-68** — map chuyển trạng thái **user-facing** (submitted→need_more_information/under_review/rejected/closed; need_more_information→revision_submitted/closed; …). Lưu ý: **song song độc lập** với symflow engine (engine xử lý internal_status, cái này xử lý user_facing_stage)
- `requireCredits(caseId, minCredits=1)` **:77-90** — gọi `getCreditBalance` từ credit-ledger.repository (:74), throw `AppError 402 NO_CREDITS` (:81), fallback im lặng nếu table chưa tồn tại P2021 (:84-87)

## 4. case-workflow-engine.ts (infrastructure/persistence)

`apps/api/src/modules/cases/infrastructure/persistence/case-workflow-engine.ts` (22 dòng):
- `Workflow` từ `symflow/subject`, `markingStore: propertyMarkingStore("internal_status")` **:4-6** — đọc/ghi cột **`internal_status`** trên case record
- **SLA hook 48h**: `workflow.on("entered", ...)` **:8-13** — khi vào `supporter_working` set `sla_deadline_at = now + 48h` trên subject (case record)
- `applyTransition(caseRecord, transitionName): void` **:15-17**
- `canTransition(caseRecord, transitionName): boolean` **:19-22** — `workflow.can(...).allowed`

Definition `case-workflow.ts` (domain): 8 places (triage_pending→cancelled), 9 transitions: accept_case, assign_supporter, start_work, request_info, resume_work, publish_report, complete_case, cancel, reopen. `initialMarking: ["triage_pending"]`.

## 5. Transaction pattern

Toàn bộ dùng **interactive callback** `prisma.$transaction(async (tx) => {...})`:
- `complete-case.usecase.ts:27`
- `submit-intake.usecase.ts:25`
- `case.repository.ts` `submitCaseRevision` :432, `createSupporterOutput` :495, `rejectCase` :262, `resubmitCase` :280

Không thấy batch/array transaction.

## 6. Event bus pattern (L5)

- Event trong tx: `tx.caseEvent.create({...})` — persisted (VD complete :41-48, submit-intake :102-108, :113-120)
- Event bus sau commit: `complete-case.usecase.ts:55-67` — `emitEvent({eventId: crypto.randomUUID(), type: DOMAIN_EVENTS.CASE_STAGE_CHANGED, ...})` với comment "Emit sau commit — student nhận noti case hoàn thành"

Pattern: **domain event emit SAU commit**, payload chứa caseId/caseCode/fromStage/toStage.

## 7. Test phase-07-symflow-transitions.test.ts

`apps/api/src/shared/infrastructure/tests/phase-07-symflow-transitions.test.ts`:
- `node:test` + `node:assert`, `NODE_ENV=test`
- **Unit test thuần** — không DB, không mocks: dynamic import `case-workflow-engine.js`
- 2 nhóm subtest: `canTransition` (ma trận true/false cho từng transition + unknown → false) và `applyTransition` (mutate `{internal_status}` object trong memory, verify chuỗi triage_pending→…→supporter_working)

## 8. allowed_transitions — BE CÓ trả thật (không phải placeholder)

`apps/api/src/modules/cases/application/get-case-detail.usecase.ts:153-159`:
```
const allowed_transitions = caseWorkflow.transitions  // :153
caseResponse.allowed_transitions = allowed_transitions // :159
```
Tính từ `caseWorkflow.transitions` (name/froms/tos). Đối chiếu FE type `apps/web-1/types/case.ts:23` — khớp nhau.

## 9. FE resubmit path

`apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`:
- Nút "Chỉnh sửa hồ sơ để nộp lại" **:210-217** — `onClick={onOpenIntake}` (prop callback, không gọi apiClient trực tiếp tại đây)
- `onOpenIntake?: () => void` khai báo :20, dùng tại :207, :274-279
- Kết luận: button delegate cho parent mở intake modal → `POST /:id/intake`. Chưa trace được nơi wire `onOpenIntake` (ngoài phạm vi 5 calls).

## 10. Gói free vs Premium

`prisma/seeds/`:
- `seed-packages.ts:37` — `pkg_tf_free` "Team-fit Free" **price 0**
- `seed-packages.ts:39-41` — `pkg_tf_audit` price **39000**
- `seed-active-packages.ts:40-53` — cùng data (free 0, audit 39000)
- FE cũng dùng `pkg_tf_free` làm marker (StatusGuidanceCard :219)
- Upgrade: `upgrade-package.usecase.ts:9-10` — chỉ target `pkg_tf_audit`, giá locked 39000

## 11. package.json (apps/api)

`apps/api/package.json`:
- `symflow: ^3.5.1` (:31)
- `hono: ^4.12.27` (:25), `@hono/node-server: ^2.0.6` (:16), `hono-idempotency: ^0.9.1` (:26)
- `better-auth: ^1.4.3` (:21)
- **xstate: KHÔNG có** trong deps (root + api)

## 12. case.repository.ts — xác nhận các hàm

- `submitCaseRevision` **:413-484** — trong tx: chỉ update `user_facing_stage: 'revision_submitted'` (:466-471), **internal_status không đụng** ✅; tạo revisionUnit + documentRecords + caseEvent
- `rejectCase` **:262-277** — default `user_facing_stage: nextStage || 'rejected'`, `internal_status: nextStatus || 'cancelled'` ✅
- `resubmitCase` **:279-299** — đổi **cả 2 cột**: `user_facing_stage: 'submitted'` + `internal_status: 'triage_pending'` (:287-292); **không cập nhật content** ✅
- `createSupporterOutput` **:486-590** — credit check trong tx :521-528 (balance_after < 1 → 402 NO_CREDITS); idempotency key `consume-${unitCode}-${caseId}` :571; ghi creditLedger -1 :563-573; set `user_facing_stage: 'report_ready'` + `internal_status: 'report_ready_to_publish'` :542-548

## 13. document.repository.ts — upsertDocumentRecordsForUnit

`apps/api/src/modules/documents/infrastructure/persistence/document.repository.ts:224-254`:
- Signature 8 param + optional client: `(caseId, checkpointId, lifecycleUnitId, unitCode, documents, uploaderId, defaultDocType, defaultDirection, client = prisma)`
- Loop per-doc → `upsertDocumentRecord` (by `idempotency_key`, :175-185)
- **0 caller** — codegraph index không liệt kê caller nào; codebase dùng `createDocumentRecordsForUnit` (:187-222) trong mọi nơi (submit-intake :64, submitCaseRevision :454, createSupporterOutput :530, createExternalFeedback :652)

## 14. prisma/schema.prisma — DocumentRecord & LifecycleUnit

`model DocumentRecord`:
- **KHÔNG có @@unique** — chỉ `@@index`: case_id, checkpoint_id, lifecycle_unit_id, uploaded_by_auth_user_id, (case_id,checkpoint_id), (case_id,source_kind)
- `lifecycle_unit_id String?` (nullable, optional relation)
- `seq Int @default(0)`, `unit_code String?`, `is_primary Boolean @default(false)`, `source_kind String` (required)

`model LifecycleUnit`:
- `unit_code String` (không unique), `unit_type String`, `version_no Int @default(1)`, `assessment_no Int @default(0)`, `linked_version_no Int?`, `content String? @db.Text`, `drive_folder_id String?`
- `@@index([case_id])`, `@@index([checkpoint_id])` — không unique nào
- `seq` **không tồn tại trên LifecycleUnit** (seq chỉ trên DocumentRecord)

---

## Unresolved / cần verify thêm

1. File đăng ký route (path mapping `/cases/:id/resubmit`) chưa trace — handler có, map path chưa confirm.
2. `onOpenIntake` wiring phía parent (component nào gọi API intake) chưa tìm — button chỉ delegate.
3. `get-case-detail.usecase.ts:153-159` — allowed_transitions không filter theo trạng thái hiện tại (trả nguyên transitions của definition, FE phải tự lọc?) — cần đọc :140-165 để confirm behavior nếu plan muốn dùng field này.
4. `reopen` transition (cancelled→triage_pending) trong case-workflow.ts — chưa thấy use case nào dùng (candidate cho resubmit refactor).
