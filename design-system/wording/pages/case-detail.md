# Page: Case Detail (Chi tiết hồ sơ & Không gian làm việc phản biện)

## Layer 1: Page Context

- **Route:** `/dashboard/case/[id]`
- **Access:** `Authenticated` (Sinh viên / Chủ sở hữu hồ sơ - Student / Case Owner; Thành viên nhóm - Case Member).
  - Yêu cầu đăng nhập và có quyền truy cập hồ sơ thông qua `useCaseDetails(id)`.
  - Nếu tải dữ liệu trả về 404 (hồ sơ đã bị xóa hoặc không tồn tại), hệ thống hiển thị thông báo toast lỗi và điều hướng máy chủ về `/dashboard` (`apps/web-1/app/dashboard/case/[id]/hooks/useCaseDetails.ts:42–53`).
  - Phân quyền theo role trong component: chỉ chủ sở hữu hồ sơ (`isOwner`) mới có quyền thực hiện một số transition nhất định (`T16_EDIT_INTAKE`, `T9_SUBMIT_REVISION`, `T17_USER_CONFIRM_COMPLETE`...).
- **User:**
  - **Primary user:** Sinh viên / Trưởng nhóm / Thành viên nhóm đề tài khởi nghiệp (Student / Case Member) truy cập không gian làm việc để theo dõi tiến độ phản biện đề án, tải lên tài liệu đề cương/slide, xem báo cáo phản biện từ AI hoặc Supporter, chat thảo luận và quản lý credit đánh giá.
  - **Typical state:** Đang chuẩn bị bài nộp các mốc Checkpoint (CP1, CP2...), chờ hệ thống Nexus AI thẩm định hoặc chờ Supporter chấm điểm; có thể đang ở trạng thái cần bổ sung thông tin (`need_more_information`), hồ sơ bị từ chối (`rejected`), hoặc đã có báo cáo phản biện cần nộp bản sửa đổi (`report_ready`, `waiting_for_revision`).
  - **Knowledge level:** `[Assumption / Cần xác minh]` Sinh viên đại học (chủ yếu FPT University hoặc các trường đào tạo khởi nghiệp), đã hoàn thành khảo sát Team-Fit hoặc điền form Intake, quen thuộc với các khái niệm đề cương, slide pitch deck, ma trận vấn đề - giải pháp và hệ thống tính credit.
- **User goals:**
  - Nắm bắt trạng thái hiện tại của hồ sơ đề tài và hành động tiếp theo cần thực hiện qua thẻ chỉ dẫn (`StatusGuidanceCard`).
  - Xem và tải xuống báo cáo phản biện chi tiết (tệp PDF hoặc xem trực tiếp qua trình xem PDF tích hợp).
  - Tải lên tài liệu đề án (PDF, DOCX, XLSX, PPTX, MD, TXT) cho các đợt nộp lần đầu hoặc bản sửa đổi sau phản biện.
  - Tải lên tài liệu phản hồi/đánh giá bên ngoài từ giảng viên hoặc mentor trường học để làm căn cứ đối soát.
  - Theo dõi tiến trình phân tích tự động bằng AI theo thời gian thực (Active Radar Scanning) với thanh tiến độ 4 giai đoạn và nhật ký sự kiện.
  - Nhắn tin, trao đổi trực tiếp với Supporter được phân công phụ trách đề tài qua tab Thảo luận.
  - Quản lý số dư credit của hồ sơ, xem lịch sử các lượt nạp, trừ, hoàn credit và thanh toán thêm credit khi cần.
  - Cập nhật thông tin cơ bản của hồ sơ (tên nhóm, trường, môn học, mã nhóm) hoặc xóa hồ sơ khi chưa được duyệt.
- **Business / Product goals:**
  - Đóng vai trò là trung tâm làm việc chính (Workspace Hub) giữa Sinh viên, Nexus AI Engine và Supporter chuyên môn.
  - Tự động hóa và trực quan hóa quy trình phản biện qua 4 giai đoạn rõ ràng: Tiếp nhận đề án -> Mô hình Triad -> Phản biện sâu -> Báo cáo phản biện.
  - Giữ chân sinh viên qua tính năng tương tác đa chiều (xem báo cáo, nộp bản sửa, chat hỗ trợ, cập nhật tài liệu).
  - Tối ưu hóa mô hình kinh doanh dịch vụ phản biện (Credit & Package monetization): nhắc nhở nạp credit khi hết hạn, hiển thị gói Basic AI Audit (79,000 VND) và định hướng nâng cấp gói.
- **Primary action:**
  - Hành động chính phụ thuộc theo trạng thái vòng đời của hồ sơ (`user_facing_stage`):
    - Khi `intake_pending`: Bấm "Nộp hồ sơ ngay" (nếu đã có credit) hoặc "Chọn gói đánh giá" / "Thanh toán dịch vụ" (nếu chưa có credit).
    - Khi `intake_ready`: Bấm "Nộp hồ sơ" để hoàn tất thông tin bài nộp tại `/dashboard/intake?caseId=${id}`.
    - Khi `submitted` & gói AI: Theo dõi tiến trình hoặc bấm "Gửi đánh giá" / "Chạy lại Thẩm định AI" nếu tiến trình trước đó gián đoạn.
    - Khi `need_more_information`: Bấm "Nộp tài liệu bổ sung" để mở modal tải tài liệu bản sửa.
    - Khi `report_ready`: Bấm "Xác nhận hoàn thành" (kết thúc quy trình) hoặc chọn loại đánh giá mới và bấm "Gửi đánh giá" / "Tải lên & Gửi đánh giá" / "Soi logic ngay".
    - Khi `rejected`: Bấm "Chỉnh sửa hồ sơ để nộp lại" (gọi transition nộp lại).
- **Secondary actions:**
  - Chuyển đổi các tab làm việc trên thanh Sidebar: "Tổng quan", "Tài liệu", "Báo cáo phản biện", "Chat với Supporter", "Lịch sử hoạt động", "Quản lý số dư credit", "Cài đặt".
  - Tải xuống tài liệu đã nộp hoặc báo cáo phản biện dạng PDF.
  - Mở file báo cáo trong tab mới (`target="_blank"`).
  - Mở liên kết thư mục Google Drive của hồ sơ.
  - Bấm "Mua credit" / "Mua thêm credit" để mở modal chọn số lượng credit và thanh toán.
  - Sao chép mã Job ID trong khối AI Radar Scanning.
  - Lọc tài liệu theo vai trò người tải (Tất cả, Sinh viên, Supporter) hoặc theo Checkpoint.
  - Lọc lịch sử giao dịch credit theo loại (Tất cả, Nạp credit, Trừ credit, Hoàn credit, Đơn mua) và mốc thời gian.
  - Cập nhật thông tin cài đặt hồ sơ hoặc xác nhận xóa hồ sơ bằng cách gõ `DELETE`.
- **Entry:**
  - Danh sách hồ sơ tại trang Dashboard chính (`/dashboard`).
  - Chuyển hướng sau khi hoàn tất tạo hồ sơ tại form Intake (`/dashboard/intake`).
  - Chuyển hướng từ route thanh toán cũ `/dashboard/case/[id]/payment` (`redirect('/dashboard/case/${id}')`).
  - Chuyển hướng từ trang thanh toán VietQR sau khi nạp tiền thành công (`/dashboard/payment?pid=...` với nút "Quay lại hồ sơ").
  - Liên kết trực tiếp qua email thông báo hoặc bookmark trình duyệt (`/dashboard/case/[id]`, kèm query params như `?tab=report`, `?tab=documents`, `?checkout=true`).
- **Exit / next step:**
  - Chuyển sang form chỉnh sửa hồ sơ: `/dashboard/intake?caseId=${id}`.
  - Chuyển sang trang thanh toán nạp tiền thiếu: `/dashboard/payment?pid=${depositId}` (thông qua hook `useShortageDepositRedirect`).
  - Quay lại màn hình chính Dashboard: `/dashboard` (thanh breadcrumb, logo, hoặc sau khi xóa hồ sơ).
  - Chuyển sang trang hồ sơ cá nhân hoặc cài đặt: `/dashboard/settings/*`.
- **Product facts / constraints:**
  - *Quản lý URL Tab State:* Tab được quản lý đồng bộ với tham số URL `?tab=${tab}` thông qua `router.replace(..., { scroll: false })`. Danh sách tab hợp lệ gồm: `["overview", "documents", "report", "discussion", "timeline", "settings", "credits"]` (`apps/web-1/app/dashboard/case/[id]/page.tsx:63–72`).
  - *Điều kiện hiển thị Tab theo gói và vòng đời (`isTabAvailable`):*
    - Gói AI Audit (`pkg_ai_audit`): Tab "Chat với Supporter" (`discussion`) bị vô hiệu hóa / ẩn hoàn toàn (`page.tsx:132, 266`).
    - Giai đoạn `intake_pending`: Chỉ mở các tab `overview`, `timeline`, `settings`, `credits`. Tab `documents`, `report`, `discussion` bị ẩn hoặc khóa.
    - Giai đoạn `intake_ready`: Mở thêm tab `documents`.
    - Tab `report` chỉ hiển thị trên sidebar khi hồ sơ đạt trạng thái `report_ready`, `completed`, `waiting_for_revision`, hoặc `revision_submitted` (`WorkspaceSidebar.tsx:50–58`).
  - *Tự động mở Modal Thanh toán:* Khi URL có tham số `?checkout=true` và hồ sơ ở trạng thái `payment_status === "unpaid"`, hệ thống tự động kích hoạt mở `CreditQuantityModal` một lần duy nhất qua `checkoutHandledRef` (`page.tsx:87–92`).
  - *Active Radar Scanning (Thẩm định AI tự động):* Chỉ hiển thị trong Tab Tổng quan khi hồ sơ ở trạng thái `under_review` và thuộc gói `pkg_ai_audit` (`page.tsx:199–204`). Trạng thái AI được cập nhật theo thời gian thực qua Server-Sent Events tại endpoint `/api/cases/${caseId}/ai-events` (`ActiveRadarScanning.tsx:51–63`).
  - *Giới hạn tải tệp:* Tối đa 5 tệp (`MAX_FILES = 5`), kích thước mỗi tệp tối đa 15MB (`MAX_FILE_SIZE_MB = 15`), định dạng hỗ trợ gồm PDF, DOCX, XLSX, PPTX, MD, TXT (`StatusGuidanceCard.tsx:35–45`, `StudentDocumentUploadModal.tsx:16–26`, `ExternalFeedbackUploadModal.tsx:21–31`).
  - *Điều kiện chặn Chat (`TabDiscussionChat.tsx:97–104`):*
    - `isChatClosed`: kích hoạt khi mã lỗi trả về là `CHAT_FREE_TIER`, `CHAT_REJECTED`, hoặc `CHAT_CLOSED`.
    - `isChatLocked`: kích hoạt khi mã lỗi trả về là `CHAT_LOCKED` (hết credit và đã qua thời gian ân hạn 24h).
  - *Xóa hồ sơ (`TabCaseSettings.tsx:196–218`):* Chỉ người dùng có hồ sơ ở trạng thái `submitted` mới thấy khu vực "Vùng nguy hiểm" để xóa hồ sơ; bắt buộc phải nhập chính xác chuỗi `DELETE` mới mở khóa nút "Tôi hiểu và muốn xóa".

---

## Layer 2: Interactive Inventory

### 2.1 Trạng thái Tải dữ liệu & Lỗi trang (Page Loading & Error State)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/page.tsx:93–110`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.loading.skeleton` | `CaseWorkspacePage` > `LoadingSkeleton` (`page.tsx:96–97`) | Loading | *(Hiển thị khung xương skeleton)* | — | Khi `isLoading === true` |
| `caseDetail.error.alert` | `CaseWorkspacePage` > `div` banner lỗi (`page.tsx:105–107`) | Error | Không thể tải dữ liệu không gian làm việc của hồ sơ. Vui lòng thử lại sau. | — | Khi `error` hoặc `!caseData` |

---

### 2.2 Tiêu đề & Thông tin cơ bản hồ sơ (CaseStatusHeader)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/CaseStatusHeader.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.header.label` | `CaseStatusHeader` > `span` (`CaseStatusHeader.tsx:139–141`) | Label | Hồ sơ phản biện | — | default |
| `caseDetail.header.caseCode.tooltip` | `CaseStatusHeader` > `Tooltip` (`CaseStatusHeader.tsx:143`) | Helper | Xem tổng quan hồ sơ & ý tưởng khởi nghiệp | — | Hiển thị khi hover mã hồ sơ |
| `caseDetail.header.caseCode.title` | `CaseStatusHeader` > `h2` (`CaseStatusHeader.tsx:144–149`) | Heading | `{caseData.case_code}` | Gọi `onSelectTab("overview")` | Con trỏ pointer, hover đổi màu brand |
| `caseDetail.header.statusBadge` | `CaseStatusHeader` > `span` badge (`CaseStatusHeader.tsx:151–170`) | Badge | `{statusTheme.label}` | — | Màu sắc và nhãn phụ thuộc `statusThemeMap` |
| `caseDetail.header.teamName.label` | `CaseStatusHeader` > hàng thông tin > span (`CaseStatusHeader.tsx:177`) | Item | Nhóm: | — | Hiển thị khi có `team_name` |
| `caseDetail.header.teamName.value` | `CaseStatusHeader` > hàng thông tin > strong (`CaseStatusHeader.tsx:177`) | Item | `{caseData.team_name}` | — | Hiển thị khi có `team_name` |
| `caseDetail.header.school.label` | `CaseStatusHeader` > hàng thông tin > span (`CaseStatusHeader.tsx:183`) | Item | Trường: | — | Hiển thị khi có `school` |
| `caseDetail.header.school.value` | `CaseStatusHeader` > hàng thông tin > strong (`CaseStatusHeader.tsx:183`) | Item | `{caseData.school}` | — | Hiển thị khi có `school` |
| `caseDetail.header.course.label` | `CaseStatusHeader` > hàng thông tin > span (`CaseStatusHeader.tsx:189`) | Item | Lớp/Môn: | — | Hiển thị khi có `course_context` |
| `caseDetail.header.course.value` | `CaseStatusHeader` > hàng thông tin > strong (`CaseStatusHeader.tsx:189`) | Item | `{caseData.course_context}` | — | Hiển thị khi có `course_context` |
| `caseDetail.header.sla.paused` | `CaseStatusHeader` > timer (commented/inactive) (`CaseStatusHeader.tsx:45`) | Status | Đang chờ nhóm bổ sung thông tin | — | Logic timer nội bộ |
| `caseDetail.header.sla.preSupporter` | `CaseStatusHeader` > timer (commented/inactive) (`CaseStatusHeader.tsx:52`) | Status | Đang chờ phân công | — | Logic timer nội bộ |
| `caseDetail.header.sla.unset` | `CaseStatusHeader` > timer (commented/inactive) (`CaseStatusHeader.tsx:55`) | Status | Chưa thiết lập | — | Logic timer nội bộ |
| `caseDetail.header.sla.overdue` | `CaseStatusHeader` > timer (commented/inactive) (`CaseStatusHeader.tsx:68`) | Status | Quá hạn SLA | — | Logic timer nội bộ |
| `caseDetail.header.sla.labelCommit` | `CaseStatusHeader` > timer (commented/inactive) (`CaseStatusHeader.tsx:132`) | Label | Cam kết SLA: | — | Khi có `sla_deadline_at` |
| `caseDetail.header.sla.labelTarget` | `CaseStatusHeader` > timer (commented/inactive) (`CaseStatusHeader.tsx:132`) | Label | Hạn mong muốn: | — | Khi có `deadline` |

---

### 2.3 Điều hướng Workspace Sidebar & Tabs (WorkspaceSidebar & WorkspaceTabs)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx`, `WorkspaceTabs.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.sidebar.tab.overview` | `WorkspaceSidebar` > Tooltip & Button (`WorkspaceSidebar.tsx:38, 106`) | Navigation | Tổng quan | Chuyển sang tab `overview` (`?tab=overview`) | default |
| `caseDetail.sidebar.tab.documents` | `WorkspaceSidebar` > Tooltip & Button (`WorkspaceSidebar.tsx:45, 106`) | Navigation | Tài liệu | Chuyển sang tab `documents` (`?tab=documents`) | Hiển thị khi không phải `intake_pending` |
| `caseDetail.sidebar.tab.report` | `WorkspaceSidebar` > Tooltip & Button (`WorkspaceSidebar.tsx:54, 106`) | Navigation | Báo cáo phản biện | Chuyển sang tab `report` (`?tab=report`) | Hiển thị khi `report_ready`, `completed`, `waiting_for_revision`, `revision_submitted` |
| `caseDetail.sidebar.tab.discussion` | `WorkspaceSidebar` > Tooltip & Button (`WorkspaceSidebar.tsx:63, 106`) | Navigation | Chat với Supporter | Chuyển sang tab `discussion` (`?tab=discussion`) & gọi `markAsRead()` | Hiển thị khi đã submit và không phải gói AI |
| `caseDetail.sidebar.tab.discussion.badge` | `WorkspaceSidebar` > Button > span (`WorkspaceSidebar.tsx:118–125`) | Badge | `{unreadCount ?? messageCount}` | — | Hiển thị khi số tin chưa đọc > 0 |
| `caseDetail.sidebar.tab.timeline` | `WorkspaceSidebar` > Tooltip & Button (`WorkspaceSidebar.tsx:71, 106`) | Navigation | Lịch sử hoạt động | Chuyển sang tab `timeline` (`?tab=timeline`) | default |
| `caseDetail.sidebar.tab.credits` | `WorkspaceSidebar` > Tooltip & Button (`WorkspaceSidebar.tsx:78, 106`) | Navigation | Quản lý số dư credit | Chuyển sang tab `credits` (`?tab=credits`) | Hiển thị khi `!hideCredits` |
| `caseDetail.sidebar.tab.credits.badge` | `WorkspaceSidebar` > Button > span (`WorkspaceSidebar.tsx:118–125`) | Badge | `{creditBalance}` | — | Hiển thị khi `creditBalance > 0` |
| `caseDetail.sidebar.tab.settings` | `WorkspaceSidebar` > Tooltip & Button (`WorkspaceSidebar.tsx:88, 106`) | Navigation | Cài đặt | Chuyển sang tab `settings` (`?tab=settings`) | Hiển thị khi `!hideSettings` |
| `caseDetail.legacyTabs.idea` | `WorkspaceTabs` > button > span (`WorkspaceTabs.tsx:17`) | Navigation | Ý tưởng nộp | Chuyển sang tab `idea` | Component legacy |
| `caseDetail.legacyTabs.report` | `WorkspaceTabs` > button > span (`WorkspaceTabs.tsx:22`) | Navigation | Báo cáo phản biện | Chuyển sang tab `report` | Component legacy |
| `caseDetail.legacyTabs.discussion` | `WorkspaceTabs` > button > span (`WorkspaceTabs.tsx:27`) | Navigation | Trao đổi & Phản hồi | Chuyển sang tab `discussion` | Component legacy |
| `caseDetail.legacyTabs.timeline` | `WorkspaceTabs` > button > span (`WorkspaceTabs.tsx:33`) | Navigation | Lịch sử hoạt động | Chuyển sang tab `timeline` | Component legacy |
| `caseDetail.legacyTabs.settings` | `WorkspaceTabs` > button > span (`WorkspaceTabs.tsx:40`) | Navigation | Cài đặt | Chuyển sang tab `settings` | Component legacy |

---

### 2.4 Thẻ chỉ dẫn trạng thái hồ sơ (StatusGuidanceCard & statusCopyMap)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`, `statusCopyMap.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.guidance.infoRequest.title` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:211`) | Heading | Yêu cầu bổ sung thông tin từ Supporter | — | Hiển thị khi có `openRequestsForMoreInfo` |
| `caseDetail.guidance.infoRequest.reqLabel` | `StatusGuidanceCard` > `p` label (`StatusGuidanceCard.tsx:216`) | Label | Nội dung yêu cầu: | — | Hiển thị khi có yêu cầu bổ sung |
| `caseDetail.guidance.infoRequest.fallback` | `StatusGuidanceCard` > `p` fallback (`StatusGuidanceCard.tsx:205`) | Description | Vui lòng kiểm tra lại tài liệu đã tải lên. | — | Khi không có `query` hoặc `reason` |
| `caseDetail.guidance.infoRequest.cta` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:227`) | CTA | Nộp tài liệu bổ sung | Mở `StudentDocumentUploadModal` | Hiển thị khi `canSubmitRevision` |
| `caseDetail.guidance.rejected.title` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:241`) | Heading | Hồ sơ bị từ chối xét duyệt | — | Hiển thị khi `stage === "rejected"` |
| `caseDetail.guidance.rejected.reasonLabel` | `StatusGuidanceCard` > `p` label (`StatusGuidanceCard.tsx:246`) | Label | Lý do từ chối: | — | Hiển thị khi tìm thấy `rejectionReason` |
| `caseDetail.guidance.rejected.defaultDesc` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:250`) | Description | Yêu cầu phản biện dự án của bạn không được duyệt. Vui lòng liên hệ với Đội ngũ Nexus hoặc gửi thắc mắc qua phần Thảo luận. | — | Fallback khi không có `rejectionReason` cụ thể |
| `caseDetail.guidance.rejected.cta` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:255`) | CTA | Chỉnh sửa hồ sơ để nộp lại | Điều hướng sang `/dashboard/intake?caseId=${id}` | Hiển thị khi `canResubmit === true` |
| `caseDetail.guidance.intakePending.creditTitle` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:272`) | Heading | `Đã có {creditBalance} credit — Hãy nộp hồ sơ để bắt đầu phản biện` | — | Khi `intake_pending` & có credit |
| `caseDetail.guidance.intakePending.creditDesc` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:278`) | Description | Bạn đã có sẵn credit đánh giá chuyên sâu. Vui lòng nộp hồ sơ khởi nghiệp để Supporter chuyên môn tiếp nhận và bắt đầu phản biện dự án. | — | Khi `intake_pending` & có credit |
| `caseDetail.guidance.intakePending.creditCta` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:282`) | CTA | Nộp hồ sơ ngay | Điều hướng sang `/dashboard/intake?caseId=${id}` | Hiển thị khi `canOpenIntake === true` |
| `caseDetail.guidance.intakePending.freeTitle` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:296`) | Heading | Kích hoạt quy trình phản biện chuyên sâu | — | Khi `intake_pending`, không có credit & `isFree === true` |
| `caseDetail.guidance.intakePending.unpaidTitle` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:296`) | Heading | Hồ sơ chưa hoàn tất thanh toán | — | Khi `intake_pending`, không có credit & `isFree === false` |
| `caseDetail.guidance.intakePending.freeDesc` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:303`) | Description | Hồ sơ hiện tại thuộc gói đánh giá AI miễn phí. Quy trình phản biện chuyên sâu bao gồm việc chọn gói đánh giá, điền thông tin và nộp tài liệu dự án để chuyên gia tiếp nhận, chấm điểm và trả báo cáo chi tiết. | — | Khi `isFree === true` |
| `caseDetail.guidance.intakePending.unpaidDesc` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:304`) | Description | Hồ sơ chưa được thanh toán. Bạn có thể nộp trước hồ sơ, quy trình phản biện chính thức sẽ bắt đầu ngay khi thanh toán hoàn tất. | — | Khi `isFree === false` |
| `caseDetail.guidance.intakePending.payFreeCta` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:310`) | CTA | Chọn gói đánh giá | Mở `PackageSelectionModal` | Khi `isFree === true` |
| `caseDetail.guidance.intakePending.payCta` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:310`) | CTA | Thanh toán dịch vụ | Mở `CreditQuantityModal` | Khi `isFree === false` |
| `caseDetail.guidance.intakeReady.title` | `StatusGuidanceCard` > `div` title (`StatusGuidanceCard.tsx:331`) | Heading | Nộp hồ sơ khởi nghiệp | — | Hiển thị khi `stage === "intake_ready"` |
| `caseDetail.guidance.intakeReady.desc` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:333`) | Description | Vui lòng nộp hồ sơ khởi nghiệp để Supporter có thể đánh giá chính xác. | — | default |
| `caseDetail.guidance.intakeReady.cta` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:338`) | CTA | Nộp hồ sơ | Điều hướng sang `/dashboard/intake?caseId=${id}` | Hiển thị khi `canOpenIntake === true` |
| `caseDetail.guidance.revisionSubmitted.titleAssigned` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:353`) | Heading | Bản sửa đổi đã gửi thành công — Chờ thẩm định | — | Khi `revision_submitted` & đã có supporter |
| `caseDetail.guidance.revisionSubmitted.titleUnassigned` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:353`) | Heading | Bản sửa đổi đã gửi thành công — Chờ Admin phân công | — | Khi `revision_submitted` & chưa có supporter |
| `caseDetail.guidance.revisionSubmitted.descAssigned` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:359`) | Description | Supporter đang tiến hành thẩm định bản sửa đổi mới nhất của bạn. | — | Khi đã có supporter |
| `caseDetail.guidance.revisionSubmitted.descUnassigned` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:360`) | Description | Bản sửa đổi đã được ghi nhận. Đội ngũ Nexus đang phân công Supporter chuyên môn thẩm định bản mới này. | — | Khi chưa có supporter |
| `caseDetail.guidance.needMoreInfo.title` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:372`) | Heading | Yêu cầu bổ sung thông tin từ Supporter | — | Hiển thị khi `stage === "need_more_information"` |
| `caseDetail.guidance.needMoreInfo.desc` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:378`) | Description | Vui lòng kiểm tra lại tài liệu đã tải lên và bổ sung theo yêu cầu của Supporter. | — | default |
| `caseDetail.guidance.needMoreInfo.cta` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:382`) | CTA | Nộp tài liệu bổ sung | Mở `StudentDocumentUploadModal` | Hiển thị khi `canSubmitRevision === true` |
| `caseDetail.guidance.reportReady.title` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:401`) | Heading | Báo cáo phản biện đã sẵn sàng | — | Hiển thị khi `stage === "report_ready"` |
| `caseDetail.guidance.reportReady.desc1` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:407`) | Description | Đánh giá chi tiết đã hoàn thành. Khi nhóm đã xem xong kết quả, hãy xác nhận hoàn thành hoặc gửi đánh giá mới. | — | default |
| `caseDetail.guidance.reportReady.desc2` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:412`) | Description | Muốn tiếp tục cải thiện? Hãy chọn loại đánh giá bên dưới. Mỗi lượt đánh giá mới tương ứng 1 credit. | — | Hiển thị khi có credit |
| `caseDetail.guidance.reportReady.confirmCta` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:425`) | CTA | Xác nhận hoàn thành | Gọi mutation `confirmComplete()` | Hiển thị khi `canConfirmComplete === true` |
| `caseDetail.guidance.reportReady.noCreditDesc` | `StatusGuidanceCard` > Alert đỏ > p (`StatusGuidanceCard.tsx:442`) | Description | Bạn đã hết credit. Nếu muốn tiếp tục nộp bản sửa đổi mới ở vòng sau, vui lòng mua thêm credit. | — | Hiển thị khi `!hasReportCredits` |
| `caseDetail.guidance.reportReady.buyCreditCta` | `StatusGuidanceCard` > Button đỏ (`StatusGuidanceCard.tsx:452`) | CTA | Mua credit | Mở modal mua credit | Hiển thị khi hết credit |
| `caseDetail.guidance.auditTrigger.title` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:465, 644`) | Heading | Gửi đánh giá mới | — | Hiển thị khi `canTriggerAudit === true` |
| `caseDetail.guidance.auditTrigger.typeLabel` | `StatusGuidanceCard` > `Select` label (`StatusGuidanceCard.tsx:471, 650`) | Label | Loại đánh giá | — | default |
| `caseDetail.guidance.auditTrigger.optInitial` | `StatusGuidanceCard` > Select option (`StatusGuidanceCard.tsx:30`) | Item | Lần đầu — Đánh giá tổng quát | — | Option value `initial` |
| `caseDetail.guidance.auditTrigger.optResubmit` | `StatusGuidanceCard` > Select option (`StatusGuidanceCard.tsx:31`) | Item | Đã sửa — Đối chiếu với kết quả trước | — | Option value `resubmit` |
| `caseDetail.guidance.auditTrigger.optLogicCheck` | `StatusGuidanceCard` > Select option (`StatusGuidanceCard.tsx:32`) | Item | Soi logic — Khả thi + khách hàng | — | Option value `logic_check` |
| `caseDetail.guidance.auditTrigger.fileLabel` | `StatusGuidanceCard` > Dropzone label (`StatusGuidanceCard.tsx:486, 664`) | Label | Tài liệu đã sửa | — | Khi chọn `submissionType === "resubmit"` |
| `caseDetail.guidance.auditTrigger.fileMaxHint` | `StatusGuidanceCard` > Dropzone hint (`StatusGuidanceCard.tsx:487`) | Helper | Tối đa 5 file | — | default |
| `caseDetail.guidance.auditTrigger.dropzoneIdle` | `StatusGuidanceCard` > Dropzone idle text (`StatusGuidanceCard.tsx:503, 679`) | Placeholder | Kéo thả hoặc chọn tài liệu đã sửa | — | Chữ "chọn tài liệu đã sửa" gạch chân |
| `caseDetail.guidance.auditTrigger.summaryLabel` | `StatusGuidanceCard` > `Textarea` label (`StatusGuidanceCard.tsx:529, 698`) | Label | Tóm tắt thay đổi | — | Khi chọn `submissionType === "resubmit"` |
| `caseDetail.guidance.auditTrigger.summaryPlaceholder` | `StatusGuidanceCard` > `Textarea` placeholder (`StatusGuidanceCard.tsx:530, 699`) | Placeholder | Mô tả các nội dung đã cập nhật (ít nhất 10 ký tự)... | — | default |
| `caseDetail.guidance.auditTrigger.logicCheckDesc` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:547, 716`) | Description | Hệ thống sẽ dùng tài liệu mới nhất để đánh giá khả thi và tính khách quan. | — | Khi chọn `submissionType === "logic_check"` |
| `caseDetail.guidance.auditTrigger.submitResubmit` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:561, 730`) | CTA | Tải lên & Gửi đánh giá | Tải tài liệu và gọi trigger audit | Khi `submissionType === "resubmit"` |
| `caseDetail.guidance.auditTrigger.submitLogicCheck` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:563, 732`) | CTA | Soi logic ngay | Gọi trigger audit trực tiếp | Khi `submissionType === "logic_check"` |
| `caseDetail.guidance.auditTrigger.submitInitial` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:564, 733`) | CTA | Gửi đánh giá | Gọi trigger audit trực tiếp | Khi `submissionType === "initial"` |
| `caseDetail.guidance.submittedUnpaid.title` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:580`) | Heading | Hồ sơ đã nộp — chờ thanh toán | — | Khi `stage === "submitted" && caseRequiresPayment` |
| `caseDetail.guidance.submittedUnpaid.desc` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:586`) | Description | Hồ sơ đã gửi thành công. Đội ngũ Nexus chỉ duyệt và phân công Supporter sau khi thanh toán hoàn tất. | — | default |
| `caseDetail.guidance.submittedUnpaid.cta` | `StatusGuidanceCard` > `Button` (`StatusGuidanceCard.tsx:595`) | CTA | Thanh toán dịch vụ | Mở modal thanh toán / mua credit | default |
| `caseDetail.guidance.aiFailed.title` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:615`) | Heading | Tiến trình thẩm định bị gián đoạn | — | Khi `isAiPackage`, stage `submitted` & job thất bại |
| `caseDetail.guidance.aiFailed.desc` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:620`) | Description | Tiến trình thẩm định AI trước đó không hoàn thành. Credit đã được hoàn trả. Nhấn Gửi đánh giá để kích hoạt lại. | — | default |
| `caseDetail.guidance.aiReady.title` | `StatusGuidanceCard` > `Alert` title (`StatusGuidanceCard.tsx:628`) | Heading | Hồ sơ đã nộp — AI sẵn sàng thẩm định | — | Khi `isAiPackage`, stage `submitted` & đã trả phí |
| `caseDetail.guidance.aiReady.desc` | `StatusGuidanceCard` > `p` desc (`StatusGuidanceCard.tsx:633`) | Description | Hệ thống đã tiếp nhận hồ sơ và đang chuẩn bị thẩm định tự động. Kết quả sẽ có trong ít phút. | — | default |
| `caseDetail.guidance.static.aiSubmitted.title` | `AI_STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:20`) | Heading | Hồ sơ đang chờ xử lý bởi Nexus AI | — | Stage `submitted` (AI package) |
| `caseDetail.guidance.static.aiSubmitted.desc` | `AI_STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:21–22`) | Description | Hệ thống đã tiếp nhận hồ sơ và đang khởi động tiến trình thẩm định tự động qua Nexus AI Engine. Kết quả phản biện chi tiết sẽ có trong ít phút. | — | Stage `submitted` (AI package) |
| `caseDetail.guidance.static.aiUnderReview.title` | `AI_STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:27`) | Heading | Nexus AI đang tiến hành thẩm định dự án | — | Stage `under_review` (AI package) |
| `caseDetail.guidance.static.aiUnderReview.desc` | `AI_STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:28–29`) | Description | Nexus AI Engine đang phân tích tài liệu và đánh giá hồ sơ theo tiêu chuẩn phản biện. Báo cáo chi tiết sẽ sẵn sàng trong ít phút. | — | Stage `under_review` (AI package) |
| `caseDetail.guidance.static.submitted.title` | `STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:37`) | Heading | Hồ sơ đã gửi thành công — Chờ xét duyệt | — | Stage `submitted` (Standard package) |
| `caseDetail.guidance.static.submitted.desc` | `STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:38–39`) | Description | Đội ngũ Nexus đang kiểm tra hồ sơ và phân công Supporter chuyên môn phụ trách dự án trong 12 đến 24 giờ. Hiện tại bạn không cần làm gì thêm. | — | Stage `submitted` (Standard package) |
| `caseDetail.guidance.static.underReview.title` | `STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:44`) | Heading | Dự án đang trong quá trình phản biện | — | Stage `under_review` (Standard package) |
| `caseDetail.guidance.static.underReview.desc` | `STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:45–46`) | Description | Supporter đang tiến hành đọc tài liệu và viết báo cáo phản biện chi tiết. Vui lòng chờ báo cáo hoặc theo dõi Thảo luận nếu Supporter cần trao đổi thêm. | — | Stage `under_review` (Standard package) |
| `caseDetail.guidance.static.reportReady.title` | `STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:51, 58`) | Heading | Báo cáo phản biện đã sẵn sàng | — | Stage `report_ready`, `waiting_for_revision` |
| `caseDetail.guidance.static.reportReady.desc` | `STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:52–53, 59–60`) | Description | Đánh giá chi tiết đã hoàn thành. Khi nhóm đã xem xong kết quả, hãy xác nhận hoàn thành hoặc gửi đánh giá mới. | — | Stage `report_ready`, `waiting_for_revision` |
| `caseDetail.guidance.static.closed.title` | `STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:65`) | Heading | Hồ sơ đã đóng | — | Stage `closed` |
| `caseDetail.guidance.static.closed.desc` | `STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:66–67`) | Description | Hồ sơ phản biện này đã được đóng. Vui lòng liên hệ Đội ngũ Nexus nếu cần thêm thông tin. | — | Stage `closed` |
| `caseDetail.guidance.static.completed.title` | `STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:72, 79, 86, 93`) | Heading | Quy trình phản biện đã hoàn tất | — | Stage `completed`, `approved`, `APPROVED`, `sent` |
| `caseDetail.guidance.static.completed.desc` | `STATUS_GUIDANCE_COPY` (`statusCopyMap.ts:73–74, 80–81, 87–88, 94–95`) | Description | Hồ sơ phản biện dự án của bạn đã hoàn thành qua các vòng. Bạn có thể xem báo cáo chi tiết và điểm số tại tab Tài liệu dự án. | — | Stage `completed`, `approved`, `APPROVED`, `sent` |

---

### 2.5 Khối Quét Radar & Thẩm định AI (ActiveRadarScanning, Header, Pipeline, Logs, Console)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/ActiveRadarScanning.tsx`, `RadarHeader.tsx`, `RadarStagePipeline.tsx`, `RadarLogsViewer.tsx`, `TerminalConsole.tsx`, `radar.utils.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.radar.badge.failed` | `BADGE_CONFIG` (`radar.utils.ts:41`) | Badge | Gián đoạn | — | Trạng thái `failed` |
| `caseDetail.radar.badge.cancelled` | `BADGE_CONFIG` (`radar.utils.ts:46`) | Badge | Đã dừng | — | Trạng thái `cancelled` |
| `caseDetail.radar.badge.queued` | `BADGE_CONFIG` (`radar.utils.ts:51`) | Badge | Hàng đợi | — | Trạng thái `queued` |
| `caseDetail.radar.badge.running` | `BADGE_CONFIG` (`radar.utils.ts:56`) | Badge | Đang thẩm định | — | Trạng thái `running` (chấm nhấp nháy animate-ping) |
| `caseDetail.radar.badge.completed` | `BADGE_CONFIG` (`radar.utils.ts:61`) | Badge | Đã hoàn thành | — | Trạng thái `completed` |
| `caseDetail.radar.header.defaultProject` | `RadarHeader` > `h3` fallback (`RadarHeader.tsx:62`) | Heading | Đề án thẩm định | — | Fallback khi không có `projectName` |
| `caseDetail.radar.header.timerTooltip` | `RadarHeader` > timer box (`RadarHeader.tsx:70`) | Helper | Thời gian thực hiện | — | Thuộc tính title tooltip |
| `caseDetail.radar.header.btnCancel` | `RadarHeader` > `Button` đỏ (`RadarHeader.tsx:85`) | CTA | Dừng thẩm định | Mở modal xác nhận dừng | Hiển thị khi `status === "running" \|\| status === "queued"` |
| `caseDetail.radar.header.btnRetry` | `RadarHeader` > `Button` (`RadarHeader.tsx:97`) | CTA | Chạy lại Thẩm định AI | Gọi hàm `onRetry()` | Hiển thị khi `status === "failed"` |
| `caseDetail.radar.header.jobIdLabel` | `RadarHeader` > span (`RadarHeader.tsx:105`) | Label | Job ID: | — | default |
| `caseDetail.radar.header.jobIdTooltip` | `RadarHeader` > button (`RadarHeader.tsx:110`) | Helper | Nhấn để sao chép Job ID | Sao chép `jobId` vào bộ nhớ tạm | Hover button sao chép |
| `caseDetail.radar.header.copied` | `RadarHeader` > span (`RadarHeader.tsx:121`) | Status | Đã chép | — | Hiển thị 2 giây sau khi sao chép |
| `caseDetail.radar.cancelModal.title` | `RadarHeader` > `Modal` title (`RadarHeader.tsx:134`) | Modal | Xác nhận dừng thẩm định | — | Khi modal mở |
| `caseDetail.radar.cancelModal.desc` | `RadarHeader` > `Modal` text (`RadarHeader.tsx:142–146`) | Description | `Bạn có chắc chắn muốn dừng tiến trình thẩm định AI cho đề án {projectName \|\| "này"}? Tiến trình đang chạy sẽ bị dừng lại và bạn có thể khởi chạy lại bất cứ lúc nào.` | — | default |
| `caseDetail.radar.cancelModal.btnResume` | `RadarHeader` > `Modal` Button (`RadarHeader.tsx:155`) | CTA | Tiếp tục chạy | Đóng modal hủy | default |
| `caseDetail.radar.cancelModal.btnConfirm` | `RadarHeader` > `Modal` Button đỏ (`RadarHeader.tsx:164`) | CTA | Dừng tiến trình | Gọi `onCancel()` và đóng modal | Loading khi `isCancelling` |
| `caseDetail.radar.progress.stageCount` | `ActiveRadarScanning` > span (`ActiveRadarScanning.tsx:115`) | Item | `Giai đoạn {currentStep}/{DEFAULT_STAGES.length}` | — | Ví dụ: `Giai đoạn 2/4` |
| `caseDetail.radar.progress.statusText.step1` | `calculateRadarProgress` (`radar.utils.ts:110`) | Status | Đang tiếp nhận và bóc tách dữ liệu đề án | — | Bước 1 (mặc định) |
| `caseDetail.radar.progress.statusText.step2` | `calculateRadarProgress` (`radar.utils.ts:108`) | Status | Đang phân tích khung ma trận Vấn đề, Giải pháp và Khách hàng | — | Bước 2 |
| `caseDetail.radar.progress.statusText.step3` | `calculateRadarProgress` (`radar.utils.ts:105`) | Status | Đang phản biện chuyên sâu các giả định và rủi ro | — | Bước 3 |
| `caseDetail.radar.progress.statusText.step4` | `calculateRadarProgress` (`radar.utils.ts:102`) | Status | Đang tổng hợp điểm số và xuất báo cáo phản biện | — | Bước 4 |
| `caseDetail.radar.progress.statusText.completed` | `calculateRadarProgress` (`radar.utils.ts:90`) | Status | Đã hoàn tất báo cáo thẩm định đề án | — | Khi `status === "completed"` (100%) |
| `caseDetail.radar.progress.statusText.failed` | `calculateRadarProgress` (`radar.utils.ts:93`) | Status | Tiến trình gặp gián đoạn, bạn có thể bấm Chạy lại | — | Khi `status === "failed"` (20%) |
| `caseDetail.radar.progress.statusText.cancelled` | `calculateRadarProgress` (`radar.utils.ts:96`) | Status | Tiến trình thẩm định đã dừng theo yêu cầu | — | Khi `status === "cancelled"` (15%) |
| `caseDetail.radar.progress.statusText.queued` | `calculateRadarProgress` (`radar.utils.ts:99`) | Status | Đang chuẩn bị môi trường thẩm định AI | — | Khi `status === "queued"` (10%) |
| `caseDetail.radar.stage1.name` | `DEFAULT_STAGES` (`radar.utils.ts:8`) | Item | Tiếp nhận đề án | — | Stage 1 (01) |
| `caseDetail.radar.stage1.desc` | `DEFAULT_STAGES` (`radar.utils.ts:9`) | Description | Thu thập dữ liệu đề án và bóc tách thông tin cốt lõi | — | Stage 1 (01) |
| `caseDetail.radar.stage2.name` | `DEFAULT_STAGES` (`radar.utils.ts:13`) | Item | Mô hình Triad | — | Stage 2 (02) |
| `caseDetail.radar.stage2.desc` | `DEFAULT_STAGES` (`radar.utils.ts:14`) | Description | Đối chiếu ma trận Vấn đề - Giải pháp - Khách hàng | — | Stage 2 (02) |
| `caseDetail.radar.stage3.name` | `DEFAULT_STAGES` (`radar.utils.ts:19`) | Item | Phản biện sâu | — | Stage 3 (03) |
| `caseDetail.radar.stage3.desc` | `DEFAULT_STAGES` (`radar.utils.ts:20`) | Description | Phản biện chuyên sâu các giả định, rủi ro và tính khả thi | — | Stage 3 (03) |
| `caseDetail.radar.stage4.name` | `DEFAULT_STAGES` (`radar.utils.ts:25`) | Item | Báo cáo phản biện | — | Stage 4 (04) |
| `caseDetail.radar.stage4.desc` | `DEFAULT_STAGES` (`radar.utils.ts:26`) | Description | Tổng hợp điểm số và xuất báo cáo thẩm định hoàn chỉnh | — | Stage 4 (04) |
| `caseDetail.radar.stage.tagDone` | `RadarStagePipeline` > span (`RadarStagePipeline.tsx:104`) | Badge | Hoàn thành | — | Hiển thị khi bước đã qua |
| `caseDetail.radar.stage.tagActive` | `RadarStagePipeline` > span (`RadarStagePipeline.tsx:112`) | Badge | Đang xử lý | — | Hiển thị khi bước đang chạy |
| `caseDetail.radar.stage.tagPending` | `RadarStagePipeline` > span (`RadarStagePipeline.tsx:116`) | Badge | Chờ thực hiện | — | Hiển thị khi bước chưa chạy |
| `caseDetail.radar.logs.title` | `RadarLogsViewer` > button span (`RadarLogsViewer.tsx:28`) | Heading | Nhật ký hoạt động | — | default |
| `caseDetail.radar.logs.countBadge` | `RadarLogsViewer` > button span (`RadarLogsViewer.tsx:30`) | Badge | `{logs.length} sự kiện` | — | default |
| `caseDetail.radar.logs.collapse` | `RadarLogsViewer` > button span (`RadarLogsViewer.tsx:34`) | Item | Thu gọn | Ẩn danh sách log | Khi `showLogs === true` |
| `caseDetail.radar.logs.expand` | `RadarLogsViewer` > button span (`RadarLogsViewer.tsx:34`) | Item | Xem chi tiết | Mở danh sách log | Khi `showLogs === false` |
| `caseDetail.console.title` | `TerminalConsole` > span (`TerminalConsole.tsx:71`) | Heading | Nhật ký Hoạt động Thẩm định | — | Terminal variant |
| `caseDetail.console.count` | `TerminalConsole` > span (`TerminalConsole.tsx:74`) | Item | `· {logs.length} bản ghi` | — | Terminal variant |
| `caseDetail.console.badgeLive` | `TerminalConsole` > `Badge` (`TerminalConsole.tsx:85`) | Badge | Trực tiếp | — | Khi `isStreaming === true` |
| `caseDetail.console.badgeBrand` | `TerminalConsole` > `Badge` (`TerminalConsole.tsx:89`) | Badge | Nexus AI | — | Terminal variant |
| `caseDetail.console.empty` | `TerminalConsole` > `Text` (`TerminalConsole.tsx:103–104`) | Empty state | Đang kết nối luồng trực tiếp... Tiến trình thẩm định AI sẽ cập nhật hoạt động tại đây. | — | Khi chưa có log |
| `caseDetail.console.tagStopped` | `getBadgeInfo` (`TerminalConsole.tsx:15`) | Badge | ĐÃ DỪNG | — | Khi có icon 🛑 hoặc từ khóa "hủy" |
| `caseDetail.console.tagWarning` | `getBadgeInfo` (`TerminalConsole.tsx:18`) | Badge | CẢNH BÁO | — | Khi có từ khóa "gián đoạn", "thất bại", "Error" |
| `caseDetail.console.tagMilestone` | `getBadgeInfo` (`TerminalConsole.tsx:21`) | Badge | CỘT MỐC | — | Khi có 📦 hoặc "Cột mốc" |
| `caseDetail.console.tagDone` | `getBadgeInfo` (`TerminalConsole.tsx:24`) | Badge | HOÀN TẤT | — | Khi có 🏁 hoặc "Hoàn thành" |
| `caseDetail.console.tagDoc` | `getBadgeInfo` (`TerminalConsole.tsx:27`) | Badge | TÀI LIỆU | — | Khi có 📄 hoặc "tài liệu", "tiếp nhận" |
| `caseDetail.console.tagKnowledge` | `getBadgeInfo` (`TerminalConsole.tsx:30`) | Badge | TRI THỨC | — | Khi có 📚 hoặc "tri thức" |
| `caseDetail.console.tagProgress` | `getBadgeInfo` (`TerminalConsole.tsx:32`) | Badge | TIẾN TRÌNH | — | Nhãn mặc định của log console |

---

### 2.6 Tab Tổng quan đề tài (CaseOverviewPanel & CaseOverviewTab)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/CaseOverviewPanel.tsx`, `overview/CaseOverviewTab.tsx`, `overview/caseOverviewModel.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.overview.secTeam.title` | `CaseOverviewPanel` > Card 1 > `h3` (`CaseOverviewPanel.tsx:85`) | Heading | Đội ngũ & Trường học | — | default |
| `caseDetail.overview.secTeam.lblProjectName` | `CaseOverviewPanel` > Card 1 > span (`CaseOverviewPanel.tsx:90`) | Label | Tên đề tài: | — | default |
| `caseDetail.overview.secTeam.lblGroupNo` | `CaseOverviewPanel` > Card 1 > span (`CaseOverviewPanel.tsx:94`) | Label | Nhóm số: | — | default |
| `caseDetail.overview.secTeam.lblSchool` | `CaseOverviewPanel` > Card 1 > span (`CaseOverviewPanel.tsx:98`) | Label | Trường: | — | default |
| `caseDetail.overview.secTeam.lblCourse` | `CaseOverviewPanel` > Card 1 > span (`CaseOverviewPanel.tsx:102`) | Label | Môn học: | — | default |
| `caseDetail.overview.secContact.title` | `CaseOverviewPanel` > Card 2 > `h3` (`CaseOverviewPanel.tsx:113`) | Heading | Người liên hệ | — | default |
| `caseDetail.overview.secContact.lblName` | `CaseOverviewPanel` > Card 2 > span (`CaseOverviewPanel.tsx:117`) | Label | Họ và tên: | — | default |
| `caseDetail.overview.secContact.lblStudentCode` | `CaseOverviewPanel` > Card 2 > span (`CaseOverviewPanel.tsx:121`) | Label | Mã số sinh viên: | — | default |
| `caseDetail.overview.secContact.lblEmail` | `CaseOverviewPanel` > Card 2 > span (`CaseOverviewPanel.tsx:125`) | Label | Email: | — | default |
| `caseDetail.overview.secContact.lblPhone` | `CaseOverviewPanel` > Card 2 > span (`CaseOverviewPanel.tsx:129`) | Label | Số điện thoại: | — | default |
| `caseDetail.overview.secContact.lblRole` | `CaseOverviewPanel` > Card 2 > span (`CaseOverviewPanel.tsx:133`) | Label | Vai trò: | — | default |
| `caseDetail.overview.secContact.lblTelegram` | `CaseOverviewPanel` > Card 2 > span (`CaseOverviewPanel.tsx:137`) | Label | Telegram: | — | default |
| `caseDetail.overview.blocker.title` | `CaseOverviewPanel` > Block kẹt > `h3` (`CaseOverviewPanel.tsx:148`) | Heading | Nhóm đang kẹt ở đâu? | — | default |
| `caseDetail.overview.blocker.label` | `CaseOverviewPanel` > Block kẹt > span (`CaseOverviewPanel.tsx:152`) | Label | Điểm kẹt hiện tại: | — | default |
| `caseDetail.overview.blocker.fallback` | `CaseOverviewPanel` > Block kẹt > p (`CaseOverviewPanel.tsx:154`) | Empty state | Chưa cập nhật điểm kẹt hiện tại. | — | Khi không có `currentBlocker` |
| `caseDetail.overview.idea.title` | `CaseOverviewPanel` > Block Ý tưởng > `h3` (`CaseOverviewPanel.tsx:163`) | Heading | Chi tiết Ý tưởng Khởi nghiệp | — | default |
| `caseDetail.overview.idea.lblField` | `CaseOverviewPanel` > Block Ý tưởng > span (`CaseOverviewPanel.tsx:171`) | Label | Lĩnh vực hoạt động: | — | default |
| `caseDetail.overview.idea.lblTargetCustomer` | `CaseOverviewPanel` > Block Ý tưởng > span (`CaseOverviewPanel.tsx:179`) | Label | Khách hàng mục tiêu: | — | default |
| `caseDetail.overview.idea.lblProblem` | `CaseOverviewPanel` > Block Ý tưởng > span (`CaseOverviewPanel.tsx:189`) | Label | Vấn đề cốt lõi (Problem): | — | default |
| `caseDetail.overview.idea.lblSolution` | `CaseOverviewPanel` > Block Ý tưởng > span (`CaseOverviewPanel.tsx:197`) | Label | Giải pháp đề xuất (Solution): | — | default |
| `caseDetail.overview.idea.lblMvp` | `CaseOverviewPanel` > Block Ý tưởng > span (`CaseOverviewPanel.tsx:208`) | Label | Sản phẩm khả thi tối thiểu (MVP): | — | Hiển thị khi có `mvp` |
| `caseDetail.overview.tfResult.title` | `CaseOverviewPanel` > Block Team-Fit > `h3` (`CaseOverviewPanel.tsx:219`) | Heading | Đánh giá sơ bộ từ AI (Team-Fit Analysis) | — | Hiển thị khi có gaps từ AI |
| `caseDetail.overview.tfResult.lblTeamGaps` | `CaseOverviewPanel` > Block Team-Fit > span (`CaseOverviewPanel.tsx:227`) | Label | Khoảng trống đội ngũ cần lưu ý: | — | Hiển thị khi `teamGaps.length > 0` |
| `caseDetail.overview.tfResult.lblCommercialGaps` | `CaseOverviewPanel` > Block Team-Fit > span (`CaseOverviewPanel.tsx:241`) | Label | Khoảng trống thương mại & thị trường: | — | Hiển thị khi `commercialGaps.length > 0` |
| `caseDetail.overview.tfMembers.title` | `CaseOverviewPanel` > Block thành viên > `h3` (`CaseOverviewPanel.tsx:259`) | Heading | `Thành viên đội ngũ ({tfTeam.length})` | — | Hiển thị khi có `tfTeam.length > 0` |
| `caseDetail.overview.tfMembers.major` | `CaseOverviewPanel` > Card thành viên > p (`CaseOverviewPanel.tsx:265`) | Item | `Chuyên môn: {m.major \|\| m.role \|\| "Chưa cập nhật"}` | — | default |
| `caseDetail.overview.tfMembers.skills` | `CaseOverviewPanel` > Card thành viên > p (`CaseOverviewPanel.tsx:266`) | Item | `Kỹ năng: {m.skills}` | — | Hiển thị khi có `skills` |
| `caseDetail.overview.needs.title` | `CaseOverviewPanel` > Block nhu cầu > `h3` (`CaseOverviewPanel.tsx:277`) | Heading | Nhu cầu hỗ trợ chuyên môn | — | default |
| `caseDetail.overview.needs.lblPrimary` | `CaseOverviewPanel` > Block nhu cầu > span (`CaseOverviewPanel.tsx:284`) | Label | Nhu cầu hỗ trợ chính: | — | default |
| `caseDetail.overview.needs.defaultPrimary` | `CaseOverviewPanel` > Block nhu cầu > p (`CaseOverviewPanel.tsx:287`) | Description | Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi | — | Fallback khi không có `primaryNeedText` |
| `caseDetail.overview.needs.lblExpected` | `CaseOverviewPanel` > Block nhu cầu > span (`CaseOverviewPanel.tsx:295`) | Label | Kết quả mong đợi sau phản biện: | — | default |
| `caseDetail.overview.needs.fallbackExpected` | `CaseOverviewPanel` > Block nhu cầu > p (`CaseOverviewPanel.tsx:297`) | Description | Chưa nhập ghi chú kỳ vọng | — | Fallback |
| `caseDetail.overview.needs.lblExtra` | `CaseOverviewPanel` > Block nhu cầu > span (`CaseOverviewPanel.tsx:303`) | Label | Ghi chú thêm cho Supporter: | — | default |
| `caseDetail.overview.needs.fallbackExtra` | `CaseOverviewPanel` > Block nhu cầu > p (`CaseOverviewPanel.tsx:305`) | Description | Chưa nhập ghi chú thêm | — | Fallback |
| `caseDetail.overview.map.filterIdea` | `PRIMARY_NEEDS_MAP` (`CaseOverviewPanel.tsx:29`) | Item | Cần hỗ trợ chọn hướng ý tưởng phù hợp để phát triển tiếp | — | Key `filter_select_idea` |
| `caseDetail.overview.map.clarifyCustomer` | `PRIMARY_NEEDS_MAP` (`CaseOverviewPanel.tsx:30`) | Item | Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi | — | Key `clarify_customer_pain` |
| `caseDetail.overview.map.critiqueFeasibility` | `PRIMARY_NEEDS_MAP` (`CaseOverviewPanel.tsx:31`) | Item | Cần phản biện để đánh giá giải pháp hiện tại có hợp lý và khả thi không | — | Key `critique_feasibility` |
| `caseDetail.overview.map.auditCp1` | `PRIMARY_NEEDS_MAP` (`CaseOverviewPanel.tsx:32`) | Item | Cần rà soát báo cáo Checkpoint 1 và chỉ ra điểm cần chỉnh sửa | — | Key `audit_cp1_draft` |
| `caseDetail.overview.map.improveRejected` | `PRIMARY_NEEDS_MAP` (`CaseOverviewPanel.tsx:33`) | Item | Cần góp ý để cải thiện ý tưởng sau phản hồi chưa tốt từ giảng viên | — | Key `improve_rejected_idea` |
| `caseDetail.overviewTab.title` | `CaseOverviewTab` > `h2` (`CaseOverviewTab.tsx:99`) | Heading | Tổng quan hồ sơ | — | Tab variant |
| `caseDetail.overviewTab.fallbackSummary` | `CaseOverviewTab` > `p` (`CaseOverviewTab.tsx:101`) | Description | Chưa có tóm tắt hồ sơ. Các phần bên dưới chỉ hiển thị dữ liệu nhóm đã cung cấp. | — | Tab variant |
| `caseDetail.overviewTab.pkgLabel` | `CaseOverviewTab` > `p` label (`CaseOverviewTab.tsx:106`) | Label | Gói dịch vụ | — | Tab variant |
| `caseDetail.overviewTab.slaLabel` | `CaseOverviewTab` > `p` label (`CaseOverviewTab.tsx:110`) | Label | SLA / Deadline | — | Tab variant |
| `caseDetail.overviewTab.secTeam` | `CaseOverviewTab` > `SectionCard` title (`CaseOverviewTab.tsx:118`) | Heading | Nhóm | — | Tab variant |
| `caseDetail.overviewTab.secContact` | `CaseOverviewTab` > `SectionCard` title (`CaseOverviewTab.tsx:121`) | Heading | Liên hệ | — | Tab variant |
| `caseDetail.overviewTab.secIdea` | `CaseOverviewTab` > `SectionCard` title (`CaseOverviewTab.tsx:127`) | Heading | Ý tưởng | — | Tab variant |
| `caseDetail.overviewTab.secMembers` | `MemberList` > `SectionCard` title (`CaseOverviewTab.tsx:52`) | Heading | Thành viên | — | Tab variant |
| `caseDetail.overviewTab.secNotes` | `CaseOverviewTab` > `SectionCard` title (`CaseOverviewTab.tsx:135`) | Heading | Điểm cần chú ý | — | Tab variant |
| `caseDetail.overviewTab.teamGaps` | `GapList` > title (`CaseOverviewTab.tsx:137`) | Label | Khoảng trống đội ngũ | — | Tab variant |
| `caseDetail.overviewTab.commercialGaps` | `GapList` > title (`CaseOverviewTab.tsx:138`) | Label | Khoảng trống thương mại | — | Tab variant |
| `caseDetail.overviewTab.blockerTitle` | `CaseOverviewTab` > `h4` (`CaseOverviewTab.tsx:141`) | Heading | Vướng mắc hiện tại | — | Tab variant |
| `caseDetail.overviewTab.supportTitle` | `CaseOverviewTab` > `h4` (`CaseOverviewTab.tsx:147`) | Heading | Nhu cầu hỗ trợ | — | Tab variant |
| `caseDetail.overviewTab.expectedTitle` | `CaseOverviewTab` > `h4` (`CaseOverviewTab.tsx:157`) | Heading | Kết quả mong đợi | — | Tab variant |
| `caseDetail.overviewTab.fastNav.title` | `CaseOverviewTab` > `h3` (`CaseOverviewTab.tsx:168`) | Heading | Đi tiếp nhanh | — | Tab variant |
| `caseDetail.overviewTab.fastNav.desc` | `CaseOverviewTab` > `p` (`CaseOverviewTab.tsx:169`) | Description | Mở tài liệu hoặc lịch sử mà không lặp lại bảng dữ liệu trong tab tổng quan. | — | Tab variant |
| `caseDetail.overviewTab.fastNav.btnDocs` | `CaseOverviewTab` > `Button` (`CaseOverviewTab.tsx:174`) | CTA | Tài liệu | Gọi `onOpenDocuments()` | Tab variant |
| `caseDetail.overviewTab.fastNav.btnTimeline` | `CaseOverviewTab` > `Button` (`CaseOverviewTab.tsx:179`) | CTA | Lịch sử | Gọi `onOpenTimeline()` | Tab variant |

---

### 2.7 Tab Nội dung ý tưởng (TabIdeaContent - Legacy/Alternative)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/TabIdeaContent.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.ideaTab.secIdea.title` | `TabIdeaContent` > section 1 > `h3` (`TabIdeaContent.tsx:50, 90`) | Heading | Ý tưởng đề tài | — | default |
| `caseDetail.ideaTab.secIdea.desc` | `TabIdeaContent` > section 1 > `p` (`TabIdeaContent.tsx:51, 91`) | Description | Mô tả giải pháp, cách hoạt động và giá trị cốt lõi mang lại. | — | default |
| `caseDetail.ideaTab.secPain.title` | `TabIdeaContent` > section 2 > `h3` (`TabIdeaContent.tsx:57, 90`) | Heading | Vấn đề đang giải quyết | — | default |
| `caseDetail.ideaTab.secPain.desc` | `TabIdeaContent` > section 2 > `p` (`TabIdeaContent.tsx:58, 91`) | Description | Nỗi đau của khách hàng mà giải pháp này đang giải quyết. | — | default |
| `caseDetail.ideaTab.secTarget.title` | `TabIdeaContent` > section 3 > `h3` (`TabIdeaContent.tsx:64, 90`) | Heading | Khách hàng mục tiêu | — | default |
| `caseDetail.ideaTab.secTarget.desc` | `TabIdeaContent` > section 3 > `p` (`TabIdeaContent.tsx:65, 91`) | Description | Chân dung đối tượng trực tiếp trả phí hoặc sử dụng sản phẩm. | — | default |
| `caseDetail.ideaTab.secEmpty` | `TabIdeaContent` > section > `p` (`TabIdeaContent.tsx:95`) | Empty state | Chưa cung cấp thông tin. | — | Khi mục không có nội dung |
| `caseDetail.ideaTab.drive.title` | `TabIdeaContent` > Drive card > `h4` (`TabIdeaContent.tsx:108`) | Heading | Tài liệu minh chứng hồ sơ | — | Hiển thị khi có `driveUrl` |
| `caseDetail.ideaTab.drive.desc` | `TabIdeaContent` > Drive card > `p` (`TabIdeaContent.tsx:111`) | Description | Tài liệu mà Supporter sẽ đọc để chuẩn bị phản biện hồ sơ của nhóm. | — | default |
| `caseDetail.ideaTab.drive.cta` | `TabIdeaContent` > `a` (`TabIdeaContent.tsx:120`) | CTA | Mở Google Drive | Mở link Google Drive trong tab mới (`target="_blank"`) | default |

---

### 2.8 Tab Không gian tài liệu (DocumentWorkspace, Header, RowsTable, TableRow)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/page.tsx:219–246`, `apps/web-1/app/dashboard/case/[id]/_components/documents/*`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.docs.btnEditIntake` | `page.tsx` > Header actions > `Button` (`page.tsx:225`) | CTA | Cập nhật thông tin | Điều hướng sang `/dashboard/intake?caseId=${id}` | Hiển thị khi `canEditIntake === true` |
| `caseDetail.docs.btnUploadRevision` | `page.tsx` > Header actions > `Button` (`page.tsx:235`) | CTA | Tải tài liệu | Mở `StudentDocumentUploadModal` | Hiển thị khi `canSubmitRevision === true` |
| `caseDetail.docs.btnUploadExternal` | `page.tsx` > Header actions > `Button` (`page.tsx:244`) | CTA | Tải đánh giá bên ngoài | Mở `ExternalFeedbackUploadModal` | default |
| `caseDetail.docs.header.tabSubmission` | `DocumentWorkspaceHeader` > button span (`DocumentWorkspaceHeader.tsx:51`) | Navigation | Tài liệu bài nộp | Chọn xem tài liệu bài nộp (`activeTab = "documents"`) | Active khi `activeTab === "documents"` |
| `caseDetail.docs.header.tabFeedback` | `DocumentWorkspaceHeader` > button span (`DocumentWorkspaceHeader.tsx:75`) | Navigation | Đánh giá bên ngoài | Chọn xem đánh giá ngoài (`activeTab = "external-feedback"`) | Active khi `activeTab === "external-feedback"` |
| `caseDetail.docs.header.tabReports` | `DocumentWorkspaceHeader` > button span (`DocumentWorkspaceHeader.tsx:100`) | Navigation | Báo cáo phản biện | Chọn xem báo cáo (`activeTab = "assessment-reports"`) | Hiển thị khi `reportCount > 0` |
| `caseDetail.docs.filter.all` | `DocumentWorkspaceHeader` > `Select` option (`DocumentWorkspaceHeader.tsx:123`) | Item | `Tất cả ({documentCount})` | Lọc toàn bộ tài liệu | Option value `all` |
| `caseDetail.docs.filter.student` | `DocumentWorkspaceHeader` > `Select` option (`DocumentWorkspaceHeader.tsx:124`) | Item | `Sinh viên ({studentDocCount})` | Lọc tài liệu sinh viên tải lên | Option value `student` |
| `caseDetail.docs.filter.supporter` | `DocumentWorkspaceHeader` > `Select` option (`DocumentWorkspaceHeader.tsx:125`) | Item | `Supporter ({supporterDocCount})` | Lọc tài liệu Supporter tải lên | Option value `supporter` |
| `caseDetail.docs.empty.noWorkspace` | `DocumentWorkspace` > div trống (`DocumentWorkspace.tsx:111`) | Empty state | Chưa có tài liệu | — | Khi chưa có checkpoint/tài liệu |
| `caseDetail.docs.empty.noWorkspaceDesc` | `DocumentWorkspace` > p trống (`DocumentWorkspace.tsx:113`) | Description | Hồ sơ này chưa có tài liệu nào được tải lên hoặc liên kết. | — | default |
| `caseDetail.docs.empty.filtered` | `DocumentWorkspace` > p trống (`DocumentWorkspace.tsx:140`) | Empty state | Không có tài liệu nào thuộc bộ lọc này. | — | Khi filter không có bản ghi |
| `caseDetail.docs.empty.reports` | `DocumentWorkspace` > p trống (`DocumentWorkspace.tsx:142`) | Empty state | Chưa có báo cáo phản biện nào được lưu. | — | Khi tab báo cáo rỗng |
| `caseDetail.docs.empty.feedback` | `DocumentWorkspace` > p trống (`DocumentWorkspace.tsx:143`) | Empty state | Chưa có tài liệu đánh giá bên ngoài trong checkpoint này. | — | Khi tab đánh giá ngoài rỗng |
| `caseDetail.docs.th.version` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:54`) | Label | Phiên bản | — | Khi tab là `documents` hoặc `assessment-reports` |
| `caseDetail.docs.th.round` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:54`) | Label | Đợt | — | Khi tab là `external-feedback` |
| `caseDetail.docs.th.category` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:59`) | Label | Phân loại | — | Khi tab là `documents` |
| `caseDetail.docs.th.linkedVersion` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:61`) | Label | Liên kết bản nộp | — | Khi tab là `external-feedback` |
| `caseDetail.docs.th.submissionType` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:62`) | Label | Loại nộp | — | Khi tab là `assessment-reports` |
| `caseDetail.docs.th.uploader` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:68`) | Label | Người tải | — | Khi tab là `documents` |
| `caseDetail.docs.th.creator` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:67`) | Label | Nguồn tạo | — | Khi tab là `assessment-reports` |
| `caseDetail.docs.th.fileNameReport` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:73`) | Label | Tên file báo cáo | — | Khi tab là `assessment-reports` |
| `caseDetail.docs.th.fileNameDoc` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:73`) | Label | Tên tài liệu | — | Khi tab không phải báo cáo |
| `caseDetail.docs.th.time` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:77`) | Label | Thời gian | — | default |
| `caseDetail.docs.th.source` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:82`) | Label | Nguồn | — | Ẩn khi `isReport === true` |
| `caseDetail.docs.th.format` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:87`) | Label | Định dạng | — | default |
| `caseDetail.docs.th.action` | `DocumentRowsTable` > `Table.Th` (`DocumentRowsTable.tsx:91`) | Label | Thao tác | — | default |
| `caseDetail.docs.row.downloadTooltip` | `DocumentTableRow` > `Tooltip` (`DocumentTableRow.tsx:124`) | Helper | Tải xuống tài liệu | — | Hover nút tải xuống |
| `caseDetail.docs.row.btnDownload` | `DocumentTableRow` > `Button` (`DocumentTableRow.tsx:125–137`) | CTA | *(Icon Download)* | Mở URL tài liệu trong tab mới để tải về | Khi `row.hasAction && row.url` |
| `caseDetail.docs.row.noAction` | `DocumentTableRow` > span (`DocumentTableRow.tsx:139`) | Item | — | — | Khi tệp không có URL tải |
| `caseDetail.docs.source.drive` | `getSourceLabel` (`document-workspace.types.ts:180`) | Item | Google Drive | — | Nguồn tệp `drive` |
| `caseDetail.docs.source.system` | `getSourceLabel` (`document-workspace.types.ts:181`) | Item | Hệ thống | — | Nguồn tệp `generated` |
| `caseDetail.docs.source.upload` | `getSourceLabel` (`document-workspace.types.ts:182`) | Item | Tải lên | — | Nguồn tệp tải lên trực tiếp |
| `caseDetail.docs.uploader.student` | `buildCommonRow` (`document-workspace.types.ts:104`) | Item | Sinh viên | — | Role người tải |
| `caseDetail.docs.uploader.supporter` | `buildCommonRow` (`document-workspace.types.ts:107`) | Item | Supporter | — | Role người tải |
| `caseDetail.docs.uploader.admin` | `buildCommonRow` (`document-workspace.types.ts:110`) | Item | Admin | — | Role người tải |
| `caseDetail.docs.uploader.system` | `buildCommonRow` (`document-workspace.types.ts:115`) | Item | Hệ thống | — | Role tự động |
| `caseDetail.docs.uploader.ai` | `buildAssessmentReportRows` (`report-rows.ts:42`) | Item | Nexus AI | — | Người tạo báo cáo AI |
| `caseDetail.docs.feedbackSource.lecturer` | `getFeedbackSourceLabel` (`document-workspace.types.ts:88`) | Item | Giảng viên | — | Nguồn đánh giá |
| `caseDetail.docs.feedbackSource.mentor` | `getFeedbackSourceLabel` (`document-workspace.types.ts:89`) | Item | Người hướng dẫn | — | Nguồn đánh giá |
| `caseDetail.docs.feedbackSource.other` | `getFeedbackSourceLabel` (`document-workspace.types.ts:90`) | Item | Khác | — | Nguồn đánh giá |
| `caseDetail.docs.submissionType.initial` | `SUBMISSION_TYPE_LABELS` (`report-rows.ts:6`) | Badge | Lần đầu | — | Context label báo cáo |
| `caseDetail.docs.submissionType.resubmit` | `SUBMISSION_TYPE_LABELS` (`report-rows.ts:7`) | Badge | Đã sửa | — | Context label báo cáo |
| `caseDetail.docs.submissionType.logicCheck` | `SUBMISSION_TYPE_LABELS` (`report-rows.ts:8`) | Badge | Soi logic | — | Context label báo cáo |
| `caseDetail.docs.name.googleDrive` | `getFileDisplayName` (`document-workspace.types.ts:153`) | Item | Tài liệu Google Drive | — | Tên hiển thị fallback |
| `caseDetail.docs.name.urlLink` | `getFileDisplayName` (`document-workspace.types.ts:154`) | Item | Đường dẫn tài liệu | — | Tên hiển thị fallback |
| `caseDetail.docs.name.attachment` | `getFileDisplayName` (`document-workspace.types.ts:158, 164`) | Item | Tài liệu đính kèm | — | Tên hiển thị fallback |

---

### 2.9 Tab Báo cáo phản biện (TabReportFindings, RoundCard)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/TabReportFindings.tsx`, `RoundCard.tsx`, `report.utils.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.report.empty.title` | `TabReportFindings` > `h4` (`TabReportFindings.tsx:49`) | Empty state | Chưa có báo cáo phản biện | — | Khi chưa có báo cáo nào |
| `caseDetail.report.empty.desc` | `TabReportFindings` > `p` (`TabReportFindings.tsx:50–52`) | Description | Báo cáo phản biện chính thức sẽ hiển thị ở đây sau khi hệ thống hoàn tất thẩm định ý tưởng khởi nghiệp. | — | default |
| `caseDetail.report.history.title` | `TabReportFindings` > `h3` (`TabReportFindings.tsx:63–65`) | Heading | `Lịch sử đánh giá ({roundHistory.length} lượt)` | — | Hiển thị khi có danh sách các vòng đánh giá |
| `caseDetail.report.round.version` | `RoundCard` > span (`RoundCard.tsx:86`) | Heading | `Phiên bản {round.version_no}` | — | Mặc định |
| `caseDetail.report.round.noVersion` | `RoundCard` > span (`RoundCard.tsx:86`) | Heading | Phiên bản — | — | Khi không có `version_no` |
| `caseDetail.report.round.typeInitial` | `RoundCard` > `Badge` (`RoundCard.tsx:82–84`, `report.utils.ts:11`) | Badge | Lần đầu | — | Màu xanh blue |
| `caseDetail.report.round.typeResubmit` | `RoundCard` > `Badge` (`RoundCard.tsx:82–84`, `report.utils.ts:12`) | Badge | Đã sửa | — | Màu cam orange |
| `caseDetail.report.round.typeLogicCheck` | `RoundCard` > `Badge` (`RoundCard.tsx:82–84`, `report.utils.ts:13`) | Badge | Soi logic | — | Màu tím violet |
| `caseDetail.report.btnOpenTab` | `RoundCard` / `TabReportFindings` > `Button` (`RoundCard.tsx:106`, `TabReportFindings.tsx:118`) | CTA | Mở tab mới | Mở URL file PDF trong tab mới (`target="_blank"`) | Hiển thị khi thẻ đang mở rộng |
| `caseDetail.report.tooltipOpenTab` | `TabReportFindings` > `Tooltip` (`TabReportFindings.tsx:107`) | Helper | Mở file PDF trong tab mới để in ấn hoặc đọc toàn màn hình | — | Hover nút "Mở tab mới" |
| `caseDetail.report.btnDownloadPdf` | `RoundCard` / `TabReportFindings` > `Button` (`RoundCard.tsx:116`, `TabReportFindings.tsx:130`) | CTA | Tải PDF / Tải Báo Cáo PDF | Kích hoạt mutation tải file PDF về máy | Hiển thị khi thẻ đang mở rộng |
| `caseDetail.report.btnCollapse` | `RoundCard` / `TabReportFindings` > `Button` (`RoundCard.tsx:130`, `TabReportFindings.tsx:144`) | CTA | Thu gọn | Thu gọn nội dung trình xem PDF | Khi `isExpanded === true` |
| `caseDetail.report.btnExpand` | `RoundCard` / `TabReportFindings` > `Button` (`RoundCard.tsx:130`, `TabReportFindings.tsx:144`) | CTA | Xem báo cáo | Mở rộng trình xem PDF | Khi `isExpanded === false` |
| `caseDetail.report.round.btnCollapseBottom` | `RoundCard` > Bottom bar > `Button` (`RoundCard.tsx:158`) | CTA | Thu gọn báo cáo | Thu gọn trình xem PDF | Nút phụ dưới chân iframe |
| `caseDetail.report.round.emptyPdf` | `RoundCard` > div trống > `p` (`RoundCard.tsx:165`) | Empty state | Chưa có báo cáo cho phiên bản này. | — | Khi round chưa có nội dung report |
| `caseDetail.report.single.iframeTitle` | `TabReportFindings` > `iframe` title (`TabReportFindings.tsx:155`) | Alt text | `Báo cáo phản biện - {projectName}` | — | Thuộc tính title iframe |
| `caseDetail.report.round.iframeTitle` | `RoundCard` > `iframe` title (`RoundCard.tsx:145`) | Alt text | `Báo cáo - {typeLabel} - v{round.version_no ?? "?"}` | — | Thuộc tính title iframe |

---

### 2.10 Tab Trao đổi & Chat với Supporter (TabDiscussionChat)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/TabDiscussionChat.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.chat.header.title` | `TabDiscussionChat` > Header > span (`TabDiscussionChat.tsx:147`) | Heading | Trao đổi | — | default |
| `caseDetail.chat.header.refreshTooltip` | `TabDiscussionChat` > `Tooltip` (`TabDiscussionChat.tsx:150`) | Helper | Tải tin nhắn mới | Gọi `refetch()` | Hover icon refresh |
| `caseDetail.chat.header.btnRefresh` | `TabDiscussionChat` > `ActionIcon` (`TabDiscussionChat.tsx:151–157`) | CTA | *(Icon RefreshCw)* | Tải lại danh sách tin nhắn | Loading animate-spin khi `isFetching` |
| `caseDetail.chat.empty.title` | `TabDiscussionChat` > Empty state > `p` (`TabDiscussionChat.tsx:183`) | Empty state | Chưa có trao đổi nào | — | Khi chưa có tin nhắn |
| `caseDetail.chat.empty.desc` | `TabDiscussionChat` > Empty state > `p` (`TabDiscussionChat.tsx:184–186`) | Description | Đây là nơi nhóm và Supporter phối hợp trong suốt quá trình phản biện. | — | default |
| `caseDetail.chat.role.admin` | `getRoleBadge` (`TabDiscussionChat.tsx:41`) | Badge | Admin | — | Role quản trị viên |
| `caseDetail.chat.role.supporter` | `getRoleBadge` (`TabDiscussionChat.tsx:46`) | Badge | Supporter | — | Role người hỗ trợ |
| `caseDetail.chat.role.student` | `getRoleBadge` (`TabDiscussionChat.tsx:50`) | Badge | Sinh viên | — | Role sinh viên |
| `caseDetail.chat.sender.fallback` | `TabDiscussionChat` > span sender (`TabDiscussionChat.tsx:230`) | Item | Người dùng | — | Khi tin nhắn không có `sender.name` |
| `caseDetail.chat.input.ariaLabel` | `TabDiscussionChat` > `Textarea` (`TabDiscussionChat.tsx:357`) | Aria-label | Nhập nội dung tin nhắn | — | default |
| `caseDetail.chat.input.placeholderDefault` | `TabDiscussionChat` > `Textarea` placeholder (`TabDiscussionChat.tsx:361`) | Placeholder | Nhắn gì đó… | — | Khi chat hoạt động bình thường |
| `caseDetail.chat.input.placeholderClosed` | `TabDiscussionChat` > `Textarea` placeholder (`TabDiscussionChat.tsx:361`) | Placeholder | Chat hiện không khả dụng | — | Khi `isChatClosed === true` |
| `caseDetail.chat.input.placeholderLocked` | `TabDiscussionChat` > `Textarea` placeholder (`TabDiscussionChat.tsx:361`) | Placeholder | Hết lượt kiểm tra và ân hạn. Vui lòng nạp thêm credit. | — | Khi `isChatLocked === true` |
| `caseDetail.chat.btnSend` | `TabDiscussionChat` > `ActionIcon` submit (`TabDiscussionChat.tsx:388–410`) | CTA | *(Icon ArrowUp / Loader2)* | Gửi tin nhắn qua `POST /cases/${id}/messages` | Disabled khi `!inputText.trim() \|\| isSending` |
| `caseDetail.chat.alert.closed` | `TabDiscussionChat` > `Alert` đỏ (`TabDiscussionChat.tsx:418`) | Error | Chat hiện không khả dụng. Vui lòng liên hệ qua email hoặc điện thoại. | — | Hiển thị khi `isChatClosed === true` |
| `caseDetail.chat.alert.locked` | `TabDiscussionChat` > `Alert` vàng (`TabDiscussionChat.tsx:428–429`) | Warning | Hết lượt kiểm tra và đã qua thời gian ân hạn 24h. Vui lòng mua thêm credit để tiếp tục trao đổi. | — | Hiển thị khi `isChatLocked === true` |

---

### 2.11 Tab Quản lý số dư & Credit (CreditPanel, CreditBalanceCard, CreditActions, History)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/CreditPanel.tsx`, `CreditBalanceCard.tsx`, `CreditActions.tsx`, `CreditTransactionHistory.tsx`, `credit-history.types.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.credits.empty.title` | `CreditPanel` > `h2` (`CreditPanel.tsx:40–42`) | Heading | Quản lý số dư & Credit | — | Khi `creditBalance` là null/undefined |
| `caseDetail.credits.empty.desc` | `CreditPanel` > `p` (`CreditPanel.tsx:43–45`) | Description | Mua credit để mở khoá tính năng đánh giá chuyên sâu từ Supporter. Mỗi credit tương ứng với một lượt đánh giá chi tiết. | — | default |
| `caseDetail.credits.empty.cta` | `CreditPanel` > `Button` (`CreditPanel.tsx:53`) | CTA | Mua credit | Mở `CreditQuantityModal` | default |
| `caseDetail.credits.card.balanceLabel` | `CreditBalanceCard` > p (`CreditBalanceCard.tsx:30`) | Label | Số dư credit | — | default |
| `caseDetail.credits.card.badgeZero` | `CreditBalanceCard` > `Badge` đỏ (`CreditBalanceCard.tsx:39`) | Badge | Hết credit | — | Hiển thị khi `creditBalance === 0` |
| `caseDetail.credits.card.unit` | `CreditBalanceCard` > span (`CreditBalanceCard.tsx:47`) | Item | credit | — | default |
| `caseDetail.credits.card.pkgLabel` | `CreditBalanceCard` > p (`CreditBalanceCard.tsx:55`) | Label | Gói dịch vụ | — | default |
| `caseDetail.credits.card.pkgFallback` | `CreditBalanceCard` > p (`CreditBalanceCard.tsx:57`) | Item | Chưa có gói | — | Khi không có `packageName` |
| `caseDetail.credits.card.priceLabel` | `CreditBalanceCard` > p (`CreditBalanceCard.tsx:65`) | Label | Đơn giá | — | default |
| `caseDetail.credits.card.pricePerTurn` | `CreditBalanceCard` > span (`CreditBalanceCard.tsx:71`) | Item | / lượt | — | default |
| `caseDetail.credits.card.btnBuyMore` | `CreditBalanceCard` / `CreditActions` > `Button` (`CreditBalanceCard.tsx:85`, `CreditActions.tsx:23`) | CTA | Mua thêm credit | Mở `CreditQuantityModal` | Hiển thị khi `hasCredits === true` |
| `caseDetail.credits.card.btnBuy` | `CreditBalanceCard` / `CreditActions` > `Button` (`CreditBalanceCard.tsx:85`, `CreditActions.tsx:23`) | CTA | Mua credit | Mở `CreditQuantityModal` | Hiển thị khi `hasCredits === false` |
| `caseDetail.credits.actions.btnHistory` | `CreditActions` > `Button` (`CreditActions.tsx:33`) | CTA | Lịch sử giao dịch | Gọi `onViewHistory()` | Khi có handler `onViewHistory` |
| `caseDetail.credits.actions.note` | `CreditActions` > p (`CreditActions.tsx:40`) | Helper | Mỗi credit tương ứng một lượt đánh giá từ Supporter | — | default |
| `caseDetail.credits.history.emptyTitle` | `CreditTransactionHistory` > p (`CreditTransactionHistory.tsx:111`) | Empty state | Chưa có giao dịch | — | Khi chưa có bản ghi |
| `caseDetail.credits.history.emptyDesc` | `CreditTransactionHistory` > p (`CreditTransactionHistory.tsx:112–114`) | Description | Lịch sử mua và sử dụng credit sẽ xuất hiện tại đây | — | default |
| `caseDetail.credits.history.tabAll` | `QUICK_FILTER_TABS` (`CreditTransactionHistory.tsx:15`) | Filter | Tất cả | Lọc tất cả giao dịch | Tab filter |
| `caseDetail.credits.history.tabPurchase` | `QUICK_FILTER_TABS` (`CreditTransactionHistory.tsx:16`) | Filter | Nạp credit | Lọc giao dịch nạp credit | Tab filter |
| `caseDetail.credits.history.tabConsumption` | `QUICK_FILTER_TABS` (`CreditTransactionHistory.tsx:17`) | Filter | Trừ credit | Lọc giao dịch trừ credit | Tab filter |
| `caseDetail.credits.history.tabRefund` | `QUICK_FILTER_TABS` (`CreditTransactionHistory.tsx:18`) | Filter | Hoàn credit | Lọc giao dịch hoàn credit | Tab filter |
| `caseDetail.credits.history.tabOrder` | `QUICK_FILTER_TABS` (`CreditTransactionHistory.tsx:19`) | Filter | Đơn mua | Lọc đơn hàng mua | Tab filter |
| `caseDetail.credits.history.dateAll` | `CreditTransactionHistory` > Select data (`CreditTransactionHistory.tsx:166`) | Item | Tất cả thời gian | Lọc toàn bộ thời gian | Option value `all` |
| `caseDetail.credits.history.dateToday` | `CreditTransactionHistory` > Select data (`CreditTransactionHistory.tsx:167`) | Item | Hôm nay | Lọc trong ngày | Option value `today` |
| `caseDetail.credits.history.date7Days` | `CreditTransactionHistory` > Select data (`CreditTransactionHistory.tsx:168`) | Item | 7 ngày gần nhất | Lọc 7 ngày qua | Option value `7days` |
| `caseDetail.credits.history.date30Days` | `CreditTransactionHistory` > Select data (`CreditTransactionHistory.tsx:169`) | Item | 30 ngày gần nhất | Lọc 30 ngày qua | Option value `30days` |
| `caseDetail.credits.history.filterEmpty` | `CreditTransactionHistory` > p (`CreditTransactionHistory.tsx:179`) | Empty state | Không có giao dịch nào phù hợp với bộ lọc đã chọn | — | Khi bộ lọc không có dữ liệu |
| `caseDetail.credits.history.thTime` | `CreditTransactionHistory` > `Table.Th` (`CreditTransactionHistory.tsx:197`) | Label | Thời gian | Sắp xếp theo `created_at` | default |
| `caseDetail.credits.history.thType` | `CreditTransactionHistory` > `Table.Th` (`CreditTransactionHistory.tsx:202`) | Label | Loại giao dịch | — | default |
| `caseDetail.credits.history.thContent` | `CreditTransactionHistory` > `Table.Th` (`CreditTransactionHistory.tsx:206`) | Label | Nội dung giao dịch | — | default |
| `caseDetail.credits.history.thAmount` | `CreditTransactionHistory` > `Table.Th` (`CreditTransactionHistory.tsx:216`) | Label | Biến động | Sắp xếp theo `amount` | default |
| `caseDetail.credits.history.thBalanceAfter` | `CreditTransactionHistory` > `Table.Th` (`CreditTransactionHistory.tsx:225`) | Label | Số dư sau giao dịch | — | default |
| `caseDetail.credits.history.thStatus` | `CreditTransactionHistory` > `Table.Th` (`CreditTransactionHistory.tsx:233`) | Label | Trạng thái | — | default |
| `caseDetail.credits.history.orderPending` | `transformToUnifiedItems` (`credit-history.types.ts:88`) | Status | Chờ thanh toán | — | Trạng thái đơn hàng `pending` |
| `caseDetail.credits.history.orderPaid` | `transformToUnifiedItems` (`credit-history.types.ts:92`) | Status | Đã thanh toán | — | Trạng thái đơn hàng `paid` |
| `caseDetail.credits.history.orderCancelled` | `transformToUnifiedItems` (`credit-history.types.ts:95`) | Status | Đã hủy | — | Trạng thái đơn hàng `cancelled` |
| `caseDetail.credits.history.orderRefunded` | `transformToUnifiedItems` (`credit-history.types.ts:98`) | Status | Đã hoàn tiền | — | Trạng thái đơn hàng `refunded` |
| `caseDetail.credits.history.orderSub` | `transformToUnifiedItems` (`credit-history.types.ts:112`) | Item | `Mã đơn hàng: #{order.id.slice(0, 8).toUpperCase()}` | — | default |
| `caseDetail.credits.history.ledgerSuccess` | `transformToUnifiedItems` (`credit-history.types.ts:134, 142, 149`) | Status | Thành công | — | Trạng thái giao dịch ví thành công |
| `caseDetail.credits.history.ledgerPurchase` | `transformToUnifiedItems` (`credit-history.types.ts:130, 132`) | Item | Nạp credit — Cộng credit vào số dư | — | default |
| `caseDetail.credits.history.ledgerConsumption` | `transformToUnifiedItems` (`credit-history.types.ts:138, 140`) | Item | Trừ credit — Sử dụng cho lượt đánh giá case | — | default |
| `caseDetail.credits.history.ledgerRefund` | `transformToUnifiedItems` (`credit-history.types.ts:145, 147`) | Item | Hoàn credit — Hoàn trả credit đánh giá | — | default |

---

### 2.12 Tab Lịch sử hoạt động (ActivityTimeline & EventDetails)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/ActivityTimeline.tsx`, `lib/event-details.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.timeline.empty` | `ActivityTimeline` > `p` (`ActivityTimeline.tsx:32`) | Empty state | Chưa có hoạt động nào được ghi nhận cho hồ sơ này. | — | Khi chưa có sự kiện nào |
| `caseDetail.timeline.rejectionReason` | `ActivityTimeline` > `p` lý do (`ActivityTimeline.tsx:64`) | Description | ` — Lý do: {metadata.reason}` | — | Hiển thị khi sự kiện là `case_rejected` hoặc `vetoed` |
| `caseDetail.timeline.actorPrefix` | `ActivityTimeline` > `p` actor (`ActivityTimeline.tsx:69`) | Item | Thực hiện bởi: | — | Hiển thị khi sự kiện có `actor` |
| `caseDetail.timeline.roleAdmin` | `ActivityTimeline` > `p` actor (`ActivityTimeline.tsx:69`) | Item | Admin | — | Role người thực hiện |
| `caseDetail.timeline.roleSupporter` | `ActivityTimeline` > `p` actor (`ActivityTimeline.tsx:69`) | Item | Supporter | — | Role người thực hiện |
| `caseDetail.timeline.roleStudent` | `ActivityTimeline` > `p` actor (`ActivityTimeline.tsx:69`) | Item | Sinh viên | — | Role người thực hiện |
| `caseDetail.timeline.event.caseCreated` | `EVENT_MAP.case_created` (`event-details.ts:28–29`) | Item | Khởi tạo hồ sơ — Hồ sơ phản biện đã được khởi tạo trên hệ thống. | — | Event `case_created` |
| `caseDetail.timeline.event.caseSubmitted` | `EVENT_MAP.case_submitted` (`event-details.ts:40–41`) | Item | Hồ sơ đã nộp — Hồ sơ phản biện đã được gửi lên hệ thống thành công và đang chờ xét duyệt. | — | Event `case_submitted` |
| `caseDetail.timeline.event.caseAccepted` | `EVENT_MAP.case_accepted` (`event-details.ts:46–47`) | Item | Hồ sơ được duyệt — Hồ sơ đã được quản trị viên duyệt và chấp nhận. | — | Event `case_accepted` |
| `caseDetail.timeline.event.caseRejected` | `EVENT_MAP.case_rejected` (`event-details.ts:52–53`) | Item | Hồ sơ bị từ chối — Hồ sơ không được chấp nhận phê duyệt. | — | Event `case_rejected` |
| `caseDetail.timeline.event.caseResubmitted` | `EVENT_MAP.case_resubmitted` (`event-details.ts:58–59`) | Item | Nộp lại hồ sơ — Hồ sơ đã được nộp lại sau khi chỉnh sửa và đang chờ xét duyệt. | — | Event `case_resubmitted` |
| `caseDetail.timeline.event.supporterAssigned` | `EVENT_MAP.supporter_assigned` (`event-details.ts:64–65`) | Item | Đã phân công người hỗ trợ — Người hỗ trợ đã được phân công để đánh giá và phản biện hồ sơ. | — | Event `supporter_assigned` |
| `caseDetail.timeline.event.moreInfoRequested` | `EVENT_MAP.more_info_requested` (`event-details.ts:70–71`) | Item | Yêu cầu bổ sung thông tin — Yêu cầu cập nhật hoặc làm rõ thêm thông tin hồ sơ. | — | Event `more_info_requested` |
| `caseDetail.timeline.event.revisionSubmitted` | `EVENT_MAP.revision_submitted` (`event-details.ts:76–77`) | Item | Đã nộp bản sửa đổi — Bản sửa đổi hồ sơ đã được nộp thành công. | — | Event `revision_submitted` |
| `caseDetail.timeline.event.revisionRecalled` | `EVENT_MAP.revision_recalled` (`event-details.ts:82–83`) | Item | Bản sửa đổi đã được thu hồi — Bản sửa đổi đã được thu hồi và không còn hiệu lực. | — | Event `revision_recalled` |
| `caseDetail.timeline.event.paymentSubmitted` | `EVENT_MAP.payment_submitted` (`event-details.ts:94–95`) | Item | Nộp minh chứng thanh toán — Minh chứng chuyển khoản ngân hàng được tải lên hệ thống. | — | Event `payment_submitted` |
| `caseDetail.timeline.event.fallbackDesc` | `FALLBACK.desc` (`event-details.ts:341`) | Description | Sự kiện hệ thống ghi nhận. | — | Fallback cho sự kiện chưa có định nghĩa |

---

### 2.13 Tab Cài đặt hồ sơ & Vùng nguy hiểm (TabCaseSettings & Delete Modal)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/TabCaseSettings.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.settings.title` | `TabCaseSettings` > `h3` (`TabCaseSettings.tsx:122`) | Heading | Cài đặt thông tin hồ sơ | — | default |
| `caseDetail.settings.desc` | `TabCaseSettings` > `p` (`TabCaseSettings.tsx:124–126`) | Description | Cập nhật tên nhóm, trường học và bối cảnh lớp học để báo cáo phản biện hiển thị chính xác. | — | default |
| `caseDetail.settings.teamName.label` | `TabCaseSettings` > `TextInput` label (`TabCaseSettings.tsx:132`) | Label | Tên nhóm / Tên đề tài | — | Bắt buộc (`withAsterisk`) |
| `caseDetail.settings.teamName.placeholder` | `TabCaseSettings` > `TextInput` placeholder (`TabCaseSettings.tsx:133`) | Placeholder | Nhập tên nhóm hoặc đề tài | — | default |
| `caseDetail.settings.teamName.error` | `TabCaseSettings` > validation error (`TabCaseSettings.tsx:56`) | Error | Tên nhóm / Tên đề tài là bắt buộc. | — | Khi để trống |
| `caseDetail.settings.groupNo.label` | `TabCaseSettings` > `TextInput` label (`TabCaseSettings.tsx:145`) | Label | Mã số nhóm / Số thứ tự | — | default |
| `caseDetail.settings.groupNo.placeholder` | `TabCaseSettings` > `TextInput` placeholder (`TabCaseSettings.tsx:146`) | Placeholder | Ví dụ: 5 | — | default |
| `caseDetail.settings.school.label` | `TabCaseSettings` > `TextInput` label (`TabCaseSettings.tsx:157`) | Label | Trường học / Viện đào tạo | — | Bắt buộc (`withAsterisk`) |
| `caseDetail.settings.school.placeholder` | `TabCaseSettings` > `TextInput` placeholder (`TabCaseSettings.tsx:158`) | Placeholder | Ví dụ: Đại học FPT | — | default |
| `caseDetail.settings.school.error` | `TabCaseSettings` > validation error (`TabCaseSettings.tsx:57`) | Error | Trường học / Viện đào tạo là bắt buộc. | — | Khi để trống |
| `caseDetail.settings.course.label` | `TabCaseSettings` > `TextInput` label (`TabCaseSettings.tsx:170`) | Label | Lớp học / Môn học | — | Bắt buộc (`withAsterisk`) |
| `caseDetail.settings.course.placeholder` | `TabCaseSettings` > `TextInput` placeholder (`TabCaseSettings.tsx:171`) | Placeholder | Ví dụ: EXE101 | — | default |
| `caseDetail.settings.course.error` | `TabCaseSettings` > validation error (`TabCaseSettings.tsx:58`) | Error | Lớp học / Môn học là bắt buộc. | — | Khi để trống |
| `caseDetail.settings.btnSubmit` | `TabCaseSettings` > `Button` (`TabCaseSettings.tsx:191`) | CTA | Lưu thay đổi | Gửi `PUT /cases/${id}/settings` | default |
| `caseDetail.settings.btnSubmitLoading` | `TabCaseSettings` > `Button` (`TabCaseSettings.tsx:191`) | CTA | Đang lưu... | — | Loading khi `isUpdatingSettings` |
| `caseDetail.settings.danger.title` | `TabCaseSettings` > `h4` (`TabCaseSettings.tsx:201`) | Heading | Vùng nguy hiểm | — | Hiển thị khi `stage === "submitted"` |
| `caseDetail.settings.danger.desc` | `TabCaseSettings` > `p` (`TabCaseSettings.tsx:203–205`) | Description | Hồ sơ này chưa được admin duyệt. Bạn có thể xóa vĩnh viễn hồ sơ này. Hành động này không thể hoàn tác. | — | default |
| `caseDetail.settings.danger.btnOpen` | `TabCaseSettings` > `Button` đỏ outline (`TabCaseSettings.tsx:214`) | CTA | Xóa hồ sơ dự án | Mở modal xác nhận xóa hồ sơ | default |
| `caseDetail.settings.deleteModal.title` | `TabCaseSettings` > `Modal` title (`TabCaseSettings.tsx:230`) | Modal | Xác nhận xóa hồ sơ dự án | — | Khi modal mở |
| `caseDetail.settings.deleteModal.desc` | `TabCaseSettings` > `Modal` p (`TabCaseSettings.tsx:238–240`) | Description | Hành động này sẽ xóa vĩnh viễn hồ sơ dự án này, bao gồm toàn bộ tài liệu đính kèm, các phiên bản và lịch sử trao đổi. Dữ liệu đã xóa không thể khôi phục. | — | default |
| `caseDetail.settings.deleteModal.inputLabel` | `TabCaseSettings` > `TextInput` label (`TabCaseSettings.tsx:243`) | Label | Để xác nhận, vui lòng nhập chính xác chữ 'DELETE' vào ô bên dưới: | — | default |
| `caseDetail.settings.deleteModal.inputPlaceholder` | `TabCaseSettings` > `TextInput` placeholder (`TabCaseSettings.tsx:244`) | Placeholder | DELETE | — | default |
| `caseDetail.settings.deleteModal.btnCancel` | `TabCaseSettings` > `Button` (`TabCaseSettings.tsx:260`) | CTA | Hủy | Đóng modal xóa | default |
| `caseDetail.settings.deleteModal.btnConfirm` | `TabCaseSettings` > `Button` đỏ (`TabCaseSettings.tsx:270`) | CTA | Tôi hiểu và muốn xóa | Gửi `DELETE /cases/${id}` | Disabled khi `deleteConfirmText !== "DELETE"` |
| `caseDetail.settings.deleteModal.btnConfirmLoading` | `TabCaseSettings` > `Button` đỏ (`TabCaseSettings.tsx:270`) | CTA | Đang xóa... | — | Loading khi `isDeletingCase` |

---

### 2.14 Modal Tải tài liệu bản sửa (StudentDocumentUploadModal)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/StudentDocumentUploadModal.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.uploadStudent.modalTitle` | `StudentDocumentUploadModal` > `Modal` title (`StudentDocumentUploadModal.tsx:97`) | Modal | Tải tài liệu bản sửa | — | Khi modal mở |
| `caseDetail.uploadStudent.fileLabel` | `StudentDocumentUploadModal` > label (`StudentDocumentUploadModal.tsx:114`) | Label | Tài liệu đính kèm | — | default |
| `caseDetail.uploadStudent.fileMaxHint` | `StudentDocumentUploadModal` > span (`StudentDocumentUploadModal.tsx:115`) | Helper | Tối đa 5 tài liệu | — | default |
| `caseDetail.uploadStudent.dropzoneAccept` | `Dropzone.Accept` (`StudentDocumentUploadModal.tsx:131`) | Status | Thả tệp vào đây để tải lên | — | Khi kéo tệp hợp lệ vào dropzone |
| `caseDetail.uploadStudent.dropzoneReject` | `Dropzone.Reject` (`StudentDocumentUploadModal.tsx:138`) | Error | Tệp không đúng định dạng hoặc vượt quá 15MB | — | Khi kéo tệp sai định dạng/quá dung lượng |
| `caseDetail.uploadStudent.dropzoneIdleMain` | `Dropzone.Idle` (`StudentDocumentUploadModal.tsx:148–150`) | Placeholder | Kéo thả hoặc bấm để chọn tài liệu bài làm | — | Chữ "bấm để chọn tài liệu" gạch chân |
| `caseDetail.uploadStudent.dropzoneIdleSub` | `Dropzone.Idle` (`StudentDocumentUploadModal.tsx:151–153`) | Helper | Hỗ trợ PDF, DOCX, XLSX, PPTX, MD, TXT. Tối đa 15MB mỗi tệp. | — | default |
| `caseDetail.uploadStudent.listHeader` | `StudentDocumentUploadModal` > span (`StudentDocumentUploadModal.tsx:162`) | Label | Danh sách tài liệu đã chọn: | — | Hiển thị khi `files.length > 0` |
| `caseDetail.uploadStudent.listCount` | `StudentDocumentUploadModal` > span (`StudentDocumentUploadModal.tsx:163`) | Item | `{files.length}/5 tệp` | — | default |
| `caseDetail.uploadStudent.removeTooltip` | `StudentDocumentUploadModal` > button title (`StudentDocumentUploadModal.tsx:184`) | Helper | Gỡ tệp | Xóa tệp khỏi danh sách chờ nộp | default |
| `caseDetail.uploadStudent.noteLabel` | `StudentDocumentUploadModal` > `Textarea` label (`StudentDocumentUploadModal.tsx:196`) | Label | Tóm tắt thay đổi (Tùy chọn) | — | default |
| `caseDetail.uploadStudent.notePlaceholder` | `StudentDocumentUploadModal` > `Textarea` placeholder (`StudentDocumentUploadModal.tsx:197`) | Placeholder | Mô tả các nội dung nhóm đã cập nhật hoặc bổ sung trong bản này... | — | default |
| `caseDetail.uploadStudent.btnCancel` | `StudentDocumentUploadModal` > `Button` (`StudentDocumentUploadModal.tsx:209`) | CTA | Hủy bỏ | Đóng modal tải tài liệu | default |
| `caseDetail.uploadStudent.btnSubmit` | `StudentDocumentUploadModal` > `Button` (`StudentDocumentUploadModal.tsx:219`) | CTA | Tải lên bản sửa | Gửi upload tệp qua API | Disabled khi `!isFormValid \|\| isSubmitting` |
| `caseDetail.uploadStudent.btnSubmitLoading` | `StudentDocumentUploadModal` > `Button` (`StudentDocumentUploadModal.tsx:219`) | CTA | Đang tải lên... | — | Loading khi `isSubmitting` |
| `caseDetail.uploadStudent.errMaxFiles` | `StudentDocumentUploadModal` > error setter (`StudentDocumentUploadModal.tsx:38`) | Error | `Chỉ được tải tối đa 5 tài liệu. Bạn đã chọn {combined.length} tệp.` | — | Khi chọn quá 5 tệp |
| `caseDetail.uploadStudent.errTooLarge` | `StudentDocumentUploadModal` > error setter (`StudentDocumentUploadModal.tsx:69`) | Error | Mỗi tệp tối đa 15MB. | — | Khi tệp > 15MB |
| `caseDetail.uploadStudent.errFormat` | `StudentDocumentUploadModal` > error setter (`StudentDocumentUploadModal.tsx:72`) | Error | Định dạng tệp không được hỗ trợ. Vui lòng dùng PDF, DOCX, XLSX, PPTX, MD hoặc TXT. | — | Khi sai đuôi tệp |
| `caseDetail.uploadStudent.errGeneric` | `StudentDocumentUploadModal` > error setter (`StudentDocumentUploadModal.tsx:62`) | Error | Đã xảy ra lỗi khi tải tài liệu. | — | Khi API upload thất bại |

---

### 2.15 Modal Tải đánh giá bên ngoài (ExternalFeedbackUploadModal)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/ExternalFeedbackUploadModal.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.uploadFeedback.modalTitle` | `ExternalFeedbackUploadModal` > `Modal` title (`ExternalFeedbackUploadModal.tsx:167`) | Modal | Tải đánh giá bên ngoài | — | Khi modal mở |
| `caseDetail.uploadFeedback.docTypeLabel` | `ExternalFeedbackUploadModal` > `Select` label (`ExternalFeedbackUploadModal.tsx:184`) | Label | Loại tài liệu | — | Bắt buộc (`required`) |
| `caseDetail.uploadFeedback.docTypePlaceholder` | `ExternalFeedbackUploadModal` > `Select` placeholder (`ExternalFeedbackUploadModal.tsx:185`) | Placeholder | Chọn loại tài liệu | — | default |
| `caseDetail.uploadFeedback.sourceLabel` | `ExternalFeedbackUploadModal` > `Select` label (`ExternalFeedbackUploadModal.tsx:195`) | Label | Nguồn đánh giá | — | Bắt buộc (`required`) |
| `caseDetail.uploadFeedback.sourcePlaceholder` | `ExternalFeedbackUploadModal` > `Select` placeholder (`ExternalFeedbackUploadModal.tsx:196`) | Placeholder | Chọn nguồn | — | default |
| `caseDetail.uploadFeedback.optLecturer` | `sourceOptions` (`ExternalFeedbackUploadModal.tsx:61`) | Item | Giảng viên | — | Option value `lecturer` |
| `caseDetail.uploadFeedback.optMentor` | `sourceOptions` (`ExternalFeedbackUploadModal.tsx:62`) | Item | Mentor | — | Option value `mentor` |
| `caseDetail.uploadFeedback.optOther` | `sourceOptions` (`ExternalFeedbackUploadModal.tsx:63`) | Item | Nguồn khác | — | Option value `other` |
| `caseDetail.uploadFeedback.otherInputLabel` | `ExternalFeedbackUploadModal` > `TextInput` label (`ExternalFeedbackUploadModal.tsx:208`) | Label | Nguồn khác | — | Hiển thị khi `source === "other"` |
| `caseDetail.uploadFeedback.otherInputPlaceholder` | `ExternalFeedbackUploadModal` > `TextInput` placeholder (`ExternalFeedbackUploadModal.tsx:209`) | Placeholder | Nhập nguồn đánh giá | — | Hiển thị khi `source === "other"` |
| `caseDetail.uploadFeedback.timingLabel` | `ExternalFeedbackUploadModal` > `Select` label (`ExternalFeedbackUploadModal.tsx:220`) | Label | Thời điểm đánh giá | — | Bắt buộc (`required`) |
| `caseDetail.uploadFeedback.timingPlaceholder` | `ExternalFeedbackUploadModal` > `Select` placeholder (`ExternalFeedbackUploadModal.tsx:221`) | Placeholder | Chọn thời điểm | — | default |
| `caseDetail.uploadFeedback.optPreSupport` | `timingOptions` (`ExternalFeedbackUploadModal.tsx:67`) | Item | Trước hỗ trợ | — | Option value `pre_support` |
| `caseDetail.uploadFeedback.optPostSupport` | `timingOptions` (`ExternalFeedbackUploadModal.tsx:68`) | Item | Sau hỗ trợ | — | Option value `post_support` |
| `caseDetail.uploadFeedback.versionLabel` | `ExternalFeedbackUploadModal` > `Select` label (`ExternalFeedbackUploadModal.tsx:231`) | Label | Phiên bản áp dụng | — | Bắt buộc (`required`) |
| `caseDetail.uploadFeedback.versionPlaceholder` | `ExternalFeedbackUploadModal` > `Select` placeholder (`ExternalFeedbackUploadModal.tsx:232`) | Placeholder | Chọn phiên bản | — | default |
| `caseDetail.uploadFeedback.versionPattern` | `versionOptions` (`ExternalFeedbackUploadModal.tsx:74`) | Item | `Phiên bản {i}` | — | Tùy chọn 1 đến `latestVersionNo` |
| `caseDetail.uploadFeedback.fileLabel` | `ExternalFeedbackUploadModal` > label (`ExternalFeedbackUploadModal.tsx:244`) | Label | Tệp đánh giá đính kèm | — | default |
| `caseDetail.uploadFeedback.fileMaxHint` | `ExternalFeedbackUploadModal` > span (`ExternalFeedbackUploadModal.tsx:245`) | Helper | Tối đa 5 tệp | — | default |
| `caseDetail.uploadFeedback.dropzoneAccept` | `Dropzone.Accept` (`ExternalFeedbackUploadModal.tsx:261`) | Status | Thả tệp vào đây để tải lên | — | Khi kéo tệp hợp lệ |
| `caseDetail.uploadFeedback.dropzoneReject` | `Dropzone.Reject` (`ExternalFeedbackUploadModal.tsx:268`) | Error | Tệp không đúng định dạng hoặc vượt quá 15MB | — | Khi kéo tệp sai định dạng/dung lượng |
| `caseDetail.uploadFeedback.dropzoneIdleMain` | `Dropzone.Idle` (`ExternalFeedbackUploadModal.tsx:279`) | Placeholder | Kéo thả hoặc bấm để chọn tệp đánh giá | — | Chữ "bấm để chọn tệp" gạch chân |
| `caseDetail.uploadFeedback.dropzoneIdleSub` | `Dropzone.Idle` (`ExternalFeedbackUploadModal.tsx:281–283`) | Helper | Hỗ trợ PDF, DOCX, XLSX, PPTX, MD, TXT. Tối đa 15MB mỗi tệp. | — | default |
| `caseDetail.uploadFeedback.listHeader` | `ExternalFeedbackUploadModal` > span (`ExternalFeedbackUploadModal.tsx:292`) | Label | Danh sách tệp đã chọn: | — | Hiển thị khi `files.length > 0` |
| `caseDetail.uploadFeedback.listCount` | `ExternalFeedbackUploadModal` > span (`ExternalFeedbackUploadModal.tsx:293`) | Item | `{files.length}/5 tệp` | — | default |
| `caseDetail.uploadFeedback.removeTooltip` | `ExternalFeedbackUploadModal` > button title (`ExternalFeedbackUploadModal.tsx:314`) | Helper | Gỡ tệp | Xóa tệp khỏi danh sách chờ nộp | default |
| `caseDetail.uploadFeedback.noteLabel` | `ExternalFeedbackUploadModal` > `Textarea` label (`ExternalFeedbackUploadModal.tsx:326`) | Label | Ghi chú (Tùy chọn) | — | default |
| `caseDetail.uploadFeedback.notePlaceholder` | `ExternalFeedbackUploadModal` > `Textarea` placeholder (`ExternalFeedbackUploadModal.tsx:327`) | Placeholder | Mô tả ngắn về đánh giá này... | — | default |
| `caseDetail.uploadFeedback.btnCancel` | `ExternalFeedbackUploadModal` > `Button` (`ExternalFeedbackUploadModal.tsx:339`) | CTA | Hủy bỏ | Đóng modal tải đánh giá | default |
| `caseDetail.uploadFeedback.btnSubmit` | `ExternalFeedbackUploadModal` > `Button` (`ExternalFeedbackUploadModal.tsx:349`) | CTA | Tải đánh giá | Gửi tải đánh giá qua API | Disabled khi `!isFormValid \|\| isSubmitting` |
| `caseDetail.uploadFeedback.btnSubmitLoading` | `ExternalFeedbackUploadModal` > `Button` (`ExternalFeedbackUploadModal.tsx:349`) | CTA | Đang tải... | — | Loading khi `isSubmitting` |
| `caseDetail.uploadFeedback.errMaxFiles` | `ExternalFeedbackUploadModal` > error setter (`ExternalFeedbackUploadModal.tsx:82`) | Error | `Chỉ được tải tối đa 5 tệp đánh giá. Bạn đã chọn {combined.length} tệp.` | — | Khi chọn quá 5 tệp |
| `caseDetail.uploadFeedback.errNoSource` | `ExternalFeedbackUploadModal` > error setter (`ExternalFeedbackUploadModal.tsx:92`) | Error | Vui lòng chọn nguồn đánh giá | — | Khi chưa chọn nguồn |
| `caseDetail.uploadFeedback.errNoOtherText` | `ExternalFeedbackUploadModal` > error setter (`ExternalFeedbackUploadModal.tsx:96`) | Error | Vui lòng nhập nguồn khác | — | Khi chọn "Nguồn khác" nhưng để trống ô nhập |
| `caseDetail.uploadFeedback.errNoTiming` | `ExternalFeedbackUploadModal` > error setter (`ExternalFeedbackUploadModal.tsx:100`) | Error | Vui lòng chọn thời điểm đánh giá | — | Khi chưa chọn thời điểm |
| `caseDetail.uploadFeedback.errTooLarge` | `ExternalFeedbackUploadModal` > error setter (`ExternalFeedbackUploadModal.tsx:128`) | Error | Mỗi tệp tối đa 15MB. | — | Khi tệp vượt quá 15MB |
| `caseDetail.uploadFeedback.errFormat` | `ExternalFeedbackUploadModal` > error setter (`ExternalFeedbackUploadModal.tsx:131`) | Error | Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp PDF, DOCX, XLSX, PPTX, MD hoặc TXT. | — | Khi định dạng không đúng |
| `caseDetail.uploadFeedback.errGeneric` | `ExternalFeedbackUploadModal` > error setter (`ExternalFeedbackUploadModal.tsx:121`) | Error | Đã xảy ra lỗi khi tải đánh giá. | — | Khi API thất bại |

---

### 2.16 Modal Chọn gói dịch vụ (PackageSelectionModal)

*Nguồn: `apps/web-1/app/dashboard/_components/PackageSelectionModal.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.pkgSelect.modalTitle` | `PackageSelectionModal` > `Modal` title (`PackageSelectionModal.tsx:40`) | Modal | Chọn gói kiểm tra | — | Khi modal mở |
| `caseDetail.pkgSelect.basic.badge` | `PackageSelectionModal` > Card Basic > `Badge` (`PackageSelectionModal.tsx:53`) | Badge | Khuyên dùng | — | Gói Basic AI Audit |
| `caseDetail.pkgSelect.basic.title` | `PackageSelectionModal` > Card Basic > `h4` (`PackageSelectionModal.tsx:57`) | Heading | Basic AI Audit | — | default |
| `caseDetail.pkgSelect.basic.price` | `PackageSelectionModal` > Card Basic > span (`PackageSelectionModal.tsx:59–60`) | Item | 79,000 VND | — | default |
| `caseDetail.pkgSelect.basic.desc` | `PackageSelectionModal` > Card Basic > `Text` (`PackageSelectionModal.tsx:63`) | Description | Phân tích tự động bằng AI. Báo cáo trả về tức thì. | — | default |
| `caseDetail.pkgSelect.basic.feat1` | `PackageSelectionModal` > Card Basic > `List.Item` (`PackageSelectionModal.tsx:75`) | Item | Chấm điểm theo Rubric | — | default |
| `caseDetail.pkgSelect.basic.feat2` | `PackageSelectionModal` > Card Basic > `List.Item` (`PackageSelectionModal.tsx:76`) | Item | Xác định lỗi Logic cơ bản | — | default |
| `caseDetail.pkgSelect.basic.feat3` | `PackageSelectionModal` > Card Basic > `List.Item` (`PackageSelectionModal.tsx:77`) | Item | Trả kết quả tức thì | — | default |
| `caseDetail.pkgSelect.basic.cta` | `PackageSelectionModal` > Card Basic > `Button` (`PackageSelectionModal.tsx:86`) | CTA | Chọn Basic AI | Chọn gói `pkg_ai_audit` và mở `CreditQuantityModal` | default |
| `caseDetail.pkgSelect.mentor.badge` | `PackageSelectionModal` > Card Mentor > `Badge` (`PackageSelectionModal.tsx:94`) | Badge | Sắp ra mắt | — | Gói Premium Mentor |
| `caseDetail.pkgSelect.mentor.title` | `PackageSelectionModal` > Card Mentor > `h4` (`PackageSelectionModal.tsx:98`) | Heading | Premium Mentor Audit | — | default |
| `caseDetail.pkgSelect.mentor.price` | `PackageSelectionModal` > Card Mentor > span (`PackageSelectionModal.tsx:100–101`) | Item | 149,000 VND | — | default |
| `caseDetail.pkgSelect.mentor.desc` | `PackageSelectionModal` > Card Mentor > `Text` (`PackageSelectionModal.tsx:104`) | Description | Mentor FPT trực tiếp review, sửa lỗi chặn và định hướng thực chiến. | — | default |
| `caseDetail.pkgSelect.mentor.feat1` | `PackageSelectionModal` > Card Mentor > `List.Item` (`PackageSelectionModal.tsx:116`) | Item | Bao gồm tính năng của Basic AI | — | default |
| `caseDetail.pkgSelect.mentor.feat2` | `PackageSelectionModal` > Card Mentor > `List.Item` (`PackageSelectionModal.tsx:117`) | Item | Định hướng sửa bài thực chiến | — | default |
| `caseDetail.pkgSelect.mentor.feat3` | `PackageSelectionModal` > Card Mentor > `List.Item` (`PackageSelectionModal.tsx:118`) | Item | Nhận báo cáo sau 24h-48h | — | default |
| `caseDetail.pkgSelect.mentor.cta` | `PackageSelectionModal` > Card Mentor > `Button` (`PackageSelectionModal.tsx:128`) | CTA | Sắp ra mắt | — | Disabled / Con trỏ `cursor-not-allowed` |

---

### 2.17 Modal Mua & Thanh toán Credit (CreditQuantityModal & UnpaidAlertBanner)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/CreditQuantityModal.tsx`, `UnpaidAlertBanner.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.unpaidBanner.title` | `UnpaidAlertBanner` > `h4` (`UnpaidAlertBanner.tsx:21`) | Heading | Chưa có credit | — | Hiển thị khi `(creditBalance ?? 0) <= 0` |
| `caseDetail.unpaidBanner.desc` | `UnpaidAlertBanner` > `p` (`UnpaidAlertBanner.tsx:22–24`) | Description | Bạn cần mua credit để kích hoạt quy trình phản biện từ Supporter. Mỗi credit tương ứng với một lượt đánh giá. | — | default |
| `caseDetail.unpaidBanner.cta` | `UnpaidAlertBanner` > `Button` (`UnpaidAlertBanner.tsx:33`) | CTA | Mua credit | Mở `CreditQuantityModal` | default |
| `caseDetail.creditModal.title` | `CreditQuantityModal` > `Modal` title (`CreditQuantityModal.tsx:103`) | Modal | Thanh toán gói đánh giá | — | Khi modal mở |
| `caseDetail.creditModal.quantityLabel` | `CreditQuantityModal` > `NumberInput` label (`CreditQuantityModal.tsx:111`) | Label | Số lượng credit | — | Ẩn khi `isAiAudit === true` |
| `caseDetail.creditModal.quantityDesc` | `CreditQuantityModal` > `NumberInput` desc (`CreditQuantityModal.tsx:112`) | Helper | Từ 1 đến 50 credit | — | Ẩn khi `isAiAudit === true` |
| `caseDetail.creditModal.priceLabel` | `CreditQuantityModal` > Card giá > span (`CreditQuantityModal.tsx:124`) | Label | Đơn giá | — | default |
| `caseDetail.creditModal.quantitySummaryLabel` | `CreditQuantityModal` > Card giá > span (`CreditQuantityModal.tsx:129`) | Label | Số lượng | — | Ẩn khi `isAiAudit === true` |
| `caseDetail.creditModal.totalLabel` | `CreditQuantityModal` > Card giá > span (`CreditQuantityModal.tsx:134`) | Label | Tổng thanh toán | — | default |
| `caseDetail.creditModal.walletCurrentLabel` | `CreditQuantityModal` > Paper ví > span (`CreditQuantityModal.tsx:142`) | Label | Số dư ví hiện tại | — | default |
| `caseDetail.creditModal.walletAfterLabel` | `CreditQuantityModal` > Paper ví > span (`CreditQuantityModal.tsx:146`) | Label | Số dư sau thanh toán | — | default |
| `caseDetail.creditModal.walletStatusLabel` | `CreditQuantityModal` > Paper ví > span (`CreditQuantityModal.tsx:150`) | Label | Tình trạng ví | — | default |
| `caseDetail.creditModal.walletSufficient` | `CreditQuantityModal` > Paper ví > span (`CreditQuantityModal.tsx:152`) | Status | Đủ số dư ví | — | Hiển thị khi `hasSufficientBalance === true` (màu xanh teal) |
| `caseDetail.creditModal.walletShortage` | `CreditQuantityModal` > Paper ví > span (`CreditQuantityModal.tsx:152`) | Status | `Số dư không đủ — thiếu {formatPrice(shortage)}` | — | Hiển thị khi `hasSufficientBalance === false` (màu đỏ) |
| `caseDetail.creditModal.btnCancel` | `CreditQuantityModal` > `Button` (`CreditQuantityModal.tsx:160`) | CTA | Hủy | Đóng modal thanh toán | Disabled khi mutation đang chạy |
| `caseDetail.creditModal.btnPay` | `CreditQuantityModal` > `Button` (`CreditQuantityModal.tsx:168`) | CTA | `Thanh toán {formatPrice(totalAmount)}` | Gọi `POST /orders` trừ tiền ví | Hiển thị khi `hasSufficientBalance === true` |
| `caseDetail.creditModal.btnTopupAndPay` | `CreditQuantityModal` > `Button` (`CreditQuantityModal.tsx:168`) | CTA | Nạp & Thanh toán qua VietQR | Kích hoạt `startShortageDeposit` -> chuyển hướng `/dashboard/payment?pid=...` | Hiển thị khi `hasSufficientBalance === false` |
| `caseDetail.creditModal.errInline` | `CreditQuantityModal` > `Text` đỏ (`CreditQuantityModal.tsx:175–176`) | Error | `Đã xảy ra lỗi khi tạo đơn hàng.` | — | Hiển thị khi mutation thất bại |

---

### 2.18 Thông báo hệ thống & Toasts (System Notifications & Errors)

*Nguồn: Toàn bộ các hook và component trong không gian làm việc chi tiết hồ sơ*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `caseDetail.toast.deletedCase.title` | `useCaseDetails` > `notifications.show` (`useCaseDetails.ts:47`) | Toast | Hồ sơ đã bị xóa | — | Khi API trả về 404 |
| `caseDetail.toast.deletedCase.msg` | `useCaseDetails` > `notifications.show` (`useCaseDetails.ts:48`) | Toast | Hồ sơ này không còn tồn tại. Bạn sẽ được chuyển về trang tổng quan. | — | Tự động điều hướng về `/dashboard` |
| `caseDetail.toast.confirmComplete.successTitle` | `useCaseDetails` > `notifications.show` (`useCaseDetails.ts:97`) | Toast | Đã xác nhận hoàn thành | — | Khi xác nhận hoàn thành case thành công |
| `caseDetail.toast.confirmComplete.successMsg` | `useCaseDetails` > `notifications.show` (`useCaseDetails.ts:98`) | Toast | Quy trình phản biện đã được đóng. | — | Màu xanh green |
| `caseDetail.toast.confirmComplete.errorTitle` | `useCaseDetails` > `notifications.show` (`useCaseDetails.ts:104`) | Toast | Lỗi | — | Khi xác nhận hoàn thành case thất bại |
| `caseDetail.toast.confirmComplete.errorMsg` | `useCaseDetails` > `notifications.show` (`useCaseDetails.ts:105`) | Toast | Không thể xác nhận hoàn thành. Vui lòng thử lại. | — | Màu đỏ |
| `caseDetail.toast.triggerAudit.successTitle` | `useTriggerAudit` > `notifications.show` (`useTriggerAudit.ts:33`) | Toast | Đã gửi đánh giá | — | Khi gửi trigger đánh giá thành công |
| `caseDetail.toast.triggerAudit.successMsg` | `useTriggerAudit` > `notifications.show` (`useTriggerAudit.ts:34`) | Toast | Hệ thống đang tiến hành thẩm định. Kết quả sẽ có trong vài phút. | — | Màu xanh teal |
| `caseDetail.toast.triggerAudit.noCreditsTitle` | `useTriggerAudit` / `useCaseAiStatus` > `notifications.show` (`useTriggerAudit.ts:46`, `useCaseAiStatus.ts:78`) | Toast | Không đủ credit | — | Khi mã lỗi là 402 hoặc `NO_CREDITS` |
| `caseDetail.toast.triggerAudit.noCreditsMsg` | `useTriggerAudit` / `useCaseAiStatus` > `notifications.show` (`useTriggerAudit.ts:47`, `useCaseAiStatus.ts:79`) | Toast | Bạn đã hết credit đánh giá. Vui lòng mua thêm credit để tiếp tục. | — | Màu cam orange |
| `caseDetail.toast.triggerAudit.needUploadTitle` | `useTriggerAudit` > `notifications.show` (`useTriggerAudit.ts:55`) | Toast | Cần tải tài liệu sửa đổi | — | Khi mã lỗi là `RESUBMIT_REQUIRES_UPLOAD` |
| `caseDetail.toast.triggerAudit.needUploadMsg` | `useTriggerAudit` > `notifications.show` (`useTriggerAudit.ts:56`) | Toast | Vui lòng tải lên tài liệu đã sửa trước khi gửi đánh giá lại. | — | Màu cam orange |
| `caseDetail.toast.triggerAudit.inProgressTitle` | `useTriggerAudit` / `useCaseAiStatus` > `notifications.show` (`useTriggerAudit.ts:64`, `useCaseAiStatus.ts:86`) | Toast | Đánh giá đang diễn ra | — | Khi mã lỗi là `AUDIT_IN_PROGRESS` hoặc status 409 |
| `caseDetail.toast.triggerAudit.inProgressMsg` | `useTriggerAudit` / `useCaseAiStatus` > `notifications.show` (`useTriggerAudit.ts:65`, `useCaseAiStatus.ts:87`) | Toast | Hệ thống đang thẩm định. Vui lòng chờ kết quả trước khi gửi lại. | — | Màu xanh blue |
| `caseDetail.toast.triggerAudit.failTitle` | `useTriggerAudit` > `notifications.show` (`useTriggerAudit.ts:72`) | Toast | Gửi đánh giá thất bại | — | Khi trigger audit thất bại |
| `caseDetail.toast.triggerAudit.failMsgFallback` | `useTriggerAudit` > `notifications.show` (`useTriggerAudit.ts:73`) | Toast | Đã xảy ra lỗi. Vui lòng thử lại sau. | — | Fallback khi không có message |
| `caseDetail.toast.aiCancel.failTitle` | `useCaseAiStatus` > `notifications.show` (`useCaseAiStatus.ts:55`) | Toast | Hủy thất bại | — | Khi hủy tiến trình AI thất bại |
| `caseDetail.toast.aiCancel.failMsg` | `useCaseAiStatus` > `notifications.show` (`useCaseAiStatus.ts:56`) | Toast | Không hủy được tiến trình. Vui lòng thử lại. | — | Màu đỏ |
| `caseDetail.toast.aiRetry.failTitle` | `useCaseAiStatus` > `notifications.show` (`useCaseAiStatus.ts:93`) | Toast | Chạy lại thất bại | — | Khi chạy lại tiến trình AI thất bại |
| `caseDetail.toast.aiRetry.failMsgFallback` | `useCaseAiStatus` > `notifications.show` (`useCaseAiStatus.ts:94`) | Toast | Đã xảy ra lỗi. Vui lòng thử lại sau. | — | Fallback khi không có message |
| `caseDetail.toast.uploadStudent.successTitle` | `StudentDocumentUploadModal` > `notifications.show` (`StudentDocumentUploadModal.tsx:53`) | Toast | Tải tài liệu thành công | — | Khi tải tài liệu bản sửa thành công |
| `caseDetail.toast.uploadStudent.successMsg` | `StudentDocumentUploadModal` > `notifications.show` (`StudentDocumentUploadModal.tsx:54`) | Toast | Đã tải tài liệu bản sửa thành công. | — | Màu xanh green |
| `caseDetail.toast.uploadFeedback.successTitle` | `ExternalFeedbackUploadModal` > `notifications.show` (`ExternalFeedbackUploadModal.tsx:115`) | Toast | Tải đánh giá thành công | — | Khi tải đánh giá bên ngoài thành công |
| `caseDetail.toast.uploadFeedback.successMsg` | `ExternalFeedbackUploadModal` > `notifications.show` (`ExternalFeedbackUploadModal.tsx:116`) | Toast | Đã tải đánh giá bên ngoài thành công. | — | Màu xanh green |
| `caseDetail.toast.settings.invalidTitle` | `TabCaseSettings` > `notifications.show` (`TabCaseSettings.tsx:63`) | Toast | Chưa thể lưu cài đặt | — | Khi form thiếu thông tin bắt buộc |
| `caseDetail.toast.settings.invalidMsg` | `TabCaseSettings` > `notifications.show` (`TabCaseSettings.tsx:64`) | Toast | Vui lòng kiểm tra và điền đầy đủ các trường thông tin bắt buộc. | — | Màu đỏ |
| `caseDetail.toast.settings.successTitle` | `TabCaseSettings` > `notifications.show` (`TabCaseSettings.tsx:81`) | Toast | Thành công | — | Khi cập nhật cài đặt thành công |
| `caseDetail.toast.settings.successMsg` | `TabCaseSettings` > `notifications.show` (`TabCaseSettings.tsx:82`) | Toast | Đã cập nhật thông tin hồ sơ thành công! | — | Màu xanh green |
| `caseDetail.toast.settings.errorTitle` | `TabCaseSettings` > `notifications.show` (`TabCaseSettings.tsx:87`) | Toast | Lỗi | — | Khi cập nhật cài đặt gặp lỗi |
| `caseDetail.toast.settings.errorFallback` | `TabCaseSettings` > `notifications.show` (`TabCaseSettings.tsx:88`) | Toast | Gặp lỗi khi lưu thông tin cài đặt. | — | Fallback |
| `caseDetail.toast.settings.deleteSuccessTitle` | `TabCaseSettings` > `notifications.show` (`TabCaseSettings.tsx:101`) | Toast | Thành công | — | Khi xóa hồ sơ thành công |
| `caseDetail.toast.settings.deleteSuccessMsg` | `TabCaseSettings` > `notifications.show` (`TabCaseSettings.tsx:102`) | Toast | Đã xóa hồ sơ dự án. | — | Điều hướng về `/dashboard` |
| `caseDetail.toast.settings.deleteErrorTitle` | `TabCaseSettings` > `notifications.show` (`TabCaseSettings.tsx:108`) | Toast | Lỗi | — | Khi xóa hồ sơ thất bại |
| `caseDetail.toast.settings.deleteErrorFallback` | `TabCaseSettings` > `notifications.show` (`TabCaseSettings.tsx:109`) | Toast | Gặp lỗi khi xóa hồ sơ dự án. | — | Fallback |
| `caseDetail.toast.pkgSelect.devTitle` | `PackageSelectionModal` > `notifications.show` (`PackageSelectionModal.tsx:21`) | Toast | Tính năng đang được phát triển | — | Khi bấm chọn gói Mentor Audit |
| `caseDetail.toast.pkgSelect.devMsg` | `PackageSelectionModal` > `notifications.show` (`PackageSelectionModal.tsx:22`) | Toast | Gói Premium Mentor Audit hiện đang được hoàn thiện. Vui lòng chọn gói Basic AI Audit (79.000đ) để được hỗ trợ tức thì! | — | Màu xanh blue |
| `caseDetail.toast.creditOrder.successTitle` | `CreditQuantityModal` > `notifications.show` (`CreditQuantityModal.tsx:57`) | Toast | Thanh toán thành công | — | Khi thanh toán mua credit thành công |
| `caseDetail.toast.creditOrder.successManual` | `CreditQuantityModal` > `notifications.show` (`CreditQuantityModal.tsx:59`) | Toast | `Đã mua {isAiAudit ? 2 : effectiveQuantity} credit. Quay lại hồ sơ để chọn loại đánh giá và gửi.` | — | Khi mua credit thủ công |
| `caseDetail.toast.creditOrder.successAuto` | `CreditQuantityModal` > `notifications.show` (`CreditQuantityModal.tsx:60`) | Toast | `Đơn hàng #{data.orderId} đã được thanh toán thành công.` | — | Màu xanh teal |
| `caseDetail.toast.creditOrder.errorTitle` | `CreditQuantityModal` > `notifications.show` (`CreditQuantityModal.tsx:78`) | Toast | Tạo đơn hàng thất bại | — | Khi tạo đơn hàng thất bại |
| `caseDetail.toast.creditOrder.errorFallback` | `CreditQuantityModal` > `notifications.show` (`CreditQuantityModal.tsx:79`) | Toast | Vui lòng thử lại sau. | — | Màu đỏ |

---

## Layer 3: Page Notes

### 3.1 Biến thể thuật ngữ xuất hiện trên trang (Terminology Variants)

1. **Khái niệm Người hỗ trợ / Thẩm định viên:**
   - Mã nguồn và giao diện sử dụng đan xen giữa các danh xưng:
     - `Supporter`: sử dụng phổ biến nhất ("Chat với Supporter", "Ghi chú thêm cho Supporter", "Mỗi credit tương ứng một lượt đánh giá từ Supporter", "Chờ phân công Supporter").
     - `Người hỗ trợ`: xuất hiện trong lịch sử hoạt động Timeline ("Đã phân công người hỗ trợ", "Người hỗ trợ đã được phân công để đánh giá và phản biện hồ sơ").
     - `Chuyên gia` / `Mentor`: xuất hiện trong thẻ chỉ dẫn ("để chuyên gia tiếp nhận, chấm điểm và trả báo cáo chi tiết"), trong modal chọn gói ("Premium Mentor Audit", "Mentor FPT trực tiếp review"), và trong nguồn đánh giá bên ngoài ("Mentor").
     - `Nexus AI` / `Nexus AI Engine`: xuất hiện trong luồng tự động ("Nexus AI đang tiến hành thẩm định dự án", "Khởi động tiến trình thẩm định tự động qua Nexus AI Engine", "Chạy lại Thẩm định AI", người tạo "Nexus AI").
2. **Khái niệm Hồ sơ / Dự án / Đề án / Đề tài:**
   - `Hồ sơ`: "Hồ sơ phản biện", "Khởi tạo hồ sơ", "Hồ sơ đã nộp", "Nộp hồ sơ khởi nghiệp", "Cài đặt thông tin hồ sơ", "Quay lại hồ sơ".
   - `Đề án`: "Đề án thẩm định", "Tiếp nhận đề án", "Tiến trình thẩm định AI cho đề án", "báo cáo thẩm định đề án".
   - `Dự án`: "Dự án đang trong quá trình phản biện", "Hồ sơ phản biện dự án của bạn đã hoàn thành", "Dự án khởi nghiệp", "Xóa hồ sơ dự án".
   - `Đề tài`: "Tên đề tài:", "Tên nhóm / Tên đề tài", "Ý tưởng đề tài".
3. **Khái niệm Lượt đánh giá / Thẩm định / Phản biện:**
   - `Phản biện`: "Báo cáo phản biện", "Báo cáo phản biện sẵn sàng", "Đang phản biện", "Quy trình phản biện đã hoàn tất", "Phản biện sâu".
   - `Thẩm định`: "Thẩm định AI", "Thẩm định đề án", "Tiến trình thẩm định bị gián đoạn", "Thẩm định tự động", "Bản sửa đổi đã gửi thành công — Chờ thẩm định".
   - `Đánh giá`: "Đánh giá chi tiết đã hoàn thành", "Gửi đánh giá mới", "Chọn gói đánh giá", "Lịch sử đánh giá", "Đánh giá bên ngoài".
4. **Thuật ngữ Trạng thái (Stage / Status Labels):**
   - Trong `statusThemeMap`:
     - `intake_pending`: "Chờ kích hoạt — Mua credit đánh giá chuyên sâu"
     - `intake_ready`: "Sẵn sàng — Cập nhật thông tin hồ sơ"
     - `submitted`: "Hồ sơ đã gửi — chờ xét duyệt"
     - `need_more_information`: "Cần bổ sung tài liệu"
     - `under_review`: "Đang phản biện"
     - `report_ready`: "Báo cáo phản biện sẵn sàng"
     - `waiting_for_revision`: "Chờ bản sửa từ nhóm"
     - `revision_submitted`: "Đã nộp bản sửa"
     - `completed`: "Hoàn thành"
     - `rejected`: "Bị từ chối"
     - `closed`: "Đã đóng"
   - Trong `StatusGuidanceCard`:
     - `submitted` (AI): "Hồ sơ đang chờ xử lý bởi Nexus AI" hoặc "Hồ sơ đã nộp — AI sẵn sàng thẩm định"
     - `submitted` (Standard): "Hồ sơ đã gửi thành công — Chờ xét duyệt" hoặc "Hồ sơ đã nộp — chờ thanh toán"
     - `under_review` (AI): "Nexus AI đang tiến hành thẩm định dự án"
     - `under_review` (Standard): "Dự án đang trong quá trình phản biện"
     - `report_ready`: "Báo cáo phản biện đã sẵn sàng"
     - `need_more_information`: "Yêu cầu bổ sung thông tin từ Supporter"
     - `rejected`: "Hồ sơ bị từ chối xét duyệt"

---

### 3.2 Hiện trạng kỹ thuật quan sát được (Implementation Observations)

1. **Khối Radar Scanning AI (`ActiveRadarScanning.tsx`):**
   - Lắng nghe sự kiện Server-Sent Events qua `EventSource(`${apiBase}/cases/${caseId}/ai-events`)` khi status khác terminal (`completed`, `failed`, `cancelled`).
   - Lọc các log kỹ thuật qua `filterCleanLogs` với danh sách từ khóa `DIRTY_LOG_KEYWORDS` (`[gọi tool]`, `🔧`, `[xong tool]`, `✅`, `tokens`, `omp-session`, `sandbox runner`...).
   - Tính toán thanh tiến độ dựa theo nội dung log: xuất hiện "Cột mốc 1" -> 45%, "Cột mốc 2" -> 70%, "Cột mốc 3" -> 95%, "completed" -> 100%.
2. **Khung đồng hồ SLA trong Header (`CaseStatusHeader.tsx:195–207`):**
   - Phần hiển thị đếm ngược thời gian SLA (`Clock`, `timeLeft`, `timerColor`) đã được comment lại bằng chú thích `MVP: SLA timer tạm ẩn — alert trong StatusGuidanceCard đã đủ thông tin`. Logic tính toán SLA vẫn còn trong code nhưng không render ra giao diện.
3. **Khối Báo cáo phản biện (`TabReportFindings.tsx` & `RoundCard.tsx`):**
   - Khi có `roundHistory`: render danh sách các vòng đánh giá (`RoundCard`). Vòng mới nhất (`index === 0`) mặc định mở rộng hiển thị iframe xem trực tiếp PDF qua URL `/api/cases/${caseId}/report/${reportFilename}?view=inline`.
   - Các vòng trước thu gọn lại; người dùng bấm "Xem báo cáo" để bung mở iframe và bấm "Thu gọn báo cáo" để đóng.
   - Nút "Mở tab mới" cho phép đọc toàn màn hình với URL trực tiếp của tệp PDF.
4. **Cơ chế nạp tiền thiếu (`useShortageDepositRedirect.ts`):**
   - Khi mua credit trong `CreditQuantityModal` mà số dư ví không đủ, hệ thống không báo lỗi mà tự động tính số tiền thiếu, gọi `useCreateDeposit` và lưu trữ ý định `{ caseId, quantity, orderIdempotencyKey, serviceType }` vào `localStorage` qua `saveBuyCreditAfterDepositIntent`, rồi chuyển hướng người dùng sang `/dashboard/payment?pid=${depositId}`. Sau khi nạp tiền, người dùng bấm "Quay lại hồ sơ" sẽ trở lại đúng case ban đầu.
5. **Cơ chế Chat Realtime & Chặn gửi tin nhắn (`TabDiscussionChat.tsx`):**
   - Sử dụng TanStack Virtualizer (`useCaseChatVirtualizer`) để hiển thị danh sách tin nhắn hiệu năng cao.
   - Kiểm tra mã lỗi phản hồi từ API khi gửi tin nhắn: nếu trả về `CHAT_FREE_TIER`, `CHAT_REJECTED`, `CHAT_CLOSED` thì khóa toàn bộ ô nhập và hiển thị Alert đỏ ("Chat hiện không khả dụng"). Nếu trả về `CHAT_LOCKED` thì hiển thị Alert vàng ("Hết lượt kiểm tra và đã qua thời gian ân hạn 24h").

---

### 3.3 Điểm chưa xác minh (Unknowns / Questions)

1. **[Cần xác minh] Sự tồn tại song song giữa `CaseOverviewPanel` và `overview/CaseOverviewTab`:**
   - Trong `page.tsx`, tab overview render `CaseOverviewPanel`. Tuy nhiên thư mục `_components/overview/` có thêm `CaseOverviewTab.tsx` với giao diện và cấu trúc mô hình `buildCaseOverviewModel` riêng biệt. Cần xác nhận từ Product Owner/Tech Lead liệu `CaseOverviewTab` có được sử dụng ở luồng nào khác hoặc là phiên bản đang chuẩn bị thay thế.
2. **[Cần xác minh] Đồng hồ cam kết SLA:**
   - Khối đếm ngược SLA hiện đang bị comment trong `CaseStatusHeader.tsx`. Cần xác minh kế hoạch bật lại tính năng đếm ngược SLA cho sinh viên ở giai đoạn tiếp theo.
3. **[Cần xác minh] Gói dịch vụ Premium Mentor Audit:**
   - Nút chọn gói Premium Mentor Audit trong `PackageSelectionModal` đang bị hardcode disabled với badge "Sắp ra mắt" và hiển thị toast "Tính năng đang được phát triển". Khi nào gói này chính thức mở bán và luồng thanh toán credit cho mentor sẽ hoạt động ra sao.
4. **[Cần xác minh] Nút "Thu gọn" vs "Xem báo cáo":**
   - Nút chuyển trạng thái mở rộng/thu gọn của báo cáo hiển thị "Thu gọn" khi `isExpanded === true` và "Xem báo cáo" khi `isExpanded === false`. Trạng thái mặc định là mở rộng cho vòng đầu tiên. Cần kiểm tra trải nghiệm người dùng trên thiết bị di động khi iframe có chiều cao tối thiểu 480px.