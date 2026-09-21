# Page: Đăng nhập / Đăng ký
Route: `/auth`  
Access: `Public` (Tự động chuyển hướng về `/dashboard` nếu đã có phiên đăng nhập)

---

## Page Context

### User
- **Primary user:** Sinh viên đại học (người dùng mới hoặc người dùng quay lại), Supporter/Mentor, hoặc Quản trị viên cần đăng nhập vào hệ thống.
- **Typical state:** `[Assumption / Cần xác minh]` Muốn truy cập vào hệ thống để bắt đầu làm bài trắc nghiệm Team-Fit, nộp hồ sơ phản biện (intake), xem báo cáo phản biện hoặc quản lý công việc.
- **Knowledge level:** Biết mình cần tài khoản để sử dụng dịch vụ; có thể đã có tài khoản hoặc chưa từng tạo tài khoản trước đó.

### User goals
- Đăng nhập vào hệ thống bằng tài khoản Google hoặc tài khoản Email (qua mật khẩu hoặc mã OTP).
- Tạo tài khoản mới thông qua Google hoặc xác thực OTP Email nếu chưa từng đăng ký.
- Chuyển hướng tiếp tục đến đúng trang dự định ban đầu (sau khi đăng nhập thành công).

### Business/Product goals
- Xác thực danh tính người dùng an toàn thông qua Better Auth (hỗ trợ Google OAuth và Email OTP/Password).
- Đảm bảo người dùng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Nexus trước khi tiếp tục thao tác.
- Tinh gọn trải nghiệm người dùng bằng cách gộp chung luồng Đăng nhập và Đăng ký trên cùng một giao diện duy nhất, không bắt người dùng phân vân giữa hai màn hình khác nhau.
- Tự động định tuyến người dùng về đúng trang mục tiêu (Dashboard, Form nộp hồ sơ theo gói dịch vụ, hoặc Team-Fit).

### Primary action
- Bước 1 (Idle): Chọn phương thức xác thực `Tiếp tục với Google` hoặc `Tiếp tục với Email` (sau khi đã tick chọn đồng ý Điều khoản & Chính sách).
- Bước 2 (Email): Nhập địa chỉ email và bấm `Đăng nhập bằng Mật khẩu` hoặc `Đăng nhập bằng Mã OTP`.
- Bước 3A (Password): Nhập mật khẩu và bấm `Đăng nhập`.
- Bước 3B (OTP): Nhập đủ 6 số OTP và bấm `Tiếp tục` (hoặc tự động submit khi nhập đủ 6 chữ số).

### Secondary actions
- Bấm checkbox xác nhận đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.
- Bấm vào liên kết `Điều khoản dịch vụ` (mở trang `/terms` trong tab mới).
- Bấm vào liên kết `Chính sách bảo mật` (mở trang `/privacy` trong tab mới).
- Bấm nút `Quay lại` để trở về bước trước đó (từ bước Password/OTP về Email, hoặc từ Email về Idle).
- Bấm `Gửi lại mã` khi hết thời gian đếm ngược (cooldown 60s) ở bước OTP.
- Bấm `Hủy` hoặc `Xác nhận` trên modal thông báo email chưa đăng ký.
- Bấm nút chuyển đổi giao diện Sáng / Tối (`ThemeToggler`).

### Entry
- Nút `Đăng nhập` trên thanh điều hướng Header desktop (`apps/web-1/components/layout/AppShell.tsx:78`).
- Nút `Đăng nhập` trong menu ngăn kéo Drawer mobile (`apps/web-1/components/layout/AppShell.tsx:121`).
- Chuyển hướng tự động (redirect) từ middleware hoặc các trang nội bộ yêu cầu đăng nhập kèm tham số `?returnUrl=...`.
- Chuyển hướng từ các nút chọn gói dịch vụ tại Landing Page kèm tham số `?packageId=...` (ví dụ: `?packageId=free` hoặc `?packageId=supporter-audit`).
- `[Assumption / Cần xác minh]` Người dùng truy cập trực tiếp từ bookmark trình duyệt hoặc link chia sẻ.

### Exit / next step
- Sau khi xác thực thành công, hàm `getAuthRedirectUrl(searchParams)` xác định đích đến tiếp theo (`apps/web-1/app/auth/get-auth-redirect.ts:3-18`):
  - Nếu có query param `returnUrl` hợp lệ (bắt đầu bằng `/`, không chứa `//` hoặc `/\\`) → chuyển hướng về `returnUrl`.
  - Nếu có query param `packageId=free` → chuyển hướng về `/dashboard/team-fit`.
  - Nếu có query param `packageId=supporter-audit` → chuyển hướng về `/dashboard/intake?packageId=ai-audit`.
  - Nếu có `packageId` hợp lệ khác → chuyển hướng về `/dashboard/intake?packageId=${packageId}`.
  - Trường hợp mặc định không có tham số → chuyển hướng về `/dashboard`.
- Nếu người dùng đã có phiên đăng nhập hợp lệ từ trước khi vào trang `/auth`, hệ thống hiển thị màn hình tải phiên làm việc và tự động chuyển hướng về `/dashboard` (`apps/web-1/app/auth/page.tsx:15-18`).

### Product facts / constraints
- **Khung giao diện (Layout):** Sử dụng `AuthShell` với card nổi nằm giữa màn hình (chiều rộng tối đa 420px), góc trên bên phải có nút `ThemeToggler` (`apps/web-1/components/layout/AuthShell.tsx:10-22`).
- **Gộp chung luồng Đăng nhập & Đăng ký:** Tiêu đề trang cố định là `Đăng nhập vào Nexus`. Toàn bộ quá trình diễn ra trên một component `AuthPanel` qua 4 trạng thái client-side (`idle` -> `email` -> `password` hoặc `otp`) (`apps/web-1/app/auth/_components/AuthPanel.tsx:18-26`).
- **Chặn đăng ký mật khẩu trực tiếp:** Hook backend Better Auth chặn endpoint `/sign-up/email`, ném lỗi `PASSWORD_AUTH_DISABLED` (`apps/api/src/auth.ts:141-143`). Do đó, tài khoản mới bắt buộc phải khởi tạo qua luồng Google OAuth hoặc Email OTP.
- **Cơ chế phát hiện tài khoản chưa đăng ký khi nhập mật khẩu:** Khi người dùng nhập email và chọn đăng nhập bằng mật khẩu, hook `useEmailPasswordLogin` gọi API `/profile/password-status` để kiểm tra (`apps/web-1/app/auth/hooks/use-email-password-login.ts:34-40`):
  - Nếu `res.data.exists === false`: Mở modal `RegisterConfirmModal` thông báo tài khoản chưa đăng ký và hỏi người dùng có muốn đăng ký qua mã OTP không (`apps/web-1/app/auth/_components/AuthPanel.tsx:64-67`).
  - Nếu `res.data.hasPassword === false`: Báo lỗi `"Tài khoản chưa có mật khẩu. Quay lại và chọn Đăng nhập OTP."` (`apps/web-1/app/auth/hooks/use-email-password-login.ts:41-46`).
- **Ràng buộc mật khẩu:** Mật khẩu tối thiểu 8 ký tự. Nhập dưới 8 ký tự sẽ hiển thị lỗi validation nội tuyến ngay dưới ô nhập và disable nút đăng nhập (`apps/web-1/app/auth/_components/PasswordStep.tsx:20-25`).
- **Quy cách mã OTP:** Mã xác minh có độ dài đúng 6 số (`OTP_LENGTH = 6`), thời gian chờ gửi lại (cooldown) là 60 giây (`OTP_RESEND_SECONDS = 60`) (`apps/web-1/app/auth/hooks/use-email-otp-login.ts:8-9`).
- **Rate limiting gửi OTP:** Backend giới hạn gửi OTP tối đa 3 lần/phút (`apps/api/src/auth.ts:35`). Nếu người dùng bị rate limit (HTTP status 429), UI kích hoạt cooldown 60 giây và hiển thị lỗi: `"Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ 1 phút rồi thử lại."` (`apps/web-1/app/auth/hooks/use-email-otp-login.ts:48-52`).
- **Khóa tài khoản tạm thời:** Hệ thống có dịch vụ `accountLockoutService` khóa tài khoản khi nhập sai mật khẩu nhiều lần, trả mã lỗi dạng `ACCOUNT_LOCKED_TEMPORARY:${seconds}` (`apps/api/src/auth.ts:133-138`). UI dịch thành thông báo hiển thị số giây chờ cụ thể (`apps/web-1/lib/auth-errors.ts:5-9`).
- **Bắt buộc đồng ý điều khoản:** Hai nút `Tiếp tục với Google` và `Tiếp tục với Email` ở bước Idle bị `disabled` cho đến khi người dùng tick chọn vào checkbox đồng ý Điều khoản dịch vụ và Chính sách bảo mật (`apps/web-1/app/auth/_components/AuthIdleStep.tsx:32, 46`).

---

## Interactive Inventory

### 1. Layout, Shell & Loading States
*Source: `apps/web-1/components/layout/AuthShell.tsx`, `apps/web-1/components/ui/ThemeToggler.tsx`, `apps/web-1/app/auth/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth.shell.theme_toggle` | `ThemeToggler` > `ActionIcon[aria-label]` (Góc trên bên phải) | Aria-label | `Toggle theme` | Chuyển đổi qua lại giữa giao diện Sáng (Light) và Tối (Dark) | default |
| `auth.loading.spinner` | `AuthPage` > `Loader[type="dots"]` (Màn hình phiên đang có) | Visual | — | Hiển thị hiệu ứng tải dữ liệu phiên làm việc | loading |
| `auth.loading.text` | `AuthPage` > `p` (Màn hình phiên đang có) | Helper | `Đang tải phiên làm việc...` | Tự động chuyển hướng về `/dashboard` khi có session | loading |
| `auth.suspense.spinner` | `AuthPage` > `Suspense` fallback > `Loader[type="dots"]` | Visual | — | Hiển thị hiệu ứng tải trong khi load client components | loading |

---

### 2. Tiêu đề chung & Khung thông báo lỗi
*Source: `apps/web-1/app/auth/_components/AuthPanel.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth.panel.heading` | `h1` (Tiêu đề chính) | Heading | `Đăng nhập vào Nexus` | — | default |
| `auth.panel.otp_subheading` | `p` (Mô tả phụ khi ở bước OTP) | Description | `Mã đã gửi đến {normalizedEmail}` | Hiển thị địa chỉ email người dùng vừa nhập | conditional (`step === "otp"`) |
| `auth.panel.error_icon` | `AlertCircle` (Icon cảnh báo lỗi) | Visual | — | Minh họa trực quan cho khung thông báo lỗi | conditional (`error !== null`) |
| `auth.panel.error_message` | `div > span` (Nội dung thông báo lỗi chung) | Error | `{error}` | Hiển thị lỗi từ Better Auth, API backend hoặc client validation | conditional (`error !== null`) |

---

### 3. Bước 1: Lựa chọn phương thức xác thực (AuthIdleStep)
*Source: `apps/web-1/app/auth/_components/AuthIdleStep.tsx`, `apps/web-1/app/auth/_components/GoogleButton.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth.idle.google_btn` | `GoogleButton` > `Button` | CTA | `Tiếp tục với Google` | Khởi tạo đăng nhập Google OAuth qua `authClient.signIn.social` | default / disabled (`!agreed`) / loading (`googleLoading`) |
| `auth.idle.email_btn` | `Button[variant="default"]` | CTA | `Tiếp tục với Email` | Chuyển trạng thái sang bước nhập email (`setStep("email")`) | default / disabled (`!agreed`) |
| `auth.idle.checkbox_prefix` | `Checkbox` > `Text` (Đoạn dẫn trước link) | Label | `Bằng việc tiếp tục, bạn đồng ý với ` | Tick chọn / Bỏ chọn để bật / tắt trạng thái kích hoạt 2 nút CTA trên | default / disabled (`busy`) |
| `auth.idle.link_terms` | `Checkbox` > `Anchor` (Link điều khoản) | Navigation | `Điều khoản dịch vụ` | Mở liên kết `/terms` trong tab trình duyệt mới (`target="_blank"`) | default |
| `auth.idle.checkbox_conjunction` | `Checkbox` > `Text` (Từ nối giữa 2 link) | Label | ` và ` | — | default |
| `auth.idle.link_privacy` | `Checkbox` > `Anchor` (Link bảo mật) | Navigation | `Chính sách bảo mật` | Mở liên kết `/privacy` trong tab trình duyệt mới (`target="_blank"`) | default |
| `auth.idle.checkbox_suffix` | `Checkbox` > `Text` (Đoạn kết thúc) | Label | ` của Nexus.` | — | default |

---

### 4. Bước 2: Nhập Email & Chọn hình thức xác thực (EmailChoiceStep)
*Source: `apps/web-1/app/auth/_components/EmailChoiceStep.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth.email.input.label` | `TextInput` > `label` | Label | `Địa chỉ Email` | Nhãn cho trường nhập địa chỉ email | default |
| `auth.email.input.placeholder` | `TextInput` > `input[placeholder]` | Placeholder | `name@example.com` | Gợi ý định dạng email hợp lệ | default |
| `auth.email.btn_password` | `Button[type="submit"]` | CTA | `Đăng nhập bằng Mật khẩu` | Kiểm tra tính hợp lệ của email và chuyển sang bước nhập mật khẩu (`setStep("password")`) | default / disabled (`!canAct` hoặc email không hợp lệ hoặc đang bận) |
| `auth.email.divider` | `Divider` > label | Helper | `hoặc` | Phân cách giữa 2 lựa chọn đăng nhập bằng mật khẩu và OTP | default |
| `auth.email.btn_otp` | `Button[type="button"]` | CTA | `Đăng nhập bằng Mã OTP` | Gửi mã xác minh 6 số đến email và chuyển sang bước nhập OTP (`setStep("otp")`) | default / disabled (`!canAct`) / loading (`otpBusy`) |
| `auth.email.btn_back` | `UnstyledButton` | Navigation | `Quay lại` | Trở về bước chọn phương thức Idle (`goIdle`) | default / disabled (`busy`) |

---

### 5. Bước 3A: Đăng nhập bằng Mật khẩu (PasswordStep)
*Source: `apps/web-1/app/auth/_components/PasswordStep.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth.password.input.label` | `PasswordInput` > `label` | Label | `Mật khẩu` | Nhãn cho trường nhập mật khẩu | default |
| `auth.password.input.placeholder` | `PasswordInput` > `input[placeholder]` | Placeholder | `Nhập mật khẩu (tối thiểu 8 ký tự)` | Gợi ý độ dài tối thiểu của mật khẩu | default |
| `auth.password.validation_error` | `PasswordInput` > error | Error | `Mật khẩu phải có ít nhất 8 ký tự` | Hiển thị ngay dưới ô nhập khi độ dài > 0 và < 8 ký tự | conditional (`password.length > 0 && password.length < 8`) |
| `auth.password.btn_submit` | `Button[type="submit"]` | CTA | `Đăng nhập` | Gửi yêu cầu đăng nhập email/mật khẩu tới backend (`handlePasswordLogin`) | default / disabled (`!canSubmit`) / loading (`busy`) |
| `auth.password.btn_back` | `UnstyledButton` | Navigation | `Quay lại` | Xóa mật khẩu đã nhập, xóa lỗi và trở về bước nhập email (`setStep("email")`) | default / disabled (`busy`) |

---

### 6. Bước 3B: Xác thực mã OTP Email (EmailOtpStep)
*Source: `apps/web-1/app/auth/_components/EmailOtpStep.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth.otp.input.aria_label` | `PinInput` > `ariaLabel` | Aria-label | `Mã đăng nhập` | Hỗ trợ accessibility cho trường nhập mã OTP 6 số | default |
| `auth.otp.countdown_text` | `Group` > `Text` (Đang đếm ngược) | Helper | `Gửi lại ({cooldown}s)` | Thông báo số giây người dùng cần chờ trước khi được gửi lại mã mới | conditional (`cooldown > 0`) |
| `auth.otp.btn_resend_sending` | `UnstyledButton` (Đang gửi lại) | CTA | `Đang gửi...` | Thông báo trạng thái hệ thống đang phát lại mã OTP | loading (`sending === true`) |
| `auth.otp.btn_resend_ready` | `UnstyledButton` (Sẵn sàng gửi lại) | CTA | `Gửi lại mã` | Kích hoạt gửi lại mã OTP mới đến email (`onResend`) | default / disabled (`sending || verifying`) |
| `auth.otp.btn_submit` | `Button` (Xác nhận OTP) | CTA | `Tiếp tục` | Gửi mã 6 chữ số để hoàn tất xác thực phiên (`onVerify`) | default / disabled (`code.length !== 6`) / loading (`verifying`) |
| `auth.otp.btn_back` | `UnstyledButton` | Navigation | `Quay lại` | Trở về bước nhập email (`setStep("email")`) | default / disabled (`verifying`) |

---

### 7. Modal: Xác nhận Đăng ký tài khoản mới (RegisterConfirmModal)
*Source: `apps/web-1/app/auth/_components/RegisterConfirmModal.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth.register_modal.icon` | `Modal` > title > `UserPlus` | Visual | — | Icon minh họa việc tạo tài khoản mới | default |
| `auth.register_modal.title` | `Modal` > title > `Text` | Heading | `Chưa đăng ký` | Tiêu đề hộp thoại xác nhận khi email chưa tồn tại trong hệ thống | default |
| `auth.register_modal.body` | `Modal` > `Stack` > `Text` | Description | `Email {email} của bạn chưa đăng ký thành viên Nexus. Bạn có muốn đăng ký ngay không?` | Thông báo trạng thái tài khoản và xác nhận nhu cầu đăng ký thành viên | default |
| `auth.register_modal.btn_cancel` | `Modal` > `Group` > `Button[variant="default"]` | CTA | `Hủy` | Đóng hộp thoại xác nhận (`handleClose`) | default / disabled (`loading`) |
| `auth.register_modal.btn_confirm` | `Modal` > `Group` > `Button[color="brand"]` | CTA | `Xác nhận` | Gửi mã OTP tạo tài khoản mới và chuyển sang bước nhập OTP | default / disabled (`loading`) / loading (`loading`) |

---

### 8. Thông báo lỗi hệ thống & Toast Notifications
*Source: `apps/web-1/lib/auth-errors.ts`, `apps/web-1/app/auth/hooks/*`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `auth.error.google.title` | `useGoogleSignIn` > `notifications.show` > title | Toast | `Lỗi đăng nhập` | Tiêu đề thông báo toast khi Google sign-in gặp sự cố | client toast trigger |
| `auth.error.google.fallback` | `useGoogleSignIn` > `notifications.show` > message | Toast | `Không thể khởi tạo đăng nhập bằng Google. Vui lòng thử lại sau.` | Nội dung thông báo khi không thể kết nối tới Google OAuth | client toast trigger |
| `auth.error.otp.rate_limit` | `useEmailOtpLogin` > error state | Error | `Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ 1 phút rồi thử lại.` | Hiển thị tại khung lỗi khi dính rate limit 429 lúc gửi OTP | conditional (`status === 429`) |
| `auth.error.otp.invalid_length` | `useEmailOtpLogin` > error state | Error | `Vui lòng nhập đủ 6 chữ số.` | Hiển thị tại khung lỗi khi chuỗi OTP nhập vào không đủ 6 ký tự | conditional (`otp.length !== 6`) |
| `auth.error.password.no_password` | `useEmailPasswordLogin` > error state | Error | `Tài khoản chưa có mật khẩu. Quay lại và chọn Đăng nhập OTP.` | Hiển thị khi tài khoản tồn tại nhưng chưa từng tạo mật khẩu | conditional (`!hasPassword`) |
| `auth.error.lockout.seconds` | `translateAuthError` (`ACCOUNT_LOCKED_TEMPORARY`) | Error | `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau {seconds} giây.` | Hiển thị thời gian cụ thể khi tài khoản bị khóa tạm thời do nhập sai nhiều lần | conditional |
| `auth.error.lockout.minutes` | `translateAuthError` (`ACCOUNT_LOCKED_TEMPORARY`) | Error | `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ít phút.` | Hiển thị khi tài khoản bị khóa tạm thời mà không có tham số số giây | conditional |
| `auth.error.map.invalid_password` | `translateAuthError` (`invalid password`) | Error | `Mật khẩu hiện tại không đúng.` | Hiển thị khi mật khẩu cung cấp không chính xác | conditional |
| `auth.error.map.weak_password` | `translateAuthError` (`password is too weak`) | Error | `Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn.` | Hiển thị khi mật khẩu mới không đạt tiêu chuẩn độ mạnh | conditional |
| `auth.error.map.short_password` | `translateAuthError` (`password is too short` / `password_too_short`) | Error | `Mật khẩu phải có ít nhất 8 ký tự.` | Hiển thị khi mật khẩu không đủ độ dài quy định | conditional |
| `auth.error.map.already_set` | `translateAuthError` (`password_already_set`) | Error | `Tài khoản đã có mật khẩu.` | Hiển thị khi thao tác thiết lập lại mật khẩu bị trùng lặp | conditional |
| `auth.error.map.email_not_verified` | `translateAuthError` (`email_not_verified` / `email not verified`) | Error | `Email chưa xác minh. Quay lại và chọn Đăng nhập OTP.` | Hiển thị khi tài khoản chưa được xác minh email | conditional |
| `auth.error.map.auth_disabled` | `translateAuthError` (`password_auth_disabled`) | Error | `Đăng ký mật khẩu trực tiếp đã tắt. Dùng Đăng nhập OTP.` | Hiển thị khi cố gắng đăng ký tài khoản qua API mật khẩu trực tiếp | conditional |
| `auth.error.map.user_not_found` | `translateAuthError` (`user not found`) | Error | `Không tìm thấy người dùng.` | Hiển thị khi email không tồn tại trong hệ thống | conditional |
| `auth.error.map.invalid_credentials` | `translateAuthError` (`invalid email or password`) | Error | `Email hoặc mật khẩu không đúng.` | Hiển thị khi thông tin đăng nhập email/mật khẩu sai | conditional |
| `auth.error.map.already_verified` | `translateAuthError` (`email_already_verified` / `already verified`) | Error | `Email đã được xác minh. Vui lòng đăng nhập.` | Hiển thị khi email đã qua xác minh và không cần xác thực lại | conditional |
| `auth.error.map.invalid_otp` | `translateAuthError` (`invalid otp`) | Error | `Mã xác minh không đúng. Vui lòng kiểm tra lại.` | Hiển thị khi người dùng nhập sai 6 số OTP | conditional |
| `auth.error.map.otp_expired` | `translateAuthError` (`otp expired`) | Error | `Mã xác minh đã hết hạn. Vui lòng gửi lại mã mới.` | Hiển thị khi mã OTP quá thời hạn hiệu lực (sau 300 giây) | conditional |
| `auth.error.map.too_many_attempts` | `translateAuthError` (`too many attempts`) | Error | `Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.` | Hiển thị khi nhập sai mã OTP vượt quá 3 lần cho phép | conditional |
| `auth.error.map.rate_limit` | `translateAuthError` (`too many requests` / `rate limit`) | Error | `Bạn thao tác quá nhanh. Vui lòng thử lại sau giây lát.` | Hiển thị khi tần suất thao tác vượt quá ngưỡng quy định | conditional |
| `auth.error.default_fallback` | `translateAuthError` (Mặc định) | Error | `Đã có lỗi xảy ra. Vui lòng thử lại.` | Hiển thị khi gặp lỗi không xác định hoặc lỗi mạng | conditional |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- **Đăng nhập vs Đăng ký:**
  - Tiêu đề màn hình và các nút hành động chính luôn sử dụng từ `Đăng nhập` (`Đăng nhập vào Nexus`, `Đăng nhập bằng Mật khẩu`, `Đăng nhập bằng Mã OTP`).
  - Khái niệm `Đăng ký` chỉ xuất hiện duy nhất khi hệ thống phát hiện email chưa có trong cơ sở dữ liệu và bật modal: tiêu đề modal ghi `Chưa đăng ký`, nội dung ghi `Email {email} của bạn chưa đăng ký thành viên Nexus. Bạn có muốn đăng ký ngay không?`, kèm nút `Xác nhận`.
- **Mã OTP vs Mã xác minh vs Mã đăng nhập:**
  - Nút bấm lựa chọn tại bước Email: `Đăng nhập bằng Mã OTP` (`apps/web-1/app/auth/_components/EmailChoiceStep.tsx:88`).
  - Nút bấm gửi lại tại bước OTP: `Gửi lại mã` (`apps/web-1/app/auth/_components/EmailOtpStep.tsx:67`).
  - Thuộc tính accessibility của ô nhập mã: `ariaLabel="Mã đăng nhập"` (`apps/web-1/app/auth/_components/EmailOtpStep.tsx:49`).
  - Danh mục thông báo lỗi dịch từ backend: gọi là `Mã xác minh` (`Mã xác minh không đúng. Vui lòng kiểm tra lại.`, `Mã xác minh đã hết hạn. Vui lòng gửi lại mã mới.`) (`apps/web-1/lib/auth-errors.ts:24-25`).
- **Khái niệm Tài khoản vs Người dùng:**
  - Một số thông báo lỗi dùng từ `Tài khoản` (`Tài khoản chưa có mật khẩu...`, `Tài khoản đã có mật khẩu.`, `Tài khoản tạm thời bị khóa...`).
  - Một số thông báo lỗi khác dùng từ `Người dùng` (`Không tìm thấy người dùng.`) hoặc `thành viên Nexus` (`...chưa đăng ký thành viên Nexus.`).

### Hiện trạng kỹ thuật & Code behavior
- **Cấu trúc bước xác thực (Step State Machine):**
  - Trang quản lý toàn bộ luồng thông qua biến `step: "idle" | "email" | "password" | "otp"` trong `AuthPanel.tsx`. Không có route `/register` hoặc `/login` riêng rẽ.
  - Từ bước `idle`, khi bấm `Tiếp tục với Email` sẽ chuyển sang bước `email`.
  - Tại bước `email`, nếu bấm `Đăng nhập bằng Mật khẩu`, hệ thống chuyển sang bước `password`.
  - Tại bước `email`, nếu bấm `Đăng nhập bằng Mã OTP`, hệ thống lập tức gọi API `authClient.emailOtp.sendVerificationOtp`, nếu thành công mới chuyển sang bước `otp`.
  - Tại bước `password`, nếu API check `/profile/password-status` trả về `exists: false`, modal `RegisterConfirmModal` mở lên. Khi người dùng bấm `Xác nhận`, hệ thống gọi `otp.send(normalizedEmail)`, nếu thành công sẽ đóng modal và chuyển sang bước `otp`.
  - Các nút `Quay lại` (`UnstyledButton`) ở từng bước cho phép lùi về trạng thái trước đó mà không làm mất hoàn toàn phiên làm việc (`password` -> `email`, `otp` -> `email`, `email` -> `idle`).
- **Luồng xác thực Google:**
  - Nút `Tiếp tục với Google` kích hoạt `signIn.social({ provider: "google", callbackURL: ... })`.
  - Nếu gặp lỗi phía client (không gọi được popup/redirect), hệ thống bật Mantine notification toast màu đỏ với tiêu đề `Lỗi đăng nhập` (`apps/web-1/app/auth/hooks/use-google-sign-in.ts:20-35`).
- **Liên kết chính sách:**
  - Hai liên kết `Điều khoản dịch vụ` (`/terms`) và `Chính sách bảo mật` (`/privacy`) được đặt thuộc tính `target="_blank"` và `rel="noopener noreferrer"`, kèm `onClick={(e) => e.stopPropagation()}` để tránh việc click vào link vô tình kích hoạt sự kiện toggle của `Checkbox`.
- **Ràng buộc OTP:**
  - Hết 60 giây cooldown, nhãn đếm ngược chuyển thành nút bấm `Gửi lại mã`. Trong lúc đang gửi lại, nút đổi text thành `Đang gửi...` và chuyển trạng thái `disabled`.

### Điểm chưa xác minh (Unknowns / Questions)
- `[Cần xác minh]` Modal `RegisterConfirmModal` hiện chỉ được kích hoạt khi người dùng chọn nhánh *Đăng nhập bằng Mật khẩu* đối với email chưa tồn tại. Nếu người dùng chọn nhánh *Đăng nhập bằng Mã OTP*, hệ thống sẽ gửi thẳng mã OTP mà không bật modal hỏi xác nhận đăng ký thành viên mới hay không. Cần xác nhận với Product Owner xem luồng OTP này có cần hiển thị bước xác nhận đăng ký tương tự hay giữ nguyên hành vi ngầm định đăng ký như hiện tại.
- `[Cần xác minh]` Nhãn accessibility của `PinInput` đang để là `Mã đăng nhập`, trong khi thông báo lỗi trả về dùng từ `Mã xác minh` và nút bấm tại bước trước ghi `Mã OTP`. Cần xác nhận thuật ngữ chuẩn duy nhất cho mã này (Mã OTP, Mã xác thực hay Mã đăng nhập).
- `[Cần xác minh]` Khi người dùng đăng nhập thành công bằng OTP qua `signIn.emailOtp`, hệ thống tự động gán tên hiển thị mặc định bằng phần prefix của email (ví dụ: `email.split("@")[0]`) cắt tối đa 32 ký tự (`apps/web-1/app/auth/hooks/use-email-otp-login.ts:85`). Sau đó người dùng có bắt buộc phải cập nhật tên thật tại bước nào tiếp theo hay không.
