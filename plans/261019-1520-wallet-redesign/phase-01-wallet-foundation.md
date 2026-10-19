# Phase 1: Nền ví (kiểu dữ liệu, tiền, hook lazy)

Priority: P2 · Status: Pending · Effort: 3h · blockedBy: case plan Phase 1

WD = `apps/web-1/app/dashboard/wallet`

## Context Links
- `reports/gap-register.md` W-05…W-10, W-19, W-22, W-28
- `research/scout-01` §3 (khả thi dữ liệu), §2 (logic giữ)
- Code: `WD/hooks/useWallet.ts` (106), `WD/_components/wallet-transaction.types.ts` (63), `apps/web-1/lib/deposit-display.ts`, `apps/web-1/app/dashboard/payment/hooks/usePayment.ts` (`useDepositDetail`, `getProofUrl`), `wallet-display.constants.ts`, API: `GET /deposits/:id`, `GET /orders/:id`

## Key insights
- Type web `WalletTransactionItem` chỉ khai báo một phần nhưng API trả đủ: `balance_before/after`, `source_type`, `source_id`, `reference_*`, `metadata_json`, `created_at`.
- `TYPE_LABELS` đã có: `deposit`→"Nạp tiền", `withdrawal`→"Trừ ví", `refund`→"Hoàn tiền", `adjustment`→"Điều chỉnh", `migration`, `service_payment`. `QuickFilterTab = all|deposit|withdrawal|refund`. Thiếu tab `adjustment` mà mockup có (và là loại tài khoản vận hành thấy khi cấp ví).
- `formatVND` sai dấu chấm (`toLocaleString("vi-VN")`); `describeTransaction` (server) gắn hậu tố "(+100.000 VND)" và client dùng regex cắt (`wallet-display.constants.ts:17-21`) → phải nhận cả dấu phẩy.
- Dòng nạp có `source_id` = deposit id **trừ** hoàn tiền ghi qua `deposit()` (type `deposit`, source_id = case id): không hiện link chi tiết nạp tiền cho những dòng đó (W-16). Cách phân biệt: `source_type`.
- Dòng mua có `source_type='order'`, `source_id` = id đơn.
- Chi tiết deposit (`GET /deposits/:id`) có `transfer_content`, `bank_transaction_id`, `bank_credited_at`, `verification_source`, `verified_by`; hook `useDepositDetail` đã tồn tại nhưng **poll 5s** (dùng cho trang payment): lazy-on-expand cần biến thể không poll.
- `useOrderSummary` dùng chung với plan case-detail P8: một file duy nhất `apps/web-1/hooks/useOrderSummary.ts`. Ai làm trước thì tạo, người sau import; không nhân đôi.

## Requirements
- Một nơi duy nhất cho hiển thị tiền ở thư mục ví: `formatVndAmount`; xóa `formatVND`.
- `WalletTransactionItem` đầy đủ trường API trả.
- Hàm thuần `describeWalletRow(tx)` trả `{ title, subtitle, typeTone, canOpenDeposit, canOpenOrder }`, kèm test.
- Hook lazy: `useDepositSummary(id | null)`, `useOrderSummary(id | null)`; không poll; `enabled` khi `id` tồn tại và dòng đã mở.

## Architecture
```
_components/wallet-transaction.types.ts   kiểu đầy đủ + TYPE_LABELS/COLORS (bỏ formatVND, formatDateTime giữ + formatDateTimeFull)
_components/wallet-row.ts                 describeWalletRow() + cleanDescription() + test
hooks/useDepositSummary.ts                GET /deposits/:id, staleTime 5 phút, không refetchInterval
hooks/useOrderSummary.ts (dùng chung)     GET /orders/:id
```

## Related code files
**Modify:** `wallet-transaction.types.ts`, `wallet-display.constants.ts` (regex), `useWallet.ts` (type), các file import `formatVND`.
**Create:** `wallet-row.ts`, `wallet-row.test.ts`, `hooks/useDepositSummary.ts`, (nếu chưa có) `apps/web-1/hooks/useOrderSummary.ts`.
**Delete:** `formatVND` (hàm).

## Implementation steps
1. Đọc `design-system/wording/pages/wallet.md` + `payment.md`; ghi chữ chuẩn cho: tiêu đề trang, mô tả thẻ số dư, tên loại, trạng thái trống.
2. `xd://lsp` references cho `formatVND`, `TYPE_LABELS`, `QuickFilterTab`, `formatDateTime`.
3. Mở rộng `WalletTransactionItem` (thêm `reference_type`, `reference_id`, `metadata_json?`, `currency`) theo đúng schema API; bỏ trường không dùng, không để `any`/`unknown` thừa.
4. `wallet-row.ts`:
   - `cleanDescription(raw)`: bỏ hậu tố `\s*\([+-]?[\d.,]+\s*VND\)$` (nhận `.` và `,`).
   - `describeWalletRow(tx)`: `canOpenDeposit = tx.type==='deposit' && tx.source_type==='deposit' && !!tx.source_id` (kiểm giá trị `source_type` thật của deposit trong `wallet.service.ts`/`deposit` usecase trước khi gõ); `canOpenOrder = tx.source_type==='order' && !!tx.source_id`; `typeTone` từ `TYPE_COLORS`.
   - Test 6 ca: deposit thường, refund hoàn qua `deposit()` (source_id = case id, `canOpenDeposit=false`), mua đơn, adjustment platform_bonus, mô tả có hậu tố dấu chấm, mô tả có hậu tố dấu phẩy.
5. `useDepositSummary`/`useOrderSummary`: `useQuery({ queryKey, queryFn, enabled, staleTime })`; lỗi trả `isError` để UI hiện thông báo gần dòng.
6. Thay `formatVND(x)` bằng `formatVndAmount(x)` trong `WD/**`.
7. Chạy `check-types`, `lint`, test.

## Todo
- [ ] Đọc wording wallet + payment
- [ ] LSP references 4 symbol
- [ ] Mở rộng type
- [ ] `wallet-row.ts` + test
- [ ] Hai hook lazy
- [ ] Thay `formatVND`
- [ ] Gate sạch

## Success criteria
- Không còn `formatVND`/`vi-VN` thuộc ví cho tiền.
- Test 6 ca pass.
- Dòng hoàn tiền kiểu `deposit` + `source_id=caseId` không còn link nạp tiền.
- `useDepositSummary` không có `refetchInterval`.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Giá trị `source_type` của deposit khác giả định | Đọc code ghi dòng deposit (`deposit-credit` usecase) trước khi viết điều kiện |
| Trùng hook `useOrderSummary` với case plan P8 | Một file duy nhất, ghi ở cả hai plan |
| API trả `source_description` thay đổi | Chỉ dùng `cleanDescription`, không phụ thuộc cấu trúc |

## Security
Hook lazy chỉ gọi endpoint có guard owner; không đưa `id` giao dịch vào log; không cache nội dung nhạy cảm lâu hơn `staleTime`.

## Next steps
P2, P3.
