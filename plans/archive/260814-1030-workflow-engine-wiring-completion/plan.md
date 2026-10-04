---
title: "Workflow Engine Wiring Completion — hoàn thiện phần plan cũ bỏ sót"
description: "Bù đắp phase-04 thiếu: wire T2/T16 (submit-intake), T11 (supporter output), T8 (request-more-info admin+supporter), sửa machine cho reassign (T6) + admin triage request-info (triage_waiting), xóa isValidStageTransition (F11), FE render nút từ allowed_transitions (student/supporter/admin). Đóng bug #2 #4 #7 #17 #18."
status: pending
priority: P1
effort: 21h
branch: feat/workflow-wiring-completion
tags: [workflow, xstate, backend, frontend, bug-fix, refactor]
blockedBy: []
blocks: []
created: 2026-08-14
---

# Workflow Engine Wiring Completion

## Overview

Plan gốc `260809-1030-workflow-engine-refactor` claim phase-04 "Done" nhưng 5/10 checklist item chưa làm. Plan này bù đắp phần thiếu:

- **BE**: T2/T16 (submit-intake), T11 (supporter output), T8 (request-more-info 2 module), F11 (xóa `isValidStageTransition` + fallback update-case-status)
- **Machine v2**: thêm state `triage_waiting` (admin yêu cầu làm rõ lúc triage — fix #18), T6 self-loop trên `assigned` (reassign — đang broken, liên quan #1)
- **FE**: render nút theo `allowed_transitions` thay vì hardcode stage (student/supporter/admin) — fix #7, sửa bug `canSubmitRevision` gây 400 (T9)

Nghiên cứu: `plans/reports/researcher-be-wiring-gaps.md` + `plans/reports/researcher-fe-consumers-gaps.md`.

## Quyết định đã chốt

| # | Chủ đề | Quyết định |
|---|--------|-----------|
| D1 | Admin request-info lúc triage | Thêm state `triage_waiting` trong machine. T8 từ `triage_pending` (guard isAdmin) → `triage_waiting`; user trả lời bằng T2 (guard isOwnerOrMember) → `triage_pending`, stage `submitted`. Supporter T8 giữ nguyên (`supporter_working` → `waiting_user`) |
| D2 | Reassign supporter | T6 self-loop trên `assigned` (guard isAdmin, **action emitStageChanged bắt buộc** — R1). Unassign giữ write trực tiếp `accepted_unassigned` (documented exception) |
| D3 | T2 vs T16 dispatch | Dispatch theo **`internal_status`** (R3): `triage_waiting` → T2; `triage_pending` + stage `intake_ready` → T16; `triage_pending` khác → T2; `cancelled` → data-only (resubmit lo state); `waiting_user` → 409 REVISION_REQUIRED; khác → 400 không leak state |
| D4 | T11/T9/T6 atomicity | **`transitionInTx(tx, params)` là design chính** (R2 — Prisma TransactionClient không có `$transaction`). `executeTransition` = wrapper mở tx + emitEvent post-commit. Use case mở 1 tx → data + `transitionInTx` cùng tx |
| D5 | Intake duplicate v00 | `/intake` upsert unit v00 (findFirst→update\|create) + **`upsertDocumentRecordsForUnit`** (R5, không insert trùng). Legacy case chưa có v00 → tạo. Giảm gốc bug #12 |
| D6 | F11 | Xóa `isValidStageTransition` + xóa fallback trực tiếp trong `update-case-status` (chỉ còn route qua XSTATE_TRANSITIONS map; cặp lạ → 400) |
| D7 | Gate FE | `filterTransitions` actor-aware (role + isOwner/isMember/isAssignedSupporter — R9). Không đổi BE contract |
| D8 | close-case | Giữ nguyên (terminal housekeeping, status `done` hợp lệ). Không đụng |
| D9 | Admin list table | Giữ hardcode (list logic, không phải action gating). Modal dùng allowed_transitions từ detail endpoint (thêm field) |
| D10 | P2002 credit | Map `P2002` → `AppError(409, DUPLICATE_CREDIT_CONSUMPTION)` trong transitionInTx (R8) — không còn 500 "lỗi hệ thống" (#2) |
| D11 | T11 idempotency key | `buildVersionUnitCode(versionNo)` padded (`v01`) — khớp format cũ (R7) |
| D12 | Assign atomic | T6 + assignCaseSupporter gộp 1 tx qua transitionInTx (R13) |

## Red Team Amendments (đã áp dụng 2026-08-14)

| # | Finding | Severity | Resolution |
|---|---------|----------|------------|
| R1 | T6 self-loop không action → tryTransition null → 400 | BLOCKER | +action emitStageChanged + test (phase 1) |
| R2 | Prisma TransactionClient không có $transaction | BLOCKER | transitionInTx design chính (phase 2) |
| R3 | Dispatch T2/T16 theo stage sai với waiting_user | MAJOR | Dispatch theo internal_status (D3) |
| R4 | submitRevisionUploadUseCase (đường FE dùng) chưa wire | MAJOR | Wire T9 (phase 2 section 2b) |
| R5 | createDocumentRecordsForUnit insert-only → duplicate | MAJOR | upsertDocumentRecordsForUnit (D5) |
| R6 | Admin T8 idempotency thiếu triage_waiting | MAJOR | Thêm early-return (phase 2) |
| R7 | Idempotency key `v1` vs `v01` lệch format | MAJOR | buildVersionUnitCode (D11) |
| R8 | P2002 → 500 "Lỗi hệ thống" | MAJOR | Map 409 (D10) |
| R9 | Role-only filter render nút sai → 400 | MAJOR | Actor-aware filterTransitions (D7) |
| R10 | Supporter đã có output modal, chưa gate state | MINOR | Gate theo T11 (phase 5) |
| R11 | requireCredits contradiction | MINOR | Bỏ (Q5 phase-04), credit check ở T5 |
| R12 | INVALID_TRANSITION leak internal_status | MINOR | Pre-validate + message chung (phase 2) |
| R13 | T6 + assign 2 tx tách rời | MINOR | Gộp 1 tx (D12) |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Machine v2 Amendments](./phase-01-machine-v2-amendments.md) | Pending |
| 2 | [BE Wiring T2/T16/T11/T8 + F11](./phase-02-be-wiring-transitions.md) | Pending |
| 3 | [BE Admin allowed_transitions](./phase-03-be-admin-allowed-transitions.md) | Pending |
| 4 | [FE Student Workspace](./phase-04-fe-student-workspace.md) | Pending |
| 5 | [FE Supporter Action Bar](./phase-05-fe-supporter-action-bar.md) | Pending |
| 6 | [FE Admin Modal + Regression](./phase-06-fe-admin-regression.md) | Pending |

## Dependencies

- Prisma 7 nested `$transaction` trên TransactionClient (D4) — spike xác nhận đầu phase 2, fallback: refactor `executeTransition` nhận `tx` trực tiếp
- Không blockedBy plan nào (260813 completed, workflow-engine-refactor + financial-domain-refactor archived)
- Bug đóng kỳ vọng: #2, #4, #7, #17, #18 (enforcement + UI); hỗ trợ #1 (SLA), #12 (dedupe v00)

## Success Criteria

- `grep executeTransition|transitionInTx` → mọi use case đổi state đều đi qua (trừ documented exceptions: unassign, close-case, rejected-intake data-only). Gồm cả `/revisions/upload` (đường FE thực dùng — R4)
- `grep isValidStageTransition` → 0 caller
- Machine test phase-07 mở rộng pass; 3 test file cũ cập nhật không còn assert hàm đã xóa
- FE: `grep allowed_transitions` → 3+ component consume qua `filterTransitions` (actor-aware); `canSubmitRevision` không còn 400
- P2002 credit → 409, không 500 (R8)
- `npm run check-types` + `npm run lint` PASS
