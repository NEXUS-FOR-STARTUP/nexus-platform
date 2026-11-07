# Phase 3: Chặn đơn mua hộ phát mã

## Context Links
- [plan.md](./plan.md)
- `apps/api/src/modules/orders/application/order-in-tx.ts:173-190` (payload ORDER_PAID)
- `apps/api/src/modules/orders/application/first-purchase-discount.listener.ts:41-44`
- Plan đã xong: `plans/261016-1530-grant-wallet-funds-pay-later`

## Overview
- Priority: P1
- Status: Pending
- `createReceivableUseCase` gọi `createOrderInTx` cho tài khoản system với `totalAmount > 0`, phát `ORDER_PAID` không có cờ funded. Listener tạo mã và gửi mail cho tài khoản system.

## Key Insights
- Listener chỉ kiểm `userId`, `orderId`, `totalAmount > 0`.
- Cờ `funded` có sẵn khi gọi `createOrderInTx`; chỉ chưa đưa vào payload.

## Requirements
- Đơn funded/mua hộ không tạo mã, không gửi thông báo.
- Các listener khác của `ORDER_PAID` không bị ảnh hưởng (thêm trường, không đổi trường cũ).

## Architecture
Payload thêm `funded: boolean`. Listener `if (p.funded) return`.

## Related Code Files
Modify:
- `apps/api/src/modules/orders/application/order-in-tx.ts` (payload)
- `apps/api/src/modules/orders/application/first-purchase-discount.listener.ts`
- `apps/api/src/shared/infrastructure/tests/first-purchase-discount.test.ts` (thêm case funded)

## Implementation Steps
1. Đọc cách `funded` được truyền vào `createOrderInTx`.
2. Thêm `funded: !!funded` vào payload ORDER_PAID.
3. Listener bỏ qua khi `funded`.
4. Thêm test đơn funded → 0 mã, 0 sự kiện.
5. Chạy file test + `tsc --noEmit` api.

## Todo List
- [ ] Payload funded
- [ ] Guard trong listener
- [ ] Test
- [ ] Typecheck

## Success Criteria
Test funded pass; test cũ vẫn pass; không có `discount_codes` mới cho đơn receivable khi smoke.

## Risk Assessment
Nếu đơn cũ trong outbox chưa có trường `funded` → `undefined` → coi là không funded (an toàn: đúng hành vi hiện tại).

## Security Considerations
Tránh gửi mail tới tài khoản hệ thống.

## Next Steps
Phase 7 smoke có kịch bản pay-later.
