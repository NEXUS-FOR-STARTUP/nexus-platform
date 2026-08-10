# Phase 03 — CaseTransitionService + submit-revision

- Priority: P1 | Status: Pending | Effort: **5h** (red team F10: executor 8 nhánh DB ops + tx pattern, estimate 3.5h quá thấp)
- Depends: Phase 02 (transition-registry hoạt động)
- Blocks: Phase 04

## Overview

B2: Viết `case-transition.service.ts` — cổng 5 lớp (L1→L5) cho mọi use case thay đổi state. **Toàn bộ L2-L4 chạy trong MỘT transaction** (F2: chống TOCTOU). Chuyển **submitRevisionUseCase** qua cổng (bug Critical #18: đổi cả 2 cột + resume_work tự động). Mở rộng test phase-07.

> **Red Team áp dụng:** F1 (bỏ STAGE_STATUS_MAP → TARGET_STAGE theo transition), F2 (tx bao trùm + version_no optimistic lock), F3 (AppError 3-arg), F6 (role từ session), F7 (upsert composite unique + derive lifecycleUnitId + test trước khi wire), F13 (metadata whitelist + actor_role).

## Key Insights

- **Mẫu chuẩn**: `completeCaseUseCase` (complete-case.usecase.ts:9) — `canTransition` + `applyTransition` trong tx + emit `CASE_STAGE_CHANGED` sau commit. Pattern 5 lớp ánh xạ direct:
  - L1: zod validation (đã có sẵn trong use case, không cần thêm)
  - L2: guard (fetch case TRONG tx, nạp vào event.data, gọi `tryTransition`)
  - L3: transition (XState `transition()`) — chỉ quản lý internal_status
  - L4: action executor (cùng tx: upsert doc, đổi stage+status, trừ credit)
  - L5: emit event bus sau commit
- **F2 — KHÔNG TOCTOU**: `findUniqueOrThrow` + guard + transition + actions trong 1 `prisma.$transaction(async tx => {...})`. Case đọc TRONG tx. Kèm optimistic lock `version_no` (thêm ở phase-01): `UPDATE ... WHERE id = ? AND version_no = ?` → 0 row affected = conflict → throw 409 retry. Credit/payment fetch TRONG tx (chống double-spend T11, T16 sửa sau nộp)
- **F1 — KHÔNG STAGE_STATUS_MAP 1:1**: một internal_status → nhiều stage tùy ngữ cảnh (triage_pending → intake_pending lúc khởi tạo, → submitted sau T2; supporter_working → under_review sau T7, → revision_submitted sau T9). Thay bằng `TARGET_STAGE: Record<TransitionName, CaseStage>` — mỗi transition khai báo stage đích theo transition table v2
- **F3 — AppError**: `AppError(status, code, message, details?)` 3-arg bắt buộc (`shared/domain/app-error.ts`). KHÔNG dùng 2-arg
- **F6 — actor**: service nhận `actorId` + `session` (hoặc `roleVerified` từ auth middleware), KHÔNG nhận `actor.role` từ caller → không spoof admin
- **F7 — upsert**: `upsertDocumentRecordsForUnit` dùng composite unique `where: { lifecycle_unit_id_doc_type_seq }` (KHÔNG `where: {id}` — sinh row trùng). `lifecycleUnitId` derive từ case record TRONG tx, không từ `data` thô. P2002 → map lỗi rõ (NO_CREDITS/INVALID)
- **F13 — caseEvent**: metadata whitelist field + thêm `actor_role` (schema phase-01)
- Executor chạy action tuần tự: `for (const action of actions) await execute(action, tx)` — mỗi action biết tự làm gì (saveDoc → upsert, subtractCredit → ledger, autoResumeWork → đổi stage)
- Submit-revision (T9): từ `waiting_user` → `supporter_working` (internal_status), `revision_submitted` → `supporter_working` stage đích `revision_submitted` (F1 — KHÔNG phải under_review). **Fix #18**: đổi cả 2 cột + **tự động resume_work** (transition target = supporter_working)

## Requirements

1. `CaseTransitionService.execute({ transition, caseId, actorId, roleVerified, data })` — cổng duy nhất
2. L1: validate data (delegate cho use case — service chỉ validate transition name hợp lệ + blocked check)
3. L2: **TRONG tx**: fetch case record + payment/credit → nạp vào event guard data → gọi `tryTransition()` (F2)
4. L3: nếu `tryTransition` trả null → throw AppError(400, 'INVALID_TRANSITION', ...) (guard fail)
5. L4: cùng tx: loop actions + upsert doc + đổi stage/status + **UPDATE có WHERE version_no** (optimistic lock)
6. L5: emit event bus (SAU commit, pattern completeCase) — KHÔNG await nếu `emitEvent` trả void (F5 phase-05 verify DomainEvent type)
7. Chuyển submitRevisionUseCase: xóa check tay + gọi service
8. Test: submit-revision qua service → verify stage+status đều đổi

## Architecture (pseudocode)

```typescript
// apps/api/src/modules/cases/application/case-transition.service.ts (MỚI ~250 dòng)

import type { Prisma, PrismaClient } from '@prisma/client';
import { tryTransition, isBlockedTransition, restoreMachine } from '../domain/transition-registry.js';
import type { TransitionName, TransitionEvent, ActionName, CaseStage, InternalStatus } from '../domain/transition.types.js';
import { upsertDocumentRecordsForUnit } from '../../documents/infrastructure/persistence/document.repository.js';
import { emitEvent } from '../../../shared/domain/domain-events.js';
import { DOMAIN_EVENTS } from '../../../shared/domain/domain-events.js';
import { AppError } from '../../../shared/domain/app-error.js';   // F3: 3-arg (status, code, message, details?)
import logger from '../../../shared/infrastructure/logger.js';

// ============================================================
// F1: TARGET_STAGE — stage đích của TỪNG transition (transition table v2).
// KHÔNG map 1:1 theo internal_status (1 status → nhiều stage tùy ngữ cảnh).
// ============================================================
const TARGET_STAGE: Partial<Record<TransitionName, CaseStage>> = {
  T1_CREATE_CASE: 'intake_pending',
  T2_SUBMIT_INTAKE: 'submitted',            // ← KHÔNG phải intake_pending
  T3_RESUBMIT_AFTER_REJECT: 'submitted',
  T4_RESUBMIT_AFTER_VETO: 'submitted',
  T5_ACCEPT: 'under_review',
  T6_ASSIGN_SUPPORTER: 'under_review',
  T7_START_WORK: 'under_review',
  T8_REQUEST_INFO: 'need_more_information',
  T9_SUBMIT_REVISION: 'revision_submitted', // ← KHÔNG phải under_review
  T10_START_REVIEW_REVISION: 'under_review',
  T11_SUBMIT_OUTPUT: 'report_ready',
  T12_REJECT: 'rejected',
  T13_VETO: 'rejected',
  T14_COMPLETE: 'completed',
  T15_CANCEL: 'closed',
  T16_EDIT_INTAKE: 'intake_pending',        // self-loop — stage giữ nguyên (chỉ khi chưa nộp)
};

function targetStageFor(transition: TransitionName): CaseStage {
  const stage = TARGET_STAGE[transition];
  if (!stage) throw new AppError(500, 'UNKNOWN_TRANSITION', `Không có targetStage cho ${transition}`);
  return stage;
}

// ============================================================
// EXECUTOR — chạy action tuần tự (async)
// ============================================================
async function executeAction(
  actionName: ActionName,
  params: unknown,
  tx: Prisma.TransactionClient,
  caseId: string,
  context: { unitCode?: string; uploaderId?: string; versionNo?: number; actorId?: string }
): Promise<void> {
  switch (actionName) {
    case 'upsertDoc': {
      // F7: gọi upsertDocumentRecordsForUnit (document.repository.ts:224)
      // upsert theo composite unique where: { lifecycle_unit_id_doc_type_seq }
      //   (KHÔNG where: {id} — sinh row trùng vi phạm @@unique mới → P2002)
      // lifecycleUnitId derive từ case record (context) — KHÔNG từ params thô (attacker-controlled)
      // P2002 bắt → throw AppError(400, 'DOC_UPSERT_CONFLICT', ...) — không để raw P2002 ra FE
      // KHÔNG dùng createDocumentRecordsForUnit (cũ) vì luôn create mới → spam #13
      break;
    }
    case 'subtractCredit': {
      // F2: TRONG tx — SELECT credit ledger row FOR UPDATE (hoặc version_no lock) trước khi trừ
      // Idempotency key: `consume-{unitCode}-{caseId}-v{versionNo}` — unique constraint chặn double-deduct
      // Key trùng (replay) → KHÔNG lỗi, trả về success (idempotent)
      break;
    }
    case 'refundCredit': {
      // T13 veto — Q1b: hoàn 100% credit. Pattern vetoCaseUseCase:31-50 (đã verify code thật):
      // getCreditBalanceForTx(tx, caseId) → balance > 0 → creditLedger.create({
      //   case_id, amount: -balance, balance_after: 0, type: 'refund',
      //   idempotency_key: `veto_{caseId}_{Date.now()}`, metadata_json: { action: 'admin_veto', admin_id, reason } })
      // CHỈ T13 gọi — T12/T15 KHÔNG refund (Q3). Zero-out balance, atomic trong tx (F2)
      break;
    }
    case 'setSlaDeadline': {
      // Set sla_deadline_at = now + 48h trên case (pattern từ symflow SLA hook)
      break;
    }
    case 'autoResumeWork': {
      // T9: stage → revision_submitted (đã nằm trong TARGET_STAGE của T9) — không cần action riêng
      // Giữ action như no-op hook (hoặc bỏ khỏi machine) — quyết định lúc implement
      break;
    }
    case 'resetStatus': {
      // Reset case về triage_pending (resubmit — pha 2)
      break;
    }
    case 'notifyUser': {
      // KHÔNG tạo notification trong tx — move lên L5 (sau commit). No-op ở đây (F2: chỉ DB write trong tx)
      break;
    }
    case 'emitStageChanged': {
      // No-op trong tx — emit ở L5 (F2)
      break;
    }
    case 'lockPrice': {
      // Lock giá case (last_price_changed_at = now)
      break;
    }
  }
}
```

```typescript
// ============================================================
// CỔNG CHÍNH
// ============================================================
interface TransitionParams {
  transition: TransitionName;
  caseId: string;
  actorId: string;                    // F6: từ auth middleware (session)
  roleVerified: string;               // F6: role từ session — KHÔNG từ body/caller
  data?: Record<string, unknown>;
}

export async function executeTransition(
  prisma: PrismaClient,
  params: TransitionParams
): Promise<{ stage: CaseStage; status: InternalStatus }> {
  const { transition: transitionName, caseId, actorId, roleVerified, data } = params;

  // === L1: Validation (ngoài tx — không đụng DB) ===
  // isBlockedTransition giờ luôn trả false (policy chốt 2026-08-09 — hết blocked).
  // Giữ check để bảo vệ tương lai (nếu có transition tạm khóa mới)
  if (isBlockedTransition(transitionName)) {
    throw new AppError(501, 'NOT_IMPLEMENTED', `Transition ${transitionName} chưa được implement`);
  }

  // === F2: L2 + L3 + L4 trong MỘT transaction (chống TOCTOU) ===
  // Case đọc TRONG tx → guard chạy trên dữ liệu mới nhất → write cùng tx
  return prisma.$transaction(async (tx) => {
    // --- L2: Guard ---
    const caseRecord = await tx.case.findUniqueOrThrow({ where: { id: caseId } });
    const currentStatus = caseRecord.internal_status as InternalStatus;

    const event: TransitionEvent = {
      type: transitionName,
      actor: { id: actorId, role: roleVerified },   // F6: role từ session, không tin caller
      data: {
        ...data,
        // F7: lifecycleUnitId derive từ case record — KHÔNG lấy từ data thô
        caseOwnerId: caseRecord.owner_id,
        caseAssignedSupporterId: caseRecord.assigned_supporter_id,
        caseStage: caseRecord.user_facing_stage,
        caseCreatedAt: caseRecord.created_at,
        caseVersionNo: caseRecord.version_no,
        // F2: fetch TRONG tx (dữ liệu mới nhất, không race):
        creditBalance: ['T11_SUBMIT_OUTPUT', 'T5_ACCEPT', 'T3_RESUBMIT_AFTER_REJECT'].includes(transitionName)
          ? await getCreditBalanceInTx(tx, actorId)       // SELECT ... FOR UPDATE
          : undefined,
        paymentStatus: transitionName === 'T5_ACCEPT'
          ? (await tx.payment.findFirst({ where: { case_id: caseId } }))?.status ?? 'unpaid'
          : undefined,
        roleVerified,   // F6: guard isAdmin/isSupporter đọc cái này
      },
    };

    const transitionResult = tryTransition(currentStatus, event);
    if (!transitionResult) {
      throw new AppError(400, 'INVALID_TRANSITION', `Không thể thực hiện ${transitionName} từ trạng thái hiện tại`);
    }

    const [nextState, actions] = transitionResult;
    const nextStatus = nextState.value as InternalStatus;
    // F1: stage đích từ TARGET_STAGE theo transition — KHÔNG suy từ status
    const nextStage = targetStageFor(transitionName);

    // --- L4: Action (cùng tx) ---
    for (const action of actions) {
      await executeAction(action.type as ActionName, (action as any).params, tx, caseId, {
        unitCode: (data as any)?.unitCode,
        versionNo: (data as any)?.versionNo,
        actorId,
      });
    }

    // --- L3 write + optimistic lock (F2): UPDATE có WHERE version_no ---
    const updated = await tx.case.updateMany({
      where: { id: caseId, version_no: caseRecord.version_no },  // 0 row = conflict
      data: {
        user_facing_stage: nextStage,
        internal_status: nextStatus,
        version_no: { increment: 1 },
      },
    });
    if (updated.count === 0) {
      throw new AppError(409, 'TRANSITION_CONFLICT', 'Case đã bị thay đổi bởi request khác — thử lại');
    }

    // --- F13: caseEvent — metadata whitelist + actor_role ---
    await tx.caseEvent.create({
      data: {
        case_id: caseId,
        type: transitionName,
        actor_id: actorId,
        actor_role: roleVerified,                    // F13: audit theo role
        metadata: pickAllowedMetadata(data ?? {}),   // F13: whitelist field, KHÔNG lưu data thô
      },
    });

    return {
      stage: nextStage,
      status: nextStatus,
      caseCode: caseRecord.case_code,
      fromStage: caseRecord.user_facing_stage,
      fromStatus: currentStatus,
    };
  }).then(async ({ stage, status, caseCode, fromStage, fromStatus }) => {
    // === L5: Effect (SAU commit) ===
    // F3/F5: verify DomainEvent type — copy pattern update-case-status.usecase.ts:157-169
    // (có actorId + occurredAt). Nếu emitEvent trả void → KHÔNG await
    try {
      await emitEvent({
        eventId: crypto.randomUUID(),
        type: DOMAIN_EVENTS.CASE_STAGE_CHANGED,
        payload: { caseId, caseCode, fromStage, toStage: stage },
      });
    } catch (err) {
      logger.error({ err, caseId, transition: transitionName }, 'L5 emit event failed — non-blocking');
    }

    logger.info({ caseId, transition: transitionName, from: fromStatus, to: status }, 'Transition executed');
    return { stage, status };
  });
}
```

### Submit-revision qua cổng (pseudocode sửa use case)

```typescript
// apps/api/src/modules/cases/application/submit-revision.usecase.ts (SỬA)
// TRƯỚC: tự check tay + gọi submitCaseRevision (repo) → chỉ đổi stage, không đổi status
// SAU: gọi executeTransition + upsert doc

export async function submitRevisionUseCase(
  prisma: PrismaClient,
  params: { caseId: string; actorId: string; roleVerified: string; files: any[]; /* ... */ }
) {
  // 1. Validate files (L1 — giữ nguyên zod check hiện tại)

  // 2. Gọi cổng transition (L2-L5) — F6: truyền actorId + roleVerified từ session
  const { stage, status } = await executeTransition(prisma, {
    transition: 'T9_SUBMIT_REVISION',  // từ waiting_user → supporter_working
    caseId: params.caseId,
    actorId: params.actorId,
    roleVerified: params.roleVerified,
    data: { files: params.files, versionNo: currentVersionNo + 1 },
  });

  // 3. Trả về response
  return { stage, status };
}
```

**Fix #18:**
- Trước: `submitCaseRevision` chỉ update `user_facing_stage: 'revision_submitted'` (:466-471), internal_status không đổi → kẹt `waiting_user` mãi mãi
- Sau: `T9_SUBMIT_REVISION` target `supporter_working` → đổi cả 2 cột: `internal_status: 'supporter_working'` + `user_facing_stage: 'revision_submitted'` (F1: TARGET_STAGE của T9 — KHÔNG phải under_review)
- Auto-resume: transition tự động chuyển từ `waiting_user` → `supporter_working` → không cần supporter bấm "bắt đầu chấm" lại

## Related Code Files

| File | Action | Detail |
|---|---|---|
| `apps/api/src/modules/cases/application/case-transition.service.ts` | **MỚI** | Cổng 5 lớp, tx bao trùm (F2) |
| `apps/api/src/modules/cases/application/submit-revision.usecase.ts` | **SỬA** | Chuyển qua service |
| `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts` | **SỬA** | Thêm hàm `updateCaseStageStatus` (có WHERE version_no — F2) hoặc inline trong service |
| `apps/api/src/modules/documents/infrastructure/persistence/document.repository.ts` | **SỬA** | Đổi `upsertDocumentRecord` sang `where: { lifecycle_unit_id_doc_type_seq }` (composite unique — F7) + wire `upsertDocumentRecordsForUnit` (0 caller → gọi từ executor) |
| `apps/api/src/shared/domain/domain-events.ts` | **THAM CHIẾU** | Dùng `DOMAIN_EVENTS.CASE_STAGE_CHANGED`. Verify DomainEvent type: actorId + occurredAt (F5) |
| `apps/api/src/shared/domain/app-error.ts` | **THAM CHIẾU** | AppError(status, code, message, details?) — 3-arg (F3). Verify import path thật |
| `apps/api/src/modules/cases/domain/transition-registry.ts` | **THAM CHIẾU** | Gọi `tryTransition`, `isBlockedTransition`, `restoreMachine` |
| `apps/api/src/modules/cases/domain/transition.types.ts` | **THAM CHIẾU** | Types |
| `apps/api/src/shared/infrastructure/tests/phase-07-symflow-transitions.test.ts` | **SỬA** | Thêm test T9 (phase 05 sẽ migrate toàn bộ) |

## Todo List

- [ ] Verify `AppError` thật: `shared/domain/app-error.ts` signature (F3) + `emitEvent` DomainEvent type (F5) — TRƯỚC khi code
- [ ] **F7: viết integration test `upsertDocumentRecordsForUnit` TRƯỚC khi wire** (hàm 0 caller, 0 test — chưa ai biết nó chạy đúng)
- [ ] Tạo `case-transition.service.ts` — `executeTransition()` cổng 5 lớp, L2-L4 trong 1 tx (F2)
- [ ] Implement `TARGET_STAGE` map theo transition (F1) — KHÔNG STAGE_STATUS_MAP
- [ ] Implement optimistic lock: `updateMany({ where: { id, version_no } })` + 409 TRANSITION_CONFLICT (F2)
- [ ] Implement `executeAction()` — switch/case 8 action names. Trong tx: upsert (composite unique), subtractCredit (FOR UPDATE + idempotent), setSlaDeadline. notifyUser/emitStageChanged = no-op (L5)
- [ ] Sửa `document.repository.ts`: upsert theo composite unique `where: { lifecycle_unit_id_doc_type_seq }` (F7)
- [ ] Sửa `submit-revision.usecase.ts`: xóa check tay + gọi `executeTransition` (truyền actorId + roleVerified)
- [ ] Sửa `case.repository.ts`: nếu cần thêm hàm update stage+status (WHERE version_no)
- [ ] caseEvent: metadata whitelist (F13) + actor_role field
- [ ] Test: submit-revision → verify DB có stage + status mới (manual hoặc test file)
- [ ] Test: submit-revision từ stage KHÔNG waiting_user → expect 400 INVALID_TRANSITION
- [ ] Test: 2 request song song cùng case → 1 success + 1 409 (F2)

## Success Criteria

- `executeTransition` gọi từ submitRevisionUseCase → case record có cả `user_facing_stage` + `internal_status` đổi
- **F1**: T9 → `user_facing_stage = 'revision_submitted'` (KHÔNG phải under_review); T2 → 'submitted'
- Bug #18 FIXED: revision_submitted kèm supporter_working (không kẹt waiting_user)
- `upsertDocumentRecordsForUnit` có caller + test pass (F7)
- Transaction rollback đúng khi action fail (test với mock fail) — không half-state (F2)
- 2 request concurrent → 1 thành công, 1 409 (optimistic lock — F2)
- Event `CASE_STAGE_CHANGED` emit sau commit (verify trong log)
- caseEvent.metadata chỉ chứa field whitelist + actor_role (F13)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Executor gọi async trong tx (`notifyUser`) → treo tx lâu | Trung bình | Trung bình | Move notify/emit ra L5 (sau commit). Chỉ DB write trong tx (F2) |
| upsertDocumentRecordsForUnit chưa test → bug khi gọi lần đầu | Cao | Cao | **Integration test TRƯỚC khi wire (F7)**. Upsert theo composite unique, xử lý P2002 |
| TOCTOU race nếu code quay lại đọc ngoài tx | Trung bình | Rất cao | Review gate: L2-L4 PHẢI trong 1 tx. Optimistic lock version_no là lớp phòng thủ thứ 2 |
| AppError sai signature → compile fail | Trung bình | Trung bình | Verify file thật đầu phase (F3) |
| case.repository.ts vượt 200 dòng | Đã vượt (573 dòng) | Thấp | Service mới giảm logic trong repo. Ghi chú, không refactor toàn bộ |

## Security Considerations

- **F6:** role từ session (auth middleware) → service nhận `roleVerified`, không tin `actor.role` từ caller. KHÔNG spoof admin
- **F7:** `lifecycleUnitId` derive từ case record trong tx — không từ `data` thô → không ghi đè doc người khác
- **F13:** metadata whitelist — chống stored XSS + DB bloat
- **F2:** credit check + trừ trong tx (FOR UPDATE) — chống double-spend
- Transition name validate trước (L1) — không string injection
- DB transaction đảm bảo atomicity (không half-state)

## Next Steps

→ Phase 04: Lan submit-intake (T2/T16), submit-supporter-output (T11), accept (T5), veto/resubmit (T4) qua cổng. FE allowed_transitions.
