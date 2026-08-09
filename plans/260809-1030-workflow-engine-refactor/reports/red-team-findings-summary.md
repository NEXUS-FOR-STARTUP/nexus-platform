# Red Team Review — Tổng hợp (dedupe, cap 15)

**Plan:** `plans/260809-1030-workflow-engine-refactor/`
**Date:** 2026-08-09 · 4 reviewers (Security / Assumptions / Failure Modes / Scope) · ~30 findings → dedupe → 15

> Raw findings từng lens: `red-team-01-security.md`, `red-team-02-assumptions.md`, `red-team-03-failure-modes.md`, `red-team-04-scope-complexity.md`

## CRITICAL (2)

### F1 — STAGE_STATUS_MAP 1:1 mapping SAI (phase-03) [Scope]
Map cứng `triage_pending → intake_pending` nhưng bảng v2 T2 đích là `submitted`; `supporter_working → under_review` nhưng T9 đích `revision_submitted`. Một `internal_status` map tới 2 stage khác nhau tùy ngữ cảnh → map 1:1 không thể đúng.
**Fix:** bỏ `STAGE_STATUS_MAP`, thêm `targetStage` vào action output của từng transition. Implement theo plan hiện tại → T2 submit xong FE hiển thị "intake_pending" thay vì "submitted".

### F2 — TOCTOU race nền service (phase-03) [Failure + Security]
Case đọc NGOÀI tx → guard → tx. 2 request song song cùng pass guard → credit double-spend (T11, 2 request cùng đọc balance=1), T16 sửa hồ sơ sau khi đã nộp (T2+T16 đồng thời). `completeCaseUseCase` hiện tại cũng có bug này — plan tái tạo anti-pattern thành cổng chung.
**Fix:** toàn bộ L2-L4 trong 1 interactive tx: `prisma.$transaction(async tx => { case = await tx.case.findUniqueOrThrow(); guard(tx); tryTransition(); actions(tx) })`. Credit check + idempotency TRONG tx (SELECT FOR UPDATE trên ledger). Hoặc optimistic lock bằng version column.

## HIGH (8)

### F3 — AppError sai signature (phase-03) [Assumption + Failure]
Plan dùng `new AppError(400, "message")` (2-arg). Thật: `AppError(status, code, message, details?)` — 3 arg bắt buộc (`shared/domain/app-error.ts:1-11`). 2-arg → compile fail + FE nhận `message: undefined`.
**Fix:** `new AppError(400, "INVALID_TRANSITION", "message")`.

### F4 — restoreMachine crash với DB state invalid (phase-02) [Failure]
`resolveState({value: status})` throw nếu `internal_status` không phải state node (data cũ prod, null, split-brain). Plan không validate đầu vào.
**Fix:** `VALID_STATES = new Set([...])` check trước resolve → `AppError(500, 'CORRUPT_STATE')`. Script validate data trước deploy.

### F5 — Split-brain 2 engine (phase-04) [Failure]
`update-case-status.usecase.ts` vẫn active (13 callers qua symflow `applyTransition`) trong khi T5/T11 chuyển XState → 2 code path cùng update `internal_status`, race.
**Fix:** per-use-case: vô hiệu route cũ / feature flag khi chuyển xong. Không để 2 engine active cho cùng 1 transition.

### F6 — actor.role trust model (phase-02/03) [Security]
Guard `isAdmin`: `event.actor.role === 'ADMIN'`. `actor` truyền từ HTTP handler — nếu đọc role từ `req.body` → attacker tự gán ADMIN → T5/T6/T12-T15.
**Fix:** service nhận `session` object, tự extract role + actorId. KHÔNG nhận `actor.role` từ tham số.

### F7 — upsertDocumentRecordsForUnit 0 caller/0 test wire vào prod (phase-03) [Assumption + Failure]
Hàm chưa từng chạy production (`document.repository.ts:224-254`), 0 test. Plan wire vào executor + upsert theo `where: {id}` (computed ID) không khớp composite unique mới → duplicate row → P2002. `lifecycle_unit_id` attacker-controlled qua `event.data`.
**Fix:** (a) integration test hàm TRƯỚC khi wire; (b) upsert theo composite unique `where: { lifecycle_unit_id_doc_type_seq }`; (c) derive `lifecycleUnitId` từ case record trong L2, không từ data thô; (d) xử lý P2002 → NO_CREDITS/INVALID.

### F8 — Nested $transaction (phase-04) [Assumption]
`submitIntakeUseCase` hiện gọi `prisma.$transaction` riêng. Prisma không hỗ trợ nested → runtime error khi chuyển qua service.
**Fix:** xóa outer tx của use case khi chuyển. Ghi rõ trong phase-04.

### F9 — `(a as any)._action` internal API XState (phase-02) [Assumption]
Không chắc property tồn tại ở v5, có thể đổi version.
**Fix:** spike verify với `xstate@latest` đầu phase-02; fallback: `setup({actions})` action factories trả plain object.

### F10 — Test over/under + estimate ảo (phase-05) [Scope]
32 assertions (16×2 pass/fail) over-test máy stateless; `executeAction()` 8 nhánh DB ops có 0 unit test. Test infra DB local chưa verify (15 file hiện tại đều unit, không Prisma). Estimate phase-03 3.5h + phase-05 2.5h quá thấp.
**Fix:** cắt 32→16 assertions, thêm ~8 unit test `executeAction` mock DB; verify DATABASE_URL test env — không có thì unit only; estimate: phase-03 → 5h, phase-05 → 3.5-4h.

## MEDIUM (5)

### F11 — 3 nguồn truth transition (plan-wide) [Scope]
`isValidStageTransition` (bảng tay) + symflow + XState registry mới — plan không nói khi nào xóa bảng tay → 3 bảng, 2 engine.
**Fix:** xóa `isValidStageTransition` ở phase-04 (khi `getAvailableTransitions` thay thế). Success criteria: `grep isValidStageTransition` → 0 caller.

### F12 — getAvailableTransitions trả cả blocked T12-T15 → nút "ma" (phase-04) [Scope]
FE render nút blocked → user bấm → 501. Ngoài ra FE consumers chưa check hết: `AdminCaseDetailModal.tsx:237` hardcode `internal_status === "triage_pending"`, không dùng allowed_transitions.
**Fix:** filter blocked transitions trong `getAvailableTransitions`. Check mọi consumer FE, update AdminCaseDetailModal.

### F13 — caseEvent.metadata không whitelist + thiếu actor_role (phase-03) [Security]
`metadata: data ?? {}` attacker-controlled → stored XSS nếu render + DB bloat. `caseEvent` lưu actor_id nhưng không actor_role → không audit được sau role đổi.
**Fix:** whitelist field metadata + validate schema. Thêm `actor_role` vào CaseEvent, ghi từ session.

### F14 — Migration: merge strategy + nullable + fallback (phase-01) [Assumption + Failure]
(a) "script merge trước migration" không define — merge gì, giữ record nào → mất data; (b) `lifecycle_unit_id String?` nullable → unique không chặn NULL (orphan doc vẫn spam được); (c) không down migration — prod fail → rollback thủ công.
**Fix:** define merge strategy cụ thể (keep newest `created_at`); ghi rõ constraint chỉ bảo vệ doc có lifecycle_unit_id (orphan dùng idempotency canonical_name như cũ); thêm down file.

### F15 — Scope: script fix prod + wrapper thừa + file count (phase-02/06) [Scope]
(a) Script fix data prod = operational task (thuộc `docs/db-query-guide.md` workflow), không phải code change — tách khỏi phase checklist; (b) bỏ wrapper thừa: `restoreMachine` (restore = tìm state node), `tryTransition`, `initialCaseTransition` (T1 chỉ là initial string); (c) FE mini-task tách riêng, `resubmit-case.usecase.ts`/`veto-case.usecase.ts` xóa khỏi file map (ghi "KHÔNG ĐỔI"); (d) bug #12 chỉ fix ở pha 2 — không claim "đã fix" trong phase-04 success criteria.
