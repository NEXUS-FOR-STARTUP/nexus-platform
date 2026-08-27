# GA-14: Rút tiền thủ công khỏi ví người dùng (Manual Wallet Withdrawal)

- **ID:** GA-14
- **Priority:** P2
- **Category:** Wallet / Financial
- **Status:** Dropped (Đã bỏ theo quyết định quản trị/MVP)
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`

---

## 1. Mô tả vấn đề
Trong `wallet.service.ts:61-91`, logic trừ tiền `withdraw()` và kiểm tra số dư khả dụng đã được xây dựng hoàn chỉnh. Tuy nhiên:
- Tầng Router `wallet.routes.ts` chưa mở endpoint cho người dùng gửi yêu cầu rút tiền về tài khoản ngân hàng.
- Chưa có mô hình bảng lưu trạng thái yêu cầu rút tiền (`withdrawal_requests`: `pending`, `approved`, `rejected`, `completed`) và quy trình Admin phê duyệt/chuyển khoản.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Chốt chính sách (Policy):**
   - Hạn mức rút tối thiểu/tối đa, phí rút tiền (nếu có), thời gian xử lý (trong 24-48h làm việc).
2. **Database & API:**
   - Tạo model `WithdrawalRequest` (lưu số tiền, thông tin ngân hàng, số tài khoản, tên chủ tài khoản, trạng thái, lý do từ chối).
   - User Endpoint: `POST /api/wallet/withdrawals` (tạo yêu cầu rút $\rightarrow$ trừ số dư khả dụng và đưa vào số dư đóng băng `frozen_balance`).
   - Admin Endpoints: `GET /api/admin/withdrawals`, `POST /api/admin/withdrawals/:id/approve`, `POST /api/admin/withdrawals/:id/reject`.
3. **Frontend UI:**
   - Modal "Rút tiền về tài khoản ngân hàng" trong trang `/dashboard/wallet`.
   - Bảng quản trị phê duyệt rút tiền trong `/dashboard/admin/withdrawals`.
