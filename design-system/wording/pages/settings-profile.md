# Page: Settings Profile (Cài đặt thông tin cá nhân)

## Layer 1: Page Context

- **Route:** `/dashboard/settings/profile`
- **Access:** `Authenticated` (Yêu cầu phiên đăng nhập sinh viên/người dùng). `DashboardLayout` kiểm tra phiên đăng nhập qua `useSession`: nếu đang tải hiển thị `Đang xác thực thông tin...`, nếu chưa đăng nhập tự động điều hướng sang `/auth`, nếu người dùng có role là `admin` hoặc `supporter` sẽ tự động chuyển hướng sang `/admin` hoặc `/supporter` (`apps/web-1/app/dashboard/layout.tsx:14–47`).
- **User:**
  - **Primary user:** Người dùng (sinh viên) đã đăng nhập vào Nexus Platform truy cập khu vực cài đặt tài khoản cá nhân.
  - **Typical state:** Người dùng muốn xem lại thông tin cá nhân, cập nhật tên hiển thị, thay đổi ảnh đại diện hoặc thực hiện tác vụ xóa tài khoản vĩnh viễn.
  - **Knowledge level:** Đã có tài khoản Nexus Platform; hiểu rằng email đăng nhập gắn liền với danh tính hệ thống và không thể tùy ý thay đổi trực tiếp.
- **User goals:**
  - Cập nhật ảnh đại diện (avatar) từ thiết bị (.jpg, .jpeg, .png, .webp với dung lượng tối đa 2MB).
  - Thay đổi tên hiển thị (display name) dùng trong toàn bộ giao diện dashboard và quy trình phản biện.
  - Xem và đối soát địa chỉ email đăng nhập của tài khoản hiện tại.
  - Xóa tài khoản vĩnh viễn và ẩn danh hóa toàn bộ thông tin cá nhân khi không còn nhu cầu sử dụng dịch vụ.
- **Business / Product goals:**
  - Cung cấp tính năng tự quản lý hồ sơ cơ bản (Self-service profile management) giúp người dùng cá nhân hóa trải nghiệm.
  - Đảm bảo tính toàn vẹn và bảo mật của tài khoản bằng cách khóa trường email đăng nhập (ngăn chặn hành vi chiếm dụng hoặc đổi email không qua quy trình xác minh).
  - Tuân thủ quyền riêng tư và quyền được xóa dữ liệu cá nhân (Right to be forgotten / GDPR compliance) thông qua khu vực Vùng nguy hiểm (Danger Zone) với cơ chế xác nhận 2 bước chống bấm nhầm.
- **Primary action:**
  - Nhập tên hiển thị mới và bấm `Lưu thay đổi` (`ProfileInfoForm.tsx:140–142`).
  - Hoặc bấm `Đổi ảnh` để tải lên ảnh đại diện mới (`ProfileInfoForm.tsx:77–85`).
- **Secondary actions:**
  - Điều hướng sang các tab cài đặt khác qua sidebar: `Đổi mật khẩu` (`/dashboard/settings/password`), `Thiết bị & Phiên đăng nhập` (`/dashboard/settings/sessions`), `Cài đặt thông báo` (`/dashboard/settings/notifications`) (`SettingsSidebar.tsx:16–35`; `settings-nav.ts:9–14`).
  - Mở modal xóa tài khoản qua nút `Xóa tài khoản` trong Vùng nguy hiểm (`ProfileInfoForm.tsx:158–166`).
  - Điều hướng về trang chủ (`/dashboard`), ví (`/dashboard/wallet`) hoặc đăng xuất (`/auth`) qua Navbar `DashboardShell` (`DashboardShell.tsx:42–54`; `UserMenu.tsx:68–148`).
- **Entry:**
  - Click vào menu người dùng (UserMenu) trên Navbar > chọn `Cài đặt` (`UserMenu.tsx:73–75`), chuyển hướng tới `/dashboard/settings`, sau đó server redirect tới `/dashboard/settings/profile` (`apps/web-1/app/dashboard/settings/page.tsx:4`).
  - Truy cập URL cũ `/dashboard/profile` > server redirect tới `/dashboard/settings/profile` (`apps/web-1/app/dashboard/profile/page.tsx:4`).
  - Truy cập trực tiếp qua liên kết `/dashboard/settings/profile`.
  - Chuyển tab từ các trang cài đặt khác qua `SettingsSidebar` (`/dashboard/settings/password`, `/dashboard/settings/sessions`, `/dashboard/settings/notifications`).
- **Exit / next step:**
  - Cập nhật tên thành công: Ở lại trang, hiển thị toast thông báo thành công và làm mới dữ liệu session (`ProfileInfoForm.tsx:35–40`).
  - Đổi ảnh đại diện thành công: Ở lại trang, cập nhật avatar trên trang và toàn bộ hệ thống (`useProfileMutations.ts:130–140`).
  - Xóa tài khoản thành công: Đăng xuất tài khoản, xóa toàn bộ bộ nhớ đệm truy vấn (`queryClient.clear()`), điều hướng về trang đăng nhập `/auth` (`useProfileMutations.ts:156–169`).
  - Chuyển trang khác: Người dùng click vào các liên kết trên sidebar hoặc navbar.
- **Product facts / constraints:**
  - **Giới hạn tệp ảnh đại diện:** Hệ thống chỉ chấp nhận các định dạng `.jpg`, `.jpeg`, `.png`, `.webp` và dung lượng tối đa `2MB` (`MAX_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024`). Nếu tệp không hợp lệ, hệ thống chặn ngay tại phía client và quăng lỗi thông báo trước khi gửi request (`useProfileMutations.ts:10–37, 120`).
  - **Email đăng nhập bị vô hiệu hóa:** Input email có thuộc tính `disabled`, kèm icon `Info` và tooltip giải thích: `"Email dùng để đăng nhập, không thể thay đổi."` (`ProfileInfoForm.tsx:119–138`).
  - **Phạm vi trường dữ liệu thực tế:** Trong mã nguồn hiện tại, form thông tin cá nhân chỉ quản lý 3 trường: `Ảnh đại diện`, `Tên hiển thị` và `Email đăng nhập`. Hoàn toàn **không có** trường `trường học` hay `số điện thoại` trong trang cài đặt cá nhân này (`ProfileInfoForm.tsx:72–144`).
  - **Validation tên hiển thị:** Sử dụng TanStack Form v1. Trường `name` không được để khoảng trắng rỗng (`!value.trim()`), nếu vi phạm sẽ hiển thị thông báo lỗi: `"Tên hiển thị không được để trống."` (`ProfileInfoForm.tsx:98–100`).
  - **Quy tắc xác nhận xóa tài khoản:** Modal yêu cầu người dùng nhập từ khóa xác nhận. Hệ thống kiểm tra điều kiện `["XOA", "XÓA"].includes(confirmText.trim().toUpperCase())` nhằm hỗ trợ cả gõ không dấu và có dấu, tránh xung đột với các bộ gõ tiếng Việt Unikey/EVKey (`DeleteAccountModal.tsx:22–24`).
  - **Trạng thái nút xóa tài khoản:** Nút `Xác nhận xóa tài khoản` trong modal bị `disabled` cho đến khi người dùng nhập chính xác chuỗi ký tự `"XOA"` hoặc `"XÓA"` (`DeleteAccountModal.tsx:81`).

---

## Layer 2: Interactive Inventory

### 2.1 Khung bao Cài đặt & Thanh điều hướng (`SettingsLayout`, `SettingsSidebar`, `DashboardShell`)

*Nguồn: `apps/web-1/app/dashboard/settings/_components/SettingsLayout.tsx`, `SettingsSidebar.tsx`, `settings-nav.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.layout.title` | `SettingsLayout` > `h1` (`SettingsLayout.tsx:14`) | Heading | Cài đặt | — | default |
| `settings.layout.description` | `SettingsLayout` > `p` (`SettingsLayout.tsx:15–17`) | Description | Quản lý thông tin cá nhân và bảo mật tài khoản | — | default |
| `settings.nav.profile` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–34`; `settings-nav.ts:10`) | Navigation | Thông tin cơ bản | `/dashboard/settings/profile` | active (`aria-current="page"`, class: `bg-surface-soft text-brand font-semibold`) |
| `settings.nav.password` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–34`; `settings-nav.ts:11`) | Navigation | Đổi mật khẩu | `/dashboard/settings/password` | default (`text-text-muted hover:text-text-app`) |
| `settings.nav.sessions` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–34`; `settings-nav.ts:12`) | Navigation | Thiết bị & Phiên đăng nhập | `/dashboard/settings/sessions` | default (`text-text-muted hover:text-text-app`) |
| `settings.nav.notifications` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–34`; `settings-nav.ts:13`) | Navigation | Cài đặt thông báo | `/dashboard/settings/notifications` | default (`text-text-muted hover:text-text-app`) |

---

### 2.2 Trạng thái tải trang & lỗi dữ liệu (`page.tsx`)

*Nguồn: `apps/web-1/app/dashboard/settings/profile/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.profile.loading` | `SettingsProfilePage` > `Loader2` (`page.tsx:11–16`) | Description | — | — | `isPending` session branch (spinner xoay `animate-spin`) |
| `settings.profile.error` | `SettingsProfilePage` > `Text` (`page.tsx:21–27`) | Error | Không thể tải thông tin tài khoản. Vui lòng thử lại sau. | — | `!user` branch (khi session không có dữ liệu người dùng) |

---

### 2.3 Form thông tin cá nhân (`ProfileInfoForm.tsx`)

*Nguồn: `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.profile.avatar.fallback` | `ProfileInfoForm` > `Avatar` (`ProfileInfoForm.tsx:74–76`) | Item | `(user.name || "U").substring(0, 2).toUpperCase()` | — | fallback khi `user.image` rỗng hoặc không tải được |
| `settings.profile.avatar.button` | `ProfileInfoForm` > `Button` (`ProfileInfoForm.tsx:77–85`) | CTA | Đổi ảnh | Mở hộp thoại chọn file trên thiết bị (`fileInputRef.current?.click()`) | `loading` & `disabled` khi `changeAvatar.isPending` |
| `settings.profile.avatar.input` | `ProfileInfoForm` > `input[type="file"]` (`ProfileInfoForm.tsx:86–92`) | Item | — | Kích hoạt sự kiện `onChange` tải ảnh (`accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"`) | hidden (`hidden`) |
| `settings.profile.name.label` | `ProfileInfoForm` > `TextInput` label (`ProfileInfoForm.tsx:106–114`) | Label | Tên hiển thị | — | default |
| `settings.profile.name.placeholder` | `ProfileInfoForm` > `TextInput` placeholder (`ProfileInfoForm.tsx:108`) | Placeholder | Nhập tên hiển thị | Nhập chuỗi tên hiển thị của người dùng | default |
| `settings.profile.name.error.required` | `ProfileInfoForm` > `form.Field` validator (`ProfileInfoForm.tsx:98–100, 112`) | Error | Tên hiển thị không được để trống. | — | hiển thị khi trường `name` bị blur/thay đổi mà giá trị trim() rỗng |
| `settings.profile.email.label` | `ProfileInfoForm` > `TextInput` label text (`ProfileInfoForm.tsx:120–123`) | Label | Email đăng nhập | — | default |
| `settings.profile.email.tooltip` | `ProfileInfoForm` > `Tooltip` (`ProfileInfoForm.tsx:123–128`) | Helper | Email dùng để đăng nhập, không thể thay đổi. | Hiển thị khi hover/focus vào biểu tượng `Info` | default (tooltip hover) |
| `settings.profile.email.input` | `ProfileInfoForm` > `TextInput` value (`ProfileInfoForm.tsx:135–137`) | Item | `user.email ?? ""` | — | disabled (`disabled`) |
| `settings.profile.submit` | `ProfileInfoForm` > `Button[type="submit"]` (`ProfileInfoForm.tsx:140–142`) | CTA | Lưu thay đổi | Submit form và gọi `updateName.mutate(value.name.trim())` | `loading` khi `updateName.isPending` |

---

### 2.4 Khu vực Vùng nguy hiểm (`ProfileInfoForm.tsx`)

*Nguồn: `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx:147–168`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.profile.danger.title` | `ProfileInfoForm` > `Paper` > `Text` (`ProfileInfoForm.tsx:151–153`) | Heading | Vùng nguy hiểm | — | default (màu đỏ `c="red"`) |
| `settings.profile.danger.description` | `ProfileInfoForm` > `Paper` > `Text` (`ProfileInfoForm.tsx:155–157`) | Description | Xóa tài khoản của bạn và toàn bộ thông tin cá nhân. Hành động này không thể hoàn tác. | — | default (`c="dimmed"`, size: `xs`) |
| `settings.profile.danger.button` | `ProfileInfoForm` > `Paper` > `Button` (`ProfileInfoForm.tsx:158–166`) | CTA | Xóa tài khoản | Mở modal xác nhận `DeleteAccountModal` (`openDeleteModal`) | default (variant: `light`, color: `red`) |

---

### 2.5 Modal xác nhận xóa tài khoản vĩnh viễn (`DeleteAccountModal.tsx`)

*Nguồn: `apps/web-1/app/dashboard/settings/profile/_components/DeleteAccountModal.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.profile.deleteModal.title` | `DeleteAccountModal` > `Modal.title` > `Text` (`DeleteAccountModal.tsx:43–45`) | Heading | Xóa tài khoản vĩnh viễn | — | default (màu đỏ `c="red"`) |
| `settings.profile.deleteModal.warning` | `DeleteAccountModal` > `Stack` > `Text` (`DeleteAccountModal.tsx:53–56`) | Description | Hành động này sẽ xóa vĩnh viễn tài khoản của bạn, hủy toàn bộ phiên làm việc trên các thiết bị và không thể hoàn tác. Dữ liệu tài khoản của bạn sẽ bị ẩn danh hóa. | — | default (chứa `strong.text-red-500` cho cụm "không thể hoàn tác") |
| `settings.profile.deleteModal.input.label` | `DeleteAccountModal` > `TextInput` label (`DeleteAccountModal.tsx:59`) | Label | Xác nhận thao tác | — | default |
| `settings.profile.deleteModal.input.description` | `DeleteAccountModal` > `TextInput` description (`DeleteAccountModal.tsx:60–64`) | Helper | Vui lòng nhập XOA để xác nhận. | — | default (chứa `strong.text-red-500` cho chữ "XOA") |
| `settings.profile.deleteModal.input.placeholder` | `DeleteAccountModal` > `TextInput` placeholder (`DeleteAccountModal.tsx:65`) | Placeholder | XOA | Nhập văn bản xác nhận | `disabled` khi `loading` |
| `settings.profile.deleteModal.cancel` | `DeleteAccountModal` > `Group` > `Button` (`DeleteAccountModal.tsx:74–76`) | CTA | Hủy bỏ | Đóng modal và reset nội dung nhập (`handleClose`) | `disabled` khi `loading` |
| `settings.profile.deleteModal.confirm` | `DeleteAccountModal` > `Group` > `Button` (`DeleteAccountModal.tsx:77–85`) | CTA | Xác nhận xóa tài khoản | Thực hiện xóa tài khoản (`onConfirm` -> `deleteAccount.mutate()`) | `disabled` khi chuỗi nhập không phải `"XOA"` / `"XÓA"` hoặc đang `loading`; hiển thị spinner khi `loading` |

---

### 2.6 Thông báo Toast & Lỗi phản hồi (`useProfileMutations.ts` & `auth-errors.ts`)

*Nguồn: `apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts`, `apps/web-1/lib/auth-errors.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.profile.toast.updateName.success.title` | `notifications.show` (`useProfileMutations.ts:53`) | Toast | Thành công | — | toast title (màu xanh `color="green"`) |
| `settings.profile.toast.updateName.success.message` | `notifications.show` (`useProfileMutations.ts:54`) | Toast | Đã cập nhật thông tin hồ sơ. | — | toast message khi cập nhật tên hiển thị thành công |
| `settings.profile.toast.updateName.error.title` | `notifications.show` (`useProfileMutations.ts:59`) | Toast | Lỗi | — | toast title (màu đỏ `color="red"`) |
| `settings.profile.toast.updateName.error.default` | `notifications.show` (`useProfileMutations.ts:60–63`) | Toast | Không thể cập nhật tên hiển thị. | — | fallback toast message khi cập nhật tên thất bại |
| `settings.profile.avatar.validation.extension` | `validateAvatarFile` error (`useProfileMutations.ts:32`) | Error | Chỉ hỗ trợ ảnh .jpg, .jpeg, .png hoặc .webp | Bị chặn và ném Exception phía client trước khi gọi API | hiển thị trong toast lỗi khi chọn sai định dạng ảnh |
| `settings.profile.avatar.validation.size` | `validateAvatarFile` error (`useProfileMutations.ts:35`) | Error | Dung lượng ảnh tối đa là 2MB | Bị chặn và ném Exception phía client trước khi gọi API | hiển thị trong toast lỗi khi file vượt quá 2MB |
| `settings.profile.toast.avatar.success.title` | `notifications.show` (`useProfileMutations.ts:136`) | Toast | Thành công | — | toast title (màu xanh `color="green"`) |
| `settings.profile.toast.avatar.success.message` | `notifications.show` (`useProfileMutations.ts:137`) | Toast | Đã cập nhật ảnh đại diện. | — | toast message khi upload avatar thành công |
| `settings.profile.toast.avatar.error.title` | `notifications.show` (`useProfileMutations.ts:142`) | Toast | Lỗi | — | toast title (màu đỏ `color="red"`) |
| `settings.profile.toast.avatar.error.default` | `notifications.show` (`useProfileMutations.ts:144`) | Toast | Không thể cập nhật ảnh đại diện. | — | fallback toast message khi upload avatar thất bại |
| `settings.profile.toast.deleteAccount.success.title` | `notifications.show` (`useProfileMutations.ts:158`) | Toast | Thành công | — | toast title (màu xanh `color="green"`) |
| `settings.profile.toast.deleteAccount.success.message` | `notifications.show` (`useProfileMutations.ts:159`) | Toast | Tài khoản của bạn đã được xóa vĩnh viễn. | — | toast message khi xóa tài khoản thành công |
| `settings.profile.toast.deleteAccount.error.title` | `notifications.show` (`useProfileMutations.ts:171`) | Toast | Lỗi | — | toast title (màu đỏ `color="red"`) |
| `settings.profile.toast.deleteAccount.error.default` | `notifications.show` (`useProfileMutations.ts:173`) | Toast | Không thể xóa tài khoản. Vui lòng thử lại sau. | — | fallback toast message khi xóa tài khoản thất bại |

---

## Layer 3: Page Notes

### 3.1 Biến thể thuật ngữ xuất hiện trên trang
- **Tên gọi của tab/trang:**
  - Trên thanh điều hướng `SettingsSidebar`: tab được đặt tên là `"Thông tin cơ bản"` (`settings-nav.ts:10`).
  - Tiêu đề chung của layout cài đặt: `"Cài đặt"` kèm mô tả `"Quản lý thông tin cá nhân và bảo mật tài khoản"` (`SettingsLayout.tsx:14–16`).
  - Trong thông báo toast sau khi lưu: ghi nhận là `"Đã cập nhật thông tin hồ sơ."` (`useProfileMutations.ts:54`).
  - Cần ghi nhận sự đa dạng giữa các cụm từ: `"Thông tin cơ bản"` (Sidebar link) vs `"thông tin cá nhân"` (Layout description) vs `"thông tin hồ sơ"` (Toast message).
- **Thuật ngữ xác nhận xóa tài khoản:**
  - Tiêu đề khối: `"Vùng nguy hiểm"` (`ProfileInfoForm.tsx:152`).
  - Tiêu đề hộp thoại: `"Xóa tài khoản vĩnh viễn"` (`DeleteAccountModal.tsx:44`).
  - Nút kích hoạt: `"Xóa tài khoản"` (`ProfileInfoForm.tsx:165`).
  - Nút xác nhận cuối: `"Xác nhận xóa tài khoản"` (`DeleteAccountModal.tsx:84`).
  - Từ khóa gõ xác nhận: Hướng dẫn văn bản hiển thị `"Vui lòng nhập XOA để xác nhận."` và placeholder là `"XOA"` (viết hoa không dấu), nhưng logic code xử lý chấp nhận cả `"XOA"` và `"XÓA"` (`DeleteAccountModal.tsx:23`).

### 3.2 Hiện trạng kỹ thuật quan sát được (Code Behavior)
- **Không có trường "Trường học" hay "Số điện thoại":** Trong mã nguồn hiện tại của `ProfileInfoForm.tsx`, giao diện chỉ có trường `Tên hiển thị` và `Email đăng nhập`. Các trường thông tin về học thuật (trường đại học) hoặc liên hệ (số điện thoại) hoàn toàn không xuất hiện ở trang cài đặt tài khoản cá nhân (các trường này được lưu trữ trong luồng nộp hồ sơ bài thi / intake của nhóm hoặc không thuộc đối tượng quản lý profile cá nhân).
- **Email bất biến (Read-only):** Trường `Email đăng nhập` bị disable hoàn toàn (`disabled`), người dùng không thể chỉnh sửa trực tiếp. Tooltip giải thích rõ lý do là email dùng để đăng nhập hệ thống.
- **Xử lý upload ảnh đại diện:**
  - File input được ẩn (`hidden`), kích hoạt qua ref từ nút `Đổi ảnh`.
  - Kiểm tra đuôi file và kích thước (≤ 2MB) diễn ra đồng bộ tại client bằng hàm `validateAvatarFile(file)`. Nếu vi phạm, hàm lập tức ném Exception và toast lỗi màu đỏ hiển thị trước khi bất kỳ request mạng nào được gửi đi.
  - Khi upload thành công qua `POST /profile/avatar`, hook tự động gọi `authClient.getSession()` và invalidate các query keys `session`, `user`, `profile` để đồng bộ ảnh đại diện trên thanh Navbar và toàn ứng dụng.
- **Xử lý cập nhật tên với TanStack Form v1:** Form sử dụng phương thức `updateName.mutate` (fire-and-forget pattern kèm per-call `onSuccess`) thay vì `mutateAsync` để tránh unhandled rejection từ TanStack Form v1 re-throw lỗi từ `onSubmit`. Lỗi đã được ủy quyền cho `onError` của hook kích hoạt toast thông báo.
- **Hành vi xóa tài khoản:** Khi người dùng xác nhận và `DELETE /profile/account` thành công:
  1. Hiển thị toast `"Tài khoản của bạn đã được xóa vĩnh viễn."`.
  2. Gọi `signOut()` để hủy session Better Auth.
  3. Xóa sạch dữ liệu bộ nhớ đệm client (`queryClient.clear()`).
  4. Điều hướng cưỡng bức về trang đăng nhập `/auth` thông qua `router.replace("/auth")`.
  5. Dữ liệu người dùng theo thông điệp cảnh báo trên UI sẽ được "ẩn danh hóa" (anonymized) và toàn bộ các phiên làm việc trên các thiết bị khác bị chấm dứt.

### 3.3 Điểm chưa xác minh (Unknowns / Questions)
- `[Assumption / Cần xác minh]` **Cơ chế ẩn danh hóa dữ liệu (Anonymization logic):** Khi xóa tài khoản, các hồ sơ phản biện (`cases`), báo cáo (`reports`), và lịch sử nạp/rút/thanh toán (`transactions`, `wallet`) liên quan đến tài khoản sinh viên này được xử lý ra sao trong cơ sở dữ liệu (xóa mềm `soft delete`, gán `userId = null` hay giữ nguyên bản ghi lịch sử giao dịch để đối soát)?
- `[Assumption / Cần xác minh]` **Kế hoạch cho phép đổi email đăng nhập:** Liệu hệ thống có dự định mở tính năng cho phép người dùng thay đổi email đăng nhập (với quy trình xác thực OTP gửi về email mới) trong tương lai hay không?
- `[Assumption / Cần xác minh]` **Bổ sung thông tin cá nhân mở rộng:** Trong tài liệu mô tả yêu cầu có nhắc tới "trường học, số điện thoại", nhưng mã nguồn hiện tại không có. Cần xác minh với Product Owner xem liệu các trường này có dự định được đưa vào `ProfileInfoForm` ở phiên bản tiếp theo, hay được quản lý riêng theo từng nhóm khởi nghiệp/hồ sơ bài nộp.
