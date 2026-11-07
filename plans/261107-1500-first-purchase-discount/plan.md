---
title: "Giá 49,000 VND + mã giảm 40% tự phát sau lần mua đầu"
description: "Đổi 3 gói chấm sang 49,000 VND / 1 lượt; sau đơn thanh toán đầu của mỗi (user, dự án, dịch vụ), hệ thống tự phát mã giảm 40% dùng 1 lần và gửi in-app + email."
status: in-progress
priority: P1
effort: ~14h (ước lượng, chưa đo)
branch: dev
tags: [feature, backend, frontend, database, api, notifications]
blockedBy: []
blocks: []
created: 2026-11-07
mode: hard
---

# Giá 49,000 VND + mã giảm 40% tự phát sau lần mua đầu

## Overview

Mục tiêu kinh doanh: tối đa số đơn (KPI 20 đơn). Lượt đầu giá thấp (49,000 VND), lượt sau giảm 40% còn 29,400 VND bằng mã cá nhân tự phát. Dùng cơ chế `DiscountCode` có sẵn, không thêm loại gói hay giá theo bậc.

Đã làm (chưa commit): listener phát mã, ràng buộc owner/case/dịch vụ, migration 2 cột, thông báo `discount.granted`, seed 49k (chưa chạy). Kết quả scout 2026-11-07 cho thấy còn thiếu: chạy seed, giới hạn 1 lượt, chặn đơn mua hộ, giao diện hiển thị mã, admin, cấu hình email, kiểm thử end-to-end.

## Hiện trạng (scout 2026-11-07)

| Hạng mục | Trạng thái |
|---|---|
| Listener `first-purchase-discount.listener.ts`, đăng ký `index.ts:212-214` | Xong |
| Ràng buộc mã theo user + case + dịch vụ | Xong, có test |
| Migration `20261107120000_discount_code_owner` | Local đã chạy; prod chưa |
| Thông báo `discount.granted` (in-app + email) | Nối đủ, chưa gửi thật |
| Seed 49k / 1 lượt | Sửa file, DB local vẫn 79,000 / 2 lượt |
| Mã giảm cho cả N gói | Lỗi nghiệp vụ |
| Đơn mua hộ phát mã | Lỗi |
| UI hiển thị mã trên billing tab | Thiếu |

## Cross-Plan Dependencies

Không có plan chưa xong nào chặn hoặc bị chặn. `261024-2300-cp3-audit-cp2-rubric` và `261016-1530-grant-wallet-funds-pay-later` đã `completed`. Phase 3 dùng cờ `funded` của luồng pay-later đã xong.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Giá 49,000 VND và sửa copy](./phase-01-pricing-seed-and-copy.md) | Pending |
| 2 | [Giảm giá chỉ cho 1 lượt](./phase-02-single-unit-discount.md) | Pending |
| 3 | [Chặn đơn mua hộ phát mã](./phase-03-block-funded-orders.md) | Pending |
| 4 | [Giao diện hiển thị và áp mã](./phase-04-code-ui-surface.md) | Pending |
| 5 | [Trang admin mã giảm giá](./phase-05-admin-discount-list.md) | Pending |
| 6 | [Email, cấu hình, loại thông báo](./phase-06-email-config-types.md) | Pending |
| 7 | [Kiểm thử và triển khai](./phase-07-verify-and-rollout.md) | Pending |

Thứ tự: 2 và 3 độc lập; 4 cần xong 2 (giá hiển thị 1 lượt); 5 và 6 độc lập; 7 sau cùng. Phase 1 chạy được bất cứ lúc nào nhưng seed local chỉ chạy sau khi chốt câu hỏi DB (Q4).

## Quyết định đã chốt

- Mục tiêu tối đa số đơn, không cần hòa vốn; tách dịch vụ thành nhiều đơn là chấp nhận được.
- Lượt đầu 49,000 VND; mã 40% cho lượt tiếp: `Math.round(49000*60/100) = 29,400`.
- Mã 8 ký tự `[0-9A-HJKMNP-TV-Z]`, ngẫu nhiên thật, không dấu gạch, không tiền tố, không hạn dùng.
- Mỗi mã gắn đúng 1 user + 1 dự án + 1 dịch vụ, dùng 1 lần. Mua lượt đầu mới được tặng.
- Email/thông báo dẫn link `?tab=billing&code=<CODE>` tự áp mã (kiểu Shopify).
- Phát mã ở listener `ORDER_PAID`, ngoài transaction tạo đơn.

## Câu hỏi đã chốt (2026-11-07)

1. Gói áp dụng: cả 3 chặng.
2. Mua N gói cùng mã: tách dòng, 1 gói giảm, N−1 gói giá gốc.
3. Đơn đầu dùng mã admin: không được tặng mã 40%.
4. Smoke test trên DB local hiện tại. Rủi ro: nghi là bản restore prod và `.env` có Resend key thật, nên phải tắt gửi mail thật (bỏ `RESEND_API_KEY` khi chạy) hoặc xác nhận không có email người thật trong `users` trước khi tạo đơn. Không chạy `migrate dev/reset`, `db push`.
5. Preset nạp ví 79,000: giữ nguyên, không đụng `wallet-topup.constants.ts`.

## Dependencies

- Migration phải chạy trên VPS trước khi deploy API.
- Seed chạy tay sau deploy (không nằm trong migration).
- `BETTER_AUTH_SECRET` không còn cần cho tên mã (mã ngẫu nhiên thật).
- Quy tắc DB: `.agents/rules/prisma-migration-safety.md`. Cấm `migrate dev/reset`, `db push`, `DROP`, `DELETE FROM`, `TRUNCATE`.
- Chỉ chạy test của phần đã đổi; không chạy cả bộ API.

## Cập nhật 2026-11-07 (sau nghiên cứu đổi giá vs đơn cũ)

Quyết định: không tặng bù cho khách còn lượt cũ (hầu hết là dữ liệu test); chênh đơn giá/lượt giữa đơn cũ và mới, và hoàn lượt theo snapshot, không xử lý. Báo cáo: `plans/reports/research-261107-package-price-change-vs-existing-orders.md`.

Đã làm:
- Lịch sử giá: `applyPackagePrice` (`apps/api/src/modules/packages/application/package-price-history.ts`) là nơi duy nhất đổi giá. Ghi `service_pricing` (dòng gốc + dòng hiện tại), đồng bộ cột `service_packages.price`. Dùng bởi seed, `PUT /admin/packages/:id/price` và `POST /admin/packages/:id/pricing`. Trước đó hai route admin ghi hai nơi khác nhau, và giá tính tiền ưu tiên `service_pricing`, nên chỉ sửa cột sẽ bị bỏ qua khi bảng có dòng. Test: `package-price-history.test.ts`.
- Đồng bộ tài liệu: `money-credit-completion-model-note.md`, `design-system/wording/ux-context.md` và 6 file `pages/*.md` ghi 49,000 VND. Các journal, báo cáo có ngày và mockup mẫu giữ nguyên (lịch sử/dữ liệu mẫu).
- Đồng bộ test: `phase-03-discount-codes.test.ts` (giá 49,000, 1 lượt), `phase-04-packages.test.ts` (fixture).

Phase 1 còn lại: chạy seed (sẽ ghi dòng lịch sử 79,000 → 49,000) và sửa copy UI (FAQ, PackageSelectionModal, "credit").

## Trạng thái triển khai (2026-11-07)

Code P1–P6 xong; P7 đã chạy test từng file (first-purchase 7/7, phase-03 14/14, package-price-history 3/3), `tsc` api + web-1 sạch, seed lên DB local (3 gói 49,000/1 lượt, có dòng lịch sử 79,000 → 49,000).
Rút gọn có chủ ý: P4 là banner tĩnh đọc `?code=` (không gọi API tra gói); không sửa chuông thông báo; P5 chỉ ẩn mã cá nhân khỏi danh sách admin (không có bộ lọc xem lại). Chưa smoke đầu-cuối trên trình duyệt; chưa deploy VPS.
