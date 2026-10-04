# GA-18: Dọn dẹp mã nguồn cũ và Models không sử dụng (Cleanup Deprecated & Dead Code)

- **ID:** GA-18
- **Priority:** P2
- **Category:** Infrastructure / Refactoring
- **Status:** Partially Implemented
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`

---

## 1. Mô tả vấn đề
1. **Prisma Models cũ:**
   - `schema.prisma` vẫn còn 2 model đánh dấu `@deprecated`: `WalletTopup` (dòng 218) và `Payment` (dòng 496) sau khi hệ thống chuyển sang domain `Deposit` và `Order`.
   - Các route cũ đã trả về `410 Gone` nhưng các use case/repository liên quan chưa được gỡ bỏ hoàn toàn.
2. **Dead code Frontend:**
   - Trang `apps/web-1/app/dashboard/payments/page.tsx` chỉ thực hiện redirect sang `/dashboard/wallet`.
   - Các hook/component cũ như `useMyPayments` và `PaymentHistoryList` không còn component nào import.
3. **Env Fail-fast:**
   - `RESEND_API_KEY` đang kiểm tra `requiredEnv()` cứng ngay khi import file `auth.ts`, gây cản trở môi trường chạy test hoặc dev local khi không cần gửi email thật.

## 2. Yêu cầu triển khai (Acceptance Criteria)
1. **Frontend Cleanup:**
   - Xóa bỏ hoàn toàn thư mục route `apps/web-1/app/dashboard/payments/` và các component mồ côi (`useMyPayments`, `PaymentHistoryList`).
2. **Backend & Schema Cleanup:**
   - Lập kế hoạch migration contract (theo quy trình `prisma-migration-safety.md`) để archive và loại bỏ 2 bảng deprecated khi database production đã hoàn tất đối soát.
   - Chuyển `RESEND_API_KEY` sang kiểm tra linh hoạt hơn (cho phép mock/in-memory provider trong môi trường test).
