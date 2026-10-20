# Gap register: wallet mockup vs code vs API

Nguồn: `research/scout-01-mockup-vs-code.md` (đã đối chiếu `useWallet.ts`, `wallet.service.ts`, `deposit.repository.ts`, `order-in-tx.ts`). Mức: **B** blocker, **H** high, **M** med, **L** low. Q-W# ở `plan.md`.

## A. Mockup đòi dữ liệu/hành vi mà API chưa có

| ID | Mức | Mockup | Thực tế | Mặc định | Q |
|---|---|---|---|---|---|
| W-01 | B | Modal nạp tiền **bước 2: mã VietQR ngay trong modal** + nút "Tôi đã chuyển tiền" giả lập cộng ví (mockup tự ghi "Đề xuất thử nghiệm") | Code thật: tạo `Deposit` rồi **chuyển** sang `/dashboard/payment?pid=` (tải minh chứng, polling 5s, xử lý từ chối, ý định mua-sau-nạp). `WalletTopupModal.tsx:36-47` | **Bỏ bước 2 của mockup.** Giữ chuyển hướng. Chỉ thêm 4 nút chọn nhanh mức nạp | N |
| W-02 | B | Tab loại có số đếm: "Tất cả (6) · Nạp tiền (2) · Mua gói (2) · Hoàn tiền (1) · Điều chỉnh (1)" | `/wallet/history` chỉ trả `total` cho bộ lọc hiện tại; không có đếm theo loại. Và loại "Mua gói" (`service_payment`) **không bao giờ được ghi**: mua lượt gọi `withdraw` ra `type='withdrawal'` + `source_type='order'` (`order-in-tx.ts:97`); `payForOrder` (ghi `service_payment`) không có caller | **Tab không số đếm**; lọc server-side bằng param `type` có sẵn. Nhãn tab theo type thật: Tất cả / Nạp tiền (`deposit`) / Trừ ví (`withdrawal`) / Hoàn tiền (`refund`) / Điều chỉnh (`adjustment`), đúng `TYPE_LABELS` hiện có (`wallet-transaction.types.ts:24-31`); API nhận 1 giá trị `type` mỗi lần (`wallet.service.ts`, offset-based). Muốn số đếm = endpoint mới `groupBy` (plan backend) | Q-W1 |
| W-03 | H | Bộ lọc "3 ngày qua / 7 ngày qua" | Không có tham số `from/to/days` trong `getTransactionHistory` | **Bỏ.** Lọc client-side chỉ đúng trong 1 trang (10 dòng) nên sai | Q-W2 |
| W-04 | H | 3 chỉ số: Tổng đã nạp (250.000), Tổng đã dùng (92.000), "~3 lượt chấm" | Không có endpoint tổng hợp; cộng client trên 1 trang = sai. `~lượt` = `floor(balance/50000)` cứng trong mockup, nhưng giá gói thật khác (42,000 / 50,000 / 79,000 cho 2 lượt) | **Bỏ cả ba.** Thẻ số dư: số dư lớn + chip "Đang hoạt động" + 1 câu mục đích. Nếu muốn: `GET /wallet/summary` (SUM theo type) là plan backend; `~lượt` cần đơn giá gói và không ổn định | Q-W3 |
| W-05 | H | Chip trạng thái trên mỗi dòng giao dịch: Thành công / Hoàn tất (cam) / Đã hoàn tiền / Đã cộng | Dòng sổ ví **không có trạng thái**; chỉ có `Deposit` mới có enum. Nhãn do mockup bịa; cam đang là màu "chờ" ở nơi khác | **Bỏ chip trạng thái ở lịch sử.** Chip hiện là **loại** (Nạp tiền/Trừ ví/Hoàn tiền/Điều chỉnh, theo `TYPE_LABELS`) với tone cố định. Chip trạng thái chỉ cho tab Minh chứng, lấy từ `getDepositDisplay` | N |
| W-06 | H | Khối ngân hàng trong dòng mở rộng: tên ngân hàng, số tài khoản, thụ hưởng, mã GD ngân hàng, nội dung CK, ghi có, xác minh | Thông tin ngân hàng thu tiền là **env của nền tảng** (`BANK_NAME`, `BANK_ACCOUNT_*`; mặc định giả `0909090909`), không lưu theo từng deposit: tài khoản đổi thì dòng cũ hiện sai. Mã GD, nội dung CK, thời điểm ghi có, kiểu xác minh có ở `GET /deposits/:id` (`transfer_content`, `bank_transaction_id`, `bank_credited_at`, `verification_source`) nhưng list thì không | Với dòng nạp: lazy `GET /deposits/:id` khi mở → hiện **nội dung CK** (copy), **mã giao dịch ngân hàng**, **thời điểm ghi có**, **cách xác minh**. **Bỏ** tên ngân hàng/số TK/thụ hưởng (không phải dữ liệu của giao dịch) | Q-W4 |
| W-07 | M | Khối "Đơn hàng" cho dòng mua lượt: tên dịch vụ, SL, đơn giá, tổng | `GET /orders/:id` có `items[{service_type, quantity, unit_price, amount}]`, `total_amount`, `status`; không có tên dịch vụ đọc được (chỉ code). Nối bằng `tx.source_id` = id đơn (**không** dùng `orders.wallet_transaction_id`, nó giữ id đơn, không phải id giao dịch: `order-in-tx.ts:107`) | Lazy fetch khi mở dòng có `source_type='order'`; tên dịch vụ dựng từ tên giai đoạn (không render code `cp1_audit`) | N |
| W-08 | M | "Mã tham chiếu CASE-44441B32" | Dòng sổ không có `case_id` (chỉ `source_id`; với mua đơn là id đơn) | Hiện mã đơn (nếu có). Bỏ mã case | N |
| W-09 | M | Dòng mở rộng của **mọi** giao dịch có "vết kiểm toán" | Chỉ có `id, type, amount, balance_before/after, source_type/source_id, reference_*, metadata_json, created_at`. Không có người thực hiện (admin hoàn tiền không có tên) | Hiện các trường thật. Không hứa audit log | N |
| W-10 | M | Tab Minh chứng: "Số tiền thực nhận", tên file minh chứng, tab đếm "Chờ xác minh (n)" | Không có cột `actual_amount` (chỉ cờ `amount_mismatch`); chỉ có `proof_file_url` (tên suy từ URL); `GET /deposits` trả `{deposits}` không có `total`, trần 20 (`limit` cứng trong hook), lọc client-side; list **chỉ gồm deposit đã có minh chứng** (`findDepositsByUser`) | Giữ danh sách hiện hành. Dòng mở rộng: số tiền yêu cầu, trạng thái (`getDepositDisplay`), xác minh lúc (`updated_at` khi đã xác minh), link xem minh chứng. Bỏ "thực nhận". Đếm theo trạng thái = đếm trong mảng đã tải, gắn nhãn "trong 20 gần nhất" nếu đủ 20 | Q-W5 |
| W-11 | L | `tx-detail-modal.js` (REPORT ghi có) | **Không tồn tại**; `app.js` gọi `closeTxDetailModal()` khi Esc sẽ ném ReferenceError. Dòng mở rộng inline `.txd` mới là thứ thật | Bỏ khái niệm modal chi tiết. Không sao chép lỗi | N |

## B. Code có mà mockup bỏ (không được làm mất)

| ID | Mức | Code hiện có | Mockup | Mặc định |
|---|---|---|---|---|
| W-12 | B | **Phân trang server** (`page`, `limit` 10 tối đa 50), **sắp xếp** (`sortBy=created_at|amount`, `sortOrder`), dòng "Hiển thị X trên tổng Y" | Không phân trang, không sắp xếp; "Xem thêm N" chỉ mobile, giả định tải hết | Giữ `Pagination` dưới danh sách (cả desktop/mobile). Sắp xếp → `Select` "Sắp xếp" (Mới nhất / Cũ nhất / Số tiền cao nhất / thấp nhất) thay nút tiêu đề cột. Bỏ "Xem thêm N" |
| W-13 | H | Xem/mở **minh chứng** ảnh/PDF (`WalletProofTable.tsx:215-235`, icon PDF vs ảnh; `getProofUrl`) | Chỉ tên file | Giữ link xem minh chứng trong dòng mở rộng, dùng `getProofUrl` (đúng hơn bản nhúng trong bảng) |
| W-14 | H | Link "Chi tiết" → `/dashboard/payment?pid=` từ dòng nạp (`WalletRowDetailAction`), kể cả deposit bị từ chối để nộp lại | Không có đường tới nộp-minh-chứng | Giữ nút "Xem chi tiết nạp tiền" trong dòng mở rộng. Lỗi nhỏ có sẵn: dòng `refund` ghi qua `deposit()` (`type='deposit'`) có `source_id` = case id → link sai tới `/payment?pid=<caseId>` (xem W-16) |
| W-15 | M | Skeleton, lỗi + thử lại, trống theo bộ lọc, thẻ số dư lỗi, làm mới (`isFetching`) | Chỉ trống theo bộ lọc | Giữ cả bốn |
| W-16 | M | Hoàn tiền: `refund()` có transaction → `type='refund'`; không transaction → `deposit()` → `type='deposit'` (`wallet.service.ts:166`), hiện ở tab "Nạp tiền" | Mockup không biết | Ghi nhận; không sửa ở plan UI. Chỉ chặn link sai: không hiện nút "Xem chi tiết nạp tiền" nếu `source_type` không phải deposit |
| W-17 | M | Thẻ giao dịch mobile `WalletTransactionCardList` | Một layout `details` cho mọi cỡ | Xóa card list (mockup có chủ ý); `ExpandableList` cho mọi cỡ |
| W-18 | M | `useCreateDeposit` (idempotency key tạo lại mỗi lần mở, `submittingRef`), `MIN_TOPUP_AMOUNT=2000`, `DEFAULT_TOPUP_AMOUNT=50000`, `use-shortage-deposit-redirect`, `clearAllBuyCreditAfterDepositIntents()` khi vào trang, deposit bị từ chối → `/dashboard/wallet?amount=N` | `?amount=79000` và `?topup=open` (mô phỏng) | Giữ nguyên mọi thứ. `?amount=` đã có (`page.tsx:15-19`). **Không** thêm `?topup=open` |
| W-19 | M | `describeTransaction` regex cắt hậu tố `(+100.000 VND)` mà API gắn vào mô tả | | Giữ, **cập nhật** regex nhận cả dấu phẩy |
| W-20 | M | Polling 30s (số dư, lịch sử, deposits), 5s (chi tiết deposit) | | Giữ |
| W-21 | L | `WalletTransactionList`/`Table`/`Filters`, `WalletTabsList` (12 dòng) | | Thay bằng thành phần mới; xóa khi không còn tham chiếu |

## C. Vi phạm quy tắc repo

| ID | Việc | Xử lý |
|---|---|---|
| W-22 | **Tiền sai dấu chấm** ở code hiện tại: `formatVND` (`wallet-transaction.types.ts:48-50`), `WalletBalanceCard.tsx:33-36`, `PaymentDepositMeta.tsx:44`, `ServiceCheckoutModal`, chuỗi lỗi API `wallet.types.ts:30`. Mockup cũng sai (`158.000 VND`, `50.000đ`) | Trong phạm vi ví: thay bằng `formatVndAmount` (case plan P1). `PaymentDepositMeta` dùng chung với **trang pay-later công khai** (`/pay/receivable/[token]`): **không sửa** ở plan này (hồi quy rủi ro); liệt kê; Q-W6 |
| W-23 | Mockup copy có "CP1/CP2": "Dùng để thanh toán các gói đánh giá dự án Ý tưởng (CP1) và Thị trường (CP2)"; "Giai đoạn Thị trường (CP2) · Trừ số dư ví"; "Lượt chấm phản biện Thị trường (CP2)" | Cấm. Dùng câu hiện tại "Dùng để thanh toán các gói đánh giá dự án" + tên giai đoạn từ `STAGE_DISPLAY_META` |
| W-24 | `WalletProofTable.tsx` **371 dòng** | Tách/thay (P4) |
| W-25 | Mockup Phosphor, `alert()` | Lucide, `notifications.show` |
| W-26 | `WalletBalanceCard.tsx:19` gradient + 2 vòng tròn trang trí | Bỏ (taste + frontend-ui-rules 6.4) |
| W-27 | Mockup header "Quản lý số dư trả trước và đối soát lịch sử giao dịch đánh giá dự án" không có trong `design-system/wording/` [UNVERIFIED] | Đối chiếu `pages/wallet.md`; mặc định giữ chữ hiện có |
| W-28 | Nhãn trạng thái deposit mockup ("Sai số tiền", "Đã vào ví") ≠ `getDepositDisplay` ("Số tiền chưa khớp", "Đã cộng vào ví"...) ≠ `STATUS_LABELS` trong `WalletProofTable.tsx:24-29` (còn `yellow` cho `amount_mismatch`) | **Một nguồn:** `getDepositDisplay` (`lib/deposit-display.ts`). Cẩn thận: dùng chung với `getReceivableDisplay`; không đổi bản đồ nhãn |

## D. Chồng lấn với plan pay-later (`261016-1530-grant-wallet-funds-pay-later`, completed)

- Không xung đột mã nguồn. Plan đó thêm `WalletService.grant` (`type='adjustment'`, `source_type='platform_bonus'`, `source_id=receivable.id`), `app/admin/receivables`, `app/pay/receivable/[token]`, `PaymentView`.
- `grant` ghi vào **ví vận hành**, không phải sinh viên. Mẫu "Cộng khuyến mãi sinh viên EXE101" của mockup không có nguồn thật; tab **Điều chỉnh** vẫn cần vì tài khoản vận hành sẽ thấy dòng đó. Nhãn `platform_bonus`/`admin_refund` chỉ tồn tại ở `SOURCE_DESCRIPTIONS` phía server: client dùng `source_description` API đã gửi.
- **Cấm đụng** `PaymentView`, `PaymentDepositMeta`, `PaymentBankInfo` (chung với trang công khai) và bản đồ nhãn `lib/deposit-display.ts` (chung với `getReceivableDisplay`).
- Sinh viên **không** được thấy khoản nợ vận hành: không thêm liên kết tới receivable.
