# Page: Cài đặt đổi mật khẩu (Settings Password)
Route: `/dashboard/settings/password`  
Access: `Authenticated (Student role - Client & Server route guard)`

---

## Page Context

### User
- **Primary user:** Người dùng sinh viên / chủ dự án khởi nghiệp đã đăng nhập vào hệ thống, truy cập khu vực Cài đặt để cập nhật mật khẩu hiện tại hoặc thiết lập mật khẩu lần đầu (đối với tài khoản đăng ký/đăng nhập qua Google OAuth hoặc Email OTP).
- **Typical state:** `[Assumption / Cần xác minh]` Người dùng chủ động đổi mật khẩu theo định kỳ, nghi ngờ tài khoản bị lộ mật khẩu, hoặc muốn đặt mật khẩu riêng cho tài khoản đăng ký bằng bên thứ ba để đăng nhập trực tiếp bằng email và mật khẩu trong tương lai.
- **Knowledge level:** Biết mật khẩu hiện tại (nếu tài khoản đã có mật khẩu), hiểu quy tắc mật khẩu tối thiểu cần có từ 8 ký tự trở lên.

### User goals
- Đổi mật khẩu tài khoản đang sử dụng sang mật khẩu mới an toàn hơn và tự động đăng xuất các thiết bị/phiên đăng nhập khác.
- Thiết lập mật khẩu mới lần đầu nếu tài khoản trước đó được khởi tạo không kèm mật khẩu (Google OAuth / OTP).

### Business/Product goals
- Bảo vệ an toàn tài khoản và quyền riêng tư cho hồ sơ dự án khởi nghiệp cũng như thông tin số dư ví của sinh viên.
- Thu hồi tự động toàn bộ các phiên đăng nhập khác (`revokeOtherSessionsUseCase`) ngay sau khi đổi mật khẩu để vô hiệu hóa các truy cập trái phép tiềm ẩn.
- Cung cấp tính năng tự quản lý bảo mật (self-service password management) linh hoạt, hỗ trợ cả 2 kịch bản: đổi mật khẩu (`changePassword`) và đặt mật khẩu mới (`setPassword`).

### Primary action
- Nhập đầy đủ thông tin vào các trường mật khẩu và nhấn nút CTA chính: `Xác nhận đổi mật khẩu` (nếu đã có mật khẩu) hoặc `Đặt mật khẩu` (nếu chưa có mật khẩu).

### Secondary actions
- Chuyển đổi giữa các tab cài đặt tài khoản thông qua thanh điều hướng bên trái (`SettingsSidebar`):
  - `Thông tin cơ bản` (`/dashboard/settings/profile`)
  - `Thiết bị & Phiên đăng nhập` (`/dashboard/settings/sessions`)
  - `Cài đặt thông báo` (`/dashboard/settings/notifications`)
- Rê chuột hoặc chạm vào biểu tượng thông tin (`Info`) để xem tooltip hướng dẫn độ an toàn của mật khẩu.
- Chuyển hướng tới `Trang chủ`, `Ví của tôi`, đổi giao diện Sáng / Tối hoặc `Đăng xuất` thông qua thanh điều hướng trên cùng (`DashboardShell` / `UserMenu`).

### Entry
- Người dùng bấm vào avatar tài khoản ở góc phải trên cùng (`UserMenu`) > chọn mục `Cài đặt` (dẫn tới `/dashboard/settings`, server tự động redirect tới `/dashboard/settings/profile`) > bấm chọn tab `Đổi mật khẩu` (`/dashboard/settings/password`) tại thanh sidebar.
- Truy cập trực tiếp qua đường dẫn URL `/dashboard/settings/password`.
- `[Assumption / Cần xác minh]` Có thể được gợi ý điều hướng từ trang quản lý phiên đăng nhập (`/dashboard/settings/sessions`) khi người dùng phát hiện thiết bị lạ và muốn đổi mật khẩu ngay để bảo vệ tài khoản.

### Exit / next step
- Khi đổi mật khẩu thành công: Form tự động xóa trắng các trường (`form.reset()`), hiển thị thông báo toast màu xanh lá `Đã đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất.`, người dùng tiếp tục ở lại trang hoặc chuyển tab khác.
- Khi đặt mật khẩu thành công: Form tự động xóa trắng các trường (`form.reset()`), hiển thị thông báo toast màu xanh lá `Đã đặt mật khẩu. Có thể đăng nhập bằng mật khẩu lần sau.`, query trạng thái mật khẩu được làm mới và giao diện tự chuyển sang chế độ đổi mật khẩu.
- Khi bấm chọn tab khác trên sidebar: Chuyển hướng tới `/dashboard/settings/profile`, `/dashboard/settings/sessions`, hoặc `/dashboard/settings/notifications`.
- Khi bấm vào logo hoặc các liên kết điều hướng khác: Rời khỏi khu vực Cài đặt để trở về trang tương ứng.

### Product facts / constraints
- **Bảo vệ phân quyền và điều hướng route (Route Guard):**
  - Trang được bọc bởi `DashboardLayout` (`apps/web-1/app/dashboard/layout.tsx:14-47`). Nếu chưa đăng nhập (`!session`), client tự động chuyển hướng về `/auth`.
  - Nếu người dùng đăng nhập với role `admin` hoặc `supporter`, `DashboardLayout` chặn hiển thị giao diện và tự động chuyển hướng về `/admin` hoặc `/supporter` (nguồn: `apps/web-1/app/dashboard/layout.tsx:18-27, 42-45`).
- **Trạng thái tải dữ liệu phiên làm việc (Session Loading):**
  - Component `SettingsPasswordPage` (`apps/web-1/app/dashboard/settings/password/page.tsx:8-28`) kiểm tra session qua `useSession()`.
  - Khi đang tải session (`isPending`), hiển thị spinner xoay `Loader2` ở giữa màn hình (`min-h-[60vh]`).
  - Nếu session không chứa thông tin user (`!sessionData?.user`), hiển thị thông báo lỗi tĩnh: `Không thể tải thông tin tài khoản. Vui lòng thử lại sau.`.
- **Kiểm tra trạng thái mật khẩu (`useHasPasswordQuery`):**
  - Form gọi query `useHasPasswordQuery()` tới API endpoint `GET /profile/password-status` để xác định tài khoản đã có mật khẩu hay chưa (`hasPassword: boolean`).
  - Trong lúc query đang tải (`isLoading`), form render một thẻ `Paper` chứa một nút bấm loading với nhãn `Đặt mật khẩu` (nguồn: `ChangePasswordForm.tsx:41-49`).
- **Phân nhánh hiển thị theo trạng thái mật khẩu (`hasPassword`):**
  - **Tài khoản đã có mật khẩu (`hasPassword === true`):**
    - Hiển thị đủ 3 trường nhập liệu: `Mật khẩu hiện tại`, `Mật khẩu mới`, và `Xác nhận mật khẩu mới`.
    - Nút bấm gửi form mang nhãn: `Xác nhận đổi mật khẩu`.
    - Khi submit, kích hoạt mutation `changePassword` (`POST /profile/password/change`).
  - **Tài khoản chưa có mật khẩu (`hasPassword === false`):**
    - Ẩn hoàn toàn trường `Mật khẩu hiện tại`.
    - Chỉ hiển thị 2 trường nhập liệu: `Mật khẩu` và `Xác nhận mật khẩu`.
    - Nút bấm gửi form mang nhãn: `Đặt mật khẩu`.
    - Khi submit, kích hoạt mutation `setPassword` (`POST /profile/password`).
- **Quy tắc xác thực Client-side (TanStack Form Validation):**
  - Trường `currentPassword`: Bắt buộc nhập khi hiển thị (`!value` kích hoạt lỗi `Vui lòng nhập mật khẩu hiện tại.`).
  - Trường `newPassword`: Bắt buộc nhập (`!value` kích hoạt lỗi `Vui lòng nhập mật khẩu mới.`), độ dài tối thiểu 8 ký tự (`value.length < 8` kích hoạt lỗi `Mật khẩu mới phải ít nhất 8 ký tự.`).
  - Trường `confirmPassword`: Bắt buộc trùng khớp với `newPassword` (`value !== form.getFieldValue("newPassword")` kích hoạt lỗi `Xác nhận mật khẩu không khớp.`). Sử dụng cấu hình `onChangeListenTo: ["newPassword"]` để tự động kiểm tra lại khi mật khẩu mới thay đổi.
  - Lỗi xác thực chỉ hiển thị khi trường nhập liệu đã được chạm vào (`field.state.meta.isTouched && field.state.meta.errors.length > 0`).
- **Quy tắc xác thực Server-side (Backend API Constraints):**
  - Đổi mật khẩu (`changePasswordUseCase`): Yêu cầu `newPassword` tối thiểu 8 ký tự (lỗi `Mật khẩu mới phải có ít nhất 8 ký tự`). Kiểm tra mật khẩu cũ qua Better Auth; nếu sai trả về lỗi HTTP 400 kèm thông điệp `Mật khẩu hiện tại không chính xác` (nguồn: `change-password.usecase.ts:20-43`).
  - Đặt mật khẩu (`setPasswordUseCase`): Yêu cầu mật khẩu tối thiểu 8 ký tự (lỗi `Mật khẩu phải có ít nhất 8 ký tự`). Nếu tài khoản đã có mật khẩu từ trước, trả về HTTP 409 kèm thông điệp `Tài khoản đã có mật khẩu` (nguồn: `set-password.usecase.ts:17-32`).
- **Tự động hủy các phiên đăng nhập khác (Session Revocation):**
  - Khi đổi mật khẩu thành công qua `changePasswordUseCase`, backend thực thi `revokeOtherSessionsUseCase(userId, currentSessionId)`, hủy bỏ tất cả phiên làm việc khác ngoại trừ phiên hiện tại của thiết bị đang thao tác và ghi nhận audit log `PASSWORD_CHANGED` (nguồn: `change-password.usecase.ts:47-52`).
- **Xử lý giao diện sau khi thành công:**
  - Cả hai thao tác đổi mật khẩu và đặt mật khẩu đều hiển thị phản hồi qua Mantine Notification Toast màu xanh lá (`color: "green"`), không render banner thông báo cố định trong trang.
  - Sau khi mutation thành công, form gọi `form.reset()` để xóa nội dung các ô nhập và gọi `queryClient.invalidateQueries({ queryKey: ["password-status"] })` để làm mới trạng thái tài khoản.

---

## Interactive Inventory

### 1. Khung giao diện chung & Thanh điều hướng trên cùng (Dashboard Shell & Top Navbar)
*Source: `apps/web-1/components/layout/DashboardShell.tsx`, `apps/web-1/components/layout/_components/UserMenu.tsx`, `apps/web-1/components/layout/NotificationBell.tsx`, `apps/web-1/components/ui/ThemeToggler.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `shell.logo` | `DashboardShell` > `Link` > `Logo` | Navigation | *(Logo hình ảnh SVG Nexus Platform)* | `/dashboard` (đối với role sinh viên) | default |
| `shell.notifications.trigger` | `NotificationBell` > `Menu.Target` > button | Aria-label | *(Icon hình chuông `Bell`)* | Bật / tắt menu danh sách thông báo | default (hiển thị badge đỏ khi có thông báo chưa đọc) |
| `shell.notifications.title` | `NotificationBell` > `Menu.Dropdown` > `Text` | Heading | Thông báo | — | default |
| `shell.notifications.empty` | `NotificationBell` > `Menu.Dropdown` > `Text` | Empty state | Không có thông báo | — | default (khi danh sách thông báo rỗng) |
| `shell.notifications.markAllRead` | `NotificationBell` > `Menu.Dropdown` > footer button | CTA | Đánh dấu tất cả đã đọc | Gọi API `PATCH /notifications/read-all` | default (disabled khi `unreadCount === 0`) |
| `shell.theme.toggle` | `ThemeToggler` > `ActionIcon` | Aria-label | `Toggle theme` | Chuyển đổi giao diện Sáng / Tối | default |
| `shell.userMenu.trigger` | `UserMenu` > `Popover.Target` > button | Aria-label | `Tài khoản` | Bật / tắt menu người dùng | default |
| `shell.userMenu.avatarAlt` | `UserMenu` > `Avatar` | Alt text | `<code>{user.name}</code>` hoặc `User` | Mở menu người dùng | default |
| `shell.userMenu.avatarFallback` | `UserMenu` > `Avatar` fallback text | Item | `<code>{user.name?.substring(0, 2).toUpperCase()}</code>` hoặc `US` | Mở menu người dùng | default (khi không có ảnh đại diện) |
| `shell.userMenu.email` | `UserMenu` > `Popover.Dropdown` > email block | Item | `<code>{user.email}</code>` hoặc `—` | — | default |
| `shell.userMenu.balanceLabel` | `UserMenu` > `Popover.Dropdown` > wallet block | Label | Số dư | — | default (hiển thị khi role sinh viên và có dữ liệu ví) |
| `shell.userMenu.balanceValue` | `UserMenu` > `Popover.Dropdown` > wallet block | Item | `<code>{walletBalance.toLocaleString("vi-VN")} VND</code>` | — | default (hiển thị cùng nhãn `Số dư`) |
| `shell.userMenu.nav.home` | `UserMenu` > menu button | Navigation | Trang chủ | `/dashboard` | default |
| `shell.userMenu.nav.wallet` | `UserMenu` > menu button | Navigation | Ví của tôi | `/dashboard/wallet` | default (chỉ hiển thị cho sinh viên) |
| `shell.userMenu.nav.settings` | `UserMenu` > menu button | Navigation | Cài đặt | `/dashboard/settings` | default |
| `shell.userMenu.signOut` | `UserMenu` > menu button | CTA | Đăng xuất | Gọi hàm `signOut()`, xóa query cache và chuyển hướng về `/auth` | default |

---

### 2. Tiêu đề khu vực Cài đặt & Thanh điều hướng phân mục (Settings Layout & Sidebar)
*Source: `apps/web-1/app/dashboard/settings/_components/SettingsLayout.tsx`, `apps/web-1/app/dashboard/settings/_components/SettingsSidebar.tsx`, `apps/web-1/app/dashboard/settings/_components/settings-nav.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.layout.title` | `SettingsLayout` > header > `h1` | Heading | Cài đặt | — | default |
| `settings.layout.description` | `SettingsLayout` > header > `p` | Description | Quản lý thông tin cá nhân và bảo mật tài khoản | — | default |
| `settings.sidebar.nav.profile` | `SettingsSidebar` > `Link` | Navigation | Thông tin cơ bản | `/dashboard/settings/profile` | default |
| `settings.sidebar.nav.password` | `SettingsSidebar` > `Link` | Navigation | Đổi mật khẩu | `/dashboard/settings/password` | active (`aria-current="page"`, nền `bg-surface-soft`, chữ màu `brand font-semibold`) |
| `settings.sidebar.nav.sessions` | `SettingsSidebar` > `Link` | Navigation | Thiết bị & Phiên đăng nhập | `/dashboard/settings/sessions` | default |
| `settings.sidebar.nav.notifications` | `SettingsSidebar` > `Link` | Navigation | Cài đặt thông báo | `/dashboard/settings/notifications` | default |

---

### 3. Trạng thái tải trang & Xử lý lỗi Session (Page Shell States)
*Source: `apps/web-1/app/dashboard/settings/password/page.tsx:8-28`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.password.loading.session` | `SettingsPasswordPage` > loading container > `Loader2` | Empty state | — *(Spinner icon xoay tròn, màu `text-brand`)* | — | loading (hiển thị khi `isPending === true`) |
| `settings.password.error.session` | `SettingsPasswordPage` > `Text` | Error | Không thể tải thông tin tài khoản. Vui lòng thử lại sau. | — | error (hiển thị khi `!isPending && !sessionData?.user`) |

---

### 4. Trạng thái tải dữ liệu trạng thái mật khẩu (Password Status Query Loading)
*Source: `apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx:41-49`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.password.loading.queryButton` | `ChangePasswordForm` > `Paper` > `Button` | CTA | Đặt mật khẩu | — | loading (hiển thị khi `hasPasswordQuery.isLoading === true`) |

---

### 5. Form Đổi mật khẩu - Tài khoản đã có mật khẩu (`hasPassword === true`)
*Source: `apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx:50-160`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.password.form.currentPassword.label` | `form.Field[name="currentPassword"]` > `PasswordInput` > label | Label | Mật khẩu hiện tại | — | default |
| `settings.password.form.currentPassword.placeholder` | `form.Field[name="currentPassword"]` > `PasswordInput` > placeholder | Placeholder | Nhập mật khẩu hiện tại | Nhập mật khẩu cũ của tài khoản (`autoComplete="current-password"`) | default |
| `settings.password.form.newPassword.label` | `form.Field[name="newPassword"]` > `PasswordInput` > label > `span` | Label | Mật khẩu mới | — | default |
| `settings.password.form.newPassword.tooltip` | `form.Field[name="newPassword"]` > `PasswordInput` > label > `Tooltip` | Helper | Tối thiểu 8 ký tự. Không nên trùng mật khẩu đã dùng ở nơi khác. | Rê chuột / chạm vào icon `Info` để xem gợi ý | default |
| `settings.password.form.newPassword.placeholder` | `form.Field[name="newPassword"]` > `PasswordInput` > placeholder | Placeholder | Ít nhất 8 ký tự | Nhập mật khẩu mới muốn thay đổi | default |
| `settings.password.form.confirmPassword.label` | `form.Field[name="confirmPassword"]` > `PasswordInput` > label | Label | Xác nhận mật khẩu mới | — | default |
| `settings.password.form.confirmPassword.placeholder` | `form.Field[name="confirmPassword"]` > `PasswordInput` > placeholder | Placeholder | Nhập lại mật khẩu | Nhập lại mật khẩu mới để đối chiếu | default |
| `settings.password.form.changeSubmit.button` | `ChangePasswordForm` > `form` > `Button[type="submit"]` | CTA | Xác nhận đổi mật khẩu | Gửi form gọi mutation `changePassword` (`POST /profile/password/change`) | default (chuyển sang `loading` khi `pending || hasPasswordQuery.isLoading`) |

---

### 6. Form Thiết lập mật khẩu - Tài khoản chưa có mật khẩu (`hasPassword === false`)
*Source: `apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx:50-160`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.password.form.setPassword.newPassword.label` | `form.Field[name="newPassword"]` > `PasswordInput` > label > `span` | Label | Mật khẩu | — | default |
| `settings.password.form.setPassword.newPassword.tooltip` | `form.Field[name="newPassword"]` > `PasswordInput` > label > `Tooltip` | Helper | Tối thiểu 8 ký tự. Không nên trùng mật khẩu đã dùng ở nơi khác. | Rê chuột / chạm vào icon `Info` để xem gợi ý | default |
| `settings.password.form.setPassword.newPassword.placeholder` | `form.Field[name="newPassword"]` > `PasswordInput` > placeholder | Placeholder | Ít nhất 8 ký tự | Nhập mật khẩu muốn thiết lập cho tài khoản | default |
| `settings.password.form.setPassword.confirmPassword.label` | `form.Field[name="confirmPassword"]` > `PasswordInput` > label | Label | Xác nhận mật khẩu | — | default |
| `settings.password.form.setPassword.confirmPassword.placeholder` | `form.Field[name="confirmPassword"]` > `PasswordInput` > placeholder | Placeholder | Nhập lại mật khẩu | Nhập lại mật khẩu mới để đối chiếu | default |
| `settings.password.form.setSubmit.button` | `ChangePasswordForm` > `form` > `Button[type="submit"]` | CTA | Đặt mật khẩu | Gửi form gọi mutation `setPassword` (`POST /profile/password`) | default (chuyển sang `loading` khi `pending || hasPasswordQuery.isLoading`) |

---

### 7. Thông báo lỗi xác thực tại chỗ (Client-side Form Validation Errors)
*Source: `apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx:63-65, 89-93, 131-134`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.password.error.currentPasswordRequired` | `form.Field[name="currentPassword"]` > `PasswordInput` > `error` | Error | Vui lòng nhập mật khẩu hiện tại. | — | Hiển thị khi trường `currentPassword` trống và đã tương tác (`isTouched`) |
| `settings.password.error.newPasswordRequired` | `form.Field[name="newPassword"]` > `PasswordInput` > `error` | Error | Vui lòng nhập mật khẩu mới. | — | Hiển thị khi trường `newPassword` trống và đã tương tác (`isTouched`) |
| `settings.password.error.newPasswordMinLength` | `form.Field[name="newPassword"]` > `PasswordInput` > `error` | Error | Mật khẩu mới phải ít nhất 8 ký tự. | — | Hiển thị khi trường `newPassword` có độ dài nhỏ hơn 8 ký tự |
| `settings.password.error.confirmPasswordMismatch` | `form.Field[name="confirmPassword"]` > `PasswordInput` > `error` | Error | Xác nhận mật khẩu không khớp. | — | Hiển thị khi giá trị trường `confirmPassword` khác với trường `newPassword` |

---

### 8. Thông báo nổi phản hồi kết quả (Toast Notifications: Success & Failure)
*Source: `apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts:66-116`, `apps/web-1/lib/auth-errors.ts:3-35`, `apps/api/src/modules/profile/application/change-password.usecase.ts:20-44`, `apps/api/src/modules/profile/application/set-password.usecase.ts:17-32`, `apps/api/src/modules/profile/http/password.controller.ts:60-66, 81-87`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.password.toast.changeSuccess.title` | `changePassword.onSuccess` > `notifications.show` > `title` | Toast | Thành công | — | client toast trigger (màu `green`) |
| `settings.password.toast.changeSuccess.message` | `changePassword.onSuccess` > `notifications.show` > `message` | Toast | Đã đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất. | — | client toast trigger (màu `green`, tự động reset form) |
| `settings.password.toast.setSuccess.title` | `setPassword.onSuccess` > `notifications.show` > `title` | Toast | Thành công | — | client toast trigger (màu `green`) |
| `settings.password.toast.setSuccess.message` | `setPassword.onSuccess` > `notifications.show` > `message` | Toast | Đã đặt mật khẩu. Có thể đăng nhập bằng mật khẩu lần sau. | — | client toast trigger (màu `green`, tự động reset form) |
| `settings.password.toast.error.title` | `onError` > `notifications.show` > `title` | Toast | Lỗi | — | client toast trigger (màu `red`, áp dụng cho cả đổi và đặt mật khẩu) |
| `settings.password.toast.changeError.apiWrongPassword` | `changePassword.onError` > `extractApiErrorMessage` | Toast | Mật khẩu hiện tại không chính xác | — | Lỗi do backend trả về khi nhập sai mật khẩu cũ (`change-password.usecase.ts:42`) |
| `settings.password.toast.changeError.apiNewPasswordLength` | `changePassword.onError` > `extractApiErrorMessage` | Toast | Mật khẩu mới phải có ít nhất 8 ký tự | — | Lỗi do backend trả về khi mật khẩu mới không đủ 8 ký tự (`password.controller.ts:85`) |
| `settings.password.toast.changeError.transInvalidPassword` | `changePassword.onError` > `translateAuthError` | Toast | Mật khẩu hiện tại không đúng. | — | Dịch từ lỗi auth chứa `invalid password` (`auth-errors.ts:12`) |
| `settings.password.toast.changeError.transPasswordTooWeak` | `changePassword.onError` > `translateAuthError` | Toast | Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn. | — | Dịch từ lỗi auth chứa `password is too weak` (`auth-errors.ts:13`) |
| `settings.password.toast.changeError.transPasswordTooShort` | `changePassword.onError` > `translateAuthError` | Toast | Mật khẩu phải có ít nhất 8 ký tự. | — | Dịch từ lỗi auth chứa `password is too short` hoặc `password_too_short` (`auth-errors.ts:14-15`) |
| `settings.password.toast.changeError.transAccountLockedSeconds` | `changePassword.onError` > `translateAuthError` | Toast | `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${seconds} giây.` | — | Dịch từ lỗi auth bắt đầu bằng `ACCOUNT_LOCKED_TEMPORARY:${seconds}` (`auth-errors.ts:8`) |
| `settings.password.toast.changeError.transAccountLockedMinutes` | `changePassword.onError` > `translateAuthError` | Toast | Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ít phút. | — | Dịch từ lỗi auth bắt đầu bằng `ACCOUNT_LOCKED_TEMPORARY` không kèm số giây (`auth-errors.ts:9`) |
| `settings.password.toast.changeError.transFallback` | `changePassword.onError` > `translateAuthError` | Toast | Đã có lỗi xảy ra. Vui lòng thử lại. | — | Fallback khi lỗi auth không khớp từ khóa nào trong từ điển dịch (`auth-errors.ts:34`) |
| `settings.password.toast.changeError.fallback` | `changePassword.onError` > message fallback | Toast | Không thể đổi mật khẩu. Kiểm tra lại mật khẩu hiện tại. | — | Fallback cứng của hook khi không trích xuất được thông điệp lỗi (`useProfileMutations.ts:88`) |
| `settings.password.toast.setError.apiInvalidInput` | `setPassword.onError` > `extractApiErrorMessage` | Toast | Mật khẩu không hợp lệ, cần ít nhất 8 ký tự | — | Lỗi do backend trả về khi body không đạt Zod schema (`password.controller.ts:64`) |
| `settings.password.toast.setError.apiTooShort` | `setPassword.onError` > `extractApiErrorMessage` | Toast | Mật khẩu phải có ít nhất 8 ký tự | — | Lỗi do backend trả về từ use case (`set-password.usecase.ts:18`) |
| `settings.password.toast.setError.apiAlreadySet` | `setPassword.onError` > `extractApiErrorMessage` | Toast | Tài khoản đã có mật khẩu | — | Lỗi do backend trả về khi tài khoản đã tồn tại credential (`set-password.usecase.ts:31`) |
| `settings.password.toast.setError.fallback` | `setPassword.onError` > message fallback | Toast | Không thể đặt mật khẩu. Vui lòng thử lại. | — | Fallback cứng của hook khi đặt mật khẩu thất bại (`useProfileMutations.ts:113`) |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- **Mật khẩu mới vs Mật khẩu:**
  - Khi tài khoản đã có mật khẩu (`hasPassword === true`): Nhãn trường nhập liệu là `Mật khẩu mới`, nhãn trường xác nhận là `Xác nhận mật khẩu mới`.
  - Khi tài khoản chưa có mật khẩu (`hasPassword === false`): Nhãn trường nhập liệu rút gọn thành `Mật khẩu`, nhãn trường xác nhận là `Xác nhận mật khẩu`.
- **Nhãn nút bấm CTA chính:**
  - `Xác nhận đổi mật khẩu`: Xuất hiện trên nút submit khi tài khoản đã có mật khẩu.
  - `Đặt mật khẩu`: Xuất hiện trên nút submit khi tài khoản chưa có mật khẩu, và đồng thời xuất hiện trên nút loading trong giai đoạn `hasPasswordQuery.isLoading === true`.
- **Thông điệp mật khẩu hiện tại không chính xác:**
  - Trong use case backend (`change-password.usecase.ts:42`): `Mật khẩu hiện tại không chính xác`.
  - Trong từ điển dịch lỗi auth (`auth-errors.ts:12`): `Mật khẩu hiện tại không đúng.`.
  - Trong chuỗi fallback của hook client (`useProfileMutations.ts:88`): `Không thể đổi mật khẩu. Kiểm tra lại mật khẩu hiện tại.`.
- **Yêu cầu về độ dài mật khẩu tối thiểu (8 ký tự):**
  - Tooltip hướng dẫn: `Tối thiểu 8 ký tự. Không nên trùng mật khẩu đã dùng ở nơi khác.`.
  - Placeholder ô nhập liệu: `Ít nhất 8 ký tự`.
  - Lỗi client-side: `Mật khẩu mới phải ít nhất 8 ký tự.`.
  - Lỗi backend đổi mật khẩu (`change-password.usecase.ts:21`): `Mật khẩu mới phải có ít nhất 8 ký tự`.
  - Lỗi backend đặt mật khẩu (`password.controller.ts:64`): `Mật khẩu không hợp lệ, cần ít nhất 8 ký tự`.
  - Lỗi backend use case đặt mật khẩu (`set-password.usecase.ts:18`): `Mật khẩu phải có ít nhất 8 ký tự`.
  - Lỗi từ điển dịch auth (`auth-errors.ts:14`): `Mật khẩu phải có ít nhất 8 ký tự.`.

### Hiện trạng kỹ thuật quan sát được
- **Cơ chế kiểm soát Form bằng TanStack Form:** Form được khởi tạo bằng hook `useForm` của `@tanstack/react-form`. Khác với form React thông thường dựa vào submit mới hiện lỗi, form tại đây cấu hình validation qua sự kiện `onChange` và hiển thị lỗi ngay khi trường nhập liệu được chạm vào (`field.state.meta.isTouched`).
- **Liên kết đồng bộ validation giữa 2 trường mật khẩu:** Trường `confirmPassword` sử dụng thuộc tính `onChangeListenTo: ["newPassword"]`. Khi người dùng gõ thay đổi ở trường `newPassword`, hàm xác thực của `confirmPassword` sẽ tự động chạy lại để phát hiện kịp thời trạng thái không khớp nhau mà không cần chờ người dùng click sang trường xác nhận.
- **Tự động điền mật khẩu hiện tại (`autoComplete`):** Trường `currentPassword` có thuộc tính `autoComplete="current-password"`, cho phép trình quản lý mật khẩu của trình duyệt nhận diện và hỗ trợ người dùng điền nhanh mật khẩu cũ.
- **Không có thanh đo độ mạnh mật khẩu động:** Form hiện tại không tích hợp thanh trực quan đánh giá độ mạnh yếu (password strength meter bar) hay các tiêu chí bắt buộc về ký tự đặc biệt/chữ hoa/chữ số, mà chỉ cung cấp gợi ý tĩnh thông qua Mantine `Tooltip` gắn trên icon `Info`.
- **Cơ chế thu hồi phiên làm việc ở tầng Backend:** Khi đổi mật khẩu thành công, API `POST /profile/password/change` gọi hàm `revokeOtherSessionsUseCase(userId, currentSessionId)`. Điều này đồng nghĩa với việc tất cả các thiết bị khác đang đăng nhập cùng tài khoản sẽ bị đăng xuất ngay lập tức, trong khi thiết bị đang thao tác vẫn duy trì trạng thái đăng nhập bình thường.
- **Hoàn toàn sử dụng Toast Notification cho phản hồi API:** Trang không có component inline alert cố định để hiển thị lỗi từ API. Mọi phản hồi thành công hoặc thất bại từ backend đều được kích hoạt thông qua Mantine Toast Notifications (`notifications.show`).
- **Reset form sau khi thành công:** Cả hai nhánh `changePassword.mutate` và `setPassword.mutate` đều cấu hình callback `onSuccess: () => form.reset()`, giúp làm trống các ô nhập liệu ngay khi có phản hồi thành công từ server.

### Điểm chưa xác minh (Unknowns / Questions)
- `[Assumption / Cần xác minh]` Đối với người dùng đăng ký qua Google OAuth chưa từng có mật khẩu, khi vào menu Cài đặt, mục trên sidebar vẫn hiển thị nhãn cố định là `Đổi mật khẩu` (do hàm `getSettingsNav` gán nhãn tĩnh), trong khi tiêu đề và nút bên trong form lại là `Đặt mật khẩu`. Cần xác minh với Product Owner xem có nên điều chỉnh nhãn trên sidebar thành `Đặt mật khẩu` hoặc `Mật khẩu` đối với tài khoản chưa có mật khẩu hay không.
- `[Assumption / Cần xác minh]` Tooltip gợi ý người dùng: "Không nên trùng mật khẩu đã dùng ở nơi khác", nhưng mã nguồn backend hiện tại chỉ kiểm tra độ dài tối thiểu `>= 8` ký tự mà chưa có thuật toán kiểm tra lịch sử mật khẩu cũ (password history) hay tích hợp dịch vụ kiểm tra rò rỉ mật khẩu. Cần xác minh xem trong tương lai có bổ sung các policy này hay không.
- `[Assumption / Cần xác minh]` Thông báo toast thành công khi đổi mật khẩu ghi rõ `Các thiết bị khác đã được đăng xuất.`, tuy nhiên trên giao diện trang `/dashboard/settings/sessions`, người dùng có thể cần tải lại trang để thấy danh sách phiên khác đã biến mất. Cần xác minh xem query key `sessions` có cần được invalidate đồng thời trong `useProfileMutations` khi đổi mật khẩu thành công hay không.
