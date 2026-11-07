# Phase 08 — Quản lý mã giảm giá 2 phía + flow dùng mã hoàn chỉnh

Trạng thái: **đã làm** (2026-11-07). Khác kế hoạch: mã tự phát có hạn 30 ngày (`FIRST_PURCHASE_DISCOUNT_VALID_DAYS`); admin tạo mã mặc định hạn 30 ngày (bỏ trống = không hết hạn); list admin gộp `summary` vào cùng response `GET /admin/discount-codes` (không có endpoint summary riêng, không phân trang, cắt ở 2000 mã mới nhất). Hệ quả: mã hết hạn thì không được tặng lại (khoá unique user+dự án+dịch vụ) — admin tạo mã tay nếu cần.

## Hiện trạng (đã scout)
| Chỗ | Hiện có | Lỗ hổng |
|---|---|---|
| User list | `MyDiscountCodes` + `GET /orders/my-discount-codes` | Không refetch sau khi mua → trạng thái kẹt "available". Không hiện giá sau giảm |
| Nút Dùng mã | mở `ServiceCheckoutModal` với `initialCode` | `DiscountCodeInput` tự áp qua `/orders/discount-check` nhưng **nuốt lỗi** (`onError: reset`); đổi gói thì mất mã, không áp lại |
| Đặt đơn | `usePlaceServiceOrder` gửi `discount_code`; server tách dòng (đã test) | Không invalidate `my-discount-codes`; không có test e2e UI→API |
| Admin | `AdminDiscountCodes` (bật/tắt, form tạo) | `listDiscountCodes` lọc `owner_user_id: null` → **không thấy mã tự phát**; không có tổng quan, lọc, chủ mã |

## Việc làm

### A. Flow dùng mã (user)
1. `usePlaceServiceOrder.onSuccess`: invalidate `["my-discount-codes", caseId]`.
2. `DiscountCodeInput`: prop `initialCode` → áp ngay, **hiện lỗi** (không `reset`); chỉ link `?code=` mới im lặng. Đổi gói → áp lại mã đang có thay vì `setDiscount(null)`.
3. `MyDiscountCodes`: mỗi dòng thêm giá gốc → giá sau giảm cho 1 lượt (data từ `/packages`, không gọi thêm API); nhãn trạng thái dùng Badge; sắp xếp: available trước.
4. Smoke e2e trên DB local (Resend key giả): user mua lần 1 → mã phát → bấm Dùng mã → modal hiện 29,400 → mua → mã `used`, ví trừ đúng, ledger đúng.

### B. Admin tổng quan
1. API: `GET /admin/discount-codes?scope=all|shared|personal&status=active|used|expired|disabled&page=&limit=` (mặc định phân trang 50). Bỏ filter `owner_user_id: null` cho admin; trả thêm `owner_user_id`, `owner_email`, `case_id`, `status` (suy ra như `MyDiscountCodeStatus` + `disabled`).
2. API: `GET /admin/discount-codes/summary` → đếm theo trạng thái + tỉ lệ dùng mã tự phát (phát / dùng) — số liệu cho KPI 20 đơn.
3. `AdminDiscountCode` (validation) thêm trường mới; `owner_email` lấy bằng 1 query `user.findMany({ id in })` (không có relation Prisma, **không đổi schema**).
4. UI `AdminDiscountCodes`: thẻ tổng quan (tổng / đang hiệu lực / đã dùng / hết hạn / tắt), tab Chung | Tự phát, lọc trạng thái, cột chủ mã + dự án, giữ nút bật/tắt (thu hồi mã tự phát = tắt).
5. File ≤200 dòng: tách `DiscountCodeSummary.tsx`, `DiscountCodeTable.tsx`.

### C. Kiểm chứng
- Test API: list scope/status, summary, user không thấy mã người khác, check→order dùng mã tự phát.
- `tsc` api + web-1; test file đã đổi; smoke trình duyệt.
- Cập nhật `plan.md` + wording `design-system/wording/`.

## Không làm (YAGNI)
Hạn dùng/nhắc hết hạn mã tự phát, tạo hàng loạt, export, đổi schema.

## Câu hỏi mở
- Thu hồi mã tự phát = tắt `is_active` có đủ không, hay cần nhãn riêng "đã thu hồi"? (mặc định: tắt là đủ)
