# Page: Supporter workspace (Hồ sơ phụ trách)

## Layer 1: Page Context

- **Route:** `/supporter`
- **Access:** `Supporter` authenticated route. `SupporterLayout` (`apps/web-1/app/supporter/layout.tsx:9–33`) checks session via `useSession()`. If the session check is pending (`isPending`), it renders `LoadingScreen` with message `Đang kiểm tra quyền Supporter...`. If no session is present, it redirects to `/auth`. If a session exists but `session.user.role !== "supporter"`, it redirects to `/dashboard`. Once authenticated as `supporter`, it renders children inside `DashboardShell`.
- **User:**
  - **Primary user:** Người dùng có vai trò Supporter (chuyên gia phản biện / cố vấn phản biện đề án khởi nghiệp của sinh viên).
  - **Typical state:** Đã đăng nhập vào tài khoản Supporter, truy cập không gian làm việc để quản lý các hồ sơ được phân công, tìm kiếm, lọc theo trạng thái nội bộ, theo dõi tiến độ và chọn hồ sơ để thực hiện phản biện (`apps/web-1/app/supporter/page.tsx:14–120`).
  - **Knowledge level:** Người dùng chuyên môn, hiểu rõ quy trình phản biện, các tiêu chí đánh giá đề án khởi nghiệp và luồng trạng thái xử lý hồ sơ.
- **User goals:**
  - Xem danh sách các hồ sơ được phân công phụ trách (`Hồ sơ phụ trách`).
  - Tìm kiếm hồ sơ theo mã hồ sơ hoặc tên nhóm (`apps/web-1/app/dashboard/_components/CaseListFilters.tsx:58–66`).
  - Lọc hồ sơ theo 6 trạng thái nghiệp vụ nội bộ của Supporter (`Đã phân công`, `Đang phản biện`, `Chờ sinh viên`, `Đã giao`, `Hoàn thành`, `Đã hủy`) (`CaseListFilters.tsx:6–13, 67–76`).
  - Sắp xếp danh sách hồ sơ theo thời gian tạo, mã hồ sơ hoặc tên nhóm (`CaseListFilters.tsx:28–35, 77–85`).
  - Tải lại danh sách hồ sơ bằng nút `Tải lại` để cập nhật dữ liệu mới nhất mà không cần tải lại toàn bộ trang (`apps/web-1/app/supporter/page.tsx:52–59`).
  - Bấm vào một thẻ hồ sơ (`CaseCard`) để điều hướng vào không gian làm việc chi tiết của hồ sơ đó (`/supporter/case/[id]`), nơi thực hiện các hành động nhận case, bắt đầu phản biện, yêu cầu sinh viên bổ sung thông tin hoặc tải lên tài liệu output (`apps/web-1/app/supporter/page.tsx:107–110`).
- **Business / Product goals:**
  - Cung cấp không gian làm việc tập trung, chuyên nghiệp và rõ ràng cho Supporter để quản lý các hồ sơ được giao.
  - Tối ưu hóa thời gian xử lý phản biện (SLA) thông qua bộ lọc trạng thái chính xác và truy cập nhanh vào từng case.
  - Phân tách quyền hạn và dữ liệu nghiêm ngặt giữa sinh viên (`/dashboard`), supporter (`/supporter`), và admin (`/admin`).
- **Primary action:** Bấm vào thẻ hồ sơ (`CaseCard`) từ danh sách để chuyển hướng đến trang chi tiết hồ sơ phía Supporter (`/supporter/case/{item.id}`) (`apps/web-1/app/supporter/page.tsx:107–110`).
- **Secondary actions:**
  - Bấm nút `Tải lại` để refetch dữ liệu từ API `/cases` (`apps/web-1/app/supporter/page.tsx:52–59`).
  - Nhập từ khóa tìm kiếm theo mã hồ sơ hoặc tên nhóm (`CaseListFilters.tsx:58–66`).
  - Chọn bộ lọc trạng thái hồ sơ từ dropdown `Trạng thái` (`CaseListFilters.tsx:67–76`).
  - Chọn tiêu chí sắp xếp từ dropdown `Sắp xếp` (`CaseListFilters.tsx:77–85`).
  - Chuyển trang qua thanh phân trang `Pagination` khi tổng số hồ sơ vượt quá 20 (`apps/web-1/app/supporter/page.tsx:112–116`).
  - Mở menu thông báo (`NotificationBell`), xem danh sách thông báo và bấm `Đánh dấu tất cả đã đọc` (`apps/web-1/components/layout/NotificationBell.tsx:27–114`).
  - Bật/tắt chế độ giao diện sáng/tối qua `ThemeToggler` (`apps/web-1/components/ui/ThemeToggler.tsx:23–32`).
  - Mở menu tài khoản (`UserMenu`), điều hướng đến `Trang chủ` (`/supporter`), `Cài đặt` (`/supporter/settings`), hoặc bấm `Đăng xuất` (`apps/web-1/components/layout/_components/UserMenu.tsx:68–148`).
- **Entry:**
  - Sau khi đăng nhập thành công với tài khoản có quyền `supporter` (`[Assumption / Cần xác minh]` luồng redirect sau đăng nhập tại `/auth`).
  - Bấm Logo hoặc mục `Trang chủ` từ header/menu tài khoản trong `DashboardShell` (`DashboardShell.tsx:33–46`; `UserMenu.tsx:43–47, 68–76`).
  - Nhập trực tiếp URL `/supporter` trên thanh địa chỉ trình duyệt.
- **Exit / next step:**
  - Chọn thẻ hồ sơ: chuyển hướng đến `/supporter/case/{item.id}` (`CaseCard.tsx:39`).
  - Chọn `Cài đặt` trong menu tài khoản: chuyển hướng đến `/supporter/settings` (`UserMenu.tsx:39–41, 73–75`).
  - Bấm `Đăng xuất`: gọi API `signOut`, xóa query cache và chuyển hướng về `/auth` (`UserMenu.tsx:49–59`).
  - Chọn một thông báo có link trong dropdown thông báo: chuyển hướng đến URL của thông báo đó (`NotificationBell.tsx:21–24`).
- **Product facts / constraints:**
  - Route `/supporter` được bọc bởi `SupporterLayout` (`apps/web-1/app/supporter/layout.tsx:9–33`): nếu `isPending` hiển thị `LoadingScreen` với `Đang kiểm tra quyền Supporter...`; nếu chưa đăng nhập điều hướng về `/auth`; nếu vai trò khác `supporter` điều hướng về `/dashboard`.
  - `SupporterDashboard` gọi hook `useCasesList` với các tham số: `page`, `limit: 20` (`PAGE_SIZE = 20`), `search: debouncedSearch` (debounce 300ms), `internal_status: stage ?? undefined`, `sortBy`, `sortOrder` (`apps/web-1/app/supporter/page.tsx:12–33`).
  - Khác với trang sinh viên (`/dashboard`), trang Supporter truyền `stageOptions={SUPPORTER_STATUS_OPTIONS}` vào `CaseListFilters`, gồm 6 trạng thái nội bộ: `assigned` ("Đã phân công"), `supporter_working` ("Đang phản biện"), `waiting_user` ("Chờ sinh viên"), `report_ready_to_publish` ("Đã giao"), `done` ("Hoàn thành"), `cancelled` ("Đã hủy") (`CaseListFilters.tsx:6–13, 74`).
  - Trang có 5 nhánh hiển thị trạng thái danh sách:
    1. `isLoading`: hiển thị 3 `LoadingSkeleton` dạng thẻ (`page.tsx:76–79`).
    2. `error`: hiển thị thông báo lỗi `Không thể tải danh sách hồ sơ. Vui lòng thử lại sau.` (`page.tsx:80–84`).
    3. `total === 0 && hasActiveFilters` (có từ khóa tìm kiếm hoặc lọc trạng thái): hiển thị khung rỗng `Không tìm thấy hồ sơ phù hợp.` (`page.tsx:86–89`).
    4. `total === 0 && !hasActiveFilters`: hiển thị panel rỗng với icon `ClipboardList`, tiêu đề `Không có hồ sơ nào được phân công` và mô tả `Không có hồ sơ cần phản biện — tất cả đã được xử lý hoặc chưa có phân công mới.` (`page.tsx:90–104`).
    5. `total > 0`: hiển thị lưới thẻ `CaseCard` (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) và thanh phân trang `Pagination` nếu `totalPages > 1` (`page.tsx:107–117`).
  - Thẻ `CaseCard` nhận prop `hrefPrefix="/supporter/case"`, tạo link điều hướng dạng `/supporter/case/{item.id}` (`page.tsx:109`; `CaseCard.tsx:13, 39`).
  - Trong `CaseCard`, nhãn trạng thái chính được lấy từ `item.user_facing_stage` ánh xạ qua `statusThemeMap`; nhãn thanh toán được lấy từ `item.payment_status` (chỉ hiển thị khi `credit_balance <= 0`); nếu có credit (`credit_balance > 0`) hiển thị badge `Có {item.credit_balance} credit` (`CaseCard.tsx:26–64`).
  - **Sự thật mã nguồn về phạm vi tính năng:** Tại route `/supporter`, giao diện thuần túy là danh sách hồ sơ phụ trách kèm bộ lọc và tìm kiếm; không có widget thống kê số liệu tổng quan (KPI metrics cards) và không có các nút thao tác nhận case / chuyển đổi trạng thái trực tiếp trên từng thẻ danh sách. Các hành động nghiệp vụ chuyển đổi trạng thái (`T7_START_WORK`, `T8_REQUEST_INFO`, `T10_START_REVIEW_REVISION`, `T11_SUBMIT_OUTPUT`) được thực hiện bên trong trang chi tiết `/supporter/case/[id]`.

---

## Layer 2: Interactive Inventory

### 2.1 Route guard and supporter layout navigation shell

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| supporter.auth.loading | `SupporterLayout` > `LoadingScreen` (`apps/web-1/app/supporter/layout.tsx:24–26`) | Description | Đang kiểm tra quyền Supporter... | — | `isPending` session branch |
| supporter.shell.logo.alt | `DashboardShell` > `nav` > `Link` > `Logo` > `<img>` (`apps/web-1/components/layout/DashboardShell.tsx:44–46`; `Logo.tsx:23–29`) | Alt text | Nexus Logo | `/supporter` for the supporter role | default; logo source is `/logo/Black_Colored.svg` or `/logo/White_Colored.svg` according to theme |
| supporter.notifications.trigger | `DashboardShell` > `NotificationBell` > `ActionIcon` (`apps/web-1/components/layout/NotificationBell.tsx:27–50`) | Aria-label | Thông báo | Opens/closes notification dropdown `Menu` | default |
| supporter.notifications.unreadCount | `NotificationBell` > bell `Badge` (`NotificationBell.tsx:39–48`) | Badge | `<code>{unreadCount}</code>` or `99+` | — | rendered only when `unreadCount > 0`; displays `99+` when unread count exceeds 99 |
| supporter.notifications.title | `NotificationBell` > `Menu.Dropdown` header (`NotificationBell.tsx:53–55`) | Heading | Thông báo | — | notification menu open |
| supporter.notifications.empty | `NotificationBell` > empty menu body (`NotificationBell.tsx:57–60`) | Empty state | Không có thông báo | — | `items.length === 0` |
| supporter.notifications.itemTitle | `NotificationBell` > notification item > title (`NotificationBell.tsx:84–86`) | Item | `<code>{n.title}</code>` | Marks notification `<code>n.id</code>` as read, then routes to `<code>n.link</code>` if link is non-null | one row for each API-supplied notification |
| supporter.notifications.itemBody | `NotificationBell` > notification item > body (`NotificationBell.tsx:87–94`) | Description | `<code>{n.body}</code>` | Parent notification-item action | rendered only when `n.body` is truthy |
| supporter.notifications.itemTime | `NotificationBell` > notification item > relative timestamp (`NotificationBell.tsx:95–97`) | Item | `<code>dayjs(n.created_at).fromNow()</code>` | Parent notification-item action | API-supplied date formatted through Day.js with Vietnamese locale |
| supporter.notifications.markAllRead | `NotificationBell` > menu footer button (`NotificationBell.tsx:104–113`) | CTA | Đánh dấu tất cả đã đọc | Calls `markAllRead.mutate()` → `PATCH /notifications/read-all` | rendered whenever menu is open; disabled when `unreadCount === 0` |
| supporter.theme.toggle | `DashboardShell` > `ThemeToggler` > `ActionIcon` (`apps/web-1/components/ui/ThemeToggler.tsx:23–32`) | Aria-label | Toggle theme | Toggles between `dark` and `light` mode | invisible icon before client mount; interactive after mount |
| supporter.userMenu.trigger | `DashboardShell` > `UserMenu` > account button (`apps/web-1/components/layout/_components/UserMenu.tsx:91–106`) | Aria-label | Tài khoản | Toggles account `Popover` | `UserMenu` returns `null` while session is pending or user is absent |
| supporter.userMenu.avatarAlt | `UserMenu` > `Avatar` (`UserMenu.tsx:97–105`) | Alt text | `<code>{user.name}</code>` or `User` | Parent account-button action | API/session user name; fallback `User` when name is absent |
| supporter.userMenu.avatarInitials | `UserMenu` > `Avatar` fallback children (`UserMenu.tsx:103–105`) | Item | `<code>{user.name?.substring(0, 2).toUpperCase()}</code>` or `US` | Parent account-button action | rendered as avatar fallback when image is unavailable |
| supporter.userMenu.email | `UserMenu` > popover identity block (`UserMenu.tsx:111–115`) | Item | `<code>{user.email}</code>` or `—` | — | API/session email; fallback `—` when absent |
| supporter.userMenu.home | `UserMenu` > navigation option (`UserMenu.tsx:68–76, 128–139`) | Navigation | Trang chủ | `/supporter` for supporter role; closes Popover | account-menu option |
| supporter.userMenu.settings | `UserMenu` > navigation option (`UserMenu.tsx:39–41, 73–76, 128–139`) | Navigation | Cài đặt | `/supporter/settings` for supporter role; closes Popover | supporter-specific settings destination |
| supporter.userMenu.signOut | `UserMenu` > sign-out button (`UserMenu.tsx:49–59, 141–148`) | CTA | Đăng xuất | Calls `signOut`; on success clears query cache, replaces route with `/auth`, then refreshes | account-menu option |

### 2.2 Supporter workspace header and toolbar

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| supporter.header.title | `SupporterDashboard` > page header > `<h1>` (`apps/web-1/app/supporter/page.tsx:44–46`) | Heading | Hồ sơ phụ trách | — | default |
| supporter.header.description | `SupporterDashboard` > page header > `<p>` (`page.tsx:47–49`) | Description | Đánh giá, phản biện logic ý tưởng khởi nghiệp và hỗ trợ chuyên môn cho sinh viên. | — | default |
| supporter.header.refresh | `SupporterDashboard` > header toolbar > `Button` (`page.tsx:52–59`) | CTA | Tải lại | Calls `refetch()` from `useCasesList` to refresh case data | default; leftSection icon `RefreshCw` |

### 2.3 Case list filters and sort controls

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| supporter.filters.search.label | `CaseListFilters` > search `TextInput` (`apps/web-1/app/dashboard/_components/CaseListFilters.tsx:58–66`) | Label | Tìm kiếm | Calls `setSearch`; value is debounced 300ms for `GET /cases` | always rendered |
| supporter.filters.search.placeholder | `CaseListFilters` > search `TextInput` (`CaseListFilters.tsx:60`) | Placeholder | Tìm theo mã hồ sơ hoặc tên nhóm... | Updates search input text | always rendered; leftSection icon `Search` |
| supporter.filters.stage.label | `CaseListFilters` > stage `Select` (`CaseListFilters.tsx:67–76`) | Label | Trạng thái | Calls `setStage`; value is passed as `internal_status` to `GET /cases` | always rendered; clearable |
| supporter.filters.stage.placeholder | `CaseListFilters` > stage `Select` (`CaseListFilters.tsx:69`) | Placeholder | Tất cả | Clears stage filter when selected/cleared | shown when no stage filter is selected |
| supporter.filters.stage.assigned | `CaseListFilters` > `Trạng thái` option `assigned` (`CaseListFilters.tsx:6–13`) | Item | Đã phân công | Selects filter `assigned` | dropdown option in `SUPPORTER_STATUS_OPTIONS` |
| supporter.filters.stage.supporterWorking | `CaseListFilters` > `Trạng thái` option `supporter_working` (`CaseListFilters.tsx:6–13`) | Item | Đang phản biện | Selects filter `supporter_working` | dropdown option in `SUPPORTER_STATUS_OPTIONS` |
| supporter.filters.stage.waitingUser | `CaseListFilters` > `Trạng thái` option `waiting_user` (`CaseListFilters.tsx:6–13`) | Item | Chờ sinh viên | Selects filter `waiting_user` | dropdown option in `SUPPORTER_STATUS_OPTIONS` |
| supporter.filters.stage.reportReadyToPublish | `CaseListFilters` > `Trạng thái` option `report_ready_to_publish` (`CaseListFilters.tsx:6–13`) | Item | Đã giao | Selects filter `report_ready_to_publish` | dropdown option in `SUPPORTER_STATUS_OPTIONS` |
| supporter.filters.stage.done | `CaseListFilters` > `Trạng thái` option `done` (`CaseListFilters.tsx:6–13`) | Item | Hoàn thành | Selects filter `done` | dropdown option in `SUPPORTER_STATUS_OPTIONS` |
| supporter.filters.stage.cancelled | `CaseListFilters` > `Trạng thái` option `cancelled` (`CaseListFilters.tsx:6–13`) | Item | Đã hủy | Selects filter `cancelled` | dropdown option in `SUPPORTER_STATUS_OPTIONS` |
| supporter.filters.sort.label | `CaseListFilters` > sort `Select` (`CaseListFilters.tsx:77–85`) | Label | Sắp xếp | Calls `setSortBy` and `setSortOrder` based on parsed key | always rendered; allowDeselect is `false` |
| supporter.filters.sort.createdAtDesc | `CaseListFilters` > `Sắp xếp` option `created_at_desc` (`CaseListFilters.tsx:28–35`) | Item | Mới nhất | Selects sort by `created_at` descending | default sort option |
| supporter.filters.sort.createdAtAsc | `CaseListFilters` > `Sắp xếp` option `created_at_asc` (`CaseListFilters.tsx:28–35`) | Item | Cũ nhất | Selects sort by `created_at` ascending | dropdown option in `STUDENT_SORT_OPTIONS` |
| supporter.filters.sort.caseCodeAsc | `CaseListFilters` > `Sắp xếp` option `case_code_asc` (`CaseListFilters.tsx:28–35`) | Item | Mã hồ sơ (A-Z) | Selects sort by `case_code` ascending | dropdown option in `STUDENT_SORT_OPTIONS` |
| supporter.filters.sort.caseCodeDesc | `CaseListFilters` > `Sắp xếp` option `case_code_desc` (`CaseListFilters.tsx:28–35`) | Item | Mã hồ sơ (Z-A) | Selects sort by `case_code` descending | dropdown option in `STUDENT_SORT_OPTIONS` |
| supporter.filters.sort.teamNameAsc | `CaseListFilters` > `Sắp xếp` option `team_name_asc` (`CaseListFilters.tsx:28–35`) | Item | Tên nhóm (A-Z) | Selects sort by `team_name` ascending | dropdown option in `STUDENT_SORT_OPTIONS` |
| supporter.filters.sort.teamNameDesc | `CaseListFilters` > `Sắp xếp` option `team_name_desc` (`CaseListFilters.tsx:28–35`) | Item | Tên nhóm (Z-A) | Selects sort by `team_name` descending | dropdown option in `STUDENT_SORT_OPTIONS` |

### 2.4 State branches and empty states

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| supporter.loading.cards | `SupporterDashboard` > `LoadingSkeleton` (`apps/web-1/app/supporter/page.tsx:76–79`) | Description | — | — | `isLoading` branch; `variant="card"`, `count={3}` |
| supporter.error.cases | `SupporterDashboard` > error banner (`page.tsx:80–84`) | Error | Không thể tải danh sách hồ sơ. Vui lòng thử lại sau. | — | `error` branch after loading completes; icon `AlertCircle` |
| supporter.filteredEmpty | `SupporterDashboard` > filtered-empty panel (`page.tsx:86–89`) | Empty state | Không tìm thấy hồ sơ phù hợp. | — | `total === 0` and `hasActiveFilters` is true (`debouncedSearch` or `stage`) |
| supporter.empty.heading | `SupporterDashboard` > unfiltered empty state > `<h4>` (`page.tsx:96–98`) | Empty state | Không có hồ sơ nào được phân công | — | `total === 0` and `hasActiveFilters` is false |
| supporter.empty.description | `SupporterDashboard` > unfiltered empty state > `<p>` (`page.tsx:99–101`) | Description | Không có hồ sơ cần phản biện — tất cả đã được xử lý hoặc chưa có phân công mới. | — | unfiltered empty branch; icon `ClipboardList` |

### 2.5 Case card list and pagination

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| supporter.caseCard.link | `CaseCard` > wrapper `Link` (`apps/web-1/app/dashboard/_components/CaseCard.tsx:39`) | CTA | — | `/supporter/case/{item.id}` | default; wrap toàn bộ thẻ hồ sơ với `hrefPrefix="/supporter/case"` |
| supporter.caseCard.caseCode | `CaseCard` > case code `<span>` (`CaseCard.tsx:43–45`) | Item | `<code>{item.case_code}</code>` | Parent card navigation | API-supplied case code (uppercase) |
| supporter.caseCard.teamName | `CaseCard` > team name `<h3>` (`CaseCard.tsx:47–49`) | Heading | `<code>{item.team_name}</code>` or `Hồ sơ chưa đặt tên nhóm` | Parent card navigation | API team name; fallback `Hồ sơ chưa đặt tên nhóm` when empty/null |
| supporter.caseCard.stageBadge | `CaseCard` > user-facing stage `Badge` (`CaseCard.tsx:52–54`) | Badge | `<code>{userFacingStatusBadge.label}</code>` | — | label mapped from `statusThemeMap[item.user_facing_stage]` (or raw status fallback) |
| supporter.caseCard.paymentBadge | `CaseCard` > payment status `Badge` (`CaseCard.tsx:55–59`) | Badge | `<code>{paymentBadge.label}</code>` | — | rendered when `(item.credit_balance ?? 0) <= 0`; label mapped from `statusThemeMap[item.payment_status]` |
| supporter.caseCard.creditBadge | `CaseCard` > credit balance `Badge` (`CaseCard.tsx:60–64`) | Badge | Có `<code>{item.credit_balance}</code>` credit | — | rendered when `(item.credit_balance ?? 0) > 0`; color is `teal` |
| supporter.caseCard.packageName | `CaseCard` > package name `<span>` (`CaseCard.tsx:69–71`) | Item | `<code>{item.package?.name}</code>` or `Gói dịch vụ` | — | API-supplied package name; fallback `Gói dịch vụ` when absent |
| supporter.caseCard.createdDate | `CaseCard` > submission date `<span>` (`CaseCard.tsx:72–74`) | Item | Ngày nộp hồ sơ: `<code>{formatDate(item.created_at)}</code>` | — | creation date formatted as `DD/MM/YYYY` in `vi-VN` locale |
| supporter.caseCard.schoolContext | `CaseCard` > school / course block (`CaseCard.tsx:76–80`) | Item | `<code>{item.school} {item.course_context ? `(${item.course_context})` : ""}</code>` | — | rendered when `item.school` exists |
| supporter.caseCard.schoolPlaceholder | `CaseCard` > school placeholder (`CaseCard.tsx:81`) | Item | placeholder | — | rendered as invisible element with class `invisible` when `!item.school` |
| supporter.pagination.root | `SupporterDashboard` > `Pagination` (`apps/web-1/app/supporter/page.tsx:112–116`) | Navigation | — | Updates current `page` state (1 to `totalPages`) | rendered only when `totalPages > 1`; color `brand`, size `sm` |

---

## Layer 3: Page Notes

- **Biến thể thuật ngữ quan sát được:**
  - `Hồ sơ phụ trách` xuất hiện ở tiêu đề chính của trang (`apps/web-1/app/supporter/page.tsx:45`), phân biệt với `Hồ sơ phản biện` ở trang sinh viên (`apps/web-1/app/dashboard/page.tsx:47`).
  - `phân công` xuất hiện ở nhiều ngữ cảnh: trạng thái bộ lọc `Đã phân công` (`assigned`), tiêu đề rỗng `Không có hồ sơ nào được phân công`, và mô tả rỗng `chưa có phân công mới` (`page.tsx:97–100`; `CaseListFilters.tsx:7`).
  - **Sự khác biệt giữa nhãn bộ lọc nội bộ (`SUPPORTER_STATUS_OPTIONS`) và nhãn hiển thị trên badge (`statusThemeMap`):**
    - Key `supporter_working`: trong dropdown lọc ghi là `Đang phản biện` (`CaseListFilters.tsx:8`), nhưng trong `statusThemeMap` định nghĩa là `Supporter đang xử lý` (`apps/web-1/types/case.ts:326`).
    - Key `waiting_user`: trong dropdown lọc ghi là `Chờ sinh viên` (`CaseListFilters.tsx:9`), nhưng trong `statusThemeMap` định nghĩa là `Chờ phản hồi` (`apps/web-1/types/case.ts:322`).
    - Key `report_ready_to_publish`: trong dropdown lọc ghi là `Đã giao` (`CaseListFilters.tsx:10`), nhưng trong `statusThemeMap` định nghĩa là `Báo cáo chờ gửi` (`apps/web-1/types/case.ts:330`).
    - Key `assigned`: cả dropdown lọc và `statusThemeMap` đều ghi là `Đã phân công` (`CaseListFilters.tsx:7`; `types/case.ts:318`).
    - Key `done`: cả dropdown lọc và `statusThemeMap` đều ghi là `Hoàn thành` (`CaseListFilters.tsx:11`; `types/case.ts:334`).
    - Key `cancelled`: cả dropdown lọc và `statusThemeMap` đều ghi là `Đã hủy` (`CaseListFilters.tsx:12`; `types/case.ts:338`).
  - `ý tưởng khởi nghiệp` xuất hiện trong mô tả trang (`page.tsx:48`), đồng nhất với mô tả ở trang sinh viên.
  - `sinh viên` được dùng rõ ràng trong mô tả trang (`hỗ trợ chuyên môn cho sinh viên`) và bộ lọc (`Chờ sinh viên`), đối ứng với vai trò Supporter.
  - `credit` và `VND`: xuất hiện trên thẻ hồ sơ khi có credit (`Có {item.credit_balance} credit`) và trong các nhãn thanh toán.

- **Hành vi code đã quan sát:**
  - **Kiểm soát quyền truy cập client-side:** `SupporterLayout` (`apps/web-1/app/supporter/layout.tsx:13–30`) xử lý 3 trường hợp:
    - Khi đang tải session (`isPending`): hiển thị toàn màn hình `LoadingScreen` với chữ `Đang kiểm tra quyền Supporter...`.
    - Khi không có session: điều hướng về `/auth`.
    - Khi có session nhưng `user.role !== "supporter"`: chuyển hướng về `/dashboard` của sinh viên.
  - **Điều hướng DashboardShell theo vai trò:**
    - Logo ở thanh navbar kiểm tra vai trò: nếu `user?.role === "supporter"` thì đường dẫn chuyển về `/supporter` (`DashboardShell.tsx:35`).
    - `UserMenu` tự động ẩn khối `Số dư` và không hiển thị tùy chọn `Ví của tôi` vì `isStudent = !(user?.role === "admin" || user?.role === "supporter")` trả về `false` (`UserMenu.tsx:35, 70–72, 118–125`).
    - Mục `Cài đặt` trong `UserMenu` trỏ chính xác đến `/supporter/settings` (`UserMenu.tsx:39–41, 73–75`).
    - Mục `Trang chủ` trong `UserMenu` trỏ đến `/supporter` (`UserMenu.tsx:45, 69`).
  - **Tham số truy vấn danh sách (`useCasesList`):**
    - Trang gọi API `GET /cases` với `page`, `limit: 20`, `search: debouncedSearch` (được debounce 300ms), `internal_status: stage ?? undefined`, `sortBy`, `sortOrder` (`page.tsx:26–33`).
    - Khi người dùng thay đổi tìm kiếm, trạng thái lọc, hoặc cách sắp xếp, `useEffect` tự động reset trang về `1` (`page.tsx:22–24`).
  - **Phân biệt hai trạng thái rỗng:**
    - Khi `total === 0` và có filter (`debouncedSearch || stage`): hiển thị khung rỗng tinh gọn với chữ `Không tìm thấy hồ sơ phù hợp.` (`page.tsx:86–89`).
    - Khi `total === 0` và không có filter: hiển thị box rỗng lớn có icon `ClipboardList`, tiêu đề `Không có hồ sơ nào được phân công` và mô tả chi tiết (`page.tsx:91–103`).
  - **Nút Tải lại:** Sử dụng hàm `refetch()` từ react-query, có icon `RefreshCw`, cho phép supporter làm mới danh sách tức thì mà không cần reload trình duyệt (`page.tsx:52–59`).
  - **Phân định phạm vi tính năng thực tế:**
    - Mã nguồn của `apps/web-1/app/supporter/page.tsx` thuần túy là danh sách quản lý hồ sơ và bộ lọc.
    - Không có widget thống kê số liệu tổng quan (KPI cards/metrics).
    - Không có nút nhận case hoặc chuyển đổi trạng thái trực tiếp trên thẻ hồ sơ danh sách.
    - Mỗi thẻ `CaseCard` là một liên kết `Link` dẫn vào `/supporter/case/{item.id}` (`hrefPrefix="/supporter/case"`). Mọi hành động tiếp nhận case, bắt đầu phản biện (`startWork`), yêu cầu bổ sung thông tin (`requestMoreInfo`), tải tài liệu phản biện (`submitSupporterOutputUpload`), và xuất bản báo cáo đều nằm trong trang chi tiết `/supporter/case/[id]` (`apps/web-1/app/supporter/hooks/useSupporterActions.ts:16–48`; `apps/web-1/app/supporter/case/[id]/page.tsx`).

- **Điểm chưa xác minh (Unknowns / Questions):**
  - **Dữ liệu động từ API:** Các giá trị hiển thị trên thẻ như `item.case_code`, `item.team_name`, `item.package?.name`, `item.school`, `item.course_context`, `item.created_at`, `item.credit_balance`, `item.user_facing_stage`, `item.payment_status` được trả về từ API backend `/cases`. Mã nguồn frontend chỉ xác định các nhãn fallback mặc định (`Hồ sơ chưa đặt tên nhóm`, `Gói dịch vụ`, `placeholder`).
  - **Quy trình phân công hồ sơ:** `[Assumption / Cần xác minh]` Hiện tại chưa rõ từ mã nguồn giao diện supporter liệu hồ sơ được gán tự động từ hệ thống khi sinh viên thanh toán, hay do admin phân công thủ công qua trang admin, hay supporter có màn hình nhận hồ sơ chưa phân công nào khác.
  - **Hệ thống thông báo:** Supporter dùng chung component `NotificationBell` và các API thông báo (`/notifications`, `/notifications/unread-count`, `/notifications/read-all`) với sinh viên. Nội dung cụ thể của các thông báo gửi đến supporter được trả về động từ backend.
