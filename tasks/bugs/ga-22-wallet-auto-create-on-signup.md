# GA-22: Tự động khởi tạo Ví mặc định khi Đăng ký & Get-or-Create khi Mua Credit

- **ID:** GA-22
- **Priority:** P1
- **Status:** Done
- **Assignee:** Phùng Lưu Hoàng Long
- **Nguồn:** Phát hiện trong quá trình kiểm thử GA-02 (Case NX-890059)
- **Báo cáo:** `plans/250825-2100-ga02-intake-flow-fix/reports/tester-wallet-autocreate.md`

---

## 1. Mô tả vấn đề
Người dùng mới đăng ký tài khoản chưa từng nạp tiền sẽ không có bản ghi trong bảng `user_wallets` (trước đây ví chỉ được tạo khi người dùng hoàn tất giao dịch nạp tiền đầu tiên). Khi người dùng bấm "Thanh toán ngay" hoặc mua gói credit, hệ thống gọi UseCase tạo đơn hàng và báo lỗi thất bại: `"WALLET_NOT_FOUND: không tìm thấy ví" (404)`. Trải nghiệm người dùng bị gián đoạn nghiêm trọng.

## 2. Giải pháp thực hiện
- **Khởi tạo ví tự động khi đăng ký:**
  - Tích hợp hook `databaseHooks.user.create.after` trong `apps/api/src/auth.ts:183-193`: Ngay khi tài khoản người dùng được tạo thành công, hệ thống tự động tạo một bản ghi `user_wallets` với số dư mặc định là `0`.
- **Cơ chế phòng thủ Get-or-Create:**
  - Trong `wallet.repository.ts`: Viết hàm `getOrCreateWalletInTx(tx, userId)` — nếu ví chưa tồn tại thì tự động tạo mới trong cùng transaction.
  - Cập nhật toàn bộ các UseCase ghi nhận ví (`withdraw`, `refund`, `payForOrder`, `deposit`) sử dụng `getOrCreateWalletInTx` thay vì ném lỗi `WALLET_NOT_FOUND`.
- Người dùng mới mua credit sẽ thấy thông báo số dư không đủ ("Vui lòng nạp tiền vào ví") thay vì gặp lỗi sập hệ thống.

## 3. Bằng chứng mã nguồn & Kiểm thử (Evidence)
- Backend:
  - `apps/api/src/auth.ts:183-193`
  - `apps/api/src/modules/wallet/infrastructure/repositories/wallet.repository.ts`
  - `apps/api/src/modules/wallet/application/wallet.service.ts`
- Test suite: `apps/api/src/shared/infrastructure/tests/phase-10-wallet-auto-create.test.ts` (3/3 pass).
- Báo cáo: `plans/250825-2100-ga02-intake-flow-fix/reports/reviewer-wallet-autocreate.md` (APPROVED).
- Pull Request: https://github.com/NEXUS-FOR-STARTUP/nexus-platform/pull/20.
