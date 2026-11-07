# Phase 4: Giao diện hiển thị và áp mã

## Context Links
- [plan.md](./plan.md)
- Đọc trước: `apps/web-1/AGENTS.md`, `design-system/wording/`
- `apps/web-1/app/dashboard/case/[id]/_components/DiscountCodeInput.tsx`
- `.../billing/StageBalanceCards.tsx:36-60`, `.../billing/BillingTab.tsx` (chưa mở, vị trí suy ra)
- `apps/web-1/components/NotificationBell.tsx:20-23,70-90` (đường dẫn cần xác minh)
- `.../JourneyWorkspaceShell.tsx:45,56-57,65,151-157`

## Overview
- Priority: P1
- Status: Pending
- Khách bấm link `?tab=billing&code=XXX` chỉ thấy tab billing, không có thông báo mã; mã chỉ áp khi họ tự mở modal "Mua thêm" đúng chặng.

## Key Insights
- `DiscountCodeInput` chỉ mount trong `ServiceCheckoutModal` và `CreditQuantityModal`.
- Lỗi áp mã bị nuốt (`onError: reset`); guard `triedLinkCode` đặt trước khi `packageId` có thể rỗng.
- Chuông cắt nội dung 2 dòng → mất mã.
- Click tab sidebar làm rơi `code` (`router.push(?tab=billing)`).
- Quy ước repo: Mantine v9, Phosphor icons, không `try/catch` trong component, không gọi `apiClient` trực tiếp, tiền `49,000 VND` qua `formatPrice`, không CP-label, không shadow trên Card/Paper.

## Requirements
- Có `?code=` hợp lệ: billing tab hiện banner "Bạn có mã giảm 40% cho gói <tên chặng>" + nút mở modal mua đúng chặng với mã đã áp. Hiện giá 29,400 VND.
- Mã sai chặng/sai user/đã dùng: banner báo rõ lý do ngắn, không im lặng.
- Chuông hiện đủ mã hoặc có nút sao chép.
- Hook tra mã nằm trong layer hook, không trong component.

## Architecture
Hook mới `useCodeFromLink` (đọc `code`, gọi `useCheckDiscountCode`, trả trạng thái + gói khớp). Cần tra mã → `package_id`: mở rộng `/orders/discount-check` để nhận `case_id` không cần `package_id`, hoặc API trả `service_type`/`package_id` của mã (cần thiết kế, ưu tiên trả thêm trường trong kết quả check). Banner là component nhỏ ≤200 dòng trong `billing/`.

## Related Code Files
Create: `.../billing/DiscountCodeBanner.tsx`, hook `use-code-from-link.ts`.
Modify: `BillingTab.tsx`, `StageBalanceCards.tsx` (mở modal theo chặng), `DiscountCodeInput.tsx` (hiện lỗi, guard chờ packageId), `NotificationBell.tsx` (hiện đầy đủ/ sao chép), `JourneyWorkspaceShell.tsx` (giữ `code` nếu cần), API `check-discount-code.usecase.ts` + `packages/validation/src/discount.ts`.

## Implementation Steps
1. Đọc `BillingTab`, `StageBalanceCards`, `NotificationBell`.
2. Mở rộng check API trả gói/chặng khớp mã; cập nhật schema + build validation.
3. Viết hook và banner; nối vào `BillingTab`.
4. Mở modal đúng chặng khi bấm nút banner, mã đã áp.
5. Sửa `DiscountCodeInput` (lỗi hiển thị, guard).
6. Sửa chuông.
7. Duyệt trong trình duyệt: 390px và 1440px; kiểm thị giác bằng screenshot.

## Todo List
- [ ] Mở rộng API check
- [ ] Hook + banner
- [ ] Nối BillingTab/StageBalanceCards
- [ ] Hiển thị lỗi áp mã
- [ ] Sửa chuông
- [ ] Duyệt UI hai kích thước

## Success Criteria
- Click link từ thông báo → thấy banner + giá 29,400 VND; bấm nút → modal đúng chặng có mã.
- Mã sai → thông báo lỗi rõ.
- `tsc --noEmit` web-1 sạch; screenshot xác nhận.

## Risk Assessment
- Đổi hợp đồng `/orders/discount-check`: tương thích ngược (trường thêm, `package_id` giữ).
- Workspace sinh viên phải chạy ở 390px; Admin chỉ desktop.

## Security Considerations
Endpoint check vẫn giới hạn tần suất; lỗi không tiết lộ mã có tồn tại hay không (cùng thông báo).

## Next Steps
Phase 7 smoke bằng trình duyệt.
