# Journal: Pending deposit UX Implementation Complete

**Date**: 2026-09-02  
**Status**: Completed  
**Plan**: `plans/260901-2254-remove-deposit-stuck-banner/`

## 1. Summary of Changes

Đã triển khai thành công 3 phase giải quyết triệt để vấn đề hiểu nhầm "mới mở QR = chờ xác minh":

1. **Phase 1 (Unmount banner)**:
   - Gỡ `DepositStuckBanner` khỏi `apps/web-1/app/dashboard/wallet/page.tsx`.
   - Xóa file `DepositHistory.tsx`.
   - Giữ nguyên `useMyDeposits` hook cho Phase 3.

2. **Phase 2 (Admin queue & Backend verify guard)**:
   - Thêm helper `canAdminCreditDeposit` trong `apps/api/src/modules/deposits/domain/deposit.types.ts`.
   - Thêm guard `PROOF_REQUIRED` (400) trong `verifyDepositUseCase` ngăn admin duyệt nạp tiền nếu chưa có ảnh minh chứng (trừ trường hợp `amount_mismatch`).
   - Cập nhật `apps/web-1/app/admin/page.tsx`: filter và badge "Chờ xác minh" chỉ đếm các yêu cầu `status === "pending"` có `proof_file_url`.
   - Viết test `verify-deposit-proof-guard.test.ts` (100% pass).

3. **Phase 3 (Student proof table & API proof filter)**:
   - Cập nhật `DepositHistoryItem` DTO và mapping trong `list-deposits.usecase.ts` thêm `proof_file_url`.
   - Cập nhật `deposit.repository.ts` (`findDepositsByUser` & `countDepositsByUser`): lọc `proof_file_url: { not: null }`.
   - Cập nhật `WalletDeposit` interface trong `useWallet.ts`.
   - Tạo component `WalletProofTable.tsx` chuẩn Mantine UI v9 (5 cột: Ngày tạo, Số tiền, Ảnh minh chứng, Trạng thái, Menu Xem chi tiết).
   - Tích hợp Mantine `Tabs` trên `apps/web-1/app/dashboard/wallet/page.tsx` (Tab 1: Lịch sử giao dịch, Tab 2: Ảnh minh chứng).

## 2. Invariants & Safety

- Không thay đổi Prisma schema, không cần database migration.
- Clean Architecture được bảo đảm qua domain helper và use case guard.
- Typecheck `npm run check-types` thành công trên toàn bộ monorepo.
- Code review đạt điểm 10/10 PASS (0 issues).
