# Page: Biểu mẫu nộp hồ sơ phản biện (Intake Form)
Route: `/dashboard/intake`  
Access: `Authenticated (Sinh viên / Student)` (nguồn: `apps/web-1/app/dashboard/layout.tsx:14-29`, `apps/web-1/app/dashboard/intake/page.tsx:21-45`)

---

## Page Context

### User
- **Primary user:** Sinh viên đang thực hiện đề án khởi nghiệp (môn học EXE101 hoặc tương đương), nhóm trưởng hoặc đại diện nhóm dự án chuẩn bị nộp hồ sơ để chạy thẩm định hoặc phản biện trước kỳ đánh giá Checkpoint 1 (CP1) (nguồn: `apps/web-1/app/dashboard/intake/page.tsx:307-327`, `apps/web-1/app/dashboard/intake/_components/IntakeChatFlow.tsx:191-199`).
- **Typical state:** Đã có ý tưởng ban đầu hoặc bản nháp slide/đề cương, đang gặp nút thắt cụ thể (bị giảng viên nhận xét chưa tốt, chưa rõ khách hàng mục tiêu, logic giải pháp yếu) và cần thẩm định tức thì từ AI hoặc phản biện chuyên sâu từ Mentor trước deadline bảo vệ (`[Assumption / Cần xác minh]`).
- **Knowledge level:** Nắm rõ thông tin thành viên, trường học, môn học, tài liệu nhóm đã chuẩn bị; có thể chưa rõ tiêu chuẩn phản biện của Nexus hoặc chưa biết cách mô tả vấn đề ngắn gọn mà không sao chép lại toàn bộ tài liệu (nguồn: `SituationStep.tsx:36`, `DocumentInputStep.tsx:163-169,183-187`).

### User goals
- Hoàn thiện các bước khai báo hồ sơ dự án theo quy trình hướng dẫn từng bước (Tình huống/Điểm kẹt, Người liên hệ, Bối cảnh dự án, Nhu cầu hỗ trợ, Tài liệu đính kèm, Cam kết ranh giới).
- Tải lên các file tài liệu minh chứng của nhóm (.pdf, .docx, .xlsx, .pptx, .md, .txt) hoặc tham khảo/tải template mẫu chuẩn Checkpoint 1 do Nexus cung cấp sẵn.
- Kiểm tra lại toàn bộ thông tin đã điền ở bước Xác nhận (Review) và nộp hồ sơ để hệ thống tiếp nhận, chuyển tiếp sang bước thanh toán hoặc xử lý thẩm định.

### Business/Product goals
- Thu thập đầy đủ bối cảnh tối thiểu nhưng có cấu trúc để AI Engine (Nexus Engine) hoặc Supporter có đủ dữ liệu phản biện chính xác, ngăn ngừa tình trạng nộp hồ sơ rỗng hoặc thiếu tài liệu.
- Phân luồng biểu mẫu động theo gói dịch vụ đã chọn:
  - Với gói tự động `Basic AI Audit` (`pkg_ai_audit` - 79,000 VND), hệ thống tự động loại bỏ bước "Nhu cầu hỗ trợ" (giảm từ 7 bước xuống 6 bước) nhằm tối ưu thời gian hoàn thành của người dùng (nguồn: `page.tsx:103-123`, `IntakeChatFlow.tsx:145-149`).
  - Chặn truy cập gói đang phát triển `Premium Mentor Audit` (`pkg_supporter_audit` - 149,000 VND) ở chế độ tạo mới bằng cảnh báo thân thiện và chuyển hướng sang gói Basic AI (nguồn: `page.tsx:223-263`).
- Tự động lưu nháp biểu mẫu vào `localStorage` ở chế độ tạo mới (`CREATE` mode), giúp sinh viên không bị mất dữ liệu khi vô tình đóng tab hoặc tải lại trang (nguồn: `useIntakeForm.ts:167-177`).
- Chuyển đổi thành công hồ sơ sang trạng thái thanh toán (`/dashboard/case/[id]?checkout=true`) hoặc trang chi tiết hồ sơ (`/dashboard/case/[id]`) (nguồn: `useIntakeForm.ts:153-164`).

### Primary action
- Điền đầy đủ dữ liệu hợp lệ qua từng bước → Bấm *"Tiếp tục"* → Tại bước Xác nhận, bấm *"Nộp hồ sơ"* → Bấm *"Xác nhận"* trong Modal xác nhận nộp hồ sơ để gửi dữ liệu lên máy chủ (nguồn: `IntakeChatFlow.tsx:169-176,236-254,286-296`).

### Secondary actions
- Bấm *"Quay lại"* ở chân form để lùi về bước trước đó (nguồn: `IntakeChatFlow.tsx:178-182,226-233`).
- Bấm trực tiếp vào các bước đã mở khóa trên thanh tiến trình `IntakeProgressStepper` (nguồn: `IntakeProgressStepper.tsx:49-62`, `page.tsx:337-341`).
- Bấm *"Xóa nháp & Nhập lại"* trên thanh bên để mở modal xác nhận xóa toàn bộ dữ liệu nháp trong LocalStorage (nguồn: `page.tsx:343-351,368-409`).
- Bấm *"Copy template Markdown"* hoặc *"Tải file .docx template"* ở bước Tài liệu để lấy mẫu đề cương Checkpoint 1 (nguồn: `DocumentInputStep.tsx:47-70,188-207`).
- Sử dụng nút nổi Demo Data FAB (góc dưới bên phải) để tự động điền nhanh dữ liệu mẫu của 11 đề tài sinh viên ĐH FPT (nguồn: `page.tsx:412-448`, `DemoDataFAB.tsx:33-85`, `demo-presets.ts:459-515`).
- Bấm *"Chuyển sang gói Basic AI (79k)"* hoặc *"Quay lại Dashboard"* khi gặp màn hình chặn gói 149k đang phát triển (nguồn: `page.tsx:240-258`).
- Bấm *"Quay lại trang chủ"* khi gặp màn hình lỗi kết nối hoặc gói không hợp lệ (nguồn: `page.tsx:195-205,287-297`).

### Entry
- CTA chọn gói từ bảng giá trang chủ `/` (ví dụ: `PricingCard` chọn gói Basic AI Audit `href="/dashboard/intake?packageId=pkg_ai_audit"`).
- Nút bấm tạo hồ sơ mới hoặc nộp hồ sơ từ Dashboard sinh viên `/dashboard`.
- Nút *"Mua kiểm tra chuyên sâu"* từ màn hình kết quả Team-Idea Fit `/dashboard/team-fit` (nguồn: `TeamFitResultStep.tsx:154`).
- Truy cập trực tiếp qua URL trình duyệt: `/dashboard/intake`, `/dashboard/intake?packageId=[pkgId]`, hoặc `/dashboard/intake?caseId=[caseId]` (chế độ cập nhật hồ sơ).
- `[Assumption / Cần xác minh]` Nhấp vào liên kết từ email nhắc nhở hoàn thiện hồ sơ hoặc chia sẻ từ thành viên trong nhóm.

### Exit / next step
- Sau khi bấm *"Xác nhận"* nộp hồ sơ mới thành công (`CREATE` mode): Xóa nháp LocalStorage, chuyển hướng tới `/dashboard/case/[caseId]?checkout=true` (với các gói trả phí) hoặc `/dashboard/case/[caseId]` (nếu gói miễn phí) (nguồn: `useIntakeForm.ts:153-164`).
- Cập nhật hồ sơ hiện có thành công (`UPDATE` mode): Chuyển hướng về `/dashboard/case/[caseId]` (nguồn: `useIntakeForm.ts:158,163`).
- Người dùng chưa đăng nhập khi truy cập: Bị `DashboardLayout` chặn và tự động chuyển hướng về `/auth` (nguồn: `apps/web-1/app/dashboard/layout.tsx:16-17`).
- Người dùng có vai trò `admin` hoặc `supporter` truy cập: Bị `DashboardLayout` chặn và chuyển hướng về `/admin` hoặc `/supporter` (nguồn: `apps/web-1/app/dashboard/layout.tsx:20-27`).
- Điều hướng qua thanh Menu trên Header: Trang chủ (`/dashboard`), Ví của tôi (`/dashboard/wallet`), Cài đặt (`/dashboard/settings`), Đăng xuất (`/auth`) (nguồn: `UserMenu.tsx:69-76,130-149`).

### Product facts / constraints
- **Quy tắc xác thực & Phân quyền:** Route `/dashboard/intake` nằm trong layout `(dashboard)` được bọc bởi `DashboardLayout`. Yêu cầu phiên đăng nhập (`session`). Người dùng chưa xác thực sẽ thấy màn hình `LoadingScreen` ("Đang xác thực thông tin...") rồi bị chuyển hướng về `/auth`. Tài khoản `admin` hoặc `supporter` bị chặn render và chuyển hướng sang workspace tương ứng (nguồn: `apps/web-1/app/dashboard/layout.tsx:14-45`).
- **Hai chế độ vận hành (Create vs Update Mode):**
  - *Create Mode* (không có `caseId` trên URL): Xác thực tính hợp lệ của `packageId` qua API `GET /packages`. Tự động tải và đồng bộ dữ liệu vào `localStorage` key `nexus_intake_draft`.
  - *Update Mode* (có `caseId` trên URL): Gọi API `GET /cases/${caseId}` để lấy dữ liệu snapshot hiện tại. Không đọc hay ghi vào `localStorage`. Khi submit, gọi endpoint `POST /cases/${caseId}/intake` thay vì `POST /cases` (nguồn: `page.tsx:21-45,86-92`, `useIntakeForm.ts:95-115,146-149,167-177`).
- **Cơ chế phân nhánh theo gói dịch vụ (Package Branching):**
  - *Gói Basic AI Audit (`pkg_ai_audit`):* Là gói AI-only (`isAiOnlyPackage = true`). Hệ thống tự động loại bỏ bước `SUPPORT_NEEDS` khỏi danh sách bước hiển thị (giảm từ 7 bước xuống 6 bước: `Tình huống` -> `Liên hệ` -> `Bối cảnh dự án` -> `Tài liệu` -> `Phạm vi` -> `Xác nhận`). Dữ liệu `support_needs` được reset về rỗng khi gửi và màn hình Review hiển thị khối bối cảnh "Nexus Engine" (nguồn: `page.tsx:43,103-130`, `IntakeChatFlow.tsx:145-149,194-196`, `ReviewSubmitStep.tsx:64,73-76,99-107`).
  - *Gói Supporter / Mentor Audit (`pkg_supporter_audit`):* Bị chặn hiển thị form ở chế độ tạo mới, hiển thị màn hình thông báo xanh "Tính năng đang được phát triển" và nút chuyển sang gói Basic AI (nguồn: `page.tsx:223-263`).
- **Ràng buộc kiểm tra hợp lệ từng bước (`checkStepValidity`):**
  - *Bước 0 (Tình huống):* `current_blocker` tối thiểu 10 ký tự sau khi trim (hoặc có dữ liệu cũ: `case_summary` >= 20 ký tự hoặc mảng `current_situations` có phần tử) (nguồn: `IntakeChatFlow.tsx:46-47`).
  - *Bước 1 (Liên hệ):* `full_name` >= 2 ký tự; `student_code` >= 5 ký tự; `team_role` bắt buộc; `zalo` chính xác 10 chữ số (`/^\d{10}$/`); `email` chứa ký tự `@` (nguồn: `IntakeChatFlow.tsx:48-59`).
  - *Bước 2 (Bối cảnh dự án):* `school` bắt buộc; `course_context` bắt buộc; `project_name` bắt buộc; nếu `school === "Đại học FPT"` và `course_context === "EXE101"` thì `group_no` bắt buộc chỉ chứa chữ số (`/^\d+$/`), trường hợp khác `group_no` chỉ cần không rỗng (nguồn: `IntakeChatFlow.tsx:60-74`).
  - *Bước 3 (Nhu cầu hỗ trợ):* Bỏ qua nếu là gói AI-only. Nếu không, `support_needs.primary_need` bắt buộc và `expected_outputs` nếu có phải >= 5 ký tự (nguồn: `IntakeChatFlow.tsx:75-82`).
  - *Bước 4 (Tài liệu):* Mảng `documents` có ít nhất 1 file, mỗi file phải có `file_url` không rỗng và `document_type` không rỗng (nguồn: `IntakeChatFlow.tsx:83-96`).
  - *Bước 5 (Phạm vi):* Phải tích chọn đủ 3 cam kết ranh giới (`originality`, `advisory_only`, `accurate_contact`) (nguồn: `IntakeChatFlow.tsx:97-103`).
  - *Bước 6 (Xác nhận):* Luôn hợp lệ để bấm nút nộp hồ sơ (nguồn: `IntakeChatFlow.tsx:104-105`).
- **Ràng buộc tải lên tài liệu:** Hỗ trợ các định dạng `.pdf,.docx,.xlsx,.pptx,.md,.txt`. Dung lượng tối đa 15MB/file (`MAX_DOCUMENT_FILE_SIZE_BYTES = 15 * 1024 * 1024`). Tối đa 10 tài liệu mỗi hồ sơ (`MAX_DOCUMENT_COUNT = 10`). Tải trực tiếp lên server qua endpoint `POST /documents/upload` lưu trữ Cloudinary (nguồn: `DocumentInputStep.tsx:23-25,81-129`).
- **Lưu nháp LocalStorage:** Dữ liệu tự động lưu vào key `nexus_intake_draft`. Khi tải lại trang, trường `current_blocker` bị reset về rỗng để người dùng cập nhật điểm kẹt mới nhất (nguồn: `useIntakeForm.ts:126,167-177`).
- **Demo Data FAB:** Nút tròn nổi góc dưới phải (`z-50`) cung cấp sẵn 11 preset dữ liệu hồ sơ thực tế từ các nhóm sinh viên ĐH FPT (Nexus, Farm2Dorm, ReWear, PawPal, SmashBook, LeanTea, MentorMap, ShareNest, ChargeCampus, MindNote, CraftUni) (nguồn: `page.tsx:412-448`, `demo-presets.ts:459-515`, `DemoDataFAB.tsx:33-85`).

---

## Interactive Inventory

### 1. Top Navbar & Shared Dashboard Chrome
*Nguồn: `apps/web-1/components/layout/DashboardShell.tsx`, `UserMenu.tsx`, `NotificationBell.tsx`, `ThemeToggler.tsx`, `Logo.tsx`, `LoadingScreen.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.chrome.loading.title` | `LoadingScreen` > `p` (Tiêu đề trên) | Heading | `Nexus Platform` | — | loading state (khi session đang pending) |
| `intake.chrome.loading.message` | `LoadingScreen` > `p` (Nội dung dưới) | Description | `Đang xác thực thông tin...` | — | loading state (khi session đang pending) |
| `intake.chrome.navbar.logo_alt` | `Link` > `Logo` > `img[alt]` | Alt text | `Nexus Logo` | `/dashboard` (hoặc `/supporter`, `/admin` theo role) | default |
| `intake.chrome.navbar.notif_btn` | `Menu.Target` > `ActionIcon[aria-label]` | Aria-label | `Thông báo` | Mở dropdown thông báo | default |
| `intake.chrome.navbar.notif_badge` | `ActionIcon` > `Badge` | Badge | `{unreadCount > 99 ? "99+" : unreadCount}` | — | visible khi unreadCount > 0 |
| `intake.chrome.navbar.notif_header` | `Menu.Dropdown` > `Text` | Heading | `Thông báo` | — | default |
| `intake.chrome.navbar.notif_empty` | `Menu.Dropdown` > `Text` | Empty state | `Không có thông báo` | — | visible khi items.length === 0 |
| `intake.chrome.navbar.notif_mark_all` | `Menu.Dropdown` > `button` | CTA | `Đánh dấu tất cả đã đọc` | Kích hoạt mutation `markAllRead` | disabled khi unreadCount === 0 |
| `intake.chrome.navbar.theme_btn` | `ThemeToggler` > `ActionIcon[aria-label]` | Aria-label | `Toggle theme` | Chuyển đổi theme Sáng / Tối | default |
| `intake.chrome.navbar.user_btn` | `Popover.Target` > `button[aria-label]` | Aria-label | `Tài khoản` | Mở menu tài khoản cá nhân | default |
| `intake.chrome.navbar.user_avatar_alt` | `Popover.Target` > `Avatar[alt]` | Alt text | `{user.name \|\| "User"}` | — | default |
| `intake.chrome.navbar.user_avatar_fallback` | `Popover.Target` > `Avatar` (Text fallback) | Label | `{user.name?.substring(0, 2).toUpperCase() \|\| "US"}` | — | default khi không có ảnh đại diện |
| `intake.chrome.navbar.user_email` | `Popover.Dropdown` > `p` | Item | `{user.email \|\| "—"}` | — | default |
| `intake.chrome.navbar.wallet_label` | `Popover.Dropdown` > `span` | Label | `Số dư` | — | student role only |
| `intake.chrome.navbar.wallet_balance` | `Popover.Dropdown` > `span` | Item | `{walletBalance.toLocaleString("vi-VN")} VND` | — | student role only |
| `intake.chrome.navbar.menu_home` | `Popover.Dropdown` > `button` (Option 1) | Navigation | `Trang chủ` | `/dashboard` (hoặc `/admin`, `/supporter`) | default |
| `intake.chrome.navbar.menu_wallet` | `Popover.Dropdown` > `button` (Option 2) | Navigation | `Ví của tôi` | `/dashboard/wallet` | student role only |
| `intake.chrome.navbar.menu_settings` | `Popover.Dropdown` > `button` (Option 3) | Navigation | `Cài đặt` | `/dashboard/settings` (student) hoặc `/supporter/settings` | default |
| `intake.chrome.navbar.menu_logout` | `Popover.Dropdown` > `button` (Option 4) | CTA | `Đăng xuất` | Gọi hàm `signOut()` → redirect `/auth` | default |

---

### 2. Page Header, Loading & Error States
*Nguồn: `apps/web-1/app/dashboard/intake/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.suspense.loading` | `IntakePage` > `Suspense` > `p` | Description | `Đang tải...` | — | loading state (Next.js Suspense boundary) |
| `intake.loading.skeleton_text` | `IntakePageContent` > `p.animate-pulse` | Description | `{isUpdateMode ? "Đang tải dữ liệu hồ sơ..." : "Đang tải cấu hình biểu mẫu..."}` | — | loading state (`isLoadingForm`) |
| `intake.error.case_title` | `Alert[color="red"]` > `title` | Heading | `Lỗi` | — | error state (`isUpdateMode && isCaseError`) |
| `intake.error.case_message` | `Alert[color="red"]` > `p` | Error | `Không tải được hồ sơ. Vui lòng thử lại.` | — | error state (`isUpdateMode && isCaseError`) |
| `intake.error.packages_title` | `Alert[color="red"]` > `title` | Heading | `Lỗi kết nối` | — | error state (`!isUpdateMode && isPackagesError`) |
| `intake.error.packages_message` | `Alert[color="red"]` > `p` | Error | `Không thể tải danh sách gói dịch vụ. Vui lòng kiểm tra kết nối mạng và thử lại.` | — | error state (`!isUpdateMode && isPackagesError`) |
| `intake.error.packages_back_btn` | `Alert[color="red"]` > `Button` | CTA | `Quay lại trang chủ` | `/` | default (khi lỗi tải gói dịch vụ) |
| `intake.indev.supporter_title` | `Alert[color="blue"]` > `title` | Heading | `Tính năng đang được phát triển` | — | warning state (`packageId === "pkg_supporter_audit"`) |
| `intake.indev.supporter_message` | `Alert[color="blue"]` > `p` | Description | `Gói Premium Mentor Audit hiện đang được hoàn thiện. Vui lòng chọn gói Basic AI Audit (79.000đ) để được phản biện tức thì!` | — | warning state (`packageId === "pkg_supporter_audit"`) |
| `intake.indev.switch_ai_btn` | `Alert[color="blue"]` > `Button` (Nút trên) | CTA | `Chuyển sang gói Basic AI (79k)` | `/dashboard/intake?packageId=pkg_ai_audit` | default |
| `intake.indev.back_dashboard_btn` | `Alert[color="blue"]` > `Button` (Nút dưới) | Navigation | `Quay lại Dashboard` | `/dashboard` | default |
| `intake.error.invalid_pkg_title` | `Alert[color="red"]` > `title` | Heading | `Lỗi` | — | error state (khi `packageId` không tồn tại trong `packagesData`) |
| `intake.error.invalid_pkg_message` | `Alert[color="red"]` > `p` | Error | `Gói dịch vụ không hợp lệ. Vui lòng quay lại.` | — | error state (khi `packageId` không hợp lệ) |
| `intake.error.invalid_pkg_btn` | `Alert[color="red"]` > `Button` | CTA | `Quay lại trang chủ` | `/` | default |
| `intake.header.title` | `h1` | Heading | `{isUpdateMode ? "Cập nhật hồ sơ" : "Tạo hồ sơ mới"}` | — | default |
| `intake.header.subtitle` | `p` | Description | `{isUpdateMode ? "Điều chỉnh thông tin hồ sơ hiện tại." : "Cấu trúc ý tưởng và thông tin minh chứng để bắt đầu chạy phản biện."}` | — | default |
| `intake.header.sla_alert` | `Alert[color="blue"]` | Helper | `⏱ Thời gian phản biện: 24h–48h có Mentor chuyên môn đồng hành và phản hồi` | — | visible khi `!isAiOnlyPackage` |

---

### 3. Progress Stepper Sidebar & Reset Draft Action
*Nguồn: `apps/web-1/app/dashboard/intake/_components/IntakeProgressStepper.tsx`, `page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.stepper.step_0_label` | `IntakeProgressStepper` > `button` (Bước 0) | Navigation | `Tình huống` | Chuyển tới bước `SITUATION` (lưu nháp trước khi chuyển) | active / completed / selectable / locked |
| `intake.stepper.step_1_label` | `IntakeProgressStepper` > `button` (Bước 1) | Navigation | `Liên hệ` | Chuyển tới bước `CONTACT` | active / completed / selectable / locked |
| `intake.stepper.step_2_label` | `IntakeProgressStepper` > `button` (Bước 2) | Navigation | `Bối cảnh dự án` | Chuyển tới bước `PROJECT_CONTEXT` | active / completed / selectable / locked |
| `intake.stepper.step_3_label` | `IntakeProgressStepper` > `button` (Bước 3) | Navigation | `Nhu cầu hỗ trợ` | Chuyển tới bước `SUPPORT_NEEDS` | ẩn khi `isAiOnlyPackage = true` |
| `intake.stepper.step_4_label` | `IntakeProgressStepper` > `button` (Bước 4) | Navigation | `Tài liệu` | Chuyển tới bước `DOCUMENTS` | active / completed / selectable / locked |
| `intake.stepper.step_5_label` | `IntakeProgressStepper` > `button` (Bước 5) | Navigation | `Phạm vi` | Chuyển tới bước `BOUNDARY` | active / completed / selectable / locked |
| `intake.stepper.step_6_label` | `IntakeProgressStepper` > `button` (Bước 6) | Navigation | `Xác nhận` | Chuyển tới bước `REVIEW` | active / completed / selectable / locked |
| `intake.stepper.status_active` | `IntakeProgressStepper` (Desktop sub-label) | Item | `Đang thực hiện` | — | active state |
| `intake.stepper.status_completed` | `IntakeProgressStepper` (Desktop sub-label) | Item | `Đã hoàn thành` | — | completed state |
| `intake.stepper.status_selectable` | `IntakeProgressStepper` (Desktop sub-label) | Item | `Sẵn sàng` | — | selectable state |
| `intake.stepper.status_locked` | `IntakeProgressStepper` (Desktop sub-label) | Item | `Chưa mở khóa` | — | locked state (disabled) |
| `intake.sidebar.reset_btn` | `Button[color="red"]` | CTA | `Xóa nháp & Nhập lại` | Mở Modal `isResetOpen` xác nhận xóa nháp | default |
| `intake.modal.reset_title` | `Modal` > `title` | Heading | `Xác nhận xóa bản nháp` | — | visible khi `isResetOpen === true` |
| `intake.modal.reset_message` | `Modal` > `p` | Description | `Bạn có chắc chắn muốn xóa toàn bộ thông tin nháp đã lưu? Hành động này sẽ đặt lại biểu mẫu về ban đầu và không thể hoàn tác.` | — | visible khi `isResetOpen === true` |
| `intake.modal.reset_cancel_btn` | `Modal` > `Button` (Hủy) | CTA | `Hủy` | Đóng modal xóa nháp | default |
| `intake.modal.reset_confirm_btn` | `Modal` > `Button` (Xóa nháp) | CTA | `Xóa nháp` | Xóa `localStorage`, reset form về ban đầu, về Bước 0, đóng modal | default |

---

### 4. Chat Assistant Banner & Flow Wrapper
*Nguồn: `apps/web-1/app/dashboard/intake/_components/IntakeChatFlow.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.bot.title` | `h4` | Heading | `Trợ lý tạo Hồ sơ Phản biện` | — | default |
| `intake.bot.description_ai` | `p` (Gói AI-only) | Description | `Xin chào! Mình sẽ hướng dẫn bạn hoàn thiện hồ sơ phản biện. Hãy điền thông tin qua từng bước để hệ thống AI thẩm định toàn diện dự án của bạn.` | — | visible khi `isAiOnlyPackage === true` |
| `intake.bot.description_supporter` | `p` (Gói Supporter) | Description | `Xin chào! Mình sẽ hướng dẫn bạn hoàn thiện hồ sơ phản biện. Hãy điền thông tin qua từng bước để Supporter có đủ bối cảnh cần thiết.` | — | visible khi `isAiOnlyPackage === false` |

---

### 5. Step 0: Situation (Tình huống / Điểm kẹt hiện tại)
*Nguồn: `apps/web-1/app/dashboard/intake/_components/Steps/SituationStep.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.situation.heading` | `h3` | Heading | `Nhóm đang kẹt ở đâu?` | — | default |
| `intake.situation.heading_tooltip` | `Tooltip` > `span` | Helper | `Mô tả ngắn gọn nút thắt hiện tại để Supporter tập trung giải quyết.` | — | hover tooltip |
| `intake.situation.alert_title` | `Alert` > `title` | Heading | `Lưu ý quan trọng` | — | default |
| `intake.situation.alert_body` | `Alert` (Nội dung) | Description | `Không cần viết lại proposal. Chỉ nói ngắn gọn nút thắt hiện tại: giảng viên chê gì, đội đang bí gì, hoặc cần Supporter phản biện phần nào ngay bây giờ.` | — | default |
| `intake.situation.blocker_label` | `Textarea` > `label` | Label | `Điểm kẹt hiện tại *` | — | default |
| `intake.situation.blocker_tooltip` | `Textarea` > `label` > `Tooltip` | Helper | `Ví dụ: nhóm bị chê phần customer pain chưa rõ, logic solution còn yếu, hoặc cần phản biện giúp trước deadline thứ 5.` | — | hover tooltip |
| `intake.situation.blocker_placeholder` | `Textarea[placeholder]` | Placeholder | `Ví dụ: Giảng viên nói phần customer segment còn mơ hồ, cần supporter phản biện giúp trước thứ 5.` | Nhập điểm kẹt hiện tại của nhóm | default |
| `intake.situation.blocker_counter` | `Textarea` > `description` | Helper | `{(field.state.value \|\| "").length}/20000 ký tự` | — | default |
| `intake.situation.blocker_err_required` | `form.Field[current_blocker]` | Error | `Mô tả điểm kẹt hiện tại là bắt buộc.` | — | error state (khi để trống) |
| `intake.situation.blocker_err_min` | `form.Field[current_blocker]` | Error | `Mô tả điểm kẹt hiện tại tối thiểu 10 ký tự.` | — | error state (khi gõ < 10 ký tự) |
| `intake.situation.blocker_err_max` | `form.Field[current_blocker]` | Error | `Mô tả điểm kẹt hiện tại không được vượt quá 20000 ký tự.` | — | error state (khi gõ > 20000 ký tự) |

---

### 6. Step 1: Contact (Thông tin người liên hệ)
*Nguồn: `apps/web-1/app/dashboard/intake/_components/Steps/ContactStep.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.contact.heading` | `h3` | Heading | `Thông tin người liên hệ` | — | default |
| `intake.contact.heading_tooltip` | `Tooltip` > `span` | Helper | `Thông tin của bạn để Supporter tiện liên hệ hỗ trợ khi cần thiết.` | — | hover tooltip |
| `intake.contact.fullname_label` | `TextInput[contact.full_name]` | Label | `Họ và tên *` | — | default |
| `intake.contact.fullname_placeholder` | `TextInput[contact.full_name]` | Placeholder | `Ví dụ: Nguyễn Văn A` | Nhập họ tên người đại diện | default |
| `intake.contact.fullname_counter` | `TextInput[contact.full_name]` > `rightSection` | Helper | `{(value \|\| "").length}/100` | — | default |
| `intake.contact.fullname_err_required` | `form.Field[contact.full_name]` | Error | `Họ và tên là bắt buộc.` | — | error state |
| `intake.contact.fullname_err_min` | `form.Field[contact.full_name]` | Error | `Họ và tên tối thiểu phải 2 ký tự.` | — | error state (khi < 2 ký tự) |
| `intake.contact.fullname_err_max` | `form.Field[contact.full_name]` | Error | `Họ và tên không được vượt quá 100 ký tự.` | — | error state (khi > 100 ký tự) |
| `intake.contact.studentcode_label` | `TextInput[contact.student_code]` | Label | `Mã số sinh viên *` | — | default |
| `intake.contact.studentcode_tooltip` | `TextInput[contact.student_code]` > `Tooltip` | Helper | `Nhập mã số sinh viên của bạn (ví dụ: HE150123) để xác thực bối cảnh Campus.` | — | hover tooltip |
| `intake.contact.studentcode_placeholder` | `TextInput[contact.student_code]` | Placeholder | `Ví dụ: HE150123` | Nhập mã sinh viên | default |
| `intake.contact.studentcode_counter` | `TextInput[contact.student_code]` > `rightSection` | Helper | `{(value \|\| "").length}/100` | — | default |
| `intake.contact.studentcode_err_required` | `form.Field[contact.student_code]` | Error | `Mã số sinh viên là bắt buộc.` | — | error state |
| `intake.contact.studentcode_err_min` | `form.Field[contact.student_code]` | Error | `Mã số sinh viên tối thiểu phải 5 ký tự.` | — | error state (khi < 5 ký tự) |
| `intake.contact.studentcode_err_max` | `form.Field[contact.student_code]` | Error | `Mã số sinh viên không được vượt quá 100 ký tự.` | — | error state (khi > 100 ký tự) |
| `intake.contact.teamrole_label` | `TextInput[contact.team_role]` | Label | `Vai trò trong nhóm *` | — | default |
| `intake.contact.teamrole_tooltip` | `TextInput[contact.team_role]` > `Tooltip` | Helper | `Nhập vai trò của bạn trong nhóm (ví dụ: Trưởng nhóm, Coder, Pitcher, Designer...).` | — | hover tooltip |
| `intake.contact.teamrole_placeholder` | `TextInput[contact.team_role]` | Placeholder | `Ví dụ: Leader, Coder, Pitcher...` | Nhập vai trò trong nhóm | default |
| `intake.contact.teamrole_counter` | `TextInput[contact.team_role]` > `rightSection` | Helper | `{(value \|\| "").length}/100` | — | default |
| `intake.contact.teamrole_err_required` | `form.Field[contact.team_role]` | Error | `Vai trò trong nhóm là bắt buộc.` | — | error state |
| `intake.contact.teamrole_err_max` | `form.Field[contact.team_role]` | Error | `Vai trò trong nhóm không được vượt quá 100 ký tự.` | — | error state (khi > 100 ký tự) |
| `intake.contact.zalo_label` | `TextInput[contact.zalo]` | Label | `Số điện thoại Zalo *` | — | default |
| `intake.contact.zalo_tooltip` | `TextInput[contact.zalo]` > `Tooltip` | Helper | `Cung cấp chính xác SĐT Zalo gồm 10 chữ số để supporter liên hệ nhanh khi cần thiết.` | — | hover tooltip |
| `intake.contact.zalo_placeholder` | `TextInput[contact.zalo]` | Placeholder | `Ví dụ: 0987654321` | Nhập SĐT Zalo | default |
| `intake.contact.zalo_err_required` | `form.Field[contact.zalo]` | Error | `Số điện thoại Zalo là bắt buộc.` | — | error state |
| `intake.contact.zalo_err_format` | `form.Field[contact.zalo]` | Error | `Số điện thoại Zalo phải bao gồm chính xác 10 chữ số.` | — | error state (khi không đúng 10 chữ số) |
| `intake.contact.email_label` | `TextInput[contact.email]` | Label | `Email liên hệ *` | — | default |
| `intake.contact.email_placeholder` | `TextInput[contact.email]` | Placeholder | `Ví dụ: anvhe150123@fpt.edu.vn` | Nhập email liên hệ | default |
| `intake.contact.email_counter` | `TextInput[contact.email]` > `rightSection` | Helper | `{(value \|\| "").length}/254` | — | default |
| `intake.contact.email_err_required` | `form.Field[contact.email]` | Error | `Email liên hệ là bắt buộc.` | — | error state |
| `intake.contact.email_err_format` | `form.Field[contact.email]` | Error | `Email không đúng định dạng.` | — | error state (khi thiếu ký tự @) |
| `intake.contact.email_err_max` | `form.Field[contact.email]` | Error | `Email liên hệ không được vượt quá 254 ký tự.` | — | error state (khi > 254 ký tự) |
| `intake.contact.telegram_label` | `TextInput[contact.telegram]` | Label | `Telegram Username (Tùy chọn)` | — | default |
| `intake.contact.telegram_placeholder` | `TextInput[contact.telegram]` | Placeholder | `Ví dụ: @annguyen_fpt` | Nhập username Telegram | default |

---

### 7. Step 2: Project Context (Thông tin Nhóm / Đề tài)
*Nguồn: `apps/web-1/app/dashboard/intake/_components/Steps/ProjectContextStep.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.project.heading` | `h3` | Heading | `Thông tin Nhóm / Đề tài` | — | default |
| `intake.project.heading_tooltip` | `Tooltip` > `span` | Helper | `Thông tin bối cảnh học tập và hoạt động của nhóm.` | — | hover tooltip |
| `intake.project.school_label` | `Select[school]` | Label | `Trường học *` | — | default |
| `intake.project.school_placeholder` | `Select[school]` | Placeholder | `Chọn trường học` | Mở dropdown chọn trường | default |
| `intake.project.school_opt_fpt` | `Select[school]` (Option 1) | Item | `Đại học FPT` | Chọn trường Đại học FPT | default |
| `intake.project.school_opt_other` | `Select[school]` (Option 2) | Item | `Khác` | Chọn trường Khác (tự set mã môn & group_no thành "Khác") | default |
| `intake.project.school_err_required` | `form.Field[school]` | Error | `Vui lòng chọn trường học.` | — | error state |
| `intake.project.course_label` | `Select[course_context]` | Label | `Mã môn học *` | — | default |
| `intake.project.course_placeholder` | `Select[course_context]` | Placeholder | `Chọn mã môn học` | Mở dropdown chọn mã môn | default |
| `intake.project.course_opt_exe101` | `Select[course_context]` (Option 1) | Item | `EXE101` | Chọn môn EXE101 | default khi `school === "Đại học FPT"` |
| `intake.project.course_opt_other` | `Select[course_context]` (Option 2) | Item | `Khác` | Chọn môn Khác (tự set group_no thành "Khác") | default |
| `intake.project.course_err_required` | `form.Field[course_context]` | Error | `Vui lòng chọn mã môn học.` | — | error state |
| `intake.project.groupno_label` | `TextInput[team_context.group_no]` | Label | `Số thứ tự nhóm (Group No) *` | — | chỉ hiển thị khi `school === "Đại học FPT" && course_context === "EXE101"` |
| `intake.project.groupno_placeholder` | `TextInput[team_context.group_no]` | Placeholder | `Ví dụ: 5` | Nhập số thứ tự nhóm | default |
| `intake.project.groupno_err_required` | `form.Field[team_context.group_no]` | Error | `Số thứ tự nhóm là bắt buộc.` | — | error state |
| `intake.project.groupno_err_digits` | `form.Field[team_context.group_no]` | Error | `Số thứ tự nhóm chỉ được chứa chữ số (ví dụ: 5).` | — | error state (khi chứa ký tự không phải số) |
| `intake.project.name_label` | `TextInput[team_context.project_name]` | Label | `Tên đề tài *` | — | default |
| `intake.project.name_placeholder` | `TextInput[team_context.project_name]` | Placeholder | `Ví dụ: EduMap` | Nhập tên đề tài | default |
| `intake.project.name_desc` | `TextInput[team_context.project_name]` | Helper | `Tên đề tài có thể thay đổi sau trong phần Cài đặt.` | — | default |
| `intake.project.name_err_required` | `form.Field[team_context.project_name]` | Error | `Tên đề tài là bắt buộc.` | — | error state |
| `intake.project.summary_label` | `Textarea[team_context.team_status_summary]` | Label | `Tóm tắt hiện trạng nhóm` | — | default |
| `intake.project.summary_tooltip` | `Textarea[team_context.team_status_summary]` > `Tooltip` | Helper | `Mô tả ngắn gọn về tình hình hiện tại (ví dụ: đã phân chia công việc xong, đang gặp khó khăn trong thống nhất ý tưởng...).` | — | hover tooltip |
| `intake.project.summary_placeholder` | `Textarea[team_context.team_status_summary]` | Placeholder | `Ví dụ: Nhóm đã thống nhất ý tưởng, đang viết đề cương phân tích thị trường...` | Nhập tóm tắt hiện trạng nhóm | default |

---

### 8. Step 3: Support Needs (Nhu cầu hỗ trợ — Chỉ xuất hiện ở gói có Supporter)
*Nguồn: `apps/web-1/app/dashboard/intake/_components/Steps/SupportNeedsStep.tsx`*  
*(Lưu ý: Toàn bộ phần này bị ẩn khi `isAiOnlyPackage === true`)*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.support.heading` | `h3` | Heading | `Nhu cầu hỗ trợ` | — | non-AI package only |
| `intake.support.heading_tooltip` | `Tooltip` > `span` | Helper | `Chỉ cần chọn hướng hỗ trợ chính. Phần ghi chú thêm và kỳ vọng đầu ra là tùy chọn.` | — | hover tooltip |
| `intake.support.primary_label` | `Select[support_needs.primary_need]` | Label | `Nhu cầu hỗ trợ chính *` | — | default |
| `intake.support.primary_placeholder` | `Select[support_needs.primary_need]` | Placeholder | `Chọn nhu cầu chính của nhóm bạn` | Mở dropdown chọn nhu cầu | default |
| `intake.support.opt_filter_idea` | `Select[support_needs.primary_need]` (Option 1) | Item | `Cần hỗ trợ chọn hướng ý tưởng phù hợp để phát triển tiếp` | Chọn option | default |
| `intake.support.opt_clarify_pain` | `Select[support_needs.primary_need]` (Option 2) | Item | `Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi` | Chọn option | default |
| `intake.support.opt_critique_feasibility` | `Select[support_needs.primary_need]` (Option 3) | Item | `Cần phản biện để đánh giá giải pháp hiện tại có hợp lý và khả thi không` | Chọn option | default |
| `intake.support.opt_audit_cp1` | `Select[support_needs.primary_need]` (Option 4) | Item | `Cần rà soát báo cáo Checkpoint 1 và chỉ ra điểm cần chỉnh sửa` | Chọn option | default |
| `intake.support.opt_improve_idea` | `Select[support_needs.primary_need]` (Option 5) | Item | `Cần góp ý để cải thiện ý tưởng sau phản hồi chưa tốt từ giảng viên` | Chọn option | default |
| `intake.support.primary_err_required` | `form.Field[support_needs.primary_need]` | Error | `Nhu cầu hỗ trợ chính là bắt buộc.` | — | error state |
| `intake.support.primary_err_max` | `form.Field[support_needs.primary_need]` | Error | `Nhu cầu hỗ trợ chính không được vượt quá 100 ký tự.` | — | error state (khi > 100 ký tự) |
| `intake.support.outputs_label` | `Textarea[expected_outputs]` | Label | `Kết quả mong đợi sau phản biện (Tùy chọn)` | — | default |
| `intake.support.outputs_tooltip` | `Textarea[expected_outputs]` > `Tooltip` | Helper | `Nếu muốn, hãy nói rõ supporter nên trả về dạng góp ý nào: chỉ điểm yếu logic, hỏi câu phản biện, hay gợi ý cách sửa.` | — | hover tooltip |
| `intake.support.outputs_placeholder` | `Textarea[expected_outputs]` | Placeholder | `Ví dụ: Chỉ ra các điểm yếu chính trong logic khách hàng mục tiêu và đề xuất câu hỏi phản biện cụ thể...` | Nhập kỳ vọng đầu ra | default |
| `intake.support.outputs_err_min` | `form.Field[expected_outputs]` | Error | `Vui lòng mô tả chi tiết kỳ vọng đầu ra (tối thiểu 5 ký tự).` | — | error state (khi có nhập nhưng < 5 ký tự) |
| `intake.support.notes_label` | `Textarea[support_needs.extra_notes]` | Label | `Ghi chú thêm cho Supporter (Tùy chọn)` | — | default |
| `intake.support.notes_placeholder` | `Textarea[support_needs.extra_notes]` | Placeholder | `Bất kỳ thông tin bổ sung nào khác giúp Supporter hiểu rõ hơn vấn đề của nhóm.` | Nhập ghi chú thêm cho Supporter | default |

---

### 9. Step 4: Documents (Tài liệu đính kèm)
*Nguồn: `apps/web-1/app/dashboard/intake/_components/Steps/DocumentInputStep.tsx`, `packages/validation/src/index.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.doc.heading` | `h3` | Heading | `Hồ sơ của nhóm đã có sẵn chưa?` | — | default |
| `intake.doc.heading_tooltip` | `Tooltip` > `span` | Helper | `Tải file tài liệu nhóm đã chuẩn bị. Supporter sẽ đọc trực tiếp từ đây, nên bạn không cần viết lại toàn bộ ý tưởng.` | — | hover tooltip |
| `intake.doc.template_alert_title` | `Alert[color="blue"]` > `title` | Heading | `Chưa có hồ sơ hoặc ý tưởng còn mơ hồ?` | — | default |
| `intake.doc.template_alert_body` | `Alert[color="blue"]` > `p` | Description | `Nếu nhóm chưa có proposal đủ rõ, hãy dùng template có sẵn để điền nhanh các phần cốt lõi. Sau khi hoàn tất, tải file lên ở bên dưới.` | — | default |
| `intake.doc.template_copy_btn` | `Button` (Copy Markdown) | CTA | `Copy template Markdown` | Gọi `fetch('/idea-template/TEMPLATE_STARTUP_CHECKPOINT1_V2.md')` và copy vào clipboard | default |
| `intake.doc.template_download_btn` | `Button` (Download DOCX) | CTA | `Tải file .docx template` | Mở tab mới tải `/idea-template/TEMPLATE_STARTUP_CHECKPOINT1_V2.docx` | default |
| `intake.doc.template_msg_copy_success` | `Alert` > `p.text-text-muted` | Toast | `Đã copy template Markdown. Bạn có thể dán ra ngoài để điền nhanh.` | — | visible sau khi copy thành công |
| `intake.doc.template_msg_copy_error` | `Alert` > `p.text-text-muted` | Toast | `Copy template Markdown thất bại. Hãy thử lại hoặc tải file .docx.` | — | visible khi copy thất bại |
| `intake.doc.template_msg_docx_success` | `Alert` > `p.text-text-muted` | Toast | `Đã mở file .docx template trong tab mới để bạn tải về.` | — | visible sau khi mở link docx |
| `intake.doc.template_msg_docx_error` | `Alert` > `p.text-text-muted` | Toast | `Không thể mở file .docx template. Hãy thử lại sau.` | — | visible khi mở docx thất bại |
| `intake.doc.upload_label` | `label` | Label | `Tải lên tài liệu *` | — | default |
| `intake.doc.upload_tooltip` | `Tooltip` > `span` | Helper | `Hỗ trợ PDF, DOCX, XLSX, PPTX, MD, TXT. Dung lượng tối đa 15MB mỗi file.` | — | hover tooltip |
| `intake.doc.upload_btn_default` | `Button[variant="outline"]` | CTA | `Chọn file tài liệu` | Kích hoạt input file ẩn để chọn tệp tin | default |
| `intake.doc.upload_btn_loading` | `Button[variant="outline"]` | CTA | `Đang tải lên...` | Đang upload file lên server Cloudinary | loading state (`uploading = true`) |
| `intake.doc.upload_helper` | `Text[size="xs"]` | Helper | `.pdf, .docx, .xlsx, .pptx, .md, .txt • tối đa 15MB • {docs.length}/10 tài liệu` | — | default |
| `intake.doc.upload_err_size` | `Alert[color="red"]` | Error | `File "${file.name}" vượt quá giới hạn 15MB. Vui lòng chọn file nhỏ hơn.` | — | error state (khi file > 15MB) |
| `intake.doc.upload_err_count` | `Alert[color="red"]` | Error | `Tối đa 10 tài liệu mỗi hồ sơ. Vui lòng xóa bớt tài liệu trước khi tải thêm.` | — | error state (khi docs.length >= 10) |
| `intake.doc.upload_err_api` | `Alert[color="red"]` | Error | `{apiMessage \|\| 'Lỗi khi tải lên "${file.name}". Vui lòng thử lại.'}` | — | error state khi API upload thất bại |
| `intake.doc.list_label` | `label` (Danh sách file) | Label | `Tài liệu đã tải lên ({docs.length}/10)` | — | visible khi `docs.length > 0` |
| `intake.doc.item_name` | `Paper` > `Text[size="sm"]` | Item | `{doc.original_name}` | — | default |
| `intake.doc.item_ext_badge` | `Paper` > `Badge` | Badge | `{doc.extension?.toUpperCase() ?? "FILE"}` | — | default |
| `intake.doc.item_storage_tag` | `Paper` > `Text[size="xs"]` | Item | `Cloudinary` | — | default |
| `intake.doc.select_type_placeholder` | `Select[placeholder]` | Placeholder | `Chọn loại tài liệu` | Mở dropdown phân loại tài liệu | default |
| `intake.doc.type_opt_idea_report` | `Select` (Option 1) | Item | `Thuyết minh ý tưởng` | Gán `document_type = "idea_report"` | default |
| `intake.doc.type_opt_pitch_deck` | `Select` (Option 2) | Item | `Slide thuyết trình` | Gán `document_type = "pitch_deck"` | default |
| `intake.doc.type_opt_market_research` | `Select` (Option 3) | Item | `Nghiên cứu thị trường` | Gán `document_type = "market_research"` | default |
| `intake.doc.type_opt_financial_plan` | `Select` (Option 4) | Item | `Kế hoạch tài chính` | Gán `document_type = "financial_plan"` | default |
| `intake.doc.type_opt_other` | `Select` (Option 5) | Item | `Tài liệu bổ sung` | Gán `document_type = "other"` | default |
| `intake.doc.remove_btn` | `ActionIcon[aria-label]` | Aria-label | `Xóa tài liệu` | Xóa tài liệu khỏi danh sách | default |
| `intake.doc.err_missing_types` | `p.text-red-500` | Error | `Vui lòng chọn loại tài liệu cho tất cả các file đã tải lên.` | — | visible khi có file chưa chọn loại |
| `intake.doc.empty_state` | `div` (Khung nét đứt) > `Text` | Empty state | `Chưa có tài liệu nào được tải lên. Nhấn "Chọn file tài liệu" để bắt đầu.` | — | visible khi `!hasDocs && !uploading` |

---

### 10. Step 5: Boundary (Cam kết ranh giới)
*Nguồn: `apps/web-1/app/dashboard/intake/_components/Steps/BoundaryStep.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.boundary.heading` | `h3` | Heading | `Cam kết ranh giới` | — | default |
| `intake.boundary.heading_tooltip` | `Tooltip` > `span` | Helper | `Đọc kỹ và tích chọn tất cả các cam kết dưới đây.` | — | hover tooltip |
| `intake.boundary.alert_title` | `Alert[color="red"]` > `title` | Heading | `ĐIỀU KHOẢN QUAN TRỌNG` | — | default |
| `intake.boundary.alert_body` | `Alert[color="red"]` (Nội dung) | Description | `Bạn cần xác nhận các cam kết bên dưới để gửi hồ sơ. Nexus từ chối hỗ trợ tài liệu sao chép hoặc yêu cầu cam kết điểm số/kết quả đánh giá chính thức.` | — | default |
| `intake.boundary.rule_originality` | `Checkbox[id="originality"]` | Label | `Chúng tôi cam kết tài liệu đính kèm là do nhóm tự nghiên cứu và xây dựng, không sao chép trái phép.` | Tích chọn/bỏ chọn cam kết bản quyền | default |
| `intake.boundary.rule_advisory` | `Checkbox[id="advisory_only"]` | Label | `Chúng tôi hiểu rằng các đánh giá và phản biện từ Nexus mang tính chất tư vấn phản biện, không thay thế điểm số của giảng viên.` | Tích chọn/bỏ chọn cam kết tư vấn | default |
| `intake.boundary.rule_accurate_contact` | `Checkbox[id="accurate_contact"]` | Label | `Chúng tôi cam kết cung cấp đúng thông tin liên hệ để Supporter trao đổi khi cần làm rõ hồ sơ.` | Tích chọn/bỏ chọn cam kết liên hệ | default |
| `intake.boundary.err_all_required` | `form.Field[boundary_confirmations]` | Error | `Bạn phải tích chọn tất cả cam kết để có thể gửi hồ sơ.` | — | error state (khi chưa tích đủ cả 3) |

---

### 11. Step 6: Review & Submit (Xác nhận thông tin hồ sơ)
*Nguồn: `apps/web-1/app/dashboard/intake/_components/Steps/ReviewSubmitStep.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.review.title` | `h2` | Heading | `Xác nhận thông tin hồ sơ` | — | default |
| `intake.review.desc_ai` | `p` (Gói AI-only) | Description | `Đây là hồ sơ bàn giao để Nexus Engine bắt đầu thẩm định. Kiểm tra lại trước khi xác nhận.` | — | visible khi `isAiOnly === true` |
| `intake.review.desc_supporter` | `p` (Gói Supporter) | Description | `Đây là gói bàn giao để Supporter bắt đầu xử lý. Kiểm tra lại trước khi xác nhận.` | — | visible khi `isAiOnly === false` |
| `intake.review.error_banner` | `div.bg-danger-soft` | Error | `Lỗi: {error}` | — | visible khi mutation báo lỗi |
| `intake.review.sec1_title` | `h3` (Mục 1) | Heading | `1. Điểm kẹt hiện tại` | — | default |
| `intake.review.sec1_label` | `div.font-semibold` | Label | `Nhóm đang cần gỡ gì lúc này:` | — | default |
| `intake.review.sec1_value` | `div` | Item | `{getDisplayBlocker(values)}` (hoặc `Chưa cung cấp`) | — | default |
| `intake.review.sec2_title_ai` | `h3` (Mục 2 - AI) | Heading | `2. Hình thức & Kỳ vọng thẩm định` | — | visible khi `isAiOnly === true` |
| `intake.review.sec2_title_supporter` | `h3` (Mục 2 - Supporter) | Heading | `2. Nhu cầu hỗ trợ` | — | visible khi `isAiOnly === false` |
| `intake.review.sec2_ai_box_title` | `div.font-semibold` | Heading | `Đánh giá tự động qua Nexus Engine` | — | visible khi `isAiOnly === true` |
| `intake.review.sec2_ai_box_desc` | `p` | Description | `Hồ sơ được phân tích tự động về khách hàng mục tiêu, vấn đề cốt lõi, giải pháp và tính khả thi của mô hình. Kết quả thẩm định chi tiết sẵn sàng trong khoảng 10 phút sau khi gửi.` | — | visible khi `isAiOnly === true` |
| `intake.review.sec2_primary_need_label` | `div.font-semibold` | Label | `Nhu cầu hỗ trợ chính:` | — | visible khi `isAiOnly === false` |
| `intake.review.sec2_primary_need_val` | `div` | Item | `{getPrimaryNeedLabel(values.support_needs?.primary_need)}` (hoặc `Chưa xác định`) | — | visible khi `isAiOnly === false` |
| `intake.review.sec2_outputs_label` | `div.font-semibold` | Label | `Kết quả mong đợi:` | — | visible khi có `expected_outputs` |
| `intake.review.sec2_outputs_val` | `div` | Item | `{values.expected_outputs}` | — | visible khi có `expected_outputs` |
| `intake.review.sec2_notes_label` | `div.font-semibold` | Label | `Ghi chú thêm cho Supporter:` | — | visible khi `!isAiOnly && values.support_needs?.extra_notes` |
| `intake.review.sec2_notes_val` | `div` | Item | `{values.support_needs.extra_notes}` | — | visible khi có `extra_notes` |
| `intake.review.sec2_feedback_label` | `div.font-semibold` | Label | `Phản hồi của giảng viên hướng dẫn:` | — | visible khi có `lecturer_feedback` |
| `intake.review.sec2_feedback_val` | `div` | Item | `{values.lecturer_feedback}` | — | visible khi có `lecturer_feedback` |
| `intake.review.sec3_title` | `h3` (Mục 3) | Heading | `3. Tài liệu đính kèm` | — | default |
| `intake.review.sec3_doc_type_label` | `div.font-semibold` | Label | `{docCategoryLabel(doc.document_type \|\| "") \|\| "Tài liệu"}:` | — | default khi có tài liệu |
| `intake.review.sec3_doc_link` | `a[target="_blank"]` | Navigation | `{doc.original_name \|\| doc.file_url}` | Mở file tài liệu trên tab mới | default khi có tài liệu |
| `intake.review.sec3_doc_empty_label` | `div.font-semibold` | Label | `Tài liệu đính kèm:` | — | visible khi không có tài liệu |
| `intake.review.sec3_doc_empty_val` | `div.italic` | Empty state | `Không có tài liệu đính kèm` | — | visible khi không có tài liệu |
| `intake.review.sec4_title` | `h3` (Mục 4) | Heading | `4. Gói dịch vụ & Thời gian xử lý` | — | default |
| `intake.review.sec4_pkg_label` | `div.font-semibold` | Label | `Gói phản biện đã chọn:` | — | default |
| `intake.review.sec4_pkg_val` | `div` | Item | `{selectedPackage ? ... : (isAiOnly ? "Đánh giá ý tưởng tự động bằng AI (Nexus Engine)" : "Gói phản biện tiêu chuẩn")}` | — | default |
| `intake.review.sec4_sla_label` | `div.font-semibold` | Label | `Mức độ ưu tiên xử lý:` | — | default |
| `intake.review.sec4_sla_val` | `div` | Item | `{isAiOnly ? "Tự động phản hồi (trong khoảng 10 phút)" : (values.urgency === "urgent" ? "Gấp (trong 24h)" : "Bình thường")}` | — | default |
| `intake.review.sec5_title` | `h3` (Mục 5) | Heading | `5. Liên hệ` | — | default |
| `intake.review.sec5_fullname_label` | `div.font-semibold` | Label | `Họ tên & vai trò:` | — | default |
| `intake.review.sec5_fullname_val` | `div` | Item | `{values.contact?.full_name \|\| "N/A"}{values.contact?.team_role ? " (" + values.contact.team_role + ")" : ""}` | — | default |
| `intake.review.sec5_studentcode_label` | `div.font-semibold` | Label | `Mã sinh viên:` | — | default |
| `intake.review.sec5_studentcode_val` | `div` | Item | `{values.contact?.student_code \|\| "N/A"}` | — | default |
| `intake.review.sec5_zalo_label` | `div.font-semibold` | Label | `Số điện thoại Zalo:` | — | default |
| `intake.review.sec5_zalo_val` | `div` | Item | `{values.contact?.zalo \|\| "N/A"}` | — | default |
| `intake.review.sec5_email_label` | `div.font-semibold` | Label | `Email liên hệ:` | — | default |
| `intake.review.sec5_email_val` | `div` | Item | `{values.contact?.email \|\| "N/A"}` | — | default |
| `intake.review.sec6_title` | `h3` (Mục 6) | Heading | `6. Metadata nhóm / môn học` | — | default |
| `intake.review.sec6_project_label` | `div.font-semibold` | Label | `Tên đề tài:` | — | default |
| `intake.review.sec6_project_val` | `div` | Item | `{values.team_context?.project_name \|\| "N/A"}` | — | default |
| `intake.review.sec6_school_label` | `div.font-semibold` | Label | `Trường học:` | — | default |
| `intake.review.sec6_school_val` | `div` | Item | `{values.school \|\| "N/A"}` | — | default |
| `intake.review.sec6_course_label` | `div.font-semibold` | Label | `Môn học & nhóm lớp:` | — | default |
| `intake.review.sec6_course_val` | `div` | Item | `{values.course_context \|\| "N/A"}{values.team_context?.group_no ? " - Nhóm " + values.team_context.group_no : ""}` | — | default |
| `intake.review.sec6_summary_label` | `div.font-semibold` | Label | `Hiện trạng hoạt động của nhóm:` | — | visible khi có `team_status_summary` |
| `intake.review.sec6_summary_val` | `div` | Item | `{values.team_context.team_status_summary}` | — | visible khi có `team_status_summary` |

---

### 12. Bottom Navigation Buttons & Submit Confirmation Modal
*Nguồn: `apps/web-1/app/dashboard/intake/_components/IntakeChatFlow.tsx`, `hooks/useIntakeForm.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.nav.back_btn` | `Button[variant="default"]` | Navigation | `Quay lại` | Lùi về bước trước đó trong `activeSteps` | disabled khi `currentIdx <= 0 \|\| isSubmitting` |
| `intake.nav.continue_btn` | `Button[color="brand"]` | CTA | `Tiếp tục` | Lưu nháp và tiến tới bước tiếp theo trong `activeSteps` | visible khi `currentStep !== REVIEW`, disabled khi `!isStepValid()` |
| `intake.nav.submit_btn` | `Button[color="brand"]` | CTA | `Nộp hồ sơ` | Mở Modal xác nhận nộp hồ sơ (`isConfirmModalOpen = true`) | visible khi `currentStep === REVIEW`, disabled khi `isSubmitting` |
| `intake.modal.submit_title` | `Modal` > `title` | Heading | `Xác nhận nộp hồ sơ` | — | visible khi `isConfirmModalOpen === true` |
| `intake.modal.submit_message` | `Modal` > `p` | Description | `Bạn có chắc chắn muốn nộp hồ sơ này? Sau khi nộp, hệ thống sẽ tiếp nhận thông tin và tiến hành quy trình thẩm định.` | — | visible khi `isConfirmModalOpen === true` |
| `intake.modal.submit_check_btn` | `Modal` > `Button` (Kiểm tra lại) | CTA | `Kiểm tra lại` | Đóng modal để người dùng xem lại thông tin | default |
| `intake.modal.submit_confirm_btn` | `Modal` > `Button` (Xác nhận) | CTA | `Xác nhận` | Gọi `form.handleSubmit()` gửi mutation nộp hồ sơ lên server | loading khi `isSubmitting === true` |

---

### 13. Demo Data FAB (Floating Action Button)
*Nguồn: `apps/web-1/components/ui/DemoDataFAB.tsx`, `apps/web-1/app/dashboard/intake/_data/demo-presets.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `intake.fab.trigger_title` | `UnstyledButton[title]` | Aria-label | `Demo: Điền dữ liệu mẫu` | Mở popover danh sách dữ liệu mẫu | default |
| `intake.fab.popover_title` | `Popover.Dropdown` > `Text` | Heading | `Dữ liệu demo` | — | default |
| `intake.fab.preset_nexus_label` | `UnstyledButton` (Preset 1) | Item | `Nexus - Nhóm 13 EXE101` | Điền tự động dữ liệu mẫu Nexus | default |
| `intake.fab.preset_nexus_desc` | `UnstyledButton` (Preset 1) | Description | `Dịch vụ audit idea khởi nghiệp cho sinh viên FPT` | — | default |
| `intake.fab.preset_farm2dorm_label` | `UnstyledButton` (Preset 2) | Item | `Farm2Dorm - Nhóm 07` | Điền tự động dữ liệu mẫu Farm2Dorm | default |
| `intake.fab.preset_farm2dorm_desc` | `UnstyledButton` (Preset 2) | Description | `Nông sản Đà Lạt gom đơn theo ký túc xá` | — | default |
| `intake.fab.preset_rewear_label` | `UnstyledButton` (Preset 3) | Item | `ReWear - Nhóm 21` | Điền tự động dữ liệu mẫu ReWear | default |
| `intake.fab.preset_rewear_desc` | `UnstyledButton` (Preset 3) | Description | `Tủ đồ secondhand ký gửi cho sinh viên` | — | default |
| `intake.fab.preset_pawpal_label` | `UnstyledButton` (Preset 4) | Item | `PawPal - Nhóm 04` | Điền tự động dữ liệu mẫu PawPal | default |
| `intake.fab.preset_pawpal_desc` | `UnstyledButton` (Preset 4) | Description | `Trông thú cưng theo giờ ngày lễ` | — | default |
| `intake.fab.preset_smashbook_label` | `UnstyledButton` (Preset 5) | Item | `SmashBook - Nhóm 11` | Điền tự động dữ liệu mẫu SmashBook | default |
| `intake.fab.preset_smashbook_desc` | `UnstyledButton` (Preset 5) | Description | `Đặt sân cầu lông kèm ghép đội lẻ` | — | default |
| `intake.fab.preset_leantea_label` | `UnstyledButton` (Preset 6) | Item | `LeanTea - Nhóm 16` | Điền tự động dữ liệu mẫu LeanTea | default |
| `intake.fab.preset_leantea_desc` | `UnstyledButton` (Preset 6) | Description | `Trà sữa healthy cho sinh viên gym` | — | default |
| `intake.fab.preset_mentormap_label` | `UnstyledButton` (Preset 7) | Item | `MentorMap - Nhóm 09` | Điền tự động dữ liệu mẫu MentorMap | default |
| `intake.fab.preset_mentormap_desc` | `UnstyledButton` (Preset 7) | Description | `Kết nối tân sinh viên với mentor khóa trên` | — | default |
| `intake.fab.preset_sharenest_label` | `UnstyledButton` (Preset 8) | Item | `ShareNest - Nhóm 25` | Điền tự động dữ liệu mẫu ShareNest | default |
| `intake.fab.preset_sharenest_desc` | `UnstyledButton` (Preset 8) | Description | `Ghép phòng trọ theo tính cách` | — | default |
| `intake.fab.preset_chargecampus_label` | `UnstyledButton` (Preset 9) | Item | `ChargeCampus - Nhóm 02` | Điền tự động dữ liệu mẫu ChargeCampus | default |
| `intake.fab.preset_chargecampus_desc` | `UnstyledButton` (Preset 9) | Description | `Trạm sạc xe điện trong campus` | — | default |
| `intake.fab.preset_mindnote_label` | `UnstyledButton` (Preset 10) | Item | `MindNote - Nhóm 18` | Điền tự động dữ liệu mẫu MindNote | default |
| `intake.fab.preset_mindnote_desc` | `UnstyledButton` (Preset 10) | Description | `Nhật ký tâm trạng kèm AI an ủi` | — | default |
| `intake.fab.preset_craftuni_label` | `UnstyledButton` (Preset 11) | Item | `CraftUni - Nhóm 29` | Điền tự động dữ liệu mẫu CraftUni | default |
| `intake.fab.preset_craftuni_desc` | `UnstyledButton` (Preset 11) | Description | `Chợ đồ handmade sinh viên` | — | default |
| `intake.fab.clear_btn` | `UnstyledButton` (Xóa dữ liệu) | CTA | `Xóa dữ liệu` | Xóa dữ liệu nháp trong form và reset về Bước 0 | default |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- **Hồ sơ vs Đề tài vs Ý tưởng vs Proposal:**
  - Tiêu đề trang gọi là *"Tạo hồ sơ mới"* hoặc *"Cập nhật hồ sơ"* (nguồn: `page.tsx:308`).
  - Phụ đề trang ghi *"Cấu trúc ý tưởng và thông tin minh chứng để bắt đầu chạy phản biện"* (nguồn: `page.tsx:313`).
  - Bước 2 định danh trường `team_context.project_name` là *"Tên đề tài"* (nguồn: `ProjectContextStep.tsx:161`), trong khi ở màn hình Team-Fit gọi là *"Tên dự án"* (nguồn: `IdeaMadLibsStep.tsx`).
  - Alert ở Bước 4 dùng từ tiếng Anh *"proposal"* (*"Nếu nhóm chưa có proposal đủ rõ, hãy dùng template có sẵn..."* - nguồn: `DocumentInputStep.tsx:185`).
  - Placeholder ở Bước 2 lại dùng từ *"đề cương"* (*"đang viết đề cương phân tích thị trường..."* - nguồn: `ProjectContextStep.tsx:196`).
- **Supporter vs Mentor vs Giảng viên:**
  - Alert thông báo SLA ở đầu trang dùng từ *"Mentor"*: *"⏱ Thời gian phản biện: 24h–48h có Mentor chuyên môn đồng hành và phản hồi"* (nguồn: `page.tsx:324`).
  - Cảnh báo gói 149k dùng từ *"Premium Mentor Audit"* (nguồn: `page.tsx:237`).
  - Trợ lý chat và toàn bộ nhãn form, tooltip ở các bước 0, 1, 3, 4, 5 đều dùng từ *"Supporter"* (*"Supporter có đủ bối cảnh cần thiết"*, *"để Supporter tập trung giải quyết"*, *"Ghi chú thêm cho Supporter"*, *"Supporter sẽ đọc trực tiếp từ đây"*, *"để Supporter trao đổi khi cần..."* - nguồn: `IntakeChatFlow.tsx:196`, `SituationStep.tsx:20`, `ContactStep.tsx:28`, `SupportNeedsStep.tsx:115`, `DocumentInputStep.tsx:165`, `BoundaryStep.tsx:15`).
  - Khái niệm *"Giảng viên"* xuất hiện trong bối cảnh giảng viên hướng dẫn tại trường đại học (*"giảng viên chê gì"*, *"Phản hồi của giảng viên hướng dẫn"*, *"không thay thế điểm số của giảng viên"* - nguồn: `SituationStep.tsx:36`, `ReviewSubmitStep.tsx:135`, `BoundaryStep.tsx:14`).
- **Nexus Engine vs Hệ thống AI:**
  - Lời thoại trợ lý chat ghi *"hệ thống AI thẩm định toàn diện dự án của bạn"* (nguồn: `IntakeChatFlow.tsx:195`).
  - Bước Xác nhận gọi tên công nghệ là *"Nexus Engine"* (*"hồ sơ bàn giao để Nexus Engine bắt đầu thẩm định"*, *"Đánh giá tự động qua Nexus Engine"* - nguồn: `ReviewSubmitStep.tsx:74,102`).
  - Tại bảng tóm tắt gói dịch vụ, mục này ghi *"Đánh giá ý tưởng tự động bằng AI (Nexus Engine)"* (nguồn: `ReviewSubmitStep.tsx:180`).
- **Thẩm định vs Phản biện:**
  - Từ *"Phản biện"* được dùng xuyên suốt cho sản phẩm (*"Trợ lý tạo Hồ sơ Phản biện"*, *"Thời gian phản biện: 24h–48h"*, *"Gói phản biện đã chọn"*, *"Kết quả mong đợi sau phản biện"*).
  - Từ *"Thẩm định"* xuất hiện riêng trong luồng AI tự động và modal xác nhận nộp (*"tiến hành quy trình thẩm định"*, *"Nexus Engine bắt đầu thẩm định"*, *"Kết quả thẩm định chi tiết sẵn sàng trong khoảng 10 phút..."* - nguồn: `IntakeChatFlow.tsx:273`, `ReviewSubmitStep.tsx:74,105`).

### Hiện trạng kỹ thuật quan sát được
- **Cơ chế phân luồng gói AI-Only:**
  - Hook `useIntakeForm` và component `page.tsx` kiểm tra biến `isAiOnlyPackage` dựa trên `packageId === "pkg_ai_audit"` hoặc snapshot dữ liệu cũ.
  - Khi `isAiOnlyPackage === true`:
    - Danh sách bước `stepsList` bị cắt bỏ bước `IntakeStep.SUPPORT_NEEDS` (từ 7 bước giảm còn 6 bước).
    - `useEffect` trong `page.tsx` có guard tự động: nếu người dùng đang ở bước `SUPPORT_NEEDS` mà chuyển sang gói AI, trang sẽ tự động nhảy sang bước `DOCUMENTS` (line 126-130).
    - Payload gửi lên API tự động loại bỏ object `support_needs` (nguồn: `useIntakeForm.ts:142-145`).
- **Hành vi lưu nháp (Draft Persistence):**
  - Dữ liệu được lưu vào LocalStorage key `nexus_intake_draft` mỗi khi người dùng chuyển bước (`saveDraft(values)`).
  - Tuy nhiên, trong `useIntakeForm.ts:126`, khi khôi phục draft từ LocalStorage, trường `current_blocker` bị cố tình reset về chuỗi rỗng: `current_blocker: ""`. Điều này khiến sinh viên luôn phải gõ lại ít nhất 10 ký tự ở Bước 0 mỗi lần mở lại tab hoặc tải lại trang trước khi có thể bấm Tiếp tục sang Bước 1.
- **Ràng buộc trường học & mã môn tại Bước 2:**
  - Nếu người dùng chọn `Trường học = "Khác"`, mã môn học tự động gán thành `"Khác"` và số thứ tự nhóm tự động gán thành `"Khác"` mà không cần nhập (nguồn: `ProjectContextStep.tsx:52-54`).
  - Trường `Số thứ tự nhóm (Group No)` chỉ render khi và chỉ khi `school === "Đại học FPT"` và `course_context === "EXE101"` (nguồn: `ProjectContextStep.tsx:113`).
- **Tải file lên máy chủ:**
  - Input file được ẩn đi (`className="hidden"`), kích hoạt thông qua `fileInputRef.current?.click()`.
  - Validate kích thước file diễn ra ngay tại client: nếu `file.size > 15 * 1024 * 1024`, hiển thị ngay Alert lỗi mà không gửi request lên máy chủ.
  - Server trả về URL Cloudinary, sau đó component cập nhật vào mảng `documents` của form với `document_type: ""` rỗng, buộc người dùng phải chọn dropdown phân loại tài liệu mới thỏa mãn điều kiện hợp lệ của Bước 4 (nguồn: `DocumentInputStep.tsx:110-120,221-224`).
- **Hai lớp xác nhận khi nộp hồ sơ:**
  - Tại Bước 6, người dùng bấm nút *"Nộp hồ sơ"* ở thanh điều hướng dưới. Nút này không submit ngay mà mở `Modal` Mantine mang tiêu đề *"Xác nhận nộp hồ sơ"*. Người dùng bắt buộc phải bấm nút *"Xác nhận"* bên trong modal thì mới kích hoạt `form.handleSubmit()` (nguồn: `IntakeChatFlow.tsx:236-243,286-296`).

### Điểm chưa xác minh (Unknowns / Questions)
- **Hành vi reset điểm kẹt khi load draft:** Việc `current_blocker` bị xóa rỗng khi nạp lại bản nháp (`useIntakeForm.ts:126`) là quyết định thiết kế có chủ đích (để buộc sinh viên luôn cập nhật điểm kẹt mới nhất ở phiên làm việc mới) hay là lỗi sơ suất khi viết code?
- **Thời gian phản hồi của gói Basic AI:** Khối thông tin tại bước Review ghi cam kết *"Kết quả thẩm định chi tiết sẵn sàng trong khoảng 10 phút sau khi gửi"* (nguồn: `ReviewSubmitStep.tsx:105`), trong khi trên Landing Page (`LandingPricing.tsx:67`) lại quảng bá cam kết *"< 1 phút"*. Cần PO và đội AI Engine xác nhận con số thời gian chính thức để thống nhất nội dung hiển thị.
- **Sự thống nhất giữa Supporter và Mentor:** Trang web hiển thị đan xen cả hai danh xưng: banner trên đầu ghi *"Mentor chuyên môn đồng hành"*, nhưng trợ lý ảo và các form bên dưới lại ghi *"Supporter"*. Cần xác nhận rõ định vị đối tượng phản biện trực tiếp với sinh viên là "Supporter" hay "Mentor".
- **File template đính kèm:** Hai nút copy và tải template trỏ trực tiếp tới URL tĩnh `/idea-template/TEMPLATE_STARTUP_CHECKPOINT1_V2.md` và `/idea-template/TEMPLATE_STARTUP_CHECKPOINT1_V2.docx`. Cần kiểm tra xem các file tĩnh này đã có mặt đầy đủ trong thư mục `apps/web-1/public/idea-template/` trên môi trường production hay chưa.
