# Journal: Buy Credit QR Shortcut Implementation Complete

**Date**: 2026-09-05  
**Status**: Completed  
**Plan**: `plans/260905-2047-buy-credit-qr-shortcut/`

## 1. Summary of Changes

Đã triển khai hoàn chỉnh luồng rút ngắn thao tác nạp tiền mua credit từ hồ sơ (Phase 1, 2, 3):

1. **FE Intent Module (`credit-after-deposit-intent.ts`)**:
   - Quản lý `sessionStorage` key `buyCreditAfterDeposit:{depositId}` chứa `caseId`, `quantity`, `orderIdempotencyKey`.
   - Validate nghiêm ngặt (quantity 1–50 nguyên, caseId & key không rỗng; lỗi JSON tự clear; an toàn SSR).
   - Hàm `clearAllBuyCreditAfterDepositIntents()` dọn sạch tất cả intent khi rời phiên vào trang ví.

2. **Shortage Deposit Redirect (`use-shortage-deposit-redirect.ts`)**:
   - Tách logic nạp tiền khi thiếu số dư thành custom hook riêng (tuân thủ giới hạn dòng và không gọi `apiClient` trực tiếp từ component).
   - Tạo deposit với `idempotency_key = crypto.randomUUID()`, lưu intent mua lượt, sau đó điều hướng thẳng tới `/dashboard/payment?pid=${depositId}`.

3. **Case Credit Quantity Modal (`CreditQuantityModal.tsx`)**:
   - Xử lý nhánh `INSUFFICIENT_BALANCE`: tự động tính số tiền thiếu tối thiểu, gọi `startShortageDeposit`, và đóng modal sau khi hoàn tất khởi tạo.
   - Xóa bỏ hoàn toàn toast nút "Nạp tiền ngay" trỏ về `/dashboard/wallet?amount=...`.

4. **Auto-Fulfill Credit Hook (`use-fulfill-credit-after-deposit.ts`, `useCreateCreditOrder.ts`)**:
   - Hook `useCreateCreditOrder`: mutation gọi `POST /orders` cho service type `credit_audit`.
   - Hook `useFulfillCreditAfterDeposit`: lắng nghe trạng thái deposit. Khi `status === "verified"` và tìm thấy intent tương ứng trong tab, tự động gửi yêu cầu tạo đơn hàng bằng `orderIdempotencyKey` đã lưu trước đó, xóa intent, invalidate cache `["case", id]` & `["wallet"]`, hiển thị toast thành công và redirect về `/dashboard/case/${caseId}`.
   - Ref bảo vệ chống duplicate trigger trong cùng vòng đời mount / React Strict Mode.

5. **Payment & Wallet Pages (`payment/page.tsx`, `wallet/page.tsx`, `deposit-display.ts`)**:
   - Bổ sung copy `backToCase: "Quay lại hồ sơ"` trong `WALLET_COPY`.
   - Nút quay lại tại trang payment: nếu có intent gắn với hồ sơ thì hiển thị "Quay lại hồ sơ" và quay về case; nếu không thì hiển thị "Về trang ví" và xóa intent.
   - Tách section QR ngân hàng ra `PaymentBankInfo.tsx` để giữ `payment/page.tsx` luôn dưới 200 dòng (194 dòng).
   - Trang `/dashboard/wallet` gọi `clearAllBuyCreditAfterDepositIntents()` lúc mount để đảm bảo nạp tiền từ ví không bao giờ tự động mua lượt.

6. **Backend Invariant Test & Documentation**:
   - Tạo test `apps/api/src/shared/infrastructure/tests/deposit-does-not-grant-credit.test.ts`: xác minh mã nguồn `verify-deposit.usecase.ts` và `sepay-webhook.usecase.ts` không import hoặc gọi `createOrderUseCase`, `creditLedger`, hay `CREDIT_AUDIT`.
   - Cập nhật tài liệu luồng `docs/flows/payment-verification-flow.md` bổ sung phần "Click học viên (rút ngắn 2026-09)".

## 2. Invariants & Safety

- Không sửa đổi backend production (`verifyDeposit`, `sepayWebhook`, `createOrder`, Prisma schema).
- Tuyệt đối an toàn cơ sở dữ liệu: không chạy migration hay thao tác destructive DB nào.
- Toàn bộ các file tạo mới và sửa đổi đều < 200 dòng.
- TypeScript `npm run check-types` pass 100% trên toàn bộ monorepo workspaces.
- ESLint pass 0 errors, 0 warnings trên các file sửa đổi.
- Code review hoàn thành với đánh giá chính xác, các khuyến nghị UX đã được xử lý.
