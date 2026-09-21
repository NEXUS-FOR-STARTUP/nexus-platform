# Page: Supporter Profile (Hồ sơ Supporter / Cài đặt thông tin cá nhân)

## Layer 1: Page Context

- **Route:** `/supporter/settings/profile`
- **Access:** `Supporter` (Yêu cầu phiên đăng nhập với vai trò Supporter). `SupporterLayout` kiểm tra phiên đăng nhập qua `useSession`: nếu đang tải hiển thị màn hình chờ `Đang kiểm tra quyền Supporter...`, nếu chưa đăng nhập tự động điều hướng sang `/auth`, nếu đã đăng nhập nhưng người dùng không có vai trò `supporter` sẽ tự động chuyển hướng sang `/dashboard` (`apps/web-1/app/supporter/layout.tsx:13–30`).
- **User:**
  - **Primary user:** Supporter (Cố vấn học thuật / Chuyên gia phản biện) đã đăng nhập vào Nexus Platform truy cập khu vực cài đặt tài khoản cá nhân.
  - **Typical state:** Supporter muốn xem lại thông tin cá nhân, cập nhật tên hiển thị, thay đổi ảnh đại diện cá nhân hoặc thực hiện tác vụ xóa tài khoản vĩnh viễn khỏi hệ thống.
  - **Knowledge level:** Đã được cấp quyền vai trò `supporter` trong hệ thống Nexus Platform; hiểu rằng email đăng nhập gắn liền với danh tính tài khoản và không thể tự ý thay đổi trực tiếp.
- **User goals:**
  - Cập nhật ảnh đại diện (avatar) từ thiết bị (.jpg, .jpeg, .png, .webp với dung lượng tối đa 2MB) để hiển thị trong không gian làm việc của Supporter, thanh điều hướng và trao đổi tin nhắn phản biện với nhóm sinh viên.
  - Thay đổi tên hiển thị (display name) dùng trong toàn bộ giao diện supporter dashboard, danh sách hồ sơ phụ trách và thông tin người phản biện trong báo cáo.
  - Xem và đối soát địa chỉ email đăng nhập của tài khoản Supporter hiện tại.
  - Xóa tài khoản vĩnh viễn và ẩn danh hóa toàn bộ thông tin cá nhân khi không còn tiếp tục cộng tác vai trò Supporter trên hệ thống.
- **Business / Product goals:**
  - Cung cấp tính năng tự quản lý hồ sơ cơ bản (Self-service profile management) cho đội ngũ Supporter giúp cá nhân hóa trải nghiệm và nhận diện trong quy trình phản biện.
  - Đảm bảo tính toàn vẹn và bảo mật của tài khoản bằng cách khóa trường email đăng nhập (ngăn chặn hành vi chiếm dụng hoặc thay đổi email không qua quy trình xác minh).
  - Tái sử dụng kiến trúc form và logic xử lý hồ sơ (`ProfileInfoForm`, `useProfileMutations`) nhằm đảm bảo tính nhất quán (KISS, DRY) giữa các phân hệ người dùng trên nền tảng.
  - Tuân thủ quyền riêng tư và quyền được xóa dữ liệu cá nhân (Right to be forgotten / GDPR compliance) thông qua khu vực Vùng nguy hiểm (Danger Zone) với cơ chế xác nhận 2 bước chống bấm nhầm.
- **Primary action:**
  - Nhập tên hiển thị mới và bấm `Lưu thay đổi` (`ProfileInfoForm.tsx:140–142`).
  - Hoặc bấm `Đổi ảnh` để tải lên ảnh đại diện mới từ thiết bị (`ProfileInfoForm.tsx:77–85`).
- **Secondary actions:**
  - Điều hướng sang các tab cài đặt khác của Supporter qua sidebar: `Đổi mật khẩu` (`/supporter/settings/password`), `Thiết bị & Phiên đăng nhập` (`/supporter/settings/sessions`) (`SettingsSidebar.tsx:16–35`; `settings-nav.ts:16–22`).
  - Mở modal xóa tài khoản qua nút `Xóa tài khoản` trong Vùng nguy hiểm (`ProfileInfoForm.tsx:158–166`).
  - Điều hướng về trang chủ không gian làm việc Supporter (`/supporter`) qua logo trên Navbar hoặc qua `UserMenu` (`DashboardShell.tsx:35, 44–46`; `UserMenu.tsx:45, 69`).
  - Mở menu thông báo qua biểu tượng chuông trên Navbar (`NotificationBell.tsx:27–50`).
  - Chuyển đổi giao diện sáng / tối qua `ThemeToggler` (`ThemeToggler.tsx:23–32`).
  - Đăng xuất tài khoản qua `UserMenu` (`UserMenu.tsx:141–148`).
- **Entry:**
  - Click vào menu người dùng (`UserMenu`) trên Navbar khi đang ở vai trò Supporter > chọn `Cài đặt` (`UserMenu.tsx:73–75`), chuyển hướng tới `/supporter/settings`, sau đó server redirect tới `/supporter/settings/profile` (`apps/web-1/app/supporter/settings/page.tsx:4`).
  - Truy cập trực tiếp qua liên kết `/supporter/settings/profile`.
  - Chuyển tab từ các trang cài đặt khác của Supporter qua `SettingsSidebar` (`/supporter/settings/password`, `/supporter/settings/sessions`).
- **Exit / next step:**
  - Cập nhật tên thành công: Ở lại trang, hiển thị toast thông báo thành công `"Đã cập nhật thông tin hồ sơ."` và làm mới dữ liệu session (`useProfileMutations.ts:51–56`; `apps/web-1/app/supporter/settings/profile/page.tsx:29`).
  - Đổi ảnh đại diện thành công: Ở lại trang, cập nhật avatar trên trang và toàn bộ hệ thống (`useProfileMutations.ts:130–140`).
  - Xóa tài khoản thành công: Đăng xuất tài khoản, xóa toàn bộ bộ nhớ đệm truy vấn (`queryClient.clear()`), điều hướng về trang đăng nhập `/auth` (`useProfileMutations.ts:156–169`).
  - Chuyển trang khác: Người dùng click vào các liên kết trên sidebar (`/supporter/settings/password`, `/supporter/settings/sessions`), logo navbar (`/supporter`), hoặc các menu khác.
- **Product facts / constraints:**
  - **Tái sử dụng component ProfileInfoForm:** Trang `/supporter/settings/profile` hiện tại import và render trực tiếp component `ProfileInfoForm` từ `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx` (`apps/web-1/app/supporter/settings/profile/page.tsx:6, 29`).
  - **Phạm vi trường dữ liệu thực tế (Không có chuyên môn, kinh nghiệm, thông tin liên hệ):** Mặc dù trong mô tả nghiệp vụ hoặc kế hoạch có thể đề cập đến "chuyên môn", "kinh nghiệm", "thông tin liên hệ" của Supporter, nhưng trong mã nguồn thực tế hiện tại, form chỉ quản lý đúng 3 trường: `Ảnh đại diện`, `Tên hiển thị` và `Email đăng nhập`. Hoàn toàn **chưa có** các trường nhập liệu về chuyên môn đào tạo, lĩnh vực thẩm định (expertise), số năm kinh nghiệm, tiểu sử (bio) hay số điện thoại liên hệ (`ProfileInfoForm.tsx:72–144`).
  - **Thanh sidebar Supporter bị ẩn tab Cài đặt thông báo:** Hàm `getSettingsNav` trong `settings-nav.ts:16–23` có logic lọc: `!(basePath.startsWith("/supporter") && item.href === "/notifications")`. Do đó, khi Supporter truy cập cài đặt (`basePath = "/supporter/settings"`), thanh sidebar chỉ hiển thị 3 tab (`Thông tin cơ bản`, `Đổi mật khẩu`, `Thiết bị & Phiên đăng nhập`), tab `Cài đặt thông báo` bị loại trừ hoàn toàn khỏi giao diện.
  - **UserMenu cho Supporter ẩn hoàn toàn mục Ví và Số dư:** Trong `UserMenu.tsx:35, 70–72, 118–125`, các phần tử liên quan đến ví sinh viên (`Ví của tôi`, block `Số dư ... VND`) chỉ hiển thị khi `isStudent` (`user?.role !== "supporter" && user?.role !== "admin"`). Đối với Supporter, menu chỉ hiển thị `Trang chủ` (`/supporter`), `Cài đặt` (`/supporter/settings`) và `Đăng xuất`.
  - **Logo Navbar dẫn về /supporter:** `DashboardShell.tsx:35` định nghĩa `if (user?.role === "supporter") return "/supporter"`. Do đó, khi Supporter click vào logo Nexus trên thanh điều hướng, đích đến là `/supporter` (danh sách hồ sơ phản biện) thay vì `/dashboard` của sinh viên.
  - **Email đăng nhập bị vô hiệu hóa (Read-only):** Input email có thuộc tính `disabled`, kèm icon `Info` và tooltip giải thích: `"Email dùng để đăng nhập, không thể thay đổi."` (`ProfileInfoForm.tsx:119–138`).
  - **Giới hạn tệp ảnh đại diện:** Hệ thống chỉ chấp nhận các định dạng `.jpg`, `.jpeg`, `.png`, `.webp` và dung lượng tối đa `2MB` (`MAX_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024`). Nếu tệp không hợp lệ, client chặn ngay lập tức và ném lỗi trước khi gửi request (`useProfileMutations.ts:10–37, 120`).
  - **Validation tên hiển thị:** Sử dụng TanStack Form v1. Trường `name` không được để khoảng trắng rỗng (`!value.trim()`), nếu vi phạm hiển thị thông báo lỗi: `"Tên hiển thị không được để trống."` (`ProfileInfoForm.tsx:98–100`).
  - **Quy tắc xác nhận xóa tài khoản:** Modal yêu cầu người dùng nhập từ khóa xác nhận. Hệ thống kiểm tra điều kiện `["XOA", "XÓA"].includes(confirmText.trim().toUpperCase())` nhằm hỗ trợ cả gõ không dấu và có dấu, tránh xung đột với các bộ gõ tiếng Việt Unikey/EVKey (`DeleteAccountModal.tsx:22–24`). Nút `Xác nhận xóa tài khoản` bị `disabled` cho đến khi người dùng nhập chính xác chuỗi ký tự này (`DeleteAccountModal.tsx:81`).

---

## Layer 2: Interactive Inventory

### 2.1 Khung bao Supporter & Thanh điều hướng trên cùng (`DashboardShell`, `UserMenu`, `NotificationBell`, `ThemeToggler`, `Logo`)

*Nguồn: `apps/web-1/components/layout/DashboardShell.tsx`, `UserMenu.tsx`, `NotificationBell.tsx`, `ThemeToggler.tsx`, `Logo.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.shell.logo.alt` | `Logo` > `img` (`Logo.tsx:26`) | Alt text | Nexus Logo | `/supporter` (click logo điều hướng về trang chủ Supporter qua `getHomeLink()`) | default |
| `supporter.shell.notification.button` | `NotificationBell` > `ActionIcon` (`NotificationBell.tsx:34`) | Aria-label | Thông báo | Mở menu thông báo (`Menu.Dropdown`) | default |
| `supporter.shell.notification.badge` | `NotificationBell` > `Badge` (`NotificationBell.tsx:46`) | Badge | `{unreadCount > 99 ? "99+" : unreadCount}` | — | hiển thị khi `unreadCount > 0` |
| `supporter.shell.notification.title` | `NotificationBell` > `Menu.Dropdown` > `Text` (`NotificationBell.tsx:54`) | Heading | Thông báo | — | default |
| `supporter.shell.notification.empty` | `NotificationBell` > `Menu.Dropdown` > `Text` (`NotificationBell.tsx:59`) | Empty state | Không có thông báo | — | hiển thị khi `items.length === 0` |
| `supporter.shell.notification.item.title` | `NotificationBell` > `ScrollArea` > `Text` (`NotificationBell.tsx:85`) | Item | `{n.title}` | Đánh dấu đã đọc và điều hướng tới `{n.link}` nếu có (`handleItemClick`) | default |
| `supporter.shell.notification.item.body` | `NotificationBell` > `ScrollArea` > `Text` (`NotificationBell.tsx:92`) | Item | `{n.body}` | — | hiển thị khi có `n.body` (lineClamp: 2) |
| `supporter.shell.notification.item.time` | `NotificationBell` > `ScrollArea` > `Text` (`NotificationBell.tsx:96`) | Item | `{dayjs(n.created_at).fromNow()}` | — | format thời gian tương đối tiếng Việt |
| `supporter.shell.notification.markAllRead` | `NotificationBell` > `Menu.Dropdown` > `button` (`NotificationBell.tsx:111`) | CTA | Đánh dấu tất cả đã đọc | Gọi `markAllRead.mutate()` | `disabled` khi `unreadCount === 0` |
| `supporter.shell.theme.toggle` | `ThemeToggler` > `ActionIcon` (`ThemeToggler.tsx:29`) | Aria-label | Toggle theme | Chuyển đổi giao diện sáng/tối (`setTheme(isDark ? "light" : "dark")`) | default |
| `supporter.shell.userMenu.target` | `UserMenu` > `Popover.Target` > `button` (`UserMenu.tsx:93`) | Aria-label | Tài khoản | Mở popover menu người dùng | default |
| `supporter.shell.userMenu.avatar.alt` | `UserMenu` > `Avatar` (`UserMenu.tsx:99`) | Alt text | `{user.name || "User"}` | — | default |
| `supporter.shell.userMenu.avatar.fallback` | `UserMenu` > `Avatar` (`UserMenu.tsx:104`) | Item | `{user.name?.substring(0, 2).toUpperCase() || "US"}` | — | fallback khi không có ảnh avatar |
| `supporter.shell.userMenu.email` | `UserMenu` > `Popover.Dropdown` > `p` (`UserMenu.tsx:113`) | Item | `{user.email || "—"}` | — | default |
| `supporter.shell.userMenu.home` | `UserMenu` > `Popover.Dropdown` > `button` (`UserMenu.tsx:69, 137`) | Navigation | Trang chủ | Điều hướng tới `/supporter` | default |
| `supporter.shell.userMenu.settings` | `UserMenu` > `Popover.Dropdown` > `button` (`UserMenu.tsx:74, 137`) | Navigation | Cài đặt | Điều hướng tới `/supporter/settings` (server redirect tới `/supporter/settings/profile`) | default |
| `supporter.shell.userMenu.signOut` | `UserMenu` > `Popover.Dropdown` > `button` (`UserMenu.tsx:147`) | CTA | Đăng xuất | Gọi `signOut()`, xóa cache và chuyển hướng về `/auth` | default |

---

### 2.2 Khung bố cục Cài đặt & Menu phân nhánh Supporter (`SupporterSettingsLayout`, `SettingsLayout`, `SettingsSidebar`, `settings-nav.ts`)

*Nguồn: `apps/web-1/app/supporter/settings/layout.tsx`, `apps/web-1/app/dashboard/settings/_components/SettingsLayout.tsx`, `SettingsSidebar.tsx`, `settings-nav.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.settings.layout.title` | `SettingsLayout` > `h1` (`SettingsLayout.tsx:14`) | Heading | Cài đặt | — | default |
| `supporter.settings.layout.description` | `SettingsLayout` > `p` (`SettingsLayout.tsx:15–17`) | Description | Quản lý thông tin cá nhân và bảo mật tài khoản | — | default |
| `supporter.settings.nav.profile` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–34`; `settings-nav.ts:10, 16–22`) | Navigation | Thông tin cơ bản | `/supporter/settings/profile` | active (`aria-current="page"`, class: `bg-surface-soft text-brand font-semibold`) |
| `supporter.settings.nav.password` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–34`; `settings-nav.ts:11, 16–22`) | Navigation | Đổi mật khẩu | `/supporter/settings/password` | default (`text-text-muted hover:text-text-app`) |
| `supporter.settings.nav.sessions` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–34`; `settings-nav.ts:12, 16–22`) | Navigation | Thiết bị & Phiên đăng nhập | `/supporter/settings/sessions` | default (`text-text-muted hover:text-text-app`) |

---

### 2.3 Trạng thái tải trang & lỗi dữ liệu (`SupporterLayout.tsx`, `page.tsx`)

*Nguồn: `apps/web-1/app/supporter/layout.tsx`, `apps/web-1/app/supporter/settings/profile/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.authGuard.loading` | `SupporterLayout` > `LoadingScreen` (`SupporterLayout.tsx:25`) | Description | Đang kiểm tra quyền Supporter... | — | `isPending` session branch tại SupporterLayout |
| `supporter.profile.loading` | `SupporterSettingsProfilePage` > `Loader2` (`page.tsx:13–15`) | Description | — | — | `isPending` session branch tại trang (spinner xoay `animate-spin text-brand`) |
| `supporter.profile.error` | `SupporterSettingsProfilePage` > `Text` (`page.tsx:23–25`) | Error | Không thể tải thông tin tài khoản. Vui lòng thử lại sau. | — | `!user` branch (khi session không có dữ liệu người dùng) |

---

### 2.4 Form thông tin cá nhân Supporter (`ProfileInfoForm.tsx`)

*Nguồn: `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.profile.avatar.fallback` | `ProfileInfoForm` > `Avatar` (`ProfileInfoForm.tsx:74–76`) | Item | `(user.name || "U").substring(0, 2).toUpperCase()` | — | fallback khi `user.image` rỗng hoặc không tải được |
| `supporter.profile.avatar.button` | `ProfileInfoForm` > `Button` (`ProfileInfoForm.tsx:77–85`) | CTA | Đổi ảnh | Mở hộp thoại chọn file trên thiết bị (`fileInputRef.current?.click()`) | `loading` & `disabled` khi `changeAvatar.isPending` |
| `supporter.profile.avatar.input` | `ProfileInfoForm` > `input[type="file"]` (`ProfileInfoForm.tsx:86–92`) | Item | — | Kích hoạt sự kiện `onChange` tải ảnh (`accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"`) | hidden (`hidden`) |
| `supporter.profile.name.label` | `ProfileInfoForm` > `TextInput` label (`ProfileInfoForm.tsx:106–114`) | Label | Tên hiển thị | — | default |
| `supporter.profile.name.placeholder` | `ProfileInfoForm` > `TextInput` placeholder (`ProfileInfoForm.tsx:108`) | Placeholder | Nhập tên hiển thị | Nhập chuỗi tên hiển thị của Supporter | default |
| `supporter.profile.name.error.required` | `ProfileInfoForm` > `form.Field` validator (`ProfileInfoForm.tsx:98–100, 112`) | Error | Tên hiển thị không được để trống. | — | hiển thị khi trường `name` bị blur hoặc thay đổi mà giá trị `trim()` rỗng |
| `supporter.profile.email.label` | `ProfileInfoForm` > `TextInput` label text (`ProfileInfoForm.tsx:120–123`) | Label | Email đăng nhập | — | default |
| `supporter.profile.email.tooltip` | `ProfileInfoForm` > `Tooltip` (`ProfileInfoForm.tsx:123–128`) | Helper | Email dùng để đăng nhập, không thể thay đổi. | Hiển thị khi hover/focus vào biểu tượng `Info` | default (tooltip hover) |
| `supporter.profile.email.input` | `ProfileInfoForm` > `TextInput` value (`ProfileInfoForm.tsx:135–137`) | Item | `user.email ?? ""` | — | disabled (`disabled`) |
| `supporter.profile.submit` | `ProfileInfoForm` > `Button[type="submit"]` (`ProfileInfoForm.tsx:140–142`) | CTA | Lưu thay đổi | Submit form và gọi `updateName.mutate(value.name.trim())` | `loading` khi `updateName.isPending` |

---

### 2.5 Khu vực Vùng nguy hiểm (`ProfileInfoForm.tsx`)

*Nguồn: `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx:147–168`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.profile.danger.title` | `ProfileInfoForm` > `Paper` > `Text` (`ProfileInfoForm.tsx:151–153`) | Heading | Vùng nguy hiểm | — | default (màu đỏ `c="red"`) |
| `supporter.profile.danger.description` | `ProfileInfoForm` > `Paper` > `Text` (`ProfileInfoForm.tsx:155–157`) | Description | Xóa tài khoản của bạn và toàn bộ thông tin cá nhân. Hành động này không thể hoàn tác. | — | default (`c="dimmed"`, size: `xs`) |
| `supporter.profile.danger.button` | `ProfileInfoForm` > `Paper` > `Button` (`ProfileInfoForm.tsx:158–166`) | CTA | Xóa tài khoản | Mở modal xác nhận `DeleteAccountModal` (`openDeleteModal`) | default (variant: `light`, color: `red`) |

---

### 2.6 Hộp thoại xác nhận xóa tài khoản vĩnh viễn (`DeleteAccountModal.tsx`)

*Nguồn: `apps/web-1/app/dashboard/settings/profile/_components/DeleteAccountModal.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.profile.deleteModal.title` | `DeleteAccountModal` > `Modal.title` > `Text` (`DeleteAccountModal.tsx:43–45`) | Heading | Xóa tài khoản vĩnh viễn | — | default (màu đỏ `c="red"`) |
| `supporter.profile.deleteModal.warning` | `DeleteAccountModal` > `Stack` > `Text` (`DeleteAccountModal.tsx:53–56`) | Description | Hành động này sẽ xóa vĩnh viễn tài khoản của bạn, hủy toàn bộ phiên làm việc trên các thiết bị và không thể hoàn tác. Dữ liệu tài khoản của bạn sẽ bị ẩn danh hóa. | — | default (chứa `<strong className="text-red-500">không thể hoàn tác</strong>`) |
| `supporter.profile.deleteModal.input.label` | `DeleteAccountModal` > `TextInput` label (`DeleteAccountModal.tsx:59`) | Label | Xác nhận thao tác | — | default |
| `supporter.profile.deleteModal.input.description` | `DeleteAccountModal` > `TextInput` description (`DeleteAccountModal.tsx:60–64`) | Helper | Vui lòng nhập XOA để xác nhận. | — | default (chứa `<strong className="text-red-500">XOA</strong>`) |
| `supporter.profile.deleteModal.input.placeholder` | `DeleteAccountModal` > `TextInput` placeholder (`DeleteAccountModal.tsx:65`) | Placeholder | XOA | Nhập văn bản xác nhận | `disabled` khi `loading` |
| `supporter.profile.deleteModal.cancel` | `DeleteAccountModal` > `Group` > `Button` (`DeleteAccountModal.tsx:74–76`) | CTA | Hủy bỏ | Đóng modal và reset nội dung nhập (`handleClose`) | `disabled` khi `loading` |
| `supporter.profile.deleteModal.confirm` | `DeleteAccountModal` > `Group` > `Button` (`DeleteAccountModal.tsx:77–85`) | CTA | Xác nhận xóa tài khoản | Thực hiện xóa tài khoản (`onConfirm` -> `deleteAccount.mutate()`) | `disabled` khi chuỗi nhập không phải `"XOA"` / `"XÓA"` hoặc đang `loading`; hiển thị spinner khi `loading` |

---

### 2.7 Thông báo Toast & Xử lý lỗi hệ thống (`useProfileMutations.ts` & `auth-errors.ts`)

*Nguồn: `apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts`, `apps/web-1/lib/auth-errors.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.profile.toast.updateName.success.title` | `notifications.show` (`useProfileMutations.ts:53`) | Toast | Thành công | — | toast title (màu xanh `color="green"`) |
| `supporter.profile.toast.updateName.success.message` | `notifications.show` (`useProfileMutations.ts:54`) | Toast | Đã cập nhật thông tin hồ sơ. | — | toast message khi cập nhật tên hiển thị thành công |
| `supporter.profile.toast.updateName.error.title` | `notifications.show` (`useProfileMutations.ts:59`) | Toast | Lỗi | — | toast title (màu đỏ `color="red"`) |
| `supporter.profile.toast.updateName.error.default` | `notifications.show` (`useProfileMutations.ts:60–63`) | Toast | Không thể cập nhật tên hiển thị. | — | fallback toast message khi cập nhật tên thất bại |
| `supporter.profile.avatar.validation.extension` | `validateAvatarFile` error (`useProfileMutations.ts:32`) | Error | Chỉ hỗ trợ ảnh .jpg, .jpeg, .png hoặc .webp | Bị chặn và ném Exception phía client trước khi gọi API | hiển thị trong toast lỗi khi chọn sai định dạng ảnh |
| `supporter.profile.avatar.validation.size` | `validateAvatarFile` error (`useProfileMutations.ts:35`) | Error | Dung lượng ảnh tối đa là 2MB | Bị chặn và ném Exception phía client trước khi gọi API | hiển thị trong toast lỗi khi file vượt quá 2MB |
| `supporter.profile.toast.avatar.success.title` | `notifications.show` (`useProfileMutations.ts:136`) | Toast | Thành công | — | toast title (màu xanh `color="green"`) |
| `supporter.profile.toast.avatar.success.message` | `notifications.show` (`useProfileMutations.ts:137`) | Toast | Đã cập nhật ảnh đại diện. | — | toast message khi upload avatar thành công |
| `supporter.profile.toast.avatar.error.title` | `notifications.show` (`useProfileMutations.ts:142`) | Toast | Lỗi | — | toast title (màu đỏ `color="red"`) |
| `supporter.profile.toast.avatar.error.default` | `notifications.show` (`useProfileMutations.ts:144`) | Toast | Không thể cập nhật ảnh đại diện. | — | fallback toast message khi upload avatar thất bại |
| `supporter.profile.toast.deleteAccount.success.title` | `notifications.show` (`useProfileMutations.ts:158`) | Toast | Thành công | — | toast title (màu xanh `color="green"`) |
| `supporter.profile.toast.deleteAccount.success.message` | `notifications.show` (`useProfileMutations.ts:159`) | Toast | Tài khoản của bạn đã được xóa vĩnh viễn. | — | toast message khi xóa tài khoản thành công |
| `supporter.profile.toast.deleteAccount.error.title` | `notifications.show` (`useProfileMutations.ts:171`) | Toast | Lỗi | — | toast title (màu đỏ `color="red"`) |
| `supporter.profile.toast.deleteAccount.error.default` | `notifications.show` (`useProfileMutations.ts:173`) | Toast | Không thể xóa tài khoản. Vui lòng thử lại sau. | — | fallback toast message khi xóa tài khoản thất bại |

---

## Layer 3: Page Notes

### 3.1 Biến thể thuật ngữ xuất hiện trên trang
- **Tên gọi của tab/trang:**
  - Trên thanh điều hướng `SettingsSidebar`: tab được đặt tên là `"Thông tin cơ bản"` (`settings-nav.ts:10`).
  - Tiêu đề chung của layout cài đặt: `"Cài đặt"` kèm mô tả `"Quản lý thông tin cá nhân và bảo mật tài khoản"` (`SettingsLayout.tsx:14–16`).
  - Trong thông báo toast sau khi lưu: ghi nhận là `"Đã cập nhật thông tin hồ sơ."` (`useProfileMutations.ts:54`).
  - Cần ghi nhận sự đa dạng giữa các cụm từ: `"Thông tin cơ bản"` (Sidebar link) vs `"thông tin cá nhân"` (Layout description) vs `"thông tin hồ sơ"` (Toast message).
- **Thuật ngữ vai trò Supporter:**
  - Trong màn hình loading của layout: `"Đang kiểm tra quyền Supporter..."` (`SupporterLayout.tsx:25`).
  - Trong thanh điều hướng `UserMenu`: không hiển thị huy hiệu hoặc nhãn vai trò riêng biệt, chỉ hiển thị email và avatar của Supporter.
- **Thuật ngữ xác nhận xóa tài khoản:**
  - Tiêu đề khối: `"Vùng nguy hiểm"` (`ProfileInfoForm.tsx:152`).
  - Tiêu đề hộp thoại: `"Xóa tài khoản vĩnh viễn"` (`DeleteAccountModal.tsx:44`).
  - Nút kích hoạt: `"Xóa tài khoản"` (`ProfileInfoForm.tsx:165`).
  - Nút xác nhận cuối: `"Xác nhận xóa tài khoản"` (`DeleteAccountModal.tsx:84`).
  - Từ khóa gõ xác nhận: Hướng dẫn văn bản hiển thị `"Vui lòng nhập XOA để xác nhận."` và placeholder là `"XOA"` (viết hoa không dấu), nhưng logic code xử lý chấp nhận cả `"XOA"` và `"XÓA"` (`DeleteAccountModal.tsx:23`).

### 3.2 Hiện trạng kỹ thuật quan sát được (Code Behavior)
- **Thực trạng trường dữ liệu Supporter (Chưa có chuyên môn / kinh nghiệm / liên hệ):** Trang `/supporter/settings/profile` hiện tại đang dùng chung 100% component `ProfileInfoForm.tsx` với trang sinh viên (`/dashboard/settings/profile`). Do đó, các trường chuyên biệt cho Supporter như "chuyên môn", "kinh nghiệm", "lĩnh vực hỗ trợ", "số điện thoại liên hệ" hoàn toàn chưa xuất hiện trong giao diện này.
- **Kiểm soát quyền truy cập chặt chẽ (Supporter Role Guard):** `SupporterLayout` kiểm tra quyền qua `useSession`. Nếu người dùng không có vai trò `supporter` (`(session.user as any).role !== "supporter"`), hệ thống lập tức chuyển hướng sang `/dashboard`. Nếu chưa đăng nhập chuyển hướng sang `/auth`.
- **Sự khác biệt về Sidebar Navigation giữa Supporter và Sinh viên:** `settings-nav.ts` chủ động loại trừ tab `/notifications` đối với bất kỳ đường dẫn nào có `basePath` bắt đầu bằng `"/supporter"`. Do đó Supporter chỉ có 3 tab cài đặt (`/profile`, `/password`, `/sessions`), không có tab `Cài đặt thông báo`.
- **Hành vi Navbar dành cho Supporter:** `UserMenu` tự động ẩn toàn bộ UI liên quan đến ví và số dư tiền (`walletBalance`, `Ví của tôi`) vì Supporter không thực hiện thanh toán hay nạp tiền trên hệ thống. Logo Nexus trỏ về `/supporter`.
- **Email bất biến (Read-only):** Trường `Email đăng nhập` bị vô hiệu hóa hoàn toàn (`disabled`), người dùng không thể chỉnh sửa trực tiếp. Tooltip giải thích rõ lý do là email dùng để đăng nhập hệ thống.
- **Xử lý upload ảnh đại diện:** File input được ẩn (`hidden`), kích hoạt qua ref từ nút `Đổi ảnh`. Kiểm tra đuôi file và kích thước (≤ 2MB) diễn ra đồng bộ tại client bằng hàm `validateAvatarFile(file)`. Nếu vi phạm, hàm lập tức ném Exception và toast lỗi màu đỏ hiển thị trước khi bất kỳ request mạng nào được gửi đi. Khi upload thành công qua `POST /profile/avatar`, hook tự động gọi `authClient.getSession()` và invalidate các query keys `session`, `user`, `profile` để đồng bộ ảnh đại diện trên thanh Navbar và toàn ứng dụng.
- **Xử lý cập nhật tên với TanStack Form v1:** Form sử dụng phương thức `updateName.mutate` (fire-and-forget pattern kèm per-call `onSuccess`) thay vì `mutateAsync` để tránh unhandled rejection từ TanStack Form v1 re-throw lỗi từ `onSubmit`. Lỗi đã được ủy quyền cho `onError` của hook kích hoạt toast thông báo.
- **Hành vi xóa tài khoản:** Khi người dùng xác nhận và `DELETE /profile/account` thành công:
  1. Hiển thị toast `"Tài khoản của bạn đã được xóa vĩnh viễn."`.
  2. Gọi `signOut()` để hủy session Better Auth.
  3. Xóa sạch dữ liệu bộ nhớ đệm client (`queryClient.clear()`).
  4. Điều hướng cưỡng bức về trang đăng nhập `/auth` thông qua `router.replace("/auth")`.
  5. Dữ liệu người dùng theo thông điệp cảnh báo trên UI sẽ được "ẩn danh hóa" (anonymized) và toàn bộ các phiên làm việc trên các thiết bị khác bị chấm dứt.

### 3.3 Điểm chưa xác minh (Unknowns / Questions)
- `[Assumption / Cần xác minh]` **Kế hoạch mở rộng hồ sơ Supporter (Chuyên môn & Kinh nghiệm):** Yêu cầu nghiệp vụ và tài liệu có nhắc tới các thông tin như "chuyên môn, kinh nghiệm, thông tin liên hệ" cho Supporter (giúp sinh viên và admin biết năng lực của supporter khi phân công case). Cần xác minh với Product Owner xem liệu có kế hoạch tách riêng một `SupporterProfileForm` với các trường chuyên môn/kinh nghiệm/bio trong phiên bản tiếp theo hay không.
- `[Assumption / Cần xác minh]` **Ẩn danh hóa và hồ sơ phân công khi Supporter xóa tài khoản:** Khi một Supporter đã được phân công các case (`assigned_supporter_auth_user_id`) hoặc đã xuất các báo cáo phản biện (`reports`), nếu họ thực hiện xóa tài khoản thì hệ thống xử lý các case đang trong tiến trình đánh giá ra sao (chuyển trạng thái case về unassigned, thông báo cho admin hay giữ nguyên lịch sử)?
- `[Assumption / Cần xác minh]` **Lý do ẩn tab Cài đặt thông báo đối với Supporter:** Mã nguồn `settings-nav.ts` đang chủ động loại trừ tab `Cài đặt thông báo` cho Supporter. Cần xác minh xem đây là quyết định thiết kế có chủ đích hay Supporter sẽ được bổ sung kênh nhận thông báo (email thông báo khi có case mới được phân công) ở giai đoạn sau.
