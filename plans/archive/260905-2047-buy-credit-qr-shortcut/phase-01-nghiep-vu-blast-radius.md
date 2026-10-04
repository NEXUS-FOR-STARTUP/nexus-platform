# Phase 01 — Nghiệp vụ + blast radius

## Context Links

- `docs/flows/payment-verification-flow.md` — nạp ví ≠ mua lượt
- `docs/research/decision-2026-08-25-intake-payment-stage-separation.md` Q2 — admin verify deposit chỉ xác nhận ví
- `docs/technical-notes/money-credit-completion-model-note.md` — VND → CreditLedger/case → trừ T11
- `apps/api/src/modules/orders/application/create-order.usecase.ts`
- `apps/api/src/modules/deposits/application/verify-deposit.usecase.ts`
- `apps/api/src/modules/payments/application/sepay-webhook.usecase.ts`

## Overview

- Priority: P1
- Status: Completed
- Spec chốt. Không code phase này. Phase 2–3 bám bảng dưới. Không tự thêm BE fulfill.

## Key Insights

Hai lớp tiền. Trộn = bug kế toán.

| Lớp | API | Ghi gì | Không ghi |
|-----|-----|--------|-----------|
| Ví VND | `POST /deposits` rồi SePay hoặc `POST /deposits/:id/verify` | `UserWallet`, `WalletTransaction` | `CreditLedger`, `Case.payment_status`, Order |
| Lượt/case | `POST /orders` `credit_audit` | trừ ví, `CreditLedger`, `payment_status=paid`, `T19_REOPEN` nếu `done` | Deposit |

Deposit **không có** `case_id`. `createDeposit` bỏ `metadata_json` client.

## Requirements — luật nghiệp vụ (chốt)

1. Đủ ví: `POST /orders` như cũ. Không QR.
2. Thiếu ví, nguồn **hồ sơ** (modal mua credit): tự `POST /deposits(ổ thiếu)` → `/dashboard/payment?pid=`. Bỏ `/dashboard/wallet?amount=`.
3. Tự mua lượt **chỉ khi** đang trang QR **và** `sessionStorage` còn intent đúng `depositId`. Poll `verified` (SePay hoặc admin, tab còn mở) → `POST /orders` → về case.
4. Vào **Ví của tôi** / bấm back về ví: xóa intent. Tiền vào ví. Hồ sơ không +credit.
5. Đóng tab / hết sessionStorage: coi như nạp ví thường. Ngày mai bấm mua tay (đủ ví, 1 click).
6. Nạp từ `WalletTopupModal`: không ghi intent. QR verified không `POST /orders`.
7. Giữ modal số lượng 1–50. Không QR cứng 1 lượt.
8. Không nhét `createOrder` vào `verifyDeposit` / SePay webhook.
9. Giá lúc fulfill = giá server hiện tại (`createOrderUseCase`). Thiếu tiếp → fail, không tự tạo deposit mới.

## Câu hỏi: rút ngắn có đụng thứ khác?

**Không đổi hành vi (cấm sửa trong PR này):**

- SePay webhook, admin duyệt ảnh, proof upload, queue admin
- `createOrderUseCase` (chỉ caller FE thêm, cùng payload)
- Prisma / migrate
- T5 / T11 / trừ credit / refund FIFO (vẫn cần order thật)
- Trang ví nạp thuần, `?amount=` từ ví, nút rejected → tạo đơn mới
- `depositDetailHref` từ bảng ảnh / lịch sử ví — không có intent thì không fulfill
- Gói free upgrade: đã chạy trước `POST /orders` fail — pre-existing, không nới
- `UnpaidAlertBanner` dead; CTA sống = `StatusGuidanceCard.onOpenPayment` + `CreditPanel.onBuyCredits` → cùng modal
- Dual-write `DUAL_WRITE_*`
- `POST /wallet/purchase-credits` legacy — không gọi

**Đụng có chủ đích:**

- `CreditQuantityModal` nhánh `INSUFFICIENT_BALANCE` — hết toast đẩy ví
- Trang QR back: có intent → “Quay lại hồ sơ”; không → ví
- Hai notification cũ vẫn fire nếu ngồi QR auto-mua: `deposit.verified` (“Nạp tiền thành công”, link ví) rồi `order.paid` (“Mua credit thành công”, link ví). Không đổi template (payload order không có `case_id`). Học viên thấy 2 toast. Chấp nhận.

**Rủi còn lại (không sửa PR này):**

- `walletService.withdraw` nested tx trong `createOrder` — lỗ atomicity pre-existing. Fulfill dùng **một** `orderIdempotencyKey` nên retry không tạo order 2.
- Race SePay + admin cùng `pending` double cộng ví — pre-existing.
- Case `done` + auto-mua lúc còn QR → `T19_REOPEN` — cùng bấm mua tay.

## Architecture

```
Case modal POST /orders
  ├─ 200 → credit hồ sơ
  └─ 400 INSUFFICIENT_BALANCE
        → POST /deposits(shortage)
        → sessionStorage buyCreditAfterDeposit:{depositId}
        → /dashboard/payment?pid=

Payment page poll 5s
  ├─ verified + intent → POST /orders (cùng key) → clear → /dashboard/case/{id}
  └─ verified + không intent → chỉ UI “đã cộng ví”

Wallet page mount / back-to-wallet → clearAll intents
WalletTopupModal → QR không save intent
```

Không schema. Không writer mới cho `payment_status` / stage.

## Related Code Files

Không sửa phase này.

## Implementation Steps

1. Đọc phase 02–03. Không code.
2. Implementer không “tiện” thêm `case_id` lên deposit hay fulfill trong webhook.

## Todo List

- [x] Spec đã đọc trước khi sửa FE/BE

## Success Criteria

Phase 2–3 không vi phạm 9 luật trên.

## Risk Assessment

Nhầm fulfill vào `verifyDeposit` = sai hồ sơ / mua kép / T19 không có user. Mitigation: phase 3 test + cấm sửa 3 file webhook/verify/create-deposit.

## Security Considerations

Intent chỉ `sessionStorage` (tab). Không localStorage. `POST /orders` vẫn auth + owner check. Deposit id không đủ để mua lượt hộ người khác.

## Next Steps

Phase 02.
