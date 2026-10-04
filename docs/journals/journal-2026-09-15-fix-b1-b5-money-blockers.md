# Fix Financial & Order Blockers: B1 to B5

**Date**: 2026-09-15 17:00  
**Status**: Resolved  
**Scope**: Backend Financial Domain, Wallet Service, Order Processing  
**Plan**: `plans/260915-1700-fix-b1-b5-blockers/plan.md`  

---

## 1. What Happened

Báo cáo phân tích ma trận tài chính (Money Matrix) chỉ ra 4 lỗ hổng nghiêm trọng (blockers B1 đến B5) đe dọa tính toàn vẹn số dư ví và trạng thái đơn hàng của người dùng trong quá trình thanh toán và hoàn tiền:
- **B1**: Hàm trừ tiền ví (`walletService.withdraw`) không hỗ trợ nhận database transaction môi trường ngoài (`ambient tx`), khiến việc thanh toán đơn hàng không đạt tính nguyên tử tuyệt đối.
- **B2**: Cơ chế hoàn tiền có nguy cơ hoàn lặp (double-refund) do phân mảnh namespace idempotency key.
- **B3**: Xung đột trừ credit trùng lặp giữa chuyển trạng thái T11 và hàm thanh toán đơn hàng.
- **B4/B5**: Khi webhook SePay gửi lại thông tin của đơn hàng đã thanh toán thành công, database ném lỗi vi phạm unique index (P2002) làm crash handler thay vì trả về mã HTTP 409 hoặc bỏ qua an toàn.

## 2. Technical Decisions

1. **Hỗ trợ Transaction Ambient cho Wallet Service (B1)**:
   - Mở rộng hàm `withdraw` và `deposit` chấp nhận tham số `tx?: Prisma.TransactionClient`.
   - Nếu có `tx` được truyền vào, thao tác số dư chạy trực tiếp trên transaction đó, đảm bảo toàn bộ nghiệp vụ tạo đơn và trừ ví cùng commit hoặc cùng rollback.
2. **Hợp nhất Refund Key Namespace & `refundAll` (B2)**:
   - Gộp namespace idempotency của lệnh hoàn tiền, xử lý toàn bộ các khoản cần hoàn trong 1 lời gọi duy nhất chống duplicate.
3. **Loại bỏ Thao tác Trừ Trùng lặp (B3)**:
   - Rà soát luồng chuyển trạng thái case T11, xóa bỏ lời gọi `subtractCredit` dư thừa, tập trung quyền trừ credit vào use-case nghiệp vụ chính thức.
4. **Bắt Lỗi P2002 và Trả về HTTP 409 Xác thực (B4/B5)**:
   - Tại handler xử lý thanh toán đơn hàng, bắt lỗi Prisma P2002 khi đơn đã ở trạng thái `paid`, trả về HTTP 409 Conflict một cách êm thuận, ngăn chặn việc xử lý lặp lại giao dịch ngân hàng.

## 3. Key Changes

- `apps/api/src/modules/wallet/application/wallet.service.ts`: Cập nhật signature `withdraw` nhận `tx client`.
- `apps/api/src/modules/orders/application/process-order-payment.usecase.ts`: Bọc thanh toán và trừ ví vào 1 transaction duy nhất; xử lý lỗi P2002 idempotent.
- `apps/api/src/modules/cases/domain/case-transition.service.ts`: Dọn sạch logic trừ credit thừa ở bước T11.

## 4. Verification

- Kiểm thử nạp tiền và thanh toán đơn hàng với tài khoản không đủ số dư: số dư không bị âm và không có đơn hàng ma nào được tạo.
- Giả lập SePay bắn webhook trùng lặp 3 lần liên tiếp: hệ thống xử lý giao dịch đầu tiên thành công, 2 lần sau trả về idempotent 409 an toàn, không nhân đôi số dư.
- Toàn bộ suite kiểm thử tài chính đạt 100% pass, `bun run check-types` đạt 3/3 workspace.
