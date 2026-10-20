# Phase 2: Khung trang + thẻ số dư

Priority: P2 · Status: Pending · Effort: 2h · blockedBy: Phase 1 · Q-W3, Q-W7

WD = `apps/web-1/app/dashboard/wallet`

## Context Links
- Mockup: `js/views/balance.js` (76), `css/views.css`, `REPORT.md` §4.1
- `reports/gap-register.md` W-04, W-15, W-22, W-23, W-26
- Code: `WD/page.tsx` (59), `WD/_components/WalletBalanceCard.tsx` (43), `WalletTabsList.tsx` (12), `useWalletBalance`

## Key insights
- `WalletBalanceCard.tsx:19`: gradient + hai vòng tròn trang trí (`bg-linear-to-br from-brand/90 to-brand`, `w-32 h-32 bg-white/5 rounded-full`) → bỏ (taste + `frontend-ui-rules` 6.4).
- `WalletBalanceCard.tsx:33-36` dùng `toLocaleString("vi-VN")` → `formatVndAmount`.
- Câu mục đích hiện tại ("Dùng để thanh toán các gói đánh giá dự án") đã hợp quy tắc; mockup thêm "(CP1/CP2)" bị cấm.
- 3 chỉ số phụ bỏ (Q-W3). Thẻ chỉ: số dư lớn (24→32/500), chip "Đang hoạt động" (nếu wording có; hiện không rõ nguồn trạng thái ví: kiểm `useWalletBalance` trả `status`? nếu không, **bỏ chip**), 1 câu mục đích.
- Page: `Tabs defaultValue="history" variant="pills"`; `Tabs.Panel` nằm trực tiếp, **không có `Tabs.List` ở page** (list nằm trong `WalletTransactionList`/`WalletProofTable`?). Cần xác nhận khi đọc.
- Q-W7: `?view=history|proofs` qua `useSearchParams`/`router.replace` (như `?amount=`). Back/Forward chỉ nếu dùng `push`.
- Tiêu đề trang hiện `font-bold` 30px (`font-heading text-2xl sm:text-3xl`): mockup 24/500 → `--ui-text-title`/medium.

## Requirements
- Header: "Ví của tôi" (24/500) + nút chính "Nạp tiền" (`Plus`, `size="sm"`); mỗi màn một nút chính.
- Thẻ số dư: `Paper withBorder radius="md" p="lg"`, nền `--color-surface`, số dư `tabular-nums`.
- Tabs gạch dưới: "Lịch sử giao dịch", "Ảnh minh chứng" (tên theo wording), `?view=`.
- Trạng thái: tải (Skeleton đúng cỡ thẻ), lỗi (Alert + thử lại), như hiện tại.

## Architecture
```
page.tsx (≤90)            header + WalletBalanceCard + WalletTabs + modal
WalletTabs.tsx (mới ≤50)  Tabs UNDERLINE + panel; đồng bộ ?view=
WalletBalanceCard.tsx     restyle (≤60)
wallet.module.css         .balance .amount
```
Xóa `WalletTabsList.tsx` (12 dòng, wrapper `border-none bg-transparent p-0` cho pills).

## Related code files
**Modify:** `page.tsx`, `WalletBalanceCard.tsx`.
**Create:** `WalletTabs.tsx`, `wallet.module.css`.
**Delete:** `WalletTabsList.tsx` (sau LSP).

## Implementation steps
1. Đọc `WalletTransactionList.tsx`, `WalletProofTable.tsx` đầu file để biết `Tabs.List` đặt ở đâu; xác nhận chỗ giữ `Tabs` context.
2. `useWalletBalance`: kiểm có trả trạng thái ví hay chỉ số dư. Không có → bỏ chip.
3. `WalletBalanceCard`: bỏ gradient/vòng tròn; `Text` số dư `--ui-text-title`/medium, `tabular-nums`; câu mục đích 14px muted.
4. `WalletTabs`: `useSearchParams` đọc `view` (`history`|`proofs`, mặc định `history`); đổi tab → `router.replace("?view=...")` giữ `amount` nếu có; **không** dùng `push` để Back không phải nhảy qua nhiều tab (hỏi nếu muốn Back/Forward).
5. Chuẩn hóa `view` bằng hàm `parseWalletView()` (3 dòng + assert).
6. Smoke: tải trang, đổi tab, reload ở `?view=proofs`, `?amount=79000` vẫn mở modal.

## Todo
- [ ] Chốt Q-W3, Q-W7
- [ ] Xác nhận vị trí `Tabs.List`
- [ ] Bỏ gradient + vòng tròn
- [ ] `WalletTabs` + `?view=`
- [ ] Xóa `WalletTabsList`
- [ ] Smoke

## Success criteria
- Không còn `bg-linear-to-br`/vòng tròn trang trí; tiền `158,000 VND`.
- `?view=proofs` vào đúng tab; `?amount=` vẫn chạy.
- Ảnh khớp mockup (thẻ phẳng, tabs gạch dưới) ở 1440/390.

## Risks
| Rủi ro | Xử lý |
|---|---|
| `Tabs.List` đang ở file khác gây lệch context | Chuyển `Tabs.List` về `WalletTabs` |
| Hai chỗ đồng bộ URL (`amount`, `view`) đè nhau | Dùng `URLSearchParams` clone, chỉ đổi `view` |

## Security
Tham số URL chỉ là chuỗi lựa chọn đã kiểm bằng hàm parse; `amount` đã có kiểm hiện hành (kiểm số hữu hạn >0 ở P5).

## Next steps
P3, P4.
