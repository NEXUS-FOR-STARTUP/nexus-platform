# Page: Ví & Lịch sử giao dịch

Route: `/dashboard/wallet`  
Access: `Authenticated (Sinh viên / Student)` (nguồn: `apps/web-1/app/dashboard/layout.tsx:14–47`)

---

## Layer 1: Page Context

### User
- **Primary user:** Sinh viên hoặc người dùng thông thường đã đăng nhập vào hệ thống; route được bảo vệ bởi `DashboardLayout`, chỉ cho phép tài khoản không phải vai trò `admin` và không phải vai trò `supporter` truy cập (nguồn: `apps/web-1/app/dashboard/layout.tsx:16–27, 42–47`).
- **Typical state:** Đã có phiên làm việc (`session`), đang muốn kiểm tra số dư ví khả dụng, nạp tiền vào ví qua chuyển khoản ngân hàng VietQR để mua credit/gói phản biện, hoặc tra cứu đối soát lịch sử giao dịch và trạng thái các ảnh minh chứng đã gửi (nguồn: `page.tsx:30–57`, `WalletBalanceCard.tsx:7–39`).
- **Knowledge level:** `[Assumption / Cần xác minh]` Người dùng đã hiểu cơ chế nạp tiền trước vào ví nội bộ để chi trả dịch vụ hoặc vừa được điều hướng sang từ trang thanh toán/thiếu số dư (`CreditQuantityModal`).

### User goals
- Kiểm tra số dư ví hiện có bằng đơn vị VND (`WalletBalanceCard.tsx:23–37`).
- Mở modal nạp tiền, nhập số tiền cần nạp và tạo mã chuyển khoản ngân hàng (`WalletTopupModal.tsx:56–96`).
- Tra cứu lịch sử các biến động số dư ví (nạp tiền, trừ ví, hoàn tiền, điều chỉnh, chuyển đổi, mua dịch vụ) (`WalletTransactionTable.tsx:82–163`).
- Lọc lịch sử giao dịch theo loại giao dịch (`WalletTransactionFilters.tsx:24–33`) hoặc sắp xếp theo thời gian / số dư biến động (`WalletTransactionTable.tsx:37–63`).
- Theo dõi danh sách các giao dịch nạp tiền có gửi ảnh minh chứng kèm trạng thái duyệt (`WalletProofTable.tsx:143–282`).
- Lọc danh sách ảnh minh chứng theo trạng thái xét duyệt (`WalletProofTable.tsx:64–73`).
- Mở xem chi tiết yêu cầu nạp tiền (`/dashboard/payment?pid=...`) hoặc mở file ảnh/PDF minh chứng gốc trên tab mới (`WalletRowDetailAction.tsx:10–25`, `WalletProofTable.tsx:215–235`).

### Business / Product goals
- Cung cấp giao diện trung tâm quản lý số dư (Prepaid Wallet) cho toàn bộ người dùng sinh viên, hỗ trợ nạp tiền một lần và trừ dần khi mua credit phản biện AI hoặc phản biện Supporter.
- Tự động hóa tiếp nhận nạp tiền: tạo mã giao dịch nạp tiền (`POST /deposits`), sinh nội dung chuyển khoản tự động (`CRTOPUPxxxx`) hỗ trợ webhook ngân hàng (SePay) khớp lệnh tự động hoặc hỗ trợ admin đối soát qua ảnh minh chứng.
- Minh bạch hóa lịch sử giao dịch: ghi nhận đầy đủ số dư trước giao dịch (`balance_before`), số dư sau giao dịch (`balance_after`), số dư biến động và nguồn phát sinh.
- Tiếp nhận luồng nạp bù số dư (shortage deposit): tự động mở sẵn modal nạp tiền kèm số tiền cần nạp khi được chuyển hướng từ các trang khác qua URL query parameter `?amount=...`.

### Primary action
- Bấm nút `"Nạp tiền"` trên thanh tiêu đề trang (`page.tsx:35–37`) để mở modal nạp tiền `WalletTopupModal`.

### Secondary actions
- Chuyển đổi tab giữa `"Lịch sử giao dịch"` và `"Ảnh minh chứng"` (`WalletTabsList.tsx:8–9`).
- Lọc loại giao dịch trong tab Lịch sử giao dịch (`WalletTransactionFilters.tsx:24–33`).
- Bấm nút `"Làm mới"` để refetch dữ liệu giao dịch hoặc dữ liệu ảnh minh chứng (`WalletTransactionFilters.tsx:35–44`, `WalletProofTable.tsx:75–84`).
- Bấm vào tiêu đề cột để sắp xếp danh sách giao dịch theo `"Thời gian"` hoặc `"Số dư biến động"` (`WalletTransactionTable.tsx:37–44, 57–63`).
- Bấm nút icon `"Xem chi tiết"` trên từng dòng giao dịch/minh chứng nạp tiền để điều hướng tới trang `/dashboard/payment?pid=...` (`WalletRowDetailAction.tsx:13–24`).
- Bấm link `"Xem minh chứng"` để mở xem file ảnh hoặc file PDF trong tab mới (`WalletProofTable.tsx:216–234`).
- Bấm `"Thử lại"` khi tải dữ liệu thất bại (`WalletTransactionList.tsx:69–71`, `WalletProofTable.tsx:100–107`).
- Bấm `"Xem tất cả giao dịch"` hoặc `"Xem tất cả ảnh minh chứng"` để đặt lại bộ lọc khi danh sách rỗng (`WalletTransactionList.tsx:86–88`, `WalletProofTable.tsx:130–138`).
- Chuyển trang qua thanh điều khiển phân trang `Pagination` (`WalletTransactionList.tsx:117–124`).

### Entry
- Menu tài khoản người dùng `UserMenu` trên Navbar: chọn mục `"Ví của tôi"` (`UserMenu.tsx:71`).
- Nút `"Về trang ví"` trên trang `/dashboard/payment` (`payment/page.tsx:47, 69, 98`).
- Nút `"Tạo yêu cầu nạp mới"` trên trang `/dashboard/payment` trỏ về `/dashboard/wallet?amount=${payment.amount}` (`payment/page.tsx:165`).
- Chuyển hướng tự động từ route cũ `/dashboard/payments` (`apps/web-1/app/dashboard/payments/page.tsx:10`).
- Nhập trực tiếp đường dẫn `/dashboard/wallet` trên trình duyệt (có thể kèm query param `?amount=...`).
- `[Assumption / Cần xác minh]` Bookmark trình duyệt hoặc liên kết gửi từ đội ngũ chăm sóc khách hàng.

### Exit / next step
- Sau khi bấm `"Tạo mã nạp tiền"` thành công trong modal: Chuyển hướng tới trang thanh toán nạp tiền `/dashboard/payment?pid=${result.depositId}` (nguồn: `WalletTopupModal.tsx:39`).
- Bấm icon chi tiết dòng nạp tiền: Chuyển hướng tới `/dashboard/payment?pid=${depositId}` (nguồn: `WalletRowDetailAction.tsx:14`, `depositDetailHref` trong `lib/deposit-display.ts:108`).
- Bấm `"Xem minh chứng"`: Mở link file ảnh/PDF trong tab trình duyệt mới (`WalletProofTable.tsx:222`).
- Điều hướng qua Navbar: Logo Nexus (`/dashboard`), Chuông thông báo (`NotificationBell`), Đổi giao diện (`ThemeToggler`), Menu người dùng (`UserMenu` trỏ tới `/dashboard`, `/dashboard/settings`, `/auth`).

### Product facts / constraints
- **Xác thực & Phân quyền:** Route `/dashboard/wallet` được bọc bởi `DashboardLayout`. Bắt buộc phải có phiên đăng nhập (`session`). Nếu chưa đăng nhập, hiển thị `LoadingScreen` ("Đang xác thực thông tin...") rồi chuyển hướng sang `/auth`. Nếu tài khoản có vai trò `admin` hoặc `supporter`, layout chặn hiển thị nội dung và chuyển hướng sang `/admin` hoặc `/supporter` (nguồn: `apps/web-1/app/dashboard/layout.tsx:14–47`).
- **Dọn dẹp Intent tồn đọng:** Khi component `WalletPage` được mount, hook `useEffect` gọi `clearAllBuyCreditAfterDepositIntents()` để xóa sạch toàn bộ intent mua credit đang lưu trong `sessionStorage` (nguồn: `apps/web-1/app/dashboard/wallet/page.tsx:20–22`).
- **Tự động mở modal từ URL query:** Trang đọc tham số URL `amount` (`searchParams.get("amount")`). Nếu tham số này tồn tại và là số hợp lệ, modal `WalletTopupModal` sẽ tự động mở sẵn khi tải trang và điền số tiền này vào ô nhập liệu (nguồn: `page.tsx:14–18, 52–56`).
- **Quy định số tiền nạp:** 
  - Số tiền nạp tối thiểu là 2,000 VND (`MIN_TOPUP_AMOUNT = 2000`).
  - Số tiền mặc định khi mở modal không kèm query param là 50,000 VND (`DEFAULT_TOPUP_AMOUNT = 50000`).
  - Bước nhảy (step) của ô nhập liệu là 1,000 VND.
  - Không cho phép nhập số âm (`allowNegative={false}`) và không cho phép số thập phân (`allowDecimal={false}`).
  - Nút `"Tạo mã nạp tiền"` bị vô hiệu hóa (`disabled`) nếu số tiền nhỏ hơn 2,000 VND hoặc mutation đang trong trạng thái chờ xử lý (`createDeposit.isPending`) (nguồn: `WalletTopupModal.tsx:14–15, 65–85`).
- **Cơ chế chống trùng lặp (Idempotency Key):** Mỗi lần mở modal nạp tiền, một UUID ngẫu nhiên mới được tạo tự động (`topupKey = crypto.randomUUID()`) và gắn vào payload của API `POST /deposits`. Nếu người dùng bấm nhiều lần trong cùng một lần mở modal, các request gửi đi sẽ chia sẻ chung một idempotency key để backend khử trùng lặp (nguồn: `WalletTopupModal.tsx:20–22, 28, 36`).
- **Dữ liệu số dư ví:** Gọi API `GET /wallet/balance` qua TanStack Query `useWalletBalance`. Dữ liệu được cấu hình tự động refetch theo chu kỳ 30 giây (`refetchInterval: 30_000`). Sau khi tạo mã nạp tiền thành công, query key `["wallet"]` và `["deposits"]` tự động bị invalidate để làm mới dữ liệu (nguồn: `useWallet.ts:18–27, 94–97`).
- **Lịch sử biến động số dư:** Gọi API `GET /wallet/history` qua `useWalletHistory`, phân trang 10 mục/trang (`limit = 10`), polling chu kỳ 30 giây. Hỗ trợ lọc theo `type` và sắp xếp theo trường `created_at` hoặc `amount` theo chiều `asc` hoặc `desc` (nguồn: `useWallet.ts:29–57`, `WalletTransactionList.tsx:16–28`).
- **Nhãn và màu sắc loại giao dịch:** 6 loại giao dịch được định nghĩa trong `wallet-transaction.types.ts:24–45`:
  - `deposit`: Nhãn `"Nạp tiền"`, màu badge `green`.
  - `withdrawal`: Nhãn `"Trừ ví"`, màu badge `red`.
  - `refund`: Nhãn `"Hoàn tiền"`, màu badge `blue`.
  - `adjustment`: Nhãn `"Điều chỉnh"`, màu badge `orange`.
  - `migration`: Nhãn `"Chuyển đổi"`, màu badge `orange`.
  - `service_payment`: Nhãn `"Mua dịch vụ"`, màu badge `orange`.
- **Làm sạch nội dung mô tả giao dịch:** Giao diện tự động cắt bỏ chuỗi số tiền VND dạng `(±X VND)` ở cuối trường `source_description` bằng biểu thức chính quy `/\s*\([+-]?\d[\d.,]*\s*VND\)\s*$/i` để tránh hiển thị trùng lặp số tiền với cột số dư biến động (nguồn: `WalletTransactionTable.tsx:88–91`, `WalletTransactionCardList.tsx:28–31`).
- **Định dạng hiển thị biến động số dư:** Nếu số tiền dương (`amount > 0`), chuỗi hiển thị có tiền tố `+`, định dạng VND phân tách hàng nghìn bằng dấu chấm và hiển thị màu xanh lá (`text-emerald-600 dark:text-emerald-400`). Nếu số tiền âm (`amount < 0`), hiển thị màu đỏ (`text-red-600 dark:text-red-400`). Nếu bằng 0, hiển thị màu văn bản mặc định (nguồn: `WalletTransactionTable.tsx:133–146`).
- **Điều kiện hiển thị nút chi tiết dòng (`WalletRowDetailAction`):**
  - Chỉ khi giao dịch có `source_type === "deposit"` hoặc `source_type === "topup"` và có `source_id`, nút mới trở thành link bấm được trỏ tới `/dashboard/payment?pid=${source_id}` kèm tooltip `"Xem chi tiết"`.
  - Với các giao dịch khác (như trừ ví thanh toán dịch vụ), nút bị vô hiệu hóa (`disabled`) kèm tooltip `"Thanh toán dịch vụ — không có ảnh chứng minh"` và thuộc tính `aria-label="Không có chi tiết nạp"` (nguồn: `WalletRowDetailAction.tsx:10–43`, `WalletTransactionTable.tsx:92–95`).
- **Danh sách ảnh minh chứng:** Gọi API `GET /deposits` với tham số cố định `limit: 20, offset: 0` qua `useMyDeposits`, polling chu kỳ 30 giây (nguồn: `useWallet.ts:71–80`).
- **Trạng thái ảnh minh chứng:** 4 trạng thái được xử lý trong `WalletProofTable.tsx:24–37`:
  - `pending`: Nhãn `"Đang chờ xác minh"`, màu badge `orange`.
  - `verified`: Nhãn `"Đã vào ví"`, màu badge `green`.
  - `rejected`: Nhãn `"Từ chối"`, màu badge `red`.
  - `amount_mismatch`: Nhãn `"Sai số tiền"`, màu badge `yellow`.
- **Hiển thị link file minh chứng:** Kiểm tra trường `proof_file_url`. Nếu file có đuôi `.pdf`, hiển thị icon tài liệu `FileText`; các định dạng khác hiển thị icon hình ảnh `ImageIcon`. Link hiển thị chữ `"Xem minh chứng"` kèm icon `ExternalLink` và mở trong tab mới (`target="_blank"`, `rel="noopener noreferrer"`). Nếu không có URL file, hiển thị dấu `—` (nguồn: `WalletProofTable.tsx:215–239, 319–341`).

---

## Layer 2: Interactive Inventory

### 2.1 Tiêu đề trang & Thao tác nạp tiền (`WalletPage`)

*Source: `apps/web-1/app/dashboard/wallet/page.tsx:31–38`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.header.title` | `header` > `h1` | Heading | Ví của tôi | — | default |
| `wallet.header.topupButton` | `header` > `Button` | CTA | Nạp tiền | Mở modal nạp tiền `WalletTopupModal` | default; icon `Plus` bên trái |

### 2.2 Thẻ số dư ví (`WalletBalanceCard`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletBalanceCard.tsx:7–39`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.balance.error` | Thẻ lỗi khi fetch thất bại > `p` | Error | Không thể tải số dư ví. Vui lòng thử lại sau. | — | hiển thị khi `isError === true` |
| `wallet.balance.label` | Khối số dư > `span` cạnh icon `Wallet` | Label | Số dư ví | — | default |
| `wallet.balance.loading` | Khối số dư > `Skeleton` | Description | — | — | hiển thị khi `isLoading === true`; `height={48}` |
| `wallet.balance.value` | Khối số dư > `p` | Item | `<code>{(data?.balance ?? 0).toLocaleString("vi-VN")}</code>` | — | hiển thị số dư nguyên dạng số tiếng Việt |
| `wallet.balance.currency` | Khối số dư > `p` > `span` | Item | VND | — | đơn vị tiền tệ cố định |

### 2.3 Modal nạp tiền vào ví (`WalletTopupModal`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletTopupModal.tsx:56–96` & `apps/web-1/app/dashboard/wallet/hooks/useWallet.ts:98–105`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.topupModal.title` | `Modal` > `title` > `Text` | Heading | Nạp tiền vào ví | — | modal mở (`opened={true}`) |
| `wallet.topupModal.amountInput.label` | `Stack` > `NumberInput` | Label | Số tiền (VND) | Nhập số tiền muốn nạp | default; `min={2000}`, `step={1000}` |
| `wallet.topupModal.amountInput.description` | `Stack` > `NumberInput` | Helper | Tối thiểu 2,000 VND | — | default |
| `wallet.topupModal.cancelButton` | `Group` > `Button` (variant="default") | CTA | Hủy | Đóng modal và đặt lại số tiền về 50,000 VND (`handleCloseAndReset`) | default |
| `wallet.topupModal.submitButton` | `Group` > `Button` | CTA | Tạo mã nạp tiền | Gửi request `POST /deposits`; thành công đóng modal và điều hướng sang `/dashboard/payment?pid=${depositId}` | `disabled` khi `amount < 2000` hoặc mutation đang pending; hiển thị trạng thái `loading` khi đang tạo |
| `wallet.topupModal.errorText` | `Stack` > `Text` (c="red") | Error | `<code>{(createDeposit.error as ...).message || "Đã xảy ra lỗi."}</code>` | — | hiển thị dưới nút bấm khi `createDeposit.isError === true` |
| `wallet.topupModal.errorToast.title` | `notifications.show` | Toast | Tạo mã nạp tiền thất bại | Toast thông báo hệ thống | kích hoạt khi gọi API `POST /deposits` thất bại |
| `wallet.topupModal.errorToast.message` | `notifications.show` | Toast | `<code>error?.response?.data?.message || "Vui lòng thử lại sau."</code>` | Toast thông báo hệ thống | nội dung lỗi trả về từ server hoặc fallback mặc định |

### 2.4 Tab chuyển đổi nội dung (`WalletTabsList`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletTabsList.tsx:5–11`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.tabs.history` | `Tabs.List` > `Tabs.Tab` (value="history") | Navigation | Lịch sử giao dịch | Chuyển panel sang danh sách lịch sử giao dịch | tab mặc định (`defaultValue="history"`) |
| `wallet.tabs.proofs` | `Tabs.List` > `Tabs.Tab` (value="proofs") | Navigation | Ảnh minh chứng | Chuyển panel sang danh sách ảnh minh chứng đã gửi | tab phụ |

### 2.5 Bộ lọc & Thanh công cụ lịch sử giao dịch (`WalletTransactionFilters`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletTransactionFilters.tsx:21–46` & `_components/wallet-transaction.types.ts:24–45`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.history.filters.typeSelect.ariaLabel` | `Group` > `Select` | Aria-label | Lọc theo loại giao dịch | — | default |
| `wallet.history.filters.typeSelect.placeholder` | `Group` > `Select` | Placeholder | Tất cả giao dịch | Xóa bộ lọc hoặc chọn loại giao dịch cần lọc | hiển thị khi `selectedType === null`; `clearable={true}` |
| `wallet.history.filters.typeOption.deposit` | `Select` > dropdown option `deposit` | Item | Nạp tiền | Lọc các giao dịch có `type === "deposit"` | option trong dropdown |
| `wallet.history.filters.typeOption.withdrawal` | `Select` > dropdown option `withdrawal` | Item | Trừ ví | Lọc các giao dịch có `type === "withdrawal"` | option trong dropdown |
| `wallet.history.filters.typeOption.refund` | `Select` > dropdown option `refund` | Item | Hoàn tiền | Lọc các giao dịch có `type === "refund"` | option trong dropdown |
| `wallet.history.filters.typeOption.adjustment` | `Select` > dropdown option `adjustment` | Item | Điều chỉnh | Lọc các giao dịch có `type === "adjustment"` | option trong dropdown |
| `wallet.history.filters.typeOption.migration` | `Select` > dropdown option `migration` | Item | Chuyển đổi | Lọc các giao dịch có `type === "migration"` | option trong dropdown |
| `wallet.history.filters.typeOption.servicePayment` | `Select` > dropdown option `service_payment` | Item | Mua dịch vụ | Lọc các giao dịch có `type === "service_payment"` | option trong dropdown |
| `wallet.history.filters.refreshButton` | `Group` > `Button` (variant="subtle") | CTA | Làm mới | Gọi hàm `refetch()` làm mới danh sách giao dịch | default; hiển thị trạng thái `loading` khi `isFetching === true` |

### 2.6 Các trạng thái danh sách lịch sử giao dịch (`WalletTransactionList`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletTransactionList.tsx:57–126`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.history.loading` | Danh sách lịch sử > 5 `Skeleton` bars | Description | — | — | hiển thị khi `isLoading === true`; 5 thanh skeleton cao 38px |
| `wallet.history.error.text` | Khối lỗi tải lịch sử > `Text` | Error | Không thể tải lịch sử giao dịch. | — | hiển thị khi `isError === true` |
| `wallet.history.error.retryButton` | Khối lỗi tải lịch sử > `Button` | CTA | Thử lại | Gọi `refetch()` để tải lại dữ liệu lịch sử | hiển thị khi `isError === true` |
| `wallet.history.empty.title` | Khối trống không có bộ lọc > `Text` (fw={500}) | Empty state | Chưa có giao dịch nào | — | hiển thị khi `total === 0` và không có bộ lọc type (`!effectiveType`) |
| `wallet.history.empty.description` | Khối trống không có bộ lọc > `Text` (c="dimmed") | Description | Các biến động số dư ví sẽ được ghi nhận tại đây. | — | hiển thị khi `total === 0` và không có bộ lọc type |
| `wallet.history.filteredEmpty.title` | Khối trống khi đang lọc > `Text` (fw={500}) | Empty state | Không có giao dịch phù hợp | — | hiển thị khi `total === 0` và đang có bộ lọc type (`effectiveType != null`) |
| `wallet.history.filteredEmpty.description` | Khối trống khi đang lọc > `Text` (c="dimmed") | Description | Thử chuyển bộ lọc để tìm kiếm các giao dịch khác. | — | hiển thị khi `total === 0` và đang có bộ lọc type |
| `wallet.history.filteredEmpty.resetButton` | Khối trống khi đang lọc > `Button` | CTA | Xem tất cả giao dịch | Đặt lại bộ lọc loại giao dịch về `null` (`handleTypeChange(null)`) | hiển thị khi `total === 0` và đang có bộ lọc type |
| `wallet.history.footer.count` | Footer bảng lịch sử > `Text` (c="dimmed") | Item | `<code>Hiển thị {transactions.length} trên tổng số {total.toLocaleString("vi-VN")} giao dịch</code>` | — | hiển thị khi `total > 0` |
| `wallet.history.footer.pagination` | Footer bảng lịch sử > `Pagination` | Navigation | `<code>{page}</code>` | Chuyển sang trang giao dịch được chọn | hiển thị khi `totalPages > 1` (`Math.ceil(total / 10) > 1`) |

### 2.7 Bảng lịch sử giao dịch - Desktop (`WalletTransactionTable`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletTransactionTable.tsx:33–165`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.history.table.th.createdAt` | `Table.Thead` > `Table.Th` (cột 1) | Heading | `<code>Thời gian {renderSortIndicator("created_at")}</code>` | Bấm để đổi chiều sắp xếp theo ngày tạo (mặc định desc sang asc hoặc ngược lại) | hiển thị chỉ báo `↕` khi chưa chọn, `↑` khi asc, `↓` khi desc |
| `wallet.history.table.th.type` | `Table.Thead` > `Table.Th` (cột 2) | Heading | Loại | — | default |
| `wallet.history.table.th.description` | `Table.Thead` > `Table.Th` (cột 3) | Heading | Nội dung giao dịch | — | default |
| `wallet.history.table.th.amount` | `Table.Thead` > `Table.Th` (cột 4) | Heading | `<code>Số dư biến động {renderSortIndicator("amount")}</code>` | Bấm để sắp xếp theo số tiền biến động (mặc định desc sang asc hoặc ngược lại) | căn phải; hiển thị chỉ báo `↕`, `↑` hoặc `↓` |
| `wallet.history.table.th.balanceAfter` | `Table.Thead` > `Table.Th` (cột 5) | Heading | Số dư sau giao dịch | — | căn phải |
| `wallet.history.table.th.action` | `Table.Thead` > `Table.Th` (cột 6) | Heading | Chi tiết | — | căn giữa |
| `wallet.history.table.row.date` | `Table.Tbody` > `Table.Tr` > cột Thời gian > `Text` | Item | `<code>{date}</code>` | — | định dạng ngày `DD/MM/YYYY` qua hàm `formatDateTime` |
| `wallet.history.table.row.time` | `Table.Tbody` > `Table.Tr` > cột Thời gian > `Text` (c="dimmed") | Item | `<code>{time}</code>` | — | định dạng giờ phút `HH:mm` qua hàm `formatDateTime` |
| `wallet.history.table.row.typeBadge` | `Table.Tbody` > `Table.Tr` > cột Loại > `Badge` | Badge | `<code>{typeLabel}</code>` | — | hiển thị nhãn loại giao dịch ("Nạp tiền", "Trừ ví", "Hoàn tiền", "Điều chỉnh", "Chuyển đổi", "Mua dịch vụ") |
| `wallet.history.table.row.description` | `Table.Tbody` > `Table.Tr` > cột Nội dung > `Text` | Description | `<code>{description}</code>` | — | nội dung mô tả giao dịch đã qua regex làm sạch chuỗi số tiền VND ở đuôi |
| `wallet.history.table.row.amountPositive` | `Table.Tbody` > `Table.Tr` > cột Biến động > `span` (emerald) | Item | `<code>+{formatVND(tx.amount)}</code>` | — | hiển thị khi `tx.amount > 0`; màu xanh lá `text-emerald-600` |
| `wallet.history.table.row.amountNegative` | `Table.Tbody` > `Table.Tr` > cột Biến động > `span` (red) | Item | `<code>{formatVND(tx.amount)}</code>` | — | hiển thị khi `tx.amount < 0`; màu đỏ `text-red-600` (đã có sẵn dấu trừ từ số âm) |
| `wallet.history.table.row.amountZero` | `Table.Tbody` > `Table.Tr` > cột Biến động > `span` | Item | `<code>{formatVND(tx.amount)}</code>` | — | hiển thị khi `tx.amount === 0`; màu chữ thông thường |
| `wallet.history.table.row.balanceAfterValue` | `Table.Tbody` > `Table.Tr` > cột Số dư sau > `Text` | Item | `<code>{formatVND(tx.balance_after)}</code>` | — | hiển thị khi `tx.balance_after != null` |
| `wallet.history.table.row.balanceAfterEmpty` | `Table.Tbody` > `Table.Tr` > cột Số dư sau > `Text` | Item | — | — | hiển thị khi `tx.balance_after == null` |
| `wallet.history.table.row.action` | `Table.Tbody` > `Table.Tr` > cột Chi tiết | CTA | *(Icon MoreVertical)* | Xem chi tiết hoặc bị vô hiệu hóa qua `WalletRowDetailAction` | căn giữa |

### 2.8 Danh sách thẻ lịch sử giao dịch - Mobile (`WalletTransactionCardList`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletTransactionCardList.tsx:22–89`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.history.card.typeBadge` | Thẻ mobile > `Badge` | Badge | `<code>{typeLabel}</code>` | — | nhãn loại giao dịch tương ứng |
| `wallet.history.card.datetime` | Thẻ mobile > `span` cạnh badge | Item | `<code>{time} · {date}</code>` | — | thời gian giao dịch dạng `HH:mm · DD/MM/YYYY` |
| `wallet.history.card.description` | Thẻ mobile > `Text` | Description | `<code>{description}</code>` | — | mô tả giao dịch đã làm sạch |
| `wallet.history.card.action` | Thẻ mobile > khối action | CTA | *(Icon MoreVertical)* | Nút xem chi tiết qua `WalletRowDetailAction` | default hoặc disabled |
| `wallet.history.card.balanceAfter` | Thẻ mobile > `Text` (c="dimmed") | Item | `<code>Số dư sau giao dịch: {formatVND(tx.balance_after)}</code>` | — | hiển thị khi `tx.balance_after != null` |
| `wallet.history.card.amountPositive` | Thẻ mobile > khối số tiền > `span` (emerald) | Item | `<code>+{formatVND(tx.amount)}</code>` | — | hiển thị khi `tx.amount > 0` |
| `wallet.history.card.amountOther` | Thẻ mobile > khối số tiền > `span` | Item | `<code>{formatVND(tx.amount)}</code>` | — | hiển thị khi `tx.amount <= 0` |

### 2.9 Nút thao tác chi tiết dòng giao dịch (`WalletRowDetailAction`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletRowDetailAction.tsx:7–43`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.rowAction.viewDetail.tooltip` | `Tooltip` khi có `href` | Helper | Xem chi tiết | Tooltip giải thích khi hover nút | hiển thị khi `href` hợp lệ (giao dịch nạp tiền có `source_id`) |
| `wallet.rowAction.viewDetail.ariaLabel` | `ActionIcon` khi có `href` | Aria-label | Xem chi tiết | Điều hướng tới `/dashboard/payment?pid=${depositId}` | link component `Link` |
| `wallet.rowAction.disabled.tooltip` | `Tooltip` khi không có `href` | Helper | Thanh toán dịch vụ — không có ảnh chứng minh | Tooltip giải thích lý do nút bị disable khi hover | hiển thị khi `href === null` (giao dịch không phải nạp tiền) |
| `wallet.rowAction.disabled.ariaLabel` | `ActionIcon` khi không có `href` | Aria-label | Không có chi tiết nạp | — | `disabled={true}` |

### 2.10 Bộ lọc & Thanh công cụ danh sách ảnh minh chứng (`WalletProofTable`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletProofTable.tsx:56–86`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.proofs.filters.statusSelect.ariaLabel` | `Group` > `Select` | Aria-label | Lọc theo trạng thái | — | default |
| `wallet.proofs.filters.statusSelect.placeholder` | `Group` > `Select` | Placeholder | Tất cả trạng thái | — | `clearable={false}`; giá trị mặc định là `"all"` |
| `wallet.proofs.filters.statusOption.all` | `Select` > option `all` | Item | Tất cả trạng thái | Hiển thị toàn bộ ảnh minh chứng không lọc theo trạng thái | option mặc định |
| `wallet.proofs.filters.statusOption.pending` | `Select` > option `pending` | Item | Đang chờ xác minh | Lọc các yêu cầu nạp có trạng thái `pending` | option dropdown |
| `wallet.proofs.filters.statusOption.verified` | `Select` > option `verified` | Item | Đã vào ví | Lọc các yêu cầu nạp có trạng thái `verified` | option dropdown |
| `wallet.proofs.filters.statusOption.rejected` | `Select` > option `rejected` | Item | Từ chối | Lọc các yêu cầu nạp có trạng thái `rejected` | option dropdown |
| `wallet.proofs.filters.statusOption.amountMismatch` | `Select` > option `amount_mismatch` | Item | Sai số tiền | Lọc các yêu cầu nạp có trạng thái `amount_mismatch` | option dropdown |
| `wallet.proofs.filters.refreshButton` | `Group` > `Button` (variant="subtle") | CTA | Làm mới | Gọi `refetch()` làm mới danh sách ảnh minh chứng | default; hiển thị `loading` khi `isFetching === true` |

### 2.11 Các trạng thái danh sách ảnh minh chứng (`WalletProofTable`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletProofTable.tsx:88–140, 359–366`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.proofs.loading` | Danh sách minh chứng > 5 `Skeleton` bars | Description | — | — | hiển thị khi `isLoading === true`; 5 thanh skeleton cao 38px |
| `wallet.proofs.error.text` | Khối lỗi tải minh chứng > `Text` | Error | Không thể tải danh sách ảnh minh chứng. | — | hiển thị khi `isError === true` |
| `wallet.proofs.error.retryButton` | Khối lỗi tải minh chứng > `Button` | CTA | Thử lại | Gọi `refetch()` để tải lại danh sách minh chứng | hiển thị khi `isError === true` |
| `wallet.proofs.empty.title` | Khối trống không có dữ liệu > `Text` (fw={500}) | Empty state | Chưa có ảnh minh chứng đã gửi | — | hiển thị khi tổng số `deposits.length === 0` |
| `wallet.proofs.empty.description` | Khối trống không có dữ liệu > `Text` (c="dimmed") | Description | Các giao dịch nạp tiền có gửi ảnh chứng minh sẽ hiển thị tại đây. | — | hiển thị khi `deposits.length === 0` |
| `wallet.proofs.filteredEmpty.title` | Khối trống khi lọc không ra kết quả > `Text` (fw={500}) | Empty state | Không có ảnh minh chứng phù hợp | — | hiển thị khi `filteredDeposits.length === 0` nhưng `deposits.length > 0` |
| `wallet.proofs.filteredEmpty.description` | Khối trống khi lọc không ra kết quả > `Text` (c="dimmed") | Description | Thử chuyển bộ lọc để tìm kiếm các ảnh minh chứng khác. | — | hiển thị khi `filteredDeposits.length === 0` |
| `wallet.proofs.filteredEmpty.resetButton` | Khối trống khi lọc không ra kết quả > `Button` | CTA | Xem tất cả ảnh minh chứng | Đặt lại trạng thái lọc về `"all"` (`setStatusFilter("all")`) | hiển thị khi `filteredDeposits.length === 0` |
| `wallet.proofs.footer.countFiltered` | Footer danh sách minh chứng > `Text` (c="dimmed") | Item | `<code>Hiển thị {filteredDeposits.length} trên tổng số {deposits.length} ảnh minh chứng</code>` | — | hiển thị khi có bộ lọc trạng thái kích hoạt (`hasActiveFilter === true`) |
| `wallet.proofs.footer.countAll` | Footer danh sách minh chứng > `Text` (c="dimmed") | Item | `<code>Hiển thị {deposits.length} ảnh minh chứng gần nhất</code>` | — | hiển thị khi xem toàn bộ không lọc (`hasActiveFilter === false`) |

### 2.12 Bảng ảnh minh chứng - Desktop (`WalletProofTable`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletProofTable.tsx:143–282`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.proofs.table.th.createdAt` | `Table.Thead` > `Table.Th` (cột 1) | Heading | Thời gian | — | default |
| `wallet.proofs.table.th.transferContent` | `Table.Thead` > `Table.Th` (cột 2) | Heading | Mã chuyển khoản | — | default |
| `wallet.proofs.table.th.proofFile` | `Table.Thead` > `Table.Th` (cột 3) | Heading | Ảnh minh chứng | — | default |
| `wallet.proofs.table.th.status` | `Table.Thead` > `Table.Th` (cột 4) | Heading | Trạng thái | — | default |
| `wallet.proofs.table.th.amount` | `Table.Thead` > `Table.Th` (cột 5) | Heading | Số tiền nạp | — | căn phải |
| `wallet.proofs.table.th.action` | `Table.Thead` > `Table.Th` (cột 6) | Heading | Chi tiết | — | căn giữa |
| `wallet.proofs.table.row.date` | `Table.Tbody` > `Table.Tr` > cột Thời gian > `Text` | Item | `<code>{date}</code>` | — | định dạng ngày `DD/MM/YYYY` |
| `wallet.proofs.table.row.time` | `Table.Tbody` > `Table.Tr` > cột Thời gian > `Text` (c="dimmed") | Item | `<code>{time}</code>` | — | định dạng giờ phút `HH:mm` |
| `wallet.proofs.table.row.transferContent` | `Table.Tbody` > `Table.Tr` > cột Mã chuyển khoản > `Text` | Item | `<code>{deposit.transfer_content}</code>` | — | hiển thị mã chuyển khoản dạng font mono (ví dụ: `CRTOPUPxxxxxx`) |
| `wallet.proofs.table.row.proofLink` | `Table.Tbody` > `Table.Tr` > cột Ảnh minh chứng > `a` > `span` | CTA | Xem minh chứng | Mở URL file ảnh/PDF trong tab trình duyệt mới (`target="_blank"`) | hiển thị khi `deposit.proof_file_url` tồn tại; icon `FileText` (nếu đuôi `.pdf`) hoặc `ImageIcon`, kèm icon `ExternalLink` |
| `wallet.proofs.table.row.proofEmpty` | `Table.Tbody` > `Table.Tr` > cột Ảnh minh chứng > `Text` (c="dimmed") | Item | — | — | hiển thị khi `deposit.proof_file_url` không có giá trị |
| `wallet.proofs.table.row.statusBadge` | `Table.Tbody` > `Table.Tr` > cột Trạng thái > `Badge` | Badge | `<code>{statusInfo.label}</code>` | — | hiển thị nhãn trạng thái ("Đang chờ xác minh", "Đã vào ví", "Từ chối", "Sai số tiền") kèm màu tương ứng |
| `wallet.proofs.table.row.amount` | `Table.Tbody` > `Table.Tr` > cột Số tiền nạp > `span` | Item | `<code>{formatVND(deposit.amount)}</code>` | — | số tiền nạp định dạng VND kèm dấu phân cách hàng nghìn |
| `wallet.proofs.table.row.action` | `Table.Tbody` > `Table.Tr` > cột Chi tiết | CTA | *(Icon MoreVertical)* | Nút điều hướng tới `/dashboard/payment?pid=${deposit.id}` qua `WalletRowDetailAction` | căn giữa |

### 2.13 Danh sách thẻ ảnh minh chứng - Mobile (`WalletProofTable`)

*Source: `apps/web-1/app/dashboard/wallet/_components/WalletProofTable.tsx:285–356`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wallet.proofs.card.statusBadge` | Thẻ mobile minh chứng > `Badge` | Badge | `<code>{statusInfo.label}</code>` | — | nhãn trạng thái tương ứng |
| `wallet.proofs.card.datetime` | Thẻ mobile minh chứng > `span` cạnh badge | Item | `<code>{time} · {date}</code>` | — | thời gian tạo yêu cầu nạp dạng `HH:mm · DD/MM/YYYY` |
| `wallet.proofs.card.transferContent` | Thẻ mobile minh chứng > `Text` | Item | `<code>{deposit.transfer_content}</code>` | — | mã chuyển khoản dạng font mono |
| `wallet.proofs.card.proofLink` | Thẻ mobile minh chứng > `a` > `span` | CTA | Xem minh chứng | Mở URL file ảnh/PDF trong tab trình duyệt mới | hiển thị khi có `proof_file_url` |
| `wallet.proofs.card.action` | Thẻ mobile minh chứng > khối action | CTA | *(Icon MoreVertical)* | Nút điều hướng tới `/dashboard/payment?pid=${deposit.id}` qua `WalletRowDetailAction` | default |
| `wallet.proofs.card.amount` | Thẻ mobile minh chứng > khối số tiền > `span` | Item | `<code>{formatVND(deposit.amount)}</code>` | — | số tiền nạp định dạng VND |

---

## Layer 3: Page Notes

### Biến thể thuật ngữ quan sát được
- **Ví & Số dư:**
  - `Ví của tôi`: Xuất hiện tại tiêu đề chính trang `WalletPage` (`page.tsx:33`), tiêu đề menu điều hướng `UserMenu` (`UserMenu.tsx:71`), và hằng số cấu hình copy `WALLET_COPY.pageTitle` (`deposit-display.ts:2`).
  - `Số dư ví`: Xuất hiện tại nhãn của thẻ số dư chính (`WalletBalanceCard.tsx:26`), thông báo lỗi tải số dư ("Không thể tải số dư ví. Vui lòng thử lại sau."), và popover người dùng trên Header (`UserMenu.tsx:117`).
  - `Số dư sau giao dịch`: Xuất hiện tại tiêu đề cột 5 bảng lịch sử desktop (`WalletTransactionTable.tsx:70`) và tiền tố hiển thị trên thẻ mobile (`WalletTransactionCardList.tsx:68`).
  - `Số dư biến động`: Xuất hiện tại tiêu đề cột 4 bảng lịch sử desktop (`WalletTransactionTable.tsx:61`).
- **Thao tác nạp tiền:**
  - `Nạp tiền`: Xuất hiện trên nút CTA chính của trang (`page.tsx:36`).
  - `Nạp tiền vào ví`: Xuất hiện tại tiêu đề modal nạp tiền (`WalletTopupModal.tsx:59`).
  - `Tạo mã nạp tiền`: Xuất hiện trên nút xác nhận gửi yêu cầu trong modal (`WalletTopupModal.tsx:86`).
  - `Tạo mã nạp tiền thất bại`: Xuất hiện tại tiêu đề toast thông báo lỗi (`useWallet.ts:100`).
  - `Số tiền nạp`: Xuất hiện tại tiêu đề cột 5 bảng ảnh minh chứng (`WalletProofTable.tsx:171`).
  - `Tạo yêu cầu nạp mới` & `Nạp tiền qua chuyển khoản`: Định nghĩa trong hằng số `WALLET_COPY` tại `lib/deposit-display.ts:4, 25` được dùng ở trang payment.
- **Tài liệu & Chứng từ thanh toán:**
  - `Ảnh minh chứng`: Dùng làm tên tab 2 (`WalletTabsList.tsx:9`), tiêu đề cột 3 bảng desktop (`WalletProofTable.tsx:161`), và câu thống kê footer (`WalletProofTable.tsx:363–364`).
  - `ảnh chứng minh`: Dùng trong mô tả trạng thái rỗng ("Các giao dịch nạp tiền có gửi ảnh chứng minh sẽ hiển thị tại đây." - `WalletProofTable.tsx:117`) và tooltip khi nút action bị disabled ("Thanh toán dịch vụ — không có ảnh chứng minh" - `WalletRowDetailAction.tsx:29`).
  - `Xem minh chứng`: Dùng làm nhãn của liên kết mở file đính kèm (`WalletProofTable.tsx:232, 337`).
- **Các phân loại giao dịch (Transaction Types):**
  - Hệ thống sử dụng 6 loại giao dịch với nhãn hiển thị: `deposit` ("Nạp tiền"), `withdrawal` ("Trừ ví"), `refund` ("Hoàn tiền"), `adjustment` ("Điều chỉnh"), `migration` ("Chuyển đổi"), `service_payment` ("Mua dịch vụ") (`wallet-transaction.types.ts:24–31`).
- **Các trạng thái xét duyệt nạp tiền (Deposit Statuses):**
  - Trong `WalletProofTable`:
    - `pending`: Hiển thị nhãn `"Đang chờ xác minh"` (màu `orange`).
    - `verified`: Hiển thị nhãn `"Đã vào ví"` (màu `green`).
    - `rejected`: Hiển thị nhãn `"Từ chối"` (màu `red`).
    - `amount_mismatch`: Hiển thị nhãn `"Sai số tiền"` (màu `yellow`).
  - Trong `lib/deposit-display.ts` (dùng ở trang payment chi tiết):
    - `amount_mismatch`: Nhãn `"Số tiền chưa khớp"`.
    - `rejected`: Nhãn `"Cần xử lý lại"`.
    - `verified`: Nhãn `"Đã cộng vào ví"`.
    - `pending` (chưa có proof): Nhãn `"Cần bổ sung chứng minh"`.
    - `pending` (đã có proof): Nhãn `"Đang chờ xác minh"`.

### Hiện trạng kỹ thuật quan sát được
- **Cơ chế chuyển tab:** `WalletPage` sử dụng Mantine `Tabs` với `variant="pills"` và `defaultValue="history"`. Component `WalletTabsList` được mount bên trong thanh filter của cả hai component con (`WalletTransactionFilters` và `WalletProofTable`) để tab list và bộ lọc hiển thị cùng một hàng ngang trên giao diện desktop.
- **Khử trùng lặp Idempotency:** State `topupKey` trong `WalletTopupModal` khởi tạo một `crypto.randomUUID()` duy nhất cho mỗi vòng đời mở modal (`useEffect` khi `opened` thay đổi). `submittingRef.current` và `createDeposit.isPending` được dùng song song để chặn double-submit ngay tại client-side.
- **Điều hướng sau khi tạo mã nạp:** Khi mutation `createDeposit` thành công, callback `onSuccess` thực hiện đồng thời: đóng modal (`onClose()`) và điều hướng `router.push('/dashboard/payment?pid=${result.depositId}')`. Trang payment đích sẽ chịu trách nhiệm hiển thị mã VietQR, số tài khoản nhận tiền và form đính kèm ảnh chuyển khoản.
- **Tự động dọn dẹp Intent:** `WalletPage` gọi `clearAllBuyCreditAfterDepositIntents()` trong `useEffect` khi mount. Hàm này duyệt toàn bộ key trong `sessionStorage` bắt đầu bằng prefix `buyCreditAfterDeposit:` và xóa bỏ chúng, tránh việc người dùng quay lại trang ví mà vẫn còn lưu intent mua credit dang dở từ phiên trước.
- **Polling dữ liệu ngầm:** Cả 3 query `useWalletBalance`, `useWalletHistory`, và `useMyDeposits` đều cấu hình `refetchInterval: 30_000` (tự động fetch lại sau mỗi 30 giây) để cập nhật biến động số dư mà không cần người dùng tải lại trang thủ công.
- **Hành vi xử lý chuỗi mô tả:** `WalletTransactionTable` và `WalletTransactionCardList` sử dụng biểu thức chính quy `/\s*\([+-]?\d[\d.,]*\s*VND\)\s*$/i` để loại bỏ chuỗi số tiền kèm đơn vị VND nằm trong ngoặc đơn ở cuối trường `source_description` trả về từ API, tránh tình trạng hiển thị trùng lặp với cột số dư biến động.
- **Logic nút xem chi tiết (`WalletRowDetailAction`):** Nút này chỉ mở ra trang `/dashboard/payment?pid=...` khi giao dịch là loại nạp (`source_type === "deposit"` hoặc `source_type === "topup"`) và có `source_id`. Mọi giao dịch khác (như trừ ví mua dịch vụ, hoàn tiền, điều chỉnh) đều bị vô hiệu hóa kèm tooltip cố định mang nội dung *"Thanh toán dịch vụ — không có ảnh chứng minh"*.

### Điểm chưa xác minh (Unknowns / Questions)
- **Về các gói nạp tiền (Top-up Packages):** Trong yêu cầu nhiệm vụ có đề cập đến *"các gói nạp tiền"*, tuy nhiên mã nguồn thực tế tại `WalletTopupModal.tsx` chỉ cung cấp duy nhất một ô nhập số tiền tùy ý (`NumberInput`) với giá trị mặc định là 50,000 VND và tối thiểu 2,000 VND, hoàn toàn không có danh sách các gói nạp định sẵn (ví dụ các nút chọn nhanh 50k, 100k, 200k, 500k). Cần làm rõ với Product Owner/Design team xem có kế hoạch phát triển các preset gói nạp trong tương lai hay không.
- **Giới hạn số lượng bản ghi ảnh minh chứng:** `WalletProofTable` gọi API `useMyDeposits` với tham số cố định `limit: 20, offset: 0` mà không có thanh phân trang (`Pagination`) như bảng lịch sử giao dịch. Nếu một người dùng thực hiện nạp tiền nhiều hơn 20 lần, các ảnh minh chứng thứ 21 trở đi sẽ không thể xem được trên tab này.
- **Độ chính xác của Tooltip nút chi tiết bị vô hiệu hóa:** Đối với các giao dịch có `type` là `refund` (hoàn tiền), `adjustment` (điều chỉnh thủ công từ admin) hoặc `migration` (chuyển đổi hệ thống cũ), nút chi tiết vẫn hiển thị tooltip *"Thanh toán dịch vụ — không có ảnh chứng minh"*. Tooltip này có thể gây hiểu nhầm về bản chất của giao dịch đối với các loại không phải là thanh toán dịch vụ.
- **Quy tắc hiển thị bộ lọc loại giao dịch:** Danh sách tùy chọn `TYPE_OPTIONS` hiển thị cả 6 loại giao dịch (`deposit`, `withdrawal`, `refund`, `adjustment`, `migration`, `service_payment`). Cần xác minh xem người dùng sinh viên thông thường có bao giờ gặp các loại như `adjustment` hoặc `migration` trong thực tế hay đây chỉ là các loại giao dịch kỹ thuật nội bộ.
