# Credit dự trữ account-level

_Trạng thái: Draft_
_Ngày tạo: 2026-08-06_
_Ưu tiên: Medium_

## 1. Mô tả ngắn (Summary)

Credit dự trữ (account-level) — mỗi tài khoản có quỹ credit riêng, dùng để trả cho lượt audit trên mọi case. Không phụ thuộc vào từng case riêng lẻ.

## 2. Bối cảnh (Context)

Hiện tại thanh toán gắn trực tiếp vào từng case (payment per case). Cần cơ chế linh hoạt hơn:

- User nạp credit vào tài khoản
- Mỗi lần audit trừ credit từ tài khoản
- Credit dùng được cho mọi case (không bị lock vào case cụ thể)

## 3. Sẽ làm gì? (Planned Actions)

- [ ] Thiết kế bảng `credits` — account-level balance, transaction log
- [ ] API nạp credit (payment integration)
- [ ] API trừ credit khi tạo audit request
- [ ] UI hiển thị credit balance trên header/workspace
- [ ] Cơ chế hoàn credit khi audit bị hủy

## 4. Nên cân nhắc gì? (Recommendations)

- Nên dùng double-entry ledger để audit trail đầy đủ (không chỉ balance đơn thuần)
- Credit hết hạn không? Nếu có, cần cron job cleanup
- Có cho phép chuyển credit giữa accounts không? (Needs decision)
- Tích hợp với SePay webhook để auto-top-up?

## 5. Lưu ý khi làm (Notes / Gotchas)

- Payment flow hiện tại trong `apps/api/src/modules/payments/` — cần refactor hoặc extend
- `SERVICE_PREFIX = "CR"` đã được define cho credit purchase (xem `create-payment.usecase.ts:20`)
- Bảng `payments` hiện tại gắn `case_id` — credit account-level sẽ không có `case_id`
- Cần phân biệt payment type: `case_payment` vs `credit_topup`
- Cần transaction log riêng cho credit (ghi nhận từng lần nạp/trừ)

## 6. Quyết định đã đưa ra (Decisions)

| #   | Quyết định | Lý do | Ngày |
| --- | ---------- | ----- | ---- |

## 7. Câu hỏi mở (Open Questions)

- [?] Credit có hết hạn theo thời gian không?
- [?] Một lần audit = bao nhiêu credit?
- [?] Có gói credit nào không (vd: 10 credit = X VND, 50 credit = Y VND)?
- [?] Credit có refund được không? Policy refund thế nào?
- [?] Có cho phép chuyển credit giữa các user trong cùng team không?

## 8. Liên kết (References)

- Payment module: `apps/api/src/modules/payments/`
- PRD: `docs/prd/core-product-prd.md`
