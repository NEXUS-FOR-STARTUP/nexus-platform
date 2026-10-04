# Page: Cài đặt thông báo (Notification Settings)

## Layer 1: Page Context

- **Route:** `/dashboard/settings/notifications`
- **Access:** `Authenticated (Student)`
  - Được bảo vệ bởi route guard tại `DashboardLayout` (`apps/web-1/app/dashboard/layout.tsx:14–47`). Nếu chưa đăng nhập (`!session`), chuyển hướng sang `/auth`. Nếu có role `admin` hoặc `supporter`, bị chặn render và chuyển hướng sang `/admin` hoặc `/supporter`.
  - Component trang `SettingsNotificationsPage` (`apps/web-1/app/dashboard/settings/notifications/page.tsx:8–28`) kiểm tra thêm session client-side: hiển thị spinner loading khi session đang nạp (`isPending`) và thông báo lỗi nếu không tìm thấy dữ liệu tài khoản (`!sessionData?.user`).
  - Giao diện được bọc bởi `DashboardShell` (`apps/web-1/components/layout/DashboardShell.tsx`) và `SettingsLayout` (`apps/web-1/app/dashboard/settings/_components/SettingsLayout.tsx`).
  - Menu bên `SettingsSidebar` chỉ hiển thị mục "Cài đặt thông báo" cho dashboard sinh viên; route này bị ẩn đối với supporter theo logic `!(basePath.startsWith("/supporter") && item.href === "/notifications")` (`apps/web-1/app/dashboard/settings/_components/settings-nav.ts:17–19`).
- **User:**
  - **Primary user:** Sinh viên (Student) đã đăng nhập vào hệ thống Nexus Platform.
  - **Typical state:** Đang cấu hình tài khoản cá nhân, muốn điều chỉnh phương thức nhận thông báo về tiến độ phản biện hồ sơ hoặc biến động thanh toán/ví.
  - **Knowledge level:** `[Assumption / Cần xác minh]` Người dùng đã đăng ký tài khoản bằng email và biết email này được dùng để nhận các cập nhật quan trọng từ hệ thống.
- **User goals:**
  - Kiểm tra trạng thái nhận thông báo hiện tại của tài khoản.
  - Bật hoặc tắt tính năng nhận thông báo qua email đã đăng ký.
- **Business / Product goals:**
  - Cung cấp cho sinh viên quyền kiểm soát kênh thông báo qua email nhằm tránh làm phiền (opt-out), đồng thời tuân thủ quy định quản lý hạn ngạch email gửi đi (Resend free tier 100 emails/ngày theo ghi chú kỹ thuật tại `apps/api/src/modules/notifications/application/recipients.ts:138`).
  - Đảm bảo các thông báo in-app trong web dashboard luôn hoạt động để sinh viên không bỏ lỡ trạng thái hồ sơ phản biện.
- **Primary action:**
  - Bật / tắt toggle switch "Nhận email" (`NotificationPreferencesForm.tsx:43–64`).
- **Secondary actions:**
  - Điều hướng sang các tab cài đặt khác thông qua `SettingsSidebar`: "Thông tin cơ bản" (`/dashboard/settings/profile`), "Đổi mật khẩu" (`/dashboard/settings/password`), "Thiết bị & Phiên đăng nhập" (`/dashboard/settings/sessions`).
  - Tương tác với thanh điều hướng `DashboardShell`: mở chuông thông báo (`NotificationBell`), đổi giao diện sáng/tối (`ThemeToggler`), mở menu tài khoản (`UserMenu`), chuyển về trang chủ (`/dashboard`) hoặc ví cá nhân (`/dashboard/wallet`), đăng xuất.
- **Entry:**
  - Nhấp vào mục "Cài đặt" trong menu người dùng `UserMenu` (`apps/web-1/components/layout/_components/UserMenu.tsx:73–75`), được chuyển hướng từ `/dashboard/settings` sang `/dashboard/settings/profile`, sau đó nhấp vào tab "Cài đặt thông báo" trên thanh sidebar `SettingsSidebar`.
  - Nhấp trực tiếp vào liên kết `/dashboard/settings/notifications`.
- **Exit / next step:**
  - Sau khi bật/tắt switch, thay đổi được lưu tự động xuống cơ sở dữ liệu qua API `PUT /api/notifications/preferences`.
  - Chuyển sang các mục cài đặt khác trong sidebar (`/dashboard/settings/profile`, `/dashboard/settings/password`, `/dashboard/settings/sessions`).
  - Quay lại trang tổng quan `/dashboard` hoặc các luồng làm việc khác qua thanh điều hướng chính.
- **Product facts / constraints (Xác minh từ mã nguồn):**
  - **Cơ chế lưu:** Không có nút "Lưu thay đổi" (Save Button) riêng biệt trên UI. Thao tác bật/tắt `Switch` sẽ kích hoạt sự kiện `onChange` và tự động gửi mutation API `PUT /api/notifications/preferences` (`apps/web-1/app/dashboard/settings/notifications/_components/NotificationPreferencesForm.tsx:49–63`). Nếu lưu thất bại, switch sẽ tự động hoàn tác về trạng thái trước đó và hiển thị Toast thông báo lỗi (`useNotificationPreferences.ts:30–36`).
  - **Số lượng tùy chọn thực tế:** Giao diện chỉ có duy nhất 1 toggle switch là `email_enabled` ("Nhận email") (`NotificationPreferencesForm.tsx:43–64`). Không có các switch phân loại theo từng nhóm sự kiện (như báo cáo mới, cập nhật hồ sơ, giao dịch ví, thông báo hệ thống) trên UI.
  - **Phạm vi kênh thông báo (Notification Channels):**
    - Kênh `email`: Chịu sự chi phối của switch `email_enabled` (`apps/api/src/modules/notifications/application/preference-policy.ts:19`).
    - Kênh `in_app` (thông báo hiển thị trên web dashboard qua `NotificationBell`): Luôn bật (`always true`), không thể tắt và không có switch cấu hình trên UI (`preference-policy.ts:18`).
    - Kênh `telegram`: Luôn bật (`always true`), chỉ áp dụng nội bộ cho supporter và admin (`preference-policy.ts:17`; `recipients.ts:148–156`).
  - **Cấu trúc dữ liệu API:**
    - Schema Zod `NotificationPreferenceSchema` chỉ định nghĩa đúng 1 trường boolean: `email_enabled: z.boolean()` (`packages/validation/src/index.ts:478–481`).
    - Giá trị mặc định khi người dùng chưa có bản ghi preferences trong DB là `{ email_enabled: true }` (`packages/validation/src/index.ts:474`; `apps/api/src/modules/notifications/application/notification-preferences.usecase.ts:23`).
  - **Các sự kiện gửi email cho sinh viên khi `email_enabled: true`:**
    - `case.assigned` (Hồ sơ được phân công)
    - `case.approved` (Hồ sơ được duyệt)
    - `case.rejected` (Hồ sơ bị từ chối)
    - `payment.verified` (Thanh toán được duyệt thủ công; nếu tự động qua SePay thì chỉ gửi `in_app`)
    - `payment.rejected` (Thanh toán bị từ chối)
    - `report.published` (Báo cáo phản biện sẵn sàng)
    - `case.request_more_info` (Yêu cầu bổ sung tài liệu)
    *(Nguồn: `apps/api/src/modules/notifications/application/recipients.ts:38–46, 142–146`)*.

---

## Layer 2: Interactive Inventory

### 2.1 Route guard, shared dashboard shell & navigation

*Nguồn: `apps/web-1/app/dashboard/layout.tsx`, `apps/web-1/components/layout/DashboardShell.tsx`, `apps/web-1/components/layout/NotificationBell.tsx`, `apps/web-1/components/layout/ui/ThemeToggler.tsx`, `apps/web-1/components/layout/_components/UserMenu.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `notifications.guard.loading` | `DashboardLayout` > `LoadingScreen` (`layout.tsx:32–34`) | Description | Đang xác thực thông tin... | — | `isPending` session branch |
| `notifications.shell.logo.alt` | `DashboardShell` > `nav` > `Link` > `Logo` > `<img>` (`DashboardShell.tsx:44–46`) | Alt text | Nexus Logo | `/dashboard` | default; SVG hiển thị theo theme sáng/tối |
| `notifications.shell.bell.trigger` | `DashboardShell` > `NotificationBell` > `ActionIcon` (`NotificationBell.tsx:27–50`) | Aria-label | Thông báo | Mở / đóng dropdown danh sách thông báo | default |
| `notifications.shell.bell.unreadCount` | `NotificationBell` > bell `Badge` (`NotificationBell.tsx:39–48`) | Badge | `<code>{unreadCount}</code>` hoặc `99+` | — | Hiển thị khi `unreadCount > 0`; hiển thị `99+` khi số lượng lớn hơn 99 |
| `notifications.shell.bell.dropdownTitle` | `NotificationBell` > `Menu.Dropdown` header (`NotificationBell.tsx:52–55`) | Heading | Thông báo | — | Dropdown đang mở |
| `notifications.shell.bell.empty` | `NotificationBell` > empty menu body (`NotificationBell.tsx:57–60`) | Empty state | Không có thông báo | — | Hiển thị khi `items.length === 0` |
| `notifications.shell.bell.itemTitle` | `NotificationBell` > notification item > title (`NotificationBell.tsx:63–100`) | Item | `<code>{n.title}</code>` | Đánh dấu thông báo `<code>n.id</code>` đã đọc, sau đó chuyển hướng tới `<code>n.link</code>` nếu có | Một dòng cho mỗi thông báo từ API |
| `notifications.shell.bell.itemBody` | `NotificationBell` > notification item > body (`NotificationBell.tsx:87–94`) | Description | `<code>{n.body}</code>` | Tương tác theo item cha | Hiển thị khi `n.body` có nội dung |
| `notifications.shell.bell.itemTime` | `NotificationBell` > notification item > relative timestamp (`NotificationBell.tsx:95–97`) | Item | `<code>dayjs(n.created_at).fromNow()</code>` | Tương tác theo item cha | Thời gian tương đối định dạng tiếng Việt qua Day.js |
| `notifications.shell.bell.markAllRead` | `NotificationBell` > menu footer button (`NotificationBell.tsx:104–113`) | CTA | Đánh dấu tất cả đã đọc | Gọi `markAllRead.mutate()` → `PATCH /notifications/read-all` | Hiển thị trong menu; disabled khi `unreadCount === 0` |
| `notifications.shell.theme.toggle` | `DashboardShell` > `ThemeToggler` > `ActionIcon` (`ThemeToggler.tsx:16–32`) | Aria-label | Toggle theme | Chuyển đổi giữa giao diện `light` và `dark` | interactive sau khi client mount |
| `notifications.shell.userMenu.trigger` | `DashboardShell` > `UserMenu` > account button (`UserMenu.tsx:78–107`) | Aria-label | Tài khoản | Mở / đóng `Popover` thông tin tài khoản | Ẩn khi session đang pending hoặc không có user |
| `notifications.shell.userMenu.avatarAlt` | `UserMenu` > `Avatar` (`UserMenu.tsx:97–105`) | Alt text | `<code>{user.name}</code>` hoặc User | Mở / đóng Popover tài khoản | Tên người dùng từ session; fallback "User" khi rỗng |
| `notifications.shell.userMenu.avatarInitials` | `UserMenu` > `Avatar` fallback (`UserMenu.tsx:103–105`) | Item | `<code>{user.name?.substring(0, 2).toUpperCase()}</code>` hoặc US | Mở / đóng Popover tài khoản | Fallback chữ cái đầu khi ảnh đại diện lỗi/không có |
| `notifications.shell.userMenu.email` | `UserMenu` > popover identity block (`UserMenu.tsx:109–115`) | Item | `<code>{user.email}</code>` hoặc — | — | Email người dùng từ session; fallback "—" khi rỗng |
| `notifications.shell.userMenu.balanceLabel` | `UserMenu` > wallet-balance block (`UserMenu.tsx:117–125`) | Label | Số dư | — | Hiển thị khi user là student và có dữ liệu ví `walletData` |
| `notifications.shell.userMenu.balanceValue` | `UserMenu` > wallet-balance block (`UserMenu.tsx:121–123`) | Item | `<code>{walletBalance.toLocaleString("vi-VN")} VND</code>` | — | Số dư thực tế kèm đơn vị tiền tệ VND |
| `notifications.shell.userMenu.home` | `UserMenu` > navigation option (`UserMenu.tsx:68–76, 127–139`) | Navigation | Trang chủ | `/dashboard` | Điều hướng về màn hình chính; đóng Popover |
| `notifications.shell.userMenu.wallet` | `UserMenu` > navigation option (`UserMenu.tsx:70–72, 127–139`) | Navigation | Ví của tôi | `/dashboard/wallet` | Điều hướng tới trang ví; đóng Popover |
| `notifications.shell.userMenu.settings` | `UserMenu` > navigation option (`UserMenu.tsx:73–75, 127–139`) | Navigation | Cài đặt | `/dashboard/settings` | Điều hướng tới cài đặt (redirect sang profile); đóng Popover |
| `notifications.shell.userMenu.signOut` | `UserMenu` > sign-out button (`UserMenu.tsx:49–59, 141–148`) | CTA | Đăng xuất | Gọi `signOut()`, xóa query cache, chuyển hướng về `/auth` | default |

---

### 2.2 Settings layout header & sidebar

*Nguồn: `apps/web-1/app/dashboard/settings/_components/SettingsLayout.tsx`, `apps/web-1/app/dashboard/settings/_components/SettingsSidebar.tsx`, `apps/web-1/app/dashboard/settings/_components/settings-nav.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.layout.heading` | `SettingsLayout` > header > `<h1>` (`SettingsLayout.tsx:14`) | Heading | Cài đặt | — | default |
| `settings.layout.description` | `SettingsLayout` > header > `<p>` (`SettingsLayout.tsx:15–17`) | Description | Quản lý thông tin cá nhân và bảo mật tài khoản | — | default |
| `settings.sidebar.nav.profile` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–33`; `settings-nav.ts:10`) | Navigation | Thông tin cơ bản | `/dashboard/settings/profile` | default (không active trên route notifications) |
| `settings.sidebar.nav.password` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–33`; `settings-nav.ts:11`) | Navigation | Đổi mật khẩu | `/dashboard/settings/password` | default (không active trên route notifications) |
| `settings.sidebar.nav.sessions` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–33`; `settings-nav.ts:12`) | Navigation | Thiết bị & Phiên đăng nhập | `/dashboard/settings/sessions` | default (không active trên route notifications) |
| `settings.sidebar.nav.notifications` | `SettingsSidebar` > `Link` (`SettingsSidebar.tsx:20–33`; `settings-nav.ts:13`) | Navigation | Cài đặt thông báo | `/dashboard/settings/notifications` | active (`aria-current="page"`, `bg-surface-soft text-brand font-semibold`) |

---

### 2.3 Notification preferences page states & form

*Nguồn: `apps/web-1/app/dashboard/settings/notifications/page.tsx`, `apps/web-1/app/dashboard/settings/notifications/_components/NotificationPreferencesForm.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.notifications.page.loading` | `SettingsNotificationsPage` > `Loader2` wrapper (`page.tsx:11–17`) | Description | — | — | Hiển thị khi `isPending === true` (icon spinner `Loader2` animate-spin, min-h-[60vh]) |
| `settings.notifications.page.sessionError` | `SettingsNotificationsPage` > `Text` (`page.tsx:19–25`) | Error | Không thể tải thông tin tài khoản. Vui lòng thử lại sau. | — | Hiển thị khi `!sessionData?.user` sau khi nạp session hoàn tất |
| `settings.notifications.form.queryError` | `NotificationPreferencesForm` > `Text` (`NotificationPreferencesForm.tsx:17–23`) | Error | Không thể tải cài đặt thông báo. Vui lòng thử lại sau. | — | Hiển thị khi API `GET /notifications/preferences` trả về lỗi (`query.isError === true`) |
| `settings.notifications.form.queryLoading` | `NotificationPreferencesForm` > `Text` (`NotificationPreferencesForm.tsx:25–31`) | Description | Đang tải cài đặt thông báo... | — | Hiển thị khi query đang nạp hoặc state draft chưa khởi tạo (`query.isPending \|\| !draft`) |
| `settings.notifications.form.cardHeading` | `NotificationPreferencesForm` > `Paper` > `Stack` > `Text` (`NotificationPreferencesForm.tsx:37`) | Heading | Cài đặt thông báo | — | default |
| `settings.notifications.form.cardDescription` | `NotificationPreferencesForm` > `Paper` > `Stack` > `Text` (`NotificationPreferencesForm.tsx:38–40`) | Description | Bật hoặc tắt nhận email thông báo. | — | default |
| `settings.notifications.form.switch.label` | `NotificationPreferencesForm` > `Switch` label (`NotificationPreferencesForm.tsx:47`) | Label | Nhận email | Bật / tắt toggle switch cài đặt nhận email | default; `color="brand"` |
| `settings.notifications.form.switch.description` | `NotificationPreferencesForm` > `Switch` description (`NotificationPreferencesForm.tsx:48`) | Helper | Gửi thông báo tới email đã đăng ký. | — | default |

---

### 2.4 Mutation feedback & toast notifications

*Nguồn: `apps/web-1/app/dashboard/settings/notifications/_components/NotificationPreferencesForm.tsx:49–63`, `apps/web-1/app/dashboard/settings/hooks/useNotificationPreferences.ts:22–37`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.notifications.switch.disabled` | `NotificationPreferencesForm` > `Switch` (`NotificationPreferencesForm.tsx:45`) | State | — | Ngăn người dùng thao tác khi mutation đang gửi request | `disabled={save.isPending}` |
| `settings.notifications.toast.errorTitle` | `useNotificationPreferences` > `save.onError` > `notifications.show` (`useNotificationPreferences.ts:31–35`) | Toast | Lỗi | — | Hiển thị khi API `PUT /notifications/preferences` thất bại (`color="red"`) |
| `settings.notifications.toast.errorMessage` | `useNotificationPreferences` > `save.onError` > `notifications.show` (`useNotificationPreferences.ts:31–35`) | Toast | Không thể lưu cài đặt thông báo. Vui lòng thử lại. | — | Hiển thị kèm `settings.notifications.toast.errorTitle`; switch được hoàn tác về giá trị cũ |

---

## Layer 3: Page Notes

### 3.1 Biến thể thuật ngữ xuất hiện trên trang (Terminology Variants)

- **"Cài đặt thông báo" (Notification Preferences / Settings):**
  - Xuất hiện đồng nhất ở 3 vị trí:
    1. Nhãn menu sidebar: `settings-nav.ts:13` (`label: "Cài đặt thông báo"`).
    2. Tiêu đề khối cài đặt bên trong Paper: `NotificationPreferencesForm.tsx:37` (`<Text fw={600}>Cài đặt thông báo</Text>`).
    3. Thông báo lỗi tải/lưu: `NotificationPreferencesForm.tsx:20, 28` và `useNotificationPreferences.ts:33` ("Không thể tải cài đặt thông báo", "Không thể lưu cài đặt thông báo").
- **"Nhận email" vs "email thông báo" vs "email đã đăng ký":**
  - Thẻ mô tả dùng cụm: `"Bật hoặc tắt nhận email thông báo."` (`NotificationPreferencesForm.tsx:39`).
  - Nhãn nút switch dùng ngắn gọn: `"Nhận email"` (`NotificationPreferencesForm.tsx:47`).
  - Phần giải thích bên dưới switch dùng: `"Gửi thông báo tới email đã đăng ký."` (`NotificationPreferencesForm.tsx:48`).
- **"Thông báo" (Notifications):**
  - Dùng cho chuông thông báo trên thanh top navbar (`NotificationBell.tsx:32, 53` - `"Thông báo"`). Chuông này là kênh thông báo trên web (`in_app`), độc lập hoàn toàn với switch nhận email.

---

### 3.2 Hiện trạng kỹ thuật & Code behavior thực tế (Verified Code Behavior)

1. **Cơ chế Auto-save & Optimistic UI Rollback:**
   - Trong `NotificationPreferencesForm.tsx:49–63`: Khi người dùng click vào `Switch`, hàm `onChange` sẽ:
     - Bỏ qua nếu mutation đang chạy (`if (save.isPending) return`).
     - Lưu lại giá trị trước đó (`previous = draft.email_enabled`).
     - Cập nhật state nội bộ ngay lập tức (`setDraft({ email_enabled: checked })`).
     - Gọi `save.mutate({ email_enabled: checked })`.
     - Nếu mutation gặp lỗi (`onError`), callback sẽ rollback state về giá trị cũ: `setDraft({ email_enabled: previous })` và đồng thời hook `useNotificationPreferences.ts:30–36` bắn toast lỗi màu đỏ (`notifications.show`).
     - Không có nút "Lưu" hoặc "Lưu cài đặt" thủ công trong mã nguồn.
2. **Hiện trạng số lượng tùy chọn so với tài liệu thiết kế ban đầu:**
   - Trong tài liệu nhật ký kỹ thuật lịch sử (`docs/journals/journal-2026-08-28-ga08-notification-preferences.md`), hệ thống từng phác thảo mô hình 7 cờ boolean và 4 switch tương ứng với từng nhóm sự kiện (báo cáo mới, trạng thái hồ sơ, giao dịch ví, thông báo hệ thống).
   - Tuy nhiên, tại bản cập nhật GA-08 (`docs/journals/journal-2026-08-28-ga08-email-only-preferences.md`), kiến trúc đã được thu gọn (slimmed down) triệt để: bảng `notification_preferences` trong cơ sở dữ liệu và schema Zod `NotificationPreferenceSchema` chỉ còn lưu đúng 1 trường `email_enabled: z.boolean()`.
   - Vì vậy, mã nguồn hiện tại không tồn tại các switch chi tiết cho từng loại sự kiện (báo cáo, hồ sơ, ví, hệ thống).
3. **Phân tách giữa kênh Web (In-App) và Email:**
   - Kênh Web (`in_app`): Hệ thống gửi qua SSE / Centrifugo và lưu vào bảng `Notification` trong DB để hiển thị trên `NotificationBell`. Kênh này được cấu hình cứng trong code policy là luôn hoạt động (`allowsNotificationChannel` trả về `true` cho `in_app` - `preference-policy.ts:18`), người dùng không thể tắt từ giao diện này.
   - Kênh Email (`email`): Hệ thống chỉ đẩy vào hàng đợi outbox gửi email nếu `preference.email_enabled === true` (`preference-policy.ts:19`).
4. **Quyền truy cập của Supporter:**
   - File `apps/web-1/app/supporter/settings/notifications/page.tsx` đã bị xóa hoàn toàn trong đợt refactor GA-08.
   - Hàm `getSettingsNav` trong `settings-nav.ts:17–19` chủ động lọc bỏ tab `/notifications` nếu `basePath` bắt đầu bằng `/supporter`.
   - Do đó, trang cài đặt thông báo hiện tại chỉ phục vụ duy nhất vai trò Sinh viên (`/dashboard/settings/notifications`).

---

### 3.3 Điểm chưa xác minh & Câu hỏi làm rõ (Unknowns / Questions)

1. **Email đích nhận thông báo:**
   - Chuỗi mô tả ghi `"Gửi thông báo tới email đã đăng ký."` nhưng màn hình không hiển thị cụ thể địa chỉ email đó là gì (ví dụ: `nguyenvana@gmail.com`). Người dùng có thể không nhớ chính xác tài khoản đang liên kết với email nào nếu không vào tab "Thông tin cơ bản" (`/dashboard/settings/profile`) hoặc mở menu góc phải.
2. **Kỳ vọng hiển thị phân loại thông báo:**
   - Người dùng hoặc Product Owner có mong muốn trong tương lai mở rộng lại các tùy chọn nhận email theo từng loại sự kiện cụ thể (ví dụ: chỉ nhận email khi có báo cáo phản biện mới, không nhận email khi có giao dịch ví) hay giữ nguyên master toggle `email_enabled` duy nhất như hiện tại?
3. **Thông báo qua Telegram / Zalo:**
   - Trong code backend có nhắc đến channel `telegram` nhưng hiện tại chỉ dùng cho admin/supporter bot; sinh viên hiện chưa có tùy chọn kết nối Telegram hay nhận tin nhắn qua OTT trên màn hình cài đặt này.
