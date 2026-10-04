# Journal: Plan FREE upgrade after paid order

**Date**: 2026-09-06  
**Status**: Completed  
**Plan**: `plans/260906-1225-free-upgrade-after-order/`

## Quyết định

- Root cause: FE `upgrade-package` trước `POST /orders`. Thiếu ví → package đã audit + unpaid → banner vàng.
- Không đảo FE order-first: `resolveCreditAuditPrice` trên FREE throw `INVALID_PRICE`.
- BE: fallback giá `pkg_tf_audit`; upgrade trong `createOrder` **sau** withdraw. Không gọi `upgradeCasePackage` (set unpaid).
- FE: xóa pre-upgrade; `return` sau `INSUFFICIENT_BALANCE` (toast đỏ thừa từ PR QR).
- QR plan “không nới” = đã biết, cố ý không sửa lúc đó. Plan này sửa đúng bug đó.

## Triển khai & Kiểm thử

- **Backend (`create-order.usecase.ts`, `credit-audit-order.helpers.ts`)**:
  - Tách helpers xử lý credit order vào `credit-audit-order.helpers.ts` giữ cả 2 file dưới 200 dòng.
  - `resolveCreditAuditPrice`: fallback giá sang `pkg_tf_audit` khi case FREE (`pkg_tf_free` hoặc `locked_price === 0`).
  - `applyPaidCreditCaseUpdate`: nâng cấp case sang `pkg_tf_audit`, set `locked_price = unitPrice`, dán tem `payment_status: "paid"`, tạo event `package_upgraded` chỉ sau khi `walletService.withdraw` thành công trong transaction.
- **Frontend (`CreditQuantityModal.tsx`, `page.tsx`)**:
  - Xóa pre-upgrade call `POST /cases/:id/upgrade-package` và prop thừa `currentPackageId`.
  - Thêm `return;` trên nhánh `INSUFFICIENT_BALANCE` để ngăn hiển thị toast đỏ "Không thể tạo đơn hàng" khi redirect sang nạp tiền QR.
- **Kiểm thử**: Toàn bộ 33/33 test case passing (100%) qua `credit-audit-order-upgrade.test.ts`, `upgrade-package.test.ts`, `deposit-does-not-grant-credit.test.ts`. Type-check hoàn toàn sạch.

## Tài liệu cập nhật

- `docs/flows/payment-verification-flow.md`: Bổ sung Nguyên tắc 6 về cơ chế nâng cấp gói case miễn phí sau khi trừ ví mua credit thành công và cập nhật mục "Thiếu / chưa rõ".
- `docs/requirements/packages-pricing-and-payment-proof.md`: Bổ sung Mục 2.2 điều 4 về Free Case Upgrade on Paid Order và cập nhật Mục 3.3 Backend API cho `POST /api/orders`.
- `docs/technical-notes/money-credit-completion-model-note.md`: Bổ sung mô tả luồng nâng cấp gói case miễn phí trong Mục 1.2 Credit (per case).
