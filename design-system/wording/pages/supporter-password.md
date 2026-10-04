# Page: Đổi mật khẩu Supporter (Supporter Settings Password)
Route: `/supporter/settings/password`  
Access: `Authenticated (Supporter role - Client & Server route guard)`

---

## Page Context

### User
- **Primary user:** Người dùng Supporter (chuyên gia / người phản biện dự án) đã đăng nhập vào hệ thống với vai trò `supporter`, truy cập khu vực Cài đặt để cập nhật mật khẩu hiện tại hoặc thiết lập mật khẩu lần đầu (đối với tài khoản khởi tạo qua Google OAuth hoặc Email OTP).
- **Typical state:** `[Assumption / Cần xác minh]` Supporter chủ động đổi mật khẩu định kỳ, nghi ngờ tài khoản bị lộ mật khẩu, hoặc muốn tạo mật khẩu riêng cho tài khoản đăng ký qua bên thứ ba để đăng nhập trực tiếp bằng email và mật khẩu.
- **Knowledge level:** Biết mật khẩu hiện tại (nếu tài khoản đã có mật khẩu), hiểu quy tắc mật khẩu tối thiểu cần có từ 8 ký tự trở lên.

### User goals
- Đổi mật khẩu tài khoản Supporter sang mật khẩu mới an toàn hơn và tự động thu hồi (đăng xuất) các phiên đăng nhập khác.
- Thiết lập mật khẩu mới lần đầu nếu tài khoản Supporter chưa từng có mật khẩu (`hasPassword === false`).

### Business/Product goals
- Bảo vệ an toàn tài khoản và quyền riêng tư cho các dữ liệu nhạy cảm mà Supporter có quyền truy cập (hồ sơ khởi nghiệp của sinh viên, tài liệu nộp, nhận xét và báo cáo phản biện).
- Thu hồi tự động toàn bộ các phiên đăng nhập khác (`revokeOtherSessionsUseCase`) ngay sau khi đổi mật khẩu để vô hiệu hóa các truy cập trái phép tiềm ẩn.
- Cung cấp tính năng tự quản lý bảo mật đồng bộ và linh hoạt, hỗ trợ cả 2 kịch bản: đổi mật khẩu (`changePassword`) và đặt mật khẩu mới (`setPassword`).

### Primary action
- Nhập đầy đủ thông tin vào các trường mật khẩu và nhấn nút CTA chính: `Xác nhận đổi mật khẩu` (nếu đã có mật khẩu) hoặc `Đặt mật khẩu` (nếu chưa có mật khẩu).

### Secondary actions
- Chuyển đổi giữa các tab cài đặt tài khoản Supporter thông qua thanh điều hướng bên trái (`SettingsSidebar` với `basePath="/supporter/settings"`):
  - `Thông tin cơ bản` (`/supporter/settings/profile`)
  - `Thiết bị & Phiên đăng nhập` (`/supporter/settings/sessions`)
  - *(Lưu ý: mục `Cài đặt thông báo` bị ẩn đối với vai trò Supporter theo logic cấu hình tại `settings-nav.ts`)*
- Rê chuột hoặc chạm vào biểu tượng thông tin (`Info`) để xem tooltip hướng dẫn độ an toàn của mật khẩu.
- Chuyển hướng tới `Trang chủ` (`/supporter`), xem thông báo (`NotificationBell`), đổi giao diện Sáng / Tối (`ThemeToggler`), hoặc `Đăng xuất` thông qua thanh điều hướng trên cùng (`DashboardShell` / `UserMenu`).

### Entry
- Supporter bấm vào avatar tài khoản ở góc phải trên cùng (`UserMenu`) > chọn mục `Cài đặt` (dẫn tới `/supporter/settings`, server tự động redirect tới `/supporter/settings/profile`) > bấm chọn tab `Đổi mật khẩu` (`/supporter/settings/password`) tại thanh sidebar.
- Truy cập trực tiếp qua đường dẫn URL `/supporter/settings/password`.
- `[Assumption / Cần xác minh]` Có thể được gợi ý điều hướng từ trang quản lý phiên đăng nhập (`/supporter/settings/sessions`) khi Supporter phát hiện thiết bị lạ và muốn đổi mật khẩu ngay để bảo vệ tài khoản.

### Exit / next step
- Khi đổi mật khẩu thành công: Form tự động xóa trắng các trường (`form.reset()`), hiển thị thông báo toast màu xanh lá `Đã đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất.`, người dùng tiếp tục ở lại trang hoặc chuyển tab khác.
- Khi đặt mật khẩu thành công: Form tự động xóa trắng các trường (`form.reset()`), hiển thị thông báo toast màu xanh lá `Đã đặt mật khẩu. Có thể đăng nhập bằng mật khẩu lần sau.`, query trạng thái mật khẩu được làm mới (`invalidateQueries({ queryKey: ["password-status"] })`) và giao diện tự chuyển sang chế độ đổi mật khẩu.
- Khi bấm chọn tab khác trên sidebar: Chuyển hướng tới `/supporter/settings/profile` hoặc `/supporter/settings/sessions`.
- Khi bấm vào logo hoặc menu `Trang chủ`: Điều hướng về `/supporter` (không gian làm việc chính của Supporter).
- Khi bấm `Đăng xuất`: Gọi hàm `signOut()`, xóa query cache và chuyển hướng về `/auth`.

### Product facts / constraints
- **Bảo vệ phân quyền và điều hướng route (Route Guard):**
  - Trang được bọc bởi `SupporterLayout` (`apps/web-1/app/supporter/layout.tsx:9-33`).
  - Nếu chưa đăng nhập (`!session`), client tự động chuyển hướng về `/auth`.
  - Nếu người dùng đăng nhập với role khác `supporter` (`userRole !== "supporter"`), client tự động chuyển hướng về `/dashboard` (nguồn: `apps/web-1/app/supporter/layout.tsx:16-21`).
  - Trong lúc đang kiểm tra phiên làm việc (`isPending`), hiển thị `LoadingScreen` với thông điệp: `Đang kiểm tra quyền Supporter...` (nguồn: `apps/web-1/app/supporter/layout.tsx:24-26`).
- **Khung giao diện Cài đặt (SettingsLayout & SettingsSidebar):**
  - Component `SupporterSettingsLayout` (`apps/web-1/app/supporter/settings/layout.tsx:4-6`) sử dụng `SettingsLayout` với `basePath="/supporter/settings"`.
  - Tiêu đề cố định: `Cài đặt`, mô tả: `Quản lý thông tin cá nhân và bảo mật tài khoản` (nguồn: `apps/web-1/app/dashboard/settings/_components/SettingsLayout.tsx:14-17`).
  - Danh sách mục trên sidebar được tạo bởi `getSettingsNav("/supporter/settings")`. Do `basePath.startsWith("/supporter") === true`, mục `/notifications` (`Cài đặt thông báo`) bị lọc bỏ (nguồn: `apps/web-1/app/dashboard/settings/_components/settings-nav.ts:16-23`), chỉ hiển thị 3 mục: `Thông tin cơ bản`, `Đổi mật khẩu`, `Thiết bị & Phiên đăng nhập`.
- **Trạng thái tải dữ liệu phiên làm việc (Session Loading):**
  - Component `SupporterSettingsPasswordPage` (`apps/web-1/app/supporter/settings/password/page.tsx:8-28`) kiểm tra session qua `useSession()`.
  - Khi đang tải session (`isPending`), hiển thị spinner xoay `Loader2` ở giữa màn hình (`min-h-[60vh]`).
  - Nếu session không chứa thông tin user (`!sessionData?.user`), hiển thị thông báo lỗi tĩnh: `Không thể tải thông tin tài khoản. Vui lòng thử lại sau.`.
- **Tái sử dụng Form Đổi mật khẩu (`ChangePasswordForm`):**
  - Trang sử dụng trực tiếp component `ChangePasswordForm` (`apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx:17-160`), chia sẻ toàn bộ logic xác thực, gọi API và thông báo với giao diện sinh viên.
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

### 1. Màn hình chờ kiểm tra quyền truy cập Supporter (Supporter Layout Loading Screen)
*Source: `apps/web-1/app/supporter/layout.tsx:24-26`, `apps/web-1/components/ui/LoadingScreen.tsx:40-47`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.layout.loading.brand` | `LoadingScreen` > `p` | Label | NEXUS PLATFORM | — | loading |
| `supporter.layout.loading.message` | `LoadingScreen` > `p` | Description | Đang kiểm tra quyền Supporter... | — | loading (hiển thị khi `isPending === true`) |

---

### 2. Khung giao diện chung & Thanh điều hướng trên cùng (Dashboard Shell & Top Navbar - Supporter Role)
*Source: `apps/web-1/components/layout/DashboardShell.tsx:33-55`, `apps/web-1/components/layout/_components/UserMenu.tsx:35-151`, `apps/web-1/components/layout/NotificationBell.tsx:28-115`, `apps/web-1/components/ui/ThemeToggler.tsx:23-33`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.shell.logo` | `DashboardShell` > `Link` > `Logo` | Navigation | *(Logo hình ảnh SVG Nexus Platform)* | `/supporter` (đối với role `supporter`) | default |
| `supporter.shell.notifications.trigger` | `NotificationBell` > `Menu.Target` > `ActionIcon` | Aria-label | Thông báo | Bật / tắt menu danh sách thông báo | default (hiển thị badge đỏ khi có thông báo chưa đọc) |
| `supporter.shell.notifications.title` | `NotificationBell` > `Menu.Dropdown` > `Text` | Heading | Thông báo | — | default |
| `supporter.shell.notifications.empty` | `NotificationBell` > `Menu.Dropdown` > `Text` | Empty state | Không có thông báo | — | default (khi danh sách thông báo rỗng) |
| `supporter.shell.notifications.markAllRead` | `NotificationBell` > `Menu.Dropdown` > footer button | CTA | Đánh dấu tất cả đã đọc | Gọi API `PATCH /notifications/read-all` | default (disabled khi `unreadCount === 0`) |
| `supporter.shell.theme.toggle` | `ThemeToggler` > `ActionIcon` | Aria-label | Toggle theme | Chuyển đổi giao diện Sáng / Tối | default |
| `supporter.shell.userMenu.trigger` | `UserMenu` > `Popover.Target` > button | Aria-label | Tài khoản | Bật / tắt menu người dùng | default |
| `supporter.shell.userMenu.avatarAlt` | `UserMenu` > `Avatar` | Alt text | `<code>{user.name}</code>` hoặc `User` | Mở menu người dùng | default |
| `supporter.shell.userMenu.avatarFallback` | `UserMenu` > `Avatar` fallback text | Item | `<code>{user.name?.substring(0, 2).toUpperCase()}</code>` hoặc `US` | Mở menu người dùng | default (khi không có ảnh đại diện) |
| `supporter.shell.userMenu.email` | `UserMenu` > `Popover.Dropdown` > email block | Item | `<code>{user.email}</code>` hoặc `—` | — | default |
| `supporter.shell.userMenu.nav.home` | `UserMenu` > menu button | Navigation | Trang chủ | `/supporter` (đối với role `supporter`) | default |
| `supporter.shell.userMenu.nav.settings` | `UserMenu` > menu button | Navigation | Cài đặt | `/supporter/settings` (đối với role `supporter`) | default |
| `supporter.shell.userMenu.signOut` | `UserMenu` > menu button | CTA | Đăng xuất | Gọi hàm `signOut()`, xóa query cache và chuyển hướng về `/auth` | default |

---

### 3. Tiêu đề khu vực Cài đặt & Thanh điều hướng phân mục Supporter (Settings Layout & Sidebar)
*Source: `apps/web-1/app/dashboard/settings/_components/SettingsLayout.tsx:12-23`, `apps/web-1/app/dashboard/settings/_components/SettingsSidebar.tsx:15-36`, `apps/web-1/app/dashboard/settings/_components/settings-nav.ts:9-23`, `apps/web-1/app/supporter/settings/layout.tsx:4-6`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.settings.layout.title` | `SettingsLayout` > header > `h1` | Heading | Cài đặt | — | default |
| `supporter.settings.layout.description` | `SettingsLayout` > header > `p` | Description | Quản lý thông tin cá nhân và bảo mật tài khoản | — | default |
| `supporter.settings.sidebar.nav.profile` | `SettingsSidebar` > `Link` | Navigation | Thông tin cơ bản | `/supporter/settings/profile` | default |
| `supporter.settings.sidebar.nav.password` | `SettingsSidebar` > `Link` | Navigation | Đổi mật khẩu | `/supporter/settings/password` | active (`aria-current="page"`, nền `bg-surface-soft`, chữ màu `brand font-semibold`) |
| `supporter.settings.sidebar.nav.sessions` | `SettingsSidebar` > `Link` | Navigation | Thiết bị & Phiên đăng nhập | `/supporter/settings/sessions` | default |

---

### 4. Trạng thái tải trang & Xử lý lỗi Session (Page Shell States)
*Source: `apps/web-1/app/supporter/settings/password/page.tsx:8-28`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.password.loading.session` | `SupporterSettingsPasswordPage` > loading container > `Loader2` | Empty state | — *(Spinner icon xoay tròn, màu `text-brand`)* | — | loading (hiển thị khi `isPending === true`) |
| `supporter.password.error.session` | `SupporterSettingsPasswordPage` > `Text` | Error | Không thể tải thông tin tài khoản. Vui lòng thử lại sau. | — | error (hiển thị khi `!isPending && !sessionData?.user`) |

---

### 5. Trạng thái tải dữ liệu trạng thái mật khẩu (Password Status Query Loading)
*Source: `apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx:41-49`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.password.loading.queryButton` | `ChangePasswordForm` > `Paper` > `Button` | CTA | Đặt mật khẩu | — | loading (hiển thị khi `hasPasswordQuery.isLoading === true`) |

---

### 6. Form Đổi mật khẩu - Tài khoản đã có mật khẩu (`hasPassword === true`)
*Source: `apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx:50-160`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.password.form.currentPassword.label` | `form.Field[name="currentPassword"]` > `PasswordInput` > label | Label | Mật khẩu hiện tại | — | default |
| `supporter.password.form.currentPassword.placeholder` | `form.Field[name="currentPassword"]` > `PasswordInput` > placeholder | Placeholder | Nhập mật khẩu hiện tại | Nhập mật khẩu cũ của tài khoản (`autoComplete="current-password"`) | default |
| `supporter.password.form.newPassword.label` | `form.Field[name="newPassword"]` > `PasswordInput` > label > `span` | Label | Mật khẩu mới | — | default |
| `supporter.password.form.newPassword.tooltip` | `form.Field[name="newPassword"]` > `PasswordInput` > label > `Tooltip` | Helper | Tối thiểu 8 ký tự. Không nên trùng mật khẩu đã dùng ở nơi khác. | Rê chuột / chạm vào icon `Info` để xem gợi ý | default |
| `supporter.password.form.newPassword.placeholder` | `form.Field[name="newPassword"]` > `PasswordInput` > placeholder | Placeholder | Ít nhất 8 ký tự | Nhập mật khẩu mới muốn thay đổi | default |
| `supporter.password.form.confirmPassword.label` | `form.Field[name="confirmPassword"]` > `PasswordInput` > label | Label | Xác nhận mật khẩu mới | — | default |
| `supporter.password.form.confirmPassword.placeholder` | `form.Field[name="confirmPassword"]` > `PasswordInput` > placeholder | Placeholder | Nhập lại mật khẩu | Nhập lại mật khẩu mới để đối chiếu | default |
| `supporter.password.form.changeSubmit.button` | `ChangePasswordForm` > `form` > `Button[type="submit"]` | CTA | Xác nhận đổi mật khẩu | Gửi form gọi mutation `changePassword` (`POST /profile/password/change`) | default (chuyển sang `loading` khi `pending || hasPasswordQuery.isLoading`) |

---

### 7. Form Thiết lập mật khẩu - Tài khoản chưa có mật khẩu (`hasPassword === false`)
*Source: `apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx:50-160`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.password.form.setPassword.newPassword.label` | `form.Field[name="newPassword"]` > `PasswordInput` > label > `span` | Label | Mật khẩu | — | default |
| `supporter.password.form.setPassword.newPassword.tooltip` | `form.Field[name="newPassword"]` > `PasswordInput` > label > `Tooltip` | Helper | Tối thiểu 8 ký tự. Không nên trùng mật khẩu đã dùng ở nơi khác. | Rê chuột / chạm vào icon `Info` để xem gợi ý | default |
| `supporter.password.form.setPassword.newPassword.placeholder` | `form.Field[name="newPassword"]` > `PasswordInput` > placeholder | Placeholder | Ít nhất 8 ký tự | Nhập mật khẩu muốn thiết lập cho tài khoản | default |
| `supporter.password.form.setPassword.confirmPassword.label` | `form.Field[name="confirmPassword"]` > `PasswordInput` > label | Label | Xác nhận mật khẩu | — | default |
| `supporter.password.form.setPassword.confirmPassword.placeholder` | `form.Field[name="confirmPassword"]` > `PasswordInput` > placeholder | Placeholder | Nhập lại mật khẩu | Nhập lại mật khẩu mới để đối chiếu | default |
| `supporter.password.form.setSubmit.button` | `ChangePasswordForm` > `form` > `Button[type="submit"]` | CTA | Đặt mật khẩu | Gửi form gọi mutation `setPassword` (`POST /profile/password`) | default (chuyển sang `loading` khi `pending || hasPasswordQuery.isLoading`) |

---

### 8. Thông báo lỗi xác thực tại chỗ (Client-side Form Validation Errors)
*Source: `apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx:63-65, 89-93, 131-134`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.password.error.currentPasswordRequired` | `form.Field[name="currentPassword"]` > `PasswordInput` > `error` | Error | Vui lòng nhập mật khẩu hiện tại. | — | Hiển thị khi trường `currentPassword` trống và đã tương tác (`isTouched`) |
| `supporter.password.error.newPasswordRequired` | `form.Field[name="newPassword"]` > `PasswordInput` > `error` | Error | Vui lòng nhập mật khẩu mới. | — | Hiển thị khi trường `newPassword` trống và đã tương tác (`isTouched`) |
| `supporter.password.error.newPasswordMinLength` | `form.Field[name="newPassword"]` > `PasswordInput` > `error` | Error | Mật khẩu mới phải ít nhất 8 ký tự. | — | Hiển thị khi trường `newPassword` có độ dài nhỏ hơn 8 ký tự |
| `supporter.password.error.confirmPasswordMismatch` | `form.Field[name="confirmPassword"]` > `PasswordInput` > `error` | Error | Xác nhận mật khẩu không khớp. | — | Hiển thị khi giá trị trường `confirmPassword` khác với trường `newPassword` |

---

### 9. Thông báo nổi phản hồi kết quả (Toast Notifications: Success & Failure)
*Source: `apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts:66-116`, `apps/web-1/lib/auth-errors.ts:3-35`, `apps/api/src/modules/profile/application/change-password.usecase.ts:20-44`, `apps/api/src/modules/profile/application/set-password.usecase.ts:17-32`, `apps/api/src/modules/profile/http/password.controller.ts:60-66, 81-87`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.password.toast.changeSuccess.title` | `changePassword.onSuccess` > `notifications.show` > `title` | Toast | Thành công | — | client toast trigger (màu `green`) |
| `supporter.password.toast.changeSuccess.message` | `changePassword.onSuccess` > `notifications.show` > `message` | Toast | Đã đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất. | — | client toast trigger (màu `green`, tự động reset form) |
| `supporter.password.toast.setSuccess.title` | `setPassword.onSuccess` > `notifications.show` > `title` | Toast | Thành công | — | client toast trigger (màu `green`) |
| `supporter.password.toast.setSuccess.message` | `setPassword.onSuccess` > `notifications.show` > `message` | Toast | Đã đặt mật khẩu. Có thể đăng nhập bằng mật khẩu lần sau. | — | client toast trigger (màu `green`, tự động reset form) |
| `supporter.password.toast.error.title` | `onError` > `notifications.show` > `title` | Toast | Lỗi | — | client toast trigger (màu `red`, áp dụng cho cả đổi và đặt mật khẩu) |
| `supporter.password.toast.changeError.apiWrongPassword` | `changePassword.onError` > `extractApiErrorMessage` | Toast | Mật khẩu hiện tại không chính xác | — | Lỗi do backend trả về khi nhập sai mật khẩu cũ (`change-password.usecase.ts:42`) |
| `supporter.password.toast.changeError.apiNewPasswordLength` | `changePassword.onError` > `extractApiErrorMessage` | Toast | Mật khẩu mới phải có ít nhất 8 ký tự | — | Lỗi do backend trả về khi mật khẩu mới không đủ 8 ký tự (`password.controller.ts:85`) |
| `supporter.password.toast.changeError.transInvalidPassword` | `changePassword.onError` > `translateAuthError` | Toast | Mật khẩu hiện tại không đúng. | — | Dịch từ lỗi auth chứa `invalid password` (`auth-errors.ts:12`) |
| `supporter.password.toast.changeError.transPasswordTooWeak` | `changePassword.onError` > `translateAuthError` | Toast | Mật khẩu mới quá yếu. Vui lòng chọn mật khẩu mạnh hơn. | — | Dịch từ lỗi auth chứa `password is too weak` (`auth-errors.ts:13`) |
| `supporter.password.toast.changeError.transPasswordTooShort` | `changePassword.onError` > `translateAuthError` | Toast | Mật khẩu phải có ít nhất 8 ký tự. | — | Dịch từ lỗi auth chứa `password is too short` hoặc `password_too_short` (`auth-errors.ts:14-15`) |
| `supporter.password.toast.changeError.transAccountLockedSeconds` | `changePassword.onError` > `translateAuthError` | Toast | `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${seconds} giây.` | — | Dịch từ lỗi auth bắt đầu bằng `ACCOUNT_LOCKED_TEMPORARY:${seconds}` (`auth-errors.ts:8`) |
| `supporter.password.toast.changeError.transAccountLockedMinutes` | `changePassword.onError` > `translateAuthError` | Toast | Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ít phút. | — | Dịch từ lỗi auth bắt đầu bằng `ACCOUNT_LOCKED_TEMPORARY` không kèm số giây (`auth-errors.ts:9`) |
| `supporter.password.toast.changeError.transFallback` | `changePassword.onError` > `translateAuthError` | Toast | Đã có lỗi xảy ra. Vui lòng thử lại. | — | Fallback khi lỗi auth không khớp từ khóa nào trong từ điển dịch (`auth-errors.ts:34`) |
| `supporter.password.toast.changeError.fallback` | `changePassword.onError` > message fallback | Toast | Không thể đổi mật khẩu. Kiểm tra lại mật khẩu hiện tại. | — | Fallback cứng của hook khi không trích xuất được thông điệp lỗi (`useProfileMutations.ts:88`) |
| `supporter.password.toast.setError.apiInvalidInput` | `setPassword.onError` > `extractApiErrorMessage` | Toast | Mật khẩu không hợp lệ, cần ít nhất 8 ký tự | — | Lỗi do backend trả về khi body không đạt Zod schema (`password.controller.ts:64`) |
| `supporter.password.toast.setError.apiTooShort` | `setPassword.onError` > `extractApiErrorMessage` | Toast | Mật khẩu phải có ít nhất 8 ký tự | — | Lỗi do backend trả về từ use case (`set-password.usecase.ts:18`) |
| `supporter.password.toast.setError.apiAlreadySet` | `setPassword.onError` > `extractApiErrorMessage` | Toast | Tài khoản đã có mật khẩu | — | Lỗi do backend trả về khi tài khoản đã tồn tại credential (`set-password.usecase.ts:31`) |
| `supporter.password.toast.setError.fallback` | `setPassword.onError` > message fallback | Toast | Không thể đặt mật khẩu. Vui lòng thử lại. | — | Fallback cứng của hook khi đặt mật khẩu thất bại (`useProfileMutations.ts:113`) |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- **Khác biệt về bố cục và câu chữ giữa Supporter Settings và Student Settings:**
  - Sidebar cài đặt của Supporter chỉ hiển thị 3 mục: `Thông tin cơ bản` (`/supporter/settings/profile`), `Đổi mật khẩu` (`/supporter/settings/password`), và `Thiết bị & Phiên đăng nhập` (`/supporter/settings/sessions`). Mục `Cài đặt thông báo` (`/dashboard/settings/notifications`) bị ẩn do điều kiện lọc trong `getSettingsNav` (`settings-nav.ts:17-18`).
  - Menu người dùng (`UserMenu`) dành cho Supporter không hiển thị khối `Số dư` và liên kết `Ví của tôi` (vốn chỉ dành cho sinh viên - `isStudent`).
  - Logo và mục `Trang chủ` trong menu người dùng điều hướng về `/supporter` (thay vì `/dashboard`).
  - Mục `Cài đặt` trong menu người dùng dẫn tới `/supporter/settings` (thay vì `/dashboard/settings`).
  - Thông điệp màn hình chờ của Supporter khi kiểm tra phiên làm việc là `Đang kiểm tra quyền Supporter...` (thay vì `Đang xác thực tài khoản...` mặc định của `LoadingScreen`).
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
  - Lỗi backend đổi mật khẩu (`password.controller.ts:85`): `Mật khẩu mới phải có ít nhất 8 ký tự`.
  - Lỗi backend đặt mật khẩu (`password.controller.ts:64`): `Mật khẩu không hợp lệ, cần ít nhất 8 ký tự`.
  - Lỗi backend use case đặt mật khẩu (`set-password.usecase.ts:18`): `Mật khẩu phải có ít nhất 8 ký tự`.
  - Lỗi từ điển dịch auth (`auth-errors.ts:14`): `Mật khẩu phải có ít nhất 8 ký tự.`.

### Hiện trạng kỹ thuật quan sát được
- **Tái sử dụng Component `ChangePasswordForm`:** Trang `SupporterSettingsPasswordPage` (`apps/web-1/app/supporter/settings/password/page.tsx`) tái sử dụng trực tiếp component `ChangePasswordForm` từ `apps/web-1/app/dashboard/settings/password/_components/ChangePasswordForm.tsx`. Nhờ đó, logic xử lý form, quy tắc validation và các API hook đều được dùng chung, bảo đảm tính nhất quán trên toàn hệ thống.
- **Bảo vệ phân quyền chặt chẽ (Role Guard):** `SupporterLayout` kiểm tra quyền nghiêm ngặt: nếu session có role khác `supporter` (kể cả role sinh viên hay admin), hệ thống lập tức đẩy về `/dashboard`. Người dùng chưa đăng nhập sẽ bị đẩy về `/auth`.
- **Phân tách không gian tên URL qua `basePath`:** `SupporterSettingsLayout` truyền prop `basePath="/supporter/settings"` vào `SettingsLayout`, giúp `SettingsSidebar` sinh các đường link chính xác cho Supporter mà không bị nhảy nhầm sang khu vực `/dashboard/settings/*` của sinh viên.
- **Cơ chế kiểm soát Form bằng TanStack Form:** Form được khởi tạo bằng hook `useForm` của `@tanstack/react-form`. Lỗi xác thực được tính toán theo sự kiện `onChange` và hiển thị khi trường đã được chạm vào (`field.state.meta.isTouched`).
- **Liên kết đồng bộ validation giữa 2 trường mật khẩu:** Trường `confirmPassword` sử dụng thuộc tính `onChangeListenTo: ["newPassword"]`, giúp tự động đánh giá lại tính trùng khớp khi người dùng thay đổi giá trị ô `newPassword`.
- **Tự động điền mật khẩu hiện tại (`autoComplete`):** Trường `currentPassword` có thuộc tính `autoComplete="current-password"`, hỗ trợ các trình quản lý mật khẩu tự động điền.
- **Cơ chế thu hồi phiên làm việc ở tầng Backend:** Khi đổi mật khẩu thành công qua `changePasswordUseCase`, backend thực thi `revokeOtherSessionsUseCase(userId, currentSessionId)`, hủy bỏ tất cả phiên đăng nhập khác của Supporter trên các thiết bị khác.
- **Hoàn toàn sử dụng Toast Notification cho phản hồi API:** Trang không có component inline alert cố định để hiển thị lỗi từ API. Mọi phản hồi thành công hoặc thất bại từ backend đều được kích hoạt thông qua Mantine Toast Notifications (`notifications.show`).
- **Reset form sau khi thành công:** Cả hai nhánh `changePassword.mutate` và `setPassword.mutate` đều cấu hình callback `onSuccess: () => form.reset()`, giúp làm trống các ô nhập liệu ngay khi có phản hồi thành công từ server.

### Điểm chưa xác minh (Unknowns / Questions)
- `[Assumption / Cần xác minh]` Đối với tài khoản Supporter đăng ký qua Google OAuth chưa từng có mật khẩu, khi vào menu Cài đặt, mục trên sidebar vẫn hiển thị nhãn cố định là `Đổi mật khẩu` (do hàm `getSettingsNav` gán nhãn tĩnh), trong khi tiêu đề và nút bên trong form lại là `Đặt mật khẩu`. Cần xác minh với Product Owner xem có nên điều chỉnh nhãn trên sidebar thành `Đặt mật khẩu` hoặc `Mật khẩu` đối với tài khoản chưa có mật khẩu hay không.
- `[Assumption / Cần xác minh]` Mục `Cài đặt thông báo` (`/notifications`) bị ẩn đối với Supporter trong `settings-nav.ts`, tuy nhiên thanh navbar trên cùng của Supporter vẫn hiển thị biểu tượng chuông `NotificationBell`. Cần xác minh xem Supporter có cần một trang cài đặt nhận thông báo (email/web notification preferences) trong tương lai hay không.
- `[Assumption / Cần xác minh]` Tooltip gợi ý người dùng: "Không nên trùng mật khẩu đã dùng ở nơi khác", nhưng mã nguồn backend hiện tại chỉ kiểm tra độ dài tối thiểu `>= 8` ký tự mà chưa có thuật toán kiểm tra lịch sử mật khẩu cũ (password history) hay tích hợp dịch vụ kiểm tra rò rỉ mật khẩu.
- `[Assumption / Cần xác minh]` Thông báo toast thành công khi đổi mật khẩu ghi rõ `Các thiết bị khác đã được đăng xuất.`, tuy nhiên trên giao diện trang `/supporter/settings/sessions`, người dùng có thể cần tải lại trang để thấy danh sách phiên khác đã biến mất nếu query key `sessions` không được tự động invalidate trong `useProfileMutations`.
