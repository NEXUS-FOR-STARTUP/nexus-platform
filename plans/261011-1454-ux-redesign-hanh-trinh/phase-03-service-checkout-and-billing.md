# Phase 3 — Service checkout and billing tab

## Context Links
- [plan.md](./plan.md), [phase-01](./phase-01-stage-api-foundation.md)
- Thiết kế: `docs/ux-redesign/03-cham-bai-va-mua-luot.svg`, `04-luot-cham-va-thanh-toan.svg`
- `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx`, `Cp2PackageCard.tsx`, `CreditPanel.tsx`, `CreditBalanceCard.tsx`, `CreditTransactionHistory.tsx`, `credit-history.types.ts`
- `apps/web-1/lib/credit-balances.ts`, `lib/pricing.ts`, `lib/usePackagePrice.ts`
- `apps/web-1/app/dashboard/case/[id]/_components/use-shortage-deposit-redirect.ts`, `app/dashboard/payment/hooks/use-fulfill-credit-after-deposit.ts`

## Overview
- Priority: P1.
- Status: Pending.
- Một hộp mua theo dịch vụ, một tab quản lý lượt. Xóa các đường mua cũ.

## Key Insights
- `CreditQuantityModal` đoán loại gói bằng `price === 79000` và ép gói của case khi case đã trả tiền → không mua đúng gói Thị trường từ tab Credits được.
- Gói Thị trường bị khóa số lượng 1 do cùng mẹo đoán giá.
- `credit-balances.ts` viết cứng `cp1_audit | cp2_audit`.
- Luồng thiếu tiền → nạp ví → tự mua tiếp (`credit-after-deposit-intent`) dùng được, giữ nguyên.

## Requirements
1. `ServiceCheckoutModal({ serviceCode, onPurchased })`:
   - Gói lấy từ `GET /packages` lọc theo `service_type.code`.
   - Chọn số gói 1–50 cho mọi gói.
   - Mã giảm giá (`DiscountCodeInput` dùng lại). Đổi gói → reset mã đã áp.
   - Hiện số dư ví và phần còn thiếu. Nút "Thanh toán X VND bằng ví" hoặc "Nạp X VND & mua".
   - Idempotency key tạo **một lần mỗi phiên mua** (`useRef`), tạo lại sau khi mua xong hoặc đóng hộp. `409 ORDER_ALREADY_PAID` coi là thành công: refetch case + ví.
   - Catalog của dịch vụ rỗng → empty state "Chưa mở bán", không có nút mua.
2. Tab "Lượt chấm & thanh toán":
   - Thẻ ví (số dư, Nạp tiền, link lịch sử ví).
   - Bảng lượt theo giai đoạn, đọc từ `STAGES` + `credit_balances`. Giai đoạn `available: false` hiện "Sắp ra mắt".
   - Dòng có `available: true` và có gói đang bán mới có "Mua thêm" → `ServiceCheckoutModal`.
   - Lịch sử có chip lọc theo giai đoạn (`service_type_code`).
3. Mua không còn bị khóa theo `completed` ở UI. API cùng phase:
   - `create-order.usecase.ts:205-213`: bỏ `T19_REOPEN` (đang đẩy case `done` về `supporter_working` + SLA, phá việc đóng băng supporter).
   - Case `internal_status = 'cancelled'` → `409 CASE_CLOSED` trước khi trừ ví.
   - Test cho cả hai.
4. Tiền hiển thị theo quy ước `79,000 VND`.
5. Mobile: bảng chuyển thành thẻ (`md:hidden` / `hidden md:block`), hộp mua `fullScreen` dưới `md`.
6. `manual_trigger: true` ép trong hook đặt đơn dùng chung (`usePlaceServiceOrder` và `use-fulfill-credit-after-deposit.ts`), không chỉ trong modal. Intent cũ trong `sessionStorage` mang `manualTrigger:false` vẫn không tự chấm.

## Architecture
- `useServiceCatalog()`: TanStack Query `GET /packages`, nhóm theo `service_type.code`, `staleTime` theo hằng số cấu hình.
- `lib/credit-balances.ts` đổi thành `CreditBalances = Record<string, number>` và `formatStageBalance(stage, balances)`. Xóa `totalCredits` và chuỗi "CP1 · CP2".
- Intent sau nạp tiền (`app/dashboard/payment/credit-after-deposit-intent.ts`, `sessionStorage`): reader thêm `serviceCode?` optional; thiếu thì suy từ catalog qua `packageId`.
- Ghi chú thống kê: mua lượt Thị trường không đổi `package_id` (`create-order.usecase.ts:194-195`). Khi mọi case mới là `pkg_tf_free`, số liệu admin "đã trả phí" chỉ còn nghĩa "đã mua Ý tưởng" → phase 7 ghi vào docs admin, hoặc đổi stat sang đếm theo order (việc riêng).

## Related Code Files
Tạo:
- `apps/web-1/app/dashboard/case/[id]/_components/billing/ServiceCheckoutModal.tsx`
- `.../billing/BillingTab.tsx`, `StageBalanceTable.tsx`, `WalletSummaryCard.tsx`
- `apps/web-1/hooks/useServiceCatalog.ts`

Sửa: `CreditTransactionHistory.tsx` (lọc theo giai đoạn), `credit-history.types.ts`, `lib/credit-balances.ts`, `CaseCard.tsx`, `use-shortage-deposit-redirect.ts`, `credit-after-deposit-intent.ts`, `use-fulfill-credit-after-deposit.ts`, `lib/usePackagePrice.ts` (hoặc xóa nếu hết người dùng).

Xóa ở phase 7 (sau khi `NEXT_PUBLIC_JOURNEY_WORKSPACE=true` ổn định trên prod; trang cũ còn dùng tới lúc đó): `CreditQuantityModal.tsx`, `Cp2PackageCard.tsx`, `CreditPanel.tsx`, `CreditBalanceCard.tsx`.

## Implementation Steps
1. `useServiceCatalog` + kiểu `ServicePackageDto` từ phase 1.
2. `ServiceCheckoutModal`: tách logic đặt đơn hiện có trong `CreditQuantityModal` sang hook `usePlaceServiceOrder` (idempotency key, 402 → nạp ví), bỏ `isAiAudit` và ép gói.
3. Tab thanh toán mới.
4. Đổi `credit-balances.ts`, `CaseCard`.
5. Thử luồng: ví đủ tiền; ví thiếu → nạp → tự mua; mã giảm giá 100%.

## Todo List
- [ ] `useServiceCatalog`
- [ ] `usePlaceServiceOrder` + `ServiceCheckoutModal`
- [ ] Tab "Lượt chấm & thanh toán"
- [ ] Lịch sử lọc theo giai đoạn
- [ ] Xóa modal/card cũ khi hết người gọi
- [ ] Kiểm tra mobile

## Success Criteria
- Mua gói Thị trường từ cả trang giai đoạn và tab thanh toán; ledger ghi `cp2_audit`.
- Không còn chỗ nào trong web-1 so sánh `price === 79000` hoặc viết cứng `cp1_audit`/`cp2_audit` ngoài `STAGES`.
