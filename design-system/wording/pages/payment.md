# Page: Chi tiết nạp tiền (Payment)

## Layer 1: Page Context

- **Route:** `/dashboard/payment` (nhận tham số truy vấn `?pid=<depositId>`)
- **Access:** `Authenticated (Sinh viên / Student)`. Route nằm trong nhóm route bảo vệ được bọc bởi `DashboardLayout` (`apps/web-1/app/dashboard/layout.tsx:14–47`). Khi session đang tải, hiển thị `LoadingScreen` ("Đang xác thực thông tin..."). Nếu chưa đăng nhập, chuyển hướng sang `/auth`. Nếu tài khoản có vai trò `admin` hoặc `supporter`, layout chặn hiển thị và tự động chuyển hướng về `/admin` hoặc `/supporter`.
- **User:**
  - **Primary user:** Sinh viên đại học đang thực hiện nạp tiền vào ví tài khoản Nexus Platform hoặc thanh toán thiếu credit cho hồ sơ đề án khởi nghiệp.
  - **Typical state:** Vừa tạo yêu cầu nạp tiền chuyển khoản ngân hàng qua VietQR, đang thực hiện quét mã / chuyển khoản từ ứng dụng ngân hàng, hoặc quay lại kiểm tra trạng thái xác thực giao dịch và bổ sung ảnh chụp biên lai (`[Assumption / Cần xác minh]`).
  - **Knowledge level:** Biết cách chuyển khoản qua app ngân hàng / Mobile Banking; có thể chưa rõ quy trình đối soát tự động qua SePay webhook hay đối soát thủ công bởi quản trị viên (`[Assumption / Cần xác minh]`).
- **User goals:**
  - Xem thông tin tài khoản thụ hưởng (Ngân hàng, Số tài khoản, Chủ tài khoản) và quét mã VietQR để chuyển tiền chính xác.
  - Kiểm tra nội dung chuyển khoản bắt buộc để hệ thống tự động nhận diện giao dịch.
  - Theo dõi trạng thái yêu cầu nạp tiền (Chờ xác minh, Đã cộng vào ví, Cần bổ sung chứng minh, Số tiền chưa khớp, Cần xử lý lại).
  - Tải lên hoặc dán ảnh chụp màn hình biên lai chuyển khoản (bằng chứng thanh toán) từ clipboard (`Ctrl+V`) khi số dư chưa tự động cập nhật.
  - Xem lại ảnh biên lai đã gửi ở kích thước đầy đủ qua modal xem trước.
- **Business / Product goals:**
  - Cung cấp giao diện trung gian hỗ trợ thanh toán nạp tiền bằng cổng chuyển khoản ngân hàng SePay VietQR (nguồn: `apps/web-1/app/dashboard/payment/_components/PaymentBankInfo.tsx:16–38`).
  - Giảm thiểu sai sót khi chuyển khoản thông qua hiển thị rõ ràng mã QR động và nội dung chuyển khoản được định dạng font đơn cách (monospace).
  - Thu thập bằng chứng thanh toán (minh chứng chuyển khoản) của sinh viên trong trường hợp giao dịch chưa được webhook tự động kích hoạt, phục vụ quản trị viên kiểm tra thủ công tại `/admin` (nguồn: `apps/web-1/app/dashboard/payment/hooks/usePayment.ts:44–75`, `AdminDepositVerificationTable.tsx`).
  - Tự động hoàn tất mua credit cho hồ sơ (`useFulfillCreditAfterDeposit`) khi tiền vào ví thành công nếu giao dịch bắt nguồn từ luồng mua thiếu credit ở màn hình hồ sơ (nguồn: `apps/web-1/app/dashboard/payment/hooks/use-fulfill-credit-after-deposit.ts:27–83`).
- **Primary action:**
  - Trạng thái `pending` chưa có biên lai: Quét mã QR chuyển khoản → Tải lên / Dán ảnh chụp biên lai → Bấm *"Thêm ảnh chứng minh"* (nguồn: `apps/web-1/app/dashboard/payment/_components/ProofUpload.tsx:73–133`).
  - Trạng thái `verified`: Xem trạng thái tiền đã vào số dư ví → Bấm *"Quay lại hồ sơ"* hoặc *"Về trang ví"* (hoặc đợi hệ thống tự động chuyển hướng sau 5 giây nếu có intent mua credit) (nguồn: `page.tsx:93–110`, `use-fulfill-credit-after-deposit.ts:58–60`).
- **Secondary actions:**
  - Bấm nút quay lại đầu trang (`ArrowLeft`): Điều hướng về `/dashboard/case/[caseId]` (nếu có intent mua credit) hoặc `/dashboard/wallet` (nguồn: `page.tsx:103–110`).
  - Nhấp vào ảnh biên lai hoặc dòng chữ *"Xem ảnh kích thước đầy đủ"* để mở Modal phóng to (nguồn: `apps/web-1/app/dashboard/payment/_components/ProofPreview.tsx:35–56`).
  - Bấm *"Mở minh chứng"* đối với file không phải ảnh (PDF) để mở trong tab trình duyệt mới (nguồn: `ProofPreview.tsx:21–30`).
  - Bấm *"Đổi file"* khi đang chọn ảnh tải lên để chọn lại ảnh khác (nguồn: `ProofUpload.tsx:104–114`).
  - Bấm *"Tạo yêu cầu nạp mới"* khi giao dịch bị từ chối (`rejected`) để quay về trang ví tạo lệnh mới với số tiền tương ứng (nguồn: `page.tsx:162–169`).
  - Điều hướng qua thanh Menu trên Header: Trang chủ (`/dashboard`), Ví của tôi (`/dashboard/wallet`), Cài đặt (`/dashboard/settings`), Đăng xuất (`/auth`) (nguồn: `UserMenu.tsx:68–148`).
- **Entry:**
  - Từ Modal nạp tiền ví `/dashboard/wallet`: Sau khi nhập số tiền và bấm *"Tạo yêu cầu chuyển khoản"*, hệ thống gọi API tạo deposit và điều hướng tới `/dashboard/payment?pid=${result.depositId}` (nguồn: `apps/web-1/app/dashboard/wallet/_components/WalletTopupModal.tsx:38–40`).
  - Từ bảng lịch sử nạp tiền tại `/dashboard/wallet`: Bấm nút *"Xem chi tiết"* hoặc *"Thêm ảnh chứng minh"* trên dòng giao dịch (nguồn: `apps/web-1/app/dashboard/wallet/_components/WalletProofTable.tsx:189, 292`, `lib/deposit-display.ts:107–109`).
  - Từ bảng hoạt động ví tại `/dashboard/wallet`: Bấm nút *"Xem chi tiết"* trên các giao dịch nạp tiền (`source_type === "deposit"` hoặc `"topup"`) (nguồn: `WalletTransactionTable.tsx:93–95`, `WalletTransactionCardList.tsx:33–35`).
  - Từ màn hình chi tiết hồ sơ `/dashboard/case/[id]`: Khi người dùng muốn mua credit đánh giá nhưng số dư ví không đủ, hệ thống tự động tạo deposit cho phần tiền còn thiếu, lưu intent vào `sessionStorage` và điều hướng sang `/dashboard/payment?pid=${deposit.depositId}` (nguồn: `apps/web-1/app/dashboard/case/[id]/_components/use-shortage-deposit-redirect.ts:25–36`).
  - Nhập URL trực tiếp hoặc mở từ bookmark: `/dashboard/payment?pid=...` (`[Assumption / Cần xác minh]`).
- **Exit / next step:**
  - Bấm nút quay lại đầu trang hoặc nút CTA trên thông báo lỗi/thiếu thông tin: Điều hướng về `/dashboard/case/[caseId]` hoặc `/dashboard/wallet` (nguồn: `page.tsx:47–49, 77–80, 103–110`).
  - Tự động hoàn tất sau nạp tiền (`useFulfillCreditAfterDeposit`): Khi `payment.status === "verified"` và trong `sessionStorage` tồn tại `buyCreditAfterDepositIntent`, hệ thống tự gọi API mua credit, hiển thị thông báo thành công và tự động chuyển trang sau 5 giây về `/dashboard/case/[caseId]` (nguồn: `use-fulfill-credit-after-deposit.ts:38–60`).
  - Khi giao dịch bị từ chối (`rejected`): Bấm nút *"Tạo yêu cầu nạp mới"* điều hướng về `/dashboard/wallet?amount=${payment.amount}` (nguồn: `page.tsx:162–169`).
  - Người dùng chưa đăng nhập: Bị client-side redirect chuyển hướng về `/auth` (nguồn: `apps/web-1/app/dashboard/layout.tsx:17`).
  - Người dùng có vai trò `admin` hoặc `supporter`: Tự động chuyển hướng về `/admin` hoặc `/supporter` (nguồn: `apps/web-1/app/dashboard/layout.tsx:20–27`).
- **Product facts / constraints:**
  - **Cơ chế Polling liên tục:** Hook `useDepositDetail` cấu hình `refetchInterval: 5000` (tự động gọi lại `GET /deposits/${depositId}` mỗi 5 giây) để cập nhật trạng thái ngay khi có webhook từ ngân hàng hoặc admin duyệt minh chứng (nguồn: `apps/web-1/app/dashboard/payment/hooks/usePayment.ts:27–34`).
  - **Xử lý thiếu mã giao dịch:** Nếu không có tham số `pid` trên URL, hiển thị Alert đỏ tiêu đề *"Thiếu thông tin"*, nội dung *"Không tìm thấy mã giao dịch. Vui lòng thử lại."*, cùng nút *"Về trang ví"* (nguồn: `page.tsx:41–52`).
  - **Xử lý lỗi tải dữ liệu:** Nếu API lỗi hoặc không tìm thấy bản ghi deposit, hiển thị Alert đỏ tiêu đề *"Lỗi"*, nội dung *"Không thể tải thông tin nạp tiền."*, cùng nút quay lại phù hợp theo ngữ cảnh lưu trữ (`caseId` hoặc `wallet`) (nguồn: `page.tsx:62–82`).
  - **Đồng bộ ý định mua credit (`credit-after-deposit-intent`):** Ý định mua credit được lưu trong `sessionStorage` với tiền tố `buyCreditAfterDeposit:`. Chứa `caseId`, `quantity` (từ 1 đến 50), `orderIdempotencyKey` và `serviceType` (mặc định `credit_audit`) (nguồn: `credit-after-deposit-intent.ts:1–69`).
  - **Luồng hoàn tất credit tự động:** Hook `useFulfillCreditAfterDeposit` chỉ kích hoạt 1 lần duy nhất trên mỗi `depositId` (`startedRef`) khi deposit chuyển sang `verified`. Gọi mutation `useCreateCreditOrder` (`POST /orders`). Thành công sẽ xóa intent trong storage, invalidate query `case` và `wallet`, hiển thị toast màu `teal` tự đóng sau 5 giây rồi gọi `router.replace` chuyển về hồ sơ (nguồn: `use-fulfill-credit-after-deposit.ts:27–83`).
  - **Quy tắc hiển thị trạng thái nạp tiền (`getDepositDisplay`):**
    - `amount_mismatch`: Label *"Số tiền chưa khớp"* (badge màu vàng). Giải thích: *"Số tiền chuyển khoản không khớp yêu cầu. Đội ngũ đang đối soát. Số dư chưa thay đổi."*. Khóa tính năng gửi lại ảnh (nguồn: `lib/deposit-display.ts:43–52`, `page.tsx:151–155`).
    - `rejected`: Label *"Cần xử lý lại"* (badge màu đỏ). Giải thích: *"Yêu cầu chưa được xác minh. Xem lý do rồi tạo yêu cầu nạp mới."*. Hiển thị `payment.rejection_reason` (fallback: *"Minh chứng không hợp lệ."*) và nút tạo yêu cầu mới (nguồn: `deposit-display.ts:53–61`, `page.tsx:157–170`).
    - `verified`: Label *"Đã cộng vào ví"* (badge màu xanh lá). Giải thích: *"Tiền đã vào số dư. Xem ảnh chứng minh hoặc hoạt động ví."* (nguồn: `deposit-display.ts:62–70`).
    - `pending` + `hasProof === false`: Label *"Cần bổ sung chứng minh"* (badge màu cam). Giải thích: *"Số dư chưa thay đổi. Thêm ảnh chứng minh để được xác minh."* (nguồn: `deposit-display.ts:71–79`).
    - `pending` + `hasProof === true`: Label *"Đang chờ xác minh"* (badge màu cam). Giải thích: *"Đã gửi ảnh chứng minh. Số dư chưa thay đổi. Bạn có thể chờ."* (nguồn: `deposit-display.ts:80–88`).
    - `pending` (fallback): Label *"Đang chờ xác minh"* (badge màu cam). Giải thích: *"Số dư chưa thay đổi. Mở chi tiết để xem trạng thái và ảnh chứng minh."* (nguồn: `deposit-display.ts:89–97`).
    - Trạng thái khác / không xác định: Label *"Trạng thái không xác định"* (badge màu xám). Giải thích: *"Mở chi tiết để xem yêu cầu nạp tiền."* (nguồn: `deposit-display.ts:98–105`).
  - **Thông tin ngân hàng VietQR:** Chỉ hiển thị khi `payment.status === "pending"` và `bankInfo?.accountNumber` tồn tại (nguồn: `page.tsx:136–138`).
  - **Ràng buộc tải lên ảnh minh chứng (`validatePaymentProof`):**
    - Dung lượng tối đa: 5MB (`5 * 1024 * 1024` bytes). Quá dung lượng bật Toast đỏ: *"Kích thước file quá lớn"* — *"Kích thước file vượt quá 5MB. Vui lòng chọn file nhỏ hơn."*.
    - Định dạng hợp lệ: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`. Sai định dạng bật Toast đỏ: *"Định dạng không hợp lệ"* — *"Chỉ chấp nhận định dạng ảnh (JPG, PNG, WEBP, HEIC/HEIF)."* (nguồn: `apps/web-1/lib/pricing.ts:65–87`).
  - **Tương tác kéo thả & dán từ Clipboard:** Vùng upload hỗ trợ bắt sự kiện `onPaste` từ clipboard (`Ctrl+V`) đối với dữ liệu dạng ảnh (`item.type.startsWith("image/")`) (nguồn: `ProofUpload.tsx:49–60`).
  - **Xem trước ảnh:** Chỉ hỗ trợ xem trước trình duyệt đối với file không phải HEIC/HEIF (`!/\.(?:heic|heif)$/i` và `!/^image\/hei[cf]$/i`). Với HEIC/HEIF, hiển thị thông báo hướng dẫn vẫn có thể gửi tệp (nguồn: `ProofUpload.tsx:24–28, 84–96`).
  - **Xem ảnh minh chứng đã gửi:** Hỗ trợ xem trực tiếp ảnh thumbnail, bấm mở Modal xem phóng to (`size="xl"`). Nếu không phải file ảnh (ví dụ PDF), hiển thị link trỏ ra tab mới có icon `ExternalLink` với chữ *"Mở minh chứng"*. Nếu ảnh lỗi hoặc hỏng, hiển thị thông báo *"Không mở được ảnh chứng minh. Thử lại sau hoặc liên hệ hỗ trợ."* (nguồn: `ProofPreview.tsx:15–73`).

---

## Layer 2: Interactive Inventory

### 2.1 Route Access & Shared Dashboard Shell
*Nguồn: `apps/web-1/app/dashboard/layout.tsx`, `apps/web-1/components/layout/DashboardShell.tsx`, `UserMenu.tsx`, `NotificationBell.tsx`, `ThemeToggler.tsx`, `Logo.tsx`, `LoadingScreen.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment.shell.loading_title` | `DashboardLayout` > `LoadingScreen` > `p` (Tiêu đề trên) | Heading | Nexus Platform | — | loading state (khi session đang pending) |
| `payment.shell.loading_msg` | `DashboardLayout` > `LoadingScreen` > `p` (Nội dung dưới) | Description | Đang xác thực thông tin... | — | loading state (khi session đang pending) |
| `payment.shell.logo_alt` | `DashboardShell` > `nav` > `Link` > `Logo` > `img[alt]` | Alt text | Nexus Logo | `/dashboard` (hoặc `/supporter`, `/admin` theo role) | default |
| `payment.shell.notif_btn` | `DashboardShell` > `NotificationBell` > `Menu.Target` > `ActionIcon[aria-label]` | Aria-label | Thông báo | Mở/đóng menu thông báo | default |
| `payment.shell.notif_badge` | `NotificationBell` > `ActionIcon` > `Badge` | Badge | `<code>{unreadCount > 99 ? "99+" : unreadCount}</code>` | — | visible khi unreadCount > 0 |
| `payment.shell.notif_header` | `NotificationBell` > `Menu.Dropdown` > `Text` | Heading | Thông báo | — | notification menu mở |
| `payment.shell.notif_empty` | `NotificationBell` > `Menu.Dropdown` > `Text` | Empty state | Không có thông báo | — | visible khi không có thông báo nào |
| `payment.shell.notif_mark_all` | `NotificationBell` > `Menu.Dropdown` > `button` | CTA | Đánh dấu tất cả đã đọc | Gọi mutation `markAllRead` (`PATCH /notifications/read-all`) | disabled khi unreadCount === 0 |
| `payment.shell.theme_btn` | `DashboardShell` > `ThemeToggler` > `ActionIcon[aria-label]` | Aria-label | Toggle theme | Chuyển đổi theme Sáng / Tối | default |
| `payment.shell.user_btn` | `DashboardShell` > `UserMenu` > `Popover.Target` > `button[aria-label]` | Aria-label | Tài khoản | Mở/đóng menu người dùng | default |
| `payment.shell.user_avatar_alt` | `UserMenu` > `Popover.Target` > `Avatar[alt]` | Alt text | `<code>{user.name \|\| "User"}</code>` | — | default |
| `payment.shell.user_avatar_fallback` | `UserMenu` > `Popover.Target` > `Avatar` (Fallback chữ) | Item | `<code>{user.name?.substring(0, 2).toUpperCase() \|\| "US"}</code>` | — | default khi không có ảnh đại diện |
| `payment.shell.user_email` | `UserMenu` > `Popover.Dropdown` > `p` | Item | `<code>{user.email \|\| "—"}</code>` | — | default |
| `payment.shell.wallet_label` | `UserMenu` > `Popover.Dropdown` > `span` | Label | Số dư | — | student role only |
| `payment.shell.wallet_balance` | `UserMenu` > `Popover.Dropdown` > `span` | Item | `<code>{walletBalance.toLocaleString("vi-VN")} VND</code>` | — | student role only |
| `payment.shell.menu_home` | `UserMenu` > `Popover.Dropdown` > `button` (Option 1) | Navigation | Trang chủ | `/dashboard` | default |
| `payment.shell.menu_wallet` | `UserMenu` > `Popover.Dropdown` > `button` (Option 2) | Navigation | Ví của tôi | `/dashboard/wallet` | student role only |
| `payment.shell.menu_settings` | `UserMenu` > `Popover.Dropdown` > `button` (Option 3) | Navigation | Cài đặt | `/dashboard/settings` | default |
| `payment.shell.menu_logout` | `UserMenu` > `Popover.Dropdown` > `button` (Option 4) | CTA | Đăng xuất | Gọi `signOut()` → chuyển hướng về `/auth` | default |

---

### 2.2 Missing Parameter, Loading & Error Branches
*Nguồn: `apps/web-1/app/dashboard/payment/page.tsx:41–82`, `apps/web-1/lib/deposit-display.ts:23–24`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment.missing_pid.alert_title` | `PaymentPage` > `Alert[color="red"]` > `title` | Error | Thiếu thông tin | — | rendered khi URL không có query param `pid` (`!paymentId`) |
| `payment.missing_pid.alert_desc` | `PaymentPage` > `Alert[color="red"]` > body | Description | Không tìm thấy mã giao dịch. Vui lòng thử lại. | — | rendered khi `!paymentId` |
| `payment.missing_pid.cta` | `PaymentPage` > `Button` | CTA | Về trang ví | `router.push("/dashboard/wallet")` | default button (`WALLET_COPY.backToWallet`) |
| `payment.loading.skeleton` | `PaymentPage` > `LoadingSkeleton[variant="card", count={2}]` | Description | — | — | rendered khi `isLoading === true` (không có text) |
| `payment.error.alert_title` | `PaymentPage` > `Alert[color="red"]` > `title` | Error | Lỗi | — | rendered khi `error \|\| !payment` |
| `payment.error.alert_desc` | `PaymentPage` > `Alert[color="red"]` > body | Description | Không thể tải thông tin nạp tiền. | — | rendered khi `error \|\| !payment` |
| `payment.error.cta_case` | `PaymentPage` > `Button` | CTA | Quay lại hồ sơ | `router.push("/dashboard/case/" + errorIntent.caseId)` | rendered khi `errorIntent?.caseId` tồn tại (`WALLET_COPY.backToCase`) |
| `payment.error.cta_wallet` | `PaymentPage` > `Button` | CTA | Về trang ví | `clearBuyCreditAfterDepositIntent(paymentId); router.push("/dashboard/wallet")` | rendered khi không có `errorIntent?.caseId` (`WALLET_COPY.backToWallet`) |

---

### 2.3 Navigation & Status Header
*Nguồn: `apps/web-1/app/dashboard/payment/page.tsx:103–127`, `apps/web-1/lib/deposit-display.ts:1–32, 42–105`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment.nav.back_case` | `PaymentPage` > `button` (Đầu trang) | CTA | Quay lại hồ sơ | `router.push("/dashboard/case/" + intent.caseId)` | rendered khi có `intent?.caseId` (`WALLET_COPY.backToCase`) |
| `payment.nav.back_wallet` | `PaymentPage` > `button` (Đầu trang) | CTA | Về trang ví | `clearBuyCreditAfterDepositIntent(payment.id); router.push("/dashboard/wallet")` | rendered khi không có `intent?.caseId` (`WALLET_COPY.backToWallet`) |
| `payment.header.title` | `PaymentPage` > `h2` | Heading | Chi tiết nạp tiền | — | default (`WALLET_COPY.detailTitle`) |
| `payment.header.badge_pending_no_proof` | `PaymentPage` > `span.rounded-full` (Badge trạng thái) | Badge | Cần bổ sung chứng minh | — | `payment.status === "pending"` và `hasProof === false` (màu cam) |
| `payment.header.badge_pending_has_proof` | `PaymentPage` > `span.rounded-full` (Badge trạng thái) | Badge | Đang chờ xác minh | — | `payment.status === "pending"` và `hasProof === true` (màu cam) |
| `payment.header.badge_verified` | `PaymentPage` > `span.rounded-full` (Badge trạng thái) | Badge | Đã cộng vào ví | — | `payment.status === "verified"` (màu xanh lá) |
| `payment.header.badge_rejected` | `PaymentPage` > `span.rounded-full` (Badge trạng thái) | Badge | Cần xử lý lại | — | `payment.status === "rejected"` (màu đỏ) |
| `payment.header.badge_amount_mismatch` | `PaymentPage` > `span.rounded-full` (Badge trạng thái) | Badge | Số tiền chưa khớp | — | `payment.status === "amount_mismatch"` (màu vàng) |
| `payment.header.badge_unknown` | `PaymentPage` > `span.rounded-full` (Badge trạng thái) | Badge | Trạng thái không xác định | — | fallback khi status không thuộc các giá trị trên (màu xám) |
| `payment.header.explanation_pending_no_proof` | `PaymentPage` > `p.text-text-app` | Description | Số dư chưa thay đổi. Thêm ảnh chứng minh để được xác minh. | — | `payment.status === "pending"` và `hasProof === false` |
| `payment.header.explanation_pending_has_proof` | `PaymentPage` > `p.text-text-app` | Description | Đã gửi ảnh chứng minh. Số dư chưa thay đổi. Bạn có thể chờ. | — | `payment.status === "pending"` và `hasProof === true` |
| `payment.header.explanation_pending_fallback` | `PaymentPage` > `p.text-text-app` | Description | Số dư chưa thay đổi. Mở chi tiết để xem trạng thái và ảnh chứng minh. | — | `payment.status === "pending"` khi `hasProof` không xác định |
| `payment.header.explanation_verified` | `PaymentPage` > `p.text-text-app` | Description | Tiền đã vào số dư. Xem ảnh chứng minh hoặc hoạt động ví. | — | `payment.status === "verified"` |
| `payment.header.explanation_rejected` | `PaymentPage` > `p.text-text-app` | Description | Yêu cầu chưa được xác minh. Xem lý do rồi tạo yêu cầu nạp mới. | — | `payment.status === "rejected"` |
| `payment.header.explanation_amount_mismatch` | `PaymentPage` > `p.text-text-app` | Description | Số tiền chuyển khoản không khớp yêu cầu. Đội ngũ đang đối soát. Số dư chưa thay đổi. | — | `payment.status === "amount_mismatch"` |
| `payment.header.explanation_unknown` | `PaymentPage` > `p.text-text-app` | Description | Mở chi tiết để xem yêu cầu nạp tiền. | — | fallback khi status không xác định |

---

### 2.4 Deposit Metadata (`PaymentDepositMeta`)
*Nguồn: `apps/web-1/app/dashboard/payment/_components/PaymentDepositMeta.tsx:12–46`, `apps/web-1/lib/deposit-display.ts:26–30`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment.meta.created_at_label` | `PaymentDepositMeta` > `div` (Hàng 1) > `span.text-text-muted` | Label | Thời điểm tạo yêu cầu | — | default (`WALLET_COPY.requestCreated`) |
| `payment.meta.created_at_val` | `PaymentDepositMeta` > `div` (Hàng 1) > `span.font-medium` | Item | `<code>{createdAt}</code>` | — | default (định dạng `vi-VN`, ví dụ `14:30:00 21/09/2026`) |
| `payment.meta.bank_credited_at_label` | `PaymentDepositMeta` > `div` (Hàng 2) > `span.text-text-muted` | Label | Thời điểm ngân hàng ghi nhận | — | rendered chỉ khi `bankCreditedAt` khác null (`WALLET_COPY.bankCredited`) |
| `payment.meta.bank_credited_at_val` | `PaymentDepositMeta` > `div` (Hàng 2) > `span.font-medium` | Item | `<code>{bankCreditedAt}</code>` | — | rendered chỉ khi `bankCreditedAt` khác null (định dạng `vi-VN`) |
| `payment.meta.amount_label` | `PaymentDepositMeta` > `div` (Hàng 3) > `span.text-text-muted` | Label | Số tiền | — | default |
| `payment.meta.amount_val` | `PaymentDepositMeta` > `div` (Hàng 3) > `span.font-semibold` | Item | `<code>{amount.toLocaleString("vi-VN")} {currency}</code>` | — | default (ví dụ `50.000 VND`) |
| `payment.meta.activity_desc_label` | `PaymentDepositMeta` > `div` (Hàng 4) > `span.text-text-muted` | Label | Nội dung giao dịch | — | default (`WALLET_COPY.activityDescription`) |
| `payment.meta.activity_desc_val` | `PaymentDepositMeta` > `div` (Hàng 4) > `span.font-medium` | Item | Nạp tiền qua chuyển khoản ngân hàng | — | default (`WALLET_COPY.depositActivityText`) |
| `payment.meta.transfer_content_label` | `PaymentDepositMeta` > `div` (Hàng 5) > `span.text-text-muted` | Label | Nội dung chuyển khoản | — | default (`WALLET_COPY.transferContent`) |
| `payment.meta.transfer_content_val` | `PaymentDepositMeta` > `div` (Hàng 5) > `span.font-mono` | Item | `<code>{transferContent}</code>` | — | default (mã cú pháp chuyển khoản dạng font mono) |

---

### 2.5 Bank Transfer Info & VietQR (`PaymentBankInfo`)
*Nguồn: `apps/web-1/app/dashboard/payment/_components/PaymentBankInfo.tsx:12–40`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment.bank.qr_img` | `PaymentBankInfo` > `img[alt]` | Alt text | QR chuyển khoản nạp tiền | — | rendered khi `payment.status === "pending"` và `bankInfo.qrUrl` tồn tại |
| `payment.bank.name_label` | `PaymentBankInfo` > `div` (Hàng 1) > `span.text-text-muted` | Label | Ngân hàng | — | rendered khi `payment.status === "pending"` và có `bankInfo.accountNumber` |
| `payment.bank.name_val` | `PaymentBankInfo` > `div` (Hàng 1) > `span.font-semibold` | Item | `<code>{bankInfo.bankName}</code>` | — | tên ngân hàng thụ hưởng (ví dụ `MB Bank`) |
| `payment.bank.account_number_label` | `PaymentBankInfo` > `div` (Hàng 2) > `span.text-text-muted` | Label | Số tài khoản | — | rendered khi `payment.status === "pending"` và có `bankInfo.accountNumber` |
| `payment.bank.account_number_val` | `PaymentBankInfo` > `div` (Hàng 2) > `span.font-semibold` | Item | `<code>{bankInfo.accountNumber}</code>` | — | số tài khoản thụ hưởng |
| `payment.bank.account_name_label` | `PaymentBankInfo` > `div` (Hàng 3) > `span.text-text-muted` | Label | Chủ tài khoản | — | rendered khi `payment.status === "pending"` và có `bankInfo.accountNumber` |
| `payment.bank.account_name_val` | `PaymentBankInfo` > `div` (Hàng 3) > `span.font-semibold` | Item | `<code>{bankInfo.accountName}</code>` | — | tên chủ tài khoản thụ hưởng |

---

### 2.6 Proof Preview & Modal (`ProofPreview`)
*Nguồn: `apps/web-1/app/dashboard/payment/_components/ProofPreview.tsx:9–74`, `apps/web-1/app/dashboard/payment/page.tsx:140–147`, `apps/web-1/lib/deposit-display.ts:13–15`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment.proof.has_proof_heading` | `PaymentPage` > `div.rounded-xl` > `h3` | Heading | Đã gửi ảnh chứng minh | — | rendered khi `hasProof && payment.proof_file_url` (`WALLET_COPY.hasProof`) |
| `payment.proof.no_proof_text` | `PaymentPage` > `p.text-text-muted` | Description | Chưa có ảnh chứng minh | — | rendered khi `payment.status === "pending"` và chưa có ảnh chứng minh (`WALLET_COPY.noProof`) |
| `payment.proof.unavailable` | `ProofPreview` > `Text` | Error | Không mở được ảnh chứng minh. Thử lại sau hoặc liên hệ hỗ trợ. | — | rendered khi ảnh tải thất bại (`failed === true`) (`WALLET_COPY.proofUnavailable`) |
| `payment.proof.open_external_link` | `ProofPreview` > `a` | CTA | Mở minh chứng | Mở `proofUrl` trong tab mới (`target="_blank"`, `rel="noopener noreferrer"`) | rendered khi tệp không phải định dạng ảnh (ví dụ PDF) |
| `payment.proof.thumbnail_button` | `ProofPreview` > `button[aria-label]` | Aria-label | Xem ảnh chứng minh kích thước đầy đủ | Mở Modal xem trước phóng to (`setOpened(true)`) | rendered khi tệp là định dạng ảnh (`.jpg`, `.jpeg`, `.png`, `.webp`) |
| `payment.proof.thumbnail_img` | `ProofPreview` > `button` > `div` > `img[alt]` | Alt text | Ảnh chứng minh chuyển khoản | — | rendered bên trong thumbnail button |
| `payment.proof.view_full_text` | `ProofPreview` > `button` > `span` | CTA | Xem ảnh kích thước đầy đủ | Mở Modal xem trước phóng to (`setOpened(true)`) | rendered dưới ảnh thumbnail |
| `payment.proof.modal_title` | `ProofPreview` > `Modal[title]` | Heading | Ảnh chứng minh chuyển khoản | — | tiêu đề trên thanh Modal khi mở |
| `payment.proof.modal_close_btn` | `ProofPreview` > `Modal closeButtonProps[aria-label]` | Aria-label | Đóng ảnh chứng minh | Đóng Modal (`setOpened(false)`) | nút đóng (dấu X) trên góc Modal |
| `payment.proof.modal_full_img` | `ProofPreview` > `Modal` > `img[alt]` | Alt text | Ảnh chứng minh chuyển khoản | — | ảnh kích thước đầy đủ hiển thị trong Modal |

---

### 2.7 Proof Upload Form (`ProofUpload`)
*Nguồn: `apps/web-1/app/dashboard/payment/_components/ProofUpload.tsx:10–135`, `apps/web-1/lib/pricing.ts:65–87`, `apps/web-1/app/dashboard/payment/hooks/usePayment.ts:44–75`, `apps/web-1/lib/deposit-display.ts:11`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment.upload.hint` | `ProofUpload` > `p.text-text-muted` | Helper | Số dư chưa thay đổi. Thêm ảnh chứng minh để quản trị viên kiểm tra. | — | default (hiển thị khi `payment.status === "pending"` và `!hasProof`) |
| `payment.upload.dropzone_select` | `ProofUpload` > `button` > `span.text-base` | CTA | Nhấn để chọn ảnh chụp | Kích hoạt hộp thoại chọn file của trình duyệt (`fileRef.current?.click()`) | rendered khi chưa chọn file (`!selectedFile`) |
| `payment.upload.dropzone_paste` | `ProofUpload` > `button` > `span.text-sm` | Helper | Hoặc nhấn Ctrl+V để dán ảnh từ bộ nhớ tạm | Hỗ trợ bắt sự kiện dán ảnh `onPaste` từ clipboard | rendered khi chưa chọn file (`!selectedFile`) |
| `payment.upload.preview_img_alt` | `ProofUpload` > `div.aspect-video` > `img[alt]` | Alt text | Xem trước ảnh chụp chuyển khoản | — | rendered khi đã chọn file và định dạng hỗ trợ xem trước (`canPreviewSelectedFile`) |
| `payment.upload.preview_unsupported` | `ProofUpload` > `p.text-text-muted` | Description | Không thể xem trước định dạng này tại đây. Bạn vẫn có thể gửi tệp. | — | rendered khi chọn định dạng HEIC/HEIF không xem trước được trên trình duyệt |
| `payment.upload.file_name` | `ProofUpload` > `div` > `p.truncate` | Item | `<code>{selectedFile.name}</code>` | — | rendered khi đã chọn file |
| `payment.upload.file_size` | `ProofUpload` > `div` > `p.text-sm` | Item | `<code>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</code>` | — | rendered khi đã chọn file (ví dụ `1.2 MB`) |
| `payment.upload.change_file_btn` | `ProofUpload` > `div` > `button` | CTA | Đổi file | Xóa file đã chọn (`setSelectedFile(null)`) và reset giá trị input file | rendered khi đã chọn file |
| `payment.upload.toast_size_title` | `validatePaymentProof` > `notifications.show` > `title` | Toast | Kích thước file quá lớn | — | kích hoạt khi chọn file vượt quá 5MB (màu đỏ) |
| `payment.upload.toast_size_msg` | `validatePaymentProof` > `notifications.show` > `message` | Toast | Kích thước file vượt quá 5MB. Vui lòng chọn file nhỏ hơn. | — | kích hoạt khi chọn file vượt quá 5MB (màu đỏ) |
| `payment.upload.toast_type_title` | `validatePaymentProof` > `notifications.show` > `title` | Toast | Định dạng không hợp lệ | — | kích hoạt khi chọn file không thuộc định dạng ảnh cho phép (màu đỏ) |
| `payment.upload.toast_type_msg` | `validatePaymentProof` > `notifications.show` > `message` | Toast | Chỉ chấp nhận định dạng ảnh (JPG, PNG, WEBP, HEIC/HEIF). | — | kích hoạt khi chọn sai định dạng ảnh (màu đỏ) |
| `payment.upload.inline_error` | `ProofUpload` > `p.text-red-500` | Error | `<code>{uploadError}</code>` | — | rendered khi mutation tải lên thất bại (fallback: `Tải lên thất bại.`) |
| `payment.upload.toast_success_title` | `useUploadPaymentProof` > `notifications.show` > `title` | Toast | Thành công | — | kích hoạt khi tải lên minh chứng thành công (màu xanh lá) |
| `payment.upload.toast_success_msg` | `useUploadPaymentProof` > `notifications.show` > `message` | Toast | Minh chứng đã được gửi. Quản trị viên sẽ kiểm tra. | — | kích hoạt khi tải lên minh chứng thành công (màu xanh lá) |
| `payment.upload.toast_error_title` | `useUploadPaymentProof` > `notifications.show` > `title` | Toast | Lỗi | — | kích hoạt khi API upload trả lỗi (màu đỏ) |
| `payment.upload.toast_error_msg` | `useUploadPaymentProof` > `notifications.show` > `message` | Toast | `<code>{error.response?.data?.message \|\| "Tải lên thất bại."}</code>` | — | kích hoạt khi API upload trả lỗi (màu đỏ) |
| `payment.upload.submit_btn_loading` | `ProofUpload` > `Button` | CTA | Đang tải lên... | — | state loading khi mutation đang chạy (`uploadProofMutation.isPending === true`) |
| `payment.upload.submit_btn_default` | `ProofUpload` > `Button` | CTA | Thêm ảnh chứng minh | Kích hoạt mutation `uploadProofMutation.mutate(selectedFile)` (`POST /payments/proof`) | default state (`WALLET_COPY.addProof`); disabled khi chưa chọn file hoặc đang upload |

---

### 2.8 Status Alerts, Rejection Handling & Auto-Fulfillment Toasts
*Nguồn: `apps/web-1/app/dashboard/payment/page.tsx:151–170`, `apps/web-1/app/dashboard/payment/hooks/use-fulfill-credit-after-deposit.ts:51–79`, `apps/web-1/lib/deposit-display.ts:25`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `payment.status.mismatch_alert_title` | `PaymentPage` > `Alert[color="yellow"]` > `title` | Error | Số tiền chưa khớp | — | rendered khi `payment.status === "amount_mismatch"` (`display.label`) |
| `payment.status.mismatch_alert_desc` | `PaymentPage` > `Alert[color="yellow"]` > body | Description | Số tiền chuyển khoản không khớp yêu cầu. Đội ngũ đang đối soát. Số dư chưa thay đổi. Không thể gửi lại ảnh chứng minh cho yêu cầu này. | — | rendered khi `payment.status === "amount_mismatch"` (`{display.explanation} Không thể gửi lại ảnh chứng minh cho yêu cầu này.`) |
| `payment.status.rejected_alert_title` | `PaymentPage` > `Alert[color="red"]` > `title` | Error | Cần xử lý lại | — | rendered khi `payment.status === "rejected"` (`display.label`) |
| `payment.status.rejected_alert_desc` | `PaymentPage` > `Alert[color="red"]` > body | Description | `<code>{payment.rejection_reason \|\| "Minh chứng không hợp lệ."}</code>` | — | rendered khi `payment.status === "rejected"` (hiển thị lý do từ chối hoặc fallback) |
| `payment.status.rejected_cta` | `PaymentPage` > `Button` | CTA | Tạo yêu cầu nạp mới | `router.push("/dashboard/wallet?amount=" + payment.amount)` | rendered khi `payment.status === "rejected"` (`WALLET_COPY.newDeposit`) |
| `payment.fulfill.toast_success_title` | `useFulfillCreditAfterDeposit` > `notifications.show` > `title` | Toast | Mua credit thành công | — | kích hoạt khi tiền vào ví và tự động mua credit thành công (màu teal, autoClose 5000ms) |
| `payment.fulfill.toast_success_msg` | `useFulfillCreditAfterDeposit` > `notifications.show` > `message` | Toast | `<code>Đã mua thành công {intent.quantity} lượt kiểm tra cho hồ sơ. Đang chuyển về hồ sơ trong 5 giây...</code>` | Tự động chuyển hướng về `/dashboard/case/{intent.caseId}` sau 5 giây (`setTimeout`) | kích hoạt khi tự động hoàn tất mua credit thành công |
| `payment.fulfill.toast_error_title` | `useFulfillCreditAfterDeposit` > `notifications.show` > `title` | Toast | Hoàn tất mua credit thất bại | — | kích hoạt khi tiền đã vào ví nhưng gọi API `/orders` mua credit thất bại (màu đỏ) |
| `payment.fulfill.toast_error_msg` | `useFulfillCreditAfterDeposit` > `notifications.show` > `message` | Toast | `<code>{errorData?.message \|\| "Tiền đã vào ví nhưng chưa thể tự động mua lượt. Vui lòng vào hồ sơ để mua lại."}</code>` | — | kích hoạt khi tự động mua credit thất bại |

---

## Layer 3: Page Notes

### 1. Biến thể thuật ngữ xuất hiện trên trang
- **"Ảnh chứng minh" vs "Minh chứng":**
  - Trên nút bấm và nhãn trạng thái UI khách hàng: *"Thêm ảnh chứng minh"* (`WALLET_COPY.addProof`), *"Đã gửi ảnh chứng minh"* (`WALLET_COPY.hasProof`), *"Chưa có ảnh chứng minh"* (`WALLET_COPY.noProof`), *"Không mở được ảnh chứng minh. Thử lại sau hoặc liên hệ hỗ trợ."* (`WALLET_COPY.proofUnavailable`), *"Xem ảnh chứng minh kích thước đầy đủ"* / *"Đóng ảnh chứng minh"* / *"Ảnh chứng minh chuyển khoản"* (`ProofPreview.tsx:37, 44, 60, 63, 68`), *"Thêm ảnh chứng minh để quản trị viên kiểm tra."* (`ProofUpload.tsx:45`).
  - Trong thông báo Toast, liên kết tệp ngoài và fallback từ chối: *"Mở minh chứng"* (`ProofPreview.tsx:28` - link mở file PDF), *"Minh chứng đã được gửi. Quản trị viên sẽ kiểm tra."* (`usePayment.ts:62` - Toast thành công), *"Minh chứng không hợp lệ."* (`page.tsx:160` - Fallback lý do từ chối).
  - Khái niệm về bằng chứng chuyển khoản đang dùng song song cả hai từ: cụm từ *"ảnh chứng minh"* được ưu tiên ở các nhãn hiển thị trực tiếp và modal ảnh, trong khi *"minh chứng"* được dùng trong thông báo Toast và liên kết tệp.
- **"Credit" vs "Lượt kiểm tra" vs "Lượt":**
  - Trong thông báo Toast của hook tự động hoàn tất credit (`use-fulfill-credit-after-deposit.ts:52–76`):
    - Tiêu đề dùng: *"Mua credit thành công"* / *"Hoàn tất mua credit thất bại"*.
    - Nội dung thông báo dùng: *"lượt kiểm tra"* (`Đã mua thành công {intent.quantity} lượt kiểm tra cho hồ sơ...`) và *"lượt"* (`...chưa thể tự động mua lượt. Vui lòng vào hồ sơ để mua lại.`).
- **"Giao dịch" vs "Yêu cầu nạp tiền" vs "Nạp tiền":**
  - Thông báo thiếu `pid`: *"Không tìm thấy mã giao dịch. Vui lòng thử lại."* (`page.tsx:45`).
  - Thông báo lỗi fetch: *"Không thể tải thông tin nạp tiền."* (`page.tsx:75`).
  - Tiêu đề trang: *"Chi tiết nạp tiền"* (`WALLET_COPY.detailTitle`).
  - Siêu dữ liệu giao dịch: *"Thời điểm tạo yêu cầu"*, *"Nội dung giao dịch"*, *"Nạp tiền qua chuyển khoản ngân hàng"*, *"Nội dung chuyển khoản"* (`PaymentDepositMeta.tsx:22–43`).
  - Nút xử lý lại khi rejected: *"Tạo yêu cầu nạp mới"* (`WALLET_COPY.newDeposit`).
- **"Quản trị viên" vs "Đội ngũ":**
  - Khi hướng dẫn tải ảnh và trong thông báo upload thành công: *"quản trị viên kiểm tra"* (`ProofUpload.tsx:45`), *"Quản trị viên sẽ kiểm tra."* (`usePayment.ts:62`).
  - Trong giải thích trạng thái lệch tiền (`amount_mismatch`): *"Đội ngũ đang đối soát."* (`deposit-display.ts:48`).

### 2. Hiện trạng kỹ thuật & hành vi code quan sát được
- **Cơ chế Polling liên tục (Auto-polling):** Hook `useDepositDetail` thiết lập `refetchInterval: 5000` (5 giây) gọi lại endpoint `GET /deposits/${depositId}`. Nhờ đó, người dùng khi chuyển khoản xong không cần tải lại trang thủ công mà giao diện sẽ tự động chuyển trạng thái khi webhook ngân hàng khớp dữ liệu hoặc khi quản trị viên duyệt biên lai.
- **Luồng xử lý hoàn tất Credit tự động (Auto-fulfill):** Khi một khoản nạp tiền chuyển sang trạng thái `verified` và có ý định mua credit được lưu từ trước (`buyCreditAfterDepositIntent` trong `sessionStorage`), hook `useFulfillCreditAfterDeposit` tự động gửi request `POST /orders` với `idempotency_key`, hiển thị Toast thành công và hẹn giờ 5 giây (`setTimeout(..., 5000)`) tự động chuyển hướng người dùng về lại trang chi tiết hồ sơ (`/dashboard/case/[caseId]`). Nếu xảy ra lỗi khi tạo đơn hàng credit, hiển thị Toast đỏ hướng dẫn người dùng tự vào hồ sơ để mua lại vì tiền đã vào ví.
- **Bắt sự kiện dán ảnh từ Clipboard (Paste Event):** Thẻ `div` bao bọc vùng tải lên trong `ProofUpload.tsx` lắng nghe sự kiện `onPaste`. Người dùng có thể sử dụng phím tắt `Ctrl+V` để dán ảnh chụp màn hình trực tiếp từ bộ nhớ tạm, component tự động trích xuất file từ `clipboardData.items` và kiểm tra hợp lệ qua `validatePaymentProof(file)`.
- **Hạn chế định dạng xem trước:** Trình duyệt không hỗ trợ render trực tiếp định dạng `HEIC` / `HEIF` qua `URL.createObjectURL`. Vì vậy, code kiểm tra regex và hiển thị dòng thông báo giải thích: *"Không thể xem trước định dạng này tại đây. Bạn vẫn có thể gửi tệp."*, đồng thời vẫn cho phép nhấn nút gửi file lên backend.
- **Phân nhánh tệp chứng minh (Image vs Document):** Trong `ProofPreview.tsx`, code sử dụng regex kiểm tra đuôi file `/\.(?:jpe?g|png|webp)(?:[?#].*)?$/i`. Nếu là ảnh, mở Modal xem kích thước đầy đủ; nếu là tệp khác (như file `.pdf`), hiển thị đường dẫn `<a>` mở tab mới với chữ *"Mở minh chứng"*.
- **Chuẩn hóa URL ảnh:** Hàm `getProofUrl` (`usePayment.ts:77–85`) tự động kiểm tra: nếu URL là đường dẫn tuyệt đối `http(s)://` thì giữ nguyên; nếu là đường dẫn nội bộ `/api/...`, tự động nối với biến môi trường `NEXT_PUBLIC_API_URL` (fallback `http://localhost:8000`).

### 3. Điểm chưa xác minh (Unknowns / Questions)
- **Tên gọi route so với bản chất chức năng:** Tuyến đường dẫn là `/dashboard/payment` (nhận tham số `?pid=...`), nhưng tiêu đề và toàn bộ nội dung hiển thị là *"Chi tiết nạp tiền"* (`WALLET_COPY.detailTitle`) và các thao tác xoay quanh một giao dịch nạp tiền ví (`deposit`). Trong khi đó, tuyến đường `/dashboard/payments` lại là redirect stub về `/dashboard/wallet`, còn trang thanh toán gói hồ sơ lại là `/dashboard/case/[id]/payment`. Cần PO xác nhận xem có cần chuẩn hóa cấu trúc URL (ví dụ chuyển thành `/dashboard/wallet/deposit/[id]`) để phân biệt rành mạch giữa luồng nạp tiền ví và luồng thanh toán dịch vụ hay không.
- **Thời gian cam kết đối soát (SLA):** Các câu thông báo trạng thái hiện tại chỉ nêu *"Đội ngũ đang đối soát"*, *"Bạn có thể chờ"*, *"Quản trị viên sẽ kiểm tra"* mà không có thông tin ước lượng thời gian (ví dụ: trong vòng 5 phút, 15 phút hoặc 24 giờ làm việc), có thể khiến người dùng băn khoăn về thời gian tiền vào tài khoản.
- **Hướng giải quyết cho trường hợp `amount_mismatch`:** Khi số tiền chuyển khoản không khớp số tiền trên lệnh nạp, giao diện chỉ hiển thị Alert vàng: *"Số tiền chuyển khoản không khớp yêu cầu. Đội ngũ đang đối soát. Số dư chưa thay đổi. Không thể gửi lại ảnh chứng minh cho yêu cầu này."* và không cung cấp bất kỳ nút hành động hay kênh hỗ trợ/hotline/email nào để người dùng liên hệ giải quyết tiền bị treo.
