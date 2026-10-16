# Phase 1: Xác nhận bất biến ví (chỉ đọc)

## Context Links

- [Report](../reports/261016-brainstorm-pay-later-receivable-and-grant-wallet-funds.md) mục 2 (điều chưa xác minh)
- `apps/api/src/modules/wallet/application/wallet.service.ts`
- `apps/api/src/modules/wallet/infrastructure/persistence/wallet.repository.ts`
- `prisma/schema.prisma` (model `WalletTransaction`, dòng ~211)
- `.agents/rules/prisma-migration-safety.md`

## Overview

- Priority: P1, chặn phase 2.
- Status: Pending.
- Chỉ đọc code. Không chạy lệnh Prisma, không truy vấn DB.

## Key Insights (đã biết)

- `WalletService.deposit` hardcode `type: 'deposit'`, luôn phát `WALLET_BALANCE_CHANGED` vào outbox. Caller: `sepay-webhook.usecase`, `verify-deposit.usecase`, `refund`.
- `createTransaction` ghi `source_type = reference_type`, nhận `metadataJson`, ép `type as any`.
- `getOrCreateWalletInTx` khoá `FOR UPDATE`. `idempotency_key` unique ở `WalletTransaction`.
- Web có nhãn `adjustment: "Điều chỉnh"`, API có nhãn `platform_bonus: "Hệ thống tặng thưởng"`.

## Cần xác nhận

1. Enum/kiểu cột `type` của `WalletTransaction` trong `schema.prisma` có `adjustment` không. **Nếu không: dừng, báo user, xử lý như migration thêm enum theo safety rules.**
2. Ai tiêu thụ `WALLET_BALANCE_CHANGED`. Có tạo thông báo "nạp tiền thành công" cho user không. Quyết định phát hay không phát sự kiện từ `grant`.
3. Truy vấn doanh thu admin (`useAdminStats` ↔ API stats): doanh thu tính từ bảng nào, có đếm `WalletTransaction` `type='service_payment'` hoặc `adjustment` không. Bảo đảm tiền tặng không thành doanh thu.
4. Cách đăng ký route admin và guard (`getAdminSession` trong handler như `listAdminUsersHandler`), vị trí đặt handler.
5. Mẫu test hiện có cho wallet ở `apps/api/src/shared/infrastructure/tests/` (dùng DB thật, mock Prisma, hay hàm thuần).
6. Luồng mua lượt có chạy được với ví vận hành không: `createOrderUseCase` đòi `case.owner_auth_user_id === userId` (`create-order.usecase.ts:L162-163`); trừ ví qua `walletService.withdraw` (`type: withdrawal`, `referenceType: order`), không phải `payForOrder` (`payForOrder` chỉ có test gọi).
7. Quy ước model Prisma hiện có (kiểu `id`, `created_at`/`updated_at`, `@@map`, tên bảng số nhiều, quan hệ tới `cases`, `orders` và `wallet_transactions`) để phase 2 viết ba bảng mới khớp.
8. Tài khoản vận hành thực tế (role gì: `admin`, `supporter`, `writer`) và ví nào sẽ được cấp. Chốt danh sách role cho `isAllowedGrantBeneficiary`.
9. **Tách `createOrderInTx`.** `createOrderUseCase` mở `prisma.$transaction` riêng (L83), nên không composable. Xác nhận ranh giới tách (thân L84–239, P2002 replay ở L242 ngoài transaction), những caller và test hiện có phải giữ xanh (`phase-03-discount-codes.test.ts`, test order khác).
10. **Định nghĩa doanh thu admin**: tìm truy vấn thống kê (theo `Order`, `Payment`, hay `WalletTransaction`) và kiểm `DUAL_WRITE_PAYMENT` ở env triển khai. Khi `true`, đơn ghi thêm `payment` `deposit` `paid` (L107-121); cần loại cả dòng này cho đơn tài trợ. Ghi bộ lọc chính xác vào phase 3.
11. Đường hoàn tiền: `case-transition.service.ts:L102-103` (`admin_veto` hoàn thẳng `lockedPrice`) có áp dụng cho case có đơn tài trợ không; `lockedPrice` được đặt khi nào và bởi luồng nào.
12. Listener `ORDER_PAID` (L210-229) tự chạy audit CP1 khi không `manual_trigger`; xác nhận cờ `manual_trigger` hoạt động như mong đợi cho đơn tài trợ.
13. **Mọi đường ghi `creditLedger` `type: 'purchase'`** (grep + codegraph: `create-order.usecase`, admin/seed/migration, webhook thanh toán). Bất biến "không trộn lô" ở phase 3 chỉ đúng nếu chỉ qua `createOrderInTx`; đường nào khác phải được áp cùng kiểm tra hoặc bị đóng.
14. **Dùng lại QR và thanh toán**: `getDepositBankInfo` (`payments/domain/bank-info.ts`) trả gì, `qrUrl` dựng thế nào và có nhận số tiền tuỳ ý không; các biến `SEPAY_*` đã đặt ở môi trường triển khai; `sepay.controller.ts` xác thực webhook thế nào.
15. Nội dung chuyển khoản `CRDEBT…` có sống sót qua ngân hàng không (ngân hàng có thể chèn hoặc tách ký tự): xem `transfer_content` thật của các `Deposit` đã verify để tìm dạng mã bị biến đổi, và xem SePay có điền trường `code` cho tiền tố này không (cấu hình nhận diện mã thanh toán).
16. Mã `CR[A-Z0-9]{6,}` trong `extractCodeFromContent` có trùng với nội dung nạp ví nào không: `CRTOPUP` + 6 hex (`create-deposit.usecase.ts`) đã xác minh trong code; kiểm thêm `wallet-topup.usecase.ts` (deprecated, `CR` + 6 ký tự ngẫu nhiên) và nội dung thật của các `Deposit` cũ để chắc không có mã nào bắt đầu `CRDEBT`. Xác nhận thứ tự nhánh `CRDEBT` trước `Deposit` không làm vỡ test webhook hiện có (`deposit-idempotency.test.ts` và các test khác).
17. **Trang công khai:** `proxy.ts` chỉ chặn `/dashboard`, `/admin`, `/writer` (matcher hiện gồm `/`, `/auth`, `/dashboard`...); xác nhận `/pay/[token]` không bị chặn và `MAINTENANCE_MODE` xử lý ra sao; cách đăng ký route API công khai hiện có (webhook SePay) và có cơ chế giới hạn tần suất sẵn không; layout gốc có đẩy thành phần cần đăng nhập vào mọi trang không.
18. **Hồi quy trang nạp tiền:** liệt kê test và luồng hiện có phụ thuộc `dashboard/payment/page.tsx` (`useFulfillCreditAfterDeposit`, `readBuyCreditAfterDepositIntent`, `ProofUpload`, nút nạp lại) để tách `PaymentView` mà không đổi hành vi; xác nhận không có test giao diện sẵn thì cần smoke trình duyệt thủ công cho cả hai ca.
19. **Tạo case thay khách trước khi mua hộ.** `createReceivable` có `purchase` đòi case đã tồn tại và thuộc người nhận ví. Xác nhận admin hoặc tài khoản vận hành tạo được case cho khách như thế nào (case có cần gói free `pkg_tf_free`, tài liệu hoặc đầu vào nào khi tạo; `useCreateCase` hoặc endpoint tương đương), và case ở trạng thái nào thì mua được từng loại gói (CP1 và CP2).

## Requirements

- Ghi kết quả từng mục vào mục "Findings" cuối file này, kèm đường dẫn:dòng.

## Related Code Files

Đọc: các file ở Context Links, handler admin hiện có, thư mục tests, `docs/shared-validation-convention.md`.
Không sửa file nào.

## Implementation Steps

1. Dùng `codegraph_explore` cho từng mục trên, không grep trước.
2. Ghi findings.
3. Chốt: cần migration (có/không), phát outbox (có/không), vị trí route, mẫu test.

## Todo

- [ ] Mục 1 (enum `adjustment`)
- [ ] Mục 2 (consumer `WALLET_BALANCE_CHANGED`)
- [ ] Mục 3 (nguồn doanh thu admin)
- [ ] Mục 4 (route + guard)
- [ ] Mục 5 (mẫu test)
- [ ] Mục 6 (mua lượt bằng ví admin)
- [ ] Mục 7 (quy ước model Prisma)

## Success Criteria

- Mọi mục có kết luận kèm trích dẫn file:dòng.
- Quyết định migration/outbox/route/test được ghi lại.

## Risk Assessment

- Enum thiếu `adjustment` làm cả kế hoạch cần migration. Dừng ở đây là đúng.
- Doanh thu đếm nhầm tiền tặng: nếu có, thêm lọc theo `source_type` vào phase 2.

## Security Considerations

- Không đọc/echo `DATABASE_URL`. Không truy vấn DB.

## Findings

(điền khi thực hiện)

## Next Steps

Phase 2.
