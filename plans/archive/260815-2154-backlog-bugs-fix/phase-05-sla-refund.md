# Phase 05 — SLA + Refund (#1)

- Priority: P0 | Status: Done | Effort: 8h
- Depends: Phase 03 | Blocks: Phase 06

## Overview

SLA đếm tiếp khi reassign. **Refund rule mới**: case kết thúc non-completed + credit dư → hoàn VND về ví theo giá mua thực tế. Chống hoàn kép bằng idempotency key.

> **Red-team fixes đã áp dụng:** C5 (reassign ở `report_ready`/`supporter_working` hiện FAIL — T6 chỉ định nghĩa ở `accepted_unassigned`/`assigned` (`case-machine.ts:91,104`); phải THÊM T6 self-loop vào 2 state đó, target = chính state đó, guard isAdmin — KHÔNG dùng đường unassign raw vì sẽ xóa sổ report state); C2 (FIFO phải đi **DESC — credit mới nhất trước** vì consumption đã ăn credit cũ trước theo thời gian; ví dụ mua 3@39k rồi 2@49k, tiêu 2 → dư 3 = 1×39k + 2×49k = 137k, đi ASC sẽ trả nhầm 117k); C3 (close-case.usecase.ts KHÔNG có role guard — bỏ luôn route + use case: supporter không tự close, user dùng T15, admin dùng T14); M1 (refund + delete phải cùng 1 tx — tuần tự thì refund xong delete fail = tiền 2 lần); m-Wallet (owner chưa có ví → skip refund + log).

## Requirements

- SLA đếm tiếp khi reassign — **đã đúng, no code change** cho phần đếm. NHƯNG reassign tại `report_ready_to_publish`/`supporter_working` đang bị 400 INVALID_TRANSITION (T6 không tồn tại ở 2 state đó) → **THÊM T6 self-loop** (target = chính state, guard isAdmin) vào cả 2.
- SLA display + SlaTimer + row tint + banner — đã implement (`AdminCaseAssignmentTable.tsx:185,371-419` + `admin/page.tsx:557-562`) → **verify/threshold alignment only**.
- Refund: khi case kết thúc non-completed (T12 reject, T13 veto, T15 cancel, admin delete) + `credit_balance > 0` → hoàn unused credit về wallet VND theo **giá mua thực tế**.
- T13 giữ `locked_price` refund riêng (key `refund-{caseId}`) — 2 khoản độc lập.
- Admin delete: đọc credit balance TRƯỚC deleteCase (cascade xóa CreditLedger) + refund cùng tx.
- **Supporter close: XÓA route + use case** (`close-case.usecase.ts`, `supporter.controller.ts:114`) — bypass machine + không guard, không còn chỗ trong flow mới. Refund trigger không bao gồm supporter close nữa.

## Architecture

### FIFO refund giá mua — đi DESC (newest first)

- Đọc `creditLedger` purchase entries (type `purchase`) order by **`created_at DESC`**.
- Unit price từ `entry.metadata_json.unit_price` (set tại `create-order.usecase.ts:150`), fallback `OrderItem.unit_price` qua `reference_id`.
- Số credit chưa dùng = `credit_balance`. **Vì consumption ăn credit cũ trước (theo thời gian), credit còn dư = các purchase MỚI NHẤT** → walk DESC lấy `min(remaining, entry.amount)` × unit_price đến đủ `credit_balance`.
- `walletService.refund(ownerId, refundVnd, 'case_refund', caseId, key='refund-credit-'+caseId)`.
- Optional `creditLedger type:'refund'` entry (đối ứng) — chỉ để trace; balance → 0 không ảnh hưởng T13 (locked_price đi đường riêng).
- Owner không có ví (chưa từng nạp) → skip + log (không thể xảy ra khi đã mua credit vì mua credit bắt buộc có ví — guard phòng thủ).

### Idempotency

- Key `refund-credit-{caseId}` — case kết thúc đúng 1 lần. Catch P2002 duplicate (pattern `case-transition.service.ts:230-232`) → no-op.
- T13 giữ key `refund-{caseId}` (locked_price) tách biệt.

### Hook points (atomic)

- T12/T13/T15: trong `case-transition.service.ts` action executor (action mới `refundRemainingCredit` chạy trong `transitionInTx` — **cùng tx với transition**, atomic).
- Admin delete: `delete-case.usecase.ts` — **wrap trong `prisma.$transaction`**: đọc balance → refund → deleteCase (deleteCase phải nhận tx client hoặc tạo biến thể tx).

## Related Code Files

| File | Action |
|---|---|
| `apps/api/src/services/case-transition.service.ts` (128-135, 230-232) | SỬA: +action `refundRemainingCredit` (FIFO DESC) trong tx cho T12/T13/T15; keep locked_price T13 |
| `apps/api/src/modules/cases/domain/case-machine.ts` (91, 104, 169-181) | SỬA: gắn action `refundRemainingCredit` vào T12/T13/T15; +T6 self-loop ở `supporter_working` + `report_ready_to_publish` (guard isAdmin) |
| `apps/api/src/modules/orders/application/create-order.usecase.ts` (141-152) | VERIFY: metadata_json.unit_price là nguồn giá FIFO |
| `apps/api/src/modules/wallet/application/wallet.service.ts` (107-145) | VERIFY: walletService.refund signature (ownerId, amount, type, caseId, key) |
| `apps/api/src/modules/cases/application/delete-case.usecase.ts` (27-38) | SỬA: tx wrap — đọc balance → refund → deleteCase cùng tx |
| `apps/api/src/modules/supporter/application/close-case.usecase.ts` | XÓA (cùng handler/route `supporter.controller.ts:114`) |
| `apps/api/src/modules/cases/infrastructure/persistence/case.repository.ts` (256-260) | SỬA: deleteCase nhận optional tx client |
| `apps/web-1/app/admin/_components/AdminCaseAssignmentTable.tsx` (185, 371-419) | VERIFY: SLA display/threshold |
| `apps/web-1/app/admin/page.tsx` (557-562) | VERIFY: SLA banner |
| `apps/api/src/shared/infrastructure/tests/` | TẠO: refund FIFO unit test (multi-price, direction DESC) |

## Implementation Steps

1. Verify SLA reassign không reset phần đếm (đọc `setSlaDeadline`/assign flow) — confirm.
2. Machine: thêm T6 self-loop (isAdmin) ở `supporter_working` + `report_ready_to_publish` — fix reassign 400.
3. Xóa close-case route + use case (supporter không tự close).
4. Viết helper `computeRemainingCreditRefundVnd(caseId)` FIFO **DESC** + multi-price test.
5. `case-machine.ts`: gắn action `refundRemainingCredit` vào T12/T13/T15.
6. `case-transition.service.ts`: implement action executor (refund + idempotency + P2002 catch) trong tx.
7. `delete-case.usecase.ts`: tx wrap — đọc balance → refund → deleteCase (repo nhận tx).
8. Verify SLA display/threshold FE — align nếu lệch.
9. Unit test: FIFO DESC multi-price, idempotency, T13 2 khoản độc lập, reassign T6 ở report_ready.
10. `npm run check-types` + `npm test`.

## Todo List

- [x] Verify SLA reassign đếm tiếp (no change phần đếm)
- [x] Machine: +T6 self-loop ở supporter_working + report_ready_to_publish (fix 400 reassign)
- [x] Xóa close-case route + use case
- [x] Helper computeRemainingCreditRefundVnd FIFO DESC (đặt tên `computeFifoRefund` trong services/credit-refund.ts)
- [x] Machine: action refundRemainingCredit T12/T13/T15
- [x] Service: refund executor trong tx + idempotency `refund-credit-{caseId}` (findUnique pre-check; race P2002 → tx rollback an toàn)
- [x] delete-case: tx wrap (balance → refund → delete)
- [x] Verify SLA display/threshold FE
- [x] Unit test FIFO DESC multi-price + idempotency + T13 + T6 reassign
- [x] `npm run check-types` + `npm test` PASS — check-types PASS; phase-05 test pass (FIFO DESC 137k); full suite 275/293, 18 fail pre-existing env/drift documented out-of-scope (xem phase-08)

## Success Criteria

- SLA đếm tiếp khi reassign; **reassign hoạt động ở mọi stage chưa final** (kể cả report_ready "báo cáo chờ gửi") + audit history.
- SLA warning hiện đúng threshold.
- Case non-completed + credit dư → hoàn VND đúng giá mua (newest-first), idempotent, không hoàn kép.
- T13 hoàn locked_price + credit dư — 2 khoản độc lập.
- Admin delete không mất credit dư (refund cùng tx trước cascade).
- Supporter không thể tự close; case done bình thường không hoàn gì.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| FIFO direction sai (ASC) trả thiếu/thừa tiền | Trung bình | Cao | Walk DESC (newest first) — test multi-price chốt 137k ví dụ |
| Hoàn kép (refund chạy 2 lần) | Trung bình | Cao | Idempotency key `refund-credit-{caseId}` @unique + P2002 catch |
| Admin delete cascade mất creditLedger trước khi đọc balance | Trung bình | Cao | Wrap 1 tx: đọc balance → refund → delete |
| Refund thiếu khi unit_price fallback OrderItem | Thấp | Trung bình | Ưu tiên metadata_json.unit_price, fallback chỉ khi thiếu |
| T6 self-loop ở report_ready đổi supporter giữa chừng đọc báo cáo | Thấp | Trung bình | Guard isAdmin + audit event (đã có supporter_assigned); SLA đếm tiếp nên không thiệt hại |

## Next Steps

→ Phase 06: Admin queue (#9).
