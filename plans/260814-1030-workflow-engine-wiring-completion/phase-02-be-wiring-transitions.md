# Phase 02 — BE Wiring T2/T16/T11/T8 + F11

- Priority: P1 | Status: Pending | Effort: 7h
- Depends: Phase 01 | Blocks: Phase 03, 04, 05

## Overview

Wire 4 đường mutate state còn bypass machine vào `executeTransition`, xóa fallback + `isValidStageTransition` (F11). Đây là phase nặng nhất — đóng enforcement bug #2, #4, #17, #18.

## Key Insights

- **R2 (red-team blocker #2): Prisma `TransactionClient` KHÔNG có `$transaction`** (bị Omit trong type interactive tx). `executeTransition(params, tx)` sẽ TypeError runtime. **Thiết kế chính:** refactor `case-transition.service.ts` — tách body hiện tại thành `transitionInTx(tx, params)` (nhận `Prisma.TransactionClient`), `executeTransition` trở thành wrapper mở `prisma.$transaction`. T11/assign gọi `transitionInTx` trực tiếp trong tx ngoài. KHÔNG có "spike rồi fallback" — đây là design duy nhất
- **R2b:** `emitEvent` trong `executeTransition` hiện chạy SAU `db.$transaction` (đã đúng post-commit). Khi tách `transitionInTx`, event emission phải ở WRAPPER (post-commit), không được đưa vào body tx. T11 use case tự emit `REPORT_PUBLISHED` — giữ, không double
- `createCaseWithCheckpointAndIntake` tạo sẵn CP1 + v00 + docs → submit-intake hiện tạo **v00 trùng lặp** → fix D5 (liên quan bug #12)
- **R5 (red-team major #5):** `createDocumentRecordsForUnit` là insert-only → phải đổi sang `upsertDocumentRecordsForUnit` (idempotent theo `buildDocumentRecordId`) trong submit-intake, nếu không mỗi lần edit intake thêm 1 bộ DocumentRecord trùng
- **R4 (red-team major #4):** FE student gọi `/revisions/upload` → `submitRevisionUploadUseCase` — **đường này chưa wire** (submitCaseRevision viết thẳng stage `revision_submitted`). Phải wire T9 luôn, không thì enforcement chỉ nằm trên endpoint chết
- Credit hiện bị trừ ở 2 nơi: `createSupporterOutput` (repo) + `subtractCredit` (machine action) → sau phase này chỉ còn 1 (machine)
- **R7 (red-team major #7):** idempotency key cũ là `consume-${buildVersionUnitCode(v)}-${caseId}` = `v01` (padded). Pass `unitCode` qua T11 data **phải dùng `buildVersionUnitCode(versionNo)`**, không phải `v${versionNo}`
- **R8 (red-team major #8):** `credit_ledgers.idempotency_key` là `@unique` (schema.prisma:614) → T11 double-submit ném P2002 không map → 500 "Lỗi hệ thống". Phải map P2002 → `AppError(409, 'DUPLICATE_CREDIT_CONSUMPTION')`
- `isValidStageTransition` còn 1 caller production (`update-case-status.usecase.ts:89`) + 3 test file

## Architecture

### 0. Refactor service — `transitionInTx` (R2, làm ĐẦU TIÊN)

```typescript
// case-transition.service.ts (REFACTOR)
async function transitionInTx(tx: Prisma.TransactionClient, params: TransitionParams): Promise<{...}> {
  // body hiện tại: findUniqueOrThrow → creditBalance → event → tryTransition
  // → executeAction(...) → updateMany optimistic → caseEvent.create
  // KHÔNG có emitEvent, KHÔNG mở $transaction bên trong
}

export async function executeTransition(params, client?) {
  if (client) return transitionInTx(client, params)          // dùng chung tx ngoài
  const result = await prisma.$transaction((tx) => transitionInTx(tx, params))
  // emitEvent CASE_STAGE_CHANGED ở đây (post-commit) — giữ nguyên vị trí hiện tại
  return result
}
```

- T11 + assign dùng `transitionInTx` trực tiếp trong tx của use case
- Map P2002 (R8): trong `transitionInTx` bọc try/catch quanh `executeAction` — `err.code === 'P2002'` → `AppError(409, 'DUPLICATE_CREDIT_CONSUMPTION', 'Lượt đánh giá này đã được xử lý')`

### 1. Submit Intake (T2/T16 — D3, D5, R3, R5, R12)

**Dispatch theo `internal_status`, KHÔNG theo stage** (R3 — supporter T8 cũng set stage `need_more_information`):

```typescript
// submit-intake.usecase.ts (SỬA)
export async function submitIntakeUseCase(userId, caseId, body) {
  const caseRecord = await findCaseByIdWithMembersAndCheckpoints(caseId);
  // ... checks owner/member

  const stage = caseRecord.user_facing_stage;
  const status = caseRecord.internal_status;

  // Pre-validation trạng thái hợp lệ — lỗi KHÔNG leak internal_status (R12)
  if (status === 'cancelled') {
    // rejected/veto: data-only — /resubmit (T3/T4) lo trạng thái
    await updateIntakeDataOnly(caseId, caseRecord, body);   // upsert v00 + docs (D5)
    return { success: true, case_id: caseId, note: 'intake updated — resubmit required' };
  }
  if (status === 'waiting_user') {
    throw new AppError(409, 'REVISION_REQUIRED',
      'Bạn cần nộp bản bổ sung qua luồng yêu cầu thông tin, không phải chỉnh hồ sơ');
  }
  if (status !== 'triage_pending' && status !== 'triage_waiting') {
    throw new AppError(400, 'INVALID_CASE_STAGE', 'Hồ sơ đang được xử lý, không thể chỉnh sửa');
  }

  // D5: upsert v00 + docs trước (tx dữ liệu riêng)
  await updateIntakeDataOnly(caseId, caseRecord, body);

  // D3: dispatch
  const transition = (status === 'triage_waiting') ? 'T2_SUBMIT_INTAKE'   // trả lời admin
    : (stage === 'intake_ready') ? 'T16_EDIT_INTAKE'                      // sửa nháp
    : 'T2_SUBMIT_INTAKE';                                                 // nộp chính thức (intake_pending)
  return executeTransition({
    transition, caseId, actorId: userId, roleVerified: 'CUSTOMER',
    data: { files: body.documents ?? [] },
  });
}
```

- `updateIntakeDataOnly`: `findFirstOrCreate` CP1 checkpoint → **upsert lifecycleUnit v00** (key `checkpoint_id` + `unit_code: 'v00'` — findFirst → update | create, KHÔNG dùng prisma.upsert vì `unit_code` không unique) → **`upsertDocumentRecordsForUnit`** (R5, không create trùng) → update case fields (school, course_context, group_no, team_name)
- **Bỏ `requireCredits`** (Q5 phase-04: credit check chuyển về T5 accept; paid case credit đã mua qua orders lúc tạo case) — xóa import (R11)
- T16 guard `isBeforeSubmission` đọc `currentStage` = stage — `intake_ready` pass ✓

### 2. Supporter Output (T11 — D4, R2, R7, R8)

```typescript
// submit-revision.usecase.ts — submitSupporterOutputUploadUseCase (SỬA)
const result = await prisma.$transaction(async (tx) => {
  // giữ nguyên: checkpoint lookup, versionUnit lookup, document records
  await createSupporterOutputDocs(tx, { caseId, checkpointId, userId, note, documents });

  // R2: gọi transitionInTx TRỰC TIẾP trong cùng tx
  const r = await transitionInTx(tx, {
    transition: 'T11_SUBMIT_OUTPUT',
    caseId, actorId: userId, roleVerified: userRole === 'admin' ? 'ADMIN' : 'SUPPORTER',
    data: { unitCode: buildVersionUnitCode(versionNo) },   // R7: 'v01' padded
  });
  return r;
});
// emit REPORT_PUBLISHED sau khi tx commit (giữ nguyên vị trí hiện tại)
```

- `case.repository.createSupporterOutput`: XÓA credit check (:521-528) + credit consume (:563-573) + stage write (:542-548) — giữ nguyên phần unit/docs (đổi tên `createSupporterOutputDocs` nhận tx)
- Machine `subtractCredit` idempotency key `consume-{unitCode}-{caseId}` — khớp format cũ khi pass `v01` (R7)
- P2002 → 409 map ở service (R8)

### 2b. Submit Revision Upload (T9 — R4)

```typescript
// submit-revision.usecase.ts — submitRevisionUploadUseCase (SỬA — ĐƯỜNG FE ĐANG DÙNG)
const result = await prisma.$transaction(async (tx) => {
  await submitCaseRevisionInTx(tx, { caseId, checkpointId, nextVersion, userId,
    changeSummary, documents, remainingBlockers });   // repo cũ bỏ stage write (:466-471) + bọc tx ngoài
  return transitionInTx(tx, {
    transition: 'T9_SUBMIT_REVISION',
    caseId, actorId: userId, roleVerified: 'CUSTOMER',
    data: { files: uploadedDocuments.map(d => ({ ...d, doc_type: 'revision_document' })), reason: body.change_summary },
  });
});
```

- `submitCaseRevision` repo: XÓA `user_facing_stage` write (:466-471) — stage giờ do T9 (`revision_submitted`) lo
- Bỏ check stage tay `validStages` (:165-168) — machine guard lo (chỉ từ `waiting_user`)
- `requireCredits` giữ ở đây (đã có, :151)
- `submitRevisionUseCase` (`/revisions` bare) — giữ nguyên (wired sẵn), quyết định xóa sau khi FE ổn định

### 3. Request More Info (T8 — R6)

```typescript
// admin/application/request-more-info.usecase.ts (SỬA)
// Idempotency (R6): early-return khi ĐÃ ở state request-info của CẢ HAI luồng
if (caseItem.user_facing_stage === 'need_more_information' &&
    (caseItem.internal_status === 'waiting_user' || caseItem.internal_status === 'triage_waiting')) {
  return caseItem;
}
const result = await executeTransition({
  transition: 'T8_REQUEST_INFO', caseId, actorId: adminId, roleVerified: 'ADMIN',
  data: { reason: query },
});
// emitEvent REQUEST_MORE_INFO giữ nguyên sau transition
```

```typescript
// supporter/application/supporter-request-more-info.usecase.ts (SỬA)
// idempotent check giữ nguyên (waiting_user) — supporter T8 vẫn target waiting_user
const result = await executeTransition({
  transition: 'T8_REQUEST_INFO', caseId, actorId: userId, roleVerified: 'SUPPORTER',
  data: { reason: trimmedQuery },
});
```

- `notifyUser` action vẫn no-op — notification thật qua emitEvent ở use case (giữ nguyên)
- Giới hạn: admin T8 chỉ từ triage states (D1); supporter T8 từ `supporter_working` (guard isAssignedSupporter)

### 3b. Assign Supporter atomic (R13)

```typescript
// cases/application/assign-supporter.usecase.ts + admin/application/assign-supporter.usecase.ts (SỬA)
const result = await prisma.$transaction(async (tx) => {
  const r = await transitionInTx(tx, { transition: 'T6_ASSIGN_SUPPORTER', caseId, actorId: adminId, roleVerified: 'ADMIN' });
  await assignCaseSupporterInTx(tx, caseId, adminId, nextSupporterId, nextStatus, supporterName);  // repo helper nhận tx
  return r;
});
```

- Hiện tại T6 (executeTransition) + `assignCaseSupporter` (tx riêng) là 2 tx tách rời → caseEvent có thể persist khi supporter write fail. Gộp 1 tx (R13). Unassign path giữ write trực tiếp (D2)

### 4. F11 — Xóa fallback + isValidStageTransition

- `update-case-status.usecase.ts`: XÓA toàn bộ phần sau `executeTransition` route (validate stage tay, `isValidStageTransition`, prisma.case.update trực tiếp). Cặp `fromStatus:toStatus` không có trong `XSTATE_TRANSITIONS` → throw 400 INVALID_TRANSITION
- XÓA `isValidStageTransition` khỏi `case.types.ts` (:54)
- Cập nhật 3 test file: `upgrade-package.test.ts:45-58`, `phase-06-core-usecases.test.ts:315-320`, `phase-02-lifecycle.test.ts:8-12` — bỏ assert hàm, thay bằng assert machine tương đương (nếu chưa có)

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/services/case-transition.service.ts` | REFACTOR: tách `transitionInTx` + map P2002 (R2, R8) |
| `apps/api/src/modules/cases/application/submit-intake.usecase.ts` | SỬA: dispatch theo internal_status, upsert v00 + upsert docs, bỏ requireCredits |
| `apps/api/src/modules/cases/application/submit-revision.usecase.ts` | SỬA: T11 + T9 upload trong shared tx |
| `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts` | SỬA: `createSupporterOutput` bỏ credit/stage; `submitCaseRevision` bỏ stage write; thêm helper nhận tx (upsert v00, assignCaseSupporterInTx) |
| `apps/api/src/modules/admin/application/request-more-info.usecase.ts` | SỬA: T8 + idempotency triage_waiting |
| `apps/api/src/modules/supporter/application/supporter-request-more-info.usecase.ts` | SỬA: T8 |
| `apps/api/src/modules/cases/application/assign-supporter.usecase.ts` | SỬA: T6 + assign gộp 1 tx |
| `apps/api/src/modules/admin/application/assign-supporter.usecase.ts` | SỬA: T6 + assign gộp 1 tx |
| `apps/api/src/modules/cases/application/update-case-status.usecase.ts` | SỬA: xóa fallback (F11) |
| `apps/api/src/modules/cases/domain/case.types.ts` | SỬA: XÓA `isValidStageTransition` |
| `apps/api/src/shared/infrastructure/tests/upgrade-package.test.ts` | SỬA |
| `apps/api/src/shared/infrastructure/tests/phase-06-core-usecases.test.ts` | SỬA |
| `apps/api/src/shared/infrastructure/tests/phase-02-lifecycle.test.ts` | SỬA |
| `apps/api/src/shared/infrastructure/tests/phase-07-xstate-case-machine.test.ts` | SỬA: thêm test service-level T11/T9 shared tx |

## Todo List

### BE
- [ ] Refactor `case-transition.service.ts`: tách `transitionInTx(tx, params)` (R2) — event emission ở wrapper post-commit
- [ ] Map P2002 → AppError 409 DUPLICATE_CREDIT_CONSUMPTION trong transitionInTx (R8)
- [ ] submit-intake: `updateIntakeDataOnly` (upsert v00 + `upsertDocumentRecordsForUnit`) (D5, R5)
- [ ] submit-intake: dispatch theo `internal_status` (R3) + pre-validation lỗi không leak + bỏ requireCredits (R11)
- [ ] submitRevisionUploadUseCase: wire T9 trong shared tx (R4) — repo bỏ stage write
- [ ] supporter-output: T11 qua `transitionInTx` shared tx, unitCode `buildVersionUnitCode` (R7), repo bỏ credit/stage
- [ ] request-more-info admin + supporter: T8 + admin idempotency thêm triage_waiting (R6)
- [ ] assign supporter (2 use case): T6 + assignCaseSupporter gộp 1 tx (R13)
- [ ] F11: xóa fallback + `isValidStageTransition` + cập nhật 3 test file
- [ ] `grep isValidStageTransition` → 0; `grep executeTransition|transitionInTx` → đủ 13 use case
- [ ] Xóa dead code FE `updateStageMutation` (useCaseDetails.ts:31 — không consumer) — optional
- [ ] `npm run check-types` root PASS

### Verify
- [ ] Test suite API: `npx tsx --test src/shared/infrastructure/tests/` (bỏ qua file env-dependent đã biết)
- [ ] Manual: tạo case → nộp intake (T2) → admin accept → assign → supporter start → request-info → user nộp lại (T2 từ triage_waiting) → không kẹt (#18)
- [ ] Manual: admin request-info lúc triage → user thấy form → nộp → admin thấy lại trong triage
- [ ] Manual: reassign supporter (T6 self-loop) không throw
- [ ] Manual: supporter upload output 2 lần cùng version → 409 (không 500) (R8)
- [ ] Manual: supporter request-info → user bấm /intake → 409 REVISION_REQUIRED (R3)

## Success Criteria

- #17: intake edit bị chặn sau khi submitted (T16 guard) — enforcement qua machine
- #18: admin request-info → user nộp → case về triage_pending, không kẹt (cả 2 đường T8)
- #4: supporter hết credit → T11 guard `hasCredit` chặn TRONG tx (không race double-spend)
- #2: publish/supporter-output lỗi trả message đúng — P2002 → 409, không "lỗi hệ thống" (R8)
- F11: 1 nguồn truth — không còn bảng tay
- Không còn duplicate v00 + DocumentRecord (D5 — hỗ trợ #12)
- T9 enforcement nằm trên đường FE thực dùng (R4)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Refactor transitionInTx phá executeTransition hiện có | Trung bình | Cao | Body giữ nguyên, chỉ tách wrapper; test phase-07 + regression endpoints |
| Bỏ requireCredits (Q5) làm paid case thiếu credit vẫn nộp được | Trung bình | Thấp | Credit check chặn ở T5 accept — đúng design; test lại flow paid |
| submit-intake restructure phá flow hiện có | Trung bình | Cao | Giữ nguyên response shape; test regression intake endpoints |
| T8 admin phá flow supporter đang làm việc | Thấp | Trung bình | Guard isAdmin chỉ từ triage states; supporter_working → admin dùng veto |
| Xóa fallback làm route `/status` FE cũ gọi cặp lạ → 400 | Thấp | Thấp | FE hiện không gọi `/status` (updateStageMutation dead code) — verify trước xóa |
| upsert v00 tạo data không nhất quán với case cũ (thiếu v00) | Trung bình | Thấp | findFirstOrCreate fallback cho legacy case |

## Security Considerations

- T11: credit check TRONG tx — không TOCTOU/double-spend
- T8 supporter: guard `isAssignedSupporter` — không request-info case của người khác
- T2/T16: guard `isOwnerOrMember` — không edit case lạ
- F2 duy trì: roleVerified từ auth middleware, không tin client

## Next Steps

→ Phase 03: thêm allowed_transitions vào admin detail endpoint.
