# Page: Quản lý phiên đăng nhập (Settings Sessions)
Route: `/dashboard/settings/sessions`  
Access: `Authenticated (Student / User)`

---

## Page Context

### User
- **Primary user:** Sinh viên hoặc người dùng cá nhân đã đăng nhập vào hệ thống Nexus Platform, truy cập trang cài đặt bảo mật tài khoản để quản lý các phiên và thiết bị đăng nhập.
- **Typical state:** `[Assumption / Cần xác minh]` Người dùng có nhu cầu rà soát các thiết bị đang duy trì kết nối, nghi ngờ có phiên đăng nhập lạ trên máy công cộng/trường học, hoặc vừa đổi mật khẩu và muốn ngắt quyền truy cập của các phiên làm việc khác.
- **Knowledge level:** Hiểu khái niệm cơ bản về phiên đăng nhập (thiết bị, trình duyệt, địa chỉ IP, mốc thời gian hoạt động).

### User goals
- Xem danh sách trực quan tất cả các thiết bị và trình duyệt đang duy trì phiên đăng nhập vào tài khoản.
- Nhận biết rõ ràng thiết bị hiện tại đang trực tiếp sử dụng (qua nhãn `Phiên hiện tại`).
- Chủ động ngắt kết nối từng thiết bị riêng lẻ nếu không còn dùng hoặc nghi ngờ bất thường.
- Ngắt kết nối đồng loạt tất cả các thiết bị và trình duyệt khác bằng một thao tác duy nhất mà vẫn duy trì phiên làm việc hiện tại.
- Tải lại danh sách phiên đăng nhập khi gặp lỗi đường truyền hoặc kết nối API.

### Business/Product goals
- Tăng cường an toàn và bảo mật cho tài khoản người dùng, giảm thiểu nguy cơ chiếm dụng phiên đăng nhập (session hijacking) hoặc quên đăng xuất trên thiết bị công cộng.
- Cung cấp công cụ tự phục vụ (self-service security) minh bạch, trực quan, giảm tải yêu cầu hỗ trợ kỹ thuật liên quan đến bảo mật tài khoản.
- Ghi nhận đầy đủ nhật ký kiểm toán (audit log) phía backend cho các hành vi thu hồi phiên (`profile.revoke_session`, `profile.revoke_other_sessions`).

### Primary action
- Quan sát danh sách phiên đăng nhập; nếu phát hiện phiên bất thường hoặc không cần thiết, nhấn nút `Đăng xuất` trên từng mục hoặc nhấn `Đăng xuất tất cả thiết bị khác` và xác nhận trong hộp thoại.

### Secondary actions
- Chuyển hướng qua các tab cài đặt khác trong thanh điều hướng bên: `Thông tin cơ bản` (`/dashboard/settings/profile`), `Đổi mật khẩu` (`/dashboard/settings/password`), `Cài đặt thông báo` (`/dashboard/settings/notifications`).
- Nhấn `Tải lại` khi danh sách phiên gặp sự cố tải dữ liệu.
- Nhấn `Hủy bỏ` trong modal xác nhận để giữ nguyên các phiên đăng nhập khác.

### Entry
- Từ thanh điều hướng chính (`DashboardShell`): Mở menu người dùng (`UserMenu`) > Chọn `Cài đặt` (dẫn tới `/dashboard/settings` -> server redirect tới `/dashboard/settings/profile`) > Nhấn chọn tab `Thiết bị & Phiên đăng nhập` trên thanh `SettingsSidebar`.
- `[Assumption / Cần xác minh]` Truy cập trực tiếp qua đường dẫn `/dashboard/settings/sessions` trên thanh địa chỉ trình duyệt hoặc bookmark cá nhân.
- `[Assumption / Cần xác minh]` Người dùng chủ động chuyển sang tab này ngay sau khi hoàn thành quy trình đổi mật khẩu tại `/dashboard/settings/password`.

### Exit / next step
- Nhấn vào các mục cài đặt khác trong sidebar (`/dashboard/settings/profile`, `/dashboard/settings/password`, `/dashboard/settings/notifications`).
- Điều hướng về màn hình chính hoặc các tính năng khác trên thanh điều hướng (`/dashboard`, `/dashboard/wallet`, `/dashboard/team-fit`, v.v.).
- Đăng xuất hoàn toàn khỏi tài khoản qua menu người dùng (`UserMenu` > `Đăng xuất`).

### Product facts / constraints
- **Kiểm soát truy cập theo vai trò (Role Guard):** Màn hình được bảo vệ bởi `DashboardLayout` (`apps/web-1/app/dashboard/layout.tsx:14-45`). Người dùng chưa đăng nhập (`!session`) sẽ bị chuyển hướng về `/auth`. Nếu tài khoản có vai trò `admin` hoặc `supporter`, hệ thống sẽ chặn hiển thị và chuyển hướng về `/admin` hoặc `/supporter` (người dùng vai trò Supporter có màn hình quản lý phiên riêng tại `/supporter/settings/sessions`).
- **Xác thực phiên phía client:** File `apps/web-1/app/dashboard/settings/sessions/page.tsx:9-27` kiểm tra trạng thái qua hook `useSession()`. Trong lúc tải thông tin tài khoản hiển thị spinner xoay giữa màn hình; nếu không lấy được thông tin `user`, hiển thị thông báo lỗi `Không thể tải thông tin tài khoản. Vui lòng thử lại sau.`.
- **Bảo vệ phiên hiện tại (Current Session Protection):**
  - Giao diện (`apps/web-1/app/dashboard/settings/sessions/_components/SessionItem.tsx:58-62, 70-82`) gắn huy hiệu `Phiên hiện tại` cho phiên tương ứng (`session.isCurrent === true`) và hoàn toàn ẩn nút `Đăng xuất`. Người dùng chỉ có thể đăng xuất các phiên khác (`!session.isCurrent`).
  - Backend (`apps/api/src/modules/profile/application/revoke-session.usecase.ts:23-25`) chặn tuyệt đối hành vi thu hồi phiên hiện tại qua API này, trả về HTTP 400 `CANNOT_REVOKE_CURRENT_SESSION` với thông điệp: `"Không thể thu hồi phiên đăng nhập hiện tại qua tính năng này"`.
- **Điều kiện hiển thị nút đăng xuất hàng loạt:** Nút `Đăng xuất tất cả thiết bị khác` chỉ xuất hiện khi số lượng phiên khác lớn hơn 0 (`otherSessionsCount > 0`) (nguồn: `apps/web-1/app/dashboard/settings/sessions/_components/SessionsList.tsx:19, 54-65`). Nếu tài khoản chỉ có duy nhất phiên hiện tại, nút này sẽ tự động ẩn.
- **Giới hạn số lượng phiên tải về:** Backend (`apps/api/src/modules/profile/application/list-sessions.usecase.ts:26-40`) truy vấn tối đa 100 phiên (`take: 100`), lọc bỏ các phiên đã hết hạn (`expires_at > now()`), sắp xếp thời gian tạo mới nhất lên đầu (`orderBy: { created_at: "desc" }`).
- **Phân tích User-Agent & Phòng chống ReDoS:** Chuỗi User-Agent được giới hạn tối đa 500 ký tự (`uaString.slice(0, 500)`) trước khi phân tích qua biểu thức chính quy (Regex) để chống tấn công làm nghẽn tài nguyên (ReDoS) (nguồn: `packages/validation/src/index.ts:619`).
- **Nhận diện thiết bị & Biểu tượng:** Hệ thống phân loại thiết bị thành 4 nhóm (`desktop`, `mobile`, `tablet`, `unknown`) tương ứng với 4 biểu tượng giao diện: `Laptop`, `Smartphone`, `Tablet`, `Globe` (nguồn: `packages/validation/src/index.ts:604-660`, `apps/web-1/app/dashboard/settings/sessions/_components/SessionItem.tsx:29-40`).
- **Chuẩn hóa hiển thị địa chỉ IP:** Phía client kiểm tra chuỗi IP, nếu là `::1`, `127.0.0.1` hoặc chứa `localhost` thì chuyển đổi thành `"Localhost"`. Đối với địa chỉ IPv4-mapped IPv6 (`::ffff:x.x.x.x`), hàm tự động lược bỏ tiền tố `::ffff:` để hiển thị địa chỉ IPv4 ngắn gọn (nguồn: `packages/validation/src/index.ts:662-668`).
- **Tự động đồng bộ lại danh sách phiên (Cache Invalidation):** Sau khi thực hiện bất kỳ thao tác đăng xuất nào (đơn lẻ hoặc hàng loạt), hook `useSessionMutations` luôn gọi `queryClient.invalidateQueries({ queryKey: ["profile", "sessions"] })` trong hàm callback `onSettled` để đồng bộ lại danh sách mới nhất từ cơ sở dữ liệu (nguồn: `apps/web-1/app/dashboard/settings/hooks/useSessionMutations.ts:41-44, 68-70`).

---

## Interactive Inventory

### 1. Khung trang Cài đặt (Settings Layout Header)
*Source: `apps/web-1/app/dashboard/settings/_components/SettingsLayout.tsx:12-18`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.layout.title` | `SettingsLayout > h1` | Heading | `Cài đặt` | — | default |
| `settings.layout.desc` | `SettingsLayout > p` | Description | `Quản lý thông tin cá nhân và bảo mật tài khoản` | — | default |

---

### 2. Thanh điều hướng Cài đặt (Settings Sidebar Navigation)
*Source: `apps/web-1/app/dashboard/settings/_components/SettingsSidebar.tsx:15-35`, `apps/web-1/app/dashboard/settings/_components/settings-nav.ts:9-23`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `settings.nav.profile` | `SettingsSidebar > Link` | Navigation | `Thông tin cơ bản` | `/dashboard/settings/profile` | default (icon `User`) |
| `settings.nav.password` | `SettingsSidebar > Link` | Navigation | `Đổi mật khẩu` | `/dashboard/settings/password` | default (icon `KeyRound`) |
| `settings.nav.sessions` | `SettingsSidebar > Link` | Navigation | `Thiết bị & Phiên đăng nhập` | `/dashboard/settings/sessions` | active (`aria-current="page"`, icon `MonitorSmartphone`) |
| `settings.nav.notifications` | `SettingsSidebar > Link` | Navigation | `Cài đặt thông báo` | `/dashboard/settings/notifications` | default (icon `Bell`) |

---

### 3. Trạng thái xác thực tài khoản trang (Page Auth State)
*Source: `apps/web-1/app/dashboard/settings/sessions/page.tsx:8-28`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sessions.auth.loading` | `SettingsSessionsPage > Loader2` | Empty state | — *(Biểu tượng spinner xoay `animate-spin text-brand`)* | — | loading (khi `isPending === true`) |
| `sessions.auth.error_user` | `SettingsSessionsPage > Text` | Error | `Không thể tải thông tin tài khoản. Vui lòng thử lại sau.` | — | default (khi `!user`) |

---

### 4. Tiêu đề danh sách phiên & Tác vụ hàng loạt (Sessions Header & Actions)
*Source: `apps/web-1/app/dashboard/settings/sessions/_components/SessionsList.tsx:40-66`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sessions.header.title` | `SessionsList > Text[size="lg"]` | Heading | `Thiết bị & Phiên đăng nhập` | — | default (kèm icon `Shield`) |
| `sessions.header.desc` | `SessionsList > Text[size="sm"]` | Description | `Quản lý và thu hồi quyền truy cập của các thiết bị đang đăng nhập tài khoản này.` | — | default |
| `sessions.action.revoke_others` | `SessionsList > Button[color="red"]` | CTA | `Đăng xuất tất cả thiết bị khác` | Mở modal xác nhận `RevokeOthersModal` | default (chỉ hiển thị khi `otherSessionsCount > 0`, kèm icon `LogOut`) / disabled khi `revokeOtherSessions.isPending` |

---

### 5. Trạng thái tải danh sách phiên (Sessions Loading State)
*Source: `apps/web-1/app/dashboard/settings/sessions/_components/SessionsList.tsx:68-75`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sessions.loading.skeleton` | `SessionsList > Skeleton[height=72] (x3)` | Empty state | — *(Khung xương xám placeholder 3 dòng chiều cao 72px)* | — | loading (khi `isLoading === true`) |

---

### 6. Trạng thái lỗi tải danh sách (Sessions Error State)
*Source: `apps/web-1/app/dashboard/settings/sessions/_components/SessionsList.tsx:77-98`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sessions.error.msg` | `Paper.bg-red > Text` | Error | `Không thể tải danh sách phiên đăng nhập. Vui lòng thử lại.` | — | default (kèm icon `AlertCircle` màu đỏ) |
| `sessions.error.retry_cta` | `Paper.bg-red > Button` | CTA | `Tải lại` | Kích hoạt refetch danh sách phiên (`refetch()`) | default (kèm icon `RefreshCw`) |

---

### 7. Trạng thái danh sách rỗng (Sessions Empty State)
*Source: `apps/web-1/app/dashboard/settings/sessions/_components/SessionsList.tsx:103-106`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sessions.list.empty` | `SessionsList > Text` | Empty state | `Không tìm thấy phiên đăng nhập nào.` | — | default (khi `!isLoading && !isError && sessions.length === 0`) |

---

### 8. Thẻ thông tin phiên đăng nhập (Session Item)
*Source: `apps/web-1/app/dashboard/settings/sessions/_components/SessionItem.tsx:14-85`, `packages/validation/src/index.ts:604-668`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `session.item.os_browser` | `SessionItem > Text[fw=600]` | Item | `{parsed.os} • {parsed.browser}` | — | default |
| `session.item.current_badge` | `SessionItem > Badge[color="teal"]` | Badge | `Phiên hiện tại` | — | default (chỉ hiển thị khi `session.isCurrent === true`) |
| `session.item.metadata` | `SessionItem > Text[size="xs"]` | Description | `IP: {formattedIp} • Đăng nhập lúc: {formattedCreatedAt}` | — | default |
| `session.item.revoke_cta` | `SessionItem > Button[color="red"]` | CTA | `Đăng xuất` | Gửi yêu cầu DELETE `/profile/sessions/${session.id}` | default (chỉ hiển thị khi `!session.isCurrent`, kèm icon `LogOut`) / loading & disabled khi `isRevoking` |
| `session.ua.os.win10_11` | `parseUserAgent` > `os` | Item | `Windows 10/11` | — | Hiển thị khi User-Agent khớp `/Windows NT 10.0/i` |
| `session.ua.os.win81` | `parseUserAgent` > `os` | Item | `Windows 8.1` | — | Hiển thị khi User-Agent khớp `/Windows NT 6.3/i` |
| `session.ua.os.win7` | `parseUserAgent` > `os` | Item | `Windows 7` | — | Hiển thị khi User-Agent khớp `/Windows NT 6.1/i` |
| `session.ua.os.win` | `parseUserAgent` > `os` | Item | `Windows` | — | Hiển thị khi User-Agent khớp `/Windows NT/i` |
| `session.ua.os.ipados` | `parseUserAgent` > `os` | Item | `iPadOS` | — | Hiển thị khi User-Agent khớp `/iPad/i` |
| `session.ua.os.ios` | `parseUserAgent` > `os` | Item | `iOS` | — | Hiển thị khi User-Agent khớp `/iPhone\|iPod/i` |
| `session.ua.os.macos` | `parseUserAgent` > `os` | Item | `macOS` | — | Hiển thị khi User-Agent khớp `/Macintosh\|Mac OS X/i` |
| `session.ua.os.android` | `parseUserAgent` > `os` | Item | `Android` | — | Hiển thị khi User-Agent khớp `/Android/i` |
| `session.ua.os.chromeos` | `parseUserAgent` > `os` | Item | `ChromeOS` | — | Hiển thị khi User-Agent khớp `/CrOS/i` |
| `session.ua.os.linux` | `parseUserAgent` > `os` | Item | `Linux` | — | Hiển thị khi User-Agent khớp `/Linux/i` |
| `session.ua.os.other` | `parseUserAgent` > `os` | Item | `Hệ điều hành khác` | — | Fallback khi không khớp hệ điều hành nào đã liệt kê |
| `session.ua.os.unknown` | `parseUserAgent` > `os` | Item | `Hệ điều hành không xác định` | — | Hiển thị khi chuỗi User-Agent là null hoặc rỗng |
| `session.ua.browser.edge` | `parseUserAgent` > `browser` | Item | `Microsoft Edge` | — | Hiển thị khi User-Agent khớp `/Edg\//i` |
| `session.ua.browser.opera` | `parseUserAgent` > `browser` | Item | `Opera` | — | Hiển thị khi User-Agent khớp `/OPR\/\|Opera/i` |
| `session.ua.browser.coccoc` | `parseUserAgent` > `browser` | Item | `Cốc Cốc` | — | Hiển thị khi User-Agent khớp `/coc_coc/i` |
| `session.ua.browser.brave` | `parseUserAgent` > `browser` | Item | `Brave` | — | Hiển thị khi User-Agent khớp `/Brave/i` |
| `session.ua.browser.chrome` | `parseUserAgent` > `browser` | Item | `Google Chrome` | — | Hiển thị khi User-Agent khớp `/Chrome\//i` |
| `session.ua.browser.firefox` | `parseUserAgent` > `browser` | Item | `Mozilla Firefox` | — | Hiển thị khi User-Agent khớp `/Firefox\//i` |
| `session.ua.browser.safari` | `parseUserAgent` > `browser` | Item | `Apple Safari` | — | Hiển thị khi User-Agent khớp Safari và không chứa Chrome |
| `session.ua.browser.other` | `parseUserAgent` > `browser` | Item | `Trình duyệt khác` | — | Fallback khi không khớp trình duyệt nào đã liệt kê |
| `session.ua.browser.unknown` | `parseUserAgent` > `browser` | Item | `Trình duyệt không xác định` | — | Hiển thị khi chuỗi User-Agent là null hoặc rỗng |
| `session.ip.unknown` | `formatIpAddress` | Description | `IP không xác định` | — | Hiển thị khi địa chỉ IP là null hoặc rỗng |
| `session.ip.localhost` | `formatIpAddress` | Description | `Localhost` | — | Hiển thị khi IP là `::1`, `127.0.0.1` hoặc chứa `localhost` |
| `session.ip.formatted` | `formatIpAddress` | Description | `{formattedIp}` | — | Hiển thị địa chỉ IP thực tế (đã lược bỏ prefix `::ffff:`) |
| `session.time.formatted` | `SessionItem > formattedCreatedAt` | Description | `{formattedCreatedAt}` | — | Định dạng tiếng Việt: `dd/mm/yyyy, hh:mm` qua `toLocaleString("vi-VN")` |
| `session.time.unknown` | `SessionItem > formattedCreatedAt` | Description | `Không xác định` | — | Hiển thị khi giá trị `createdAt` không thể parse ra thời gian hợp lệ |

---

### 9. Hộp thoại xác nhận hủy tất cả thiết bị khác (Revoke Others Modal)
*Source: `apps/web-1/app/dashboard/settings/sessions/_components/RevokeOthersModal.tsx:32-70`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `modal.revoke_others.title` | `RevokeOthersModal > Modal > title` | Heading | `Đăng xuất khỏi tất cả thiết bị khác` | — | default (kèm icon `AlertTriangle` màu hổ phách) |
| `modal.revoke_others.desc_with_count` | `RevokeOthersModal > Stack > Text` | Description | `Hành động này sẽ hủy phiên đăng nhập trên toàn bộ các trình duyệt và thiết bị khác (khoảng ${otherSessionsCount} thiết bị). Bạn vẫn sẽ duy trì phiên làm việc trên thiết bị hiện tại.` | — | default (hiển thị khi `otherSessionsCount > 0`) |
| `modal.revoke_others.desc_without_count` | `RevokeOthersModal > Stack > Text` | Description | `Hành động này sẽ hủy phiên đăng nhập trên toàn bộ các trình duyệt và thiết bị khác. Bạn vẫn sẽ duy trì phiên làm việc trên thiết bị hiện tại.` | — | default (hiển thị khi `!otherSessionsCount`) |
| `modal.revoke_others.cancel_cta` | `RevokeOthersModal > Button[variant="default"]` | CTA | `Hủy bỏ` | Đóng modal (`onClose`) | default / disabled khi `loading` |
| `modal.revoke_others.confirm_cta` | `RevokeOthersModal > Button[color="red"]` | CTA | `Xác nhận đăng xuất` | Gửi yêu cầu POST `/profile/sessions/revoke-others` | default (kèm icon `LogOut`) / loading & disabled khi `loading` |

---

### 10. Thông báo kết quả thao tác & Lỗi API (Toast Notifications & Error Feedback)
*Source: `apps/web-1/app/dashboard/settings/hooks/useSessionMutations.ts:28-40, 54-67`, `apps/api/src/modules/profile/application/revoke-session.usecase.ts:16-24, 37, 53`, `apps/api/src/modules/profile/application/revoke-other-sessions.usecase.ts:15-19, 47`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `toast.revoke_single.success_title` | `notifications.show > title` | Toast | `Thành công` | — | client toast trigger (màu `teal`) |
| `toast.revoke_single.success_msg_fe` | `notifications.show > message` | Toast | `Đã đăng xuất thiết bị thành công.` | — | Client fallback khi response API không có message |
| `toast.revoke_single.success_msg_be` | `apiClient delete > message` | Toast | `Đã thu hồi phiên đăng nhập thành công` | — | Thông điệp backend trả về khi xóa 1 phiên thành công |
| `toast.revoke_single.error_title` | `notifications.show > title` | Toast | `Lỗi` | — | client toast trigger (màu `red`) |
| `toast.revoke_single.error_msg_fe` | `notifications.show > message` | Toast | `Không thể đăng xuất thiết bị này. Vui lòng thử lại.` | — | Client fallback khi request xóa 1 phiên thất bại |
| `toast.revoke_others.success_title` | `notifications.show > title` | Toast | `Thành công` | — | client toast trigger (màu `teal`) |
| `toast.revoke_others.success_msg_fe` | `notifications.show > message` | Toast | `Đã đăng xuất khỏi tất cả các thiết bị khác.` | — | Client fallback khi response API không có message |
| `toast.revoke_others.success_msg_be` | `apiClient post > message` | Toast | `Đã đăng xuất khỏi ${result.count} thiết bị khác thành công` | — | Thông điệp backend trả về khi xóa các phiên khác thành công |
| `toast.revoke_others.error_title` | `notifications.show > title` | Toast | `Lỗi` | — | client toast trigger (màu `red`) |
| `toast.revoke_others.error_msg_fe` | `notifications.show > message` | Toast | `Không thể đăng xuất các thiết bị khác. Vui lòng thử lại.` | — | Client fallback khi request xóa tất cả phiên khác thất bại |
| `api.error.cannot_revoke_current` | Backend `AppError(400)` | Error | `Không thể thu hồi phiên đăng nhập hiện tại qua tính năng này` | — | Trả về khi cố ý xóa phiên đang thao tác (`targetSessionId === currentSessionId`) |
| `api.error.session_not_found` | Backend `AppError(404)` | Error | `Phiên đăng nhập không tồn tại hoặc đã hết hạn` | — | Trả về khi phiên cần xóa không tìm thấy trong DB (`result.count === 0`) |
| `api.error.invalid_session_id` | Backend `AppError(400)` | Error | `Session ID không hợp lệ` | — | Trả về khi tham số `targetSessionId` rỗng |
| `api.error.invalid_user_id` | Backend `AppError(400)` | Error | `User ID không hợp lệ` | — | Trả về khi `userId` của token đăng nhập rỗng |
| `api.error.invalid_session_context` | Backend `AppError(500)` | Error | `Không xác định được phiên đăng nhập hiện tại` | — | Trả về khi gọi xóa các phiên khác mà session hiện tại rỗng |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- **Đăng xuất vs Thu hồi vs Hủy:**
  - Nhãn nút bấm phía giao diện người dùng sử dụng nhất quán từ `Đăng xuất`:
    - `Đăng xuất tất cả thiết bị khác` (nút tác vụ chính trên header).
    - `Đăng xuất` (nút tác vụ trên từng phiên đăng nhập khác).
    - `Xác nhận đăng xuất` (nút xác nhận trong modal).
  - Tiêu đề modal dùng cụm: `Đăng xuất khỏi tất cả thiết bị khác`.
  - Câu mô tả và phản hồi hệ thống dùng đan xen cả 3 khái niệm:
    - `Quản lý và thu hồi quyền truy cập...` (mô tả header).
    - `Hành động này sẽ hủy phiên đăng nhập trên toàn bộ các trình duyệt và thiết bị khác...` (nội dung giải thích trong modal).
    - `Đã thu hồi phiên đăng nhập thành công` (thông điệp phản hồi từ API backend `revokeSessionUseCase`).
    - `Đã đăng xuất thiết bị thành công.` (thông điệp fallback phía client `useSessionMutations`).
- **Thiết bị vs Phiên đăng nhập:**
  - Tiêu đề tính năng kết hợp cả hai: `Thiết bị & Phiên đăng nhập` (ở cả sidebar nav và tiêu đề trang).
  - Nút bấm và modal nhấn mạnh vào đơn vị `thiết bị`: `Đăng xuất tất cả thiết bị khác`, `khoảng ${otherSessionsCount} thiết bị`.
  - Huy hiệu trạng thái trên dòng lại dùng từ `phiên`: `Phiên hiện tại` (không dùng `Thiết bị hiện tại`).
- **Thành công / Lỗi:**
  - Tiêu đề toast thông báo kết quả sử dụng ngắn gọn: `Thành công` (màu `teal`) và `Lỗi` (màu `red`).

### Hiện trạng kỹ thuật quan sát được
- **Cơ chế phân quyền và bảo vệ giao diện:**
  - Người dùng truy cập route `/dashboard/settings/sessions` phải có session hợp lệ và thuộc vai trò sinh viên/user thông thường. Vai trò admin và supporter có điều hướng riêng (`DashboardLayout`).
  - Phiên hiện tại (`session.isCurrent === true`) được bảo vệ 2 lớp: phía UI hoàn toàn không render nút `Đăng xuất`, và phía API backend nếu nhận request xóa phiên hiện tại sẽ chặn bằng lỗi 400.
- **Thao tác không cần mật khẩu xác nhận:** Cả hai thao tác xóa 1 phiên và xóa toàn bộ phiên khác đều không yêu cầu nhập lại mật khẩu hiện tại, giúp quy trình thao tác nhanh gọn nhưng tiềm ẩn rủi ro nếu người khác đang ngồi trước máy đã mở sẵn tài khoản.
- **Tính tái sử dụng cao:** Toàn bộ component `SessionsList`, `SessionItem`, `RevokeOthersModal`, và các hooks `useSessionQueries`, `useSessionMutations` được viết dạng modular và được tái sử dụng trực tiếp tại trang dành cho Supporter (`/supporter/settings/sessions`).
- **Phân tích User-Agent phía client/shared validation:** Regex nhận diện hệ điều hành và trình duyệt nằm trong package `@repo/validation`, hỗ trợ nhận diện các trình duyệt phổ biến tại Việt Nam (bao gồm cả trình duyệt `Cốc Cốc` qua regex `/coc_coc/i`).
- **Đồng bộ dữ liệu thời gian thực qua TanStack Query:** Sau khi hoàn thành mutation xóa phiên (bất kể thành công hay bị lỗi 404 do phiên đã hết hạn trước đó), query key `["profile", "sessions"]` luôn được invalidate tại callback `onSettled` để kích hoạt làm mới danh sách tức thì.

### Điểm chưa xác minh (Unknowns / Questions)
- **Thiếu phân trang khi số lượng phiên lớn:** Backend `listSessionsUseCase` áp dụng giới hạn cứng `take: 100` mà không hỗ trợ phân trang hay infinite scroll. Nếu người dùng đăng nhập qua hơn 100 thiết bị/phiên, các phiên cũ từ 101 trở đi sẽ không thể xem hoặc thu hồi trực tiếp từ danh sách hiển thị.
- **Độ lệch số lượng thiết bị trong modal:** Con số hiển thị trong modal `(khoảng ${otherSessionsCount} thiết bị)` được tính toán dựa trên state client cục bộ tại thời điểm mở modal. Khi backend xử lý thực tế qua lệnh `prisma.session.deleteMany`, số lượng thực tế bị xóa (`result.count`) có thể khác nếu có phiên vừa hết hạn tự nhiên hoặc bị xóa từ tab khác.
- **Không có tính năng đặt tên gợi nhớ cho thiết bị:** Phiên đăng nhập chỉ hiển thị tên hệ điều hành, trình duyệt và IP được suy diễn từ User-Agent chứ không cho phép người dùng tự đặt tên gợi nhớ (ví dụ: `Laptop cá nhân`, `Máy bàn cơ quan`), có thể gây khó khăn trong việc phân biệt nếu người dùng sử dụng cùng một loại thiết bị/trình duyệt trên nhiều địa điểm khác nhau.
- **Bất đồng bộ từ ngữ giữa client fallback và backend response:** Khi thu hồi thành công 1 phiên đăng nhập, nếu nhận được message từ API thì toast hiện `Đã thu hồi phiên đăng nhập thành công`, còn nếu dùng fallback client thì hiện `Đã đăng xuất thiết bị thành công.`. Cần thống nhất sử dụng một động từ chuẩn (`đăng xuất` hoặc `thu hồi`).
