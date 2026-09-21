# Page: Case Payment (Thanh toán theo hồ sơ)

## Layer 1: Page Context

- **Route:** `/dashboard/case/[id]/payment`
- **Access:** `Authenticated` (Sinh viên / Chủ sở hữu hồ sơ - Student / Case Owner). Trong mã nguồn hiện tại, route này nhận `params: Promise<{ id: string }>` và thực thi chuyển hướng máy chủ thông qua `redirect('/dashboard/case/${id}')` (`apps/web-1/app/dashboard/case/[id]/payment/page.tsx:1–6`).
- **User:**
  - **Primary user:** Sinh viên (người tạo hoặc sở hữu hồ sơ đề tài) cần thực hiện thanh toán chi phí đánh giá / phản biện cho hồ sơ cụ thể (`apps/web-1/app/dashboard/case/[id]/page.tsx:88–91`, `types/case.ts:9`).
  - **Typical state:** Đang có hồ sơ ở trạng thái chưa thanh toán (`payment_status: "unpaid"`) hoặc đang ở các mốc `intake_pending`, `submitted`, `report_ready` cần nạp thêm credit đánh giá; người dùng cần thực hiện thanh toán tiền mặt hoặc chuyển khoản qua ngân hàng (VietQR) để kích hoạt quy trình phản biện.
  - **Knowledge level:** `[Assumption / Cần xác minh]` Người dùng đã đăng ký tài khoản, tạo hồ sơ bài nộp hoặc tải tài liệu slide đề cương CP1, nắm được mức chi phí hoặc số lượng credit cần thiết, và quen thuộc với phương thức quét mã QR trên ứng dụng ngân hàng di động tại Việt Nam.
- **User goals:**
  - Xem số tiền cần thanh toán cho gói đánh giá của hồ sơ.
  - Thanh toán bằng số dư credit/ví hiện có hoặc nạp tiền qua chuyển khoản VietQR khi số dư không đủ.
  - Tải lên ảnh chụp biên lai / minh chứng giao dịch chuyển khoản thành công để quản trị viên đối soát.
  - Theo dõi trạng thái duyệt thanh toán của giao dịch (Chờ xác minh, Đã cộng vào ví, Cần xử lý lại...).
- **Business / Product goals:**
  - Thu phí dịch vụ phản biện (Gói Basic AI Audit 79,000 VND hoặc theo gói dịch vụ đã chọn) trước khi hệ thống AI hoặc Supporter thực hiện đánh giá hồ sơ.
  - Đảm bảo tính chính xác trong việc đối soát giao dịch ngân hàng với hồ sơ của sinh viên thông qua mã chuyển khoản nội dung cú pháp chuẩn hóa.
  - Đảm bảo trải nghiệm thanh toán liền mạch không bị đứt gãy hành trình (hệ thống lưu vết `intent` kèm `caseId` để sau khi nạp tiền thiếu hoặc gặp sự cố có thể quay trở lại chính xác trang hồ sơ ban đầu).
- **Primary action:**
  - Tại route entry `/dashboard/case/[id]/payment`: Server-side redirect chuyển hướng người dùng về trang chi tiết hồ sơ `/dashboard/case/${id}` (`apps/web-1/app/dashboard/case/[id]/payment/page.tsx:5`).
  - Tại luồng thanh toán theo hồ sơ thực tế (`/dashboard/case/[id]` & `/dashboard/payment?pid=...`): Mở modal thanh toán gói đánh giá, quét mã VietQR và tải lên ảnh biên lai chuyển khoản thành công.
- **Secondary actions:**
  - Nút "Quay lại hồ sơ" (`WALLET_COPY.backToCase` hoặc nút back trình duyệt).
  - Thay đổi tệp ảnh minh chứng ("Đổi file", nút đóng file).
  - Phóng to xem ảnh minh chứng kích thước đầy đủ ("Xem ảnh kích thước đầy đủ", Modal ảnh).
  - Tạo yêu cầu nạp tiền mới khi giao dịch bị từ chối ("Tạo yêu cầu nạp mới").
  - Hủy bỏ thao tác thanh toán trong modal ("Hủy").
- **Entry:**
  - Nhập hoặc bấm vào đường dẫn trực tiếp `/dashboard/case/[id]/payment`.
  - Nút "Thanh toán dịch vụ" hoặc "Mua credit" trong `StatusGuidanceCard` tại `/dashboard/case/[id]`.
  - Nút "Mua credit" trong `UnpaidAlertBanner` tại `/dashboard/case/[id]`.
  - Tham số URL `?checkout=true` khi truy cập `/dashboard/case/[id]` (tự động kích hoạt mở `CreditQuantityModal`).
  - Chuyển hướng tự động từ hook `useShortageDepositRedirect` sang `/dashboard/payment?pid=${deposit.depositId}` khi ví không đủ số dư thanh toán case.
- **Exit / next step:**
  - Khi truy cập `/dashboard/case/[id]/payment`: Hệ thống tự động chuyển hướng đến `/dashboard/case/[id]`.
  - Khi hoàn tất thanh toán trong `CreditQuantityModal`: Hệ thống gọi `POST /orders`, trừ số dư ví, cập nhật query `case` và `wallet`, thông báo thành công và làm mới giao diện hồ sơ.
  - Khi nạp tiền qua VietQR tại `/dashboard/payment?pid=...`: Bấm "Quay lại hồ sơ" chuyển hướng về `/dashboard/case/${intent.caseId}`.
- **Product facts / constraints:**
  - *Cơ chế Server Redirect của Route:* Tệp `apps/web-1/app/dashboard/case/[id]/payment/page.tsx` là Next.js Server Component bất đồng bộ, thực hiện `const { id } = await params; redirect('/dashboard/case/${id}');`. Component này không render bất kỳ thẻ HTML hay chuỗi văn bản giao diện nào ra client.
  - *Chuyển đổi mô hình thanh toán sang Ví & Credit:* Hệ thống đã tái cấu trúc từ thanh toán tiền mặt trực tiếp theo case sang cơ chế: Nạp tiền vào ví qua chuyển khoản VietQR (`/dashboard/payment?pid=...`) -> Sử dụng số dư ví để mua credit/thanh toán gói đánh giá (`CreditQuantityModal`).
  - *Thanh toán theo case trong Không gian làm việc (`/dashboard/case/[id]`):*
    - `UnpaidAlertBanner` hiển thị khi hồ sơ chưa có credit (`credit_balance === 0` hoặc null) để nhắc nhở sinh viên mua credit kích hoạt phản biện.
    - `CreditQuantityModal` tính toán số tiền cần thanh toán dựa theo gói dịch vụ (Gói AI Audit mặc định 79,000 VND; gói khác từ 1 đến 50 credit). Modal tự động so sánh với số dư ví hiện tại (`walletBalance`). Nếu ví không đủ, hiển thị số tiền thiếu và nút "Nạp & Thanh toán qua VietQR".
    - Hook `useShortageDepositRedirect` tạo một bản ghi nạp tiền (`useCreateDeposit`), lưu thông tin ý định `{ caseId, quantity, orderIdempotencyKey, serviceType }` vào bộ nhớ trình duyệt (`localStorage`) qua `saveBuyCreditAfterDepositIntent`, rồi điều hướng sang `/dashboard/payment?pid=${deposit.depositId}`.
  - *Thanh toán chuyển khoản VietQR & Xác nhận giao dịch (`/dashboard/payment?pid=...`):*
    - Khi có `intent.caseId`, nút điều hướng hiển thị văn bản "Quay lại hồ sơ" trỏ về `/dashboard/case/${intent.caseId}` (thay vì "Về trang ví").
    - Thông tin ngân hàng và mã QR code được hiển thị qua `PaymentBankInfo`: mã VietQR nhúng qua thẻ `<img>` với thuộc tính `alt="QR chuyển khoản nạp tiền"`.
    - Minh chứng chuyển khoản được kiểm tra bởi hàm `validatePaymentProof` trong `lib/pricing.ts`: giới hạn kích thước tối đa 5MB, định dạng cho phép: JPG, PNG, WEBP, HEIC, HEIF.
  - *Dữ liệu lịch sử giao diện CasePayment trực tiếp (Mã nguồn trước commit `87ec2c0`):* Trước đợt refactor credit, chính tệp `apps/web-1/app/dashboard/case/[id]/payment/page.tsx` từng chứa giao diện thanh toán đơn trang hoàn chỉnh gồm: Thông tin tài khoản ngân hàng MB Bank (STK 0909090909), mã VietQR động, và khung tải lên biên lai kéo thả. Toàn bộ nội dung này được kiểm kê chi tiết ở phần 2.8.

---

## Layer 2: Interactive Inventory

### 2.1 Route Entry & Chuyển hướng máy chủ (Server Redirect)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/payment/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `casePayment.redirect.server` | `CasePaymentRedirect` (`page.tsx:3–6`) | Navigation | *(Không render UI - Server redirect)* | `/dashboard/case/${id}` | server redirect (`redirect()`) |

---

### 2.2 Form & Modal thanh toán theo hồ sơ trong Case Workspace (`/dashboard/case/[id]`)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/UnpaidAlertBanner.tsx`, `StatusGuidanceCard.tsx`, `CreditQuantityModal.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `casePayment.unpaidBanner.title` | `UnpaidAlertBanner` > `h4` (`UnpaidAlertBanner.tsx:18`) | Heading | Chưa có credit | — | Hiển thị khi `(creditBalance ?? 0) <= 0` |
| `casePayment.unpaidBanner.description` | `UnpaidAlertBanner` > `p` (`UnpaidAlertBanner.tsx:19–21`) | Description | Bạn cần mua credit để kích hoạt quy trình phản biện từ Supporter. Mỗi credit tương ứng với một lượt đánh giá. | — | Hiển thị cùng tiêu đề cảnh báo |
| `casePayment.unpaidBanner.cta` | `UnpaidAlertBanner` > `Button` (`UnpaidAlertBanner.tsx:24–31`) | CTA | Mua credit | Kích hoạt `onBuyCredits()` mở `CreditQuantityModal` | default |
| `casePayment.guidance.cta.pay` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:309–311, 589–596`) | CTA | Thanh toán dịch vụ | Kích hoạt `onOpenPayment()` mở modal thanh toán | Hiển thị khi hồ sơ cần thanh toán (`isFree === false`) |
| `casePayment.guidance.cta.selectPackage` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:309–311`) | CTA | Chọn gói đánh giá | Kích hoạt `onOpenPayment()` mở `PackageSelectionModal` | Hiển thị khi `isFree === true` |
| `casePayment.guidance.cta.buyCredit` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:445–453`) | CTA | Mua credit | Kích hoạt `onOpenPayment()` | Hiển thị tại trạng thái thiếu credit |
| `casePayment.modal.title` | `CreditQuantityModal` > `Modal` title (`CreditQuantityModal.tsx:109`) | Modal | Thanh toán gói đánh giá | — | Khi modal mở (`opened={true}`) |
| `casePayment.modal.quantity.label` | `CreditQuantityModal` > `NumberInput` label (`CreditQuantityModal.tsx:117`) | Label | Số lượng credit | — | Ẩn khi `isAiAudit === true` |
| `casePayment.modal.quantity.desc` | `CreditQuantityModal` > `NumberInput` description (`CreditQuantityModal.tsx:118`) | Helper | Từ 1 đến 50 credit | — | Ẩn khi `isAiAudit === true` |
| `casePayment.modal.price.label` | `CreditQuantityModal` > Card giá > span (`CreditQuantityModal.tsx:129`) | Label | Đơn giá | — | default |
| `casePayment.modal.price.value` | `CreditQuantityModal` > Card giá > span (`CreditQuantityModal.tsx:130`) | Item | `<code>{formatPrice(unitPrice)}</code>` | — | default (Ví dụ: `79,000 VND`) |
| `casePayment.modal.quantity.summaryLabel` | `CreditQuantityModal` > Card giá > span (`CreditQuantityModal.tsx:133`) | Label | Số lượng | — | Ẩn khi `isAiAudit === true` |
| `casePayment.modal.quantity.summaryValue` | `CreditQuantityModal` > Card giá > span (`CreditQuantityModal.tsx:134`) | Item | `<code>{effectiveQuantity}</code>` | — | Ẩn khi `isAiAudit === true` |
| `casePayment.modal.total.label` | `CreditQuantityModal` > Card giá > span (`CreditQuantityModal.tsx:138`) | Label | Tổng thanh toán | — | default |
| `casePayment.modal.total.value` | `CreditQuantityModal` > Card giá > span (`CreditQuantityModal.tsx:139`) | Item | `<code>{formatPrice(totalAmount)}</code>` | — | default (chữ màu brand) |
| `casePayment.modal.wallet.currentLabel` | `CreditQuantityModal` > Paper ví > span (`CreditQuantityModal.tsx:145`) | Label | Số dư ví hiện tại | — | default |
| `casePayment.modal.wallet.currentValue` | `CreditQuantityModal` > Paper ví > strong (`CreditQuantityModal.tsx:146`) | Item | `<code>{formatPrice(walletBalance)}</code>` | — | default |
| `casePayment.modal.wallet.afterLabel` | `CreditQuantityModal` > Paper ví > span (`CreditQuantityModal.tsx:149`) | Label | Số dư sau thanh toán | — | default |
| `casePayment.modal.wallet.afterValue` | `CreditQuantityModal` > Paper ví > strong (`CreditQuantityModal.tsx:150`) | Item | `<code>{formatPrice(walletBalance - totalAmount)}</code>` | — | default |
| `casePayment.modal.wallet.statusLabel` | `CreditQuantityModal` > Paper ví > span (`CreditQuantityModal.tsx:153`) | Label | Tình trạng ví | — | default |
| `casePayment.modal.wallet.sufficient` | `CreditQuantityModal` > Paper ví > span (`CreditQuantityModal.tsx:155`) | Status | Đủ số dư ví | — | Hiển thị khi `hasSufficientBalance === true` (màu xanh teal) |
| `casePayment.modal.wallet.shortage` | `CreditQuantityModal` > Paper ví > span (`CreditQuantityModal.tsx:155`) | Status | `<code>Số dư không đủ — thiếu {formatPrice(shortage)}</code>` | — | Hiển thị khi `hasSufficientBalance === false` (màu đỏ) |
| `casePayment.modal.btn.cancel` | `CreditQuantityModal` > `Button` (`CreditQuantityModal.tsx:161–163`) | CTA | Hủy | Đóng modal thanh toán | Disabled khi đang xử lý thanh toán |
| `casePayment.modal.btn.pay` | `CreditQuantityModal` > `Button` (`CreditQuantityModal.tsx:164–172`) | CTA | `<code>Thanh toán {formatPrice(totalAmount)}</code>` | Gọi API `POST /orders` trừ tiền ví và mua credit | Hiển thị khi đủ số dư ví (`hasSufficientBalance === true`) |
| `casePayment.modal.btn.topupAndPay` | `CreditQuantityModal` > `Button` (`CreditQuantityModal.tsx:164–172`) | CTA | Nạp & Thanh toán qua VietQR | Kích hoạt `startShortageDeposit` -> chuyển hướng sang `/dashboard/payment?pid=...` | Hiển thị khi thiếu số dư ví (`hasSufficientBalance === false`) |
| `casePayment.modal.toast.successManual` | `CreditQuantityModal` > `notifications.show` (`CreditQuantityModal.tsx:55–60`) | Toast | Đã mua `<code>{isAiAudit ? 2 : effectiveQuantity}</code>` credit. Quay lại hồ sơ để chọn loại đánh giá và gửi. | — | Tiêu đề Toast: `Thanh toán thành công` (màu teal) |
| `casePayment.modal.toast.successAuto` | `CreditQuantityModal` > `notifications.show` (`CreditQuantityModal.tsx:55–60`) | Toast | Đơn hàng #`<code>{data.orderId}</code>` đã được thanh toán thành công. | — | Tiêu đề Toast: `Thanh toán thành công` (màu teal) |
| `casePayment.modal.toast.error` | `CreditQuantityModal` > `notifications.show` (`CreditQuantityModal.tsx:73–77`) | Toast | `<code>{errData?.message || "Vui lòng thử lại sau."}</code>` | — | Tiêu đề Toast: `Tạo đơn hàng thất bại` (màu red) |
| `casePayment.modal.errorInline` | `CreditQuantityModal` > `Text` (`CreditQuantityModal.tsx:174–180`) | Error | `<code>{mutation.error?.response?.data?.message || "Đã xảy ra lỗi khi tạo đơn hàng."}</code>` | — | Hiển thị khi mutation có lỗi (`mutation.isError === true`) |

---

### 2.3 Thẻ chi tiết giao dịch nạp tiền & Trạng thái thanh toán

*Nguồn: `apps/web-1/app/dashboard/payment/page.tsx`, `PaymentDepositMeta.tsx`, `lib/deposit-display.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `casePayment.nav.backToCase` | `PaymentPage` > button back (`page.tsx:103–109`) | Navigation | Quay lại hồ sơ | Điều hướng về `/dashboard/case/${intent.caseId}` | Hiển thị khi có `intent?.caseId` từ case |
| `casePayment.nav.backToWallet` | `PaymentPage` > button back (`page.tsx:103–109`) | Navigation | Về trang ví | Điều hướng về `/dashboard/wallet` | Hiển thị khi không có `intent?.caseId` |
| `casePayment.detail.title` | `PaymentPage` > `h2` (`page.tsx:112–114`) | Heading | Chi tiết nạp tiền | — | default (`WALLET_COPY.detailTitle`) |
| `casePayment.status.badge.pendingNoProof` | `PaymentPage` > Status badge (`page.tsx:115–123`, `lib/deposit-display.ts:70–78`) | Badge | Cần bổ sung chứng minh | — | Trạng thái `pending` và chưa tải minh chứng (`hasProof === false`) |
| `casePayment.status.desc.pendingNoProof` | `PaymentPage` > `p` giải thích (`page.tsx:124`, `lib/deposit-display.ts:70–78`) | Description | Số dư chưa thay đổi. Thêm ảnh chứng minh để được xác minh. | — | Trạng thái `pending` và chưa có minh chứng |
| `casePayment.status.badge.pendingWithProof` | `PaymentPage` > Status badge (`page.tsx:115–123`, `lib/deposit-display.ts:79–87`) | Badge | Đang chờ xác minh | — | Trạng thái `pending` đã gửi minh chứng (`hasProof === true`) |
| `casePayment.status.desc.pendingWithProof` | `PaymentPage` > `p` giải thích (`page.tsx:124`, `lib/deposit-display.ts:79–87`) | Description | Đã gửi ảnh chứng minh. Số dư chưa thay đổi. Bạn có thể chờ. | — | Trạng thái `pending` đã có minh chứng |
| `casePayment.status.badge.verified` | `PaymentPage` > Status badge (`page.tsx:115–123`, `lib/deposit-display.ts:61–69`) | Badge | Đã cộng vào ví | — | Trạng thái `verified` (màu xanh lá) |
| `casePayment.status.desc.verified` | `PaymentPage` > `p` giải thích (`page.tsx:124`, `lib/deposit-display.ts:61–69`) | Description | Tiền đã vào số dư. Xem ảnh chứng minh hoặc hoạt động ví. | — | Trạng thái `verified` |
| `casePayment.status.badge.amountMismatch` | `PaymentPage` > Status badge (`page.tsx:115–123`, `lib/deposit-display.ts:43–51`) | Badge | Số tiền chưa khớp | — | Trạng thái `amount_mismatch` (màu vàng) |
| `casePayment.status.desc.amountMismatch` | `PaymentPage` > `p` giải thích (`page.tsx:124`, `lib/deposit-display.ts:43–51`) | Description | Số tiền chuyển khoản không khớp yêu cầu. Đội ngũ đang đối soát. Số dư chưa thay đổi. | — | Trạng thái `amount_mismatch` |
| `casePayment.status.badge.rejected` | `PaymentPage` > Status badge (`page.tsx:115–123`, `lib/deposit-display.ts:52–60`) | Badge | Cần xử lý lại | — | Trạng thái `rejected` (màu đỏ) |
| `casePayment.status.desc.rejected` | `PaymentPage` > `p` giải thích (`page.tsx:124`, `lib/deposit-display.ts:52–60`) | Description | Yêu cầu chưa được xác minh. Xem lý do rồi tạo yêu cầu nạp mới. | — | Trạng thái `rejected` |
| `casePayment.status.badge.unknown` | `PaymentPage` > Status badge (`page.tsx:115–123`, `lib/deposit-display.ts:98–105`) | Badge | Trạng thái không xác định | — | Trạng thái không nằm trong danh mục xác định |
| `casePayment.status.desc.unknown` | `PaymentPage` > `p` giải thích (`page.tsx:124`, `lib/deposit-display.ts:98–105`) | Description | Mở chi tiết để xem yêu cầu nạp tiền. | — | Trạng thái không xác định |
| `casePayment.meta.createdAtLabel` | `PaymentDepositMeta` > span (`PaymentDepositMeta.tsx:21`) | Label | Thời điểm tạo yêu cầu | — | default (`WALLET_COPY.requestCreated`) |
| `casePayment.meta.createdAtValue` | `PaymentDepositMeta` > span (`PaymentDepositMeta.tsx:22`) | Item | `<code>{createdAt}</code>` | — | Ngày giờ định dạng `vi-VN` |
| `casePayment.meta.bankCreditedLabel` | `PaymentDepositMeta` > span (`PaymentDepositMeta.tsx:26`) | Label | Thời điểm ngân hàng ghi nhận | — | Hiển thị khi `bankCreditedAt !== null` |
| `casePayment.meta.bankCreditedValue` | `PaymentDepositMeta` > span (`PaymentDepositMeta.tsx:27`) | Item | `<code>{bankCreditedAt}</code>` | — | Hiển thị khi `bankCreditedAt !== null` |
| `casePayment.meta.amountLabel` | `PaymentDepositMeta` > span (`PaymentDepositMeta.tsx:31`) | Label | Số tiền | — | default |
| `casePayment.meta.amountValue` | `PaymentDepositMeta` > span (`PaymentDepositMeta.tsx:32–34`) | Item | `<code>{amount.toLocaleString("vi-VN")} {currency}</code>` | — | default |
| `casePayment.meta.activityLabel` | `PaymentDepositMeta` > span (`PaymentDepositMeta.tsx:37`) | Label | Nội dung giao dịch | — | default (`WALLET_COPY.activityDescription`) |
| `casePayment.meta.activityValue` | `PaymentDepositMeta` > span (`PaymentDepositMeta.tsx:38`) | Item | Nạp tiền qua chuyển khoản ngân hàng | — | default (`WALLET_COPY.depositActivityText`) |
| `casePayment.meta.transferContentLabel` | `PaymentDepositMeta` > span (`PaymentDepositMeta.tsx:41`) | Label | Nội dung chuyển khoản | — | default (`WALLET_COPY.transferContent`) |
| `casePayment.meta.transferContentValue` | `PaymentDepositMeta` > span (`PaymentDepositMeta.tsx:42`) | Item | `<code>{transferContent}</code>` | — | Chuỗi mã chuyển khoản (font monospace) |

---

### 2.4 Hướng dẫn chuyển khoản ngân hàng & QR Code VietQR

*Nguồn: `apps/web-1/app/dashboard/payment/_components/PaymentBankInfo.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `casePayment.bank.qrImage` | `PaymentBankInfo` > `<img>` (`PaymentBankInfo.tsx:18–22`) | Alt text | QR chuyển khoản nạp tiền | — | Hiển thị khi `bankInfo.qrUrl` tồn tại |
| `casePayment.bank.nameLabel` | `PaymentBankInfo` > span (`PaymentBankInfo.tsx:26`) | Label | Ngân hàng | — | default |
| `casePayment.bank.nameValue` | `PaymentBankInfo` > span (`PaymentBankInfo.tsx:27`) | Item | `<code>{bankInfo.bankName}</code>` | — | default |
| `casePayment.bank.accountNumberLabel` | `PaymentBankInfo` > span (`PaymentBankInfo.tsx:30`) | Label | Số tài khoản | — | default |
| `casePayment.bank.accountNumberValue` | `PaymentBankInfo` > span (`PaymentBankInfo.tsx:31`) | Item | `<code>{bankInfo.accountNumber}</code>` | — | default |
| `casePayment.bank.accountNameLabel` | `PaymentBankInfo` > span (`PaymentBankInfo.tsx:34`) | Label | Chủ tài khoản | — | default |
| `casePayment.bank.accountNameValue` | `PaymentBankInfo` > span (`PaymentBankInfo.tsx:35`) | Item | `<code>{bankInfo.accountName}</code>` | — | default |

---

### 2.5 Khu vực tải lên minh chứng chuyển khoản (Proof Upload)

*Nguồn: `apps/web-1/app/dashboard/payment/_components/ProofUpload.tsx`, `apps/web-1/lib/pricing.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `casePayment.upload.hint` | `ProofUpload` > `p` hướng dẫn (`ProofUpload.tsx:46–48`) | Description | Số dư chưa thay đổi. Thêm ảnh chứng minh để quản trị viên kiểm tra. | — | default |
| `casePayment.upload.dropzone.select` | `ProofUpload` > button dropzone > span (`ProofUpload.tsx:79`) | CTA | Nhấn để chọn ảnh chụp | Kích hoạt click chọn file từ máy tính | Hiển thị khi chưa chọn file (`!selectedFile`) |
| `casePayment.upload.dropzone.paste` | `ProofUpload` > button dropzone > span (`ProofUpload.tsx:80`) | Helper | Hoặc nhấn Ctrl+V để dán ảnh từ bộ nhớ tạm | Hỗ trợ paste ảnh trực tiếp qua sự kiện `onPaste` | Hiển thị khi chưa chọn file (`!selectedFile`) |
| `casePayment.upload.preview.image` | `ProofUpload` > `img` xem trước (`ProofUpload.tsx:87–91`) | Alt text | Xem trước ảnh chụp chuyển khoản | — | Hiển thị khi file ảnh hợp lệ để xem trước |
| `casePayment.upload.preview.unsupported` | `ProofUpload` > `p` fallback (`ProofUpload.tsx:94–96`) | Helper | Không thể xem trước định dạng này tại đây. Bạn vẫn có thể gửi tệp. | — | Hiển thị với các định dạng không hỗ trợ xem trước (ví dụ HEIC/HEIF) |
| `casePayment.upload.file.name` | `ProofUpload` > `p` tên file (`ProofUpload.tsx:100`) | Item | `<code>{selectedFile.name}</code>` | — | Hiển thị khi đã chọn tệp |
| `casePayment.upload.file.size` | `ProofUpload` > `p` dung lượng file (`ProofUpload.tsx:101–103`) | Item | `<code>{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</code>` | — | Hiển thị dung lượng theo MB |
| `casePayment.upload.btn.changeFile` | `ProofUpload` > button đổi file (`ProofUpload.tsx:106–112`) | CTA | Đổi file | Xóa tệp hiện tại và reset input file | Hiển thị khi đã chọn tệp |
| `casePayment.upload.errorInline` | `ProofUpload` > `p` thông báo lỗi (`ProofUpload.tsx:116`) | Error | `<code>{uploadError}</code>` | — | Hiển thị khi `uploadError` có nội dung |
| `casePayment.upload.btn.submit` | `ProofUpload` > `Button` (`ProofUpload.tsx:117–130`) | CTA | Thêm ảnh chứng minh | Gọi API `POST /payments/proof` tải ảnh lên máy chủ | Disabled khi chưa chọn file (`!selectedFile`) |
| `casePayment.upload.btn.loading` | `ProofUpload` > `Button` (`ProofUpload.tsx:128`) | CTA | Đang tải lên... | — | Trạng thái mutation đang tải (`uploadProofMutation.isPending`) |
| `casePayment.upload.toast.successTitle` | `useUploadPaymentProof` > Toast (`usePayment.ts:61`) | Toast | Thành công | — | Tiêu đề toast khi tải minh chứng thành công |
| `casePayment.upload.toast.successMsg` | `useUploadPaymentProof` > Toast (`usePayment.ts:62`) | Toast | Minh chứng đã được gửi. Quản trị viên sẽ kiểm tra. | — | Nội dung toast thành công (màu green) |
| `casePayment.upload.toast.errorTitle` | `useUploadPaymentProof` > Toast (`usePayment.ts:69`) | Toast | Lỗi | — | Tiêu đề toast khi tải minh chứng thất bại |
| `casePayment.upload.toast.errorMsg` | `useUploadPaymentProof` > Toast (`usePayment.ts:70`) | Toast | `<code>{error.response?.data?.message || "Tải lên thất bại."}</code>` | — | Nội dung toast lỗi (màu red) |
| `casePayment.upload.validate.sizeTitle` | `validatePaymentProof` > Toast (`lib/pricing.ts:64`) | Toast | Kích thước file quá lớn | — | Kích hoạt khi tệp vượt quá 5MB |
| `casePayment.upload.validate.sizeMsg` | `validatePaymentProof` > Toast (`lib/pricing.ts:65`) | Toast | Kích thước file vượt quá 5MB. Vui lòng chọn file nhỏ hơn. | — | Nội dung thông báo kích thước file |
| `casePayment.upload.validate.typeTitle` | `validatePaymentProof` > Toast (`lib/pricing.ts:73`) | Toast | Định dạng không hợp lệ | — | Kích hoạt khi tệp sai định dạng ảnh |
| `casePayment.upload.validate.typeMsg` | `validatePaymentProof` > Toast (`lib/pricing.ts:74`) | Toast | Chỉ chấp nhận định dạng ảnh (JPG, PNG, WEBP, HEIC/HEIF). | — | Nội dung thông báo định dạng file |

---

### 2.6 Xem trước và quản lý ảnh minh chứng đã gửi (Proof Preview)

*Nguồn: `apps/web-1/app/dashboard/payment/_components/ProofPreview.tsx`, `lib/deposit-display.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `casePayment.preview.sectionTitle` | `PaymentPage` > `h3` (`page.tsx:142`) | Heading | Đã gửi ảnh chứng minh | — | Hiển thị khi `hasProof && payment.proof_file_url` (`WALLET_COPY.hasProof`) |
| `casePayment.preview.noProofText` | `PaymentPage` > `p` (`page.tsx:146`) | Description | Chưa có ảnh chứng minh | — | Hiển thị khi `payment.status === "pending" && !hasProof` (`WALLET_COPY.noProof`) |
| `casePayment.preview.btn.ariaLabel` | `ProofPreview` > button xem ảnh (`ProofPreview.tsx:32`) | Aria-label | Xem ảnh chứng minh kích thước đầy đủ | Mở modal xem ảnh kích thước lớn | Hiển thị khi tệp là hình ảnh |
| `casePayment.preview.img.thumbnail` | `ProofPreview` > `img` thumbnail (`ProofPreview.tsx:39–47`) | Alt text | Ảnh chứng minh chuyển khoản | Mở modal xem ảnh kích thước lớn | Hiển thị thumbnail ảnh |
| `casePayment.preview.link.fullsize` | `ProofPreview` > span liên kết (`ProofPreview.tsx:49–51`) | CTA | Xem ảnh kích thước đầy đủ | Mở modal xem ảnh kích thước lớn | default |
| `casePayment.preview.modal.title` | `ProofPreview` > `Modal` title (`ProofPreview.tsx:56`) | Modal | Ảnh chứng minh chuyển khoản | — | Tiêu đề modal hiển thị ảnh lớn |
| `casePayment.preview.modal.closeAria` | `ProofPreview` > `Modal` closeButton (`ProofPreview.tsx:59`) | Aria-label | Đóng ảnh chứng minh | Đóng modal xem ảnh | default |
| `casePayment.preview.modal.img` | `ProofPreview` > Modal `img` (`ProofPreview.tsx:62–66`) | Alt text | Ảnh chứng minh chuyển khoản | — | Ảnh hiển thị trong modal |
| `casePayment.preview.link.nonImage` | `ProofPreview` > `a` mở tệp ngoài (`ProofPreview.tsx:20–27`) | Navigation | Mở minh chứng | Mở đường dẫn tệp trong tab mới (`target="_blank"`) | Hiển thị khi tệp không phải định dạng ảnh thông thường |
| `casePayment.preview.error.failed` | `ProofPreview` > `Text` lỗi (`ProofPreview.tsx:14`) | Error | Không mở được ảnh chứng minh. Thử lại sau hoặc liên hệ hỗ trợ. | — | Hiển thị khi tải ảnh thất bại (`failed === true`, `WALLET_COPY.proofUnavailable`) |

---

### 2.7 Cảnh báo và xử lý ngoại lệ thanh toán (Alerts & Modals)

*Nguồn: `apps/web-1/app/dashboard/payment/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `casePayment.alert.missingId.title` | `PaymentPage` > `Alert` title (`page.tsx:44`) | Error | Thiếu thông tin | — | Kích hoạt khi không có tham số URL `pid` |
| `casePayment.alert.missingId.msg` | `PaymentPage` > `Alert` body (`page.tsx:45`) | Description | Không tìm thấy mã giao dịch. Vui lòng thử lại. | — | Kích hoạt khi thiếu `pid` |
| `casePayment.alert.missingId.btn` | `PaymentPage` > `Button` (`page.tsx:47`) | CTA | Về trang ví | Điều hướng về `/dashboard/wallet` | default (`WALLET_COPY.backToWallet`) |
| `casePayment.alert.loadError.title` | `PaymentPage` > `Alert` title (`page.tsx:72`) | Error | Lỗi | — | Kích hoạt khi API trả lỗi hoặc không tìm thấy giao dịch |
| `casePayment.alert.loadError.msg` | `PaymentPage` > `Alert` body (`page.tsx:73`) | Description | Không thể tải thông tin nạp tiền. | — | Kích hoạt khi query nạp tiền lỗi |
| `casePayment.alert.loadError.btnCase` | `PaymentPage` > `Button` (`page.tsx:76`) | CTA | Quay lại hồ sơ | Điều hướng về `/dashboard/case/${errorIntent.caseId}` | Hiển thị khi có lưu vết intent `caseId` |
| `casePayment.alert.loadError.btnWallet` | `PaymentPage` > `Button` (`page.tsx:76`) | CTA | Về trang ví | Điều hướng về `/dashboard/wallet` | Hiển thị khi không có lưu vết intent `caseId` |
| `casePayment.alert.amountMismatch.msg` | `PaymentPage` > `Alert` (`page.tsx:151–155`) | Error | `<code>{display.explanation} Không thể gửi lại ảnh chứng minh cho yêu cầu này.</code>` | — | Hiển thị khi `payment.status === "amount_mismatch"` |
| `casePayment.alert.rejected.msg` | `PaymentPage` > `Alert` (`page.tsx:158–160`) | Error | `<code>{payment.rejection_reason || "Minh chứng không hợp lệ."}</code>` | — | Hiển thị khi `payment.status === "rejected"` |
| `casePayment.alert.rejected.btnNew` | `PaymentPage` > `Button` (`page.tsx:161–167`) | CTA | Tạo yêu cầu nạp mới | Điều hướng về `/dashboard/wallet?amount=${payment.amount}` | default (`WALLET_COPY.newDeposit`) |

---

### 2.8 Dữ liệu lịch sử: Giao diện CasePayment trực tiếp (Mã nguồn trước commit `87ec2c0`)

*Nguồn: Lịch sử commit `87ec2c0^:apps/web-1/app/dashboard/case/[id]/payment/page.tsx` (Lưu vết phục vụ đối soát các subcomponent thanh toán theo case từng hiển thị độc lập tại route này)*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `casePayment.legacy.loadError` | `CasePaymentPage` > div alert (`page.tsx:117–121`) | Error | Không thể tải dữ liệu hồ sơ. Vui lòng thử lại sau. | — | Hiển thị khi API trả lỗi hồ sơ |
| `casePayment.legacy.btn.back` | `CasePaymentPage` > header > `Button` (`page.tsx:131–138`) | Navigation | Quay lại hồ sơ | Điều hướng về `/dashboard/case/${caseId}` | default |
| `casePayment.legacy.header.title` | `CasePaymentPage` > header > `h2` (`page.tsx:140`) | Heading | Thanh toán & Xác minh giao dịch | — | default |
| `casePayment.legacy.header.caseCode` | `CasePaymentPage` > header > `p` (`page.tsx:141`) | Item | Mã hồ sơ: `<code>{caseData.case_code}</code>` | — | default |
| `casePayment.legacy.bank.title` | `CasePaymentPage` > Card ngân hàng > `h3` (`page.tsx:149–152`) | Heading | Thông tin chuyển khoản ngân hàng | — | default |
| `casePayment.legacy.bank.nameLabel` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:155`) | Label | Ngân hàng | — | default |
| `casePayment.legacy.bank.nameValue` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:156`) | Item | MB Bank (Ngân hàng Quân Đội) | — | default |
| `casePayment.legacy.bank.accNoLabel` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:159`) | Label | Số tài khoản | — | default |
| `casePayment.legacy.bank.accNoValue` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:160`) | Item | 0909090909 | — | default |
| `casePayment.legacy.bank.accNameLabel` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:163`) | Label | Chủ tài khoản | — | default |
| `casePayment.legacy.bank.accNameValue` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:164`) | Item | NEXUS PLATFORM | — | default |
| `casePayment.legacy.bank.roundsLabel` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:167`) | Label | Số lượt | — | Hiển thị khi `pendingRounds.length > 0` |
| `casePayment.legacy.bank.roundsValue` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:168`) | Item | `<code>{pendingRounds.length}</code>` | — | Hiển thị khi `pendingRounds.length > 0` |
| `casePayment.legacy.bank.amountLabel` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:172`) | Label | Số tiền cần chuyển | — | default |
| `casePayment.legacy.bank.amountValue` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:174`) | Item | `<code>{formatPrice(amount)}</code>` | — | default |
| `casePayment.legacy.bank.contentLabel` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:178`) | Label | Nội dung chuyển khoản | — | default |
| `casePayment.legacy.bank.contentValue` | `CasePaymentPage` > Card ngân hàng > span (`page.tsx:180`) | Item | `<code>{caseData.case_code} thanh toan</code>` | — | Cú pháp chuyển khoản định danh theo mã hồ sơ |
| `casePayment.legacy.bank.note` | `CasePaymentPage` > Card ngân hàng > div (`page.tsx:185–187`) | Helper | **Lưu ý quan trọng:** Vui lòng quét mã QR hoặc ghi chính xác nội dung chuyển khoản ở trên để hệ thống tự động nhận diện giao dịch nhanh hơn. | — | default |
| `casePayment.legacy.qr.title` | `CasePaymentPage` > Card VietQR > `h4` (`page.tsx:195–198`) | Heading | Quét mã VietQR chuyển khoản | — | default |
| `casePayment.legacy.qr.image` | `CasePaymentPage` > Card VietQR > `img` (`page.tsx:202–206`) | Alt text | Mã QR Chuyển khoản VietQR | — | URL: `https://img.vietqr.io/image/mb-0909090909-print.png?...` |
| `casePayment.legacy.qr.helper` | `CasePaymentPage` > Card VietQR > `p` (`page.tsx:209–211`) | Helper | Mã QR chứa sẵn số tiền và nội dung. Chỉ cần mở ứng dụng ngân hàng và quét để thanh toán. | — | default |
| `casePayment.legacy.upload.title` | `CasePaymentPage` > Card upload > `h3` (`page.tsx:218–221`) | Heading | Tải lên biên lai chuyển khoản thành công | — | default |
| `casePayment.legacy.upload.prompt` | `CasePaymentPage` > Dropzone > `p` (`page.tsx:250–252`) | CTA | Kéo thả biên lai giao dịch vào đây hoặc click để chọn file | Mở hộp thoại chọn tệp | Hiển thị khi chưa chọn file (`!selectedFile`) |
| `casePayment.legacy.upload.hint` | `CasePaymentPage` > Dropzone > `p` (`page.tsx:253–255`) | Helper | Hỗ trợ định dạng ảnh JPG, PNG, WEBP hoặc file PDF (tối đa 5MB) | — | Hiển thị khi chưa chọn file (`!selectedFile`) |
| `casePayment.legacy.upload.fileInfo` | `CasePaymentPage` > Selected file block (`page.tsx:265–266`) | Item | `<code>{selectedFile.name}</code>` — `<code>{(selectedFile.size / 1024).toFixed(1)} KB</code>` | — | Hiển thị khi đã chọn file |
| `casePayment.legacy.upload.progress` | `CasePaymentPage` > Progress bar block (`page.tsx:280–292`) | Status | Đang tải file lên... `<code>{uploadProgress}%</code>` | — | Hiển thị khi đang upload (`isUploading === true`) |
| `casePayment.legacy.upload.success` | `CasePaymentPage` > Success banner (`page.tsx:302–307`) | Toast | Gửi minh chứng thành công! Đang tự động chuyển hướng về trang hồ sơ... | Tự động chuyển hướng về `/dashboard/case/${caseId}` sau 1.5s | Hiển thị khi upload thành công |
| `casePayment.legacy.upload.btnCancel` | `CasePaymentPage` > `Button` (`page.tsx:311–318`) | CTA | Hủy bỏ | Điều hướng về `/dashboard/case/${caseId}` | Disabled khi đang upload |
| `casePayment.legacy.upload.btnSubmit` | `CasePaymentPage` > `Button` (`page.tsx:319–334`) | CTA | Xác nhận gửi minh chứng | Tải ảnh minh chứng lên hệ thống | Disabled khi chưa chọn file hoặc đang upload |
| `casePayment.legacy.upload.btnSubmitting` | `CasePaymentPage` > `Button` (`page.tsx:327–330`) | CTA | Đang gửi... | — | Trạng thái nút khi `isUploading === true` (kèm biểu tượng xoay) |

---

## Layer 3: Page Notes

### 3.1 Terminology variants (Biến thể thuật ngữ)

| Khái niệm | Các biến thể từ ngữ xuất hiện trong mã nguồn | Vị trí xuất hiện |
| :--- | :--- | :--- |
| **Thanh toán dịch vụ / Mua gói** | `Thanh toán dịch vụ` vs `Thanh toán gói đánh giá` vs `Thanh toán & Xác minh giao dịch` vs `Nạp & Thanh toán qua VietQR` vs `Nạp tiền qua chuyển khoản` | Xuất hiện phân tán giữa `StatusGuidanceCard.tsx`, `CreditQuantityModal.tsx`, `page.tsx` và `WALLET_COPY`. |
| **Đơn vị chi phí / Quyền lợi** | `credit` vs `Credit` vs `VND` vs `lượt đánh giá` | `UnpaidAlertBanner.tsx` dùng "credit" và "lượt đánh giá"; `CreditQuantityModal.tsx` dùng "credit" và "VND"; `CasePaymentPage` lịch sử dùng "VND" và "Số lượt". |
| **Minh chứng thanh toán** | `minh chứng` vs `ảnh chứng minh` vs `ảnh chụp chuyển khoản` vs `biên lai chuyển khoản thành công` vs `biên lai giao dịch` | `ProofUpload.tsx` dùng "ảnh chứng minh" và "ảnh chụp"; `ProofPreview.tsx` dùng "ảnh chứng minh" và "minh chứng"; mã nguồn cũ dùng "biên lai chuyển khoản thành công" và "biên lai giao dịch". |
| **Trạng thái duyệt giao dịch** | `Cần bổ sung chứng minh` vs `Đang chờ xác minh` vs `Đã cộng vào ví` vs `Cần xử lý lại` vs `Số tiền chưa khớp` | Định nghĩa tại `lib/deposit-display.ts` phục vụ hiển thị nhãn trạng thái giao dịch. |
| **Đối tượng tiếp nhận & kiểm tra** | `quản trị viên` vs `Đội ngũ` vs `Supporter` | `UnpaidAlertBanner.tsx` ghi "để Supporter có thể bắt đầu đánh giá"; `usePayment.ts` và `ProofUpload.tsx` ghi "Quản trị viên sẽ kiểm tra"; `deposit-display.ts` ghi "Đội ngũ đang đối soát". |

---

### 3.2 Verified code behavior (Hành vi code xác minh)

1. **Cơ chế chuyển hướng của Route `/dashboard/case/[id]/payment`:**
   - Tệp `apps/web-1/app/dashboard/case/[id]/payment/page.tsx` hoạt động hoàn toàn như một Server Component điều hướng: `const { id } = await params; redirect('/dashboard/case/${id}');`.
   - Bất kỳ request nào gửi trực tiếp đến URL này đều bị đẩy về trang chi tiết hồ sơ `/dashboard/case/[id]` mà không render nội dung.
2. **Luồng xử lý thanh toán thiếu số dư (Shortage Deposit Flow):**
   - Khi người dùng ở trang `/dashboard/case/[id]` bấm "Thanh toán dịch vụ" hoặc "Mua credit", modal `CreditQuantityModal` được mở ra.
   - Nếu số dư ví không đủ (`walletBalance < totalAmount`), nút hành động chính chuyển thành "Nạp & Thanh toán qua VietQR".
   - Khi bấm, hook `useShortageDepositRedirect` gọi API tạo bản ghi nạp tiền `useCreateDeposit`, đồng thời lưu cấu trúc `{ caseId, quantity, orderIdempotencyKey, serviceType }` vào `localStorage` qua `saveBuyCreditAfterDepositIntent`.
   - Người dùng được chuyển hướng tới trang thanh toán `/dashboard/payment?pid=${deposit.depositId}`.
3. **Cơ chế nút quay lại phụ thuộc Intent (`WALLET_COPY.backToCase`):**
   - Tại trang `/dashboard/payment`, component đọc `intent = readBuyCreditAfterDepositIntent(payment.id)`.
   - Nếu phát hiện `intent?.caseId`, nút bấm quay lại ở góc trên bên trái sẽ hiển thị văn bản "Quay lại hồ sơ" và chuyển hướng về `/dashboard/case/${intent.caseId}`.
   - Nếu không có `intent?.caseId`, nút bấm hiển thị "Về trang ví" và chuyển hướng về `/dashboard/wallet`.
4. **Cơ chế xác thực tệp minh chứng:**
   - Hàm `validatePaymentProof` trong `apps/web-1/lib/pricing.ts` kiểm tra: dung lượng không vượt quá 5MB (`5 * 1024 * 1024` bytes) và định dạng thuộc nhóm `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`.
   - Nếu vi phạm, hàm gọi `notifications.show` hiển thị toast cảnh báo tương ứng ("Kích thước file quá lớn" hoặc "Định dạng không hợp lệ") và chặn quá trình tải lên.
5. **Hỗ trợ dán ảnh từ Clipboard (Paste Event):**
   - Khu vực dropzone trong `ProofUpload.tsx` gắn bộ lắng nghe sự kiện `onPaste`. Người dùng có thể nhấn `Ctrl+V` sau khi chụp màn hình chuyển khoản ngân hàng để tự động nạp ảnh vào form mà không cần lưu ra tệp trước.

---

### 3.3 Unknowns / Questions (Điểm chưa xác minh / Câu hỏi sản phẩm)

1. **Mục đích duy trì route `/dashboard/case/[id]/payment`:**
   - Hiện tại route này chuyển hướng ngay lập tức về `/dashboard/case/[id]`. Cần xác minh từ Product Owner: Route này được giữ lại để đảm bảo tương thích ngược (redirect stub giống `/dashboard/payments`), hay trong tương lai sẽ được phục hồi thành một trang thanh toán độc lập chuyên biệt cho từng hồ sơ?
2. **Tính nhất quán của đối tượng xử lý đối chiếu (Supporter vs Quản trị viên):**
   - Trong `UnpaidAlertBanner.tsx`, văn bản thông báo cho người dùng là *"để Supporter có thể bắt đầu đánh giá hồ sơ"*.
   - Trong `ProofUpload.tsx` và thông báo toast của `usePayment.ts`, câu chữ lại là *"Quản trị viên sẽ kiểm tra"*.
   - Cần xác minh xem vai trò kiểm tra chuyển khoản ngân hàng thuộc về Admin hay Supporter để chuẩn hóa cách truyền tải thông điệp.
3. **Định dạng file PDF trong minh chứng thanh toán:**
   - Trong phiên bản code cũ của trang CasePayment trực tiếp (`87ec2c0^`), hệ thống cho phép *"Hỗ trợ định dạng ảnh JPG, PNG, WEBP hoặc file PDF (tối đa 5MB)"*.
   - Trong phiên bản code hiện tại (`lib/pricing.ts`), hàm `validatePaymentProof` đã loại bỏ hoàn toàn `application/pdf` và chỉ chấp nhận định dạng ảnh. Cần xác nhận xem việc từ chối file PDF biên lai ngân hàng có phải là quyết định nghiệp vụ có chủ đích hay không.
