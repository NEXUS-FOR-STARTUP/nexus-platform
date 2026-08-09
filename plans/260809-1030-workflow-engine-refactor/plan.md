---
title: "Workflow Engine Refactor — symflow → XState v5"
description: "Thay symflow bằng XState v5: 1 cổng CaseTransitionService 5 lớp cho mọi use case thay đổi state. Fix 14 bugs backlog. 2 pha: pha 1 (T1-T11+T16) tự chạy, pha 2 (T12-T15) chờ quyết định sản phẩm Q1 Q3 Q4."
status: pending
priority: P1
effort: 16.5h
branch: feat/notification-system
tags: [refactor, workflow, engine, xstate, bug-fix]
blockedBy: []
blocks: []
created: 2026-08-09
---

# Workflow Engine Refactor — symflow → XState v5

## Overview

Thay engine symflow (^3.5.1) bằng XState v5. Điểm cốt lõi: **mọi use case thay đổi state đi qua 1 cổng** CaseTransitionService (5 lớp: L1 Validation → L2 Guard → L3 Transition → L4 Action → L5 Effect). Fix 14 bugs backlog gốc từ "thiếu cổng chung + luật không tập trung".

Nguồn: `docs/research/workflow-engine-refactor-brainstorm-2026-08-09.md` + `research/researcher-01-code-facts.md` + `research/researcher-02-xstate-v5.md`.

## Quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Engine | ĐỔI symflow → XState v5 (pattern `transition()` thuần, không actor nền) |
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
> - **F15:** script fix data prod tách operational (root `docs/` theo docs/AGENTS.md — không tạo folder mới); bỏ wrapper thừa (restoreMachine đơn giản hóa, bỏ initialCaseTransition); bug #12 không claim pha 1; resubmit/veto KHÔNG ĐỔI trong file map

## Phases

| Phase | Name | Status | Effort |
|-------|------|--------|--------|
| 01 | [Schema + XState setup](./phase-01-schema-xstate-setup.md) | 🔲 Pending | 1.5h |
| 02 | [Transition Registry](./phase-02-transition-registry.md) | 🔲 Pending | 3h |
| 03 | [CaseTransitionService + submit-revision](./phase-03-case-transition-service.md) | 🔲 Pending | **5h** |
| 04 | [Lan use case qua cổng + FE](./phase-04-spread-use-cases.md) | 🔲 Pending | 3h |
| 05 | [Tests](./phase-05-tests.md) | 🔲 Pending | **4h** |
| 06 | [Refund/Resubmit policy (BLOCKED)](./phase-06-blocked-refund-policy.md) | 🔒 Blocked | 0h |

## Dependencies

```
Phase 01 (schema migration + xstate install + types)
  └─ Phase 02 (transition-registry.ts — cần types từ phase 01)
       └─ Phase 03 (CaseTransitionService + submit-revision — cần registry)
            ├─ Phase 04 (lan use case qua cổng — cần service hoạt động)
            │    └─ Phase 05 (tests — cần mọi use case chuyển xong)
            └─ Phase 06 (refund/resubmit — blocked Q1 Q3 Q4, không phụ thuộc 04/05)
```

## Rủi ro chính

| Rủi ro | Impact | Mitigation |
|---|---|---|
| Migration @@unique fail do duplicate data | Cao | SELECT check duplicates trước; merge strategy cụ thể (keep newest created_at — F14) + down migration |
| TOCTOU race (guard đọc ngoài tx) | Rất cao | F2: L2-L4 trong 1 tx + optimistic lock version_no. Review gate bắt buộc |
| Song song 2 engine gây split-brain | Cao | F5: vô hiệu update-case-status per-transition khi chuyển xong. Grep applyTransition cuối phase |
| STAGE_STATUS_MAP sai (1 status → nhiều stage) | Cao | F1: TARGET_STAGE per transition (phase-03) |
| XState v5 restore state sai field | Trung bình | F4: VALID_STATES check + AppError CORRUPT_STATE. F9: spike `._action` đầu phase-02 |
| upsertDocumentRecordsForUnit 0 caller/0 test | Cao | F7: integration test TRƯỚC khi wire + upsert composite unique |
| case.repository.ts 573+ dòng → chạm limit | Trung bình | Service mới giảm logic trong repo. KHÔNG refactor toàn bộ repo trong plan này |
| DB safety — destructive migration | Cao | Migration chỉ `--create-only`. Tuân `prisma-migration-safety.md` tuyệt đối |
| Q1-Q5 chưa chốt → phase 6 không chạy được | Thấp (đã plan riêng) | Pha 1 (T1-T11+T16) không phụ thuộc Q. Pha 2 ghi rõ blocked + điều kiện mở |
| Nested $transaction (submit-intake) | Cao | F8: xóa outer tx khi chuyển qua service |
| AppError sai signature | Trung bình | F3: 3-arg (status, code, message, details?) — verify file thật |

## Files map tổng

```
MỚI  apps/api/src/modules/cases/domain/transition-registry.ts
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
KHÔNG ĐỔI  veto-case.usecase.ts (giữ logic cũ pha 1 — chuyển pha 2)             (F15: xóa khỏi danh sách SỬA)
KHÔNG ĐỔI  resubmit-case.usecase.ts (giữ logic cũ pha 1 — chuyển pha 2, fix #12) (F15)
```

## Success Criteria

- [ ] 14 bugs backlog: từng bug có test hoặc verify → đóng
- [ ] Mọi use case thay đổi state đi qua CaseTransitionService (không check tay rải rác)
- [ ] Không transition nào đổi 1 cột — stage + status luôn đi đôi (F1: TARGET_STAGE per transition)
- [ ] **F2:** L2-L4 trong 1 tx + optimistic lock version_no — test 2 request concurrent → 1 thành công 1 409
- [ ] `phase-07` + test mới chuyển XState pass (16 assertions + 8 unit test executeAction — F10)
- [ ] Case kẹt cũ trên prod được fix data (pha 2, SELECT chỉ đọc — F15: file operational riêng)
- [ ] allowed_transitions FE render đúng theo stage (không hardcode, gồm admin modal — F12)
- [ ] **F11:** `grep isValidStageTransition` = 0 caller
- [ ] **F5:** `applyTransition` (symflow) chỉ còn gọi bởi transition CHƯA chuyển
- [ ] check-types root 3/3 PASS, eslint web 0 warning
