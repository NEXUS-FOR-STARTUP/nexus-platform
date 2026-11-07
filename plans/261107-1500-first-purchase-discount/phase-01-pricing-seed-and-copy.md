# Phase 1: Giá 49,000 VND và sửa copy

## Context Links
- [plan.md](./plan.md)
- `prisma/seeds/seed-active-packages.ts` (đã sửa file, chưa chạy)
- Giá đọc từ `service_packages.price`; `service_pricing` 0 dòng nên không có override (`package-dto.ts:7-9`, `credit-audit-order.helpers.ts:54`).

## Overview
- Priority: P1 (chặn: UI chưa đổi vì seed chưa chạy)
- Status: Pending
- Chạy seed + sửa copy sai khi chỉ còn 1 lượt.

## Key Insights
- Không hardcode 79000 hay "2 lượt" trong web/API; giá và lượt đều động. Chỉ cần seed + vài câu copy.
- `features` JSON trong seed cũng được hiển thị (landing, checkout); phải seed lại thì bullet cũ mới mất.
- Giá hiển thị: `formatPrice` → `49,000 VND`.

## Requirements
- 3 gói `pkg_ai_audit`, `pkg_cp2_audit`, `pkg_cp3_audit`: price 49000, credits_granted 1.
- UI không còn câu nói "nhiều lượt", "lượt 1 / lượt tiếp theo" theo kiểu gói 2 lượt.
- UI không dùng chữ "credit" (dùng "lượt"); không hiện CP1–CP4/PITCH.

## Architecture
Seed dùng upsert theo id; ghi đè price, credits_granted, features. Không đụng bảng khác.

## Related Code Files
Modify:
- `apps/web-1/components/landing/FAQSection.tsx:26`: một gói = 1 lượt; lượt sau mua thêm, có mã giảm 40%.
- `apps/web-1/app/dashboard/_components/PackageSelectionModal.tsx:57`: bỏ "nhiều lượt…".
- `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx:388`: "credit" → "lượt".
- `apps/web-1/app/dashboard/case/[id]/_components/TabDiscussionChat.tsx:362,424`: "credit" → "lượt".
- `apps/web-1/app/dashboard/case/[id]/_components/Cp2PackageCard.tsx:25-26`: bỏ dòng "/lượt" thừa khi 1 lượt.
- `docs/technical-notes/money-credit-completion-model-note.md`, `design-system/wording/`: cập nhật giá/lượt (cần đọc xác minh).
Optional: `apps/api/src/shared/infrastructure/tests/phase-03-discount-codes.test.ts:23-24` (fixture 79000/4).
Không đổi: `ServiceCheckoutModal`, `CreditActions`, `LandingPricing` (động); test fixture refund 79000/2 (mô hình đơn cũ); `pkg_supporter_audit` (inactive).

## Implementation Steps
1. Đọc `apps/web-1/AGENTS.md` và `design-system/wording/`.
2. Sửa các câu copy ở trên (tiếng Việt, không CP-label).
3. Chạy seed local sau khi chốt Q4: `npx tsx prisma/seeds/seed-active-packages.ts` (DB sạch ở Phase 7, hoặc DB hiện tại nếu user cho phép).
4. SELECT xác minh: `select id, price, credits_granted from service_packages where id in (...)` → 49000 / 1.
5. Mở landing, modal chọn gói, billing tab: thấy `49,000 VND`, "1 lượt".

## Todo List
- [ ] Sửa copy 6 chỗ
- [ ] Cập nhật docs/wording
- [ ] Seed local + SELECT xác minh
- [ ] Kiểm UI 3 màn

## Success Criteria
- DB: 3 gói 49000 / 1.
- UI hiển thị `49,000 VND`, "1 lượt chấm", không còn "~15.000đ/bạn", "2 lượt", "credit".
- `tsc --noEmit` web-1 sạch.

## Risk Assessment
- Seed ghi đè giá trên DB có dữ liệu thật: chỉ ảnh hưởng giá đơn mới; đơn cũ giữ `unit_price` đã lưu.
- Trang pricing có thể cache (ISR): kiểm sau seed.

## Security Considerations
Không có. Seed không chứa bí mật.

## Next Steps
Phase 7 chạy seed trên VPS.
