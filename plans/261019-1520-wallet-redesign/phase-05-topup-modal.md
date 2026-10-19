# Phase 5: Modal nạp tiền + mức chọn nhanh

Priority: P2 · Status: Pending · Effort: 3h · blockedBy: Phase 1

WD = `apps/web-1/app/dashboard/wallet`

## Context Links
- Mockup: `js/views/topup-modal.js` (186) — **chỉ bước 1**; `REPORT.md` §4.4
- `reports/gap-register.md` W-01, W-18, W-22, W-25
- Code: `WD/_components/WalletTopupModal.tsx` (98), `useCreateDeposit` (`useWallet.ts:82-105`), `use-shortage-deposit-redirect.ts`, `payment/credit-after-deposit-intent`

## Key insights
- Luồng thật: mở modal → key idempotency tạo mới (`:25-29`) → `NumberInput` → `useCreateDeposit({amount, idempotency_key})` → `router.push('/dashboard/payment?pid=' + id)`. `submittingRef` chặn gửi đôi. `MIN_TOPUP_AMOUNT = 2000`, `DEFAULT_TOPUP_AMOUNT = 50000`. Hook invalidate `["wallet"]`, `["deposits"]`, thông báo lỗi.
- Mockup bước 2 (VietQR trong modal, "Tôi đã chuyển tiền" giả lập cộng ví, `alert()`): **bỏ** (W-01).
- Mockup bước 1: 4 nút chọn nhanh `50.000đ`, `79.000đ` (gói 2 lượt), `100.000đ`, `200.000đ` + ô số tiền + ghi chú "Tối thiểu 2.000 VND · Gợi ý nạp 79.000 VND để mua gói 2 lượt đánh giá dự án". Cả `đ` lẫn dấu chấm sai quy tắc; chữ "gói 2 lượt" phụ thuộc giá gói hiện tại 79,000: **không gõ cứng**; nếu giữ gợi ý, lấy từ danh sách gói (hook catalog có sẵn `useServiceCatalog`) hoặc bỏ. Mặc định: bỏ câu gợi ý gói, giữ nút chọn nhanh.
- `NumberInput` hiện có `thousandSeparator=","`; description đã ghi `2,000 VND` / `79,000 VND` (đúng).
- Khi vào `?amount=N` modal tự mở với số đó (đã có ở `page.tsx`); kiểm số hữu hạn >0 trước khi dùng (`Number("abc")` = NaN hiện có thể lọt).
- Chặn `shortage` flow: `use-shortage-deposit-redirect` gọi cùng `useCreateDeposit` — không đổi chữ ký hook.

## Requirements
- Modal `Modal centered radius="md"`; tiêu đề "Nạp tiền vào ví"; `NumberInput` (label "Số tiền nạp", min `MIN_TOPUP_AMOUNT`, `thousandSeparator=","`, `decimalScale={0}`, hậu tố ` VND` qua `suffix`), 4 nút chọn nhanh (`Button variant="default" size="sm"`; chọn = `variant="light"` + `aria-pressed`), nút "Tạo lệnh nạp tiền" (chữ hiện tại giữ), mô tả tối thiểu.
- Mức chọn nhanh là hằng có tên (`TOPUP_PRESET_AMOUNTS = [50_000, 79_000, 100_000, 200_000]`) ở `wallet-topup.constants.ts` cùng `MIN_TOPUP_AMOUNT`/`DEFAULT_TOPUP_AMOUNT` (chuyển từ modal).
- Không đổi hành vi gửi.

## Architecture
```
WalletTopupModal.tsx (≤90)       modal + NumberInput + submit (giữ)
 └─ TopupPresetButtons.tsx (≤40) 4 nút, nhận value/onChange
wallet-topup.constants.ts         MIN, DEFAULT, PRESETS
```

## Related code files
**Modify:** `WalletTopupModal.tsx`, `page.tsx` (kiểm `amount` hợp lệ).
**Create:** `TopupPresetButtons.tsx`, `wallet-topup.constants.ts`.
**Delete:** không.

## Implementation steps
1. Đọc `WalletTopupModal.tsx` (98) + `useCreateDeposit`; ghi kịch bản: mở modal → số mặc định 50,000; nhập <2,000 → chặn; gửi → chuyển trang; đóng/mở lại → key mới; bấm đôi → chỉ 1 deposit.
2. Chuyển hằng sang `wallet-topup.constants.ts`; cập nhật import (LSP references cho `MIN_TOPUP_AMOUNT`).
3. `TopupPresetButtons`: `Button.Group` hoặc `Group gap="xs"`; mỗi nút `formatVndAmount(preset)`, `aria-pressed`.
4. `page.tsx`: `parseTopupAmount(raw)` hàm thuần (số hữu hạn, ≥`MIN_TOPUP_AMOUNT`, làm tròn) + test 5 ca (`null`, "abc", "79000", "1000", "-5").
5. Smoke trên DB dev: nạp 50,000 → có `Deposit` + chuyển trang payment; nạp bằng nút chọn nhanh; bấm đôi nhanh; vào `?amount=79000` modal mở với 79,000; `?amount=abc` không mở.

## Todo
- [ ] Kịch bản trước sửa
- [ ] Hằng số ra file riêng
- [ ] Nút chọn nhanh
- [ ] `parseTopupAmount` + test
- [ ] Smoke trên DB dev

## Success criteria
- Hành vi gửi/chuyển hướng không đổi; chỉ 1 deposit khi bấm đôi.
- Nút chọn nhanh cập nhật ô số; `aria-pressed` đúng.
- Không `đ`, không `.` ngăn nghìn, không chữ "CP".
- Không bước 2 VietQR.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Thử nạp làm rác DB | Chỉ DB dev (`DATABASE_URL` localhost); không chạy trên production |
| Hằng chọn nhanh không khớp giá gói sau này | Là hằng có tên, chỉnh một chỗ; không gắn cứng vào câu chữ |
| Ghi chú "79,000 = 2 lượt" lỗi thời | Đã bỏ |

## Security
Số tiền được kiểm lại ở server (không tin client); key idempotency không đưa vào log; `?amount` được parse/kiểm trước khi dùng.

## Next steps
P6.
