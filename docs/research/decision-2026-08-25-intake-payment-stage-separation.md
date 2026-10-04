# Quyết định — Tách trục stage/payment, sửa bug kẹt intake (GA-02)

- **Ngày:** 2026-08-25
- **Loại:** decision
- **Trạng thái:** ĐÃ DUYỆT bởi owner (2026-08-25)
- **Nguồn gốc:** `docs/research/brainstorm-2026-08-21-flow-confusion-intake-payment-credit.md` (Q1–Q5) + GA-02 trong `tasks/gap-analysis-tasks.md`
- **Xác minh code:** confirmed 2026-08-25 — scout agent + orchestrator đối chiếu source hiện tại

## 1. Vấn đề (đã xác minh bằng source)

Case trả tiền trước khi nộp hồ sơ kẹt vĩnh viễn ở `intake_ready`, không vào hàng đợi admin (`submitted`). Hai site gây kẹt + một nhánh submit sai:

1. `apps/api/src/modules/orders/application/create-order.usecase.ts:166-172` — mua credit: đặt `payment_status=paid` **và** đẩy `intake_pending → intake_ready`.
2. `apps/api/src/modules/payments/infrastructure/persistence/payment.repository.ts` (`verifyPayment`) — admin verify payment paid: **cũng** đẩy `intake_pending → intake_ready`.
3. `apps/api/src/modules/cases/application/submit-intake.usecase.ts:217-220` — submit: `stage === "intake_ready" ? T16_EDIT_INTAKE : T2_SUBMIT_INTAKE`. T16 target là `intake_ready` → submit không bao giờ tới `submitted`.

Không có đường thoát (T2 không chọn cho `intake_ready`; T3/T4 đòi `cancelled`; `resubmitCase` dead code). Case kẹt vô hình với admin queue (bucket và API filter enum đều loại `intake_pending`/`intake_ready`). Gói free miễn nhiễm (giá 0 chặn mua credit).

## 2. Quyết định (chốt Q1–Q5)

- **Q1 — Thứ tự:** C — không ép thứ tự nộp/trả. Cổng `T5_ACCEPT` đòi đủ `submitted + hasCredit + hasPaymentComplete` nên thứ tự không quan trọng.
- **Q2 — Định nghĩa paid:** `paid` = đã mua credit cho case (order paid). Admin verify deposit chỉ xác nhận ví, không gắn case. Không tạo tem "verified payment" riêng (YAGNI).
- **Q3 — 2 stage:** Giữ `intake_pending`/`intake_ready` trong `VALID_CASE_STAGES` (compat dữ liệu cũ). Sau fix, không còn writer mới cho `intake_ready` — submit luôn `T2_SUBMIT_INTAKE` từ cả hai stage. `T16_EDIT_INTAKE` giữ định nghĩa (không xóa — dữ liệu cũ), không còn caller.
- **Q4 — Team-fit:** Giữ chung bảng `case`; admin queue filter `submitted` (đã đúng).
- **Q5 — Sửa PR 19:** Giữ cổng T5 + dán tem `paid`; **bỏ nhảy stage** ở cả 2 site; **bỏ ternary** trong submit-intake.

## 3. Bất biến (từ nay về sau)

1. **Single writer cho `user_facing_stage`:** chỉ `transitionInTx` (case-transition.service.ts). Mọi code ngoài machine cấm viết stage. *(Ghi chú: hiện còn các writer trực tiếp pre-existing ngoài scope GA-02 — `case.repository.ts` (createCase khởi tạo), `report.repository.ts`, `ai-engine.routes.ts`, assign-supporter (ngoại lệ đã document) — không thuộc fix này; GA-02 chỉ cam kết xóa 2 writer do payment gây ra.)*
2. **Tiền không lái stage:** deposit/order/refund chỉ ghi `payment_status`/ledger/wallet.
3. **Submit = submitted:** endpoint submit intake luôn chạy T2; edit trước duyệt = submit lại (stage ở lại `submitted`, data cập nhật — giữ nguyên feature commit `0616700`).

## 4. Điểm sửa

| # | File | Sửa |
|---|---|---|
| 1 | `create-order.usecase.ts:166-172` | Bỏ push stage; giữ `payment_status: "paid"` |
| 2 | `payment.repository.ts` (verifyPayment) | Bỏ push stage; giữ tem paid |
| 3 | `submit-intake.usecase.ts:217-220` | Bỏ ternary; nhánh triage_pending luôn `T2_SUBMIT_INTAKE` |
| 4 | `StatusGuidanceCard.tsx` (intake_ready) | Copy: hành động giờ là "Nộp hồ sơ" (nộp lại → T2), không còn "chỉ cập nhật" |
| 4b | `StatusGuidanceCard.tsx` (intake_pending, nhánh non-free) | Dọn nghĩa A "ép trả trước": title "Chờ thanh toán dịch vụ" → "Hồ sơ chưa thanh toán"; body → "Có thể nộp trước, thanh toán sau — phản biện chỉ bắt đầu sau khi thanh toán". Giữ nút "Thanh toán ngay" (gợi ý, không ép). Nhánh `isFree` giữ nguyên |
| 4c | `notification-templates.ts:17-29` (STAGE_LABELS) | `intake_pending`: "Chờ thanh toán" → "Chờ nộp hồ sơ"; `intake_ready`: "Sẵn sàng khởi động" → "Đã cập nhật hồ sơ" (dọn tàn dư nghĩa A) |
| 5 | Tests | 2 path: `intake_pending → mua credit → nộp → submitted`; `mua trước nộp` không kẹt (nộp lần 2 lên `submitted`) |

## 5. Hệ quả thiết kế

- **Nộp hồ sơ KHÔNG bị chặn bởi payment (đã verify 2026-08-25):** T2 guard chỉ `isOwner` (`case-machine.ts:68-72`) — không `hasCredit`, không `hasPaymentComplete` ở bước submit. 402 chỉ xảy ra ở `T5_ACCEPT` (admin duyệt). → Sinh viên nộp hồ sơ tự do, dữ liệu không mất; tiền là điều kiện được *phục vụ*, không phải điều kiện được *nộp*.
- **Tự lành:** case đang kẹt (paid + `intake_ready`) — sau fix, user nộp lại → T2 → `submitted`. Không cần sửa DB tay.
- Nộp trước trả sau: `submitted` + `unpaid` → T5 chặn 402 → mua credit → duyệt được.
- Trả trước bỏ cuộc: credit nằm ở case → xử lý bằng policy refund (P2, ngoài scope fix này).
- Không đụng DB schema, không migration.


## 6. Rủi ro

- `intake_ready` trở thành stage không ai ghi mới — chấp nhận (compat); nếu muốn xóa hẳn thì làm sau (thuộc cleanup P2).
- UI copy còn chỗ khác tham chiếu `intake_ready` (CaseStatusHeader ping badge) — không cần đổi hành vi, chỉ đổi chữ ở card guidance.
