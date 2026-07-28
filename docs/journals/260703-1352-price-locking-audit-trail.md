# Price Locking & Audit Trail — Plan gốc (260703-1352)

**Date:** 2026-07-03 13:52
**Severity:** High
**Component:** Case + ServicePackage pricing
**Status:** Planning complete, execution deferred

## What Happened

Plan được tạo để fix root bug: khi admin đổi giá `ServicePackage.price`, các `Case` cũ bị ảnh hưởng ngay lập tức vì không có snapshot giá tại thời điểm tạo. Case đang chờ thanh toán với giá cũ, package đã tăng giá — financial drift, không reconcile được.

## The Brutal Truth

Đây là bug thiết kế từ ngày đầu. `Case.package_id` chỉ là FK, mọi tính toán giá đều qua `JOIN ServicePackage.price` — một live-read. Không ai nghĩ "giá gói có thể thay đổi" khi thiết kế schema đầu tiên. Kết quả: 8 edge cases được phát hiện (E1-E8), từ case unpaid cũ bị charge price mới đến case đã paid không reconstruct được exact price. Mỗi edge case là mỗi kiểu sai sót tài chính tiềm năng.

## Technical Details

**Root schema defect:**
- `Case` model: `package_id String?` — chỉ FK, không lưu giá snapshot
- `ServicePackage.price: Int` — mutable, không có metadata lịch sử thay đổi
- `Payment` amount được tính từ `package.price` tại runtime, không từ locked value

**8 edge cases mapped (E1-E8):**

| Edge Case | Scenario | Impact |
|-----------|----------|--------|
| E1 | Case unpaid, price increased | Bị tính giá mới, thiếu budget |
| E2 | Case unpaid, price decreased | Bị charge thừa, refund phức tạp |
| E3 | Case paid, price then changed | Không reconstruct được giá gốc |
| E4 | Case rejected, re-enter | Giá nào áp dụng? |
| E5 | Package deactivated (is_active=false) | Case vẫn tham chiếu package chết |
| E6 | Bulk price change via admin | Hàng loạt case lệch giá |
| E7 | Case archived, audit sau | Mất dấu vết giá tại thời điểm |
| E8 | Payment partial + price change | Split payment sai tỷ lệ |

**Plan phân 3 phases:**

1. **Schema migration** — Add `Case.locked_price Int?`, `ServicePackage.previous_price Int?`, `ServicePackage.last_price_changed_at DateTime?`, `ServicePackage.last_price_changed_by String?`. Backfill legacy cases với current `package.price` (approximation — không thể reconstruct exact).
2. **Backend fixes** — `CaseService.create()` ghi `locked_price = package.price` lúc tạo. `PaymentService` đọc `Case.locked_price` thay vì `package.price`. Admin set giá update `previous_price` + `last_price_changed_at` + `last_price_changed_by` trên `ServicePackage`.
3. **Frontend fixes** — Display `locked_price ?? package?.price ?? 0` cho case card. Show last-change metadata trên package detail page.

## What We Tried

Plan chỉ dừng ở mức phân tích + thiết kế. Execution không được chạy riêng lẻ. Lý do: ưu tiện chuyển sang work khác, plan bị deferred.

## Root Cause Analysis

**Design oversight:** Pricing domain không được modeled như aggregate root. `Case` không có price value object riêng. `ServicePackage.price` là singleton mutable field — thay đổi ảnh hưởng toàn bộ reference.

**Decision không lịch sử:** Chọn "đơn giản trước" khi MVP, không anticipate business rule "giá gói có thể đổi, case giữ giá cũ". Đây là business invariant rõ nhưng không được capture.

## Key Business Decisions

1. `locked_price` là source of truth per-case cho payable amount. Không live-read `package.price`.
2. Legacy cases backfill với current package price — losses accepted, không thể reconstruct exact historical value.
3. `ServicePackage` chỉ lưu latest-change metadata (previous_price, changed_at, changed_by). Không tạo full price history table — scope quá lớn cho MVP.
4. `locked_price` nullable: legacy case backfill không bắt buộc, case mới luôn có.

## Lessons Learned

- Aggregate root cần snapshot value object cho mọi quantity có thể thay đổi theo thời gian, đặc biệt là giá.
- `package.price` không bao giờ là source of truth cho transaction — chỉ là "current list price".
- FK reference (`package_id`) là reference, không phải data contract cho financial logic.
- Edge case mapping nên làm trước khi migration — E1-E8 phát hiện nhiều thiếu sót không ngờ.
- Plan execution không nên deferred nếu edge case đã mapping đủ — risk tích lũy lãi.

## Impact

Plan gốc (260703-1352) **không bao giờ được execute riêng lẻ**. Tuy nhiên `locked_price` + last-change metadata (`previous_price`, `last_price_changed_at`, `last_price_changed_by`) đã được implement trong migration `20260721_price_locking` (thuộc plan sau, 260703-1422). Schema hiện tại (`prisma/schema.prisma`) đã có đầy đủ các field này.

Journal sau: `2026-07-21-price-locking-audit-trail-complete.md` ghi nhận execution hoàn chỉnh với 4 phases (G0→G1 parallel→G2) — khác với 3 phases trong plan gốc.

## Next Steps

Plan đã được thực thi bởi plan khác (260703-1422) sau này. Archive. Không cần hành động thêm.
