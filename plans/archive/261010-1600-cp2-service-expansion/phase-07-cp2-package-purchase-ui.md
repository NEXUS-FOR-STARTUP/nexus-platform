# Phase 7 — CP2 package purchase UI

## Context
- `apps/web-1/app/dashboard/payment/hooks/useCreateCreditOrder.ts:18-33`, `CreditQuantityModal.tsx:39,54-57`
- Chuỗi thiếu tiền: `use-shortage-deposit-redirect`, `use-fulfill-credit-after-deposit`, `credit-after-deposit-intent`
- Số dư: `types/case.ts:20-21`, `useCaseDetails.ts:112-113`, `case/[id]/page.tsx:85-95`, `CaseCard.tsx:34,68`
- Public `GET /api/packages`

## Overview
Priority P1. Phụ thuộc phase 2, 3.

## Requirements
- Hook mua theo `package_id` (thay `service_type: "credit_audit"`), cả CP1 và CP2. Chuỗi nạp thiếu -> quay lại mua giữ `package_id` + `discount_code`.
- Hiển thị lượt theo dịch vụ từ `credit_balances`: "CP1: n lượt · CP2: m lượt". Thay mọi chỗ dùng `credit_balance`; sau đó xóa `credit_balance` khỏi API (cutover phase 2).
- Thẻ gói CP2 trong panel Readiness/CTA khi hết lượt: tên, 79.000đ, "4 lượt chấm: bảng hỏi phỏng vấn hoặc toàn bộ CP2", chia nhỏ "chưa tới 20.000đ/lượt". Không cam kết điểm số.
- Ô nhập mã giảm giá (phase 3) trong modal mua.
- Copy tiếng Việt theo `design-system/wording/`; VND format theo AGENTS web-1.

## Steps
1. Hook theo package + intent nạp tiền mang package/mã.
2. Thay hiển thị số dư.
3. Thẻ gói CP2 + modal.
4. Xóa `credit_balance` khỏi API + type sau khi web không còn dùng.

## Todo
- [ ] Hook
- [ ] Số dư theo dịch vụ
- [ ] Thẻ gói CP2
- [ ] Xóa credit_balance

## Success criteria
Smoke trên trình duyệt: ví thiếu -> nạp QR -> tự quay lại mua gói CP2 -> 4 lượt CP2; mua CP1 vẫn như cũ; mã 100% -> 0đ.

## Risks
Chuỗi nạp-thiếu-rồi-mua lưu intent ở client: đổi khóa intent phải tương thích intent cũ còn trong localStorage (đọc cũ, ghi mới) hoặc bỏ intent cũ an toàn.
