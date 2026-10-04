# Phase 03 — CaseTransitionService + submit-revision

- Priority: P1 | Status: Done | Effort: **4h** (giảm từ 5h — bỏ table lookup tay, XState lo transition)
- Depends: Phase 02 (case-machine.ts hoạt động)
- Blocks: Phase 04

## Overview

Viết `case-transition.service.ts` — cổng 5 lớp (L1→L5) cho mọi use case thay đổi state. L2-L4 chạy trong MỘT transaction (F2). L3 dùng XState `transition()` native (qua `tryTransition` từ Phase 02). Chuyển submitRevisionUseCase qua cổng (bug Critical #18).

> **Red Team:** F1 (TARGET_STAGE per transition), F2 (tx + optimistic lock), F3 (AppError 3-arg), F6 (role từ session), F7 (upsert composite unique + derive lifecycleUnitId), F13 (metadata whitelist + actor_role).

## Key Insights

- **Pattern chuẩn:** `completeCaseUseCase` (complete-case.usecase.ts:9) — canTransition + applyTransition trong tx + emit sau commit. Giữ pattern này.
- **F2 — KHÔNG TOCTOU:** `findUniqueOrThrow` + `tryTransition` + actions + UPDATE trong 1 `prisma.$transaction`. Credit/payment fetch TRONG tx.
- **F1 — TARGET_STAGE per transition:** 1 internal_status → nhiều stage tùy transition. Không map 1:1.
- **L3 = XState native:** `tryTransition()` gọi `resolveState()` + `transition()` bên trong — không table lookup tay.
- **L4 = executor loop:** XState trả action descriptors → ta loop await từng action (đúng thiết kế XState: action = mô tả, thực thi = app code).
- **Self-transition handle:** T2/T10/T16 về cùng state nhưng có action (upsertDoc, notifyUser). tryTransition phân biệt được (từ Phase 02).

## Architecture

```
HTTP Request
  │
  ▼
use-case (vd: submitRevisionUseCase)
  │  validate input (zod)
  │  gọi executeTransition(...)
  ▼
┌─ case-transition.service.ts ──────────────────────────────────┐
│                                                                 │
│  L1: Validate (ngoài tx)                                        │
│    • isBlockedTransition check                                   │
│                                                                 │
│  prisma.$transaction(async tx => {                              │
│                                                                 │
│    L2: Guard (fetch data + build event)                         │
│      • tx.case.findUniqueOrThrow(id)                            │
│      • fetch credit/payment TRONG tx                            │
│      • build TransitionEvent với data pre-fetched               │
│                                                                 │
│    L3: Transition (XState native qua tryTransition)              │
│      • tryTransition(status, event)                             │
│        → resolveState(value)  ← XState restore                  │
│        → transition(machine, snapshot, event) ← XState guard    │
│        → { to, actions[] } | null                               │
│                                                                 │
│    L4: Action (executor loop — await từng action)               │
│      • upsertDoc (composite unique — F7)                        │
│      • subtractCredit (FOR UPDATE + idempotent)                 │
│      • refundCredit (zero-out balance)                          │
│      • setSlaDeadline                                           │
│      • notifyUser/emitStageChanged → no-op (L5)                 │
│                                                                 │
│    Write: UPDATE case (WHERE version_no — optimistic lock)      │
│    Write: INSERT caseEvent (actor_role + metadata whitelist)    │
│                                                                 │
│  }) // commit                                                   │
│                                                                 │
│  L5: Effects (sau commit)                                       │
│    • emit CASE_STAGE_CHANGED                                    │
│    • log transition success                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation

### case-transition.service.ts

```typescript
// apps/api/src/modules/cases/application/case-transition.service.ts (MỚI ~250 dòng)

import type { Prisma, PrismaClient } from '@prisma/client'
import { tryTransition, isBlockedTransition } from '../domain/case-machine.js'
import type {
  TransitionName, TransitionEvent, CaseStage, InternalStatus,
  ActionDescriptor,
} from '../domain/transition.types.js'
import { upsertDocumentRecordsForUnit } from '../../documents/infrastructure/persistence/document.repository.js'
import { emitEvent, DOMAIN_EVENTS } from '../../../shared/domain/domain-events.js'
import { AppError } from '../../../shared/domain/app-error.js'
import logger from '../../../shared/infrastructure/logger.js'

// ============================================================
// F1: TARGET_STAGE — stage đích của TỪNG transition.
// 1 internal_status → nhiều stage tùy transition.
// ============================================================
const TARGET_STAGE: Partial<Record<TransitionName, CaseStage>> = {
  T1_CREATE_CASE:              'intake_pending',
  T2_SUBMIT_INTAKE:            'submitted',
  T3_RESUBMIT_AFTER_REJECT:    'submitted',
  T4_RESUBMIT_AFTER_VETO:      'submitted',
  T5_ACCEPT:                   'under_review',
  T6_ASSIGN_SUPPORTER:         'under_review',
  T7_START_WORK:               'under_review',
  T8_REQUEST_INFO:             'need_more_information',
  T9_SUBMIT_REVISION:          'revision_submitted',
  T10_START_REVIEW_REVISION:   'under_review',
  T11_SUBMIT_OUTPUT:           'report_ready',
  T12_REJECT:                  'rejected',
  T13_VETO:                    'rejected',
  T14_COMPLETE:                'completed',
  T15_CANCEL:                  'closed',
  T16_EDIT_INTAKE:             'intake_pending',
}

function targetStageFor(transition: TransitionName): CaseStage {
  const stage = TARGET_STAGE[transition]
  if (!stage) {
    throw new AppError(500, 'UNKNOWN_TRANSITION', `Không có targetStage cho ${transition}`)
  }
  return stage
}

// ============================================================
// L4: Executor — chạy action tuần tự (async, trong tx)
// ============================================================
async function executeAction(
  action: ActionDescriptor,
  tx: Prisma.TransactionClient,
  caseId: string,
  context: {
    unitCode?: string
    uploaderId?: string
    versionNo?: number
    actorId?: string
    nextStage?: CaseStage
    data?: Record<string, unknown>
  },
): Promise<void> {
  switch (action.type) {
    case 'upsertDoc': {
      // F7: gọi upsertDocumentRecordsForUnit (document.repository.ts:224)
      // Dùng composite unique where: { lifecycle_unit_id_doc_type_seq }
      // lifecycleUnitId derive từ case record (context) — KHÔNG từ params thô
      // P2002 → throw AppError(400, 'DOC_UPSERT_CONFLICT', ...)
      break
    }

    case 'subtractCredit': {
      // Kiến trúc 3 tầng: credit là đơn vị tiêu dùng dịch vụ, KHÔNG phải VND.
      // Trừ 1 credit từ credit_ledgers (đã được mua trước đó bằng ví VND).
      // KHÔNG gọi walletService.withdraw() — ví chỉ bị trừ khi MUA credit, không phải khi DÙNG.
      // F2: TRONG tx — SELECT credit_ledgers FOR UPDATE trước khi trừ
      // Idempotency key: `consume-{unitCode}-{caseId}-v{versionNo}-{nonce}`
      //   nonce = crypto.randomUUID() — chống pre-claim key (S7)
      // Key trùng → replay → KHÔNG lỗi, return success (idempotent)
      break
    }

    case 'refundCredit': {
      // T13 veto — hoàn giá trị credit về VÍ VND.
      // Kiến trúc 3 tầng: credit → VND về wallet (WalletService.refund).
      // Dùng servicePrice (VND) từ case record, KHÔNG phải 1 credit cố định.
      // Pattern: walletService.refund(tx, ownerId, servicePrice, caseId, idempotencyKey)
      // CHỈ T13 gọi — T12/T15 KHÔNG refund (Q3 — credit chưa bị trừ, không có gì để hoàn).
      // WalletService.refund() nhận tx param để dùng chung transaction với CaseTransitionService.
      break
    }

    case 'setSlaDeadline': {
      // Set sla_deadline_at = now + 48h trên case
      break
    }

    case 'autoResumeWork': {
      // T9: stage → revision_submitted (đã nằm trong TARGET_STAGE)
      // Giữ như no-op hook — stage được set bởi targetStageFor()
      break
    }

    case 'resetStatus': {
      // Reset case về triage_pending (resubmit)
      break
    }

    case 'notifyUser': {
      // KHÔNG tạo notification trong tx → L5 (sau commit). No-op ở đây
      break
    }

    case 'emitStageChanged': {
      // No-op trong tx → L5 emit event bus
      break
    }

    case 'lockPrice': {
      // Lock giá case (last_price_changed_at = now)
      break
    }

    default:
      logger.warn({ actionType: (action as any).type, caseId }, 'Unknown action type — skipped')
  }
}

// ============================================================
// L1-L5: CỔNG CHÍNH
// ============================================================
interface TransitionParams {
  transition: TransitionName
  caseId: string
  actorId: string           // F6: từ auth middleware (session)
  roleVerified: string      // F6: role từ session — KHÔNG từ body/caller
  data?: Record<string, unknown>
}

export async function executeTransition(
  prisma: PrismaClient,
  params: TransitionParams,
): Promise<{ stage: CaseStage; status: InternalStatus }> {
  const { transition: transitionName, caseId, actorId, roleVerified, data } = params

  // ═══ L1: Validation (ngoài tx) ═══
  if (isBlockedTransition(transitionName)) {
    throw new AppError(501, 'NOT_IMPLEMENTED', `Transition ${transitionName} chưa được implement`)
  }

  // ═══ L2 + L3 + L4: trong MỘT transaction (F2: chống TOCTOU) ═══
  return prisma.$transaction(async (tx) => {

    // --- L2: Guard — fetch data + build event ---
    const caseRecord = await tx.case.findUniqueOrThrow({ where: { id: caseId } })
    const currentStatus = caseRecord.internal_status as InternalStatus

    // Credit/payment fetch TRONG tx (dữ liệu mới nhất, không race)
    const creditBalance = ['T11_SUBMIT_OUTPUT', 'T5_ACCEPT', 'T3_RESUBMIT_AFTER_REJECT'].includes(transitionName)
      ? await getCreditBalanceInTx(tx, actorId)
      : 0

    const paymentStatus = transitionName === 'T5_ACCEPT'
      ? (await tx.payment.findFirst({ where: { case_id: caseId } }))?.status ?? 'unpaid'
      : undefined

    const event: TransitionEvent = {
      type: transitionName,
      actor: { id: actorId, role: roleVerified },
      data: {
        ...data,
        // F7: derive từ case record — KHÔNG từ data thô
        lifecycleUnitId: caseRecord.lifecycle_unit_id,
        caseOwnerId: caseRecord.owner_id,
        caseAssignedSupporterId: caseRecord.assigned_supporter_id,
        currentStage: caseRecord.user_facing_stage,
        caseCreatedAt: caseRecord.created_at,
        caseVersionNo: caseRecord.version_no,
        actorId,
        // F2: dữ liệu pre-fetched trong tx → guard check sync
        lockedPrice: caseRecord.locked_price ?? 0,
        creditBalance,
        paymentStatus,
        roleVerified,     // F6: guard isAdmin/isSupporter đọc cái này
      },
    }

    // --- L3: Transition (XState native qua tryTransition) ---
    // tryTransition gọi XState resolveState() + transition() bên trong
    //   → chạy guard → trả { to, actions[] } | null
    const result = tryTransition(currentStatus, event)
    if (!result) {
      throw new AppError(400, 'INVALID_TRANSITION',
        `Không thể thực hiện ${transitionName} từ trạng thái ${currentStatus}`)
    }

    const { to: nextStatus, actions } = result
    const nextStage = targetStageFor(transitionName)

    // --- L4: Action — executor loop (cùng tx) ---
    for (const action of actions) {
      await executeAction(action, tx, caseId, {
        unitCode: (data as any)?.unitCode,
        versionNo: (data as any)?.versionNo,
        actorId,
        nextStage,
        data: data as Record<string, unknown>,
      })
    }

    // --- Write: UPDATE case (optimistic lock — F2) ---
    const updated = await tx.case.updateMany({
      where: { id: caseId, version_no: caseRecord.version_no },
      data: {
        user_facing_stage: nextStage,
        internal_status: nextStatus,
        version_no: { increment: 1 },
      },
    })
    if (updated.count === 0) {
      throw new AppError(409, 'TRANSITION_CONFLICT',
        'Case đã bị thay đổi bởi request khác — thử lại')
    }

    // --- Write: INSERT caseEvent (audit — F13) ---
    await tx.caseEvent.create({
      data: {
        case_id: caseId,
        event_type: transitionName,
        actor_id: actorId,
        actor_role: roleVerified,                 // F13: audit theo role
        metadata: pickAllowedMetadata(data ?? {}), // F13: whitelist field
      },
    })

    return {
      stage: nextStage,
      status: nextStatus,
      caseCode: caseRecord.case_code,
      fromStage: caseRecord.user_facing_stage,
      fromStatus: currentStatus,
    }
  }).then(async ({ stage, status, caseCode, fromStage, fromStatus }) => {
    // ═══ L5: Effects (sau commit) ═══
    try {
      await emitEvent({
        eventId: crypto.randomUUID(),
        type: DOMAIN_EVENTS.CASE_STAGE_CHANGED,
        payload: {
          caseId,
          caseCode,
          fromStage,
          toStage: stage,
          transition: transitionName,
        },
      })
    } catch (err) {
      logger.error({ err, caseId, transition: transitionName },
        'L5 emit event failed — non-blocking')
    }

    logger.info({
      caseId,
      transition: transitionName,
      from: fromStatus,
      to: status,
      stage,
    }, 'Transition executed')

    return { stage, status }
  })
}
```

### Helper: getCreditBalanceInTx

```typescript
// F2: fetch credit TRONG tx — chống double-spend (TOCTOU)
async function getCreditBalanceInTx(
  tx: Prisma.TransactionClient,
  ownerId: string,
): Promise<number> {
  // Tổng credit hiện có của user
  const result = await tx.creditLedger.aggregate({
    where: { owner_id: ownerId },
    _sum: { amount: true },
  })
  return result._sum.amount ?? 0
}
```

### Helper: pickAllowedMetadata

```typescript
// F13: whitelist field — chặn stored XSS + DB bloat
const ALLOWED_METADATA_FIELDS = [
  'reason', 'note', 'versionNo', 'fileCount',
]

function pickAllowedMetadata(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of ALLOWED_METADATA_FIELDS) {
    if (key in data) out[key] = data[key]
  }
  return out
}
```

### Submit-revision qua cổng

```typescript
// apps/api/src/modules/cases/application/submit-revision.usecase.ts (SỬA)
// TRƯỚC: tự check tay + gọi submitCaseRevision → chỉ đổi stage, không đổi status
// SAU:  gọi executeTransition + upsert doc

export async function submitRevisionUseCase(
  prisma: PrismaClient,
  params: { caseId: string; actorId: string; roleVerified: string; files: any[] },
) {
  // 1. Validate files (L1 — giữ nguyên zod check hiện tại)

  // 2. Gọi cổng transition (L2-L5) — XState native giờ xử lý transition
  const { stage, status } = await executeTransition(prisma, {
    transition: 'T9_SUBMIT_REVISION',
    caseId: params.caseId,
    actorId: params.actorId,
    roleVerified: params.roleVerified,
    data: { files: params.files },
  })

  return { stage, status }
}
```

**Fix #18 — trước/sau:**

| | Trước | Sau |
|---|---|---|
| Stage | `revision_submitted` (ĐÚNG) | `revision_submitted` (ĐÚNG) — F1 TARGET_STAGE |
| Status | `waiting_user` (SAI - kẹt) | `supporter_working` (ĐÚNG — tự resume) |
| Ai đổi status | Không ai | XState transition T9 target = `supporter_working` |
| Supporter cần bấm "bắt đầu chấm" lại? | Có (thủ công) | Không (tự động) |

## Data Flow cho 1 transition (T9 làm ví dụ)

```
User bấm "Nộp bản sửa"
  │
  ▼
L1: isBlockedTransition('T9_SUBMIT_REVISION') → false ✓

[BẮT ĐẦU TRANSACTION]

L2:
  tx.case.findUniqueOrThrow(id) → internal_status = 'waiting_user'
  build event = {
    type: 'T9_SUBMIT_REVISION',
    data: { actorId: 'u1', caseOwnerId: 'u1', roleVerified: 'CUSTOMER', ... }
  }

L3:
  tryTransition('waiting_user', event)
    → XState resolveState({ value: 'waiting_user' })
    → XState transition(machine, snapshot, event)
      → XState chạy guard 'isOwnerOrMember': u1 === u1 → true ✓
    → [nextSnapshot, actionSnapshots]
      → nextSnapshot.value = 'supporter_working'
      → actionSnapshots = [{ type: 'upsertDoc' }]
    → return { to: 'supporter_working', actions: [{ type: 'upsertDoc' }] }

L4:
  targetStageFor('T9_SUBMIT_REVISION') → 'revision_submitted'
  executeAction({ type: 'upsertDoc' }, tx, caseId, ...) → upsert file lên DB
  UPDATE case:
    user_facing_stage = 'revision_submitted'
    internal_status = 'supporter_working'
    version_no = old + 1
  INSERT caseEvent: type=T9, actor_role='CUSTOMER'

[COMMIT]

L5:
  emit CASE_STAGE_CHANGED → thông báo, log, FE cập nhật
```

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/modules/cases/application/case-transition.service.ts` | **MỚI** — cổng 5 lớp |
| `apps/api/src/modules/cases/domain/case-machine.ts` | Tham chiếu — `tryTransition`, `isBlockedTransition` |
| `apps/api/src/modules/cases/domain/transition.types.ts` | Tham chiếu — types |
| `apps/api/src/modules/cases/application/submit-revision.usecase.ts` | **SỬA** — qua cổng mới |
| `apps/api/src/modules/documents/infrastructure/persistence/document.repository.ts` | **SỬA** — upsert composite unique (F7) |
| `apps/api/src/shared/domain/domain-events.ts` | Tham chiếu — `emitEvent`, `DOMAIN_EVENTS` |
| `apps/api/src/shared/domain/app-error.ts` | Tham chiếu — AppError 3-arg (F3) |
| `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts` | CÓ THỂ SỬA — nếu cần hàm update stage+status riêng |

## Todo List

- [ ] Verify `AppError` signature thật + `emitEvent` DomainEvent type (F3, F5) — TRƯỚC khi code
- [ ] **F7: viết integration test `upsertDocumentRecordsForUnit` TRƯỚC khi wire** (0 caller, 0 test)
- [ ] Tạo `case-transition.service.ts` — `executeTransition()` cổng 5 lớp
- [ ] Implement `TARGET_STAGE` map (F1)
- [ ] Implement `executeAction()` — switch/case 9 action types (F2: trong tx)
- [ ] Implement optimistic lock: `updateMany({ where: { id, version_no } })` + 409 TRANSITION_CONFLICT (F2)
- [ ] Implement `getCreditBalanceInTx` — SELECT FOR UPDATE / aggregate
- [ ] Implement `pickAllowedMetadata` — whitelist (F13)
- [ ] Sửa `document.repository.ts`: upsert composite unique (F7)
- [ ] Sửa `submit-revision.usecase.ts`: xóa check tay + gọi `executeTransition`
- [ ] caseEvent: `actor_role` field + metadata whitelist (F13)
- [ ] Test: submit-revision → DB có stage = `revision_submitted` + status = `supporter_working`
- [ ] Test: submit-revision từ stage KHÔNG phải waiting_user → expect 400 INVALID_TRANSITION
- [ ] Test: 2 request concurrent cùng case → 1 success + 1 409 TRANSITION_CONFLICT (F2)

## Success Criteria

- `executeTransition` gọi từ submitRevisionUseCase → case có cả stage + status đổi
- **F1:** T9 → `revision_submitted`, T2 → `submitted`, T16 → `intake_pending`
- Bug #18 FIXED: `revision_submitted` + `supporter_working` (không kẹt `waiting_user`)
- `upsertDocumentRecordsForUnit` có caller + test pass (F7)
- Transaction rollback đúng khi action fail — không half-state (F2)
- 2 request concurrent → 1 success, 1 409 (optimistic lock)
- Event `CASE_STAGE_CHANGED` emit sau commit
- caseEvent.metadata chỉ chứa field whitelist + actor_role (F13)
- **L3 dùng XState transition()** — không table lookup tay

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Executor gọi async trong tx (notifyUser) → treo tx | Trung bình | Trung bình | notifyUser/emitStageChanged = no-op trong tx. Chỉ DB write trong tx |
| upsertDocumentRecordsForUnit chưa test → bug lần đầu gọi | Cao | Cao | Integration test TRƯỚC khi wire (F7) |
| TOCTOU nếu code quay lại đọc ngoài tx | Trung bình | Rất cao | Review gate: L2-L4 PHẢI trong 1 tx. Optimistic lock là phòng thủ thứ 2 |
| AppError sai signature → compile fail | Trung bình | Trung bình | Verify file thật đầu phase (F3) |
| case.repository.ts vượt 200 dòng (573 dòng) | Đã vượt | Thấp | Service mới giảm logic trong repo |

## Security Considerations

- **F6:** role từ session (auth middleware) — KHÔNG spoof admin
- **F7:** lifecycleUnitId derive từ case record trong tx — không ghi đè doc người khác
- **F13:** metadata whitelist — chống stored XSS + DB bloat
- **F2:** credit check + trừ trong tx (FOR UPDATE) — chống double-spend
- Transition name validate L1 — không string injection
- DB transaction đảm bảo atomicity (không half-state)

## Next Steps

→ Phase 04: Lan submit-intake (T2/T16), submit-supporter-output (T11), accept (T5), veto/resubmit (T4) qua cổng. FE allowed_transitions.
