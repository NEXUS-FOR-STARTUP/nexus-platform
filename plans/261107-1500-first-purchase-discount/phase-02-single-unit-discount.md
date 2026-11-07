# Phase 2: Giảm giá chỉ cho 1 lượt

## Context Links
- [plan.md](./plan.md)
- `apps/api/src/modules/orders/application/order-prepare.ts:42-69`
- `apps/api/src/modules/orders/application/order-in-tx.ts:119`
- `apps/api/src/modules/orders/application/discount.helpers.ts`
- `apps/web-1/app/dashboard/case/[id]/_components/billing/ServiceCheckoutModal.tsx:44,61-62`

## Overview
- Priority: P1
- Status: Pending
- Hiện mã 40% áp lên cả dòng: `unitPrice = applyPercentOff(...)` rồi `quantity * unitPrice`. Mua 10 gói vẫn giảm 40% cả 10. Ý định: "lượt tiếp theo" = 1 lượt.

## Key Insights
- `CreditQuantityModal` ép `quantity = 1` cho gói chấm (`isAiAudit`, dòng 48) nếu `GRADING_PACKAGE_IDS` có đủ 3 gói (chưa xác minh). Lỗi chủ yếu ở `ServiceCheckoutModal` (chọn 1..MAX_PACKAGES).
- Server phải là nguồn sự thật; client chỉ hiển thị.
- Mặc định (Q2): tách dòng 1 giảm + (N−1) giá gốc, để khách vẫn mua đủ số lượng.

## Requirements
- Có mã hợp lệ và quantity > 1: đúng 1 lượt giảm, còn lại giá gốc. Tổng = `applyPercentOff(price,pct) + (N-1)*price`.
- Metadata đơn lưu `list_price`, `discount_code`, `percent_off` như cũ; redeem vẫn 1 lần.
- Endpoint `/orders/discount-check` trả đủ thông tin để UI tính tổng.

## Architecture
`prepareOrder`: sau khi resolve mã, với item khớp mã và `quantity > 1` → tạo 2 order item: `{quantity:1, unitPrice: discounted}` và `{quantity:N-1, unitPrice: list}`. Lưu ý `createOrderInTx` và trigger cấp lượt phải đọc đúng tổng lượt (1 + N−1). Cần đọc kỹ `order-in-tx.ts` về cách cộng `credits_granted * quantity`.

## Related Code Files
Modify:
- `apps/api/src/modules/orders/application/order-prepare.ts`
- `apps/api/src/modules/orders/application/order-in-tx.ts` (nếu cấp lượt theo item)
- `packages/validation/src/discount.ts` (`DiscountCodeCheckResult`: thêm trường cần cho UI, ví dụ `discounted_units: 1`)
- `apps/web-1/app/dashboard/case/[id]/_components/billing/ServiceCheckoutModal.tsx`
- `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx` (kiểm quantity)
Tests: `apps/api/src/shared/infrastructure/tests/` file mới `discount-single-unit.test.ts`.

## Implementation Steps
1. Đọc `order-in-tx.ts` toàn bộ, xác định cách tính lượt và tổng.
2. Cài logic tách dòng trong `prepareOrder`.
3. Cập nhật schema kiểm mã và `DiscountCodeInput`/modal để hiển thị tổng đúng.
4. Viết test: N=1, N=3; tổng đúng; một lần redeem; lượt cấp = N.
5. `cd packages/validation && bun run build && bun run test`; test API từng file; `tsc --noEmit` api + web-1.

## Todo List
- [ ] Đọc order-in-tx
- [ ] Logic tách dòng
- [ ] Cập nhật validation + UI tổng
- [ ] Test N=1,3 + redeem một lần
- [ ] Typecheck

## Success Criteria
- Mua 3 gói có mã: 29,400 + 2×49,000 = 127,400 VND; credits cấp = 3; `redeemed_count` = 1.
- Mua 1 gói: 29,400.

## Risk Assessment
- Tách dòng làm lệch giả định "1 order item = 1 gói" ở báo cáo/hoàn tiền: kiểm refund và ledger.
- Phương án thay thế nếu quá rủi ro: từ chối (lỗi rõ) khi quantity > 1 có mã.

## Security Considerations
Giá do server tính, không tin client.

## Next Steps
Phase 4 dùng giá 1 lượt để hiển thị banner.
