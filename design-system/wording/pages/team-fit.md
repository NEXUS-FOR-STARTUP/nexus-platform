# Page: Team-Idea Fit
Route: `/dashboard/team-fit`  
Access: `Authenticated (Sinh viên / Student)` (nguồn: `apps/web-1/app/dashboard/layout.tsx:14-29`, `apps/web-1/app/dashboard/team-fit/page.tsx:22-29`)

---

## Page Context

### User
- **Primary user:** Sinh viên chuẩn bị hoặc đang thực hiện đề án khởi nghiệp (môn EXE101), thành viên các nhóm dự án cần đánh giá mức độ tương thích giữa năng lực đội ngũ và ý tưởng kinh doanh trước hoặc sau Checkpoint 1 (nguồn: `LandingHero.tsx:55`, `demo-preset.ts:8,775`, `evaluate-team-fit.usecase.ts:9`).
- **Typical state:** Đã có ý tưởng ban đầu hoặc bản draft mô tả giải pháp, đã tập hợp nhóm sinh viên nhưng chưa rõ cấu trúc kỹ năng của các thành viên có đủ để triển khai MVP hay không, có lỗ hổng chuyên môn nào bị hội đồng phản biện chỉ trích hay không (`[Assumption / Cần xác minh]`).
- **Knowledge level:** Hiểu chuyên ngành học và thế mạnh cá nhân của từng thành viên trong nhóm; có thể chưa nắm rõ khái niệm MVP, phân bổ vai trò chuẩn (Tech, Marketing, Finance) trong một startup học thuật (`[Assumption / Cần xác minh]`).

### User goals
- Hoàn thành bài trắc nghiệm / biểu mẫu điền nhanh ý tưởng và đội ngũ (chỉ mất vài phút).
- Nhận phản hồi khách quan từ AI về hai khía cạnh: lỗ hổng nhân sự của nhóm (`teamGaps`) và điểm chưa rõ ràng về mặt mô hình kinh doanh / sản phẩm (`commercialGaps`).
- Lưu lại kết quả đánh giá thành hồ sơ (`Case`) để theo dõi hoặc nâng cấp lên gói phản biện chuyên sâu cùng Supporter.

### Business/Product goals
- Đóng vai trò là tính năng phễu (Top-of-Funnel / Free Evaluation Tool) dẫn dắt từ trang chủ (CTA Hero *"Kiểm tra miễn phí"* trỏ về `/dashboard/team-fit`).
- Giúp người dùng trải nghiệm giá trị phản biện tự động của AI hoàn toàn miễn phí mà không cần nộp toàn bộ tài liệu slide Google Drive.
- Upsell chuyển đổi sang gói trả phí `Basic AI Audit` (79,000 VND) hoặc gói có chuyên gia (`Supporter Audit`) thông qua banner ở bước kết quả (nguồn: `TeamFitResultStep.tsx:145-160`).
- Tự động tạo hồ sơ Case mới (`Case`) với gói `pkg_tf_free` (giá 0 VND, stage `intake_pending`, payment status `not_required`) khi người dùng bấm lưu (nguồn: `save-team-fit.usecase.ts:83-119`).

### Primary action
- Điền hoàn chỉnh 6 ô trống mô tả ý tưởng (MadLibs) ở Bước 1 → Thêm ít nhất 1 thành viên ở Bước 2 → Bấm *"Đánh giá"* để AI phân tích → Bấm *"Lưu kết quả"* để tạo Case (nguồn: `page.tsx:88-124,139-162`).

### Secondary actions
- Bấm *"Quay lại"* để điều chỉnh thông tin ở bước trước (nguồn: `NavigationButtons.tsx:29-37`).
- Bấm *"Đặt lại"* để xóa trắng toàn bộ dữ liệu đang điền và quay về Bước 1 (nguồn: `NavigationButtons.tsx:41-50`, `page.tsx:126-137`).
- Sử dụng nút nổi Demo Data FAB (góc phải bên dưới) để điền nhanh dữ liệu mẫu của 11 dự án sinh viên FPT (nguồn: `DemoDataFAB.tsx:33-85`, `demo-preset.ts:773-829`).
- Bấm *"Làm lại"* ở màn hình kết quả để chạy lượt đánh giá mới (nguồn: `TeamFitResultStep.tsx:110-112`).
- Bấm *"Xem case →"* sau khi đã lưu kết quả để chuyển hướng vào Case Workspace (nguồn: `TeamFitResultStep.tsx:124-130`).
- Bấm *"Mua kiểm tra chuyên sâu"* trên banner gợi ý để lưu kết quả và chuyển vào Case chọn gói phản biện nâng cao (nguồn: `TeamFitResultStep.tsx:152-159`).

### Entry
- Nút CTA chính *"Kiểm tra miễn phí"* trên Hero trang chủ `/` (nguồn: `LandingHero.tsx:55`).
- Nhập trực tiếp đường dẫn `/dashboard/team-fit` trên trình duyệt.
- `[Assumption / Cần xác minh]` Liên kết chia sẻ từ bài đăng fanpage Facebook, nhóm Zalo hoặc bạn bè giới thiệu công cụ test nhanh đội ngũ.

### Exit / next step
- Sau khi bấm *"Lưu kết quả"* hoặc *"Mua kiểm tra chuyên sâu"* thành công: Hệ thống tạo Case mới và điều hướng tới `/dashboard/case/[caseId]` (nguồn: `page.tsx:158,196`).
- Bấm *"Xem case →"* khi đã lưu trước đó: Điều hướng tới `/dashboard/case/[savedCaseId]` (nguồn: `page.tsx:166`).
- Người dùng chưa đăng nhập khi truy cập: Bị client-side redirect chuyển hướng về `/auth` (nguồn: `apps/web-1/app/dashboard/layout.tsx:17`, `page.tsx:27`).
- Người dùng có role `admin` hoặc `supporter` truy cập: Bị DashboardLayout tự động chuyển hướng về `/admin` hoặc `/supporter` (nguồn: `apps/web-1/app/dashboard/layout.tsx:20-27`).
- Điều hướng qua thanh Menu trên Header: Trang chủ (`/dashboard`), Ví của tôi (`/dashboard/wallet`), Cài đặt (`/dashboard/settings`), Đăng xuất (`/auth`) (nguồn: `UserMenu.tsx:69-76,130-149`).

### Product facts / constraints
- **Quy tắc xác thực & Phân quyền:** Route `/dashboard/team-fit` nằm trong group `(dashboard)` được bọc bởi `DashboardLayout`. Bắt buộc phải có phiên đăng nhập (`session`). Nếu chưa đăng nhập, hiển thị màn hình `LoadingScreen` ("Đang xác thực thông tin...") rồi chuyển hướng sang `/auth`. Nếu tài khoản có vai trò `admin` hoặc `supporter`, layout sẽ chặn render và chuyển hướng sang workspace tương ứng (nguồn: `apps/web-1/app/dashboard/layout.tsx:14-45`, `page.tsx:22-29`).
- **Lưu trữ cục bộ tự động (Auto-save LocalStorage):** Mọi ký tự gõ vào các ô trống ý tưởng và danh sách thành viên đều được đồng bộ tức thì vào LocalStorage qua 2 key `team-fit:blanks` và `team-fit:members`. Khi tải lại trang, dữ liệu cũ sẽ tự động được khôi phục trừ khi người dùng bấm *"Đặt lại"* (nguồn: `page.tsx:33-38,48-49`, `storage.ts:1-29`).
- **Giới hạn số lượng thành viên:** Cho phép nhập tối thiểu 1 thành viên và tối đa 6 thành viên (`MAX_MEMBERS = 6`). Khi đạt 6 thành viên, nút *"Thêm thành viên"* bị vô hiệu hóa (`disabled`) (nguồn: `TeamInputStep.tsx:7,16,64`, `validation/src/index.ts:33`).
- **Ràng buộc trường dữ liệu ý tưởng (MadLibs):**
  - `projectName` (Tên dự án): 2 – 200 ký tự.
  - `field` (Lĩnh vực): 2 – 100 ký tự.
  - `targetCustomer` (Khách hàng mục tiêu): 5 – 500 ký tự.
  - `problem` (Vấn đề): 10 – 1,000 ký tự.
  - `solution` (Giải pháp): 10 – 1,000 ký tự.
  - `mvp` (MVP): 5 – 500 ký tự (nguồn: `packages/validation/src/index.ts:7-14`).
- **Ràng buộc thông tin thành viên:**
  - `major` (Chuyên ngành): 2 – 100 ký tự, bắt buộc.
  - `strengths` (Sở trường): Dạng mảng tag, tối thiểu 1 tag, tối đa 10 tags, mỗi tag 2 – 200 ký tự, bắt buộc.
  - `experience` (Kinh nghiệm): Dạng mảng tag, không bắt buộc (0 tag), tối đa 10 tags, mỗi tag 2 – 500 ký tự (nguồn: `packages/validation/src/index.ts:18-27`, `TeamMemberCard.tsx:60-111`).
- **Luồng phân tích AI (Free Tier):** Gọi API `POST /api/ai-engine/team-fit` (yêu cầu cookie session). Backend sử dụng mô hình Google Generative AI (Gemini) với `SYSTEM_PROMPT_FREE` được cấu hình chặt chẽ: chỉ quét bề mặt và liệt kê tối đa 5 `teamGaps` và 5 `commercialGaps`, mỗi mục tối đa 20 từ, tuyệt đối không đưa ra lời khuyên hay phân tích sâu ở tầng miễn phí (nguồn: `evaluate-team-fit.usecase.ts:23-42,69-95`).
- **Luồng lưu Case (Save Case):** Gọi API `POST /api/ai-engine/team-fit/save` với gói `pkg_tf_free`. Nếu dữ liệu ý tưởng và đội ngũ trùng khớp hoàn toàn với bản ghi đã lưu trước đó của user (`idempotency`), backend trả về case hiện có thay vì tạo trùng lặp. Khi tạo mới, case nhận mã định danh dạng `NX-XXXXXX` (nguồn: `save-team-fit.usecase.ts:83-119`).
- **Giá hiển thị trên banner Upsell:** Hook `usePackagePrice(PACKAGE_KEYS.AI_AUDIT)` lấy giá từ API `/packages/pkg_ai_audit`. Nếu chưa load được hoặc API lỗi, fallback mặc định là 79,000 VND (nguồn: `TeamFitResultStep.tsx:34-35`).
- **Demo Data FAB:** Nút tròn nổi góc dưới phải (`z-50`) cung cấp sẵn 11 preset dữ liệu thực tế từ các nhóm sinh viên EXE101 tại ĐH FPT (Nexus, Farm2Dorm, ReWear, PawPal, SmashBook, LeanTea, MentorMap, ShareNest, ChargeCampus, MindNote, CraftUni) (nguồn: `demo-preset.ts:773-829`, `DemoDataFAB.tsx:33-85`).

---

## Interactive Inventory

### 1. Top Navbar & Shared Dashboard Chrome
*Nguồn: `apps/web-1/components/layout/DashboardShell.tsx`, `UserMenu.tsx`, `NotificationBell.tsx`, `ThemeToggler.tsx`, `Logo.tsx`, `LoadingScreen.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `chrome.loading.title` | `LoadingScreen` > `p` (Tiêu đề trên) | Heading | `Nexus Platform` | — | loading state (khi session đang pending) |
| `chrome.loading.message` | `LoadingScreen` > `p` (Nội dung dưới) | Description | `Đang xác thực thông tin...` | — | loading state (khi session đang pending) |
| `chrome.navbar.logo_alt` | `Link` > `Logo` > `img[alt]` | Alt text | `Nexus Logo` | `/dashboard` (hoặc `/supporter`, `/admin` theo role) | default |
| `chrome.navbar.notif_btn` | `Menu.Target` > `ActionIcon[aria-label]` | Aria-label | `Thông báo` | Mở dropdown thông báo | default |
| `chrome.navbar.notif_badge` | `ActionIcon` > `Badge` | Badge | `{unreadCount > 99 ? "99+" : unreadCount}` | — | visible khi unreadCount > 0 |
| `chrome.navbar.notif_header` | `Menu.Dropdown` > `Text` | Heading | `Thông báo` | — | default |
| `chrome.navbar.notif_empty` | `Menu.Dropdown` > `Text` | Empty state | `Không có thông báo` | — | visible khi items.length === 0 |
| `chrome.navbar.notif_mark_all` | `Menu.Dropdown` > `button` | CTA | `Đánh dấu tất cả đã đọc` | Kích hoạt mutation `markAllRead` | disabled khi unreadCount === 0 |
| `chrome.navbar.theme_btn` | `ThemeToggler` > `ActionIcon[aria-label]` | Aria-label | `Toggle theme` | Chuyển đổi theme Sáng / Tối | default |
| `chrome.navbar.user_btn` | `Popover.Target` > `button[aria-label]` | Aria-label | `Tài khoản` | Mở menu tài khoản cá nhân | default |
| `chrome.navbar.user_avatar_alt` | `Popover.Target` > `Avatar[alt]` | Alt text | `{user.name \|\| "User"}` | — | default |
| `chrome.navbar.user_avatar_fallback` | `Popover.Target` > `Avatar` (Text fallback) | Label | `{user.name?.substring(0, 2).toUpperCase() \|\| "US"}` | — | default khi không có ảnh đại diện |
| `chrome.navbar.user_email` | `Popover.Dropdown` > `p` | Item | `{user.email \|\| "—"}` | — | default |
| `chrome.navbar.wallet_label` | `Popover.Dropdown` > `span` | Label | `Số dư` | — | student role only |
| `chrome.navbar.wallet_balance` | `Popover.Dropdown` > `span` | Item | `{walletBalance.toLocaleString("vi-VN")} VND` | — | student role only |
| `chrome.navbar.menu_home` | `Popover.Dropdown` > `button` (Option 1) | Navigation | `Trang chủ` | `/dashboard` (hoặc `/admin`, `/supporter`) | default |
| `chrome.navbar.menu_wallet` | `Popover.Dropdown` > `button` (Option 2) | Navigation | `Ví của tôi` | `/dashboard/wallet` | student role only |
| `chrome.navbar.menu_settings` | `Popover.Dropdown` > `button` (Option 3) | Navigation | `Cài đặt` | `/dashboard/settings` (student) hoặc `/supporter/settings` | default |
| `chrome.navbar.menu_logout` | `Popover.Dropdown` > `button` (Option 4) | CTA | `Đăng xuất` | Gọi hàm `signOut()` → redirect `/auth` | default |

---

### 2. Page Header & Step Indicator
*Nguồn: `apps/web-1/app/dashboard/team-fit/page.tsx`, `apps/web-1/app/dashboard/team-fit/_components/StepIndicator.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `team_fit.header.title` | `h1` (Tiêu đề trang) | Heading | `Đánh giá Team-Idea Fit` | — | default |
| `team_fit.header.subtitle` | `p` (Mô tả phụ) | Description | `Điền thông tin dự án và đội ngũ để AI phân tích sự phù hợp` | — | default |
| `team_fit.stepper.step_0_dot` | `StepDot` (Bước 1 - Icon/Số) | Item | `1` (khi active) / checkmark (khi completed) | — | active (step 0), completed (step 1, 2) |
| `team_fit.stepper.step_0_label` | `StepLabel` (Bước 1 - Nhãn chữ) | Navigation | `Mô tả ý tưởng` | Click chuyển về Step 0 (khi đã qua step 1 và không ở step 2) | active (step 0), completed/clickable (step 1) |
| `team_fit.stepper.step_1_dot` | `StepDot` (Bước 2 - Icon/Số) | Item | `2` (khi active) / checkmark (khi completed) / circle | — | inactive (step 0), active (step 1), completed (step 2) |
| `team_fit.stepper.step_1_label` | `StepLabel` (Bước 2 - Nhãn chữ) | Navigation | `Đội ngũ` | Click chuyển sang Step 1 (khi đã pass step 0 và đang ở step > 1) | inactive (step 0), active (step 1), completed (step 2) |
| `team_fit.stepper.step_2_dot` | `StepDot` (Bước 3 - Icon/Số) | Item | `3` (khi active) / circle (chưa tới) | — | inactive (step 0, 1), active (step 2) |
| `team_fit.stepper.step_2_label` | `StepLabel` (Bước 3 - Nhãn chữ) | Label | `Kết quả` | — | inactive (step 0, 1), active (step 2), không thể click |

---

### 3. Step 0: Idea Description (MadLibs Pitch Form)
*Nguồn: `apps/web-1/app/dashboard/team-fit/_components/IdeaMadLibsStep.tsx`, `apps/web-1/app/dashboard/team-fit/_components/InlineBlank.tsx`, `apps/web-1/app/dashboard/team-fit/lib/validation.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `madlibs.text.fragment_1` | `p` > `span` | Description | `Dự án của chúng tôi tên là` | — | default |
| `madlibs.blank.projectName` | `InlineBlank[blank="projectName"]` | Placeholder | `tên dự án` | Nhập trực tiếp nội dung tên dự án | default / error khi vi phạm độ dài |
| `madlibs.blank.projectName.title_empty` | `InlineBlank` > `span[title]` | Helper | `Nhấp để nhập tên dự án` | Tooltip hiển thị khi ô trống | empty state |
| `madlibs.blank.projectName.title_filled` | `InlineBlank` > `span[title]` | Helper | `Nhấp để chỉnh sửa` | Tooltip hiển thị khi đã có chữ | filled state |
| `madlibs.blank.projectName.aria` | `InlineBlank` > `span[aria-label]` | Aria-label | `tên dự án` | Hỗ trợ accessibility cho ô nhập | default |
| `madlibs.text.fragment_2` | `p` > `span` | Description | `, thuộc lĩnh vực` | — | default |
| `madlibs.blank.field` | `InlineBlank[blank="field"]` | Placeholder | `lĩnh vực` | Nhập trực tiếp nội dung lĩnh vực | default / error khi vi phạm độ dài |
| `madlibs.blank.field.title_empty` | `InlineBlank` > `span[title]` | Helper | `Nhấp để nhập lĩnh vực` | Tooltip hiển thị khi ô trống | empty state |
| `madlibs.blank.field.title_filled` | `InlineBlank` > `span[title]` | Helper | `Nhấp để chỉnh sửa` | Tooltip hiển thị khi đã có chữ | filled state |
| `madlibs.blank.field.aria` | `InlineBlank` > `span[aria-label]` | Aria-label | `lĩnh vực` | Hỗ trợ accessibility cho ô nhập | default |
| `madlibs.text.fragment_3` | `p` > `span` | Description | `. Chúng tôi giúp` | — | default |
| `madlibs.blank.targetCustomer` | `InlineBlank[blank="targetCustomer"]` | Placeholder | `khách hàng mục tiêu` | Nhập khách hàng mục tiêu | default / error khi vi phạm độ dài |
| `madlibs.blank.targetCustomer.title_empty` | `InlineBlank` > `span[title]` | Helper | `Nhấp để nhập khách hàng mục tiêu` | Tooltip hiển thị khi ô trống | empty state |
| `madlibs.blank.targetCustomer.title_filled` | `InlineBlank` > `span[title]` | Helper | `Nhấp để chỉnh sửa` | Tooltip hiển thị khi đã có chữ | filled state |
| `madlibs.blank.targetCustomer.aria` | `InlineBlank` > `span[aria-label]` | Aria-label | `khách hàng mục tiêu` | Hỗ trợ accessibility cho ô nhập | default |
| `madlibs.text.fragment_4` | `p` > `span` | Description | `giải quyết` | — | default |
| `madlibs.blank.problem` | `InlineBlank[blank="problem"]` | Placeholder | `vấn đề / nhu cầu` | Nhập vấn đề dự án giải quyết | default / error khi vi phạm độ dài |
| `madlibs.blank.problem.title_empty` | `InlineBlank` > `span[title]` | Helper | `Nhấp để nhập vấn đề / nhu cầu` | Tooltip hiển thị khi ô trống | empty state |
| `madlibs.blank.problem.title_filled` | `InlineBlank` > `span[title]` | Helper | `Nhấp để chỉnh sửa` | Tooltip hiển thị khi đã có chữ | filled state |
| `madlibs.blank.problem.aria` | `InlineBlank` > `span[aria-label]` | Aria-label | `vấn đề / nhu cầu` | Hỗ trợ accessibility cho ô nhập | default |
| `madlibs.text.fragment_5` | `p` > `span` | Description | `bằng cách` | — | default |
| `madlibs.blank.solution` | `InlineBlank[blank="solution"]` | Placeholder | `giải pháp / sản phẩm` | Nhập giải pháp hoặc sản phẩm | default / error khi vi phạm độ dài |
| `madlibs.blank.solution.title_empty` | `InlineBlank` > `span[title]` | Helper | `Nhấp để nhập giải pháp / sản phẩm` | Tooltip hiển thị khi ô trống | empty state |
| `madlibs.blank.solution.title_filled` | `InlineBlank` > `span[title]` | Helper | `Nhấp để chỉnh sửa` | Tooltip hiển thị khi đã có chữ | filled state |
| `madlibs.blank.solution.aria` | `InlineBlank` > `span[aria-label]` | Aria-label | `giải pháp / sản phẩm` | Hỗ trợ accessibility cho ô nhập | default |
| `madlibs.text.fragment_6` | `p` > `span` | Description | `. Sản phẩm khả dụng đầu tiên (MVP) sẽ là` | — | default |
| `madlibs.blank.mvp` | `InlineBlank[blank="mvp"]` | Placeholder | `mô tả MVP` | Nhập mô tả MVP đầu tiên | default / error khi vi phạm độ dài |
| `madlibs.blank.mvp.title_empty` | `InlineBlank` > `span[title]` | Helper | `Nhấp để nhập mô tả MVP` | Tooltip hiển thị khi ô trống | empty state |
| `madlibs.blank.mvp.title_filled` | `InlineBlank` > `span[title]` | Helper | `Nhấp để chỉnh sửa` | Tooltip hiển thị khi đã có chữ | filled state |
| `madlibs.blank.mvp.aria` | `InlineBlank` > `span[aria-label]` | Aria-label | `mô tả MVP` | Hỗ trợ accessibility cho ô nhập | default |
| `madlibs.text.fragment_7` | `p` > `span` | Description | `.` | — | default |
| `madlibs.summary_error.title` | `div.bg-red-50` > `span` | Heading | `Vui lòng bổ sung hoặc chỉnh sửa các thông tin sau:` | — | error state (hiển thị khi có lỗi validation ở ô trống) |
| `madlibs.summary_error.item_label` | `ul` > `li` > `span.font-medium` | Label | `{FIELD_LABELS[key] ?? key}:` (`Tên dự án:`, `Lĩnh vực:`, `Khách hàng mục tiêu:`, `Vấn đề:`, `Giải pháp:`, `MVP:`) | — | error state |

---

### 4. Step 1: Team Composition & Member Cards
*Nguồn: `apps/web-1/app/dashboard/team-fit/_components/TeamInputStep.tsx`, `apps/web-1/app/dashboard/team-fit/_components/TeamMemberCard.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `team_step.empty.title` | `div.border-dashed` > `p` | Heading | `Chưa có thông tin thành viên nào` | — | empty state (khi members.length === 0) |
| `team_step.empty.desc` | `div.border-dashed` > `p` | Description | `Thêm thông tin các thành viên trong đội ngũ để AI phân tích mức độ phù hợp với ý tưởng dự án.` | — | empty state |
| `team_step.empty.add_first_btn` | `div.border-dashed` > `button` | CTA | `Thêm thành viên đầu tiên` | Thêm thành viên vị trí 1 và mở card nhập | default |
| `team_step.card.badge_num` | `TeamMemberCard` > `span` | Item | `{index + 1}` | — | default (vòng lặp 1 đến 6, màu accent xoay vòng) |
| `team_step.card.title` | `TeamMemberCard` > `h3` | Heading | `Thành viên {index + 1}` | — | default (ví dụ: Thành viên 1, Thành viên 2) |
| `team_step.card.remove_btn` | `TeamMemberCard` > `button[title]` | CTA | `Xóa thành viên` (title) | Xóa thành viên tương ứng khỏi danh sách | default |
| `team_step.card.major_label` | `TeamMemberCard` > `label` | Label | `Chuyên ngành *` | — | default (`*` màu đỏ) |
| `team_step.card.major_input` | `TextInput[placeholder]` | Placeholder | `Ví dụ: Fullstack Developer, Product Manager...` | Nhập văn bản chuyên ngành đào tạo | default |
| `team_step.card.strengths_label` | `TagsInput[label]` | Label | `Sở trường *` | — | default (`*` màu đỏ) |
| `team_step.card.strengths_input` | `TagsInput[placeholder]` | Placeholder | `Nhập sở trường và nhấn Enter` | Nhập tag sở trường và nhấn Enter (tối đa 10 tags) | default |
| `team_step.card.exp_label` | `TagsInput[label]` | Label | `Kinh nghiệm` | — | default |
| `team_step.card.exp_input` | `TagsInput[placeholder]` | Placeholder | `Nhập kinh nghiệm và nhấn Enter` | Nhập tag kinh nghiệm và nhấn Enter (tối đa 10 tags) | default |
| `team_step.add_more_btn` | `TeamInputStep` > `button` | CTA | `Thêm thành viên ({members.length}/{MAX_MEMBERS})` | Thêm thẻ thành viên mới vào danh sách | disabled khi members.length >= 6 |

---

### 5. Step 2: Compatibility Analysis & Result Actions
*Nguồn: `apps/web-1/app/dashboard/team-fit/_components/TeamFitResultStep.tsx`, `apps/web-1/app/dashboard/team-fit/_components/ReadyState.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `team_result.loading.text` | `TeamFitResultStep` > `Text` | Description | `Đang phân tích...` | — | loading state (spinner quay khi mutation.isPending) |
| `team_result.error.retry_btn` | `TeamFitResultStep` > `Button` | CTA | `Thử lại` | Gọi hàm `onReset()` để quay về Step 0 | error state (khi mutation gặp lỗi) |
| `team_result.ready.idle_text` | `TeamFitResultStep` / `ReadyState` > `Text` / `p` | Description | `Nhấn "Đánh giá" để AI phân tích đội ngũ của bạn` | — | ready / idle state (khi result === null) |
| `team_result.card_team_gaps.title` | `Card[1]` > `Text` | Heading | `Nhóm bạn có thể thiếu...` | — | result state |
| `team_result.card_team_gaps.item` | `Card[1]` > `List.Item` | Item | `{gap}` (Dữ liệu động từ `result.teamGaps`) | — | dynamic list item (tối đa 5 mục do AI sinh) |
| `team_result.card_comm_gaps.title` | `Card[2]` > `Text` | Heading | `Dự án có thể chưa rõ ở...` | — | result state |
| `team_result.card_comm_gaps.item` | `Card[2]` > `List.Item` | Item | `{gap}` (Dữ liệu động từ `result.commercialGaps`) | — | dynamic list item (tối đa 5 mục do AI sinh) |
| `team_result.btn.reset` | `Button` (Màu đỏ outline) | CTA | `Làm lại` | Reset toàn bộ form và quay về Step 0 | default |
| `team_result.btn.save` | `Button` (Brand filled) | CTA | `Lưu kết quả` | Gửi payload lên `/ai-engine/team-fit/save` tạo Case | default (khi hasSaved === false) |
| `team_result.btn.saved_badge` | `Button` (Màu xanh lá filled) | Badge | `Đã lưu` | — | disabled (hiển thị sau khi lưu thành công) |
| `team_result.btn.view_case` | `Button` (Brand filled) | Navigation | `Xem case →` | Điều hướng sang `/dashboard/case/{savedCaseId}` | default (hiển thị sau khi lưu thành công) |
| `team_result.upsell.title` | `div.bg-brand-soft` > `Text` | Heading | `Muốn được Supporter kiểm tra chuyên sâu?` | — | default |
| `team_result.upsell.desc` | `div.bg-brand-soft` > `Text` | Description | `Nhận phản biện chi tiết từ Supporter giàu kinh nghiệm. Giá chỉ {auditPriceLabel} / lượt.` | — | default (`auditPriceLabel` định dạng ví dụ "79,000 VND") |
| `team_result.upsell.btn` | `div.bg-brand-soft` > `Button` | CTA | `Mua kiểm tra chuyên sâu` | Tự động lưu kết quả (nếu chưa lưu) và chuyển hướng tới `/dashboard/case/{caseId}` | default |

---

### 6. Shared Navigation Controls & Step Actions
*Nguồn: `apps/web-1/app/dashboard/team-fit/_components/NavigationButtons.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `nav_buttons.btn.back` | `Button` (Bên trái) | CTA | `Quay lại` | Giảm `currentStep` lùi về bước trước | disabled khi currentStep === 0 |
| `nav_buttons.btn.reset` | `Button` (Bên phải - Outline đỏ) | CTA | `Đặt lại` | Gọi `handleReset()`, xóa LocalStorage và quay về Step 0 | default (chỉ hiển thị ở step 0 và step 1) |
| `nav_buttons.btn.next` | `Button` (Bên phải - Brand filled) | CTA | `Tiếp tục` | Chuyển từ Step 0 sang Step 1 | disabled khi còn ô trống hoặc có lỗi validation |
| `nav_buttons.btn.evaluate` | `Button` (Bên phải - Brand filled) | CTA | `Đánh giá` | Kiểm tra Zod schema toàn diện và gọi mutation AI | disabled khi `membersCount === 0` |

---

### 7. Form Validation & Alert Banners
*Nguồn: `apps/web-1/app/dashboard/team-fit/_components/ErrorBanner.tsx`, `apps/web-1/app/dashboard/team-fit/lib/validation.ts`, `apps/api/src/modules/ai-engine/application/evaluate-team-fit.usecase.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `banner_error.title` | `ErrorBanner` > `p` | Heading | `Vui lòng sửa các lỗi sau:` | — | error state (hiển thị khi có danh sách lỗi ở đỉnh step) |
| `banner_error.item` | `ErrorBanner` > `li` | Error | `{err}` | — | error state |
| `val.error.problem_min` | `validation.ts` > `translateIssue` | Error | `Mô tả vấn đề cần ít nhất 10 ký tự — hãy viết cụ thể hơn` | Hiển thị dưới ô trống hoặc error banner | error state |
| `val.error.solution_min` | `validation.ts` > `translateIssue` | Error | `Mô tả giải pháp cần ít nhất 10 ký tự — hãy viết cụ thể hơn` | Hiển thị dưới ô trống hoặc error banner | error state |
| `val.error.target_min` | `validation.ts` > `translateIssue` | Error | `Khách hàng mục tiêu cần ít nhất 5 ký tự — ai là người bạn muốn giúp?` | Hiển thị dưới ô trống hoặc error banner | error state |
| `val.error.mvp_min` | `validation.ts` > `translateIssue` | Error | `Mô tả MVP cần ít nhất 5 ký tự — sản phẩm đầu tiên trông như thế nào?` | Hiển thị dưới ô trống hoặc error banner | error state |
| `val.error.generic_min` | `validation.ts` > `translateIssue` | Error | `{label} cần ít nhất {n} ký tự` (ví dụ: `Tên dự án cần ít nhất 2 ký tự`, `Lĩnh vực cần ít nhất 2 ký tự`) | Hiển thị dưới ô trống hoặc error banner | error state |
| `val.error.generic_max` | `validation.ts` > `translateIssue` | Error | `{label} tối đa {max} ký tự — hãy rút gọn` | Hiển thị dưới ô trống hoặc error banner | error state |
| `val.error.generic_empty` | `validation.ts` > `translateIssue` | Error | `{label} không được để trống` | Hiển thị dưới ô trống hoặc error banner | error state |
| `val.error.member_field_min` | `validation.ts` > `formatIssue` | Error | `Thành viên {memberNum} — {label}{sub}: cần ít nhất {n} ký tự` | Hiển thị tại error banner | error state |
| `val.error.member_field_max` | `validation.ts` > `formatIssue` | Error | `Thành viên {memberNum} — {label}{sub}: tối đa {max} ký tự` | Hiển thị tại error banner | error state |
| `val.error.member_field_empty` | `validation.ts` > `formatIssue` | Error | `Thành viên {memberNum} — {label}: không được để trống` | Hiển thị tại error banner | error state |
| `val.error.member_field_min_items` | `validation.ts` > `formatIssue` | Error | `Thành viên {memberNum} — {label}: cần ít nhất 1 mục` | Hiển thị tại error banner (khi thiếu sở trường) | error state |
| `val.error.member_invalid` | `validation.ts` > `formatIssue` | Error | `Thành viên {memberNum} có thông tin chưa hợp lệ. Vui lòng kiểm tra lại.` | Hiển thị tại error banner | error state |
| `val.error.save_failed_fallback` | `page.tsx:160,198` | Error | `Lưu kết quả thất bại` | Hiển thị tại error banner | error state (khi mutation lưu bị từ chối) |
| `api.error.ai_auth` | `evaluate-team-fit.usecase.ts:107` | Error | `Không thể xác thực với Google AI. Kiểm tra lại API key.` | Trả về từ API và hiển thị tại UI | error state |
| `api.error.ai_rate_limit` | `evaluate-team-fit.usecase.ts:110` | Error | `Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.` | Trả về từ API và hiển thị tại UI | error state |
| `api.error.ai_content_filter` | `evaluate-team-fit.usecase.ts:113` | Error | `Nội dung không phù hợp để đánh giá. Vui lòng kiểm tra lại thông tin.` | Trả về từ API và hiển thị tại UI | error state |
| `api.error.ai_timeout` | `evaluate-team-fit.usecase.ts:121` | Error | `Google AI phản hồi quá chậm. Vui lòng thử lại.` | Trả về từ API và hiển thị tại UI | error state |
| `api.error.ai_invalid_output` | `evaluate-team-fit.usecase.ts:125` | Error | `AI trả về định dạng không hợp lệ. Vui lòng thử lại.` | Trả về từ API và hiển thị tại UI | error state |
| `api.error.ai_internal` | `evaluate-team-fit.usecase.ts:129` | Error | `Lỗi hệ thống AI. Vui lòng thử lại sau.` | Trả về từ API và hiển thị tại UI | error state |

---

### 8. Demo Data FAB Controls & Presets
*Nguồn: `apps/web-1/components/ui/DemoDataFAB.tsx`, `apps/web-1/app/dashboard/team-fit/_data/demo-preset.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `demo_fab.btn.title` | `UnstyledButton[title]` | Helper | `Demo: Điền dữ liệu mẫu` | Mở popover chọn preset dữ liệu mẫu | default (nút tròn nổi cố định góc dưới phải) |
| `demo_fab.dropdown.header` | `Popover.Dropdown` > `Text` | Heading | `Dữ liệu demo` | — | default |
| `demo_fab.preset_1.label` | `UnstyledButton` 1 > `Text` | Item | `Nexus - Nhóm 13 EXE101` | Điền tự động dữ liệu dự án Nexus | default |
| `demo_fab.preset_1.desc` | `UnstyledButton` 1 > `Text` | Description | `Dịch vụ audit idea khởi nghiệp cho sinh viên FPT` | — | default |
| `demo_fab.preset_2.label` | `UnstyledButton` 2 > `Text` | Item | `Farm2Dorm - Nhóm 07` | Điền tự động dữ liệu dự án Farm2Dorm | default |
| `demo_fab.preset_2.desc` | `UnstyledButton` 2 > `Text` | Description | `Nông sản Đà Lạt gom đơn theo ký túc xá` | — | default |
| `demo_fab.preset_3.label` | `UnstyledButton` 3 > `Text` | Item | `ReWear - Nhóm 21` | Điền tự động dữ liệu dự án ReWear | default |
| `demo_fab.preset_3.desc` | `UnstyledButton` 3 > `Text` | Description | `Tủ đồ secondhand ký gửi cho sinh viên` | — | default |
| `demo_fab.preset_4.label` | `UnstyledButton` 4 > `Text` | Item | `PawPal - Nhóm 04` | Điền tự động dữ liệu dự án PawPal | default |
| `demo_fab.preset_4.desc` | `UnstyledButton` 4 > `Text` | Description | `Trông thú cưng theo giờ ngày lễ` | — | default |
| `demo_fab.preset_5.label` | `UnstyledButton` 5 > `Text` | Item | `SmashBook - Nhóm 11` | Điền tự động dữ liệu dự án SmashBook | default |
| `demo_fab.preset_5.desc` | `UnstyledButton` 5 > `Text` | Description | `Đặt sân cầu lông kèm ghép đội lẻ` | — | default |
| `demo_fab.preset_6.label` | `UnstyledButton` 6 > `Text` | Item | `LeanTea - Nhóm 16` | Điền tự động dữ liệu dự án LeanTea | default |
| `demo_fab.preset_6.desc` | `UnstyledButton` 6 > `Text` | Description | `Trà sữa healthy cho sinh viên gym` | — | default |
| `demo_fab.preset_7.label` | `UnstyledButton` 7 > `Text` | Item | `MentorMap - Nhóm 09` | Điền tự động dữ liệu dự án MentorMap | default |
| `demo_fab.preset_7.desc` | `UnstyledButton` 7 > `Text` | Description | `Kết nối tân sinh viên với mentor khóa trên` | — | default |
| `demo_fab.preset_8.label` | `UnstyledButton` 8 > `Text` | Item | `ShareNest - Nhóm 25` | Điền tự động dữ liệu dự án ShareNest | default |
| `demo_fab.preset_8.desc` | `UnstyledButton` 8 > `Text` | Description | `Ghép phòng trọ theo tính cách` | — | default |
| `demo_fab.preset_9.label` | `UnstyledButton` 9 > `Text` | Item | `ChargeCampus - Nhóm 02` | Điền tự động dữ liệu dự án ChargeCampus | default |
| `demo_fab.preset_9.desc` | `UnstyledButton` 9 > `Text` | Description | `Trạm sạc xe điện trong campus` | — | default |
| `demo_fab.preset_10.label` | `UnstyledButton` 10 > `Text` | Item | `MindNote - Nhóm 18` | Điền tự động dữ liệu dự án MindNote | default |
| `demo_fab.preset_10.desc` | `UnstyledButton` 10 > `Text` | Description | `Nhật ký tâm trạng kèm AI an ủi` | — | default |
| `demo_fab.preset_11.label` | `UnstyledButton` 11 > `Text` | Item | `CraftUni - Nhóm 29` | Điền tự động dữ liệu dự án CraftUni | default |
| `demo_fab.preset_11.desc` | `UnstyledButton` 11 > `Text` | Description | `Chợ đồ handmade sinh viên` | — | default |
| `demo_fab.btn_clear` | `UnstyledButton` (Dưới cùng) | CTA | `Xóa dữ liệu` | Gọi `handleReset()`, xóa toàn bộ dữ liệu mẫu | default |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- **Đơn vị đánh giá:** Được gọi là `Team-Idea Fit` (`page.tsx:217`), `Team-Fit` (`useTeamFitMutation.ts:50`), `sự phù hợp` (`page.tsx:220`), `mức độ phù hợp` (`TeamInputStep.tsx:37`).
- **Khái niệm đối tượng đánh giá:** Xuất hiện đan xen giữa `Dự án` (`page.tsx:220`, `IdeaMadLibsStep.tsx:15`, `TeamFitResultStep.tsx:98`) và `Ý tưởng` (`StepIndicator.tsx:5`, `TeamInputStep.tsx:37`).
- **Khái niệm tổ chức người làm:** Được gọi đồng thời là `Đội ngũ` (`page.tsx:220`, `StepIndicator.tsx:5`, `TeamInputStep.tsx:37`) và `Nhóm` (`TeamFitResultStep.tsx:83`).
- **Thành viên:** Thẻ nhập liệu gọi là `Thành viên {index + 1}` (`TeamMemberCard.tsx:46`), nút bấm gọi là `Thêm thành viên` (`TeamInputStep.tsx:68`), trong khi validation gọi là `Thành viên {memberNum}` (`validation.ts:108`).
- **Vai trò người đồng hành:** Banner upsell ở kết quả gọi là `Supporter` ("Muốn được Supporter kiểm tra chuyên sâu? Nhận phản biện chi tiết từ Supporter giàu kinh nghiệm") (`TeamFitResultStep.tsx:147,150`).
- **Tên gọi hành động kiểm tra:** Nút submit gọi là `Đánh giá` (`NavigationButtons.tsx:69`), text hướng dẫn gọi là `AI phân tích` (`page.tsx:220`, `TeamFitResultStep.tsx:44,70`), banner upsell gọi là `kiểm tra chuyên sâu` (`TeamFitResultStep.tsx:147,158`) và `phản biện chi tiết` (`TeamFitResultStep.tsx:150`).

### Hiện trạng kỹ thuật quan sát được
- **Cơ chế xác thực & Chặn truy cập:** Mặc dù nút CTA trên Landing Page dẫn thẳng tới `/dashboard/team-fit` (không có guard tại Landing), nhưng khi tải route này, `DashboardLayout` và `TeamFitPage` đều kích hoạt kiểm tra session qua Better Auth (`useSession`). Nếu chưa đăng nhập, người dùng sẽ thấy màn hình `LoadingScreen` với text "Đang xác thực thông tin..." trong thời gian ngắn trước khi bị chuyển hướng thẳng sang `/auth` (nguồn: `apps/web-1/app/dashboard/layout.tsx:14-38`, `page.tsx:22-29`).
- **Tính toán tiến trình & Điều hướng bước:** Stepper gồm 3 bước: `0: Mô tả ý tưởng`, `1: Đội ngũ`, `2: Kết quả`. Khi đang ở Bước 0 hoặc 1, người dùng có thể click vào step dot trước đó để quay lại nếu step đó đã completed. Tuy nhiên, khi đã ở Bước 2 (`Kết quả`), toàn bộ thanh stepper bị khóa click (`isClickable = isCompleted && currentStep !== 2 && !!onStepClick`), buộc người dùng phải tương tác qua các nút hành động trong trang (`Làm lại`, `Xem case`, `Lưu kết quả`) (nguồn: `StepIndicator.tsx:74,86-90`).
- **Inline Editable Content:** Component `InlineBlank` sử dụng `span contentEditable` kết hợp pseudo-element CSS `before:content-[attr(data-placeholder)]` để hiển thị placeholder dạng điền vào chỗ trống trong đoạn văn MadLibs. Khi ô trống, thuộc tính `title` hiển thị dạng tooltip *"Nhấp để nhập [tên trường]"*, khi đã có chữ chuyển thành *"Nhấp để chỉnh sửa"* (nguồn: `InlineBlank.tsx:95-101`).
- **Validation hai tầng:**
  - Tầng 1 (Client-side Blur & Next): `validateBlank` và `validateAllBlanks` kiểm tra regex và trả về câu thông báo lỗi thân thiện được Việt hóa riêng cho sinh viên FPT (ví dụ: *"Mô tả vấn đề cần ít nhất 10 ký tự — hãy viết cụ thể hơn"*). Nút *"Tiếp tục"* ở Step 0 bị disabled chừng nào còn ô trống hoặc còn lỗi (nguồn: `page.tsx:88-96`, `validation.ts:31-78`).
  - Tầng 2 (Client-side Submit & Server-side): Khi bấm *"Đánh giá"*, `TeamFitInputSchema.safeParse` kiểm tra toàn bộ payload. Nếu thất bại, bảng lỗi `ErrorBanner` hiển thị chi tiết và tự động đưa người dùng lùi về Step 0 (nguồn: `page.tsx:112-119`).
- **Component dư thừa / Dead Code nhánh UI:** File `apps/web-1/app/dashboard/team-fit/_components/ReadyState.tsx` có tồn tại với nội dung *"Nhấn "Đánh giá" để AI phân tích đội ngũ của bạn"*, nhưng trong `TeamFitResultStep.tsx:65-73` logic idle state đã được viết inline trực tiếp mà không import hay render component `ReadyState` này.
- **Trạng thái lưu trữ Case:** Khi bấm *"Lưu kết quả"*, hệ thống gọi usecase `saveTeamFitUseCase` tạo Case với gói `pkg_tf_free`. Khi lưu thành công, nút chuyển thành badge xanh `Đã lưu` (disabled) và xuất hiện thêm nút `Xem case →` trỏ vào `/dashboard/case/{caseId}`. Đồng thời trang cũng tự động thực hiện `router.push(/dashboard/case/${data.caseId})` ngay lập tức (nguồn: `page.tsx:158`, `TeamFitResultStep.tsx:114-142`).

### Điểm chưa xác minh (Unknowns / Questions)
- **Độ trễ khi chuyển hướng:** Ở hàm `handleSave` (`page.tsx:158`) và `handleUpgrade` (`page.tsx:196`), sau khi gọi `mutateAsync` thành công, code thực hiện `router.push` ngay lập tức. Cần xác minh xem người dùng có kịp nhìn thấy trạng thái nút `Đã lưu` và `Xem case →` trên giao diện hay màn hình sẽ chuyển trang ngay.
- **Tính năng Upsell:** Khi bấm *"Mua kiểm tra chuyên sâu"*, hệ thống lưu kết quả thành Case miễn phí rồi chuyển người dùng vào Case Workspace `/dashboard/case/[id]`. Tại Case Workspace, người dùng có nhận được modal hay banner nhắc nhở chọn mua gói kiểm tra chuyên sâu hay phải tự tìm tab thanh toán?
- **Định vị dịch vụ:** Trên trang chủ, CTA ghi *"Kiểm tra miễn phí"*, nhưng vào trang tiêu đề lại là *"Đánh giá Team-Idea Fit"*. Cần PO xác nhận xem sinh viên có bị bỡ ngỡ giữa kỳ vọng "kiểm tra bài nộp / slide" với thực tế là "trắc nghiệm độ tương thích đội ngũ" hay không.
