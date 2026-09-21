# Page: Bảng điều khiển quản trị viên & Giám sát Worker

## Layer 1: Page Context

- **Route:** `/admin`
- **Access:** `Authenticated` admin route. `AdminLayout` hiển thị màn hình tải `Đang kiểm tra quyền quản trị...` khi phiên làm việc đang được xác thực (`isPending`); tự động chuyển hướng người dùng chưa đăng nhập (`!session`) sang `/auth`; và chuyển hướng người dùng không có quyền quản trị (`(session.user as any).role !== "admin"`) sang `/dashboard` (`apps/web-1/app/admin/layout.tsx:10–30`).
- **User:**
  - **Primary user:** Quản trị viên hệ thống (tài khoản người dùng có thuộc tính `role: "admin"` trong cơ sở dữ liệu và session).
  - **Typical state:** Đang thực hiện các nghiệp vụ vận hành: theo dõi các chỉ số KPI, xác minh các giao dịch nạp tiền ngân hàng của sinh viên, xét duyệt và phân công chuyên môn cho hồ sơ đề tài, giám sát tiến trình AI thẩm định tự động (OMP Worker), giải phóng các ca thẩm định nghi kẹt, quản lý tài khoản người dùng, rà soát kho tài liệu và thiết lập đơn giá các gói dịch vụ.
  - **Knowledge level:** `[Assumption / Cần xác minh]` Nắm vững quy trình vận hành toàn diện của nền tảng, am hiểu các trạng thái nội bộ của hồ sơ, hiểu cơ chế hàng đợi BullMQ và luồng thẩm định AI OMP.
- **User goals:**
  - Xem và phân tích các chỉ số vận hành nền tảng: tổng hồ sơ (miễn phí/trả phí), tỷ lệ chuyển đổi, tổng doanh thu, số lượng hồ sơ vi phạm SLA, biểu đồ phân bổ trạng thái hồ sơ, biểu đồ doanh thu theo thời gian và tải công việc của từng Supporter.
  - Xác nhận hoặc từ chối các minh chứng nạp tiền/chuyển khoản ngân hàng từ sinh viên để kích hoạt credit hồ sơ.
  - Tiếp nhận hồ sơ mới gửi, duyệt chuyển sang hàng chờ phân công, từ chối hồ sơ kèm lý do, hoặc chỉ định Supporter phụ trách đánh giá.
  - Giám sát sức khỏe hệ thống máy ảo OMP: theo dõi số slot thực thi, hàng đợi chờ, thời lượng trung bình, các ca nghi kẹt (>10 phút) hoặc thất bại trong 24 giờ qua.
  - Can thiệp các tiến trình AI: xem terminal logs thời gian thực, ngắt cưỡng bức và giải phóng tiến trình kẹt (tự động hoàn trả credit cho sinh viên), kích hoạt chạy lại tiến trình với tùy chọn mô hình AI (ChatGPT, MiMo, Gemini, custom) và chế độ prompt.
  - Quản lý danh sách người dùng hệ thống: tạo tài khoản mới (hệ thống tự sinh mật khẩu gửi qua email), khóa tài khoản có kèm lý do hoặc mở khóa tài khoản.
  - Quản lý tệp tài liệu được tải lên nền tảng: tìm kiếm, lọc theo loại tệp/định dạng, tải file gốc, hoặc xóa vĩnh viễn tệp khỏi hệ thống và Cloudinary.
  - Cập nhật giá bán và bật/tắt khả năng hiển thị đăng ký mới của các gói dịch vụ (`Basic AI Audit`, `Premium Mentor Audit`).
  - Xuất dữ liệu báo cáo dạng tệp CSV cho 4 phân hệ: hồ sơ (`cases`), nạp tiền (`deposits`), giao dịch ví (`transactions`), đơn hàng (`orders`).
- **Business / Product goals:**
  - Đảm bảo tính minh bạch, chính xác và an toàn của toàn bộ dòng tiền nạp và giao dịch trên nền tảng.
  - Giữ vững cam kết thời gian phản hồi (SLA) thẩm định đề tài khởi nghiệp cho sinh viên.
  - Đảm bảo tính sẵn sàng và độ tin cậy của hệ thống phân tích AI tự động, giảm thiểu tối đa thời gian treo nghẽn hàng đợi.
  - Quản trị tập trung người dùng và tài nguyên hệ thống.
- **Primary action:** Tùy thuộc vào phân hệ quản trị đang kích hoạt (xác định qua query parameter `tab` trên URL):
  - Phân hệ Thống kê (`tab=stats`): Xem số liệu KPI và xuất dữ liệu báo cáo CSV (`AdminExportMenu`).
  - Phân hệ Duyệt thanh toán (`tab=payments`): Xác minh giao dịch nạp tiền đang chờ duyệt (`AdminDepositVerificationTable`).
  - Phân hệ Hồ sơ đề tài (`tab=cases`): Duyệt hồ sơ mới (`Chờ duyệt`) và phân công Supporter chuyên môn (`Chờ phân công`).
  - Phân hệ Tiến trình AI (`tab=workers`): Theo dõi trạng thái máy ảo OMP và giải phóng các ca thẩm định kẹt (`WorkerJobsTable`).
  - Phân hệ Người dùng (`tab=users`): Phân quyền, tạo tài khoản mới và quản lý khóa tài khoản.
  - Phân hệ Tài liệu (`tab=documents`): Quản lý tệp đính kèm và tài liệu minh chứng.
  - Phân hệ Cài đặt gói (`tab=packages`): Cập nhật đơn giá gói và trạng thái mở bán.
- **Secondary actions:**
  - Chuyển đổi qua lại giữa 7 tab chính trên thanh điều hướng kép (DoubleNavbar).
  - Lọc dữ liệu theo trạng thái, vai trò, định dạng tệp, khoảng thời gian thống kê.
  - Tìm kiếm theo từ khóa (mã hồ sơ, tên nhóm, Job ID, tên người dùng, nội dung chuyển khoản).
  - Sắp xếp danh sách theo thời gian tạo, đơn giá, mã hồ sơ, họ tên.
  - Phân trang dữ liệu bảng danh sách.
  - Sao chép Job ID vào bộ nhớ tạm (clipboard).
  - Chuyển đổi giao diện sáng/tối (ThemeToggler).
  - Đăng xuất tài khoản qua menu người dùng.
- **Entry:**
  - Nhập trực tiếp URL: `/admin` (mặc định mở phân hệ Thống kê `tab=stats`).
  - Chuyển hướng tự động từ màn hình đăng nhập `/auth` khi tài khoản đăng nhập có vai trò `admin`.
  - Nhấp vào logo Nexus hoặc nút `Trang chủ` trong menu người dùng (`UserMenu`) khi đang đăng nhập quyền admin (`apps/web-1/components/layout/DashboardShell.tsx:34`, `apps/web-1/components/layout/_components/UserMenu.tsx:44, 69`).
  - Điều hướng nội bộ qua thanh điều hướng DoubleNavbar bằng cách cập nhật tham số URL `?tab={stats|payments|cases|documents|packages|users|workers}`.
- **Exit / next step:**
  - Mở chi tiết case trong tab mới qua liên kết `/cases/{job.caseId}` trên bảng tiến trình AI (`WorkerJobsTable.tsx:182`).
  - Mở báo cáo PDF khổ A4 trong tab mới qua liên kết `/api/reports/{id}/download?view=inline` (`WorkerJobDetailDrawer.tsx:185`).
  - Tải xuống tệp minh chứng hoặc mở liên kết Cloudinary tệp gốc trong tab mới (`AdminDepositVerificationTable.tsx:180`, `AdminDocumentsTable.tsx:262`).
  - Đăng xuất khỏi hệ thống: chuyển hướng về trang `/auth` sau khi xóa query cache (`apps/web-1/components/layout/_components/UserMenu.tsx:49–59`).
- **Product facts / constraints:**
  - Hệ thống sử dụng kiến trúc thanh điều hướng kép (DoubleNavbar) dựa trên Mantine UI: thanh icon chính bên trái (Primary Rail) và thanh danh mục phụ bên phải (Secondary Panel) (`apps/web-1/app/admin/page.tsx:344–641`).
  - Danh sách tab hợp lệ được kiểm soát chặt chẽ qua mảng hằng số `VALID_TABS`: `["payments", "cases", "documents", "packages", "stats", "users", "workers"]`. Nếu tham số `tab` trên URL không hợp lệ hoặc bị bỏ trống, trang tự động chọn tab `stats` (`apps/web-1/app/admin/page.tsx:89–93`).
  - Cảnh báo vi phạm SLA xuất hiện ngay dưới thanh tiêu đề trang khi `statsQuery.data.slaBreachCount > 0` với nền màu đỏ nhạt: `"{slaBreachCount} hồ sơ đang quá hạn SLA. Cần kiểm tra và phân công lại."` (`apps/web-1/app/admin/page.tsx:658–662`).
  - Tab duyệt thanh toán sử dụng cơ chế xác minh nạp tiền ví (`useAdminDeposits`, endpoint `/deposits/admin/all` và `/deposits/{id}/verify`), hiển thị dữ liệu qua `AdminDepositVerificationTable`. Component `AdminPaymentVerificationTable` là biến thể cũ xử lý entity `Payment` truyền thống (`apps/web-1/app/admin/page.tsx:690–694`).
  - Modal từ chối thanh toán (`RejectionReasonModal`) và modal từ chối hồ sơ (`RejectCaseModal`) bắt buộc lý do từ chối phải có độ dài tối thiểu 10 ký tự mới cho phép bấm nút xác nhận.
  - Bảng hồ sơ (`AdminCaseAssignmentTable`) tích hợp bộ đếm ngược thời gian SLA (`SlaTimer`): hiển thị số ngày/giờ còn lại với màu xanh nếu >24h hoặc 12–24h, màu vàng cảnh báo nếu <12h, màu đỏ đậm nếu <4h, và chữ `Quá hạn` màu đỏ khi thời gian đã trôi qua.
  - Hệ thống giám sát OMP Worker tự động làm mới số liệu thống kê mỗi 5 giây khi có worker đang chạy hoặc nghi kẹt, và 15 giây khi ở trạng thái nhàn rỗi (`useAdminWorkers.ts:52–55`). Khi xem nhật ký terminal (`WorkerJobTerminal`), dữ liệu log được tự động polling mỗi 3 giây nếu tiến trình đang ở trạng thái `processing`.
  - Tính năng giải phóng tiến trình kẹt (`HealStuckJobModal`) thực hiện ngắt cưỡng bức tiến trình OMP và tự động hoàn trả 1 credit vào ví hồ sơ của sinh viên nếu chưa có báo cáo hoàn chỉnh.
  - Tính năng chạy lại tiến trình (`RetryJobModal`) không trừ credit của sinh viên (sử dụng quota quản trị viên), cho phép lựa chọn giữa 4 tùy chọn mô hình AI: ChatGPT Plus (`openai-codex/gpt-5.6-sol`), Xiaomi MiMo v2.5 (`mimo/mimo-v2.5`), Google Gemini 3.8 Flash (`google-antigravity/gemini-3.8-flash`), hoặc model tùy chỉnh.

---

## Layer 2: Interactive Inventory

### 2.1 Route access, admin layout & shared dashboard shell

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| admin.auth.loading | `AdminLayout` > `LoadingScreen` (`layout.tsx:24–26`) | Description | Đang kiểm tra quyền quản trị... | — | `isPending` session branch |
| admin.shell.logo.alt | `DashboardShell` > `Link` > `Logo` (`DashboardShell.tsx:44–46`) | Alt text | Nexus Logo | `/admin` for admin role | default |
| admin.shell.notifications.trigger | `DashboardShell` > `NotificationBell` (`NotificationBell.tsx:27–50`) | Aria-label | Thông báo | Opens/closes notification menu | default |
| admin.shell.notifications.unreadCount | `NotificationBell` > `Badge` (`NotificationBell.tsx:39–48`) | Badge | `<code>{unreadCount}</code>` or `99+` | — | rendered when `unreadCount > 0` |
| admin.shell.notifications.title | `NotificationBell` > header (`NotificationBell.tsx:52–55`) | Heading | Thông báo | — | notification menu open |
| admin.shell.notifications.empty | `NotificationBell` > empty body (`NotificationBell.tsx:57–60`) | Empty state | Không có thông báo | — | `items.length === 0` |
| admin.shell.notifications.markAllRead | `NotificationBell` > footer (`NotificationBell.tsx:104–113`) | CTA | Đánh dấu tất cả đã đọc | Calls `markAllRead.mutate()` | disabled when `unreadCount === 0` |
| admin.shell.theme.toggle | `DashboardShell` > `ThemeToggler` (`ThemeToggler.tsx:16–32`) | Aria-label | Toggle theme | Toggles light/dark mode | default |
| admin.shell.userMenu.trigger | `DashboardShell` > `UserMenu` (`UserMenu.tsx:78–107`) | Aria-label | Tài khoản | Toggles user account popover | default |
| admin.shell.userMenu.avatarAlt | `UserMenu` > `Avatar` (`UserMenu.tsx:97–105`) | Alt text | `<code>{user.name}</code>` or `User` | — | default |
| admin.shell.userMenu.email | `UserMenu` > popover header (`UserMenu.tsx:109–115`) | Item | `<code>{user.email}</code>` or `—` | — | default |
| admin.shell.userMenu.home | `UserMenu` > navigation item (`UserMenu.tsx:68–76, 127–139`) | Navigation | Trang chủ | Navigates to `/admin` | admin menu option |
| admin.shell.userMenu.signOut | `UserMenu` > action button (`UserMenu.tsx:141–148`) | CTA | Đăng xuất | Calls `signOut` and redirects to `/auth` | default |

### 2.2 DoubleNavbar sidebar navigation (Primary Rail & Submenu Panels)

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| admin.sidebar.rail.stats.tooltip | DoubleNavbar > Rail > `Tooltip` (`page.tsx:348–356`) | Helper | Thống kê | Hover label for stats tab icon | default |
| admin.sidebar.rail.stats.btn | DoubleNavbar > Rail > `UnstyledButton` (`page.tsx:349–355`) | Navigation | — | Sets active section to `stats` (`/admin?tab=stats`) | active when `activeSection === "stats"` |
| admin.sidebar.rail.payments.tooltip | DoubleNavbar > Rail > `Tooltip` (`page.tsx:358–371`) | Helper | Duyệt thanh toán | Hover label for payments tab icon | default |
| admin.sidebar.rail.payments.btn | DoubleNavbar > Rail > `UnstyledButton` (`page.tsx:359–370`) | Navigation | — | Sets active section to `payments` (`/admin?tab=payments`) | active when `activeSection === "payments"` |
| admin.sidebar.rail.payments.badge | DoubleNavbar > Rail > Payments `span` badge (`page.tsx:365–369`) | Badge | `<code>{pendingPaymentsCount}</code>` | — | rendered when `pendingPaymentsCount > 0` |
| admin.sidebar.rail.cases.tooltip | DoubleNavbar > Rail > `Tooltip` (`page.tsx:373–386`) | Helper | Duyệt & Phân công | Hover label for cases tab icon | default |
| admin.sidebar.rail.cases.btn | DoubleNavbar > Rail > `UnstyledButton` (`page.tsx:374–385`) | Navigation | — | Sets active section to `cases` (`/admin?tab=cases`) | active when `activeSection === "cases"` |
| admin.sidebar.rail.cases.badge | DoubleNavbar > Rail > Cases `span` badge (`page.tsx:380–384`) | Badge | `<code>{queueBadge}</code>` | — | rendered when `queueBadge > 0` |
| admin.sidebar.rail.documents.tooltip | DoubleNavbar > Rail > `Tooltip` (`page.tsx:388–396`) | Helper | Quản lý tài liệu | Hover label for documents tab icon | default |
| admin.sidebar.rail.documents.btn | DoubleNavbar > Rail > `UnstyledButton` (`page.tsx:389–395`) | Navigation | — | Sets active section to `documents` (`/admin?tab=documents`) | active when `activeSection === "documents"` |
| admin.sidebar.rail.packages.tooltip | DoubleNavbar > Rail > `Tooltip` (`page.tsx:398–406`) | Helper | Cài đặt giá gói | Hover label for packages tab icon | default |
| admin.sidebar.rail.packages.btn | DoubleNavbar > Rail > `UnstyledButton` (`page.tsx:399–405`) | Navigation | — | Sets active section to `packages` (`/admin?tab=packages`) | active when `activeSection === "packages"` |
| admin.sidebar.rail.users.tooltip | DoubleNavbar > Rail > `Tooltip` (`page.tsx:408–416`) | Helper | Quản lý người dùng | Hover label for users tab icon | default |
| admin.sidebar.rail.users.btn | DoubleNavbar > Rail > `UnstyledButton` (`page.tsx:409–415`) | Navigation | — | Sets active section to `users` (`/admin?tab=users`) | active when `activeSection === "users"` |
| admin.sidebar.rail.workers.tooltip | DoubleNavbar > Rail > `Tooltip` (`page.tsx:418–431`) | Helper | Tiến trình AI | Hover label for workers tab icon | default |
| admin.sidebar.rail.workers.btn | DoubleNavbar > Rail > `UnstyledButton` (`page.tsx:419–430`) | Navigation | — | Sets active section to `workers` (`/admin?tab=workers`) | active when `activeSection === "workers"` |
| admin.sidebar.rail.workers.badge | DoubleNavbar > Rail > Workers `span` badge (`page.tsx:425–429`) | Badge | `<code>{activeWorkersCount}</code>` | — | rendered when `activeWorkersCount > 0` |
| admin.sidebar.panel.title.stats | DoubleNavbar > Secondary Panel > `Title` (`page.tsx:437–439`) | Heading | Thống kê | — | rendered when `activeSection === "stats"` |
| admin.sidebar.panel.title.payments | DoubleNavbar > Secondary Panel > `Title` (`page.tsx:437–439`) | Heading | Giao dịch | — | rendered when `activeSection === "payments"` |
| admin.sidebar.panel.title.cases | DoubleNavbar > Secondary Panel > `Title` (`page.tsx:437–439`) | Heading | Hồ sơ đề tài | — | rendered when `activeSection === "cases"` |
| admin.sidebar.panel.title.documents | DoubleNavbar > Secondary Panel > `Title` (`page.tsx:437–439`) | Heading | Quản lý tài liệu | — | rendered when `activeSection === "documents"` |
| admin.sidebar.panel.title.users | DoubleNavbar > Secondary Panel > `Title` (`page.tsx:437–439`) | Heading | Người dùng | — | rendered when `activeSection === "users"` |
| admin.sidebar.panel.title.workers | DoubleNavbar > Secondary Panel > `Title` (`page.tsx:437–439`) | Heading | Tiến trình AI | — | rendered when `activeSection === "workers"` |
| admin.sidebar.panel.title.packages | DoubleNavbar > Secondary Panel > `Title` (`page.tsx:437–439`) | Heading | Cài đặt gói | — | fallback title branch |
| admin.sidebar.panel.desc.stats | DoubleNavbar > Secondary Panel > `Text` (`page.tsx:440–454`) | Description | Tổng quan dữ liệu vận hành. | — | rendered when `activeSection === "stats"` |
| admin.sidebar.panel.desc.payments | DoubleNavbar > Secondary Panel > `Text` (`page.tsx:440–454`) | Description | Duyệt minh chứng chuyển khoản. | — | rendered when `activeSection === "payments"` |
| admin.sidebar.panel.desc.cases | DoubleNavbar > Secondary Panel > `Text` (`page.tsx:440–454`) | Description | Phân loại ý tưởng & phân công. | — | rendered when `activeSection === "cases"` |
| admin.sidebar.panel.desc.documents | DoubleNavbar > Secondary Panel > `Text` (`page.tsx:440–454`) | Description | Danh mục tài liệu trên hệ thống. | — | rendered when `activeSection === "documents"` |
| admin.sidebar.panel.desc.users | DoubleNavbar > Secondary Panel > `Text` (`page.tsx:440–454`) | Description | Quản lý tài khoản & phân quyền. | — | rendered when `activeSection === "users"` |
| admin.sidebar.panel.desc.workers | DoubleNavbar > Secondary Panel > `Text` (`page.tsx:440–454`) | Description | Giám sát máy ảo OMP & hàng đợi. | — | rendered when `activeSection === "workers"` |
| admin.sidebar.panel.desc.packages | DoubleNavbar > Secondary Panel > `Text` (`page.tsx:440–454`) | Description | Cài đặt đơn giá gói dịch vụ. | — | fallback description branch |
| admin.sidebar.submenu.stats.overview | DoubleNavbar > Secondary Panel > Stats Link (`page.tsx:462–467`) | Navigation | Tổng quan | — | active default link |
| admin.sidebar.submenu.payments.pending | DoubleNavbar > Secondary Panel > Payments Link (`page.tsx:471–484`) | Navigation | Chờ xác minh | Sets `paymentFilter` to `"pending"` | active when `paymentFilter === "pending"` |
| admin.sidebar.submenu.payments.pendingBadge | DoubleNavbar > Secondary Panel > Payments `Badge` (`page.tsx:479–481`) | Badge | `<code>{pendingPaymentsCount}</code>` | — | rendered when `pendingPaymentsCount > 0` |
| admin.sidebar.submenu.payments.history | DoubleNavbar > Secondary Panel > Payments Link (`page.tsx:485–491`) | Navigation | Lịch sử giao dịch | Sets `paymentFilter` to `"history"` | active when `paymentFilter === "history"` |
| admin.sidebar.submenu.cases.all | DoubleNavbar > Secondary Panel > Cases Link (`page.tsx:495–508`) | Navigation | Tất cả cần xử lý | Sets `caseFilter` to `"all"` | active when `caseFilter === "all"` |
| admin.sidebar.submenu.cases.allBadge | DoubleNavbar > Secondary Panel > Cases `Badge` (`page.tsx:502–506`) | Badge | `<code>{queueBadge}</code>` | — | rendered when `queueBadge > 0` |
| admin.sidebar.submenu.cases.triage | DoubleNavbar > Secondary Panel > Cases Link (`page.tsx:509–515`) | Navigation | Chờ duyệt | Sets `caseFilter` to `"triage"` | active when `caseFilter === "triage"` |
| admin.sidebar.submenu.cases.intake | DoubleNavbar > Secondary Panel > Cases Link (`page.tsx:516–522`) | Navigation | Chờ sinh viên nộp hồ sơ | Sets `caseFilter` to `"intake"` | active when `caseFilter === "intake"` |
| admin.sidebar.submenu.cases.unassigned | DoubleNavbar > Secondary Panel > Cases Link (`page.tsx:523–529`) | Navigation | Chờ phân công | Sets `caseFilter` to `"unassigned"` | active when `caseFilter === "unassigned"` |
| admin.sidebar.submenu.cases.assigned | DoubleNavbar > Secondary Panel > Cases Link (`page.tsx:530–536`) | Navigation | Đang phản biện | Sets `caseFilter` to `"assigned"` | active when `caseFilter === "assigned"` |
| admin.sidebar.submenu.cases.crud | DoubleNavbar > Secondary Panel > Cases Link (`page.tsx:537–543`) | Navigation | Quản lý toàn bộ hồ sơ | Sets `caseFilter` to `"crud"` | active when `caseFilter === "crud"` |
| admin.sidebar.submenu.documents.all | DoubleNavbar > Secondary Panel > Documents Link (`page.tsx:547–552`) | Navigation | Tất cả tài liệu | — | active default link |
| admin.sidebar.submenu.users.all | DoubleNavbar > Secondary Panel > Users Link (`page.tsx:556–561`) | Navigation | Quản lý người dùng | — | active default link |
| admin.sidebar.submenu.workers.all | DoubleNavbar > Secondary Panel > Workers Link (`page.tsx:565–571`) | Navigation | Tất cả | Sets `workerFilter` to `"all"` | active when `workerFilter === "all"` |
| admin.sidebar.submenu.workers.active | DoubleNavbar > Secondary Panel > Workers Link (`page.tsx:572–585`) | Navigation | Đang chạy | Sets `workerFilter` to `"active"` | active when `workerFilter === "active"` |
| admin.sidebar.submenu.workers.activeBadge | DoubleNavbar > Secondary Panel > Workers `Badge` (`page.tsx:580–582`) | Badge | `<code>{workerStats.activeCount}</code>` | — | rendered when `workerStats.activeCount > 0` |
| admin.sidebar.submenu.workers.waiting | DoubleNavbar > Secondary Panel > Workers Link (`page.tsx:586–599`) | Navigation | Trong hàng đợi | Sets `workerFilter` to `"waiting"` | active when `workerFilter === "waiting"` |
| admin.sidebar.submenu.workers.waitingBadge | DoubleNavbar > Secondary Panel > Workers `Badge` (`page.tsx:594–596`) | Badge | `<code>{workerStats.waitingCount}</code>` | — | rendered when `workerStats.waitingCount > 0` |
| admin.sidebar.submenu.workers.stuck | DoubleNavbar > Secondary Panel > Workers Link (`page.tsx:600–613`) | Navigation | Nghi kẹt | Sets `workerFilter` to `"stuck"` | active when `workerFilter === "stuck"` |
| admin.sidebar.submenu.workers.stuckBadge | DoubleNavbar > Secondary Panel > Workers `Badge` (`page.tsx:608–610`) | Badge | `<code>{workerStats.stuckCount}</code>` | — | rendered when `workerStats.stuckCount > 0` |
| admin.sidebar.submenu.workers.failed | DoubleNavbar > Secondary Panel > Workers Link (`page.tsx:614–620`) | Navigation | Thất bại | Sets `workerFilter` to `"failed"` | active when `workerFilter === "failed"` |
| admin.sidebar.submenu.workers.completed | DoubleNavbar > Secondary Panel > Workers Link (`page.tsx:621–627`) | Navigation | Đã hoàn thành | Sets `workerFilter` to `"completed"` | active when `workerFilter === "completed"` |
| admin.sidebar.submenu.packages.all | DoubleNavbar > Secondary Panel > Packages Link (`page.tsx:631–636`) | Navigation | Danh sách gói dịch vụ | — | active default link |

### 2.3 Main page header, SLA breach banner & Data Export Menu

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| admin.header.title.stats | Main Content Header > `h1` (`page.tsx:254–260, 651`) | Heading | Thống kê | — | `activeSection === "stats"` |
| admin.header.desc.stats | Main Content Header > `<p>` (`page.tsx:254–260, 652`) | Description | Tổng quan dữ liệu hồ sơ, doanh thu và hiệu suất vận hành. | — | `activeSection === "stats"` |
| admin.header.title.payments | Main Content Header > `h1` (`page.tsx:261–267, 651`) | Heading | Duyệt minh chứng thanh toán | — | `activeSection === "payments"` |
| admin.header.desc.payments | Main Content Header > `<p>` (`page.tsx:261–267, 652`) | Description | Kiểm tra thông tin giao dịch chuyển khoản và ảnh đối chiếu từ học viên. | — | `activeSection === "payments"` |
| admin.header.title.cases.crud | Main Content Header > `h1` (`page.tsx:269–275, 651`) | Heading | Quản lý toàn bộ hồ sơ hệ thống | — | `caseFilter === "crud"` |
| admin.header.desc.cases.crud | Main Content Header > `<p>` (`page.tsx:269–275, 652`) | Description | Xem chi tiết hoặc xóa hồ sơ khỏi cơ sở dữ liệu hệ thống. | — | `caseFilter === "crud"` |
| admin.header.title.cases.triage | Main Content Header > `h1` (`page.tsx:276–282, 651`) | Heading | Duyệt hồ sơ mới | — | `caseFilter === "triage"` |
| admin.header.desc.cases.triage | Main Content Header > `<p>` (`page.tsx:276–282, 652`) | Description | Kiểm tra và quyết định duyệt, từ chối hoặc yêu cầu làm rõ hồ sơ mới gửi. | — | `caseFilter === "triage"` |
| admin.header.title.cases.intake | Main Content Header > `h1` (`page.tsx:283–289, 651`) | Heading | Chờ sinh viên nộp hồ sơ | — | `caseFilter === "intake"` |
| admin.header.desc.cases.intake | Main Content Header > `<p>` (`page.tsx:283–289, 652`) | Description | Hồ sơ đã thanh toán nhưng sinh viên chưa hoàn thành bước nộp hồ sơ phản biện. | — | `caseFilter === "intake"` |
| admin.header.title.cases.unassigned | Main Content Header > `h1` (`page.tsx:290–296, 651`) | Heading | Phân công Supporter chuyên môn | — | `caseFilter === "unassigned"` |
| admin.header.desc.cases.unassigned | Main Content Header > `<p>` (`page.tsx:290–296, 652`) | Description | Chỉ định chuyên gia phụ trách đánh giá và phản biện cho hồ sơ đã duyệt. | — | `caseFilter === "unassigned"` |
| admin.header.title.cases.assigned | Main Content Header > `h1` (`page.tsx:297–303, 651`) | Heading | Hồ sơ đang phản biện | — | `caseFilter === "assigned"` |
| admin.header.desc.cases.assigned | Main Content Header > `<p>` (`page.tsx:297–303, 652`) | Description | Theo dõi tiến độ các hồ sơ đã được phân công Supporter. | — | `caseFilter === "assigned"` |
| admin.header.title.cases.default | Main Content Header > `h1` (`page.tsx:304–309, 651`) | Heading | Hồ sơ cần xử lý | — | default cases header |
| admin.header.desc.cases.default | Main Content Header > `<p>` (`page.tsx:304–309, 652`) | Description | Duyệt, phân công hoặc theo dõi các hồ sơ đang trong quy trình xử lý. | — | default cases header |
| admin.header.title.documents | Main Content Header > `h1` (`page.tsx:310–316, 651`) | Heading | Quản lý hệ thống tài liệu | — | `activeSection === "documents"` |
| admin.header.desc.documents | Main Content Header > `<p>` (`page.tsx:310–316, 652`) | Description | Xem, tải xuống và gỡ bỏ tài liệu khỏi cơ sở dữ liệu & Cloudinary. | — | `activeSection === "documents"` |
| admin.header.title.users | Main Content Header > `h1` (`page.tsx:317–323, 651`) | Heading | Quản lý người dùng | — | `activeSection === "users"` |
| admin.header.desc.users | Main Content Header > `<p>` (`page.tsx:317–323, 652`) | Description | Tạo tài khoản mới, xem danh sách và quản lý trạng thái khóa/mở khóa người dùng. | — | `activeSection === "users"` |
| admin.header.title.workers | Main Content Header > `h1` (`page.tsx:324–330, 651`) | Heading | Giám sát tiến trình AI (OMP Worker) | — | `activeSection === "workers"` |
| admin.header.desc.workers | Main Content Header > `<p>` (`page.tsx:324–330, 652`) | Description | Theo dõi hàng đợi, trạng thái thực thi mô hình AI và xử lý các ca thẩm định kẹt. | — | `activeSection === "workers"` |
| admin.header.title.packages | Main Content Header > `h1` (`page.tsx:331–336, 651`) | Heading | Thiết lập gói dịch vụ | — | default packages header |
| admin.header.desc.packages | Main Content Header > `<p>` (`page.tsx:331–336, 652`) | Description | Bật/tắt hiển thị với khách hàng mới và cập nhật đơn giá các gói trên hệ thống. | — | default packages header |
| admin.header.slaBreachAlert | Main Content Header > SLA Banner (`page.tsx:658–662`) | Error | `<code>{statsQuery.data.slaBreachCount}</code>` hồ sơ đang quá hạn SLA. Cần kiểm tra và phân công lại. | — | rendered when `statsQuery.data.slaBreachCount > 0` |
| admin.export.trigger | `AdminExportMenu` > `Button` (`AdminExportMenu.tsx:21–29`) | CTA | Xuất dữ liệu | Opens export dropdown menu | rendered in stats tab header |
| admin.export.item.cases | `AdminExportMenu` > `Menu.Item` (`AdminExportMenu.tsx:8–13, 33–40`) | Item | Hồ sơ (cases) | Downloads CSV export for cases | default |
| admin.export.item.deposits | `AdminExportMenu` > `Menu.Item` (`AdminExportMenu.tsx:8–13, 33–40`) | Item | Nạp tiền (deposits) | Downloads CSV export for deposits | default |
| admin.export.item.transactions | `AdminExportMenu` > `Menu.Item` (`AdminExportMenu.tsx:8–13, 33–40`) | Item | Giao dịch ví (transactions) | Downloads CSV export for transactions | default |
| admin.export.item.orders | `AdminExportMenu` > `Menu.Item` (`AdminExportMenu.tsx:8–13, 33–40`) | Item | Đơn hàng (orders) | Downloads CSV export for orders | default |
| admin.export.toast.error.title | `useAdminExport` > notification (`useAdminExport.ts:56–60`) | Toast | Xuất dữ liệu thất bại | — | export failure branch |
| admin.export.toast.error.msgFallback | `useAdminExport` > notification (`useAdminExport.ts:44, 56–60`) | Toast | Không tải được báo cáo `<code>{LABELS[resource]}</code>`. | — | fallback error message when API returns no message |

### 2.4 Tab Thống kê (Stats Dashboard, KPI Cards & Charts)

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| admin.stats.loading | `StatsDashboard` > Loading Text (`StatsDashboard.tsx:32–36`) | Description | Đang tải dữ liệu thống kê... | — | `isLoading` or `!data` branch |
| admin.stats.error | `AdminHubPage` > Error Banner (`page.tsx:675–678`) | Error | Không thể tải dữ liệu thống kê. Vui lòng thử lại sau. | — | `statsQuery.error` branch |
| admin.stats.filter.heading | `StatsDashboard` > Filter bar > `Text` (`StatsDashboard.tsx:43–45`) | Heading | Chỉ số hoạt động | — | default |
| admin.stats.period.7d | `StatsDashboard` > Period `Select` (`StatsDashboard.tsx:16–23`) | Item | 7 ngày qua | Selects period `"7d"` | dropdown option |
| admin.stats.period.30d | `StatsDashboard` > Period `Select` (`StatsDashboard.tsx:16–23`) | Item | 30 ngày qua | Selects period `"30d"` | dropdown option |
| admin.stats.period.month | `StatsDashboard` > Period `Select` (`StatsDashboard.tsx:16–23`) | Item | 12 tháng qua | Selects period `"month"` | dropdown option |
| admin.stats.period.semester | `StatsDashboard` > Period `Select` (`StatsDashboard.tsx:16–23`) | Item | Theo học kỳ | Selects period `"semester"` | dropdown option |
| admin.stats.period.quarter | `StatsDashboard` > Period `Select` (`StatsDashboard.tsx:16–23`) | Item | Theo quý | Selects period `"quarter"` | dropdown option |
| admin.stats.period.year | `StatsDashboard` > Period `Select` (`StatsDashboard.tsx:16–23`) | Item | Theo năm | Selects period `"year"` | dropdown option |
| admin.stats.kpi.totalCases.label | `StatsKpiCards` > Card 1 label (`StatsKpiCards.tsx:14–17`) | Label | Tổng hồ sơ | — | default |
| admin.stats.kpi.totalCases.value | `StatsKpiCards` > Card 1 value (`StatsKpiCards.tsx:15`) | Item | `<code>{data.totalCases.toLocaleString("en-US")}</code>` | — | default |
| admin.stats.kpi.totalCases.detail | `StatsKpiCards` > Card 1 detail (`StatsKpiCards.tsx:16`) | Description | `<code>{data.freeCases}</code>` miễn phí · `<code>{data.paidCases}</code>` trả phí | — | default |
| admin.stats.kpi.conversion.label | `StatsKpiCards` > Card 2 label (`StatsKpiCards.tsx:19–22`) | Label | Tỷ lệ chuyển đổi | — | default |
| admin.stats.kpi.conversion.value | `StatsKpiCards` > Card 2 value (`StatsKpiCards.tsx:20`) | Item | `<code>{data.conversionRate}%</code>` | — | default |
| admin.stats.kpi.conversion.detail | `StatsKpiCards` > Card 2 detail (`StatsKpiCards.tsx:21`) | Description | Hồ sơ chuyển sang trả phí | — | default |
| admin.stats.kpi.revenue.label | `StatsKpiCards` > Card 3 label (`StatsKpiCards.tsx:24–27`) | Label | Doanh thu | — | default |
| admin.stats.kpi.revenue.value | `StatsKpiCards` > Card 3 value (`StatsKpiCards.tsx:25`) | Item | `<code>{data.totalRevenue.toLocaleString("en-US")} VND</code>` | — | default |
| admin.stats.kpi.revenue.detail | `StatsKpiCards` > Card 3 detail (`StatsKpiCards.tsx:26`) | Description | Tổng doanh thu tích luỹ | — | default |
| admin.stats.kpi.slaBreach.label | `StatsKpiCards` > Card 4 label (`StatsKpiCards.tsx:29–33`) | Label | Quá hạn SLA | — | default |
| admin.stats.kpi.slaBreach.value | `StatsKpiCards` > Card 4 value (`StatsKpiCards.tsx:30`) | Item | `<code>{data.slaBreachCount}</code>` | — | styled with `text-danger` when > 0 |
| admin.stats.kpi.slaBreach.detailAlert | `StatsKpiCards` > Card 4 detail (`StatsKpiCards.tsx:31`) | Description | Cần phân công lại | — | rendered when `data.slaBreachCount > 0` |
| admin.stats.kpi.slaBreach.detailZero | `StatsKpiCards` > Card 4 detail (`StatsKpiCards.tsx:31`) | Description | 0 hồ sơ quá hạn | — | rendered when `data.slaBreachCount === 0` |
| admin.stats.charts.revenue.title | `StatsCharts` > Revenue Paper > `Text` (`StatsCharts.tsx:89–91`) | Heading | Doanh thu | — | default |
| admin.stats.charts.revenue.unit | `StatsCharts` > Revenue Paper > unit (`StatsCharts.tsx:92–94`) | Label | VND | — | default |
| admin.stats.charts.revenue.series | `StatsCharts` > Revenue Paper > series name (`StatsCharts.tsx:101`) | Item | Doanh thu | — | chart legend/series label |
| admin.stats.charts.revenue.empty | `StatsCharts` > Revenue Paper > empty text (`StatsCharts.tsx:112–114`) | Empty state | Chưa có dữ liệu giao dịch | — | `areaChartData.length === 0` |
| admin.stats.charts.stages.title | `StatsCharts` > Donut Paper > `Text` (`StatsCharts.tsx:124–126`) | Heading | Trạng thái hồ sơ | — | default |
| admin.stats.charts.stages.chartLabel | `StatsCharts` > DonutChart (`StatsCharts.tsx:133`) | Item | `<code>{data.totalCases}</code>` hồ sơ | — | centered donut label |
| admin.stats.charts.stages.stage.intakePending | `StatsCharts` > stage label (`StatsCharts.tsx:12–23`) | Item | Chờ thông tin | — | mapping for `intake_pending` |
| admin.stats.charts.stages.stage.intakeReady | `StatsCharts` > stage label (`StatsCharts.tsx:12–23`) | Item | Chờ duyệt | — | mapping for `intake_ready` |
| admin.stats.charts.stages.stage.submitted | `StatsCharts` > stage label (`StatsCharts.tsx:12–23`) | Item | Đã gửi | — | mapping for `submitted` |
| admin.stats.charts.stages.stage.underReview | `StatsCharts` > stage label (`StatsCharts.tsx:12–23`) | Item | Đang phản biện | — | mapping for `under_review` |
| admin.stats.charts.stages.stage.reportReady | `StatsCharts` > stage label (`StatsCharts.tsx:12–23`) | Item | Báo cáo sẵn sàng | — | mapping for `report_ready` |
| admin.stats.charts.stages.stage.waitingForRevision | `StatsCharts` > stage label (`StatsCharts.tsx:12–23`) | Item | Chờ sửa đổi | — | mapping for `waiting_for_revision` |
| admin.stats.charts.stages.stage.revisionSubmitted | `StatsCharts` > stage label (`StatsCharts.tsx:12–23`) | Item | Đã sửa đổi | — | mapping for `revision_submitted` |
| admin.stats.charts.stages.stage.completed | `StatsCharts` > stage label (`StatsCharts.tsx:12–23`) | Item | Hoàn thành | — | mapping for `completed` |
| admin.stats.charts.stages.stage.rejected | `StatsCharts` > stage label (`StatsCharts.tsx:12–23`) | Item | Từ chối | — | mapping for `rejected` |
| admin.stats.charts.stages.stage.closed | `StatsCharts` > stage label (`StatsCharts.tsx:12–23`) | Item | Đã đóng | — | mapping for `closed` |
| admin.stats.charts.stages.empty | `StatsCharts` > Donut Paper > empty text (`StatsCharts.tsx:154–156`) | Empty state | Chưa có hồ sơ trong hệ thống | — | `donutData.length === 0` |
| admin.stats.charts.growth.title | `StatsCharts` > Case Growth Paper > `Text` (`StatsCharts.tsx:169–171`) | Heading | Tiếp nhận hồ sơ | — | default |
| admin.stats.charts.growth.seriesFree | `StatsCharts` > Case Growth Paper > series (`StatsCharts.tsx:179`) | Item | Hồ sơ Miễn phí | — | stacked bar legend |
| admin.stats.charts.growth.seriesPaid | `StatsCharts` > Case Growth Paper > series (`StatsCharts.tsx:180`) | Item | Hồ sơ Trả phí | — | stacked bar legend |
| admin.stats.charts.growth.empty | `StatsCharts` > Case Growth Paper > empty text (`StatsCharts.tsx:186–188`) | Empty state | Chưa có dữ liệu hồ sơ | — | `caseTrendData.length === 0` |
| admin.stats.charts.workload.title | `StatsCharts` > Supporter Workload Paper > `Text` (`StatsCharts.tsx:198–200`) | Heading | Phân bổ Supporter | — | default |
| admin.stats.charts.workload.series | `StatsCharts` > Supporter Workload Paper > series (`StatsCharts.tsx:206`) | Item | Số case | — | bar series label |
| admin.stats.charts.workload.empty | `StatsCharts` > Supporter Workload Paper > empty text (`StatsCharts.tsx:211–213`) | Empty state | Chưa có Supporter được phân công | — | `barData.length === 0` |

### 2.5 Tab Duyệt thanh toán / nạp tiền (Deposit Verification Table & Modals)

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| admin.deposits.empty.title | `AdminDepositVerificationTable` > empty state (`AdminDepositVerificationTable.tsx:87`) | Empty state | Không có giao dịch nào | — | `deposits.length === 0` |
| admin.deposits.empty.desc | `AdminDepositVerificationTable` > empty state (`AdminDepositVerificationTable.tsx:88–90`) | Description | Danh sách trống hoặc chưa có dữ liệu giao dịch phù hợp. | — | `deposits.length === 0` |
| admin.deposits.search.placeholder | `AdminDepositVerificationTable` > search input (`AdminDepositVerificationTable.tsx:103`) | Placeholder | Tìm theo nội dung chuyển khoản, tên người nạp... | Updates search filter `searchQuery` | default |
| admin.deposits.status.placeholder | `AdminDepositVerificationTable` > status select (`AdminDepositVerificationTable.tsx:111`) | Placeholder | Trạng thái | — | default |
| admin.deposits.status.all | `AdminDepositVerificationTable` > status option (`AdminDepositVerificationTable.tsx:113`) | Item | Tất cả trạng thái | Sets `selectedStatus` to `"all"` | dropdown option |
| admin.deposits.status.pending | `AdminDepositVerificationTable` > status option (`AdminDepositVerificationTable.tsx:114`) | Item | Chờ xác minh | Sets `selectedStatus` to `"pending"` | dropdown option |
| admin.deposits.status.verified | `AdminDepositVerificationTable` > status option (`AdminDepositVerificationTable.tsx:115`) | Item | Đã duyệt | Sets `selectedStatus` to `"verified"` | dropdown option |
| admin.deposits.status.rejected | `AdminDepositVerificationTable` > status option (`AdminDepositVerificationTable.tsx:116`) | Item | Bị từ chối | Sets `selectedStatus` to `"rejected"` | dropdown option |
| admin.deposits.sort.placeholder | `AdminDepositVerificationTable` > sort select (`AdminDepositVerificationTable.tsx:124`) | Placeholder | Sắp xếp | — | default |
| admin.deposits.sort.newest | `AdminDepositVerificationTable` > sort option (`AdminDepositVerificationTable.tsx:126`) | Item | Mới nhất | Sorts by `created_at_desc` | default selected option |
| admin.deposits.sort.oldest | `AdminDepositVerificationTable` > sort option (`AdminDepositVerificationTable.tsx:127`) | Item | Cũ nhất | Sorts by `created_at_asc` | dropdown option |
| admin.deposits.sort.amountDesc | `AdminDepositVerificationTable` > sort option (`AdminDepositVerificationTable.tsx:128`) | Item | Số tiền (Giảm dần) | Sorts by `amount_desc` | dropdown option |
| admin.deposits.sort.amountAsc | `AdminDepositVerificationTable` > sort option (`AdminDepositVerificationTable.tsx:129`) | Item | Số tiền (Tăng dần) | Sorts by `amount_asc` | dropdown option |
| admin.deposits.th.depositor | `AdminDepositVerificationTable` > `Th` (`AdminDepositVerificationTable.tsx:142`) | Label | Người nạp | — | table header |
| admin.deposits.th.content | `AdminDepositVerificationTable` > `Th` (`AdminDepositVerificationTable.tsx:143`) | Label | Nội dung chuyển khoản | — | table header |
| admin.deposits.th.amount | `AdminDepositVerificationTable` > `Th` (`AdminDepositVerificationTable.tsx:144`) | Label | Số tiền | — | table header |
| admin.deposits.th.bankTxId | `AdminDepositVerificationTable` > `Th` (`AdminDepositVerificationTable.tsx:145`) | Label | Mã GD ngân hàng | — | table header |
| admin.deposits.th.time | `AdminDepositVerificationTable` > `Th` (`AdminDepositVerificationTable.tsx:146`) | Label | Thời gian | — | table header |
| admin.deposits.th.receipt | `AdminDepositVerificationTable` > `Th` (`AdminDepositVerificationTable.tsx:147`) | Label | Biên lai | — | table header |
| admin.deposits.th.actions | `AdminDepositVerificationTable` > `Th` (`AdminDepositVerificationTable.tsx:148`) | Label | Thao tác | — | table header |
| admin.deposits.filteredEmpty | `AdminDepositVerificationTable` > filtered empty cell (`AdminDepositVerificationTable.tsx:154–156`) | Empty state | Không tìm thấy kết quả phù hợp với bộ lọc hiện tại. | — | rendered when search/filter returns 0 items |
| admin.deposits.proof.view | `AdminDepositVerificationTable` > proof link text (`AdminDepositVerificationTable.tsx:191`) | CTA | Xem minh chứng | Opens proof file URL in new browser tab | rendered when `deposit.proof_file_url` is truthy |
| admin.deposits.proof.missing | `AdminDepositVerificationTable` > missing proof span (`AdminDepositVerificationTable.tsx:197`) | Item | Không tìm thấy file | — | rendered when `deposit.proof_file_url` is falsy |
| admin.deposits.action.menuTrigger | `AdminDepositVerificationTable` > `ActionIcon` (`AdminDepositVerificationTable.tsx:205–207`) | CTA | — | Opens approval/rejection action menu | rendered for pending deposits |
| admin.deposits.action.approve | `AdminDepositVerificationTable` > `Menu.Item` (`AdminDepositVerificationTable.tsx:216`) | CTA | Duyệt | Calls `onApprove(deposit.id)` → opens `ApprovePaymentModal` | pending deposit menu item |
| admin.deposits.action.reject | `AdminDepositVerificationTable` > `Menu.Item` (`AdminDepositVerificationTable.tsx:223`) | CTA | Từ chối | Calls `onReject(deposit.id)` → opens `RejectionReasonModal` | pending deposit menu item |
| admin.deposits.badge.verified | `AdminDepositVerificationTable` > `Badge` (`AdminDepositVerificationTable.tsx:229`) | Badge | Đã duyệt | — | `deposit.status === "verified"` |
| admin.deposits.badge.rejected | `AdminDepositVerificationTable` > `Badge` (`AdminDepositVerificationTable.tsx:233`) | Badge | Bị từ chối | — | `deposit.status === "rejected"` |
| admin.approvePayment.modal.title | `ApprovePaymentModal` > modal title (`ApprovePaymentModal.tsx:42`) | Modal | Xác nhận duyệt thanh toán | — | modal open |
| admin.approvePayment.confirmQuestion | `ApprovePaymentModal` > question text (`ApprovePaymentModal.tsx:60`) | Description | Xác nhận đã nhận đủ số tiền thanh toán cho giao dịch này? | — | modal open |
| admin.approvePayment.confirmExplanation | `ApprovePaymentModal` > explanation paragraph (`ApprovePaymentModal.tsx:63`) | Description | Sau khi xác nhận, hệ thống sẽ tự động chuyển trạng thái giao dịch sang <strong>Đã thanh toán (Paid)</strong>, kích hoạt lượt Credit tương ứng và cập nhật tiến độ hồ sơ cho sinh viên. | — | modal open |
| admin.approvePayment.cancelBtn | `ApprovePaymentModal` > Cancel `Button` (`ApprovePaymentModal.tsx:74`) | CTA | Hủy bỏ | Closes modal via `onClose` | enabled |
| admin.approvePayment.submitBtn | `ApprovePaymentModal` > Submit `Button` (`ApprovePaymentModal.tsx:84`) | CTA | Xác nhận duyệt | Calls `handleConfirm` → calls `verifyDeposit` | disabled while submitting |
| admin.approvePayment.submittingBtn | `ApprovePaymentModal` > Submit `Button` (`ApprovePaymentModal.tsx:84`) | CTA | Đang xử lý... | — | rendered when `isSubmitting === true` |
| admin.approvePayment.toast.success.title | `page.tsx` > `handleConfirmApprove` notification (`page.tsx:109`) | Toast | Duyệt nạp tiền thành công | — | approval success branch |
| admin.approvePayment.toast.success.message | `page.tsx` > `handleConfirmApprove` notification (`page.tsx:110`) | Toast | Đã duyệt nạp tiền thành công! | — | approval success branch |
| admin.approvePayment.toast.error.title | `page.tsx` > `handleConfirmApprove` notification (`page.tsx:115`) | Toast | Lỗi | — | approval error branch |
| admin.rejectionModal.title | `RejectionReasonModal` > modal title (`RejectionReasonModal.tsx:38`) | Modal | Từ chối giao dịch thanh toán | — | modal open |
| admin.rejectionModal.label | `RejectionReasonModal` > `Textarea` label (`RejectionReasonModal.tsx:47`) | Label | Lý do từ chối (Bắt buộc) | — | modal open |
| admin.rejectionModal.placeholder | `RejectionReasonModal` > `Textarea` placeholder (`RejectionReasonModal.tsx:50`) | Placeholder | Nhập lý do từ chối chuyển khoản cụ thể (ví dụ: Số tiền chuyển khoản không khớp, sai nội dung chuyển khoản...) | Sets rejection reason text | modal open |
| admin.rejectionModal.minCharWarning | `RejectionReasonModal` > character count hint (`RejectionReasonModal.tsx:61`) | Error | Cần nhập tối thiểu 10 ký tự (Hiện tại: `<code>{reason.length}</code>`/10) | — | rendered when `reason.length < 10` |
| admin.rejectionModal.eligibleNotice | `RejectionReasonModal` > character count hint (`RejectionReasonModal.tsx:62`) | Helper | Đủ điều kiện phê duyệt | — | rendered when `reason.length >= 10` |
| admin.rejectionModal.cancelBtn | `RejectionReasonModal` > Cancel `Button` (`RejectionReasonModal.tsx:74`) | CTA | Hủy bỏ | Closes modal via `handleClose` | enabled |
| admin.rejectionModal.submitBtn | `RejectionReasonModal` > Submit `Button` (`RejectionReasonModal.tsx:82`) | CTA | Xác nhận Từ chối | Submits rejection with reason | disabled when `reason.trim().length < 10` |
| admin.rejectionModal.submittingBtn | `RejectionReasonModal` > Submit `Button` (`RejectionReasonModal.tsx:82`) | CTA | Đang xử lý... | — | rendered when `isSubmitting === true` |
| admin.rejectionModal.toast.success.title | `page.tsx` > `handleConfirmReject` notification (`page.tsx:137`) | Toast | Đã từ chối nạp tiền | — | rejection success branch |
| admin.rejectionModal.toast.success.message | `page.tsx` > `handleConfirmReject` notification (`page.tsx:138`) | Toast | Đã từ chối minh chứng nạp tiền và gửi lý do cho sinh viên. | — | rejection success branch |
| admin.rejectionModal.toast.error.title | `page.tsx` > `handleConfirmReject` notification (`page.tsx:143`) | Toast | Lỗi | — | rejection error branch |
| admin.rejectionModal.toast.error.message | `page.tsx` > `handleConfirmReject` notification (`page.tsx:144`) | Toast | Gặp lỗi khi thực hiện từ chối nạp tiền. | — | rejection error branch |

### 2.6 Tab Quản lý & Phân công hồ sơ (Case Assignment Table & Modals)

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| admin.cases.search.placeholder | `AdminCaseAssignmentTable` > search input (`AdminCaseAssignmentTable.tsx:73`) | Placeholder | Tìm theo mã hồ sơ, tên nhóm, chủ sở hữu... | Sets search query | default |
| admin.cases.sort.placeholder | `AdminCaseAssignmentTable` > sort select (`AdminCaseAssignmentTable.tsx:81`) | Placeholder | Sắp xếp | — | default |
| admin.cases.sort.newest | `AdminCaseAssignmentTable` > sort option (`AdminCaseAssignmentTable.tsx:83`) | Item | Mới nhất | Selects `created_at_desc` | default |
| admin.cases.sort.oldest | `AdminCaseAssignmentTable` > sort option (`AdminCaseAssignmentTable.tsx:84`) | Item | Cũ nhất | Selects `created_at_asc` | dropdown option |
| admin.cases.sort.caseCodeAsc | `AdminCaseAssignmentTable` > sort option (`AdminCaseAssignmentTable.tsx:85`) | Item | Mã hồ sơ (A-Z) | Selects `case_code_asc` | dropdown option |
| admin.cases.sort.caseCodeDesc | `AdminCaseAssignmentTable` > sort option (`AdminCaseAssignmentTable.tsx:86`) | Item | Mã hồ sơ (Z-A) | Selects `case_code_desc` | dropdown option |
| admin.cases.refresh.tooltip | `AdminCaseAssignmentTable` > refresh `Tooltip` (`AdminCaseAssignmentTable.tsx:94`) | Helper | Làm mới | Calls `onRefresh` | default |
| admin.cases.empty.title | `AdminCaseAssignmentTable` > empty state (`AdminCaseAssignmentTable.tsx:113`) | Empty state | Không có hồ sơ nào cần xử lý | — | `total === 0` |
| admin.cases.empty.desc | `AdminCaseAssignmentTable` > empty state (`AdminCaseAssignmentTable.tsx:114–116`) | Description | Tất cả các hồ sơ đã được xử lý xong hoặc không tìm thấy hồ sơ phù hợp. | — | `total === 0` |
| admin.cases.th.code | `AdminCaseAssignmentTable` > `Th` (`AdminCaseAssignmentTable.tsx:124`) | Label | Mã hồ sơ | — | table header |
| admin.cases.th.team | `AdminCaseAssignmentTable` > `Th` (`AdminCaseAssignmentTable.tsx:125`) | Label | Nhóm / Đề tài | — | table header |
| admin.cases.th.package | `AdminCaseAssignmentTable` > `Th` (`AdminCaseAssignmentTable.tsx:126`) | Label | Gói dịch vụ | — | table header |
| admin.cases.th.status | `AdminCaseAssignmentTable` > `Th` (`AdminCaseAssignmentTable.tsx:127`) | Label | Trạng thái | — | table header |
| admin.cases.th.supporter | `AdminCaseAssignmentTable` > `Th` (`AdminCaseAssignmentTable.tsx:128`) | Label | Người phụ trách | — | table header |
| admin.cases.th.sla | `AdminCaseAssignmentTable` > `Th` (`AdminCaseAssignmentTable.tsx:129`) | Label | SLA | — | table header |
| admin.cases.th.actions | `AdminCaseAssignmentTable` > `Th` (`AdminCaseAssignmentTable.tsx:130`) | Label | Thao tác | — | table header |
| admin.cases.row.teamFallback | `AdminCaseAssignmentTable` > team name fallback (`AdminCaseAssignmentTable.tsx:141, 143`) | Item | Chưa đặt tên | — | rendered when `item.team_name` is falsy |
| admin.cases.row.ownerLabel | `AdminCaseAssignmentTable` > owner prefix (`AdminCaseAssignmentTable.tsx:145`) | Item | Chủ sở hữu: `<code>{item.owner_name}</code>` | — | default |
| admin.cases.row.unassignedSupporter | `AdminCaseAssignmentTable` > unassigned text (`AdminCaseAssignmentTable.tsx:176`) | Item | Chưa phân công | — | rendered when `assigned_supporter` is null |
| admin.cases.sla.overdue | `SlaTimer` > overdue text (`AdminCaseAssignmentTable.tsx:325–326`) | Error | Quá hạn | — | rendered when SLA deadline has elapsed (`diff <= 0`) |
| admin.cases.action.viewDetail | `AdminCaseAssignmentTable` > `Menu.Item` (`AdminCaseAssignmentTable.tsx:197, 222`) | CTA | Xem chi tiết | Sets `detailCaseId` → opens `AdminCaseDetailModal` | default in action menu |
| admin.cases.action.deleteCase | `AdminCaseAssignmentTable` > `Menu.Item` (`AdminCaseAssignmentTable.tsx:204`) | CTA | Xoá hồ sơ | Calls `onDelete(item.id)` with confirmation prompt | rendered when `isCrudMode === true` |
| admin.cases.action.deleteConfirm | `page.tsx` > `handleDeleteCase` (`page.tsx:202`) | Confirmation | Bạn có chắc chắn muốn xóa hồ sơ đề tài này không? Hành động này không thể hoàn tác. | Native confirmation dialog | trigger on delete action |
| admin.cases.action.rejectCase | `AdminCaseAssignmentTable` > `Menu.Item` (`AdminCaseAssignmentTable.tsx:231`) | CTA | Từ chối | Sets `rejectingCaseId` → opens `RejectCaseModal` | rendered when `internal_status === "triage_pending"` and stage is `"submitted"` |
| admin.cases.action.approveCase | `AdminCaseAssignmentTable` > `Menu.Item` (`AdminCaseAssignmentTable.tsx:240`) | CTA | Duyệt hồ sơ | Sets `acceptingCaseId` → opens `ApproveCaseModal` | disabled with title `Chưa hoàn tất thanh toán` if unpaid |
| admin.cases.action.unpaidTooltip | `AdminCaseAssignmentTable` > disabled item title (`AdminCaseAssignmentTable.tsx:237`) | Helper | Chưa hoàn tất thanh toán | — | tooltip on disabled approve item |
| admin.cases.action.assignSupporter | `AdminCaseAssignmentTable` > `Menu.Item` (`AdminCaseAssignmentTable.tsx:250`) | CTA | Phân công Supporter | Sets `assignCaseId` → opens `AssignSupporterModal` | rendered when `internal_status === "accepted_unassigned"` |
| admin.cases.action.reassignSupporter | `AdminCaseAssignmentTable` > `Menu.Item` (`AdminCaseAssignmentTable.tsx:250`) | CTA | Phân công lại | Sets `assignCaseId` → opens `AssignSupporterModal` | rendered when `internal_status === "assigned"` |
| admin.caseDetail.title | `AdminCaseDetailModal` > modal title (`AdminCaseDetailModal.tsx:61`) | Modal | Hồ sơ phản biện: `<code>{detailData?.case?.case_code}</code>` | — | modal open |
| admin.caseDetail.loading | `AdminCaseDetailModal` > loading text (`AdminCaseDetailModal.tsx:71`) | Description | Đang tải hồ sơ phản biện... | — | `isFetchingDetail === true` |
| admin.caseDetail.sec.general | `AdminCaseDetailModal` > section heading (`AdminCaseDetailModal.tsx:78`) | Heading | Thông tin chung | — | modal open |
| admin.caseDetail.lbl.teamName | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:81`) | Label | Tên nhóm / Đề tài | — | modal open |
| admin.caseDetail.lbl.packageName | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:85`) | Label | Gói dịch vụ | — | modal open |
| admin.caseDetail.lbl.school | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:89`) | Label | Trường học | — | modal open |
| admin.caseDetail.lbl.courseContext | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:93`) | Label | Bối cảnh môn học | — | modal open |
| admin.caseDetail.lbl.createdAt | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:97`) | Label | Ngày tạo | — | modal open |
| admin.caseDetail.lbl.internalStatus | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:103`) | Label | Trạng thái nội bộ | — | modal open |
| admin.caseDetail.noIntake.title | `AdminCaseDetailModal` > no intake title (`AdminCaseDetailModal.tsx:130`) | Empty state | Sinh viên đã thanh toán nhưng chưa nộp hồ sơ | — | rendered when `hasNoIntake === true` |
| admin.caseDetail.noIntake.desc | `AdminCaseDetailModal` > no intake desc (`AdminCaseDetailModal.tsx:133`) | Description | Nội dung hồ sơ phản biện sẽ hiển thị ở đây sau khi sinh viên hoàn thành bước nộp hồ sơ. | — | rendered when `hasNoIntake === true` |
| admin.caseDetail.sec.contact | `AdminCaseDetailModal` > section heading (`AdminCaseDetailModal.tsx:141`) | Heading | Người liên hệ chính (Đại diện nhóm) | — | rendered when `contact` exists |
| admin.caseDetail.lbl.fullName | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:144`) | Label | Họ tên | — | modal open |
| admin.caseDetail.lbl.studentCode | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:148`) | Label | Mã sinh viên | — | modal open |
| admin.caseDetail.lbl.email | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:152`) | Label | Email | — | modal open |
| admin.caseDetail.lbl.zaloTele | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:156`) | Label | Zalo / Telegram | — | modal open |
| admin.caseDetail.lbl.teamRole | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:165`) | Label | Vai trò trong nhóm | — | modal open |
| admin.caseDetail.sec.needs | `AdminCaseDetailModal` > section heading (`AdminCaseDetailModal.tsx:173`) | Heading | Yêu cầu hiện tại | — | modal open |
| admin.caseDetail.lbl.currentBlocker | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:177`) | Label | Điểm kẹt hiện tại | — | rendered when `current_blocker` exists |
| admin.caseDetail.lbl.primaryNeed | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:186`) | Label | Nhu cầu hỗ trợ chính | — | rendered when `primary_need` exists |
| admin.caseDetail.lbl.expectedOutputs | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:195`) | Label | Kỳ vọng đầu ra | — | rendered when `expected_outputs` exists |
| admin.caseDetail.lbl.extraNotes | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:204`) | Label | Ghi chú thêm cho Supporter | — | rendered when `extra_notes` exists |
| admin.caseDetail.lbl.lecturerFeedback | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:213`) | Label | Góp ý từ giảng viên (nếu có) | — | rendered when `lecturer_feedback` exists |
| admin.caseDetail.lbl.caseSummaryLegacy | `AdminCaseDetailModal` > label (`AdminCaseDetailModal.tsx:222`) | Label | Tóm tắt ý tưởng đề tài (legacy) | — | rendered when no `current_blocker` and `case_summary` exists |
| admin.caseDetail.sec.documents | `AdminCaseDetailModal` > section heading (`AdminCaseDetailModal.tsx:233`) | Heading | Tài liệu minh chứng hồ sơ | — | rendered when documents exist |
| admin.caseDetail.docFallback | `AdminCaseDetailModal` > doc fallback (`AdminCaseDetailModal.tsx:237`) | Item | Tài liệu đính kèm | — | rendered when `doc.document_type` is falsy |
| admin.caseDetail.docNoLink | `AdminCaseDetailModal` > no link text (`AdminCaseDetailModal.tsx:248`) | Item | Chưa có liên kết | — | rendered when URL is falsy |
| admin.caseDetail.closeBtn | `AdminCaseDetailModal` > Close `Button` (`AdminCaseDetailModal.tsx:263`) | CTA | Đóng | Closes modal via `onClose` | enabled |
| admin.caseDetail.rejectBtn | `AdminCaseDetailModal` > Reject `Button` (`AdminCaseDetailModal.tsx:274`) | CTA | Từ chối | Calls `onReject` → opens `RejectCaseModal` | rendered when `canReject === true` |
| admin.caseDetail.approveBtn | `AdminCaseDetailModal` > Approve `Button` (`AdminCaseDetailModal.tsx:285`) | CTA | Duyệt hồ sơ | Calls `onApprove` → opens `ApproveCaseModal` | disabled with title if payment incomplete |
| admin.caseDetail.assignBtn | `AdminCaseDetailModal` > Assign `Button` (`AdminCaseDetailModal.tsx:294`) | CTA | Phân công Supporter / Phân công lại | Calls `onAssign` → opens `AssignSupporterModal` | rendered when `canAssign === true` |
| admin.approveCase.title | `ApproveCaseModal` > modal title (`ApproveCaseModal.tsx:48`) | Modal | Xác nhận duyệt hồ sơ | — | modal open |
| admin.approveCase.prompt | `ApproveCaseModal` > question text (`ApproveCaseModal.tsx:61`) | Description | Xác nhận duyệt hồ sơ này là hợp lệ để tiến hành phản biện? Hồ sơ sẽ được chuyển sang trạng thái <strong>Chờ Phân Công</strong>. | — | modal open |
| admin.approveCase.cancelBtn | `ApproveCaseModal` > Cancel `Button` (`ApproveCaseModal.tsx:71`) | CTA | Hủy | Closes modal via `onClose` | enabled |
| admin.approveCase.confirmBtn | `ApproveCaseModal` > Confirm `Button` (`ApproveCaseModal.tsx:80`) | CTA | Xác nhận duyệt | Calls `onApprove(caseId)` | disabled while submitting |
| admin.approveCase.toast.success.title | `page.tsx` > `handleAcceptCase` notification (`page.tsx:171`) | Toast | Duyệt hồ sơ thành công | — | approval success branch |
| admin.approveCase.toast.success.message | `page.tsx` > `handleAcceptCase` notification (`page.tsx:172`) | Toast | Đã duyệt hồ sơ và chuyển sang hàng chờ phân công. | — | approval success branch |
| admin.rejectCase.title | `RejectCaseModal` > modal title (`RejectCaseModal.tsx:50`) | Modal | Từ chối hồ sơ phản biện | — | modal open |
| admin.rejectCase.label | `RejectCaseModal` > `Textarea` label (`RejectCaseModal.tsx:63`) | Label | Lý do từ chối (Bắt buộc, tối thiểu 10 ký tự) | — | modal open |
| admin.rejectCase.placeholder | `RejectCaseModal` > `Textarea` placeholder (`RejectCaseModal.tsx:64`) | Placeholder | Nhập lý do chi tiết từ chối hồ sơ... | Sets rejection reason text | modal open |
| admin.rejectCase.cancelBtn | `RejectCaseModal` > Cancel `Button` (`RejectCaseModal.tsx:81`) | CTA | Hủy | Closes modal via `onClose` | enabled |
| admin.rejectCase.confirmBtn | `RejectCaseModal` > Confirm `Button` (`RejectCaseModal.tsx:90`) | CTA | Xác nhận Từ chối | Calls `onReject(caseId, reason)` | disabled when `rejectReason.trim().length < 10` |
| admin.rejectCase.toast.success.title | `page.tsx` > `handleRejectCase` notification (`page.tsx:188`) | Toast | Từ chối hồ sơ thành công | — | rejection success branch |
| admin.rejectCase.toast.success.message | `page.tsx` > `handleRejectCase` notification (`page.tsx:189`) | Toast | Đã từ chối hồ sơ thành công. | — | rejection success branch |
| admin.assignSupporter.title | `AssignSupporterModal` > modal title (`AssignSupporterModal.tsx:53`) | Modal | Phân công Supporter | — | modal open |
| admin.assignSupporter.desc | `AssignSupporterModal` > description (`AssignSupporterModal.tsx:65`) | Description | Chọn Supporter chuyên môn phụ trách đánh giá và hỗ trợ hồ sơ này. | — | modal open |
| admin.assignSupporter.select.label | `AssignSupporterModal` > `Select` label (`AssignSupporterModal.tsx:68`) | Label | Supporter | — | modal open |
| admin.assignSupporter.select.placeholder | `AssignSupporterModal` > `Select` placeholder (`AssignSupporterModal.tsx:69`) | Placeholder | Chọn Supporter | Selects supporter from dropdown | modal open |
| admin.assignSupporter.cancelBtn | `AssignSupporterModal` > Cancel `Button` (`AssignSupporterModal.tsx:85`) | CTA | Hủy | Closes modal via `onClose` | enabled |
| admin.assignSupporter.confirmBtn | `AssignSupporterModal` > Confirm `Button` (`AssignSupporterModal.tsx:94`) | CTA | Xác nhận Phân công | Calls `onAssign(caseId, supporterId)` | disabled when `!selectedId` |
| admin.assignSupporter.toast.success.title | `page.tsx` > `handleAssignSupporter` notification (`page.tsx:154`) | Toast | Phân công thành công | — | assignment success branch |
| admin.assignSupporter.toast.success.message | `page.tsx` > `handleAssignSupporter` notification (`page.tsx:155`) | Toast | Đã phân công Supporter chuyên môn phụ trách case thành công! | — | assignment success branch |

### 2.7 Tab Quản lý hệ thống tài liệu (Documents Table & Delete Actions)

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| admin.docs.empty.title | `AdminDocumentsTable` > empty state (`AdminDocumentsTable.tsx:167`) | Empty state | Không có tài liệu nào | — | `documents.length === 0` |
| admin.docs.empty.desc | `AdminDocumentsTable` > empty state (`AdminDocumentsTable.tsx:168–170`) | Description | Hệ thống hiện tại chưa có dữ liệu tài liệu nào được tải lên. | — | `documents.length === 0` |
| admin.docs.search.placeholder | `AdminDocumentsTable` > search input (`AdminDocumentsTable.tsx:187`) | Placeholder | Tìm theo tên tài liệu, mã hồ sơ, người tải... | Sets `searchQuery` | default |
| admin.docs.extension.placeholder | `AdminDocumentsTable` > extension select (`AdminDocumentsTable.tsx:195`) | Placeholder | Định dạng | — | default |
| admin.docs.extension.all | `AdminDocumentsTable` > extension option (`AdminDocumentsTable.tsx:197`) | Item | Tất cả định dạng | Sets `selectedExtension` to `"all"` | dropdown option |
| admin.docs.docType.placeholder | `AdminDocumentsTable` > docType select (`AdminDocumentsTable.tsx:206`) | Placeholder | Loại tài liệu | — | default |
| admin.docs.docType.all | `AdminDocumentsTable` > docType option (`AdminDocumentsTable.tsx:208`) | Item | Tất cả loại | Sets `selectedDocType` to `"all"` | dropdown option |
| admin.docs.sort.placeholder | `AdminDocumentsTable` > sort select (`AdminDocumentsTable.tsx:217`) | Placeholder | Sắp xếp | — | default |
| admin.docs.sort.newest | `AdminDocumentsTable` > sort option (`AdminDocumentsTable.tsx:219`) | Item | Mới nhất | Selects `created_at_desc` | default |
| admin.docs.sort.oldest | `AdminDocumentsTable` > sort option (`AdminDocumentsTable.tsx:220`) | Item | Cũ nhất | Selects `created_at_asc` | dropdown option |
| admin.docs.sort.nameAsc | `AdminDocumentsTable` > sort option (`AdminDocumentsTable.tsx:221`) | Item | Tên (A-Z) | Selects `name_asc` | dropdown option |
| admin.docs.sort.nameDesc | `AdminDocumentsTable` > sort option (`AdminDocumentsTable.tsx:222`) | Item | Tên (Z-A) | Selects `name_desc` | dropdown option |
| admin.docs.th.name | `AdminDocumentsTable` > `Th` (`AdminDocumentsTable.tsx:236`) | Label | Tên tài liệu | — | table header |
| admin.docs.th.format | `AdminDocumentsTable` > `Th` (`AdminDocumentsTable.tsx:237`) | Label | Định dạng | — | table header |
| admin.docs.th.type | `AdminDocumentsTable` > `Th` (`AdminDocumentsTable.tsx:238`) | Label | Loại | — | table header |
| admin.docs.th.relatedCase | `AdminDocumentsTable` > `Th` (`AdminDocumentsTable.tsx:239`) | Label | Dự án liên quan | — | table header |
| admin.docs.th.uploadedBy | `AdminDocumentsTable` > `Th` (`AdminDocumentsTable.tsx:240`) | Label | Người tải lên | — | table header |
| admin.docs.th.uploadedDate | `AdminDocumentsTable` > `Th` (`AdminDocumentsTable.tsx:241`) | Label | Ngày tải | — | table header |
| admin.docs.th.actions | `AdminDocumentsTable` > `Th` (`AdminDocumentsTable.tsx:242`) | Label | Thao tác | — | table header |
| admin.docs.filteredEmpty | `AdminDocumentsTable` > filtered empty cell (`AdminDocumentsTable.tsx:249`) | Empty state | Không tìm thấy tài liệu phù hợp với bộ lọc hiện tại. | — | rendered when search/filter returns 0 items |
| admin.docs.badge.superseded | `AdminDocumentsTable` > `Badge` (`AdminDocumentsTable.tsx:295`) | Badge | Đã thay thế | — | rendered when `doc.superseded_at` is not null |
| admin.docs.action.delete | `AdminDocumentsTable` > `Menu.Item` (`AdminDocumentsTable.tsx:346`) | CTA | Xóa tài liệu | Calls `handleDeleteClick` with confirmation dialog | disabled while `isDeleting === true` |
| admin.docs.deleteConfirm | `AdminDocumentsTable` > confirmation dialog (`AdminDocumentsTable.tsx:155`) | Confirmation | Bạn có chắc chắn muốn xóa tài liệu "<code>{name}</code>"?\nHành động này sẽ xóa file khỏi Cloudinary và gỡ hoàn toàn khỏi cơ sở dữ liệu. | Native browser confirm dialog | trigger on delete action |
| admin.docs.toast.success.title | `page.tsx` > `handleDeleteDocument` notification (`page.tsx:224`) | Toast | Xóa tài liệu thành công | — | delete success branch |
| admin.docs.toast.success.message | `page.tsx` > `handleDeleteDocument` notification (`page.tsx:225`) | Toast | Đã xóa tài liệu khỏi hệ thống thành công! | — | delete success branch |

### 2.8 Tab Quản lý người dùng (Users Table & Modals)

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| admin.users.loading | `AdminUsersTable` > loading state (`AdminUsersTable.tsx:154`) | Description | Đang tải danh sách người dùng... | — | `isLoading === true` |
| admin.users.empty.title | `AdminUsersTable` > empty state (`AdminUsersTable.tsx:194`) | Empty state | Không có người dùng nào | — | `users.length === 0` |
| admin.users.empty.desc | `AdminUsersTable` > empty state (`AdminUsersTable.tsx:195–197`) | Description | Danh sách trống hoặc chưa có dữ liệu phù hợp. | — | `users.length === 0` |
| admin.users.search.placeholder | `AdminUsersTable` > search input (`AdminUsersTable.tsx:164, 221`) | Placeholder | Tìm theo tên người dùng... | Sets `searchQuery` | default |
| admin.users.sort.placeholder | `AdminUsersTable` > sort select (`AdminUsersTable.tsx:229`) | Placeholder | Sắp xếp | — | default |
| admin.users.sort.newest | `AdminUsersTable` > sort option (`AdminUsersTable.tsx:231`) | Item | Mới nhất | Selects `created_at_desc` | default |
| admin.users.sort.oldest | `AdminUsersTable` > sort option (`AdminUsersTable.tsx:232`) | Item | Cũ nhất | Selects `created_at_asc` | dropdown option |
| admin.users.sort.nameAsc | `AdminUsersTable` > sort option (`AdminUsersTable.tsx:233`) | Item | Tên A → Z | Selects `name_asc` | dropdown option |
| admin.users.sort.nameDesc | `AdminUsersTable` > sort option (`AdminUsersTable.tsx:234`) | Item | Tên Z → A | Selects `name_desc` | dropdown option |
| admin.users.role.placeholder | `AdminUsersTable` > role select (`AdminUsersTable.tsx:172, 242`) | Placeholder | Vai trò | — | default |
| admin.users.role.all | `AdminUsersTable` > role option (`AdminUsersTable.tsx:12`) | Item | Tất cả vai trò | Sets `roleFilter` to `"all"` | dropdown option |
| admin.users.role.admin | `AdminUsersTable` > role option (`AdminUsersTable.tsx:13`) | Item | Admin | Sets `roleFilter` to `"admin"` | dropdown option |
| admin.users.role.supporter | `AdminUsersTable` > role option (`AdminUsersTable.tsx:14`) | Item | Supporter | Sets `roleFilter` to `"supporter"` | dropdown option |
| admin.users.role.user | `AdminUsersTable` > role option (`AdminUsersTable.tsx:15`) | Item | Student | Sets `roleFilter` to `"user"` | dropdown option |
| admin.users.role.banned | `AdminUsersTable` > role option (`AdminUsersTable.tsx:16`) | Item | Bị khóa | Sets `roleFilter` to `"banned"` | dropdown option |
| admin.users.createUserBtn | `AdminUsersTable` > `Button` (`AdminUsersTable.tsx:186, 256`) | CTA | Tạo người dùng mới | Opens `CreateUserModal` (`showCreateModal = true`) | default |
| admin.users.th.name | `AdminUsersTable` > `Th` (`AdminUsersTable.tsx:264`) | Label | Họ tên | — | table header |
| admin.users.th.email | `AdminUsersTable` > `Th` (`AdminUsersTable.tsx:265`) | Label | Email | — | table header |
| admin.users.th.role | `AdminUsersTable` > `Th` (`AdminUsersTable.tsx:266`) | Label | Vai trò | — | table header |
| admin.users.th.status | `AdminUsersTable` > `Th` (`AdminUsersTable.tsx:267`) | Label | Trạng thái | — | table header |
| admin.users.th.createdAt | `AdminUsersTable` > `Th` (`AdminUsersTable.tsx:268`) | Label | Ngày tạo | — | table header |
| admin.users.th.actions | `AdminUsersTable` > `Th` (`AdminUsersTable.tsx:269`) | Label | Thao tác | — | table header |
| admin.users.badge.banned | `AdminUsersTable` > `Badge` (`AdminUsersTable.tsx:291`) | Badge | Bị khóa | Tooltip shows `user.banReason` | `user.banned === true` |
| admin.users.badge.bannedTooltipFallback | `AdminUsersTable` > `Tooltip` label (`AdminUsersTable.tsx:289`) | Helper | Không có lý do | Tooltip when `user.banReason` is empty | `user.banned === true` |
| admin.users.badge.active | `AdminUsersTable` > `Badge` (`AdminUsersTable.tsx:296`) | Badge | Hoạt động | — | `!user.banned` |
| admin.users.action.unban | `AdminUsersTable` > `Menu.Item` (`AdminUsersTable.tsx:317`) | CTA | Mở khóa tài khoản | Calls `handleUnbanUser(user.id, user.name)` | disabled while `isUnbanning === true` |
| admin.users.action.ban | `AdminUsersTable` > `Menu.Item` (`AdminUsersTable.tsx:325`) | CTA | Khóa tài khoản | Opens `BanUserModal` for this user | rendered when user is not banned |
| admin.users.paginationCount | `AdminUsersTable` > summary footer (`AdminUsersTable.tsx:344`) | Item | Hiển thị `<code>{users.length}</code>` / `<code>{total}</code>` người dùng | — | default |
| admin.createUser.title | `CreateUserModal` > modal title (`CreateUserModal.tsx:55`) | Modal | Tạo người dùng mới | — | modal open |
| admin.createUser.email.label | `CreateUserModal` > `TextInput` label (`CreateUserModal.tsx:64`) | Label | Email | — | modal open |
| admin.createUser.email.placeholder | `CreateUserModal` > `TextInput` placeholder (`CreateUserModal.tsx:68`) | Placeholder | user@example.com | Sets user email | modal open |
| admin.createUser.name.label | `CreateUserModal` > `TextInput` label (`CreateUserModal.tsx:77`) | Label | Họ tên | — | modal open |
| admin.createUser.name.placeholder | `CreateUserModal` > `TextInput` placeholder (`CreateUserModal.tsx:80`) | Placeholder | Nguyễn Văn A | Sets user full name | modal open |
| admin.createUser.role.label | `CreateUserModal` > `Select` label (`CreateUserModal.tsx:89`) | Label | Vai trò | — | modal open |
| admin.createUser.role.student | `CreateUserModal` > role option (`CreateUserModal.tsx:93`) | Item | Student | Sets role to `"user"` | dropdown option |
| admin.createUser.role.supporter | `CreateUserModal` > role option (`CreateUserModal.tsx:94`) | Item | Supporter | Sets role to `"supporter"` | dropdown option |
| admin.createUser.role.admin | `CreateUserModal` > role option (`CreateUserModal.tsx:95`) | Item | Admin | Sets role to `"admin"` | dropdown option |
| admin.createUser.infoText | `CreateUserModal` > info note (`CreateUserModal.tsx:104`) | Helper | Mật khẩu sẽ được tạo tự động và gửi qua email cho người dùng. Admin không cần nhập mật khẩu. | — | modal open |
| admin.createUser.err.emptyEmail | `CreateUserModal` > validation error (`CreateUserModal.tsx:32`) | Error | Vui lòng nhập email. | — | email input empty |
| admin.createUser.err.emptyName | `CreateUserModal` > validation error (`CreateUserModal.tsx:36`) | Error | Vui lòng nhập họ tên. | — | name input empty |
| admin.createUser.cancelBtn | `CreateUserModal` > Cancel `Button` (`CreateUserModal.tsx:119`) | CTA | Hủy | Closes modal via `handleClose` | enabled |
| admin.createUser.submitBtn | `CreateUserModal` > Submit `Button` (`CreateUserModal.tsx:127`) | CTA | Tạo tài khoản | Calls `handleSubmit` → `onConfirm` | disabled while submitting or fields empty |
| admin.createUser.submittingBtn | `CreateUserModal` > Submit `Button` (`CreateUserModal.tsx:127`) | CTA | Đang tạo... | — | rendered when `isSubmitting === true` |
| admin.createUser.toast.success.title | `AdminUsersTable` > `handleCreateUser` notification (`AdminUsersTable.tsx:97`) | Toast | Tạo tài khoản thành công | — | creation success branch |
| admin.createUser.toast.success.message | `AdminUsersTable` > `handleCreateUser` notification (`AdminUsersTable.tsx:98`) | Toast | Đã tạo tài khoản cho `<code>{data.name}</code>` và gửi email thông báo. | — | creation success branch |
| admin.banUser.title | `BanUserModal` > modal title (`BanUserModal.tsx:39`) | Modal | Khóa tài khoản | — | modal open |
| admin.banUser.warningText | `BanUserModal` > warning paragraph (`BanUserModal.tsx:48–50`) | Description | Bạn sắp khóa tài khoản của <strong>`<code>{userName}</code>`</strong>. Người dùng sẽ không thể đăng nhập và tất cả phiên đăng nhập sẽ bị hủy. | — | modal open |
| admin.banUser.reason.label | `BanUserModal` > `Textarea` label (`BanUserModal.tsx:54`) | Label | Lý do khóa (không bắt buộc) | — | modal open |
| admin.banUser.reason.placeholder | `BanUserModal` > `Textarea` placeholder (`BanUserModal.tsx:57`) | Placeholder | Nhập lý do khóa tài khoản... | Sets ban reason text | modal open |
| admin.banUser.cancelBtn | `BanUserModal` > Cancel `Button` (`BanUserModal.tsx:76`) | CTA | Hủy | Closes modal via `handleClose` | enabled |
| admin.banUser.confirmBtn | `BanUserModal` > Confirm `Button` (`BanUserModal.tsx:84`) | CTA | Xác nhận khóa | Calls `handleConfirm` → `onConfirm` | disabled while submitting |
| admin.banUser.submittingBtn | `BanUserModal` > Confirm `Button` (`BanUserModal.tsx:84`) | CTA | Đang xử lý... | — | rendered when `isSubmitting === true` |
| admin.banUser.toast.success.title | `AdminUsersTable` > `handleBanUser` notification (`AdminUsersTable.tsx:117`) | Toast | Đã khóa tài khoản | — | ban success branch |
| admin.banUser.toast.success.message | `AdminUsersTable` > `handleBanUser` notification (`AdminUsersTable.tsx:118`) | Toast | Đã khóa tài khoản `<code>{banTarget.userName}</code>` và gửi email thông báo. | — | ban success branch |
| admin.unbanUser.toast.success.title | `AdminUsersTable` > `handleUnbanUser` notification (`AdminUsersTable.tsx:135`) | Toast | Đã mở khóa tài khoản | — | unban success branch |
| admin.unbanUser.toast.success.message | `AdminUsersTable` > `handleUnbanUser` notification (`AdminUsersTable.tsx:136`) | Toast | Đã mở khóa tài khoản `<code>{userName}</code>` và gửi email thông báo. | — | unban success branch |

### 2.9 Tab Giám sát tiến trình AI - OMP Worker (Monitoring, KPI, Jobs, Terminal & Modals)

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| admin.workers.kpi.active.title | `WorkerKpiCards` > Card 1 title (`WorkerKpiCards.tsx:32`) | Label | Đang thực thi | — | default |
| admin.workers.kpi.active.unit | `WorkerKpiCards` > Card 1 unit (`WorkerKpiCards.tsx:34`) | Label | slots | — | default |
| admin.workers.kpi.active.detailActive | `WorkerKpiCards` > Card 1 detail (`WorkerKpiCards.tsx:35`) | Description | Tiến trình AI đang phân tích | — | rendered when `active > 0` |
| admin.workers.kpi.active.detailIdle | `WorkerKpiCards` > Card 1 detail (`WorkerKpiCards.tsx:35`) | Description | Hệ thống đang sẵn sàng | — | rendered when `active === 0` |
| admin.workers.kpi.active.badge | `WorkerKpiCards` > Card 1 badge (`WorkerKpiCards.tsx:36`) | Badge | `<code>{active}</code>` Active | — | default |
| admin.workers.kpi.waiting.title | `WorkerKpiCards` > Card 2 title (`WorkerKpiCards.tsx:41`) | Label | Hàng đợi chờ | — | default |
| admin.workers.kpi.waiting.unit | `WorkerKpiCards` > Card 2 unit (`WorkerKpiCards.tsx:43`) | Label | hồ sơ | — | default |
| admin.workers.kpi.waiting.detailQueued | `WorkerKpiCards` > Card 2 detail (`WorkerKpiCards.tsx:44`) | Description | Đang xếp hàng chờ slot trống | — | rendered when `waiting > 0` |
| admin.workers.kpi.waiting.detailEmpty | `WorkerKpiCards` > Card 2 detail (`WorkerKpiCards.tsx:44`) | Description | Không có hồ sơ chờ | — | rendered when `waiting === 0` |
| admin.workers.kpi.waiting.badge | `WorkerKpiCards` > Card 2 badge (`WorkerKpiCards.tsx:45`) | Badge | `<code>{waiting}</code>` Queued | — | default |
| admin.workers.kpi.completed.title | `WorkerKpiCards` > Card 3 title (`WorkerKpiCards.tsx:50`) | Label | Thành công 24h | — | default |
| admin.workers.kpi.completed.unit | `WorkerKpiCards` > Card 3 unit (`WorkerKpiCards.tsx:52`) | Label | hồ sơ | — | default |
| admin.workers.kpi.completed.detail | `WorkerKpiCards` > Card 3 detail (`WorkerKpiCards.tsx:53`) | Description | Thời lượng trung bình: `<code>{avgDuration}</code>` | — | default |
| admin.workers.kpi.completed.badge | `WorkerKpiCards` > Card 3 badge (`WorkerKpiCards.tsx:54`) | Badge | 24 giờ qua | — | default |
| admin.workers.kpi.stuck.title | `WorkerKpiCards` > Card 4 title (`WorkerKpiCards.tsx:59`) | Label | Cần xử lý / Kẹt | — | default |
| admin.workers.kpi.stuck.unit | `WorkerKpiCards` > Card 4 unit (`WorkerKpiCards.tsx:61`) | Label | sự cố | — | default |
| admin.workers.kpi.stuck.detail | `WorkerKpiCards` > Card 4 detail (`WorkerKpiCards.tsx:62`) | Description | `<code>{stuck}</code>` nghi kẹt (>10p) · `<code>{failed}</code>` thất bại | — | default |
| admin.workers.kpi.stuck.badgeAlert | `WorkerKpiCards` > Card 4 badge (`WorkerKpiCards.tsx:63`) | Badge | Cần can thiệp | — | rendered when `stuck > 0` |
| admin.workers.kpi.stuck.badgeNormal | `WorkerKpiCards` > Card 4 badge (`WorkerKpiCards.tsx:63`) | Badge | Bình thường | — | rendered when `stuck === 0` |
| admin.workers.jobs.search.placeholder | `WorkerJobsTable` > search input (`WorkerJobsTable.tsx:105`) | Placeholder | Tìm Job ID, mã case, đề tài, sinh viên... | Sets search filter | default |
| admin.workers.jobs.totalCount | `WorkerJobsTable` > count text (`WorkerJobsTable.tsx:112`) | Item | Tổng cộng: `<code>{total}</code>` tiến trình | — | default |
| admin.workers.jobs.th.jobId | `WorkerJobsTable` > `Th` (`WorkerJobsTable.tsx:119`) | Label | Job ID | — | table header |
| admin.workers.jobs.th.caseProject | `WorkerJobsTable` > `Th` (`WorkerJobsTable.tsx:120`) | Label | Mã Case & Đề tài | — | table header |
| admin.workers.jobs.th.student | `WorkerJobsTable` > `Th` (`WorkerJobsTable.tsx:121`) | Label | Sinh viên | — | table header |
| admin.workers.jobs.th.model | `WorkerJobsTable` > `Th` (`WorkerJobsTable.tsx:122`) | Label | Model AI | — | table header |
| admin.workers.jobs.th.time | `WorkerJobsTable` > `Th` (`WorkerJobsTable.tsx:123`) | Label | Thời gian | — | table header |
| admin.workers.jobs.th.status | `WorkerJobsTable` > `Th` (`WorkerJobsTable.tsx:124`) | Label | Trạng thái | — | table header |
| admin.workers.jobs.th.actions | `WorkerJobsTable` > `Th` (`WorkerJobsTable.tsx:125`) | Label | Thao tác | — | table header |
| admin.workers.jobs.loading | `WorkerJobsTable` > loading row (`WorkerJobsTable.tsx:130`) | Description | Đang tải danh sách tiến trình... | — | `isLoading === true` |
| admin.workers.jobs.empty | `WorkerJobsTable` > empty row (`WorkerJobsTable.tsx:132`) | Empty state | Không tìm thấy tiến trình nào phù hợp | — | `items.length === 0` |
| admin.workers.jobs.copyIdTooltip | `WorkerJobsTable` > `CopyButton` tooltip (`WorkerJobsTable.tsx:156`) | Helper | Copy Job ID / Đã copy Job ID! | Copies `job.id` to clipboard | default |
| admin.workers.jobs.attemptBadge | `WorkerJobsTable` > attempt badge (`WorkerJobsTable.tsx:172`) | Badge | Lần `<code>{job.attemptNo || 1}</code>` | — | default |
| admin.workers.jobs.subType.initial | `WorkerJobsTable` > submission type text (`WorkerJobsTable.tsx:64`) | Item | Lần đầu | — | type `initial` |
| admin.workers.jobs.subType.resubmit | `WorkerJobsTable` > submission type text (`WorkerJobsTable.tsx:65–66`) | Item | Đã sửa | — | type `resubmit` / `revision` |
| admin.workers.jobs.subType.logicCheck | `WorkerJobsTable` > submission type text (`WorkerJobsTable.tsx:67–70`) | Item | Soi logic | — | type `logic_check` / `logic_review` |
| admin.workers.jobs.caseLink | `WorkerJobsTable` > case link (`WorkerJobsTable.tsx:181–186`) | Navigation | `<code>{job.caseCode}</code>` | Navigates to `/cases/{job.caseId}` | default |
| admin.workers.jobs.studentFallback | `WorkerJobsTable` > student name fallback (`WorkerJobsTable.tsx:195`) | Item | Chưa có tên | — | rendered when `studentName` is falsy |
| admin.workers.jobs.badge.stuck | `WorkerJobsTable` > `StatusBadge` (`WorkerJobsTable.tsx:80`) | Badge | Nghi kẹt | — | `job.isStuck === true` |
| admin.workers.jobs.badge.running | `WorkerJobsTable` > `StatusBadge` (`WorkerJobsTable.tsx:83`) | Badge | Đang chạy | — | `job.status === "processing"` |
| admin.workers.jobs.badge.queued | `WorkerJobsTable` > `StatusBadge` (`WorkerJobsTable.tsx:86`) | Badge | Chờ xử lý | — | `job.status === "queued"` |
| admin.workers.jobs.badge.completed | `WorkerJobsTable` > `StatusBadge` (`WorkerJobsTable.tsx:89`) | Badge | Thành công | — | `job.status === "completed"` |
| admin.workers.jobs.badge.failed | `WorkerJobsTable` > `StatusBadge` (`WorkerJobsTable.tsx:92`) | Badge | Thất bại | — | `job.status === "failed"` |
| admin.workers.jobs.badge.cancelled | `WorkerJobsTable` > `StatusBadge` (`WorkerJobsTable.tsx:94`) | Badge | Đã hủy | — | default/cancelled status |
| admin.workers.jobs.action.view | `WorkerJobsTable` > `ActionIcon` tooltip (`WorkerJobsTable.tsx:211`) | Helper | Xem chi tiết | Opens `WorkerJobDetailDrawer` | default |
| admin.workers.jobs.action.heal | `WorkerJobsTable` > `ActionIcon` tooltip (`WorkerJobsTable.tsx:217`) | Helper | Giải phóng kẹt | Opens `HealStuckJobModal` | rendered when job is stuck/running/waiting |
| admin.workers.jobs.action.cancel | `WorkerJobsTable` > `ActionIcon` tooltip (`WorkerJobsTable.tsx:224`) | Helper | Hủy tiến trình | Calls `handleCancel(job.id)` with confirmation prompt | rendered when job is running/waiting |
| admin.workers.jobs.action.cancelConfirm | `AdminWorkerMonitoring` > cancel confirmation (`AdminWorkerMonitoring.tsx:61`) | Confirmation | Bạn có chắc chắn muốn hủy tiến trình thẩm định này không? | Native browser confirm dialog | trigger on cancel action |
| admin.workers.jobs.action.retry | `WorkerJobsTable` > `ActionIcon` tooltip (`WorkerJobsTable.tsx:230`) | Helper | Chạy lại tiến trình | Opens `RetryJobModal` | default |
| admin.jobDrawer.title | `WorkerJobDetailDrawer` > drawer title (`WorkerJobDetailDrawer.tsx:40`) | Heading | Tiến trình AI: `<code>{job?.caseCode}</code>` | — | drawer open |
| admin.jobDrawer.attemptBadge | `WorkerJobDetailDrawer` > attempt badge (`WorkerJobDetailDrawer.tsx:43`) | Badge | Lần chạy thứ `<code>{job?.attemptNo || 1}</code>` | — | drawer open |
| admin.jobDrawer.tab.overview | `WorkerJobDetailDrawer` > `Tabs.Tab` (`WorkerJobDetailDrawer.tsx:86`) | Navigation | Tổng quan | Switches to Overview panel | default active tab |
| admin.jobDrawer.tab.inputs | `WorkerJobDetailDrawer` > `Tabs.Tab` (`WorkerJobDetailDrawer.tsx:87`) | Navigation | Đầu vào | Switches to Inputs panel | drawer tab |
| admin.jobDrawer.tab.outputs | `WorkerJobDetailDrawer` > `Tabs.Tab` (`WorkerJobDetailDrawer.tsx:88`) | Navigation | Kết quả & Báo cáo | Switches to Outputs panel | drawer tab |
| admin.jobDrawer.tab.logs | `WorkerJobDetailDrawer` > `Tabs.Tab` (`WorkerJobDetailDrawer.tsx:89`) | Navigation | Nhật ký | Switches to Logs (Terminal) panel | drawer tab |
| admin.jobDrawer.milestonesTitle | `WorkerJobDetailDrawer` > milestone header (`WorkerJobDetailDrawer.tsx:94`) | Label | TIẾN TRÌNH CÁC CỘT MỐC (MILESTONES) | — | overview panel |
| admin.jobDrawer.step.sandbox | `WorkerJobDetailDrawer` > `Stepper.Step` (`WorkerJobDetailDrawer.tsx:96`) | Item | Sandbox / Môi trường | — | milestone step 1 |
| admin.jobDrawer.step.triad | `WorkerJobDetailDrawer` > `Stepper.Step` (`WorkerJobDetailDrawer.tsx:97`) | Item | Triad Packet / Thu thập | — | milestone step 2 |
| admin.jobDrawer.step.audit | `WorkerJobDetailDrawer` > `Stepper.Step` (`WorkerJobDetailDrawer.tsx:98`) | Item | Audit OMP / Thẩm định | — | milestone step 3 |
| admin.jobDrawer.step.report | `WorkerJobDetailDrawer` > `Stepper.Step` (`WorkerJobDetailDrawer.tsx:99`) | Item | Báo cáo / Xuất dữ liệu | — | milestone step 4 |
| admin.jobDrawer.failReasonTitle | `WorkerJobDetailDrawer` > fail reason header (`WorkerJobDetailDrawer.tsx:133`) | Error | Nguyên nhân thất bại: | — | rendered when `job.failedReason` is truthy |
| admin.jobDrawer.inputFilesTitle | `WorkerJobDetailDrawer` > input files header (`WorkerJobDetailDrawer.tsx:141`) | Label | DANH SÁCH FILE NỘP (<code>{count}</code>) | — | inputs panel |
| admin.jobDrawer.inputFilesEmpty | `WorkerJobDetailDrawer` > input files empty (`WorkerJobDetailDrawer.tsx:142`) | Empty state | Không có file nộp trong sandbox. | — | rendered when inputFiles empty |
| admin.jobDrawer.downloadInputBtn | `WorkerJobDetailDrawer` > download button (`WorkerJobDetailDrawer.tsx:150`) | CTA | Tải | Downloads individual input file | rendered when `downloadPath` exists |
| admin.jobDrawer.snapshotTitle | `WorkerJobDetailDrawer` > snapshot header (`WorkerJobDetailDrawer.tsx:160`) | Label | SNAPSHOT Ý TƯỞNG ĐỀ ÁN | — | rendered when `inputSnapshot.idea` exists |
| admin.jobDrawer.scoreTitle | `WorkerJobDetailDrawer` > score label (`WorkerJobDetailDrawer.tsx:173`) | Label | Điểm đánh giá tổng hợp | — | outputs panel |
| admin.jobDrawer.openPdfBtn | `WorkerJobDetailDrawer` > PDF link button (`WorkerJobDetailDrawer.tsx:190`) | CTA | Mở Báo cáo PDF A4 | Opens PDF in new tab (`view=inline`) | rendered when report ID or PDF URL exists |
| admin.jobDrawer.rubricTitle | `WorkerJobDetailDrawer` > rubric scores header (`WorkerJobDetailDrawer.tsx:196`) | Label | ĐIỂM 5 TIÊU CHÍ RUBRIC | — | rendered when `reportSummary.scores` exists |
| admin.jobDrawer.noReportText | `WorkerJobDetailDrawer` > no report text (`WorkerJobDetailDrawer.tsx:207`) | Empty state | Chưa có kết quả báo cáo thẩm định. | — | rendered when `reportSummary` is null |
| admin.jobDrawer.outputFilesTitle | `WorkerJobDetailDrawer` > output files header (`WorkerJobDetailDrawer.tsx:211`) | Label | FILE KẾT QUẢ ĐẦU RA (<code>{count}</code>) | — | rendered when `outputFiles.length > 0` |
| admin.terminal.title | `WorkerJobTerminal` > terminal title (`WorkerJobTerminal.tsx:70–71`) | Heading | Nhật ký thực thi | — | terminal header |
| admin.terminal.liveIndicator | `WorkerJobTerminal` > live text (`WorkerJobTerminal.tsx:71`) | Item | (Đang live...) | — | rendered when `isRunning === true` |
| admin.terminal.autoScrollBtn | `WorkerJobTerminal` > auto-scroll button (`WorkerJobTerminal.tsx:82`) | CTA | Auto-scroll Bật / Auto-scroll Tắt | Toggles automatic scrolling to terminal bottom | default |
| admin.terminal.copyTooltip | `WorkerJobTerminal` > copy tooltip (`WorkerJobTerminal.tsx:84`) | Helper | Sao chép toàn bộ nhật ký | Copies terminal logs to clipboard | default |
| admin.terminal.loadingLogs | `WorkerJobTerminal` > loading text (`WorkerJobTerminal.tsx:98`) | Description | Đang nạp nhật ký từ máy chủ... | — | `isLoading && !logText` branch |
| admin.terminal.emptyLogs | `WorkerJobTerminal` > empty text (`WorkerJobTerminal.tsx:102`) | Empty state | Chưa có nhật ký ghi nhận cho tiến trình này. | — | rendered when `logText` is empty |
| admin.terminal.toast.copySuccess | `WorkerJobTerminal` > notification (`WorkerJobTerminal.tsx:52–54`) | Toast | Đã sao chép | Đã sao chép nhật ký terminal vào bộ nhớ tạm | copy success branch |
| admin.terminal.toast.copyError | `WorkerJobTerminal` > notification (`WorkerJobTerminal.tsx:58–60`) | Toast | Lỗi sao chép | Không thể sao chép văn bản vào bộ nhớ tạm | copy error branch |
| admin.healModal.title | `HealStuckJobModal` > modal title (`HealStuckJobModal.tsx:34`) | Modal | Giải phóng tiến trình kẹt: `<code>{job.caseCode}</code>` | — | modal open |
| admin.healModal.warnTerminateTitle | `HealStuckJobModal` > alert title (`HealStuckJobModal.tsx:42`) | Label | Cảnh báo ngắt tiến trình | — | modal open |
| admin.healModal.warnTerminateDesc | `HealStuckJobModal` > alert description (`HealStuckJobModal.tsx:43`) | Description | Hệ thống sẽ <b>ngắt cưỡng bức (force-terminate)</b> tiến trình tính toán của OMP và giải phóng slot trong hàng đợi BullMQ. | — | modal open |
| admin.healModal.warnRefundTitle | `HealStuckJobModal` > alert title (`HealStuckJobModal.tsx:46`) | Label | Tự động hoàn trả tín chỉ | — | modal open |
| admin.healModal.warnRefundDesc | `HealStuckJobModal` > alert description (`HealStuckJobModal.tsx:47`) | Description | Nếu sinh viên chưa nhận được báo cáo kết quả hoàn chỉnh, <b>1 credit</b> sẽ tự động được hoàn trả vào ví hồ sơ kèm thông báo giải thích. | — | modal open |
| admin.healModal.reason.label | `HealStuckJobModal` > `Textarea` label (`HealStuckJobModal.tsx:51`) | Label | Lý do can thiệp (Tùy chọn ghi chú nội bộ) | — | modal open |
| admin.healModal.reason.placeholder | `HealStuckJobModal` > `Textarea` placeholder (`HealStuckJobModal.tsx:53`) | Placeholder | Ví dụ: Tiến trình thẩm định AI bị treo quá 10 phút do sự cố máy ảo... | Sets intervention reason | modal open |
| admin.healModal.cancelBtn | `HealStuckJobModal` > Cancel `Button` (`HealStuckJobModal.tsx:63`) | CTA | Hủy | Closes modal via `onClose` | enabled |
| admin.healModal.submitBtn | `HealStuckJobModal` > Submit `Button` (`HealStuckJobModal.tsx:72`) | CTA | Giải phóng & Hoàn credit | Calls `handleSubmit` → triggers heal mutation | loading while submitting |
| admin.healModal.toast.success.title | `useAdminWorkers` > `useHealStuckJob` notification (`useAdminWorkers.ts:121`) | Toast | Giải phóng tiến trình kẹt | — | heal success branch |
| admin.healModal.toast.success.message | `useAdminWorkers` > `useHealStuckJob` notification (`useAdminWorkers.ts:121`) | Toast | Đã giải phóng tiến trình và hoàn trả credit thành công | — | heal success branch |
| admin.retryModal.title | `RetryJobModal` > modal title (`RetryJobModal.tsx:68`) | Modal | Chạy lại tiến trình AI: `<code>{job.caseCode}</code>` | — | modal open |
| admin.retryModal.creditPolicyTitle | `RetryJobModal` > alert title (`RetryJobModal.tsx:76`) | Label | Chính sách tín chỉ | — | modal open |
| admin.retryModal.creditPolicyDesc | `RetryJobModal` > alert description (`RetryJobModal.tsx:77`) | Description | Thao tác này <b>KHÔNG trừ credit</b> của sinh viên. Hệ thống sử dụng quota nội bộ của quản trị viên để hoàn tất thẩm định. | — | modal open |
| admin.retryModal.model.label | `RetryJobModal` > `Select` label (`RetryJobModal.tsx:81`) | Label | Chọn mô hình AI (Model) | — | modal open |
| admin.retryModal.model.gpt | `RetryJobModal` > model option (`RetryJobModal.tsx:17`) | Item | ChatGPT Plus (GPT-5.6 Sol - Khuyên dùng) | Selects `openai-codex/gpt-5.6-sol` | dropdown option |
| admin.retryModal.model.mimo | `RetryJobModal` > model option (`RetryJobModal.tsx:18`) | Item | Xiaomi MiMo v2.5 (Tiết kiệm) | Selects `mimo/mimo-v2.5` | dropdown option |
| admin.retryModal.model.gemini | `RetryJobModal` > model option (`RetryJobModal.tsx:19`) | Item | Google Gemini 3.8 Flash | Selects `google-antigravity/gemini-3.8-flash` | dropdown option |
| admin.retryModal.model.custom | `RetryJobModal` > model option (`RetryJobModal.tsx:20`) | Item | Tùy chỉnh model khác... | Selects `custom` | dropdown option |
| admin.retryModal.customModel.placeholder | `RetryJobModal` > `TextInput` placeholder (`RetryJobModal.tsx:92`) | Placeholder | Nhập tên model (ví dụ: gpt-4-turbo)... | Sets custom model name | rendered when `selectedModel === "custom"` |
| admin.retryModal.customModel.errEmpty | `RetryJobModal` > `TextInput` error (`RetryJobModal.tsx:96`) | Error | Tên model không được để trống | — | rendered when customModel is blank |
| admin.retryModal.promptMode.label | `RetryJobModal` > `Radio.Group` label (`RetryJobModal.tsx:103`) | Label | Chế độ Prompt | — | modal open |
| admin.retryModal.promptMode.full | `RetryJobModal` > `Radio` label (`RetryJobModal.tsx:106`) | Item | Tiêu chuẩn (Full Prompt) | Selects `promptMode = "full"` | radio option |
| admin.retryModal.promptMode.lite | `RetryJobModal` > `Radio` label (`RetryJobModal.tsx:107`) | Item | Tinh gọn (Lite Prompt) | Selects `promptMode = "lite"` | radio option |
| admin.retryModal.cleanSandboxSwitch | `RetryJobModal` > `Switch` label (`RetryJobModal.tsx:115`) | Label | Xóa và khởi tạo lại sandbox sạch sẽ trước khi chạy | Toggles `clearSandbox` | default checked |
| admin.retryModal.cancelBtn | `RetryJobModal` > Cancel `Button` (`RetryJobModal.tsx:121`) | CTA | Hủy | Closes modal via `onClose` | enabled |
| admin.retryModal.submitBtn | `RetryJobModal` > Submit `Button` (`RetryJobModal.tsx:131`) | CTA | Kích hoạt chạy lại | Calls `handleSubmit` → triggers retry mutation | loading while submitting |
| admin.retryModal.toast.success.title | `useAdminWorkers` > `useRetryWorkerJob` notification (`useAdminWorkers.ts:105`) | Toast | Kích hoạt chạy lại | — | retry success branch |
| admin.retryModal.toast.success.message | `useAdminWorkers` > `useRetryWorkerJob` notification (`useAdminWorkers.ts:105`) | Toast | Đã kích hoạt chạy lại tiến trình thẩm định AI | — | retry success branch |

### 2.10 Tab Cài đặt gói dịch vụ (Packages Settings Table)

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| admin.packages.empty | `AdminPackagesSettings` > empty state (`AdminPackagesSettings.tsx:85–87`) | Empty state | Không có gói dịch vụ nào trên hệ thống. | — | `packages.length === 0` |
| admin.packages.th.name | `AdminPackagesSettings` > `Th` (`AdminPackagesSettings.tsx:98`) | Label | Tên gói dịch vụ | — | table header |
| admin.packages.th.status | `AdminPackagesSettings` > `Th` (`AdminPackagesSettings.tsx:99`) | Label | Trạng thái | — | table header |
| admin.packages.th.visibility | `AdminPackagesSettings` > `Th` (`AdminPackagesSettings.tsx:100`) | Label | Hiển thị với khách mới | — | table header |
| admin.packages.th.currentPrice | `AdminPackagesSettings` > `Th` (`AdminPackagesSettings.tsx:101`) | Label | Đơn giá hiện tại (VND) | — | table header |
| admin.packages.th.newPrice | `AdminPackagesSettings` > `Th` (`AdminPackagesSettings.tsx:102`) | Label | Thiết lập giá mới (VND) | — | table header |
| admin.packages.th.actions | `AdminPackagesSettings` > `Th` (`AdminPackagesSettings.tsx:103`) | Label | Thao tác | — | table header |
| admin.packages.lastUpdated | `AdminPackagesSettings` > update timestamp (`AdminPackagesSettings.tsx:125`) | Item | Cập nhật lần cuối: `<code>{date}</code>` | — | rendered when `last_price_changed_at` exists |
| admin.packages.previousPrice | `AdminPackagesSettings` > previous price suffix (`AdminPackagesSettings.tsx:127`) | Item | (từ `<code>{formatPrice(pkg.previous_price)}</code>`) | — | rendered when `previous_price` is not null |
| admin.packages.badge.active | `AdminPackagesSettings` > `Badge` (`AdminPackagesSettings.tsx:135`) | Badge | Đang bật | — | `pkg.is_active === true` |
| admin.packages.badge.inactive | `AdminPackagesSettings` > `Badge` (`AdminPackagesSettings.tsx:135`) | Badge | Đã tắt | — | `pkg.is_active === false` |
| admin.packages.switch.visible | `AdminPackagesSettings` > `Switch` label (`AdminPackagesSettings.tsx:143`) | Label | Đang hiển thị | Calls `handleToggleStatus(pkg)` | `pkg.is_active === true` |
| admin.packages.switch.hidden | `AdminPackagesSettings` > `Switch` label (`AdminPackagesSettings.tsx:143`) | Label | Đang ẩn | Calls `handleToggleStatus(pkg)` | `pkg.is_active === false` |
| admin.packages.priceInput.placeholder | `AdminPackagesSettings` > `NumberInput` placeholder (`AdminPackagesSettings.tsx:158`) | Placeholder | Nhập giá mới... | Sets updated price value | default |
| admin.packages.action.updatePrice | `AdminPackagesSettings` > `Menu.Item` (`AdminPackagesSettings.tsx:177`) | CTA | Cập nhật giá | Calls `handleUpdatePrice(pkg)` | disabled unless price modified |
| admin.packages.toast.priceNegative | `AdminPackagesSettings` > notification (`AdminPackagesSettings.tsx:38–40`) | Toast | Giá tiền phải lớn hơn hoặc bằng 0 | — | negative price input |
| admin.packages.toast.priceSuccess | `AdminPackagesSettings` > notification (`AdminPackagesSettings.tsx:48–51`) | Toast | Đã cập nhật đơn giá cho gói "<code>{pkg.name}</code>" thành `<code>{formatPrice(price)}</code>` | — | price update success |
| admin.packages.toast.statusOn | `AdminPackagesSettings` > notification (`AdminPackagesSettings.tsx:67–71`) | Toast | Đã bật gói "<code>{pkg.name}</code>" cho khách hàng mới. | — | package toggle on success |
| admin.packages.toast.statusOff | `AdminPackagesSettings` > notification (`AdminPackagesSettings.tsx:67–71`) | Toast | Đã tắt gói "<code>{pkg.name}</code>" khỏi luồng đăng ký mới. | — | package toggle off success |

---

## Layer 3: Page Notes

- **Biến thể thuật ngữ xuất hiện trên trang:**
  - `Tiến trình AI` (nhãn tab sidebar, tiêu đề drawer), `tiến trình thẩm định AI` (thông báo toast), `tiến trình tính toán của OMP` (modal giải phóng kẹt), `OMP Worker` (tiêu đề trang header), `máy ảo OMP` (mô tả panel), `job` (nhãn cột Job ID, mã Job ID): Tất cả cùng chỉ các worker ngầm thực thi bộ thẩm định tự động OMP cho hồ sơ sinh viên.
  - `Thanh toán` (nhãn tab sidebar `Duyệt thanh toán`, modal `Xác nhận duyệt thanh toán`), `Nạp tiền` (thông báo `Duyệt nạp tiền thành công`, `Đã từ chối nạp tiền`, danh mục xuất CSV `Nạp tiền (deposits)`), `Chuyển khoản` (mô tả header `giao dịch chuyển khoản`, placeholder `nội dung chuyển khoản`), `Giao dịch` (tiêu đề panel submenu `Giao dịch`): Code sử dụng bảng `AdminDepositVerificationTable` (thực thể `Deposit` ngân hàng vào ví hồ sơ) dưới danh nghĩa duyệt thanh toán của quản trị viên.
  - `Hồ sơ` (tiêu đề `Hồ sơ cần xử lý`, tab xuất `Hồ sơ (cases)`), `Hồ sơ đề tài` (tiêu đề panel submenu), `Mã Case & Đề tài` (nhãn cột tiến trình worker), `Đề tài` (hỏi xác nhận xóa `hồ sơ đề tài này`): Dùng thay thế qua lại để chỉ các startup submission cases.
  - `Supporter` (nhãn tab sidebar, modal `Phân công Supporter`), `Chuyên gia` (mô tả header `Chỉ định chuyên gia phụ trách`), `Người phụ trách` (nhãn cột trong bảng `AdminCaseAssignmentTable`): Cùng chỉ nhân sự mentor/supporter được chỉ định kèm case.
  - `Student` (nhãn vai trò người dùng trong bộ lọc và modal tạo tài khoản), `Sinh viên` (mô tả header, nhãn cột `Sinh viên` trong bảng worker, câu hỏi modal phê duyệt), `Học viên` (mô tả header duyệt thanh toán `ảnh đối chiếu từ học viên`): Cùng chỉ người dùng nộp hồ sơ.
  - `Tín chỉ` (tiêu đề cảnh báo `Tự động hoàn trả tín chỉ`, `Chính sách tín chỉ`), `Credit` (nội dung cảnh báo `1 credit sẽ tự động được hoàn trả vào ví hồ sơ`, `KHÔNG trừ credit`): Dùng lẫn lộn giữa từ Hán-Việt và từ mượn tiếng Anh cho cùng đơn vị thanh toán credit.
  - `Lần đầu` (`initial`), `Đã sửa` (`resubmit`/`revision`), `Soi logic` (`logic_check`/`logic_review`): Các biến thể nhãn hiển thị loại nộp hồ sơ trong bảng tiến trình AI được chuẩn hóa qua `SUBMISSION_TYPE_DISPLAY_LABELS`.
- **Hiện trạng kỹ thuật quan sát được:**
  - `apps/web-1/app/admin/layout.tsx` thực hiện kiểm tra quyền truy cập client-side thông qua hook `useSession()`. Khi chưa có session hoặc vai trò không phải `admin`, hệ thống chặn render và lập tức chuyển hướng (`router.push("/auth")` hoặc `router.push("/dashboard")`).
  - Thanh điều hướng kép (DoubleNavbar) duy trì trạng thái active tab bằng tham số `tab` trên query URL (`/admin?tab={name}`). Khi click chuyển tab, hàm `setActiveSection` gọi `router.replace` để cập nhật URL mà không làm đầy lịch sử duyệt web.
  - Cột `SLA` trong `AdminCaseAssignmentTable` sử dụng component con `SlaTimer` chạy `setInterval` mỗi 30 giây để tính toán độ lệch thời gian thực (`diff = target - now`), tự động chuyển màu cảnh báo và đổi text sang `Quá hạn` khi hết hạn.
  - Trong `AdminCaseAssignmentTable`, nút `Duyệt hồ sơ` bị vô hiệu hóa (`disabled`) kèm thuộc tính `title="Chưa hoàn tất thanh toán"` nếu hàm helper `isCasePaymentComplete(item)` trả về `false`.
  - Component `AdminPaymentVerificationTable.tsx` hiện tồn tại song song trong thư mục `_components` nhưng không được import vào `page.tsx`. Thay vào đó, trang admin sử dụng `AdminDepositVerificationTable.tsx` để đối soát các khoản nạp tiền ngân hàng.
  - Bảng người dùng (`AdminUsersTable`) cố tình lọc bỏ tài khoản hệ thống nội bộ qua điều kiện `user.role !== "system" && user.email !== "system@nexus.internal"` trước khi render danh sách.
  - Trong `WorkerJobsTable.tsx`, liên kết mã hồ sơ đang trỏ tới `/cases/${job.caseId}` (`apps/web-1/app/admin/_components/WorkerJobsTable.tsx:182`).
  - Nút sao chép (Job ID, Terminal log) sử dụng `navigator.clipboard.writeText` kèm Mantine `Tooltip` chuyển trạng thái tạm thời sang thông báo đã copy trong 2 giây.
- **Điểm chưa xác minh (Unknowns / Questions):**
  - Component `AdminPaymentVerificationTable.tsx` có còn mục đích sử dụng trong tương lai hay đã bị thay thế hoàn toàn bởi `AdminDepositVerificationTable.tsx`?
  - Đường dẫn `/cases/${job.caseId}` trong `WorkerJobsTable.tsx` có route tương ứng trong dự án không, hay cần trỏ về `/admin?tab=cases` hoặc `/dashboard/case/${job.caseId}`?
  - `[Assumption / Cần xác minh]` Quy định về logic hoàn trả credit trong `HealStuckJobModal` có tự động gọi webhook hay API hoàn tiền nào phía backend ngoài việc gửi payload `{ reason }` tới endpoint `/admin/workers/jobs/${jobId}/heal-stuck`?
