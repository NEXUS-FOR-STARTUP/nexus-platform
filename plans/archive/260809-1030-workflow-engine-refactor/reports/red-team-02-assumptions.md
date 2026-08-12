# Red Team Review — Assumption Destroyer

**Plan:** `plans/260809-1030-workflow-engine-refactor/` (plan.md + phase-01..06)
**Date:** 2026-08-09 · Reviewer lens: Assumptions

---

phase-03: **HIGH — AppError signature mismatch.** Plan pseudocode `new AppError(501, "message")` dùng 2 tham số. AppError thật (`shared/domain/app-error.ts:1-11`) signature `constructor(status, code, message, details?)` — **3 tham số bắt buộc**. Mọi `throw new AppError(...)` trong plan sẽ fail TypeScript compile. Fix: `new AppError(501, 'NOT_IMPLEMENTED', 'message')`.

phase-03: **HIGH — Nested transaction impossible.** Plan `executeTransition` gọi `prisma.$transaction(async (tx) => {...})`. `submitIntakeUseCase` HIỆN TẠI (`submit-intake.usecase.ts:25`) cũng gọi `prisma.$transaction`. Prisma không hỗ trợ nested `$transaction` → runtime error. Plan KHÔNG đề cập xóa transaction ngoài. Fix: use case outer transaction phải bị xóa khi chuyển qua service. Ghi rõ trong phase-04.

phase-02: **HIGH — XState `transition()` actions extract hên xui.** Plan dùng `(a as any)._action ?? { type: 'unknown' }` để extract action type. Researcher-02 cảnh báo actions trong tuple resolve tuần tự — nhưng không xác nhận `._action` property tồn tại ở XState v5. Internal API, có thể đổi version. Fix: test với `xstate@latest` trước khi dùng. Hoặc `setup({actions})` define action factories trả plain object thay vì function.

phase-01: **HIGH — `upsertDocumentRecordsForUnit` 0 caller + 0 test → wire vào production path.** Researcher-01 xác nhận 0 caller (`document.repository.ts:224-254`). Plan phase-03 wire nó vào `executeAction('upsertDoc')` — lần đầu tiên chạy trong production flow. Không integration test → không ai biết hoạt động đúng với data thật. Fix: viết integration test `upsertDocumentRecordsForUnit` TRƯỚC khi wire. Kiểm tra duplicate key, `lifecycle_unit_id = null`.

phase-04: **MEDIUM — `getAvailableTransitions` thay đổi API contract FE.** `get-case-detail.usecase.ts:153` hiện trả `allowed_transitions` từ `caseWorkflow.transitions` — object array `{name, froms, tos}`. Plan muốn trả `string[]` (XState transition names `T2_SUBMIT_INTAKE`). FE type `apps/web-1/types/case.ts:23` khai `allowed_transitions?: string[]` nhưng FE (`useCaseDetails.ts:87`) chỉ dùng `.includes()`. Tuy nhiên Admin FE (`AdminCaseDetailModal.tsx:237`) hardcode check `internal_status === "triage_pending"` — KHÔNG dùng allowed_transitions. Fix: kiểm tra mọi consumer, update AdminCaseDetailModal.

phase-04: **MEDIUM — T3/T4 "GIỮ NGUYÊN" nhưng bug #12 vẫn sống.** Plan tuyên bố `resubmitCaseUseCase` "đã đúng pattern: đổi cả 2 cột" và GIỮ NGUYÊN. Researcher-01 xác nhận `resubmitCase` (`case.repository.ts:279-299`) đổi cả 2 cột NHƯNG **không cập nhật intake content** — bug #12 ("Resubmit không update content"). Plan nói bug #12 fix ở phase-02 ("T3/T4 upsert doc action") nhưng T3/T4 là BLOCKED (pha 2). Trong pha 1, bug #12 vẫn tồn tại. Fix: ghi rõ bug #12 chỉ fix ở pha 2, không claim "đã fix" trong phase-04 success criteria.

phase-01: **MEDIUM — Migration unique constraint check chưa define "merge script".** Plan nói "nếu duplicate → script merge trước migration" nhưng KHÔNG define merge làm gì (giữ record nào? merge content?). `DocumentRecord` có field quan trọng (`file_url`, `source_kind`, `canonical_name`, `is_primary`) — merge sai → mất data. Fix: viết script merge cụ thể trước migration, hoặc define strategy (keep newest `created_at`, merge metadata).

phase-01: **MEDIUM — `lifecycle_unit_id` nullable → unique constraint lỏng.** `@@unique([lifecycle_unit_id, doc_type, seq])` với `lifecycle_unit_id String?` (nullable). PostgreSQL: `NULL != NULL` → nhiều row `lifecycle_unit_id = NULL` cùng `doc_type + seq` vẫn pass. Document records không có lifecycle_unit_id (orphan artifacts) không được bảo vệ. Bug #2 #13 (spam doc) có thể vẫn xảy ra với orphan documents. Fix: ghi rõ constraint chỉ bảo vệ doc có lifecycle_unit_id; orphan doc cần idempotency key khác (dùng `canonical_name` như hiện tại trong `buildDocumentRecordId`).
