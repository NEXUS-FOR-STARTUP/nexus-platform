# Page: Xác thực email (Verify Email)
Route: `/auth/verify-email`  
Access: `Public`

---

## Page Context

### User
- **Primary user:** Người dùng vừa tạo tài khoản cần kích hoạt email hoặc người dùng mở liên kết xác thực email có sẵn query parameter (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:3-7, 26-27`).
- **Typical state:** `[Assumption / Cần xác minh]` Đang chờ mã OTP gửi về hòm thư, có thể sốt ruột kiểm tra hòm thư chính/hòm thư rác hoặc gặp trục trặc không nhận được mã.
- **Knowledge level:** Vừa điền thông tin đăng ký hoặc truy cập từ liên kết ngoài, hiểu rằng cần một mã gồm 6 chữ số để kích hoạt tài khoản.

### User goals
- Nhập mã xác minh gồm 6 chữ số nhận từ email để kích hoạt tài khoản Nexus.
- Yêu cầu gửi lại mã xác minh mới nếu không nhận được mã hoặc mã quá hạn.
- Quay lại trang đăng ký/đăng nhập nếu cần đổi email hoặc hủy luồng.

### Business/Product goals
- Đảm bảo địa chỉ email thuộc quyền sở hữu của người dùng trước khi cấp quyền truy cập đầy đủ vào hệ thống và kích hoạt ví tài khoản.
- Đảm bảo tính tương thích ngược (backward compatibility) cho các liên kết truy cập trực tiếp qua URL hoặc hệ thống cũ (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:4-6`).

### Primary action
- Nhập đủ 6 chữ số OTP và nhấn nút `Xác minh email` (hoặc submit tự động khi điền đủ 6 số).

### Secondary actions
- Nhấn `Gửi lại mã` (hoặc đợi đếm ngược giãn cách 60 giây: `Gửi lại sau {resendCooldown}s`).
- Nhấn liên kết `Quay lại đăng ký` (dẫn về `/auth`).
- Nhấn nút `Đi tới đăng nhập` khi xác minh thành công.
- Nhấn `Quay lại đăng ký` khi liên kết bị lỗi (`!emailValid`).
- Đổi giao diện Sáng / Tối qua `ThemeToggler`.

### Entry
- `[Assumption / Cần xác minh]` Truy cập trực tiếp qua URL query string dạng `/auth/verify-email?email=...&returnUrl=...` từ email kích hoạt cũ hoặc bookmark trình duyệt (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:26-27`).

### Exit / next step
- Khi xác minh thành công: Tự động chuyển hướng sau 1.5 giây hoặc bấm `Đi tới đăng nhập` → `/auth?tab=login&returnUrl=[returnUrl]` (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:98-100, 208-209`).
- Khi bấm gửi lại mã mà tài khoản đã xác minh trước đó (lỗi 409): Tự động chuyển hướng ngay → `/auth?tab=login&returnUrl=[returnUrl]` (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:59`).
- Bấm `Quay lại đăng ký` → `/auth` (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:119, 184`).

### Product facts / constraints
- **Trạng thái mã nguồn:** Trang này được đánh dấu là `@deprecated Legacy standalone email verification page` trong mã nguồn. Quy trình xác thực mới của hệ thống được tích hợp inline qua `EmailOtpStep` tại trang `/auth` (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:3-7`).
- **Kiểm tra tham số email:** Phía client kiểm tra email qua regex `EMAIL_REGEX = /^\S+@\S+\.\S+$/`. Nếu URL thiếu tham số `email` hoặc email không hợp lệ, toàn bộ form nhập OTP bị ẩn và giao diện chuyển sang trạng thái cảnh báo liên kết không hợp lệ (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:21, 36, 108-125`).
- **Độ dài mã OTP:** Quy định cứng là 6 chữ số (`OTP_LENGTH = 6`). Nút `Xác minh email` bị disabled cho đến khi người dùng nhập đủ 6 ký tự (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:19, 86, 195`).
- **Giãn cách gửi lại mã (Cooldown):** Thời gian chờ gửi lại mã là 60 giây (`RESEND_COOLDOWN_SECONDS = 60`). Trong thời gian này, nút gửi lại chuyển sang nhãn `Gửi lại sau {resendCooldown}s` và bị disabled (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:20, 38-42, 176-180`).
- **Xử lý tài khoản đã kích hoạt (HTTP 409):** Khi gửi lại mã, nếu backend trả về HTTP 409 (đã kích hoạt), hệ thống bật toast thông báo và lập tức điều hướng sang `/auth?tab=login` (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:53-60`).
- **Giới hạn số lần yêu cầu (HTTP 429):** Khi gửi lại mã vượt quá tần suất (HTTP 429), hệ thống đặt lại cooldown 60 giây và hiển thị thông báo lỗi trên giao diện (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:62-65`).
- **Chuyển hướng sau thành công:** Sau khi xác minh thành công, giao diện ẩn các trường nhập, hiển thị thông báo màu xanh và kích hoạt hẹn giờ 1500ms để tự động chuyển sang trang đăng nhập (nguồn: `apps/web-1/app/auth/verify-email/page.tsx:97-100, 150-151, 204-216`).

---

## Interactive Inventory

### 1. Khung giao diện & Thanh tiện ích (Layout Shell & Header)
*Source: `apps/web-1/components/layout/AuthShell.tsx`, `apps/web-1/components/ui/ThemeToggler.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `shell.theme.toggle` | `ThemeToggler` > `ActionIcon` | Aria-label | `Toggle theme` | Chuyển đổi theme Sáng/Tối | default |

---

### 2. Trạng thái tải trang (Suspense Fallback)
*Source: `apps/web-1/app/auth/verify-email/page.tsx:224`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `loading.spinner` | `Suspense[fallback]` > `Loader` | Empty state | — *(Spinner animation type `dots`, màu `blue`)* | — | loading (khi tải component Form) |

---

### 3. Trạng thái liên kết không hợp lệ (`!emailValid`)
*Source: `apps/web-1/app/auth/verify-email/page.tsx:108-125`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `invalid_link.title` | `Title[order=2]` | Heading | `Xác minh email` | — | default |
| `invalid_link.error_box` | `div.bg-danger-soft` > `span` | Error | `Liên kết xác minh không hợp lệ. Vui lòng quay lại trang đăng ký.` | — | default (hiện khi param email rỗng hoặc sai regex) |
| `invalid_link.back_cta` | `Button` (Link) | CTA | `Quay lại đăng ký` | `/auth` | default |

---

### 4. Form xác minh chính (`emailValid === true && !success`)
*Source: `apps/web-1/app/auth/verify-email/page.tsx:128-202`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `verify.title` | `Title[order=2]` | Heading | `Kiểm tra email của bạn` | — | default |
| `verify.desc.prefix` | `Text` (Mô tả trước email) | Description | `Chúng tôi đã gửi mã xác minh 6 chữ số đến ` | — | default |
| `verify.desc.email` | `Text > span` (Hiển thị email nhận) | Description | `{email}` *(Giá trị email từ query param)* | — | default |
| `verify.otp.input` | `PinInput` | Aria-label | `Mã xác minh` | Nhập mã OTP 6 số | default / disabled khi `isVerifying` |
| `verify.resend.prompt` | `div` > `span` | Helper | `Không nhận được mã?` | — | default |
| `verify.resend.cta.ready` | `Button[variant=subtle]` | CTA | `Gửi lại mã` | Gọi API gửi lại OTP | default (khi cooldown = 0) |
| `verify.resend.cta.cooldown` | `Button[variant=subtle]` | CTA | `Gửi lại sau ${resendCooldown}s` | — | disabled (khi cooldown > 0, từ 60s đếm lùi về 1s) |
| `verify.resend.cta.loading` | `Button[variant=subtle]` > `Loader2` | Empty state | — *(Icon spinner xoay)* | — | loading / disabled (khi `isResending`) |
| `verify.back.link` | `Anchor` > `Box` (Link kèm icon mũi tên) | Navigation | `Quay lại đăng ký` | `/auth` | default |
| `verify.submit.cta` | `Button` (Primary CTA) | CTA | `Xác minh email` | Gọi API xác minh OTP | default / disabled khi `isVerifying` hoặc `otp.length !== 6` |
| `verify.submit.loading` | `Button` > `Loader2` | Empty state | — *(Icon spinner xoay)* | — | loading (khi `isVerifying`) |

---

### 5. Thông báo lỗi trong trang (In-page Error Alerts)
*Source: `apps/web-1/app/auth/verify-email/page.tsx:87, 136-141`, `apps/web-1/lib/auth-errors.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `error.incomplete_otp` | `div.bg-danger-soft` > `span` | Error | `Vui lòng nhập đủ 6 chữ số.` | — | Hiện khi bấm xác minh lúc OTP chưa đủ 6 ký tự |
| `error.rate_limit_resend` | `div.bg-danger-soft` > `span` | Error | `Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ và thử lại.` | — | Hiện khi gửi lại mã bị lỗi HTTP 429 |
| `error.resend_failed` | `div.bg-danger-soft` > `span` | Error | `Đã xảy ra lỗi khi gửi lại mã. Vui lòng thử lại sau.` | — | Hiện khi gọi API gửi lại mã gặp lỗi ngoại lệ mạng |
| `error.verify_failed` | `div.bg-danger-soft` > `span` | Error | `Đã xảy ra lỗi khi xác minh. Vui lòng thử lại sau.` | — | Hiện khi gọi API xác minh gặp lỗi ngoại lệ mạng |
| `error.api.invalid_otp` | `div.bg-danger-soft` > `span` | Error | `Mã xác minh không đúng. Vui lòng kiểm tra lại.` | — | Dịch từ backend error chứa `invalid otp` |
| `error.api.otp_expired` | `div.bg-danger-soft` > `span` | Error | `Mã xác minh đã hết hạn. Vui lòng gửi lại mã mới.` | — | Dịch từ backend error chứa `otp expired` |
| `error.api.too_many_attempts` | `div.bg-danger-soft` > `span` | Error | `Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.` | — | Dịch từ backend error chứa `too many attempts` |
| `error.api.too_many_requests` | `div.bg-danger-soft` > `span` | Error | `Bạn thao tác quá nhanh. Vui lòng thử lại sau giây lát.` | — | Dịch từ backend error chứa `too many requests` hoặc `rate limit` |
| `error.api.already_verified` | `div.bg-danger-soft` > `span` | Error | `Email đã được xác minh. Vui lòng đăng nhập.` | — | Dịch từ backend error chứa `email_already_verified` hoặc `already verified` |
| `error.api.not_verified` | `div.bg-danger-soft` > `span` | Error | `Email chưa xác minh. Quay lại và chọn Đăng nhập OTP.` | — | Dịch từ backend error chứa `email_not_verified` hoặc `email not verified` |
| `error.api.user_not_found` | `div.bg-danger-soft` > `span` | Error | `Không tìm thấy người dùng.` | — | Dịch từ backend error chứa `user not found` |
| `error.api.fallback` | `div.bg-danger-soft` > `span` | Error | `Đã có lỗi xảy ra. Vui lòng thử lại.` | — | Fallback mặc định khi API trả về thông điệp lỗi không xác định |

---

### 6. Trạng thái xác minh thành công (`success === true`)
*Source: `apps/web-1/app/auth/verify-email/page.tsx:143-148, 204-216`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `success.banner` | `div.bg-success-soft` > `span` | Toast | `Email của bạn đã được xác minh thành công. Đang chuyển đến trang đăng nhập...` | — | default (hiện kèm icon CheckCircle2 màu xanh lá) |
| `success.login_cta` | `Button` (Link) | CTA | `Đi tới đăng nhập` | `/auth?tab=login&returnUrl=[returnUrl]` | default (xuất hiện sau khi xác minh thành công) |

---

### 7. Thông báo nổi (Toast Notifications)
*Source: `apps/web-1/app/auth/verify-email/page.tsx:54-58, 72-76`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `toast.already_verified.title` | `notifications.show` > `title` | Toast | `Email đã được xác minh` | — | client toast trigger (màu blue, khi gửi lại mã nhận HTTP 409) |
| `toast.already_verified.msg` | `notifications.show` > `message` | Toast | `Tài khoản này đã được kích hoạt. Vui lòng đăng nhập.` | Điều hướng sang `/auth?tab=login&returnUrl=[returnUrl]` | client toast trigger |
| `toast.resend_success.title` | `notifications.show` > `title` | Toast | `Đã gửi lại mã` | — | client toast trigger (màu blue, khi gửi lại mã thành công) |
| `toast.resend_success.msg` | `notifications.show` > `message` | Toast | `Mã xác minh mới đã được gửi tới ${email}` | — | client toast trigger |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- **Mã xác thực:**
  - `mã xác minh` (nhãn PinInput `ariaLabel`, error message `Mã xác minh không đúng`, `Mã xác minh đã hết hạn`).
  - `mã xác minh 6 chữ số` (câu miêu tả ở header).
  - `mã` (nhãn nút `Gửi lại mã`, câu hỏi `Không nhận được mã?`, toast `Đã gửi lại mã`).
- **Hành vi điều hướng ngược:**
  - `Quay lại đăng ký` (xuất hiện ở cả trạng thái lỗi link `!emailValid` và dưới form xác minh), mặc dù luồng đích sau khi xác minh hoàn tất lại dẫn tới màn hình đăng nhập (`Đi tới đăng nhập`, `/auth?tab=login`).
- **Tiêu đề trang:**
  - `Xác minh email` (tiêu đề hiển thị khi link lỗi `!emailValid`, và tên trên nút bấm CTA submit).
  - `Kiểm tra email của bạn` (tiêu đề hiển thị khi vào form nhập mã hợp lệ).

### Hiện trạng kỹ thuật quan sát được
- File `apps/web-1/app/auth/verify-email/page.tsx` có chú thích JSDoc `@deprecated Legacy standalone email verification page. Email verification is now handled inline via Email OTP during authentication (EmailOtpStep). Kept for backward-compatibility with direct URL links.`. Trang này đóng vai trò dự phòng và xử lý đường dẫn trực tiếp.
- Form yêu cầu bắt buộc phải có query parameter `email` trên URL. Nếu không có hoặc sai định dạng email regex, người dùng sẽ không thấy form nhập OTP mà chỉ thấy màn hình thông báo lỗi và nút quay lại.
- Cơ chế gửi lại mã có bộ đếm ngược 60 giây (`resendCooldown`). Khi đếm ngược đang chạy, nút bị disable và thay đổi wording thành `Gửi lại sau {resendCooldown}s`.
- Khi người dùng gửi lại mã nhưng backend trả về HTTP 409 (nghĩa là tài khoản đã kích hoạt trước đó), code tự động gọi `notifications.show` và lập tức gọi `router.push('/auth?tab=login...')` mà không bắt người dùng nhập mã nữa.
- Khi xác minh thành công (`success === true`), một timer `1500ms` được kích hoạt để tự động đẩy người dùng sang trang đăng nhập. Nếu timer chưa kịp chạy xong hoặc người dùng không muốn đợi, nút `Đi tới đăng nhập` sẵn sàng cho phép bấm chuyển trang ngay.
- `AuthShell` chứa nút `ThemeToggler` ở góc phải trên cùng (`absolute top-4 right-4`), cho phép chuyển đổi theme sáng/tối độc lập.

### Điểm chưa xác minh (Unknowns / Questions)
- Email template từ hệ thống gửi đi (theo `apps/api/src/modules/notifications/application/auth-verification-email.ts`) hiện chỉ gửi nội dung text chứa mã 6 số chứ không đính kèm đường dẫn bấm trực tiếp dạng `https://.../auth/verify-email?email=...`. Cần xác minh xem trang này có còn luồng người dùng thực tế nào từ bên ngoài truy cập vào hay không.
- Nhãn nút quay lại `Quay lại đăng ký` có thể gây bối rối nếu người dùng ban đầu thực hiện hành động đăng nhập OTP chứ không phải đăng ký tài khoản mới.
- Thông báo toast khi gửi lại mã thành công và khi email đã xác minh đang sử dụng màu `blue` thay vì màu ngữ nghĩa chuẩn (`green` cho thành công, `yellow`/`orange` cho cảnh báo tài khoản đã kích hoạt).
