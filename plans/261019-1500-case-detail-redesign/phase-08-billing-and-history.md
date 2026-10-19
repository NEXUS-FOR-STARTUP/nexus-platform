# Phase 8: Thanh toán + lịch sử giao dịch mở rộng

Priority: P2 · Status: Pending · Effort: 8h · blockedBy: Phase 1 · Q1

CW = `apps/web-1/app/dashboard/case/[id]/_components`

## Context Links
- Mockup: `js/views/billing.js` (65), `REPORT.md` §6, §7 "Lượt chấm và thanh toán"
- `research/scout-02` §2 "Billing", §3 (bảng đối chiếu trường); `reports/gap-register.md` C-01, C-02, C-03, C-23, C-24, C-25, C-26
- Code: `CW/billing/BillingTab.tsx` (53), `CW/billing/StageBalanceTable.tsx` (144), `CW/billing/ServiceCheckoutModal.tsx` (196), `CW/CreditTransactionHistory.tsx` (418, **cần tách**), `CW/credit-history.types.ts` (189), `CW/billing/useCreditLedgerHistory.ts` (hoặc hook tương đương)

## Key insights
- **Điểm nóng của plan:** `CreditTransactionHistory.tsx` hiện 418 dòng, bảng 740px cuộn ngang; mockup đổi thành danh sách hàng mở rộng (`ExpandableList` từ P1).
- **Q1 (chốt trước khi code):**
  - Khối "Thanh toán/ngân hàng" của mockup **không thể dựng** vì mua lượt trừ ví, `Order` không có trường ngân hàng, `Deposit` không có `case_id` (C-01). **Bỏ khối này**, chỉ giữ: "Giao dịch" + "Đơn hàng".
  - Khối "Đơn hàng": API case không trả `orders` (`get-case-detail.usecase.ts`), nên hiện tại cũng không có. Nhưng ledger có `reference_type='order'` + `reference_id` = id đơn. Web type `CreditEntry` đang bỏ `reference_type` → thêm vào type; gọi lazy `GET /orders/:id` khi mở dòng (C-02).
  - Không có "mã lần chấm" và "mã lần chấm bị lỗi" (C-03): bỏ hai trường, hiện ID giao dịch + mã tham chiếu đơn (nếu có).
- **Phân loại giao dịch:**
  - Mockup: Tất cả / Mua / Dùng / Hoàn (kèm số đếm). Ledger có `type: purchase | consume | refund | adjustment`. Số đếm tính client-side từ mảng ledger đã nạp (khoảng vài chục dòng/case, không phân trang server ở trang này).
  - Khoảng thời gian (Tất cả / 3 ngày / 7 ngày): lọc client-side trên `created_at`.
- **Vi phạm hiện có:**
  - `toLocaleString("vi-VN")` ra `79.000` (`credit-history.types.ts:52-53`, `CreditBalanceCard`) → đổi `formatVndAmount` (C-24).
  - `ServiceCheckoutModal.tsx:87` `catch {}` nuốt lỗi → xử lý (C-23).
  - Nhãn "credit" → đổi theo `design-system/wording/pages/case-detail.md` (C-25: "lượt đánh giá").
  - `billing.js` mockup in `cp1_audit` trong `<code>` → **không chép** (C-34); hiện tên giai đoạn tiếng Việt.
- Bảng số dư: `StageBalanceTable` giữ logic `canBuy = available && packages.length > 0`; mua gói → `ServiceCheckoutModal` + shortage redirect (`startShortageDeposit`).

## Requirements
- Thẻ số dư: các giai đoạn mở có số lượt + nút "Mua thêm"; giai đoạn khóa có ghi chú "Sẽ mở sau".
- Bộ lọc: Tabs hoặc SegmentedControl loại (Tất cả/Mua/Dùng/Hoàn kèm số) + Select khoảng thời gian; mobile hiển thị 5 dòng kèm nút "Xem thêm N giao dịch" / "Thu gọn".
- Dòng thu gọn: thời gian (`formatDateTime`), tên hành động (tiếng Việt, không chữ "credit"), biến động (+N/-N lượt màu xanh/đỏ qua `formatVndAmount` hoặc "+N lượt"), chip trạng thái (thành công/hoàn tất), mũi tên mở rộng.
- Dòng mở rộng:
  - Khối "Giao dịch": thời gian đến giây (`formatDateTimeFull`), loại, giai đoạn (tên TV), biến động, **số dư sau** (có sẵn `balance_after`), trạng thái, nguồn, ID giao dịch + nút copy (`CopyIconButton`), mã đơn + nút copy (khi có `reference_id` đơn).
  - Cảnh báo dòng lỗi (nếu là hoàn do lỗi chấm: `reason`).
  - Khối "Đơn hàng" (chỉ khi có đơn, gọi lazy): bảng dịch vụ, số lượng, đơn giá, thành tiền, tổng tiền (tất cả định dạng `formatVndAmount`). Có Skeleton khi đang tải đơn.
- Giao dịch âm: `Math.abs(amount)` khi vẽ, màu đỏ; dương: xanh.

## Architecture
```
BillingTab.tsx (≤80)         vỏ, nạp dữ liệu
 ├─ StageBalanceCards.tsx    thay StageBalanceTable
 ├─ ServiceCheckoutModal.tsx giữ, sửa catch
 └─ CreditHistorySection.tsx lọc + danh sách (≤150)
     ├─ CreditHistoryFilters.tsx  loại + khoảng thời gian
     ├─ CreditTransactionRow.tsx  nội dung thu gọn (Summary)
     ├─ CreditTxDetail.tsx        nội dung mở rộng (Panel)
     │   ├─ TxMetaBlock.tsx       thời gian, id, số dư sau...
     │   └─ TxOrderBlock.tsx      lazy fetch đơn qua hook useOrderSummary
     └─ credit-history-filter.ts  lọc thuần + test
```
Tách `CreditTransactionHistory.tsx` (418 dòng) thành 5 file nhỏ, mỗi file ≤150 dòng.

## Related code files
**Modify:** `CW/billing/BillingTab.tsx`, `StageBalanceTable.tsx`, `ServiceCheckoutModal.tsx`, `credit-history.types.ts`, `CW/CreditTransactionHistory.tsx` (xóa, thay bằng thư mục).
**Create:** `CW/billing/credit-history/` (CreditHistorySection, CreditHistoryFilters, CreditTransactionRow, CreditTxDetail, TxMetaBlock, TxOrderBlock, credit-history-filter.ts, credit-history-filter.test.ts) + `apps/web-1/hooks/useOrderSummary.ts` nếu chưa có. Hook dùng chung với plan wallet: file duy nhất ở `apps/web-1/hooks/useOrderSummary.ts` (tạo nếu chưa có, plan wallet P1 import cùng file).
**Delete:** `CW/CreditTransactionHistory.tsx` sau khi chuyển.

## Implementation steps
1. Chốt Q1 với chủ dự án. Nếu yêu cầu giữ thông tin ngân hàng: giải thích lại rủi ro dữ liệu rác (ngân hàng là tài khoản chung từ env, không phải giao dịch của đơn này).
2. `credit-history.types.ts`: thêm `reference_type?: string | null` vào `CreditEntry`; thay `toLocaleString("vi-VN")` bằng `formatVndAmount`. Đổi "Nạp credit"..."Trừ credit" thành "Mua lượt", "Dùng lượt", "Hoàn lượt".
3. `useOrderSummary(orderId: string | null)`: hook TanStack Query gọi `apiClient.get('/orders/' + orderId)` chỉ khi `Boolean(orderId)`, `staleTime: 5 phút`. Trả `{ order, isLoading, isError }`.
4. `credit-history-filter.ts`: hàm thuần `filterCreditEntries(entries, { type, days, now })` + `countByType(entries)`. Test 6 ca: rỗng, lọc mua, lọc dùng, 3 ngày, 7 ngày, ca tương lai.
5. `CreditTransactionRow`: dùng `formatVndAmount(amount, { signed: true })` hoặc `formatCredits(amount)`; màu qua token; `CopyIconButton` cho id giao dịch.
6. `TxOrderBlock`: nếu `!orderId` → không render. Đang tải → Skeleton 3 dòng; lỗi → "Không tải được chi tiết đơn hàng"; thành công → bảng dịch vụ/SL/đơn giá/thành tiền/tổng (tất cả `formatVndAmount`).
7. `CreditTxDetail`: meta block (id, số dư sau, thời gian có giây qua `formatDateTimeFull`, nguồn); order block nếu `reference_type === "order"`.
8. Mobile: `useMediaQuery("(max-width: 820px)")`; nếu mobile và >5 dòng → cắt 5 dòng đầu, nút "Xem thêm N giao dịch" / "Thu gọn".
9. `ServiceCheckoutModal`: sửa `catch {}` nuốt lỗi: hiện notification + log context. Kiểm tiền `formatVndAmount` (hiện dùng `en-US` đã đúng, chuẩn hóa lại).
10. Smoke: case có 0 giao dịch (trống có hướng dẫn); case chỉ có dùng (CP1); case có mua (xem khối đơn hàng tải được); case có hoàn; đổi bộ lọc; đổi khoảng thời gian; mobile cắt 5 dòng; nút copy mã hoạt động; mua thêm lượt mở checkout.

## Todo
- [ ] Chốt Q1
- [ ] Thêm `reference_type` vào type
- [ ] `useOrderSummary` hook
- [ ] `credit-history-filter.ts` + test
- [ ] Thay file 418 dòng bằng thư mục `credit-history/`
- [ ] `ServiceCheckoutModal` sửa catch
- [ ] Bỏ chữ "credit" khỏi nhãn
- [ ] Smoke 6 ca × 2 cỡ

## Success criteria
- Không file nào >150 dòng; `CreditTransactionHistory.tsx` cũ đã xóa sạch tham chiếu.
- Dòng mở rộng: xem được số dư sau, ID giao dịch, và chi tiết đơn hàng khi dòng là mua lượt; không có chữ `cp1_audit` dạng code; tiền dấu phẩy `VND`.
- Bỏ khối ngân hàng đúng thỏa thuận Q1.
- Không nuốt lỗi trong modal checkout.

## Risks
| Rủi ro | Xử lý |
|---|---|
| `GET /orders/:id` trả 403 nếu đơn không thuộc user (dù case thuộc user) | Xử lý `isError` nhã nhặn: "Không có quyền xem chi tiết đơn này" |
| Backend không gửi `reference_type` | Kiểm tra lại `getCreditLedgerByCaseId`: có chọn `reference_type` trong Prisma query không (`research/scout-02` §3 nói repo đã select) |
| Lọc client-side chạy chậm với case nhiều trăm giao dịch | Thực tế case sinh viên <50 dòng ledger; nếu >200, phân trang sau |

## Security
ID đơn hàng và giao dịch chỉ fetch khi user bấm mở; dùng endpoint đã xác thực có guard role/owner.

## Next steps
P9.
