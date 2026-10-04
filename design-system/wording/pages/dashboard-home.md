# Page: Dashboard home

## Layer 1: Page Context

- **Route:** `/dashboard`
- **Access:** `Authenticated` student route. `DashboardLayout` shows `Đang xác thực thông tin...` while the session is pending; pushes a missing session to `/auth`; and renders no dashboard content for `admin` or `supporter` before redirecting those roles (`apps/web-1/app/dashboard/layout.tsx:14–47`).
- **User:**
  - **Primary user:** A signed-in user whose role is neither `admin` nor `supporter`; the route-level guard leaves this role on `/dashboard` (`apps/web-1/app/dashboard/layout.tsx:16–27, 42–47`).
  - **Typical state:** Has an active session and can have zero, filtered-zero, loading, errored, or paginated case-list results (`apps/web-1/app/dashboard/page.tsx:29–41, 85–114`).
  - **Knowledge level:** `[Assumption / Cần xác minh]` No onboarding, analytics, or user-research signal is rendered by this route.
- **User goals:** View case records, search/filter/sort them, open a case detail, assess the team, or begin the package/intake path through the actions rendered on this page (`apps/web-1/app/dashboard/page.tsx:53–115`; `DashboardEmptyState.tsx:16–35`).
- **Business / Product goals:** The current UI exposes paths to `/dashboard/team-fit`, package selection, `/dashboard/intake`, case detail, wallet, settings, and sign-out. No KPI, conversion specification, or analytics event is defined in the examined route components (`apps/web-1/app/dashboard/page.tsx:53–67, 103–115`; `UserMenu.tsx:68–148`).
- **Primary action:** `[Assumption / Cần xác minh]` The main content is the case list headed `Hồ sơ phản biện`; when it has no unfiltered results, the rendered calls to action lead to team assessment or package selection (`apps/web-1/app/dashboard/page.tsx:45–50, 93–115`; `DashboardEmptyState.tsx:16–35`).
- **Secondary actions:** Search, filter, sort, change page; open notifications; switch theme; open account menu; navigate to wallet/settings; and sign out (`page.tsx:71–115`; `NotificationBell.tsx:14–115`; `ThemeToggler.tsx:8–34`; `UserMenu.tsx:68–148`).
- **Entry:** The dashboard-shell logo and the student account-menu item `Trang chủ` both target `/dashboard` (`DashboardShell.tsx:33–46`; `UserMenu.tsx:43–76`). The route that a successful authentication flow uses to enter this page is `[Assumption / Cần xác minh]` outside the examined dashboard route components.
- **Exit / next step:** Case cards link to `/dashboard/case/{item.id}`; team actions link to `/dashboard/team-fit`; the Basic package action routes to `/dashboard/intake?packageId=pkg_ai_audit`; the account menu can route to `/dashboard/wallet`, `/dashboard/settings`, or `/auth` after sign-out (`CaseCard.tsx:38–86`; `PackageSelectionModal.tsx:18–34, 80–87`; `UserMenu.tsx:49–64, 68–148`). Notification items may also route to their API-supplied `link` after being marked read (`NotificationBell.tsx:21–24, 63–100`).
- **Product facts / constraints:**
  - The page queries `GET /cases` with page size `20`, trimmed search text, selected stage, and sort fields. Search input is debounced by `300` ms; the default order is `created_at` descending (`apps/web-1/app/dashboard/page.tsx:15–40`; `hooks/useCasesList.ts:22–44`).
  - The page has distinct loading, request-error, filtered-empty, unfiltered-empty, populated-list, and multi-page branches (`page.tsx:85–114`).
  - `PackageSelectionModal` shows a Basic AI option priced `79,000 VND` and a disabled Premium option priced `149,000 VND` (`PackageSelectionModal.tsx:49–131`). The Basic route key is `pkg_ai_audit`; the Premium key is `pkg_supporter_audit` (`apps/web-1/lib/pricing.ts:3–7`).
  - Notification data is fetched from `/notifications?page=1&limit=20`; unread count is fetched from `/notifications/unread-count`; item and bulk read actions issue `PATCH` requests through `useNotifications` (`apps/web-1/lib/hooks/useNotifications.ts:13–30, 62–77`).
  - A case card always shows a user-facing-stage badge. It shows a payment-status badge only when `credit_balance` is not positive; otherwise it shows a credit badge (`CaseCard.tsx:26–64`).

## Layer 2: Interactive Inventory

### 2.1 Route access and shared dashboard shell

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| dashboard.auth.loading | `DashboardLayout` > `LoadingScreen` (`apps/web-1/app/dashboard/layout.tsx:32–34`) | Description | Đang xác thực thông tin... | — | `isPending` session branch |
| dashboard.shell.logo.alt | `DashboardShell` > `nav` > `Link` > `Logo` > `<img>` (`DashboardShell.tsx:42–46`; `Logo.tsx:23–29`) | Alt text | Nexus Logo | `/dashboard` for the student route | default; logo source is `/logo/Black_Colored.svg` or `/logo/White_Colored.svg` according to theme |
| dashboard.notifications.trigger | `DashboardShell` > `NotificationBell` > `ActionIcon` (`NotificationBell.tsx:27–50`) | Aria-label | Thông báo | Opens/closes the notification `Menu` | default |
| dashboard.notifications.unreadCount | `NotificationBell` > bell `Badge` (`NotificationBell.tsx:39–48`) | Badge | `<code>{unreadCount}</code>` or `99+` | — | rendered only when `unreadCount > 0`; `99+` when count is greater than `99` |
| dashboard.notifications.title | `NotificationBell` > `Menu.Dropdown` header (`NotificationBell.tsx:52–55`) | Heading | Thông báo | — | notification menu open |
| dashboard.notifications.empty | `NotificationBell` > empty menu body (`NotificationBell.tsx:57–60`) | Empty state | Không có thông báo | — | `items.length === 0` |
| dashboard.notifications.itemTitle | `NotificationBell` > notification item > title (`NotificationBell.tsx:63–100`) | Item | `<code>{n.title}</code>` | Marks notification `<code>n.id</code>` read, then routes to `<code>n.link</code>` when that link is non-null | one row for each API-supplied notification |
| dashboard.notifications.itemBody | `NotificationBell` > notification item > body (`NotificationBell.tsx:87–94`) | Description | `<code>{n.body}</code>` | Parent notification-item action | rendered only when `n.body` is truthy |
| dashboard.notifications.itemTime | `NotificationBell` > notification item > relative timestamp (`NotificationBell.tsx:95–97`) | Item | `<code>dayjs(n.created_at).fromNow()</code>` | Parent notification-item action | API-supplied date formatted through Day.js with Vietnamese locale |
| dashboard.notifications.markAllRead | `NotificationBell` > menu footer button (`NotificationBell.tsx:104–113`) | CTA | Đánh dấu tất cả đã đọc | Calls `markAllRead.mutate()` → `PATCH /notifications/read-all` | rendered whenever menu is open; disabled when `unreadCount === 0` |
| dashboard.theme.toggle | `DashboardShell` > `ThemeToggler` > `ActionIcon` (`ThemeToggler.tsx:16–32`) | Aria-label | Toggle theme | Switches `dark` to `light` or `light` to `dark` | invisible icon while not mounted; interactive after client mount |
| dashboard.userMenu.trigger | `DashboardShell` > `UserMenu` > account button (`UserMenu.tsx:78–107`) | Aria-label | Tài khoản | Toggles account `Popover` | `UserMenu` returns no UI while session is pending or user is absent |
| dashboard.userMenu.avatarAlt | `UserMenu` > `Avatar` (`UserMenu.tsx:97–105`) | Alt text | `<code>{user.name}</code>` or `User` | Parent account-button action | API/session name; fallback when name is absent |
| dashboard.userMenu.avatarInitials | `UserMenu` > `Avatar` fallback children (`UserMenu.tsx:103–105`) | Item | `<code>{user.name?.substring(0, 2).toUpperCase()}</code>` or `US` | Parent account-button action | rendered as Avatar fallback when image is unavailable |
| dashboard.userMenu.email | `UserMenu` > popover identity block (`UserMenu.tsx:109–115`) | Item | `<code>{user.email}</code>` or `—` | — | API/session email; fallback when absent |
| dashboard.userMenu.balanceLabel | `UserMenu` > wallet-balance block (`UserMenu.tsx:117–125`) | Label | Số dư | — | rendered when the user is a student and `walletData` exists |
| dashboard.userMenu.balanceValue | `UserMenu` > wallet-balance block (`UserMenu.tsx:121–123`) | Item | `<code>{walletBalance.toLocaleString("vi-VN")} VND</code>` | — | rendered with `dashboard.userMenu.balanceLabel` |
| dashboard.userMenu.home | `UserMenu` > navigation option (`UserMenu.tsx:68–76, 127–139`) | Navigation | Trang chủ | `/dashboard` for the student route; closes Popover | account-menu option |
| dashboard.userMenu.wallet | `UserMenu` > navigation option (`UserMenu.tsx:70–72, 127–139`) | Navigation | Ví của tôi | `/dashboard/wallet`; closes Popover | student-only option |
| dashboard.userMenu.settings | `UserMenu` > navigation option (`UserMenu.tsx:73–75, 127–139`) | Navigation | Cài đặt | `/dashboard/settings`; closes Popover | student-only option on this route |
| dashboard.userMenu.signOut | `UserMenu` > sign-out button (`UserMenu.tsx:49–59, 141–148`) | CTA | Đăng xuất | Calls `signOut`; on success clears query cache, replaces route with `/auth`, then refreshes | account-menu option |

### 2.2 Dashboard overview and list-result branches

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| dashboard.heading | `StudentDashboard` > page header > `<h1>` (`apps/web-1/app/dashboard/page.tsx:45–50`) | Heading | Hồ sơ phản biện | — | default |
| dashboard.description | `StudentDashboard` > page header > `<p>` (`page.tsx:47–50`) | Description | Quản lý các hồ sơ phản biện ý tưởng khởi nghiệp. | — | default |
| dashboard.toolbar.teamFit | `StudentDashboard` > header toolbar > `Link` (`page.tsx:53–67`) | CTA | Đánh giá đội ngũ | `/dashboard/team-fit` | rendered when not loading and either `total > 0` or a search/stage filter is active |
| dashboard.toolbar.package | `StudentDashboard` > header toolbar > button (`page.tsx:53–67`) | CTA | Mua gói kiểm tra | Opens the page-level `PackageSelectionModal` | rendered under the same toolbar condition |
| dashboard.loading.cards | `StudentDashboard` > `LoadingSkeleton` (`page.tsx:85–88`) | Description | — | — | `isLoading`; `variant="card"`, `count={3}`, and no text is supplied by this route |
| dashboard.error.cases | `StudentDashboard` > error banner (`page.tsx:89–92`) | Error | Không thể tải danh sách hồ sơ. Vui lòng thử lại sau. | — | `error` branch after loading completes |
| dashboard.filteredEmpty | `StudentDashboard` > filtered-empty panel (`page.tsx:93–100`) | Empty state | Không tìm thấy hồ sơ phù hợp. | — | `total === 0` and a debounced search or stage filter is active |
| dashboard.empty.heading | `DashboardEmptyState` > `<h3>` (`DashboardEmptyState.tsx:16–19`) | Empty state | Chưa có hồ sơ phản biện nào | — | `total === 0` with no active search/stage filter |
| dashboard.empty.description | `DashboardEmptyState` > `<p>` (`DashboardEmptyState.tsx:17–19`) | Description | Đánh giá đội ngũ khởi nghiệp của bạn trước, sau đó tạo hồ sơ phản biện với các checkpoint chuẩn. | — | unfiltered-empty branch |
| dashboard.empty.teamFit | `DashboardEmptyState` > `Link` (`DashboardEmptyState.tsx:21–27`) | CTA | Đánh giá đội ngũ miễn phí | `/dashboard/team-fit` | unfiltered-empty branch |
| dashboard.empty.package | `DashboardEmptyState` > button (`DashboardEmptyState.tsx:28–35`) | CTA | Bắt đầu kiểm tra dự án | Opens the empty-state `PackageSelectionModal` | unfiltered-empty branch |

### 2.3 Case-list filters

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| dashboard.filters.search.label | `CaseListFilters` > search `TextInput` (`CaseListFilters.tsx:57–66`) | Label | Tìm kiếm | Calls `setSearch`; parent debounces the value for `GET /cases` | always rendered |
| dashboard.filters.search.placeholder | `CaseListFilters` > search `TextInput` (`CaseListFilters.tsx:58–65`) | Placeholder | Tìm theo mã hồ sơ hoặc tên nhóm... | Same search-input action | always rendered |
| dashboard.filters.stage.label | `CaseListFilters` > stage `Select` (`CaseListFilters.tsx:67–76`) | Label | Trạng thái | Calls `setStage`; parent sends `stage` to `GET /cases` | always rendered; clearable |
| dashboard.filters.stage.placeholder | `CaseListFilters` > stage `Select` (`CaseListFilters.tsx:68–75`) | Placeholder | Tất cả | Selects no stage filter when cleared | shown when no stage is selected |
| dashboard.filters.stage.intakePending | `CaseListFilters` > `Trạng thái` option `intake_pending` (`CaseListFilters.tsx:14–26`) | Item | Chờ kích hoạt | Selects `intake_pending` | dropdown option |
| dashboard.filters.stage.intakeReady | `CaseListFilters` > `Trạng thái` option `intake_ready` (`CaseListFilters.tsx:14–26`) | Item | Sẵn sàng cập nhật | Selects `intake_ready` | dropdown option |
| dashboard.filters.stage.submitted | `CaseListFilters` > `Trạng thái` option `submitted` (`CaseListFilters.tsx:14–26`) | Item | Chờ xét duyệt | Selects `submitted` | dropdown option |
| dashboard.filters.stage.needMoreInformation | `CaseListFilters` > `Trạng thái` option `need_more_information` (`CaseListFilters.tsx:14–26`) | Item | Cần bổ sung | Selects `need_more_information` | dropdown option |
| dashboard.filters.stage.underReview | `CaseListFilters` > `Trạng thái` option `under_review` (`CaseListFilters.tsx:14–26`) | Item | Đang phản biện | Selects `under_review` | dropdown option |
| dashboard.filters.stage.reportReady | `CaseListFilters` > `Trạng thái` option `report_ready` (`CaseListFilters.tsx:14–26`) | Item | Báo cáo sẵn sàng | Selects `report_ready` | dropdown option |
| dashboard.filters.stage.waitingForRevision | `CaseListFilters` > `Trạng thái` option `waiting_for_revision` (`CaseListFilters.tsx:14–26`) | Item | Chờ bản sửa | Selects `waiting_for_revision` | dropdown option |
| dashboard.filters.stage.revisionSubmitted | `CaseListFilters` > `Trạng thái` option `revision_submitted` (`CaseListFilters.tsx:14–26`) | Item | Đã nộp bản sửa | Selects `revision_submitted` | dropdown option |
| dashboard.filters.stage.completed | `CaseListFilters` > `Trạng thái` option `completed` (`CaseListFilters.tsx:14–26`) | Item | Hoàn thành | Selects `completed` | dropdown option |
| dashboard.filters.stage.rejected | `CaseListFilters` > `Trạng thái` option `rejected` (`CaseListFilters.tsx:14–26`) | Item | Bị từ chối | Selects `rejected` | dropdown option |
| dashboard.filters.stage.closed | `CaseListFilters` > `Trạng thái` option `closed` (`CaseListFilters.tsx:14–26`) | Item | Đã đóng | Selects `closed` | dropdown option |
| dashboard.filters.sort.label | `CaseListFilters` > sort `Select` (`CaseListFilters.tsx:77–85`) | Label | Sắp xếp | Calls parent sort handler; valid values update `sortBy` and `sortOrder` | always rendered; cannot deselect |
| dashboard.filters.sort.newest | `CaseListFilters` > `Sắp xếp` option `created_at_desc` (`CaseListFilters.tsx:28–35`) | Item | Mới nhất | Selects `created_at_desc` | default selected value |
| dashboard.filters.sort.oldest | `CaseListFilters` > `Sắp xếp` option `created_at_asc` (`CaseListFilters.tsx:28–35`) | Item | Cũ nhất | Selects `created_at_asc` | dropdown option |
| dashboard.filters.sort.caseCodeAsc | `CaseListFilters` > `Sắp xếp` option `case_code_asc` (`CaseListFilters.tsx:28–35`) | Item | Mã hồ sơ (A-Z) | Selects `case_code_asc` | dropdown option |
| dashboard.filters.sort.caseCodeDesc | `CaseListFilters` > `Sắp xếp` option `case_code_desc` (`CaseListFilters.tsx:28–35`) | Item | Mã hồ sơ (Z-A) | Selects `case_code_desc` | dropdown option |
| dashboard.filters.sort.teamNameAsc | `CaseListFilters` > `Sắp xếp` option `team_name_asc` (`CaseListFilters.tsx:28–35`) | Item | Tên nhóm (A-Z) | Selects `team_name_asc` | dropdown option |
| dashboard.filters.sort.teamNameDesc | `CaseListFilters` > `Sắp xếp` option `team_name_desc` (`CaseListFilters.tsx:28–35`) | Item | Tên nhóm (Z-A) | Selects `team_name_desc` | dropdown option |

### 2.4 Case cards, status badges, and pagination

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| dashboard.caseCard.link | `CaseCard` > outer `Link` > `Card` (`apps/web-1/app/dashboard/_components/CaseCard.tsx:38–86`) | Navigation | — | `/dashboard/case/{item.id}` | one card per `cases.map`; default `hrefPrefix` is `/dashboard/case` |
| dashboard.caseCard.code | `CaseCard` > case-code row (`CaseCard.tsx:41–45`) | Item | `<code>{item.case_code}</code>` | Parent card link | API case field |
| dashboard.caseCard.teamName | `CaseCard` > team-name heading (`CaseCard.tsx:46–49`) | Heading | `<code>{item.team_name}</code>` or Hồ sơ chưa đặt tên nhóm | Parent card link | fallback when `item.team_name` is falsy |
| dashboard.caseCard.status.intakePending | `CaseCard` > `getBadgeProps` > `statusThemeMap.intake_pending` (`apps/web-1/types/case.ts:234–241`) | Badge | Chờ kích hoạt — Mua credit đánh giá chuyên sâu | Parent card link | shown when either input status equals `intake_pending`; the user-facing badge is always rendered |
| dashboard.caseCard.status.intakeReady | `CaseCard` > `getBadgeProps` > `statusThemeMap.intake_ready` (`case.ts:234–241`) | Badge | Sẵn sàng — Cập nhật thông tin hồ sơ | Parent card link | shown when either input status equals `intake_ready` |
| dashboard.caseCard.status.submitted | `CaseCard` > `getBadgeProps` > `statusThemeMap.submitted` (`case.ts:237–240`) | Badge | Hồ sơ đã gửi — chờ xét duyệt | Parent card link | shown when either input status equals `submitted` |
| dashboard.caseCard.status.needMoreInformation | `CaseCard` > `getBadgeProps` > `statusThemeMap.need_more_information` (`case.ts:241–244`) | Badge | Cần bổ sung tài liệu | Parent card link | shown when either input status equals `need_more_information` |
| dashboard.caseCard.status.underReview | `CaseCard` > `getBadgeProps` > `statusThemeMap.under_review` (`case.ts:245–248`) | Badge | Đang phản biện | Parent card link | shown when either input status equals `under_review` |
| dashboard.caseCard.status.reportReady | `CaseCard` > `getBadgeProps` > `statusThemeMap.report_ready` (`case.ts:249–252`) | Badge | Báo cáo phản biện sẵn sàng | Parent card link | shown when either input status equals `report_ready` |
| dashboard.caseCard.status.waitingForRevision | `CaseCard` > `getBadgeProps` > `statusThemeMap.waiting_for_revision` (`case.ts:253–256`) | Badge | Chờ bản sửa từ nhóm | Parent card link | shown when either input status equals `waiting_for_revision` |
| dashboard.caseCard.status.revisionSubmitted | `CaseCard` > `getBadgeProps` > `statusThemeMap.revision_submitted` (`case.ts:257–260`) | Badge | Đã nộp bản sửa | Parent card link | shown when either input status equals `revision_submitted` |
| dashboard.caseCard.status.completed | `CaseCard` > `getBadgeProps` > `statusThemeMap.completed` (`case.ts:261–264`) | Badge | Hoàn thành | Parent card link | shown when either input status equals `completed` |
| dashboard.caseCard.status.rejected | `CaseCard` > `getBadgeProps` > `statusThemeMap.rejected` (`case.ts:265–268`) | Badge | Bị từ chối | Parent card link | shown when either input status equals `rejected` |
| dashboard.caseCard.status.closed | `CaseCard` > `getBadgeProps` > `statusThemeMap.closed` (`case.ts:269–272`) | Badge | Đã đóng | Parent card link | shown when either input status equals `closed` |
| dashboard.caseCard.status.draft | `CaseCard` > `getBadgeProps` > `statusThemeMap.draft` (`case.ts:273–276`) | Badge | Bản nháp | Parent card link | shown when either input status equals `draft` |
| dashboard.caseCard.status.approved | `CaseCard` > `getBadgeProps` > `statusThemeMap.approved` (`case.ts:277–280`) | Badge | Đã duyệt | Parent card link | shown when either input status equals `approved` |
| dashboard.caseCard.status.approvedUppercase | `CaseCard` > `getBadgeProps` > `statusThemeMap.APPROVED` (`case.ts:281–284`) | Badge | Đã duyệt | Parent card link | shown when either input status equals `APPROVED` |
| dashboard.caseCard.status.sent | `CaseCard` > `getBadgeProps` > `statusThemeMap.sent` (`case.ts:285–288`) | Badge | Đã gửi báo cáo | Parent card link | shown when either input status equals `sent` |
| dashboard.caseCard.status.notRequired | `CaseCard` > `getBadgeProps` > `statusThemeMap.not_required` (`case.ts:289–292`) | Badge | Gói miễn phí | Parent card link | shown when either input status equals `not_required` |
| dashboard.caseCard.status.unpaid | `CaseCard` > `getBadgeProps` > `statusThemeMap.unpaid` (`case.ts:293–296`) | Badge | Chưa thanh toán | Parent card link | shown when either input status equals `unpaid` |
| dashboard.caseCard.status.pendingVerification | `CaseCard` > `getBadgeProps` > `statusThemeMap.pending_verification` (`case.ts:297–300`) | Badge | Chờ duyệt thanh toán | Parent card link | shown when either input status equals `pending_verification` |
| dashboard.caseCard.status.pendingVerificationCamel | `CaseCard` > `getBadgeProps` > `statusThemeMap.pendingVerification` (`case.ts:301–304`) | Badge | Chờ duyệt thanh toán | Parent card link | shown when either input status equals `pendingVerification` |
| dashboard.caseCard.status.paid | `CaseCard` > `getBadgeProps` > `statusThemeMap.paid` (`case.ts:305–308`) | Badge | Đã thanh toán | Parent card link | shown when either input status equals `paid` |
| dashboard.caseCard.status.triagePending | `CaseCard` > `getBadgeProps` > `statusThemeMap.triage_pending` (`case.ts:309–312`) | Badge | Chờ duyệt | Parent card link | shown when either input status equals `triage_pending` |
| dashboard.caseCard.status.acceptedUnassigned | `CaseCard` > `getBadgeProps` > `statusThemeMap.accepted_unassigned` (`case.ts:313–316`) | Badge | Chờ phân công Supporter | Parent card link | shown when either input status equals `accepted_unassigned` |
| dashboard.caseCard.status.assigned | `CaseCard` > `getBadgeProps` > `statusThemeMap.assigned` (`case.ts:317–320`) | Badge | Đã phân công | Parent card link | shown when either input status equals `assigned` |
| dashboard.caseCard.status.waitingUser | `CaseCard` > `getBadgeProps` > `statusThemeMap.waiting_user` (`case.ts:321–324`) | Badge | Chờ phản hồi | Parent card link | shown when either input status equals `waiting_user` |
| dashboard.caseCard.status.supporterWorking | `CaseCard` > `getBadgeProps` > `statusThemeMap.supporter_working` (`case.ts:325–328`) | Badge | Supporter đang xử lý | Parent card link | shown when either input status equals `supporter_working` |
| dashboard.caseCard.status.reportReadyToPublish | `CaseCard` > `getBadgeProps` > `statusThemeMap.report_ready_to_publish` (`case.ts:329–332`) | Badge | Báo cáo chờ gửi | Parent card link | shown when either input status equals `report_ready_to_publish` |
| dashboard.caseCard.status.done | `CaseCard` > `getBadgeProps` > `statusThemeMap.done` (`case.ts:333–336`) | Badge | Hoàn thành | Parent card link | shown when either input status equals `done` |
| dashboard.caseCard.status.cancelled | `CaseCard` > `getBadgeProps` > `statusThemeMap.cancelled` (`case.ts:337–340`) | Badge | Đã hủy | Parent card link | shown when either input status equals `cancelled` |
| dashboard.caseCard.status.fallback | `CaseCard` > `getBadgeProps` fallback (`CaseCard.tsx:14–24`) | Badge | `<code>{status}</code>` | Parent card link | map key absent; raw input status becomes the label |
| dashboard.caseCard.credit | `CaseCard` > credit `Badge` (`CaseCard.tsx:55–64`) | Badge | Có `<code>{item.credit_balance}</code>` credit | Parent card link | rendered when `credit_balance > 0`; replaces payment-status badge |
| dashboard.caseCard.package | `CaseCard` > package row (`CaseCard.tsx:68–71`) | Item | `<code>{item.package?.name}</code>` or Gói dịch vụ | Parent card link | fallback when package name is absent |
| dashboard.caseCard.createdAt | `CaseCard` > submission-date row (`CaseCard.tsx:72–74`) | Item | Ngày nộp hồ sơ: `<code>{formatDate(item.created_at)}</code>` | Parent card link | date is formatted as `dd/mm/yyyy` using `vi-VN` locale |
| dashboard.caseCard.schoolCourse | `CaseCard` > school/course row (`CaseCard.tsx:75–83`) | Item | `<code>{item.school} ({item.course_context})</code>` or `<code>{item.school}</code>` | Parent card link | rendered when `item.school` is truthy; parenthesized course appears only when `course_context` is truthy |
| dashboard.caseCard.schoolPlaceholder | `CaseCard` > school/course fallback (`CaseCard.tsx:75–83`) | Item | placeholder | Parent card link | rendered with CSS class `invisible` when `item.school` is falsy; not visually visible |
| dashboard.pagination | `StudentDashboard` > `Pagination` (`page.tsx:108–112`) | Navigation | `<code>{page number}</code>` | Calls `setPage` and refetches through the page query | rendered only when `totalPages > 1`; no explicit button wording or aria-label is supplied in this route component |

### 2.5 Package-selection modal and toast branch

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| dashboard.packageModal.close | `PackageSelectionModal` > Mantine `Modal` close affordance (`PackageSelectionModal.tsx:36–48`) | Modal | — | Calls supplied `onClose` | controlled by local `opened` state; no explicit close-copy or aria-label is set in this component |
| dashboard.packageModal.title | `PackageSelectionModal` > modal title (`PackageSelectionModal.tsx:37–43`) | Modal | Chọn gói kiểm tra | — | rendered when either dashboard modal instance is open |
| dashboard.packageModal.basic.recommended | `PackageSelectionModal` > Basic card > `Badge` (`PackageSelectionModal.tsx:49–54`) | Badge | Khuyên dùng | — | Basic package card |
| dashboard.packageModal.basic.title | `PackageSelectionModal` > Basic card > `<h4>` (`PackageSelectionModal.tsx:55–64`) | Heading | Basic AI Audit | — | Basic package card |
| dashboard.packageModal.basic.price | `PackageSelectionModal` > Basic card > price (`PackageSelectionModal.tsx:57–61`) | Item | 79,000 | — | Basic package card |
| dashboard.packageModal.basic.currency | `PackageSelectionModal` > Basic card > price (`PackageSelectionModal.tsx:57–61`) | Item | VND | — | Basic package card |
| dashboard.packageModal.basic.description | `PackageSelectionModal` > Basic card > description (`PackageSelectionModal.tsx:62–64`) | Description | Phân tích tự động bằng AI. Báo cáo trả về tức thì. | — | Basic package card |
| dashboard.packageModal.basic.featureRubric | `PackageSelectionModal` > Basic card > `List.Item` (`PackageSelectionModal.tsx:65–78`) | Item | Chấm điểm theo Rubric | — | Basic package card |
| dashboard.packageModal.basic.featureLogic | `PackageSelectionModal` > Basic card > `List.Item` (`PackageSelectionModal.tsx:65–78`) | Item | Xác định lỗi Logic cơ bản | — | Basic package card |
| dashboard.packageModal.basic.featureInstant | `PackageSelectionModal` > Basic card > `List.Item` (`PackageSelectionModal.tsx:65–78`) | Item | Trả kết quả tức thì | — | Basic package card |
| dashboard.packageModal.basic.cta | `PackageSelectionModal` > Basic card > `Button` (`PackageSelectionModal.tsx:80–87`) | CTA | Chọn Basic AI | In both `/dashboard` instances, routes to `/dashboard/intake?packageId=pkg_ai_audit`, then calls `onClose` | enabled; dashboard passes no `onSelectPackage` callback |
| dashboard.packageModal.premium.comingSoon | `PackageSelectionModal` > Premium card > `Badge` (`PackageSelectionModal.tsx:91–95`) | Badge | Sắp ra mắt | — | Premium package card |
| dashboard.packageModal.premium.title | `PackageSelectionModal` > Premium card > `<h4>` (`PackageSelectionModal.tsx:96–105`) | Heading | Premium Mentor Audit | — | Premium package card |
| dashboard.packageModal.premium.price | `PackageSelectionModal` > Premium card > price (`PackageSelectionModal.tsx:98–102`) | Item | 149,000 | — | Premium package card |
| dashboard.packageModal.premium.currency | `PackageSelectionModal` > Premium card > price (`PackageSelectionModal.tsx:98–102`) | Item | VND | — | Premium package card |
| dashboard.packageModal.premium.description | `PackageSelectionModal` > Premium card > description (`PackageSelectionModal.tsx:103–105`) | Description | Mentor FPT trực tiếp review, sửa lỗi chặn và định hướng thực chiến. | — | Premium package card |
| dashboard.packageModal.premium.featureBasic | `PackageSelectionModal` > Premium card > `List.Item` (`PackageSelectionModal.tsx:106–119`) | Item | Bao gồm tính năng của Basic AI | — | Premium package card |
| dashboard.packageModal.premium.featureGuidance | `PackageSelectionModal` > Premium card > `List.Item` (`PackageSelectionModal.tsx:106–119`) | Item | Định hướng sửa bài thực chiến | — | Premium package card |
| dashboard.packageModal.premium.featureSla | `PackageSelectionModal` > Premium card > `List.Item` (`PackageSelectionModal.tsx:106–119`) | Item | Nhận báo cáo sau 24h-48h | — | Premium package card |
| dashboard.packageModal.premium.cta | `PackageSelectionModal` > Premium card > disabled `Button` (`PackageSelectionModal.tsx:121–129`) | CTA | Sắp ra mắt | — | disabled; no `onClick` is attached to this rendered button |
| dashboard.packageModal.supporterToast.title | `PackageSelectionModal` > `handleSelect` notification (`PackageSelectionModal.tsx:18–25`) | Toast | Tính năng đang được phát triển | Displayed through `notifications.show` when `handleSelect("pkg_supporter_audit")` is called | handler branch; the rendered disabled Premium button does not call this handler |
| dashboard.packageModal.supporterToast.message | `PackageSelectionModal` > `handleSelect` notification (`PackageSelectionModal.tsx:20–25`) | Toast | Gói Premium Mentor Audit hiện đang được hoàn thiện. Vui lòng chọn gói Basic AI Audit (79.000đ) để được hỗ trợ tức thì! | Same notification action | handler branch; notification color is `blue` |

## Layer 3: Page Notes

- **Biến thể thuật ngữ quan sát được:**
  - `Hồ sơ phản biện` appears as the page heading and empty-state heading; `hồ sơ phản biện ý tưởng khởi nghiệp` appears in the page description; `mã hồ sơ` appears in search/sort copy; and `Hồ sơ chưa đặt tên nhóm` is the card fallback (`apps/web-1/app/dashboard/page.tsx:47–50`; `CaseListFilters.tsx:59–60, 31–32`; `CaseCard.tsx:47–49`).
  - `dự án` appears in `Bắt đầu kiểm tra dự án` and the Premium description, while `ý tưởng khởi nghiệp` appears in the page description and empty-state description (`page.tsx:49`; `DashboardEmptyState.tsx:17–33`; `PackageSelectionModal.tsx:103–105`).
  - `đội ngũ` appears in the team-assessment actions, while `nhóm` appears in filters, card data, and several status labels (`page.tsx:55–60`; `DashboardEmptyState.tsx:22–27`; `CaseListFilters.tsx:60, 33–34`; `apps/web-1/types/case.ts:253–256`).
  - The package modal uses `Basic AI Audit`, `Premium Mentor Audit`, `Mentor FPT`, `Rubric`, `Logic`, `credit`, `VND`, and `SLA` alongside Vietnamese copy (`PackageSelectionModal.tsx:57–128`; `CaseCard.tsx:60–63`).
- **Hành vi code đã quan sát:**
  - `/dashboard` uses a client-side session/role guard. It initially renders the loading message, pushes an unauthenticated user to `/auth`, and returns `null` for `admin`/`supporter` content before their redirects (`apps/web-1/app/dashboard/layout.tsx:14–47`).
  - `CaseListFilters` renders `Select` controls; no tab control is rendered by this component. The route does not pass `stageOptions`, so `STUDENT_STAGE_OPTIONS` is used instead of the separately exported supporter options (`CaseListFilters.tsx:6–35, 47–86`; `page.tsx:71–83`).
  - `StudentDashboard` always mounts one closed `PackageSelectionModal`. In the unfiltered-empty branch, `DashboardEmptyState` mounts a second, separately controlled instance; its CTA opens that empty-state instance (`page.tsx:93–115`; `DashboardEmptyState.tsx:8–35`).
  - A notification item awaits the read mutation before routing when its `link` is non-null. The bulk-read button remains in the notification menu but is disabled at unread count zero (`NotificationBell.tsx:21–24, 104–113`).
  - The `ThemeToggler` initially renders an opacity-zero `ActionIcon` without the later `Toggle theme` aria-label, then renders the toggle after client mount (`ThemeToggler.tsx:8–32`).
  - The status helper accepts an arbitrary string, uses `statusThemeMap` when a key exists, and otherwise displays the raw status as its badge label. The payment badge is suppressed when the card has a positive credit balance (`CaseCard.tsx:13–28, 50–64`; `apps/web-1/types/case.ts:234–341`).
  - The Premium toast branch does not call `onClose`; it returns after `notifications.show`. The Basic branch calls a provided `onSelectPackage` callback when present, otherwise pushes the intake URL, then calls `onClose` (`PackageSelectionModal.tsx:18–34`).
- **Unknowns / Questions:**
  - Notification title, body, link, and timestamp values are API data rendered by `NotificationBell`; the examined component does not define their source copy (`NotificationBell.tsx:18–24, 63–100`; `apps/web-1/lib/hooks/useNotifications.ts:13–18`).
  - Case code, team name, package name, school, course context, creation date, credit balance, and arbitrary status values are supplied by the case-list response; their exact runtime values are not defined by this route (`hooks/useCasesList.ts:15–44`; `CaseCard.tsx:26–83`).
  - `[Assumption / Cần xác minh]` The business event or final outcome after navigation to `/dashboard/intake?packageId=pkg_ai_audit` is outside the components examined for this page.
