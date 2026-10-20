# Phase 3: Lịch sử giao dịch (hàng mở rộng)

Priority: P2 · Status: Pending · Effort: 7h · blockedBy: Phase 1, 2 · Q-W1, Q-W2, Q-W4

WD = `apps/web-1/app/dashboard/wallet`

## Context Links
- Mockup: `js/views/history.js` (170), `css/views.css`, `REPORT.md` §4.2; mẫu dòng mở rộng giống `case-detail/billing`
- `reports/gap-register.md` W-02, W-03, W-05, W-06, W-07, W-09, W-12, W-14, W-15, W-16, W-17, W-19, W-20, W-21
- Code: `WalletTransactionList.tsx` (130), `WalletTransactionTable.tsx` (166), `WalletTransactionCardList.tsx` (86), `WalletTransactionFilters.tsx` (48), `WalletRowDetailAction.tsx` (44), `useWalletHistory` (page/limit/type/sortBy/sortOrder)

## Key insights
- Hiện: bảng Mantine nhiều cột (sort ở tiêu đề cột), chuyển sang thẻ trên mobile (`WalletTransactionCardList`), `Pagination` + "Hiển thị X trên tổng Y", lọc loại bằng `Select` đơn điệu. Chỉ dòng nạp mới bấm xem được chi tiết (link tới `/dashboard/payment?pid=`).
- Mockup: dòng `details.tx` thu gọn (thời gian | tiêu đề + diễn giải | biến động | chip | mũi tên) → mở rộng (khối "Giao dịch", khối "Thanh toán & Ngân hàng" cho nạp, khối "Đơn hàng" cho mua). Một layout cho mọi cỡ màn.
- Mapping dữ liệu thật (từ gap-register): thu gọn: `created_at`, `cleanDescription(source_description)` hoặc `TYPE_LABELS[type]`, `amount` (+/-), chip **loại**. Mở rộng: Giao dịch (thời gian đến giây, loại, **số dư trước/sau**, nguồn, ID có copy, mã tham chiếu), Nạp (lazy `useDepositSummary`: nội dung CK có copy, mã GD ngân hàng, ghi có, xác minh), Mua (lazy `useOrderSummary`: bảng dịch vụ/SL/đơn giá/thành tiền + tổng), + nút "Xem chi tiết nạp tiền" nếu `canOpenDeposit`.
- Phân trang + sắp xếp server **giữ**. Sắp xếp chuyển từ tiêu đề cột sang `Select "Sắp xếp"` (Mới nhất / Cũ nhất / Số tiền cao nhất / Số tiền thấp nhất) → map vào `sortBy/sortOrder`.
- Tab loại: Tất cả / Nạp tiền / Trừ ví / Hoàn tiền / Điều chỉnh, **không số đếm** (Q-W1); lọc bằng param `type` (một giá trị). Đổi tab → `page=1`.
- Lọc 3/7 ngày: bỏ (Q-W2).
- Đếm trong tab `QuickFilterTab` hiện thiếu `adjustment`: thêm.
- `WalletRowDetailAction` hiển thị tooltip tắt "Thanh toán dịch vụ - không có ảnh chứng minh" cho dòng mua: thông tin này giờ là một phần của dòng mở rộng.
- Mặc định mở 1 dòng tại một thời điểm? `Accordion multiple`: cho phép mở nhiều (mockup dùng `details` độc lập).
- Mobile: bỏ "Xem thêm N" (đã có phân trang). Bỏ `WalletTransactionCardList`.

## Requirements
- Danh sách `ExpandableList` (P1 case plan): mỗi dòng như trên; tiền `formatVndAmount(amount, { signed: true })` + màu `--color-success`/`--color-danger`; `tabular-nums`.
- Lọc + sắp xếp + làm mới (nút `ActionIcon` `RefreshCw`, `loading` khi `isFetching`).
- Trạng thái: skeleton 5 dòng cùng chiều cao hàng, lỗi + "Thử lại", trống theo bộ lọc ("Chưa có giao dịch nào" kèm gợi ý hành động theo `frontend-ui-rules` 3.6).
- Dòng mở rộng: Skeleton cho khối lazy, thông báo lỗi nhỏ ("Không tải được chi tiết nạp tiền") có "Thử lại".
- Không hiện tên ngân hàng/số TK/thụ hưởng (Q-W4).

## Architecture
```
WalletTransactionList.tsx (≤120)       state (type, page, sort), useWalletHistory, ghép
 ├─ WalletHistoryFilters.tsx (≤80)     Tabs loại + Select sắp xếp + nút làm mới
 ├─ WalletTransactionRow.tsx (≤80)     Summary (thu gọn)
 ├─ WalletTransactionDetail.tsx (≤100) Panel: meta + deposit + order
 │   ├─ WalletTxMeta.tsx               trường chung
 │   ├─ WalletTxDepositBlock.tsx       lazy deposit
 │   └─ WalletTxOrderBlock.tsx         lazy order
 └─ WalletHistoryPagination.tsx        "Hiển thị X trên tổng Y" + Pagination
wallet-sort.ts                          SORT_OPTIONS ⇄ {sortBy,sortOrder} + test
```

## Related code files
**Modify:** `WalletTransactionList.tsx`, `wallet-transaction.types.ts` (`QuickFilterTab`).
**Create:** các file trên + `wallet.module.css` (bổ sung).
**Delete:** `WalletTransactionTable.tsx`, `WalletTransactionCardList.tsx`, `WalletTransactionFilters.tsx`, `WalletRowDetailAction.tsx` (sau LSP references; logic link chuyển vào `WalletTransactionDetail`).

## Implementation steps
1. Đọc `useWalletHistory`, `WalletTransactionList.tsx`, `WalletTransactionFilters.tsx`, `WalletRowDetailAction.tsx` đầy đủ; ghi cách lọc/sắp xếp/`page` đang hoạt động.
2. Kịch bản trước sửa: đổi trang, đổi loại (về trang 1), sắp xếp tăng/giảm theo số tiền, làm mới, bấm "Chi tiết" dòng nạp, dòng mua (tooltip khóa).
3. `wallet-sort.ts`: bảng 4 lựa chọn ⇄ cặp `{sortBy, sortOrder}`; `parseSort(value)`; test 4 ca + giá trị lạ → mặc định mới nhất.
4. `WalletHistoryFilters`: `Tabs` (UNDERLINE) 5 tab → `type`; `Select size="sm"` sắp xếp; `ActionIcon` làm mới. Ba control cùng hàng đều `size="sm"`+ cùng chiều cao.
5. `WalletTransactionRow`: grid 5 cột desktop; mobile 2 hàng (`@media (max-width: 820px)` trong CSS module).
6. `WalletTransactionDetail`: render `WalletTxMeta`; chỉ khi `describeWalletRow().canOpenDeposit` thì `WalletTxDepositBlock` (hook bật khi `opened`); chỉ khi `canOpenOrder` thì `WalletTxOrderBlock`. Biết `opened` từ `onOpen` của `ExpandableList` (lưu `Set<string>` các id đã mở trong state cha để không refetch khi đóng/mở lại: React Query đã cache nên chỉ cần `enabled` một chiều).
7. `WalletTxDepositBlock`: nội dung CK + `CopyIconButton`, mã GD ngân hàng, "Ghi có lúc" `formatDateTimeFull`, "Cách xác minh" (map `verification_source`: `auto` → "Tự động", `manual` → "Thủ công"; xác minh từ wording nếu có), nút "Xem chi tiết nạp tiền" → `depositDetailHref`.
8. `WalletTxOrderBlock`: bảng nhỏ (`Table` Mantine được phép có đường kẻ): dịch vụ (tên giai đoạn từ `STAGE_DISPLAY_META` theo `service_type`; lạ → "Dịch vụ đánh giá"), SL, đơn giá, thành tiền, tổng; không in code `cp1_audit`.
9. Phân trang: giữ logic `Pagination` hiện tại (`limit=10`), dòng "Hiển thị X trên tổng Y".
10. Xóa 4 file cũ; `check-types`; `lint`; taste lint.
11. Smoke (xem Success criteria) + chụp 1440/390 sáng/tối.

## Todo
- [ ] Chốt Q-W1, Q-W2, Q-W4
- [ ] Kịch bản trước sửa
- [ ] `wallet-sort.ts` + test
- [ ] Filters + Row + Detail + 3 block
- [ ] Phân trang giữ nguyên
- [ ] Xóa 4 file cũ, LSP sạch
- [ ] Smoke

## Success criteria
- Mọi hành vi ở kịch bản bước 2 còn nguyên; đổi loại luôn về trang 1.
- Dòng nạp mở ra thấy nội dung CK + mã GD ngân hàng + ghi có (tạo deposit đã xác minh ở DB dev để thử); dòng mua thấy bảng đơn; dòng hoàn kiểu `deposit` + case id **không** có nút chi tiết nạp.
- Không còn bảng 5+ cột, không thẻ mobile riêng; mọi file ≤200 dòng; không `apiClient` trong component.
- Tiền luôn `1,000 VND`; không "Mua gói" trống; không chip trạng thái bịa.

## Risks
| Rủi ro | Xử lý |
|---|---|
| Mở nhiều dòng gây nhiều request | Chỉ gọi khi mở; staleTime 5 phút; mặc định đóng |
| `Accordion` cùng lúc mở dòng + fetch gây nhảy layout | Skeleton cùng chiều cao tối thiểu |
| `service_type` không map được tên giai đoạn | Mặc định "Dịch vụ đánh giá", không in code |
| Đổi sắp xếp từ cột sang Select làm mất thói quen | Q ghi rõ; nhãn Select rõ ràng |

## Security
Lazy fetch qua endpoint có guard owner; không log `bank_transaction_id`/nội dung CK; nội dung CK copy bằng `CopyIconButton`, không đưa vào URL.

## Next steps
P4.
