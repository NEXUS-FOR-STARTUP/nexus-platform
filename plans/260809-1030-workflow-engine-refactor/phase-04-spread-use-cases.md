# Phase 04 — Lan use case qua cổng + FE allowed_transitions

- Priority: P1 | Status: Pending | Effort: 4h (AMENDMENT 2026-08-11: +1h rà soát consumer FE + type allowed_transitions shape change)
- Depends: Phase 03 (CaseTransitionService hoạt động, submit-revision đã chuyển)
- Blocks: Phase 05

## Overview

B3: Chuyển 9 use case qua CaseTransitionService (T2/T16/T5/T11 + T6/T7/T8/T10 — AMENDMENT 2026-08-11). BE: filter allowed_transitions theo stage. FE: render nút theo danh sách (field type đã có sẵn). **Vô hiệu route cũ khi use case chuyển xong** (F5: chống split-brain 2 engine). **Xóa bảng tay `isValidStageTransition`** (F11: hết 3 nguồn truth).

> **Red Team áp dụng:** F5 (split-brain update-case-status), F8 (nested tx submit-intake), F11 (xóa isValidStageTransition), F12 (FE consumers + admin modal hardcode), F15 (bug #12 không claim pha 1).

## Key Insights

- **submit-intake**: 2 đường: nộp lần đầu (T2) + sửa thông tin (T16). Cùng POST `/cases/:id/intake`. Phân biệt: nếu case chưa nộp → T16; đã nộp → T2
- **Q5 (chốt 2026-08-09)**: T2 KHÔNG check credit — XÓA `requireCredits` (case.types.ts:22) khỏi submit-intake. Credit check chuyển về T5 (accept)
- **F8 — nested transaction**: `submitIntakeUseCase` HIỆN TẠI có `prisma.$transaction` riêng (submit-intake.usecase.ts:25). Prisma KHÔNG hỗ trợ nested → **PHẢI xóa outer tx** khi chuyển qua service (service tự lo tx)
- **submit-supporter-output** (T11): credit check trong L2 TRONG tx (F2). Idempotency key `consume-{unitCode}-{caseId}-v{versionNo}`
- **accept** (T5): guard `isPaid` + `hasCredit` — payment status + credit balance fetch TRONG tx (F2, Q5)
- **F5 — split-brain**: `update-case-status.usecase.ts` (13 callers, symflow `applyTransition`) VẪN active khi T5/T6/T7/T8/T10/T11 chuyển XState → 2 engine cùng ghi internal_status → race. **Khi 1 transition chuyển xong → vô hiệu code path cũ ngay** trong update-case-status. Cuối phase này: T5/T6/T7/T8/T10/T11 đã chuyển → chỉ còn T12/T13/T14/T15 qua update-case-status cũ → phase 06 chuyển nốt
- **T6/T7/T8/T10 — AMENDMENT 2026-08-11**: 4 transition đơn giản (chỉ check quyền + đổi state + ghi log, không credit, không file). Chuyển qua cổng trong phase này (ban đầu để ngỏ "tùy quyết định" — đã chốt). Code path: sửa `update-case-status.usecase.ts` — gọi `executeTransition` cho 4 transition này. T6 (gán supporter): accepted_unassigned → assigned. T7 (bắt đầu làm): assigned → supporter_working. T8 (yêu cầu thêm info): supporter_working → waiting_user. T10 (bắt đầu chấm lại): supporter_working → supporter_working (self-loop).
- **veto** (T13): GIỮ NGUYÊN logic cũ (qua symflow) trong phase này — chuyển qua cổng ở phase 06 (kèm T12/T14/T15/T3/T4)
- **resubmit** (T3/T4): GIỮ NGUYÊN `resubmitCaseUseCase` trong phase này — chuyển qua cổng ở phase 06. **F15: bug #12 (resubmit không cập nhật content) fix ở phase 06** — không claim trong phase này
- **FE**: `get-case-detail.usecase.ts:153-159` trả `allowed_transitions` — HIỆN TẠI trả nguyên transitions của symflow, chưa filter. Cần filter theo stage hiện tại + transition-registry
- **F12 — FE consumers**: `AdminCaseDetailModal.tsx:237` hardcode `internal_status === "triage_pending"` — KHÔNG dùng allowed_transitions. Phải check MỌI consumer + update admin modal
- **F11 — 3 nguồn truth**: xóa `isValidStageTransition` (case.types.ts:54) khi `getAvailableTransitions` thay thế. Verify `grep isValidStageTransition` → 0 caller

## Requirements

### BE
1. Chuyển `submitIntakeUseCase` → gọi `executeTransition` (T2 hoặc T16 tùy trạng thái)
2. Chuyển `submitSupporterOutput` → gọi `executeTransition(T11)` + credit check trong L2
3. Chuyển `acceptCaseUseCase` → gọi `executeTransition(T5)` + guard isPaid
4. Chuyển `update-case-status.usecase.ts` cho T6/T7/T8/T10: gọi `executeTransition` (không credit, không file — AMENDMENT 2026-08-11)
5. Sửa `get-case-detail.usecase.ts`: filter `allowed_transitions` theo stage hiện tại
6. GIỮ NGUYÊN: veto (T13), resubmit (T3/T4), completeCase (T14) — logic cũ (chuyển phase 06)

### FE
6. `StatusGuidanceCard.tsx`: đọc `allowed_transitions` từ case detail → render nút tương ứng (KHÔNG hardcode)
7. `onOpenIntake` wiring: giữ nguyên (parent component gọi API)

## Architecture

### 1. Submit Intake (pseudocode)
```typescript
// submit-intake.usecase.ts (SỬA)
export async function submitIntakeUseCase(prisma, params) {
  // L1: validate files (giữ nguyên zod hiện tại)

  // F8: XÓA prisma.$transaction outer (nested transaction crash) — service tự lo tx
  const case_ = await prisma.case.findUniqueOrThrow({ where: { id: params.caseId } });

  // Phân biệt T2 vs T16
  const isFirstSubmission = case_.user_facing_stage === 'intake_pending'
                         || case_.user_facing_stage === 'intake_ready';
  const transition = isFirstSubmission ? 'T2_SUBMIT_INTAKE' : 'T16_EDIT_INTAKE';

  const { stage, status } = await executeTransition(prisma, {
    transition,
    caseId: params.caseId,
    actorId: params.actorId,
    roleVerified: params.roleVerified,     // F6
    data: { files: params.files, checkpointId: params.checkpointId },
  });

  // Trả về response (giữ format cũ)
  return { stage, status };
}
```
- **Fix #12 #13 #17**: upsert doc qua executor (không create trùng), đổi stage+status đồng bộ, T16 chặn sau khi đã nộp
- **F2**: T16 guard chạy TRONG tx (đọc case trong tx) → 2 request T2+T16 đồng thời: 1 thắng, 1 409

### 2. Submit Supporter Output (pseudocode)
```typescript
// submit-revision.usecase.ts — submitSupporterOutputUploadUseCase (:295) (SỬA — cùng file với submitRevisionUseCase)
export async function submitSupporterOutputUploadUseCase(prisma, params) {
  // L1: validate files

  // F2: KHÔNG fetch credit ngoài tx — service fetch TRONG tx (chống TOCTOU/double-spend)
  // Gọi cổng
  const { stage, status } = await executeTransition(prisma, {
    transition: 'T11_SUBMIT_OUTPUT',
    caseId: params.caseId,
    actorId: params.actorId,
    roleVerified: params.roleVerified,     // F6
    data: {
      files: params.files,
      unitCode: params.unitCode,
      versionNo,               // → idempotency key trong executor
    },
  });

  return { stage, status };
}
```
- **Fix #2 #4**: credit check TRONG tx (F2) + guard hasCredit sync; idempotent theo versionNo (không P2002 khi upload version mới)

### 3. Accept (pseudocode)
```typescript
// accept-case.usecase.ts (SỬA)
export async function acceptCaseUseCase(prisma, params) {
  // F2 + Q5: payment status + credit balance fetch TRONG tx (service lo) — không pre-fetch ngoài

  const { stage, status } = await executeTransition(prisma, {
    transition: 'T5_ACCEPT',
    caseId: params.caseId,
    actorId: params.actorId,
    roleVerified: params.roleVerified,     // F6: roleVerified = 'ADMIN' từ session
  });

  return { stage, status };
}
```
- **Fix #9**: accept chỉ allowed khi payment = paid (guard isPaid — service fetch trong tx)
- **Q5**: accept chặn khi balance < 1 (guard hasCredit — service fetch trong tx) — chuyển credit check từ T2 về T5

### 4. Assign, Start Work, Request Info, Start Review (T6/T7/T8/T10 — AMENDMENT 2026-08-11)

4 transition đơn giản — chỉ check quyền + đổi state + ghi caseEvent. Không xử lý credit, không tạo/uplo ad file. Code path: `update-case-status.usecase.ts` (generic route xử lý nhiều transition). Thay `applyTransition` (symflow) bằng `executeTransition` (XState) cho 4 transition này.

```typescript
// update-case-status.usecase.ts (SỬA — F5 per-transition disable)
export async function updateCaseStatusUseCase(prisma, params) {
  // TRƯỚC: gọi symflow applyTransition cho mọi transition
  // SAU: nếu transition ∈ {T6,T7,T8,T10,T12,T13,T14,T15} → gọi executeTransition
  //      (T5 và T11 đã có file riêng, gọi executeTransition ở đó)

  const { caseId, transition: transitionName, actorId, roleVerified, data } = params;

  // T6/T7/T8/T10: chuyển qua cổng mới trong phase này
  if (['T6_ASSIGN_SUPPORTER', 'T7_START_WORK', 'T8_REQUEST_INFO', 'T10_START_REVIEW_REVISION']
      .includes(transitionName)) {
    return executeTransition(prisma, { transition: transitionName, caseId, actorId, roleVerified, data });
  }

  // T12/T13/T14/T15: giữ symflow (chuyển ở phase 06)
  // ... (giữ nguyên code cũ)
}
```

**T6 (gán supporter):** Admin gán supporter cho case. accepted_unassigned → assigned. Guard: isAdmin.
**T7 (bắt đầu làm):** Supporter bắt đầu chấm. assigned → supporter_working. Guard: isAssignedSupporter. Action: setSlaDeadline.
**T8 (yêu cầu thêm info):** Supporter yêu cầu user bổ sung. supporter_working → waiting_user. Guard: isAssignedSupporter. Action: notifyUser.
**T10 (bắt đầu chấm lại):** Supporter chấm revision. supporter_working → supporter_working (self-loop). Guard: isAssignedSupporter.

### 5. BE allowed_transitions filter (pseudocode)

> **AMENDMENT 2026-08-11 (red-team-02 A5):** BE hiện trả `{name, froms, tos}[]` từ `caseWorkflow.transitions` — plan đổi sang `TransitionName[]` (string). Đây là **API contract change**: rà soát MỌI consumer FE (`grep allowed_transitions` toàn web-1), cập nhật type `apps/web-1/types/case.ts:23` (hiện khai `string[]` nhưng BE trả object — type đã lệch reality từ trước khi plan), sửa `useCaseDetails.ts:87` nếu đọc field của object.

```typescript
// get-case-detail.usecase.ts (SỬA :153-159)

// TRƯỚC: trả nguyên transitions
// const allowed_transitions = caseWorkflow.transitions;

// SAU: filter theo stage hiện tại
import { getAvailableTransitions } from '../domain/transition-registry.js';

const allowed_transitions = getAvailableTransitions(case_.internal_status);
// Trả về TransitionName[] mà case HIỆN TẠI có thể thực hiện
// VD: 'triage_pending' → ['T2_SUBMIT_INTAKE', 'T5_ACCEPT', 'T16_EDIT_INTAKE', 'T12_REJECT', 'T15_CANCEL']
// (policy chốt 2026-08-09 — mọi transition active)

caseResponse.allowed_transitions = allowed_transitions;
```

### 4b. F5 — Vô hiệu code path cũ (chống split-brain)

Mỗi use case chuyển qua cổng XONG → code path cũ (symflow) cho transition đó PHẢI bị vô hiệu ngay:

- `update-case-status.usecase.ts` (13 callers, symflow `applyTransition`) — hiện phục vụ T5/T6/T7/T8/T10/T11 path cũ. Khi transition nào chuyển xong → loại transition đó khỏi use case (hoặc feature flag `USE_XSTATE` per transition, mặc định sau khi chuyển = true)
- **KHÔNG để 2 engine cùng active cho cùng 1 transition** — race ghi internal_status
- Transition CHƯA chuyển (T12/T13/T14/T15 — chuyển ở phase 06) vẫn qua symflow path → flag per-transition
- Grep kiểm tra sau khi chuyển: `applyTransition` chỉ còn được gọi bởi transition chưa chuyển

### 4c. F11 — Xóa bảng tay `isValidStageTransition`

- Khi `getAvailableTransitions` thay thế hết callers → XÓA `isValidStageTransition` (case.types.ts:54)
- Verify: `grep isValidStageTransition` toàn codebase → 0 caller
- Còn lại 1 nguồn truth duy nhất: transition-registry (XState)

### 5. FE render nút (pseudocode)
```typescript
// StatusGuidanceCard.tsx (SỬA)
// TRƯỚC: hardcode nút "Chỉnh sửa hồ sơ để nộp lại" (line 210)
// SAU: render từ allowed_transitions

const allowedTransitions = case_.allowed_transitions ?? [];

{allowedTransitions.includes('T2_SUBMIT_INTAKE') && (
  <Button onClick={onOpenIntake}>Nộp hồ sơ</Button>
)}
{allowedTransitions.includes('T16_EDIT_INTAKE') && (
  <Button onClick={onOpenIntake}>Chỉnh sửa hồ sơ</Button>
)}
{allowedTransitions.includes('T5_ACCEPT') && (
  <Button onClick={onAccept}>Duyệt hồ sơ</Button>  // Admin only
)}
// ... etc
```

**Fix #7**: FE không hardcode điều kiện hiển thị nút — render từ danh sách BE trả.

**F12 — FE consumers check (bắt buộc trước khi code):**
- `grep allowed_transitions` toàn web-1 → liệt kê MỌI consumer
- `AdminCaseDetailModal.tsx:237` hardcode `internal_status === "triage_pending"` → chuyển sang đọc `allowed_transitions` (KHÔNG hardcode stage)
- `useCaseDetails.ts:87` dùng `.includes()` — OK với string[] mới

## Related Code Files

| File | Action | Detail |
|---|---|---|
| `apps/api/src/modules/cases/application/submit-intake.usecase.ts` | **SỬA** | Gọi executeTransition (T2/T16) + **xóa outer tx (F8)** |
| `apps/api/src/modules/cases/application/submit-revision.usecase.ts` | **SỬA** | `submitSupporterOutputUploadUseCase` (:295) gọi executeTransition (T11) — cùng file với submitRevisionUseCase |
| `apps/api/src/modules/cases/application/accept-case.usecase.ts` | **SỬA** | Gọi executeTransition (T5) + guard isPaid (service fetch trong tx) |
| `apps/api/src/modules/cases/application/get-case-detail.usecase.ts` | **SỬA** | Filter allowed_transitions (getAvailableTransitions) |
| `apps/api/src/modules/cases/application/update-case-status.usecase.ts` | **SỬA** | F5: gọi executeTransition cho T6/T7/T8/T10 (AMENDMENT 2026-08-11); giữ symflow cho T12/T13/T14/T15 (chuyển phase 06) |
| `apps/api/src/modules/cases/domain/transition-registry.ts` | **SỬA** | `getAvailableTransitions()` (đã thêm phase-02) |
| `apps/api/src/modules/cases/domain/case.types.ts` | **SỬA** | F11: XÓA `isValidStageTransition` (bảng tay) khi hết caller |
| `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts` | **SỬA** | Giảm logic trong repo (logic chuyển lên service) |
| `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx` | **SỬA** | Render nút từ allowed_transitions |
| `apps/web-1/app/admin/_components/AdminCaseDetailModal.tsx` | **SỬA** | F12: bỏ hardcode `internal_status === "triage_pending"`, đọc allowed_transitions |
| `apps/web-1/app/dashboard/case/[id]/page.tsx` (hoặc parent) | **SỬA** | Wire onOpenIntake (nếu chưa) |
| `apps/api/src/modules/cases/application/veto-case.usecase.ts` | **KHÔNG ĐỔI** | GIỮ logic cũ (pha 2) |
| `apps/api/src/modules/cases/application/resubmit-case.usecase.ts` | **KHÔNG ĐỔI** | GIỮ logic cũ (pha 2) — bug #12 fix ở pha 2 (F15) |
| `apps/api/src/modules/cases/application/complete-case.usecase.ts` | **KHÔNG ĐỔI** | Giữ nguyên (mẫu chuẩn) |

## Todo List

### BE
- [ ] Sửa `submit-intake.usecase.ts`: phân biệt T2/T16, gọi executeTransition, **XÓA outer tx (F8)**
- [ ] Sửa `case.repository.ts` submitIntake: xóa logic check tay, delegate cho service
- [ ] Sửa `submit-revision.usecase.ts` (`submitSupporterOutputUploadUseCase`): executeTransition(T11) — credit check trong tx (F2)
- [ ] Sửa `case.repository.ts` createSupporterOutput: xóa credit check + stage update (đã có trong service)
- [ ] Sửa `accept-case.usecase.ts`: executeTransition(T5) — payment trong tx
- [ ] **AMENDMENT 2026-08-11:** Sửa `update-case-status.usecase.ts` cho T6/T7/T8/T10 — gọi executeTransition, giữ symflow cho T12/T13/T14/T15 (chuyển phase 06)
- [ ] **F5:** grep `applyTransition` cuối phase → chỉ T12/T13/T14/T15 còn gọi (mọi transition khác đã qua executeTransition)
- [ ] Sửa `get-case-detail.usecase.ts`: filter allowed_transitions
- [ ] **F11:** xóa `isValidStageTransition` + `grep` → 0 caller
- [ ] Verify: check-types root PASS

### FE
- [ ] **F12:** `grep allowed_transitions` toàn web-1 → liệt kê consumers trước khi sửa
- [ ] **AMENDMENT 2026-08-11:** cập nhật type `allowed_transitions` (shape đổi `{name,froms,tos}[]` → `TransitionName[]`) — type + mọi consumer dùng field object của allowed_transitions
- [ ] Sửa `StatusGuidanceCard.tsx`: đọc allowed_transitions → render nút
- [ ] Sửa `AdminCaseDetailModal.tsx`: bỏ hardcode stage, dùng allowed_transitions (F12)
- [ ] Test manual: case intake_pending → thấy nút "Nộp hồ sơ" (T2)
- [ ] Test manual: case submitted → không thấy nút "Chỉnh sửa" (T16 block sau nộp)
- [ ] Verify: eslint web 0 warning

## Success Criteria

- Submit intake lần đầu → T2, edit → T16 (chỉ khi chưa nộp). Không nested tx (F8)
- Supporter output → credit check TRONG tx + idempotent (upload version 2 không fail P2002) (F2)
- Accept → block nếu chưa paid (fix #9)
- **AMENDMENT 2026-08-11:** T6 (gán supporter) / T7 (bắt đầu làm) / T8 (yêu cầu thêm info) / T10 (bắt đầu chấm lại) hoạt động qua executeTransition — guard đúng quyền, state đổi, caseEvent ghi log
- FE hiển thị nút đúng theo stage (không hardcode, fix #7) — gồm admin modal (F12)
- **F5:** không transition nào còn 2 engine active — `applyTransition` chỉ cho transition chưa chuyển
- **F11:** `grep isValidStageTransition` = 0 caller
- **F15:** bug #12 KHÔNG claim trong phase này (fix ở phase 06 — T3/T4 resubmit chuyển qua cổng)
- Bug #13 #17 #2 #4 #9 #7: verified đóng
- case.repository.ts giảm logic (không vượt thêm)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| submitIntake phân biệt T2/T16 sai | Trung bình | Cao | Test edge: intake_pending → T2, intake_ready → T2, submitted → T16 KHÔNG cho phép |
| getAvailableTransitions trả tên internal XState (không map với FE) | Cao | Trung bình | Map transition name → action label trong FE (hoặc BE trả thêm label) |
| **F5:** quên vô hiệu update-case-status → split-brain 2 engine | Trung bình | Rất cao | Feature flag per-transition BẮT BUỘC + grep applyTransition cuối phase |
| **F8:** sót outer tx (submit-intake) → nested transaction crash | Trung bình | Cao | Code review checklist: grep `$transaction` trong use case đã chuyển |
| **F12:** admin modal vẫn hardcode → nút sai cho admin | Trung bình | Trung bình | grep consumers trước + test manual admin flow |
| case.repository.ts giảm code → lỗi logic cũ không ngờ | Trung bình | Trung bình | Test regression: tất cả use case cũ vẫn hoạt động qua service mới |
| FE onOpenIntake chưa wire → nút không hoạt động | Thấp | Cao | Check parent component trace (researcher-01 chưa tìm thấy). Nếu chưa wire → wire trong phase này |

## Security Considerations

- isPaid guard: fetch payment TRONG tx (không trust client input) (F2)
- Credit check: TRONG tx (không trust client, không race) (F2)
- Actor role: `roleVerified` từ auth middleware — service không tin caller (F6)
- roleVerified từ session (đã verify)

## Next Steps

→ Phase 05: Migrate test phase-07 sang XState, viết test ma trận transitions, regression 14 bugs.
