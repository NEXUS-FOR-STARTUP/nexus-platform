# Red Team Review — Security Adversary

**Plan:** `plans/260809-1030-workflow-engine-refactor/` (plan.md + phase-01..06)
**Date:** 2026-08-09 · Reviewer lens: Security

---

phase-03: **CRITICAL — Credit double-spend TOCTOU (T11).** Guard `hasCredit` (credit balance >= 1) chạy trong L2 **trước** database transaction (phase-03:146 L2 pre-fetch `creditBalance`, phase-02:237 "guard chỉ check data có sẵn trong event"). 2 request T11 song song cùng đọc `creditBalance=1` → cả 2 pass guard → cả 2 vào tx. Idempotency key `consume-{unitCode}-{caseId}-v{versionNo}` (phase-04:14) chỉ chặn double-deduct **cùng versionNo**, không chặn TOCTOU nếu versionNo khác nhau. Kịch bản tệ nhất: supporter gửi output, trừ credit thành công, case ở `report_ready_to_publish`. Request thứ 2 đã pass guard từ trước — upsert doc thành công trong tx, stage update thành idempotent (ghi đè), nhưng creditLedger unique constraint fail giữa chừng → tx rollback nhưng error message là raw P2002, không phải `NO_CREDITS`. **Fix:** chuyển credit check vào trong transaction dùng `SELECT ... FOR UPDATE` trên credit ledger row, hoặc advisory lock `pg_try_advisory_lock(caseId_hash)` trước guard. Khóa cả 2 request concurrent.

phase-02: **HIGH — T11 machine guard thiếu `hasCredit`.** Machine definition T11 (phase-02:141-145) guard list = `['isAssignedSupporter']`, kèm comment "// + hasCredit check trong executor". Credit check nằm ngoài machine — phụ thuộc use case tự pre-check. Nếu code path tương lai (tool nội bộ, admin script, test) gọi `executeTransition` không pre-check → trừ credit khi balance = 0. Cổng tự nhận là "cổng duy nhất" nhưng không tự bảo vệ. **Fix:** thêm `hasCredit` vào guard list của T11 trong machine definition. Trong L2 của `executeTransition`, luôn fetch credit balance từ DB và nạp vào `event.data.creditBalance` (KHÔNG để TODO).

phase-02: **HIGH — actor.role trust model: guard tin string từ caller.** Guard `isAdmin`: `event.actor.role === 'ADMIN'`. `actor` truyền từ HTTP handler → use case → `executeTransition`. Plan viết "Actor ID từ auth middleware → đã verify" nhưng **không verify role**. Nếu handler nào đọc `role` từ `req.body` thay vì `session.user.role` → attacker tự gán `"ADMIN"` → gọi T6 (assign supporter), T5 (accept), T12-T15. **Fix:** trong `executeTransition`, KHÔNG nhận `actor.role` từ tham số. Truyền `session` object vào service và tự extract role. Hoặc ít nhất verify `actor.role === session.user.role`.

phase-03: **MEDIUM — upsert doc: lifecycle_unit_id attacker-controlled.** Action `upsertDoc` nhận `params as any` từ `event.data` và gọi `upsertDocumentRecordsForUnit(..., lifecycleUnitId, ...)`. `event.data` đến từ use case params. Nếu use case không sanitize, attacker inject `lifecycleUnitId` của case khác → ghi đè document người khác qua unique constraint mới. **Fix:** trong L2, derive `lifecycleUnitId` từ case record đã fetch (không từ `data`). Truyền vào action params riêng, không merge với `event.data` thô.

phase-03: **MEDIUM — Stored XSS qua caseEvent.metadata không validate.** Mỗi transition ghi `metadata: data ?? {}` vào `caseEvent`. `data` attacker-controlled → nếu admin panel render metadata → stored XSS. Ngoài ra spam field lớn → DB bloat. **Fix:** whitelist field được phép lưu trong metadata, hoặc JSON-serialize + validate schema trước insert.

phase-04: **MEDIUM — T16 guard isBeforeSubmission TOCTOU.** Guard check pre-fetch. Attacker gửi đồng thời T2 + T16 — cả 2 thấy `intake_pending` → cả 2 pass. T2 xong đổi stage; T16 self-loop vẫn upsert → sửa hồ sơ sau khi nộp. **Fix:** trong transaction của T16, SELECT case stage `FOR UPDATE` để serialize. Hoặc `tryTransition` gọi lại bên trong tx.

phase-05: **LOW — Audit trail thiếu actor.role.** `caseEvent` lưu `actor_id` nhưng không lưu `actor.role` → sau này role user đổi, không audit được hành động với role gì. Kết hợp finding role trust → không forensic được. **Fix:** thêm `actor_role` vào schema `CaseEvent`, ghi từ `session.user.role`.

phase-03: **LOW — subtractCredit idempotency key predictable.** Key pattern `consume-{unitCode}-{caseId}-v{versionNo}` dễ đoán. Attacker tạo creditLedger entry giả với key tương lai (vd v3 khi mới v2) → chặn legitimate deduction. **Fix:** thêm random nonce hoặc HMAC(key, server_secret).
