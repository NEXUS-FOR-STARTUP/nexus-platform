---
title: "Workflow Engine Refactor — symflow → XState v5"
description: "Thay symflow bằng XState v5: 1 cổng CaseTransitionService 5 lớp cho mọi use case thay đổi state. Fix 14 bugs backlog. ONE-SHOT: T1-T16, policy sản phẩm Q1-Q5 đã chốt 2026-08-09 — không còn blocker."
status: complete
priority: P1
effort: 19h
branch: feat/workflow-engine-refactor
tags: [refactor, workflow, engine, xstate, bug-fix]
blockedBy: []
blocks: [260811-1100-user-wallet-vnd]
created: 2026-08-09
---

> **Docs tham khảo XState v5:** `docs/tech-doc-urls.txt` lines 59-61:  
> https://stately.ai/docs/cheatsheet &nbsp;|&nbsp; https://stately.ai/docs/quick-start &nbsp;|&nbsp; https://stately.ai/docs/examples  
> **V5 changes verified 2026-08-11 — CORRECTED 2026-08-11:** `machine.transition(state, event)` bị bỏ. Nhưng `transition(machine, state, event)` standalone **VẪN TỒN TẠI** (verified từ XState v5.20.1 source test file). Dùng `transition()` + `resolveState()` cho stateless workflow pattern — machine là single source of truth. KHÔNG cần transition table tay. Chi tiết: `phase-02`.

# Workflow Engine Refactor — symflow → XState v5

## Overview

Thay engine symflow (^3.5.1) bằng XState v5. Điểm cốt lõi: **mọi use case thay đổi state đi qua 1 cổng** CaseTransitionService (5 lớp: L1 Validation → L2 Guard → L3 Transition → L4 Action → L5 Effect). Fix 14 bugs backlog gốc từ "thiếu cổng chung + luật không tập trung".

Nguồn: `docs/research/workflow-engine-refactor-brainstorm-2026-08-09.md` + `research/researcher-01-code-facts.md` + `research/researcher-02-xstate-v5.md`.

## Quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Engine | ĐỔI symflow → XState v5. Dùng `transition()` + `resolveState()` stateless pattern (không actor). Machine là single source of truth cho guard, action, transition |
| Typegen | BỎ (KISS — máy nhỏ 16 transitions, `setup({types})` thủ công đủ) |
| Stately Studio | BỎ |
| Async | entry action = mô tả tên, executor loop tự `await`. KHÔNG async trong machine |
| State lưu trữ | `internal_status` cột DB (như cũ). Stateless machine + DB snapshot |
| Context | Rỗng. Dữ liệu case lấy từ DB qua closure/executor, không nhồi vào machine |
| Song song symflow | GIỮ symflow + machine mới song song. Xóa symflow ở phase cuối sau khi mọi use case chuyển xong + test pass |
| Unique doc | `@@unique([lifecycle_unit_id, doc_type, seq])` trên DocumentRecord (đã verify: cả 3 field tồn tại) |
| completeCase | GIỮ NGUYÊN use case hiện tại (đã đúng chuẩn canTransition+applyTransition trong tx + emit sau commit). Chuyển sang service mới khi Q4 chốt |
| upgradePackage | KHÔNG đổi (không đổi stage, logic riêng → không đi qua cổng) |
| deleteCase | KHÔNG đổi (hard delete, không đổi stage) |
| updateCaseSettings | KHÔNG đổi (không đổi stage) |
| FE allow_transitions | BE filter theo stage hiện tại, FE render nút theo danh sách (field type đã có sẵn) |
| Branch plan | `feat/notification-system` (hiện tại). Khuyến nghị checkout branch mới `feat/workflow-engine-refactor` trước implement |

> **Red Team Review 2026-08-09 — 15 findings áp dụng (2 CRITICAL, 8 HIGH, 5 MEDIUM).** Chi tiết: `reports/red-team-findings-summary.md` (4 raw reports: `red-team-01..04`). Tóm tắt các thay đổi lớn:
> - **F1 (CRITICAL):** bỏ STAGE_STATUS_MAP 1:1 (sai — 1 internal_status → nhiều stage). Thay bằng `TARGET_STAGE` per transition (phase-03)
> - **F2 (CRITICAL):** L2-L4 trong MỘT transaction (chống TOCTOU) + optimistic lock `Case.version_no` (schema phase-01). Credit/payment fetch TRONG tx
> - **F3:** AppError 3-arg `(status, code, message, details?)` — sửa mọi call
> - **F4:** `restoreMachine` validate VALID_STATES → AppError CORRUPT_STATE
> - **F5:** vô hiệu `update-case-status.usecase.ts` per-transition khi chuyển xong (chống split-brain 2 engine)
> - **F6:** role từ session (`roleVerified`), không tin `actor.role` từ caller
> - **F7:** upsert doc theo composite unique (không `where: {id}`) + test trước khi wire + lifecycleUnitId derive từ case
> - **F8:** xóa outer `$transaction` trong submit-intake (Prisma không nested tx)
> - **F9:** spike verify `._action` XState đầu phase-02
> - **F10:** cắt 32→16 assertions machine; thêm unit test executeAction (mock DB); verify test infra DB local; effort phase-03 → 5h, phase-05 → 4h
> - **F11:** xóa `isValidStageTransition` ở phase-04 (hết 3 nguồn truth)
> - **F12:** T12-T15 không khai báo trong machine (không nút ma); check FE consumers (AdminCaseDetailModal hardcode)
> - **F13:** metadata caseEvent whitelist + `CaseEvent.actor_role` (schema phase-01)
> - **F14:** merge strategy cụ thể (keep newest) + down migration + unique nullable limitation
> - **F15:** script fix data prod tách operational (`scripts/fix-stuck-cases-2026-08-09.sql` — convention scripts/, không tạo folder mới); bỏ wrapper thừa (restoreMachine đơn giản hóa, bỏ initialCaseTransition); resubmit/veto KHÔNG ĐỔI trong file map cho đến phase 06 — sau khi Q chốt (2026-08-09) chuyển T3/T4/T12-T15 qua cổng + fix #12/BP1
>
> **AMENDMENT 2026-08-11 (3 bổ sung, effort +1h):**
> 1. **Self-loop T16/T10 bị chặn oan** (phase-02): `tryTransition` dùng XState `transition()`. Guard fail → value không đổi + 0 action. Self-loop hợp lệ (T2/T10/T16) → value không đổi + actions.length > 0 (upsertDoc/notifyUser). Phân biệt được qua action count. Phase-05 test sẽ pass.
> 2. **Idempotency key đoán được** (phase-03, red-team-01 S7): thêm `{nonce}` (crypto.randomUUID()) vào key `consume-...` + `veto_...` — chống pre-claim key phiên bản tương lai.
> 3. **allowed_transitions đổi shape** (phase-04, red-team-02 A5): `{name, froms, tos}[]` → `TransitionName[]` (string) — cập nhật type FE + rà soát mọi consumer (type `case.ts:23` đã lệch reality từ trước).
>
> **AMENDMENT 2026-08-11 (bổ sung 2 — chốt T6/T7/T8/T10 + đơn giản hóa phase-01):**
> 4. **T6/T7/T8/T10 vào phase-04** (trước đó để ngỏ): 4 transition đơn giản — chỉ check quyền + đổi state + ghi log. Gọi `executeTransition` trong `update-case-status.usecase.ts`. Effort ~30ph (đã nằm trong 4h phase-04).
> 5. **Đơn giản hóa phase-01**: prod chưa có user thật → dọn dữ liệu trùng qua API (xoá Cloudinary + DB), giữ newest created_at. Không cần merge strategy phức tạp. Effort phase-01: 1.5h → 1h.
>
> **AMENDMENT 2026-08-11 (bổ sung 3 — tích hợp User Wallet VND):**
> 6. **Bỏ guard `isPaid` ở T5** — credit mua từ ví VND lúc tạo case, không còn bước "chờ thanh toán". T5 guard: `['isAdmin', 'hasCredit']`. Free case (team_fit, price=0) → `hasCredit` tự skip.
> 7. **Action `refundCredit` (phase-03/06)** chốt dùng `WalletService.refund(tx, ownerId, lockedPrice, caseId, key)` — hoàn VND về ví. KHÔNG dùng credit_ledgers zero-out. (Đã đồng bộ với wallet plan phase-05.)
> 8. **Credit = đơn vị tiêu dùng trong engine** — engine chỉ biết credit_ledgers (hasCredit >= 1, subtractCredit -1). Ví VND là tầng riêng, engine không biết VND. Wallet plan xây dựng sau, độc lập.

## Thứ tự implement

```
Workflow Phase 01 (schema) ──┐
Workflow Phase 02 (registry)  ├─ Wallet plan CÓ THỂ bắt đầu song song
Workflow Phase 03 (executor) ─┘  (wallet schema + WalletService + top-up + FE ví)
    │
    ├─ Phase 04 (spread use cases)
    ├─ Phase 05 (tests)
    └─ Phase 06 (refund/resubmit)
         │
         └─ Wallet plan: tích hợp refundCredit (swap credit_ledgers → WalletService)
```

**Lý do workflow trước wallet:** Executor tx pattern (phase-03) là seam tích hợp. Credit_ledgers hiện tại vẫn hoạt động — engine build xong trên credit cũ, wallet thay thế sau. Wallet schema/service/FE làm song song không conflict, nhưng tích hợp refundCredit phải chờ wallet module live.

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 01 | [Schema + XState setup](./phase-01-schema-xstate-setup.md) | ✅ Done | 1h |
| 02 | [Machine Definition](./phase-02-transition-registry.md) | ✅ Done | **2h** |
| 03 | [CaseTransitionService + submit-revision](./phase-03-case-transition-service.md) | ✅ Done | **4h** |
| 04 | [Lan use case qua cổng + FE](./phase-04-spread-use-cases.md) | ✅ Done | **4h** |
| 05 | [Tests](./phase-05-tests.md) | ✅ Done | **4h** |
| 06 | [Refund/Resubmit Policy T12-T15](./phase-06-refund-resubmit-policy.md) | ✅ Done | **4h** |

## Dependencies

```
Phase 01 (schema migration + xstate install + types)
  └─ Phase 02 (case-machine.ts — XState machine single source of truth)
       └─ Phase 03 (CaseTransitionService + submit-revision — dùng máy từ phase 02)
            ├─ Phase 04 (lan use case qua cổng — cần service hoạt động)
            │    └─ Phase 05 (tests — cần mọi use case chuyển xong)
            └─ Phase 06 (T12-T15 refund/resubmit — cần service + registry; cleanup symflow cuối)
```

## Rủi ro chính

| Rủi ro | Impact | Mitigation |
|---|---|---|
| Migration @@unique fail do duplicate data | Cao | SELECT check duplicates trước; merge strategy cụ thể (keep newest created_at — F14) + down migration |
| TOCTOU race (guard đọc ngoài tx) | Rất cao | F2: L2-L4 trong 1 tx + optimistic lock version_no. Review gate bắt buộc |
| Song song 2 engine gây split-brain | Cao | F5: vô hiệu update-case-status per-transition khi chuyển xong. Grep applyTransition cuối phase |
| STAGE_STATUS_MAP sai (1 status → nhiều stage) | Cao | F1: TARGET_STAGE per transition (phase-03) |
| XState v5 — `transition()` standalone works, restore state via `resolveState()` | Thấp (đã verify) | F4: VALID_STATES check + AppError CORRUPT_STATE. Machine là single source of truth |
| upsertDocumentRecordsForUnit 0 caller/0 test | Cao | F7: integration test TRƯỚC khi wire + upsert composite unique |
| case.repository.ts 573+ dòng → chạm limit | Trung bình | Service mới giảm logic trong repo. KHÔNG refactor toàn bộ repo trong plan này |
| DB safety — destructive migration | Cao | Migration chỉ `--create-only`. Tuân `prisma-migration-safety.md` tuyệt đối |
| Q1-Q5 đã chốt 2026-08-09 → phase 06 không còn blocked | Thấp (đã resolve) | — | Chốt policy trong validation session 2: T3 hasCredit / T4 free / T12-T15 no-refund trừ T13 refund 100% / T14 supporter đóng / Q5 check T5 |
| Refund policy sai (T12/T15 nhầm thành refund) → mất tiền | Trung bình | Rất cao | Chỉ T13 gọi refundCredit. Integration test assert T12/T15 KHÔNG tạo creditLedger entry |
| Nested $transaction (submit-intake) | Cao | F8: xóa outer tx khi chuyển qua service |
| AppError sai signature | Trung bình | F3: 3-arg (status, code, message, details?) — verify file thật |

## Files map tổng

```
MỚI  apps/api/src/modules/cases/domain/case-machine.ts
MỚI  apps/api/src/modules/cases/domain/transition.types.ts
MỚI  apps/api/src/modules/cases/application/case-transition.service.ts
MỚI  apps/api/src/shared/infrastructure/tests/phase-08-executor.test.ts        (phase 05 — F10)
MỚI  apps/api/src/shared/infrastructure/tests/phase-08-workflow-service.test.ts (phase 05 — điều kiện, F10)
MỚI  scripts/fix-stuck-cases-2026-08-09.sql                             (phase 06 — F15, theo convention scripts/)
SỬA  apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts
SỬA  apps/api/src/modules/cases/application/submit-revision.usecase.ts        (submitRevisionUseCase + submitSupporterOutputUploadUseCase :295)
SỬA  apps/api/src/modules/cases/application/submit-intake.usecase.ts
SỬA  apps/api/src/modules/cases/application/accept-case.usecase.ts
SỬA  apps/api/src/modules/cases/application/update-case-status.usecase.ts       (phase 04 — F5: vô hiệu per-transition)
SỬA  apps/api/src/modules/cases/application/get-case-detail.usecase.ts
SỬA  apps/api/src/modules/cases/domain/case.types.ts                             (phase 04 — F11: xóa isValidStageTransition)
SỬA  apps/api/src/modules/documents/infrastructure/persistence/document.repository.ts (F7: upsert composite unique)
SỬA  apps/api/src/shared/infrastructure/tests/phase-07-symflow-transitions.test.ts
SỬA  apps/api/package.json (+xstate, -symflow cuối phase)
SỬA  apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx
SỬA  apps/web-1/app/admin/_components/AdminCaseDetailModal.tsx                  (phase 04 — F12)
SỬA  apps/web-1/app/dashboard/case/[id]/page.tsx (or parent)
SỬA  prisma/schema.prisma (+@@unique DocumentRecord, +version_no Case, +actor_role CaseEvent)
KHÔNG ĐỔI  case-workflow.ts (domain, symflow — giữ nguyên đến phase cuối)
KHÔNG ĐỔI  case-workflow-engine.ts (infrastructure — giữ nguyên đến phase cuối)
KHÔNG ĐỔI  complete-case.usecase.ts (giữ nguyên — mẫu chuẩn, chuyển sau khi Q4 chốt)
KHÔNG ĐỔI  veto-case.usecase.ts (giữ logic cũ — chuyển phase 06)                (F15)
KHÔNG ĐỔI  resubmit-case.usecase.ts (giữ logic cũ — chuyển phase 06, fix #12)    (F15)
```

## Success Criteria

- [ ] 14 bugs backlog: từng bug có test hoặc verify → đóng
- [ ] Mọi use case thay đổi state đi qua CaseTransitionService (không check tay rải rác)
- [ ] Không transition nào đổi 1 cột — stage + status luôn đi đôi (F1: TARGET_STAGE per transition)
- [ ] **F2:** L2-L4 trong 1 tx + optimistic lock version_no — test 2 request concurrent → 1 thành công 1 409
- [ ] `phase-07` + test mới chuyển XState pass (16 assertions + 8 unit test executeAction — F10)
- [ ] Case kẹt cũ trên prod được fix data (SELECT chỉ đọc — F15: file operational riêng)
- [ ] allowed_transitions FE render đúng theo stage (không hardcode, gồm admin modal — F12)
- [ ] **F11:** `grep isValidStageTransition` = 0 caller
- [ ] **F5:** `applyTransition` (symflow) chỉ còn gọi bởi transition CHƯA chuyển — cuối phase 06 = 0 caller
- [ ] **Policy Q1-Q5 (chốt):** T3 hasCredit / T4 free / T13 refund 100% / T12+T15 no-refund / T14 supporter đóng / credit check T5
- [ ] check-types root 3/3 PASS, eslint web 0 warning

## Validation Summary

**Validated:** 2026-08-09
**Questions asked:** 5

**Validated:** 2026-08-09
**Questions asked:** 5 (session 1) + 4 (session 2 — one-shot, hết blocker)

### Confirmed Decisions — Session 1
- F5 cơ chế vô hiệu update-case-status: **hardcode remove per-transition** (KHÔNG env flag) — rollback = revert commit
- version_no scope: **chỉ bảo vệ transition qua cổng mới** — code cũ (complete/veto/resubmit) không bump, chấp nhận vì F5 đã loại per-transition
- FE label map: **FE tự map** TransitionName → label/nút (BE giữ contract `TransitionName[]` sạch)
- xstate version: **giữ `xstate@latest`** (monorepo lockfile đủ) — không pin
- phase-05:230 T9 stage sai → **đã sửa** `under_review` → `revision_submitted` (khớp TARGET_STAGE phase-03:68)

### Confirmed Decisions — Session 2 (policy sản phẩm, one-shot)
- **Q1a (T3)** resubmit sau reject thường: free nếu credit đã hoàn; **tốn credit mới nếu chưa hoàn** → guard `hasCredit` + `isOwner`
- **Q1b (T4)** resubmit sau veto: **hoàn 100% credit + nộp lại miễn phí** (giữ hành vi vetoCaseUseCase:31-50 — action `refundCredit`)
- **Q3 (T12/T15)** reject thường + user hủy: supporter đã render → giữ credit; chưa render → credit chưa trừ = không mất gì. **Chỉ T13 hoàn 100%**
- **Q4 (T14)** hoàn thành: **supporter tự đóng** (guard `isAssignedSupporter`) → notify user + supporter (fix #5)
- **Q5** credit check: **khi admin duyệt T5** (guard `hasCredit`, bỏ `isPaid` — credit mua bằng ví VND lúc tạo case). Free case (price=0) → hasCredit tự skip. KHÔNG check khi nộp T2 — xóa `requireCredits` khỏi submit-intake

### Action Items (plan writing — đã ghi vào phase files)
- [x] Phase-02: khai báo T3/T4/T12-T15 trong machine (hết blocked), `isBlockedTransition` trả false
- [x] Phase-03: thêm action `refundCredit` (executor) + T5/T3 cần creditBalance trong tx
- [x] Phase-04: xóa `requireCredits` submit-intake (Q5), accept thêm guard hasCredit
- [x] Phase-05: thay nhóm test blocked bằng 6 test policy T12-T15
- [x] Phase-06: unblock — requirements + guards policy thật, effort 4h
- [x] plan.md: effort 16.5h → 20.5h, phase-06 Pending, branch frontmatter → feat/workflow-engine-refactor
- [x] Phase-04: vô hiệu per-transition trong update-case-status (không feature flag — F5, phase-04:20)
- [x] Phase-04 FE: allowed_transitions từ registry, FE map TransitionName → label/nút (phase-04:39)
- [x] F9 spike `._action`: **bỏ** — XState v5 `transition()` trả về `ActionSnapshot[]` với `.type` property. Dùng XState native, không cần `._action` internal. (ĐÃ CORRECTED 2026-08-11: `transition()` VẪN TỒN TẠI trong v5 — phase-02 đã sửa.)
