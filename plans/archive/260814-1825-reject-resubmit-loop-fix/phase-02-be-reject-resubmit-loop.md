# Phase 02 — BE Reject-Resubmit Loop + Wiring

- Priority: P0 | Status: Done | Effort: 8h
- Depends: Phase 01 | Blocks: Phase 03, 04, 05

## Overview

Phase nặng nhất. Đóng vòng nộp lại (D3/D4), wire T2/T16/T11/T9, xóa admin request-more-info (D1), fix veto credit (D5), xóa F11 (D12), dedupe v00 (D13).

## Key Insights

- **R2:** Prisma `TransactionClient` KHÔNG có `$transaction` → tách `transitionInTx(tx, params)`, `executeTransition` = wrapper mở tx + emit post-commit
- **R7/R8:** idempotency key `consume-${buildVersionUnitCode(v)}-${caseId}` (v01 padded); `credit_ledgers.idempotency_key` @unique → P2002 phải map 409
- **D7:** content do use case ghi; transition data KHÔNG mang files → upsertDoc executor giữ no-op (không double-write `revision_document`)
- **R5:** `createDocumentRecordsForUnit` insert-only → phải upsert (D13)
- **R4:** FE student gọi `/revisions/upload` → `submitRevisionUploadUseCase` chưa wire — phải wire T9
- Credit trừ 2 nơi hiện tại (`createSupporterOutput` repo + machine) → sau phase này chỉ còn machine (D9)
- Admin request-more-info ghi thẳng → xóa (D1); supporter request-more-info wire T8 (D10)
- `findOpenRequestsForMoreInfo` match `more_info_requested` (case.repository.ts:395-403) nhưng supporter ghi `request_more_info` → sửa match (D10)

## Changes

### 0. Refactor service — `transitionInTx` (D11, làm ĐẦU TIÊN)

```typescript
// case-transition.service.ts (REFACTOR)
async function transitionInTx(tx: Prisma.TransactionClient, params: TransitionParams) {
  // body hiện tại: findUniqueOrThrow → creditBalance → event → tryTransition
  // → executeAction(...) → updateMany optimistic → caseEvent.create
  // KHÔNG có emitEvent, KHÔNG mở $transaction bên trong
}
export async function executeTransition(params, client?) {
  if (client) return transitionInTx(client, params)
  const result = await prisma.$transaction((tx) => transitionInTx(tx, params))
  // emitEvent CASE_STAGE_CHANGED ở đây (post-commit)
  return result
}
```

- Map P2002 trong `transitionInTx` quanh `executeAction` → `AppError(409, 'DUPLICATE_CREDIT_CONSUMPTION', 'Lượt đánh giá này đã được xử lý')`

### 1. Submit Intake — atomic nộp lại (D3/D4/D7/D9/D13)

**Dispatch theo `internal_status`. `cancelled` = nộp lại ATOMIC trong 1 tx:**

```typescript
// submit-intake.usecase.ts (SỬA)
const caseRecord = await findCaseByIdWithMembersAndCheckpoints(caseId);
// ... checks owner/member
const status = caseRecord.internal_status;

if (status === 'waiting_user') {
  throw new AppError(409, 'REVISION_REQUIRED',
    'Bạn cần nộp bản bổ sung qua luồng yêu cầu thông tin, không phải chỉnh hồ sơ');
}
if (!['triage_pending', 'cancelled'].includes(status)) {
  throw new AppError(400, 'INVALID_CASE_STAGE', 'Hồ sơ đang được xử lý, không thể chỉnh sửa');
}

if (status === 'cancelled') {
  // D3: 1 action atomic — content + transition cùng tx
  return prisma.$transaction(async (tx) => {
    await updateIntakeDataOnlyInTx(tx, caseId, caseRecord, body);  // D13: upsert v00 + upsert docs
    const t = isVetoedCase(caseRecord) ? 'T4_RESUBMIT_AFTER_VETO' : 'T3_RESUBMIT_AFTER_REJECT'; // D4
    return transitionInTx(tx, { transition: t, caseId, actorId: userId,
      roleVerified: 'CUSTOMER', data: {} });                       // D7: không mang files
  });
}

// triage_pending: upsert content trước, rồi dispatch
await updateIntakeDataOnly(caseId, caseRecord, body);
const transition = (stage === 'intake_ready') ? 'T16_EDIT_INTAKE' : 'T2_SUBMIT_INTAKE';
return executeTransition({ transition, caseId, actorId: userId,
  roleVerified: 'CUSTOMER', data: {} });                          // D7
```

- `isVetoedCase`: event gần nhất `event_type === 'vetoed'` (đã có trong events) → T4; ngược lại → T3 (D4)
- **`updateIntakeDataOnly(InTx)` — chỉ string, KHÔNG tạo v00 trùng, KHÔNG mutate doc**: cập nhật case fields (school, course_context, group_no, team_name, content) + log `case_resubmitted`/`intake_edited` + notify. **KHÔNG** `lifecycleUnit.create` v00 mới (gốc bug trùng lặp hiện tại ở submit-intake.usecase.ts:51-61). Nhận `tx` optional.
- **Document immutability (theo design contract)**: v00 docs bất biến sau nộp. Thay đổi doc = `upsertDocumentRecordsForUnit` (ID deterministic — file cùng identity thì replace, khác thì thêm row), HOẶC qua version unit mới `vNN` bằng luồng T9. Chốt nuance (plan.md "Chưa chốt" #2): reject→resubmit ở triage = sửa doc hợp lệ vì chưa review; mid-review = FROZEN, thêm mới chỉ qua T9 revision (machine guard `isBeforeSubmission` đã chặn T16 sau nộp).
- **Bỏ `requireCredits`** (D9) — credit check nằm ở T5 accept; credit mua SAU tạo case qua orders (không phải "lúc tạo case" như plan cũ ghi sai)
- T3 guard `hasCredit`: nếu rejected mà hết credit → sinh viên mua thêm trước khi nộp lại (đúng design); T4 (veto) free — credit đã về 0 theo D5

### 2. Supporter Output (T11 — D11, R7, R8)

- `submitSupporterOutputUploadUseCase`: mở 1 tx → `createSupporterOutputDocs(tx, ...)` + `transitionInTx(tx, { transition: 'T11_SUBMIT_OUTPUT', data: { unitCode: buildVersionUnitCode(versionNo) } })`
- `case.repository.createSupporterOutput`: XÓA credit check (:521-528) + credit consume (:563-573) + stage write (:542-548) — chỉ giữ unit/docs (đổi tên `createSupporterOutputDocs` nhận tx)
- Machine `subtractCredit` idempotency key khớp format cũ (v01)
- P2002 → 409 ở service (R8)

### 2b. Submit Revision Upload (T9 — R4)

- `submitRevisionUploadUseCase`: 1 tx → `submitCaseRevisionInTx(tx, ...)` (repo bỏ stage write :466-471) + `transitionInTx(tx, { transition: 'T9_SUBMIT_REVISION', roleVerified: 'CUSTOMER', data: {} })`
- Bỏ check stage tay `validStages` (:165-168) — machine guard lo (chỉ từ `waiting_user`)
- `requireCredits` giữ ở đây (:151)
- `submitRevisionUseCase` (`/revisions` bare) — giữ nguyên, đánh dấu deprecated

### 3. Xóa admin request-more-info (D1)

- Xóa route `POST /admin/cases/:id/request-more-info` (admin.routes.ts:31)
- Xóa `adminRequestMoreInfoUseCase` + repo `requestCaseMoreInfo` nếu không còn caller khác
- Admin "yêu cầu làm rõ" = gõ lý do trong modal Từ chối (T12) — lý do hiện cho sinh viên (phase 04)

### 3b. Supporter request-more-info — wire T8 (D10)

- `supporterRequestMoreInfoUseCase`: giữ idempotent check `waiting_user` → `executeTransition({ transition: 'T8_REQUEST_INFO', roleVerified: 'SUPPORTER', data: { reason: trimmedQuery } })`
- `findOpenRequestsForMoreInfo` (repo): match `request_more_info` (thêm vào danh sách event_type)

### 4. Veto refund — giữ VND-only (D5)

- `refundCredit` executor (case-transition.service.ts:146-153) **GIỮ NGUYÊN**: chỉ refund VND (`walletService.refund`) theo `locked_price`. **KHÔNG đụng creditLedger** — không zero credit, không hoàn credit (D5 đã chốt lại)
- Chuỗi đóng khớp: veto → tiền về ví → user không nộp lại thì xong; user nộp lại (T4 free) → T5 accept cần credit → mua lại credit bằng tiền vừa hoàn
- Lưu ý T13 guard `isWithin48h` (chỉ veto trong 48h) và T12 reject **cố ý** không refund (credit là công review đã tiêu) — giữ nguyên
- **KHÔNG thêm bất kỳ credit zeroing nào** — bug "credit=0 chặn" nằm ở `requireCredits`, sửa ở §7, không sửa ở đây

### 7. `requireCredits` audit — sửa mâu thuẫn với `hasCredit` (D15/D16)

`requireCredits` (case.types.ts:77-90) chỉ check `balance >= 1`, KHÔNG skip `locked_price=0` → mâu thuẫn với machine `hasCredit` (case-machine.ts:30-33, free case pass). `create-case` không cấp credit cho ai → free case `balance=0` vĩnh viễn.

| Chỗ | Fix |
|---|---|
| `submit-intake.usecase.ts:22` | **Bỏ `requireCredits`** — gate credit thuộc machine T5/T3 `hasCredit`. (gộp vào §1) |
| `submit-revision.usecase.ts:151,306` | **Bỏ `requireCredits`** — upload v02 nằm trong vòng review đã trả (T9 không cần credit mới) |
| `send-message.usecase.ts:37` | **Thay bằng quy tắc D16** (bên dưới) |

- Nếu còn giữ `requireCredits` ở đâu: phải thêm `if locked_price === 0 → return` để đồng bộ `hasCredit`

### 7b. Chat access rule — D16 (thay `requireCredits` + block `isFinalCaseStage`)

`send-message.usecase.ts` hiện chặn 2 lớp: `requireCredits` (:37) + `isFinalCaseStage` (:33-35). Thay bằng gate chung cho **student + supporter** (supporter chỉ nhắn được khi chat mở — không có chuyện supporter nhắn mà user không reply được):

```typescript
// chat-access.ts (TẠO — helper mới, gate CHUNG cho mọi role, không bypass)
// Quy tắc (theo quyết định user — D16):
//   free case (locked_price=0) → ĐÓNG vĩnh viễn (chat = đặc quyền trả phí)
//   stage 'rejected'          → ĐÓNG
//   stage 'closed'            → ĐÓNG vĩnh viễn
//   credit > 0                → MỞ
//   complete khi credit > 0   → MỞ thêm 1 ngày từ lúc complete, sau đó ĐÓNG
//   hết credit                → KHÓA 1 ngày từ lúc hết, sau 1 ngày MỞ LẠI
//   complete khi đã hết credit → không đếm lại (timer hết credit giữ nguyên)
//   chat đóng → liên hệ NGOÀI hệ thống (email/phone) — không bypass role nào

async function canSendMessage(caseRecord, creditBalance) {
  if (caseRecord.locked_price === 0) return { ok: false, code: 'CHAT_FREE_TIER' };
  if (caseRecord.user_facing_stage === 'rejected') return { ok: false, code: 'CHAT_REJECTED' };
  if (caseRecord.user_facing_stage === 'closed') return { ok: false, code: 'CHAT_CLOSED' };

  if (creditBalance > 0) {
    if (caseRecord.user_facing_stage === 'completed') {
      const completedAt = /* CaseEvent T14_COMPLETE created_at */;
      const elapsed = Date.now() - completedAt.getTime();
      return elapsed < 24h
        ? { ok: true }
        : { ok: false, code: 'CHAT_CLOSED' };                               // hết grace 1 ngày
    }
    return { ok: true };
  }

  // credit = 0
  const exhaustedAt = /* created_at ledger entry có balance_after=0 gần nhất */;
  const elapsed = Date.now() - exhaustedAt.getTime();
  return elapsed >= 24h
    ? { ok: true }                                                          // mở lại sau 1 ngày
    : { ok: false, code: 'CHAT_LOCKED', unlockInMs: 24h - elapsed };
}
```

- Gate áp dụng **mọi role** kể cả admin — không bypass (user: liên hệ ngoài hệ thống, giảm phức tạp). Supporter chỉ nhắn được khi chat mở → không có chuyện supporter nhắn mà user không reply được
- Timer derive từ dữ liệu có sẵn, **KHÔNG migration** (đã chốt): hết credit = `created_at` ledger entry có `balance_after=0`; complete = `created_at` CaseEvent `T14_COMPLETE`
- Bỏ block `isFinalCaseStage` — thay bằng các nhánh stage trong gate (`closed`/`rejected` đóng, `completed` grace 1 ngày)
- Response 402/409 kèm `code` + `unlockInMs` để FE hiện đúng trạng thái + countdown
- **Giao tiếp triage không cần chat**: admin reject reason (T12, guard `reasonMinLength` ≥10 ký tự bắt buộc) hiện cho student (phase-04 fix match event). Mid-review: supporter dùng T8 request-info (kèm query message) — đủ "chỉ ra chỗ sai", không cần supporter chat ở giai đoạn chưa assign
- FE: `TabDiscussionChat.tsx` thay lock theo `creditBalance` bằng theo `code`/`unlockInMs` (chuyển vào phase-04/05)

### 5. Assign Supporter atomic (D12 — R13)

- `assign-supporter.usecase.ts` (cases + admin module): 1 tx → `transitionInTx(tx, { transition: 'T6_ASSIGN_SUPPORTER', roleVerified: 'ADMIN' })` + `assignCaseSupporterInTx(tx, ...)`
- Unassign giữ write trực tiếp (documented exception)

### 6. F11 — Xóa fallback + isValidStageTransition

- `update-case-status.usecase.ts`: xóa validate stage tay + `isValidStageTransition` + `prisma.case.update` trực tiếp. Cặp không có trong map → 400 INVALID_TRANSITION
- Xóa `isValidStageTransition` khỏi `case.types.ts:54`
- Cập nhật 3 test file: upgrade-package.test.ts:45-58, phase-06-core-usecases.test.ts:315-320, phase-02-lifecycle.test.ts:8-12

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/services/case-transition.service.ts` | REFACTOR: transitionInTx + P2002 map + refundCredit credit decrement + TARGET_STAGE T16 (phase 01) |
| `apps/api/src/modules/cases/application/submit-intake.usecase.ts` | SỬA: atomic resubmit T3/T4, T2/T16, upsert v00, bỏ requireCredits |
| `apps/api/src/modules/cases/application/submit-revision.usecase.ts` | SỬA: T11 + T9 trong shared tx |
| `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts` | SỬA: bỏ credit/stage write khỏi createSupporterOutput + submitCaseRevision; upsertDocumentRecordsForUnit; findOpenRequestsForMoreInfo match; helper nhận tx |
| `apps/api/src/modules/admin/application/request-more-info.usecase.ts` | XÓA (cùng route + handler) |
| `apps/api/src/modules/supporter/application/supporter-request-more-info.usecase.ts` | SỬA: wire T8 |
| `apps/api/src/modules/cases/application/assign-supporter.usecase.ts` + admin version | SỬA: gộp 1 tx |
| `apps/api/src/modules/cases/application/update-case-status.usecase.ts` | SỬA: xóa fallback (F11) |
| `apps/api/src/modules/cases/domain/case.types.ts` | SỬA: XÓA isValidStageTransition |
| 4 test files (phase-07, upgrade-package, phase-06, phase-02) | SỬA |

## Todo List

- [x] transitionInTx refactor + P2002→409
- [x] submit-intake: atomic resubmit T3/T4 + T2/T16 dispatch + upsert v00/docs + bỏ requireCredits
- [x] T11 qua transitionInTx + repo bỏ credit/stage
- [x] T9 qua transitionInTx + repo bỏ stage write + bỏ validStages
- [x] Xóa admin request-more-info (route + handler + use case)
- [x] Supporter request-more-info wire T8 + fix findOpenRequestsForMoreInfo match
- [x] refundCredit giữ VND-only (D5 — KHÔNG đụng creditLedger, todo cũ "creditLedger -= 1" đã bỏ)
- [x] Assign gộp 1 tx (2 use case)
- [x] F11: xóa fallback + isValidStageTransition + 3 test file
- [x] `grep isValidStageTransition` → 0; `grep executeTransition|transitionInTx` → đủ use case
- [x] `npm run check-types` root PASS

## Verify

- [ ] Test API: `npx tsx --test src/shared/infrastructure/tests/` (bỏ env-dependent đã biết)
- [ ] Manual: reject → sửa hồ sơ → lưu → case về triage_pending → admin thấy (nộp lại loop)
- [ ] Manual: veto → refund VND + credit 0 → nộp lại T4 free → mua credit lại → T5 ok
- [ ] Manual: supporter upload output 2 lần cùng version → 409
- [ ] Manual: supporter request-info → user bấm /intake → 409 REVISION_REQUIRED
- [ ] Manual: admin KHÔNG còn nút/endpoint yêu cầu làm rõ

## Success Criteria

- Vòng reject → nộp lại chạy trọn, content nộp lại được lưu, không dead state
- #18 đóng: đường admin request-info ghi thẳng bị xóa — không còn cách tạo `waiting_user` không supporter
- #17: intake edit bị chặn sau submitted (T16 guard)
- #4: T11 credit check trong tx — không double-spend
- #2: P2002 → 409, không 500
- F11: 1 nguồn truth; không duplicate v00/DocumentRecord (hỗ trợ #12)
- Veto: refund VND vào ví, KHÔNG đụng creditLedger (D5)

## Security Considerations

- T11 credit check TRONG tx — không TOCTOU
- T8 supporter: guard isAssignedSupporter
- T3/T4: guard isOwner; T2/T16: guard isOwnerOrMember
- roleVerified từ auth middleware, không tin client

## Next Steps

→ Phase 03: allowed_transitions cho admin detail.
