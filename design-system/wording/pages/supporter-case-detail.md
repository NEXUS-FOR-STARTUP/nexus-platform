# Page: Supporter Case Detail (Chi tiết hồ sơ phía Supporter)

## Layer 1: Page Context

- **Route:** `/supporter/case/[id]`
- **Access:** `Supporter` / `Admin` (Bảo vệ thông qua `useSession()` tại `apps/web-1/app/supporter/case/[id]/page.tsx:62–71`: Nếu chưa đăng nhập chuyển hướng về `/auth`; nếu vai trò không phải `supporter` và không phải `admin`, chuyển hướng về `/dashboard`).
- **User:**
  - **Primary user:** Người hỗ trợ chuyên môn (Supporter) hoặc Quản trị viên (Admin) được phân công phụ trách đánh giá, phản biện hồ sơ đề tài của nhóm sinh viên.
  - **Typical state:** Đang tiếp nhận hồ sơ từ sinh viên (`assigned`, `supporter_working`, `waiting_user`, hoặc `report_ready_to_publish`); cần đọc toàn bộ tài liệu bài nộp, kiểm tra logic ý tưởng, trao đổi với nhóm sinh viên qua kênh chat trực tuyến, gửi yêu cầu làm rõ khi thiếu thông tin, và tải lên tài liệu kết quả/output phản biện hỗ trợ.
  - **Knowledge level:** Người dùng có chuyên môn nghiệp vụ về khởi nghiệp, đổi mới sáng tạo, nắm rõ cấu trúc đề cương Checkpoint, hiểu các tiêu chí đánh giá dự án sinh viên và quen thuộc với quy trình xử lý workflow của hệ thống Nexus.
- **User goals:**
  - Nắm bắt thông tin tổng thể về đề tài: tên dự án, thông tin liên hệ của nhóm, trường học, môn học, điểm kẹt hiện tại của nhóm và kết quả sơ bộ từ phân tích Team-Fit AI.
  - Khảo sát và đọc chi tiết các tài liệu do sinh viên tải lên (slide đề cương, bản thuyết minh, tệp đính kèm) và các đánh giá bên ngoài từ giảng viên/mentor.
  - Kích hoạt quy trình xử lý phản biện ("Bắt đầu xử lý") để thông báo cho sinh viên biết hồ sơ đang được đánh giá.
  - Gửi yêu cầu sinh viên bổ sung thêm thông tin/tài liệu khi hồ sơ chưa đủ dữ liệu.
  - Tiếp nhận bản nộp sửa đổi ("Tiếp nhận bản sửa đổi") sau khi sinh viên đã cập nhật lại nội dung theo yêu cầu.
  - Tải lên các tệp output hỗ trợ ("Tải output hỗ trợ") như bản nhận xét chi tiết, tài liệu hướng dẫn hoặc báo cáo phản biện.
  - Trao đổi trực tiếp, giải đáp thắc mắc của sinh viên trong không gian chat theo thời gian thực.
  - Theo dõi nhật ký tiến trình xử lý và các sự kiện chuyển trạng thái tại dòng thời gian lịch sử.
- **Business / Product goals:**
  - Cung cấp không gian làm việc chuyên nghiệp, đồng bộ (All-in-one Supporter Workspace) giúp tối ưu hóa thời gian xử lý và đảm bảo chất lượng phản biện đúng cam kết SLA.
  - Phân tách rõ ràng giữa giao diện sinh viên (`/dashboard/case/[id]`) và giao diện chuyên môn của Supporter (`/supporter/case/[id]`): Ẩn các tính năng quản lý ví/credit và cài đặt hồ sơ sinh viên (`hideCredits={true}`, `hideSettings={true}`).
  - Kiểm soát quy trình chặt chẽ bằng máy trạng thái (Transition Rules: T7, T8, T10, T11) và cảnh báo nguy cơ chưa thanh toán trước khi bàn giao báo cáo.
  - Đảm bảo lưu trữ và quản lý minh bạch mọi tài liệu tương tác giữa hai bên.
- **Primary action:**
  - Tiếp nhận hồ sơ: Bấm "Bắt đầu xử lý" (chuyển trạng thái từ `assigned` sang `supporter_working`).
  - Đọc tài liệu sinh viên tại tab "Tài liệu" và bấm "Tải output hỗ trợ" để bàn giao sản phẩm phản biện cho nhóm.
- **Secondary actions:**
  - Bấm "Yêu cầu bổ sung" để mở modal nhập nội dung yêu cầu sinh viên cung cấp thêm thông tin.
  - Bấm "Tiếp nhận bản sửa đổi" khi nhóm sinh viên đã nộp lại tài liệu sau yêu cầu bổ sung.
  - Chuyển đổi giữa các tab không gian làm việc: "Tổng quan", "Tài liệu", "Chat với Supporter", "Lịch sử hoạt động".
  - Chuyển đổi danh mục tài liệu ("Tài liệu bài nộp", "Đánh giá bên ngoài", "Báo cáo phản biện") và bộ lọc người tải ("Tất cả", "Sinh viên", "Supporter").
  - Tải xuống tài liệu từ bảng danh sách tài liệu.
  - Nhập và gửi tin nhắn trong tab trao đổi chat thời gian thực.
- **Entry:**
  - Nhấp vào một hồ sơ từ danh sách phân công tại Bảng điều khiển Supporter `/supporter`.
  - Truy cập trực tiếp qua đường dẫn `/supporter/case/[id]`.
  - Liên kết điều hướng từ thông báo hệ thống hoặc email/Telegram thông báo có case mới được chỉ định `[Assumption / Cần xác minh]`.
- **Exit / next step:**
  - Khi hoàn thành xử lý và tải output: Hồ sơ chuyển trạng thái `report_ready_to_publish`, chờ sinh viên nghiệm thu (`completed`) hoặc phản hồi tiếp theo.
  - Điều hướng sang trang hồ sơ cá nhân hoặc phiên đăng nhập qua menu Supporter (`/supporter/settings/profile`, `/supporter/settings/sessions`).
  - Quay lại bảng điều khiển Supporter chính `/supporter`.
- **Product facts / constraints:**
  - *Kiểm soát phân quyền & Điều hướng bảo vệ:* Trang kiểm tra vai trò tại `apps/web-1/app/supporter/case/[id]/page.tsx:62–71`. Nếu chưa đăng nhập, tự động điều hướng sang `/auth`. Nếu `userRole !== "supporter" && userRole !== "admin"`, tự động điều hướng sang `/dashboard`.
  - *Cấu hình thanh điều hướng Sidebar (`WorkspaceSidebar`):* Sidebar sử dụng prop `hideSettings={true}` và `hideCredits={true}`. Do `page.tsx` không truyền prop `stage` vào `WorkspaceSidebar`, các tab hiển thị mặc định gồm 4 tab: "Tổng quan" (`overview`), "Tài liệu" (`documents`), "Chat với Supporter" (`discussion`), và "Lịch sử hoạt động" (`timeline`). Tab "Báo cáo phản biện" trên thanh sidebar chỉ xuất hiện khi có prop `stage` thuộc các mốc hoàn thiện báo cáo.
  - *Quy tắc kích hoạt nút hành động (Action Bar):*
    - Nút "Bắt đầu xử lý": Hiển thị khi `filteredTransitions` chứa `T7_START_WORK` (gọi `POST /cases/:caseId/status` chuyển sang `supporter_working`).
    - Nút "Yêu cầu bổ sung": Hiển thị khi `filteredTransitions` chứa `T8_REQUEST_INFO` (mở modal `SupporterRequestInfoModal` gọi `POST /supporter/cases/:caseId/request-more-info`).
    - Nút "Tiếp nhận bản sửa đổi": Hiển thị khi `filteredTransitions` chứa `T10_START_REVIEW_REVISION` (gọi `POST /cases/:caseId/status` với `internal_status: "supporter_working"`).
    - Nút "Tải output hỗ trợ": Hiển thị ở góc phải tab "Tài liệu" khi `filteredTransitions` chứa `T11_SUBMIT_OUTPUT` (mở modal `SupporterOutputUploadModal`).
  - *Cảnh báo trạng thái nổi bật:*
    - Cảnh báo chưa thanh toán: Hiển thị banner vàng khi `caseRequiresPayment(caseData) === true` ("⚠️ Nhóm sinh viên chưa hoàn tất thanh toán hồ sơ này. Lưu ý trước khi gửi báo cáo phản biện chính thức.").
    - Cảnh báo chờ sinh viên: Hiển thị banner vàng khi `caseData.internal_status === "waiting_user"` ("Đang chờ sinh viên nộp bản bổ sung theo yêu cầu.").
    - Thông báo giao báo cáo: Hiển thị banner xanh khi `caseData.internal_status === "report_ready_to_publish"` ("Đã giao báo cáo — chờ sinh viên xác nhận hoàn thành.").
  - *Quy định tải lên tệp Output (`SupporterOutputUploadModal`):*
    - Giới hạn số lượng: Tối đa 5 tệp (`MAX_FILES = 5`).
    - Giới hạn dung lượng: Tối đa 15MB/tệp (`MAX_FILE_SIZE_MB = 15`).
    - Định dạng hỗ trợ: PDF, DOCX, XLSX, PPTX, MD, TXT (`ACCEPTED_MIME_TYPES`).
    - Gọi API `POST /cases/:caseId/supporter-outputs/upload` kèm danh sách tệp đã tải qua `uploadManagedDocument` với `doc_type: "supporter_output"`.
  - *Hiện trạng tính năng Biên tập Báo cáo Phản biện AI (FindingEditor & Review Workspace):*
    - Mã nguồn trước commit `b8f221a` từng có route riêng `/supporter/case/[id]/review` chứa bộ công cụ biên tập báo cáo AI gồm: `DisclaimerBanner`, `FindingEditor`, `FindingCard`, `ReviewActionsPanel` ("Lưu nháp", "Duyệt & Gửi báo cáo", "Khởi tạo bản nháp AI").
    - Tại commit `b8f221a`, toàn bộ giao diện biên tập trực tiếp từng khía cạnh đánh giá đã được xóa bỏ để tinh gọn hệ thống (dead code removal). Thay vào đó, quy trình thẩm định chuyển sang cơ chế Supporter đọc hồ sơ sinh viên tại `DocumentWorkspace`, tương tác qua tab `discussion`, tải lên tệp nhận xét/output qua `SupporterOutputUploadModal`, và hệ thống xuất báo cáo tổng hợp.
    - Phía backend (`apps/api`) vẫn còn duy trì các endpoint liên quan: `GET /supporter/cases/:caseId/reports/draft`, `PUT /supporter/reports/:reportId`, `POST /supporter/reports/:reportId/publish`.

---

## Layer 2: Interactive Inventory

### 2.1 Khung điều hướng & Khởi tạo trang (Workspace Shell, Sidebar & Guards)

*Nguồn: `apps/web-1/app/supporter/case/[id]/page.tsx`, `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx`, `apps/web-1/components/ui/LoadingScreen.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.case.loading` | `LoadingScreen` > text (`page.tsx:74`) | Helper | Đang tải không gian làm việc của Supporter... | — | Hiển thị khi `isAuthPending \|\| isLoading` |
| `supporter.case.error` | Div thông báo lỗi (`page.tsx:81`) | Error | Không thể tải hồ sơ phản biện. Vui lòng thử lại. | — | Hiển thị khi `error \|\| !caseData` |
| `supporter.sidebar.tab.overview` | `WorkspaceSidebar` > Button tab (`WorkspaceSidebar.tsx:38, 104`) | Navigation | Tổng quan | Chuyển `activeTab` sang `overview`, cập nhật `?tab=overview` | default / active khi `activeTab === "overview"` |
| `supporter.sidebar.tab.documents` | `WorkspaceSidebar` > Button tab (`WorkspaceSidebar.tsx:45, 104`) | Navigation | Tài liệu | Chuyển `activeTab` sang `documents`, cập nhật `?tab=documents` | default / active khi `activeTab === "documents"` |
| `supporter.sidebar.tab.report` | `WorkspaceSidebar` > Button tab (`WorkspaceSidebar.tsx:54, 104`) | Navigation | Báo cáo phản biện | Chuyển `activeTab` sang `report` | Ẩn trên route Supporter vì không truyền prop `stage` |
| `supporter.sidebar.tab.discussion` | `WorkspaceSidebar` > Button tab (`WorkspaceSidebar.tsx:63, 104`) | Navigation | Chat với Supporter | Chuyển `activeTab` sang `discussion`, đánh dấu đã đọc (`markAsRead()`), cập nhật `?tab=discussion` | default / active khi `activeTab === "discussion"` |
| `supporter.sidebar.tab.discussion.badge` | `WorkspaceSidebar` > Unread badge (`WorkspaceSidebar.tsx:117–125`) | Badge | `<code>{tab.count}</code>` | — | Hiển thị khi `unreadCount > 0` |
| `supporter.sidebar.tab.timeline` | `WorkspaceSidebar` > Button tab (`WorkspaceSidebar.tsx:71, 104`) | Navigation | Lịch sử hoạt động | Chuyển `activeTab` sang `timeline`, cập nhật `?tab=timeline` | default / active khi `activeTab === "timeline"` |

---

### 2.2 Header thông tin hồ sơ & Cảnh báo trạng thái (Case Status Header & Status Banners)

*Nguồn: `apps/web-1/app/supporter/case/[id]/page.tsx:140–168`, `apps/web-1/app/dashboard/case/[id]/_components/CaseStatusHeader.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.header.categoryLabel` | `CaseStatusHeader` > span (`CaseStatusHeader.tsx:140`) | Label | Hồ sơ phản biện | — | default (chữ hoa, tracking-wider) |
| `supporter.header.caseCode` | `CaseStatusHeader` > h2 (`CaseStatusHeader.tsx:148`) | Heading | `<code>{caseData.case_code}</code>` | Chuyển tab sang `overview` (`onSelectTab?.("overview")`) | default / hover chuyển màu brand |
| `supporter.header.caseCode.tooltip` | `CaseStatusHeader` > Tooltip (`CaseStatusHeader.tsx:143`) | Helper | Xem tổng quan hồ sơ & ý tưởng khởi nghiệp | — | Tooltip hiển thị khi hover mã hồ sơ |
| `supporter.header.statusBadge` | `CaseStatusHeader` > Badge (`CaseStatusHeader.tsx:168`) | Badge | `<code>{statusTheme.label}</code>` | — | Hiển thị theo `statusThemeMap[caseData.user_facing_stage]` |
| `supporter.header.teamName` | `CaseStatusHeader` > span (`CaseStatusHeader.tsx:177`) | Item | `<code>Nhóm: <strong>{caseData.team_name}</strong></code>` | — | Hiển thị khi có `caseData.team_name` |
| `supporter.header.school` | `CaseStatusHeader` > span (`CaseStatusHeader.tsx:183`) | Item | `<code>Trường: <strong>{caseData.school}</strong></code>` | — | Hiển thị khi có `caseData.school` |
| `supporter.header.courseContext` | `CaseStatusHeader` > span (`CaseStatusHeader.tsx:189`) | Item | `<code>Lớp/Môn: <strong>{caseData.course_context}</strong></code>` | — | Hiển thị khi có `caseData.course_context` |
| `supporter.banner.unpaid` | Banner cảnh báo thanh toán (`page.tsx:151–154`) | Helper | ⚠️ Nhóm sinh viên chưa hoàn tất thanh toán hồ sơ này. Lưu ý trước khi gửi báo cáo phản biện chính thức. | — | Hiển thị khi `caseRequiresPayment(caseData) === true` |
| `supporter.banner.waitingUser` | Banner cảnh báo chờ sinh viên (`page.tsx:156–161`) | Helper | Đang chờ sinh viên nộp bản bổ sung theo yêu cầu. | — | Hiển thị khi `caseData.internal_status === "waiting_user"` |
| `supporter.banner.reportReady` | Banner thông báo đã giao báo cáo (`page.tsx:163–168`) | Helper | Đã giao báo cáo — chờ sinh viên xác nhận hoàn thành. | — | Hiển thị khi `caseData.internal_status === "report_ready_to_publish"` |

---

### 2.3 Thanh tác vụ Supporter (Action Bar Buttons & Toasts)

*Nguồn: `apps/web-1/app/supporter/case/[id]/page.tsx:170–210`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.action.startWork` | Action Bar > Button (`page.tsx:173–182`) | CTA | Bắt đầu xử lý | Kích hoạt `handleStartWork()` gọi `startWork()` chuyển trạng thái sang `supporter_working` | Hiển thị khi `canStartWork === true` (`T7_START_WORK`), loading khi `isStartingWork` |
| `supporter.action.requestInfo` | Action Bar > Button (`page.tsx:184–195`) | CTA | Yêu cầu bổ sung | Kích hoạt `setIsRequestInfoOpen(true)` mở `SupporterRequestInfoModal` | Hiển thị khi `canRequestInfo === true` (`T8_REQUEST_INFO`) |
| `supporter.action.startReviewRevision` | Action Bar > Button (`page.tsx:197–208`) | CTA | Tiếp nhận bản sửa đổi | Kích hoạt `handleStartReviewRevision()` gọi `startReviewRevision()` | Hiển thị khi `canStartReviewRevision === true` (`T10_START_REVIEW_REVISION`), loading khi `isStartingReviewRevision` |
| `supporter.toast.startWork.success.title` | `notifications.show` title (`page.tsx:107`) | Toast | Đã bắt đầu xử lý | — | Toast thành công (màu xanh lá) |
| `supporter.toast.startWork.success.msg` | `notifications.show` message (`page.tsx:107`) | Toast | Hồ sơ đã chuyển sang trạng thái phản biện. | — | Toast thành công |
| `supporter.toast.startWork.error.title` | `notifications.show` title (`page.tsx:109`) | Toast | Lỗi | — | Toast thất bại (màu đỏ) |
| `supporter.toast.startWork.error.msg` | `notifications.show` message (`page.tsx:109`) | Toast | Không thể bắt đầu xử lý. Vui lòng thử lại. | — | Toast thất bại |
| `supporter.toast.reviewRevision.success.title` | `notifications.show` title (`page.tsx:116`) | Toast | Đã tiếp nhận | — | Toast thành công (màu xanh lá) |
| `supporter.toast.reviewRevision.success.msg` | `notifications.show` message (`page.tsx:116`) | Toast | Đã tiếp nhận bản sửa đổi và tiếp tục thẩm định. | — | Toast thành công |
| `supporter.toast.reviewRevision.error.title` | `notifications.show` title (`page.tsx:118`) | Toast | Lỗi | — | Toast thất bại (màu đỏ) |
| `supporter.toast.reviewRevision.error.msg` | `notifications.show` message (`page.tsx:118`) | Toast | Không thể tiếp nhận bản sửa đổi. Vui lòng thử lại. | — | Toast thất bại |

---

### 2.4 Modal Yêu cầu bổ sung thông tin (`SupporterRequestInfoModal`)

*Nguồn: `apps/web-1/app/supporter/case/[id]/_components/SupporterRequestInfoModal.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.requestInfo.modal.title` | Modal title (`SupporterRequestInfoModal.tsx:51–56`) | Modal | Yêu cầu bổ sung thông tin | — | default khi modal mở (`isOpen === true`) |
| `supporter.requestInfo.error` | Div thông báo lỗi (`SupporterRequestInfoModal.tsx:61–63`) | Error | `<code>{error}</code>` | — | Hiển thị khi có lỗi (`error !== null`), mặc định: "Đã xảy ra lỗi khi gửi yêu cầu." |
| `supporter.requestInfo.textarea.label` | `Textarea` label (`SupporterRequestInfoModal.tsx:67`) | Label | Nội dung yêu cầu bổ sung | — | default |
| `supporter.requestInfo.textarea.placeholder` | `Textarea` placeholder (`SupporterRequestInfoModal.tsx:68`) | Placeholder | Nhập nội dung yêu cầu sinh viên bổ sung thông tin... | — | default, disabled khi `isSubmitting === true` |
| `supporter.requestInfo.btn.cancel` | Button (`SupporterRequestInfoModal.tsx:79–81`) | CTA | Hủy | Đóng modal và reset dữ liệu (`onClose()`) | default, disabled khi `isSubmitting === true` |
| `supporter.requestInfo.btn.submit` | Button (`SupporterRequestInfoModal.tsx:82–90`) | CTA | Gửi yêu cầu | Gọi `handleSubmit()` kích hoạt `onRequestMoreInfo(query)` | Disabled khi `!query.trim() \|\| isSubmitting` |

---

### 2.5 Modal Tải output hỗ trợ (`SupporterOutputUploadModal`)

*Nguồn: `apps/web-1/app/supporter/case/[id]/_components/SupporterOutputUploadModal.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.outputUpload.openBtn` | Tab Documents > Button (`page.tsx:225–232`) | CTA | Tải output hỗ trợ | Kích hoạt `setIsOutputUploadOpen(true)` mở modal | Hiển thị khi `canUploadOutput === true` (`T11_SUBMIT_OUTPUT`) |
| `supporter.outputUpload.modal.title` | Modal title (`SupporterOutputUploadModal.tsx:97`) | Modal | Tải output hỗ trợ | — | default khi modal mở (`isOpen === true`) |
| `supporter.outputUpload.errorInline` | Error banner (`SupporterOutputUploadModal.tsx:108`) | Error | `<code>{error}</code>` | — | Hiển thị khi có lỗi validation hoặc API |
| `supporter.outputUpload.error.maxFiles` | Chuỗi lỗi validate (`SupporterOutputUploadModal.tsx:38`) | Error | `<code>Chỉ được tải tối đa 5 tệp output. Bạn đã chọn {combined.length} tệp.</code>` | — | Kích hoạt khi chọn quá 5 tệp |
| `supporter.outputUpload.error.fileTooLarge` | Chuỗi lỗi validate (`SupporterOutputUploadModal.tsx:69`) | Error | Mỗi tệp tối đa 15MB. | — | Kích hoạt khi tệp vượt quá 15MB |
| `supporter.outputUpload.error.unsupported` | Chuỗi lỗi validate (`SupporterOutputUploadModal.tsx:72`) | Error | Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp PDF, DOCX, XLSX, PPTX, MD hoặc TXT. | — | Kích hoạt khi MIME type bị từ chối |
| `supporter.outputUpload.error.default` | Chuỗi lỗi API fallback (`SupporterOutputUploadModal.tsx:62`) | Error | Đã xảy ra lỗi khi tải output. | — | Fallback khi API upload thất bại |
| `supporter.outputUpload.label.files` | Label phần tệp đính kèm (`SupporterOutputUploadModal.tsx:114`) | Label | Tệp output đính kèm | — | default |
| `supporter.outputUpload.label.maxFilesCount` | Span chỉ số tối đa (`SupporterOutputUploadModal.tsx:115`) | Helper | Tối đa 5 tệp | — | default |
| `supporter.outputUpload.dropzone.accept` | `Dropzone.Accept` text (`SupporterOutputUploadModal.tsx:131`) | Helper | Thả tệp vào đây để tải lên | — | Hiển thị khi kéo tệp hợp lệ vào vùng thả |
| `supporter.outputUpload.dropzone.reject` | `Dropzone.Reject` text (`SupporterOutputUploadModal.tsx:138`) | Error | Tệp không đúng định dạng hoặc vượt quá 15MB | — | Hiển thị khi kéo tệp không hợp lệ vào vùng thả |
| `supporter.outputUpload.dropzone.idlePrompt` | `Dropzone.Idle` text (`SupporterOutputUploadModal.tsx:148–150`) | Helper | Kéo thả hoặc bấm để chọn tệp output | — | default ("bấm để chọn tệp" gạch chân màu brand) |
| `supporter.outputUpload.dropzone.idleNote` | `Dropzone.Idle` text (`SupporterOutputUploadModal.tsx:151–153`) | Helper | Hỗ trợ PDF, DOCX, XLSX, PPTX, MD, TXT. Tối đa 15MB mỗi tệp. | — | default |
| `supporter.outputUpload.fileList.label` | Header danh sách tệp (`SupporterOutputUploadModal.tsx:162`) | Label | Danh sách tệp đã chọn: | — | Hiển thị khi `files.length > 0` |
| `supporter.outputUpload.fileList.counter` | Counter số lượng tệp (`SupporterOutputUploadModal.tsx:163`) | Item | `<code>{files.length}/5 tệp</code>` | — | Hiển thị khi `files.length > 0` |
| `supporter.outputUpload.fileItem.remove` | Button X (`SupporterOutputUploadModal.tsx:180–186`) | CTA | *(Icon X)* (Tooltip/title: "Gỡ tệp") | Xóa tệp khỏi danh sách (`removeFile(index)`) | Hiển thị trên từng tệp đính kèm |
| `supporter.outputUpload.note.label` | `Textarea` label (`SupporterOutputUploadModal.tsx:196`) | Label | Ghi chú (Tùy chọn) | — | default |
| `supporter.outputUpload.note.placeholder` | `Textarea` placeholder (`SupporterOutputUploadModal.tsx:197`) | Placeholder | Mô tả ngắn gọn hoặc lưu ý cho sinh viên về bản output này... | — | default |
| `supporter.outputUpload.btn.cancel` | Button (`SupporterOutputUploadModal.tsx:208–210`) | CTA | Hủy bỏ | Đóng modal và reset form (`handleClose()`) | default |
| `supporter.outputUpload.btn.submit` | Button (`SupporterOutputUploadModal.tsx:211–220`) | CTA | Tải output hỗ trợ | Gọi `handleSubmit()` tải các tệp lên hệ thống | Disabled khi `files.length === 0 \|\| isSubmitting` |
| `supporter.outputUpload.btn.submitting` | Button text khi upload (`SupporterOutputUploadModal.tsx:219`) | Status | Đang tải lên... | — | Hiển thị khi `isSubmitting === true` |
| `supporter.outputUpload.toast.success.title` | `notifications.show` title (`SupporterOutputUploadModal.tsx:53`) | Toast | Tải output thành công | — | Toast thành công (màu xanh lá) |
| `supporter.outputUpload.toast.success.msg` | `notifications.show` message (`SupporterOutputUploadModal.tsx:54`) | Toast | Đã tải tài liệu output hỗ trợ thành công. | — | Toast thành công |

---

### 2.6 Khu vực đọc tài liệu sinh viên (Document Workspace — Header, Bảng tài liệu & Thao tác tải xuống)

*Nguồn: `apps/web-1/app/supporter/case/[id]/page.tsx:221–237`, `apps/web-1/app/dashboard/case/[id]/_components/documents/*`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.doc.emptyWorkspace.title` | `DocumentWorkspace` empty state (`DocumentWorkspace.tsx:111`) | Heading | Chưa có tài liệu | — | Hiển thị khi `!workspace \|\| checkpoints.length === 0` |
| `supporter.doc.emptyWorkspace.desc` | `DocumentWorkspace` empty state (`DocumentWorkspace.tsx:112–114`) | Description | Hồ sơ này chưa có tài liệu nào được tải lên hoặc liên kết. | — | Hiển thị cùng tiêu đề rỗng |
| `supporter.doc.tab.documents` | `DocumentWorkspaceHeader` > Button tab (`DocumentWorkspaceHeader.tsx:51`) | Navigation | Tài liệu bài nộp | Chọn xem tài liệu bài nộp của nhóm | active khi `activeTab === "documents"` |
| `supporter.doc.tab.documents.count` | `DocumentWorkspaceHeader` > Counter badge (`DocumentWorkspaceHeader.tsx:59`) | Badge | `<code>{documentCount}</code>` | — | Số lượng tệp tài liệu bài nộp |
| `supporter.doc.tab.feedback` | `DocumentWorkspaceHeader` > Button tab (`DocumentWorkspaceHeader.tsx:75`) | Navigation | Đánh giá bên ngoài | Chọn xem tài liệu đánh giá từ bên ngoài | active khi `activeTab === "external-feedback"` |
| `supporter.doc.tab.feedback.count` | `DocumentWorkspaceHeader` > Counter badge (`DocumentWorkspaceHeader.tsx:83`) | Badge | `<code>{feedbackCount}</code>` | — | Số lượng tệp đánh giá bên ngoài |
| `supporter.doc.tab.reports` | `DocumentWorkspaceHeader` > Button tab (`DocumentWorkspaceHeader.tsx:100`) | Navigation | Báo cáo phản biện | Chọn xem danh sách báo cáo phản biện chính thức | Hiển thị khi `reportCount > 0` |
| `supporter.doc.tab.reports.count` | `DocumentWorkspaceHeader` > Counter badge (`DocumentWorkspaceHeader.tsx:108`) | Badge | `<code>{reportCount}</code>` | — | Số lượng báo cáo phản biện |
| `supporter.doc.filter.all` | `Select` option (`DocumentWorkspaceHeader.tsx:123`) | Item | `<code>Tất cả ({documentCount})</code>` | Lọc hiển thị toàn bộ tài liệu | Option mặc định (`filterRole === "all"`) |
| `supporter.doc.filter.student` | `Select` option (`DocumentWorkspaceHeader.tsx:124`) | Item | `<code>Sinh viên ({studentDocCount})</code>` | Lọc hiển thị tài liệu do sinh viên tải lên | Option lọc sinh viên |
| `supporter.doc.filter.supporter` | `Select` option (`DocumentWorkspaceHeader.tsx:125`) | Item | `<code>Supporter ({supporterDocCount})</code>` | Lọc hiển thị tài liệu do Supporter tải lên | Option lọc Supporter |
| `supporter.doc.emptyTab.documents` | Empty message (`DocumentWorkspace.tsx:140`) | Empty state | Không có tài liệu nào thuộc bộ lọc này. | — | Hiển thị khi tab documents không có dòng nào khớp bộ lọc |
| `supporter.doc.emptyTab.feedback` | Empty message (`DocumentWorkspace.tsx:143`) | Empty state | Chưa có tài liệu đánh giá bên ngoài trong checkpoint này. | — | Hiển thị khi tab external-feedback rỗng |
| `supporter.doc.emptyTab.reports` | Empty message (`DocumentWorkspace.tsx:142`) | Empty state | Chưa có báo cáo phản biện nào được lưu. | — | Hiển thị khi tab assessment-reports rỗng |
| `supporter.doc.table.th.version` | Table Th cột 1 (`DocumentRowsTable.tsx:54`) | Label | Phiên bản | — | Hiển thị ở tab documents và assessment-reports |
| `supporter.doc.table.th.round` | Table Th cột 1 (`DocumentRowsTable.tsx:54`) | Label | Đợt | — | Hiển thị ở tab external-feedback |
| `supporter.doc.table.th.classification` | Table Th cột 2 (`DocumentRowsTable.tsx:59`) | Label | Phân loại | — | Hiển thị ở tab documents |
| `supporter.doc.table.th.linkedSubmission` | Table Th cột 2 (`DocumentRowsTable.tsx:61`) | Label | Liên kết bản nộp | — | Hiển thị ở tab external-feedback |
| `supporter.doc.table.th.submissionType` | Table Th cột 2 (`DocumentRowsTable.tsx:62`) | Label | Loại nộp | — | Hiển thị ở tab assessment-reports |
| `supporter.doc.table.th.uploader` | Table Th cột 3 (`DocumentRowsTable.tsx:67`) | Label | Người tải | — | Hiển thị ở tab documents |
| `supporter.doc.table.th.creatorSource` | Table Th cột 3 (`DocumentRowsTable.tsx:67`) | Label | Nguồn tạo | — | Hiển thị ở tab assessment-reports |
| `supporter.doc.table.th.docName` | Table Th cột 4 (`DocumentRowsTable.tsx:73`) | Label | Tên tài liệu | — | Hiển thị ở tab documents và external-feedback |
| `supporter.doc.table.th.reportName` | Table Th cột 4 (`DocumentRowsTable.tsx:73`) | Label | Tên file báo cáo | — | Hiển thị ở tab assessment-reports |
| `supporter.doc.table.th.time` | Table Th cột 5 (`DocumentRowsTable.tsx:77`) | Label | Thời gian | — | default |
| `supporter.doc.table.th.source` | Table Th cột 6 (`DocumentRowsTable.tsx:82`) | Label | Nguồn | — | Hiển thị ở tab documents và external-feedback |
| `supporter.doc.table.th.format` | Table Th cột 7 (`DocumentRowsTable.tsx:87`) | Label | Định dạng | — | default |
| `supporter.doc.table.th.action` | Table Th cột 8 (`DocumentRowsTable.tsx:91`) | Label | Thao tác | — | default (căn phải) |
| `supporter.doc.action.download` | `DocumentTableRow` > Button (`DocumentTableRow.tsx:125–136`) | CTA | *(Icon Download)* | Mở/tải tệp tại `row.url` trong tab mới | Hiển thị khi `row.hasAction && row.url` |
| `supporter.doc.action.downloadTooltip` | `DocumentTableRow` > Tooltip (`DocumentTableRow.tsx:124`) | Helper | Tải xuống tài liệu | — | Tooltip hiển thị khi hover nút tải xuống |
| `supporter.doc.action.noAction` | `DocumentTableRow` > span (`DocumentTableRow.tsx:139`) | Status | — | — | Hiển thị khi không có liên kết tải trực tiếp |

---

### 2.7 Tab Tổng quan hồ sơ (`CaseOverviewPanel`)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/CaseOverviewPanel.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.overview.teamCard.title` | Card 1 > h3 (`CaseOverviewPanel.tsx:85`) | Heading | Đội ngũ & Trường học | — | default |
| `supporter.overview.teamCard.projectLabel` | Card 1 > span (`CaseOverviewPanel.tsx:90`) | Label | Tên đề tài: | — | default |
| `supporter.overview.teamCard.projectValue` | Card 1 > p (`CaseOverviewPanel.tsx:91`) | Item | `<code>{groupName}</code>` | — | default (hoặc "Chưa cập nhật") |
| `supporter.overview.teamCard.groupNoLabel` | Card 1 > span (`CaseOverviewPanel.tsx:94`) | Label | Nhóm số: | — | default |
| `supporter.overview.teamCard.groupNoValue` | Card 1 > p (`CaseOverviewPanel.tsx:95`) | Item | `<code>{groupNo \|\| "Chưa cập nhật"}</code>` | — | default |
| `supporter.overview.teamCard.schoolLabel` | Card 1 > span (`CaseOverviewPanel.tsx:98`) | Label | Trường: | — | default |
| `supporter.overview.teamCard.schoolValue` | Card 1 > p (`CaseOverviewPanel.tsx:99`) | Item | `<code>{schoolName}</code>` | — | default (hoặc "Chưa cập nhật") |
| `supporter.overview.teamCard.courseLabel` | Card 1 > span (`CaseOverviewPanel.tsx:102`) | Label | Môn học: | — | default |
| `supporter.overview.teamCard.courseValue` | Card 1 > p (`CaseOverviewPanel.tsx:103`) | Item | `<code>{courseContext}</code>` | — | default (hoặc "Chưa cập nhật") |
| `supporter.overview.contactCard.title` | Card 2 > h3 (`CaseOverviewPanel.tsx:112`) | Heading | Người liên hệ | — | default |
| `supporter.overview.contactCard.nameLabel` | Card 2 > span (`CaseOverviewPanel.tsx:117`) | Label | Họ và tên: | — | default |
| `supporter.overview.contactCard.nameValue` | Card 2 > p (`CaseOverviewPanel.tsx:118`) | Item | `<code>{contactName}</code>` | — | default (hoặc "Chưa cập nhật") |
| `supporter.overview.contactCard.studentCodeLabel` | Card 2 > span (`CaseOverviewPanel.tsx:121`) | Label | Mã số sinh viên: | — | default |
| `supporter.overview.contactCard.studentCodeValue` | Card 2 > p (`CaseOverviewPanel.tsx:122`) | Item | `<code>{studentCode}</code>` | — | default (hoặc "Chưa cập nhật") |
| `supporter.overview.contactCard.emailLabel` | Card 2 > span (`CaseOverviewPanel.tsx:125`) | Label | Email: | — | default |
| `supporter.overview.contactCard.emailValue` | Card 2 > p (`CaseOverviewPanel.tsx:126`) | Item | `<code>{contactEmail}</code>` | — | default (hoặc "Chưa cập nhật") |
| `supporter.overview.contactCard.phoneLabel` | Card 2 > span (`CaseOverviewPanel.tsx:129`) | Label | Số điện thoại: | — | default |
| `supporter.overview.contactCard.phoneValue` | Card 2 > p (`CaseOverviewPanel.tsx:130`) | Item | `<code>{contactPhone}</code>` | — | default (hoặc "Chưa cập nhật") |
| `supporter.overview.contactCard.roleLabel` | Card 2 > span (`CaseOverviewPanel.tsx:133`) | Label | Vai trò: | — | default |
| `supporter.overview.contactCard.roleValue` | Card 2 > p (`CaseOverviewPanel.tsx:134`) | Item | `<code>{teamRole}</code>` | — | default (mặc định: "Trưởng nhóm") |
| `supporter.overview.contactCard.telegramLabel` | Card 2 > span (`CaseOverviewPanel.tsx:137`) | Label | Telegram: | — | default |
| `supporter.overview.contactCard.telegramValue` | Card 2 > p (`CaseOverviewPanel.tsx:138`) | Item | `<code>{contactTelegram \|\| "Chưa cập nhật"}</code>` | — | default |
| `supporter.overview.blockerCard.title` | Card 3 > h3 (`CaseOverviewPanel.tsx:148`) | Heading | Nhóm đang kẹt ở đâu? | — | default (icon cảnh báo màu hổ phách) |
| `supporter.overview.blockerCard.label` | Card 3 > span (`CaseOverviewPanel.tsx:152`) | Label | Điểm kẹt hiện tại: | — | default |
| `supporter.overview.blockerCard.content` | Card 3 > p (`CaseOverviewPanel.tsx:153–155`) | Description | `<code>{currentBlocker \|\| "Chưa cập nhật điểm kẹt hiện tại."}</code>` | — | default |
| `supporter.overview.ideaCard.title` | Card 4 > h3 (`CaseOverviewPanel.tsx:163`) | Heading | Chi tiết Ý tưởng Khởi nghiệp | — | default |
| `supporter.overview.ideaCard.fieldLabel` | Card 4 > span (`CaseOverviewPanel.tsx:171`) | Label | Lĩnh vực hoạt động: | — | default |
| `supporter.overview.ideaCard.fieldValue` | Card 4 > p (`CaseOverviewPanel.tsx:173`) | Item | `<code>{field}</code>` | — | default |
| `supporter.overview.ideaCard.customerLabel` | Card 4 > span (`CaseOverviewPanel.tsx:180`) | Label | Khách hàng mục tiêu: | — | default |
| `supporter.overview.ideaCard.customerValue` | Card 4 > p (`CaseOverviewPanel.tsx:181`) | Item | `<code>{targetCustomer}</code>` | — | default |
| `supporter.overview.ideaCard.problemLabel` | Card 4 > span (`CaseOverviewPanel.tsx:189`) | Label | Vấn đề cốt lõi (Problem): | — | default (chữ màu đỏ danger) |
| `supporter.overview.ideaCard.problemValue` | Card 4 > p (`CaseOverviewPanel.tsx:191`) | Item | `<code>{problem}</code>` | — | default |
| `supporter.overview.ideaCard.solutionLabel` | Card 4 > span (`CaseOverviewPanel.tsx:197`) | Label | Giải pháp đề xuất (Solution): | — | default (chữ màu xanh success) |
| `supporter.overview.ideaCard.solutionValue` | Card 4 > p (`CaseOverviewPanel.tsx:199`) | Item | `<code>{solution}</code>` | — | default |
| `supporter.overview.ideaCard.mvpLabel` | Card 4 > span (`CaseOverviewPanel.tsx:208`) | Label | Sản phẩm khả thi tối thiểu (MVP): | — | Hiển thị khi có dữ liệu `mvp` |
| `supporter.overview.ideaCard.mvpValue` | Card 4 > p (`CaseOverviewPanel.tsx:210`) | Item | `<code>{mvp}</code>` | — | Hiển thị khi có dữ liệu `mvp` |
| `supporter.overview.teamFit.title` | Card 5 > h3 (`CaseOverviewPanel.tsx:219`) | Heading | Đánh giá sơ bộ từ AI (Team-Fit Analysis) | — | Hiển thị khi có khoảng trống AI (`hasAiGaps === true`) |
| `supporter.overview.teamFit.teamGapsLabel` | Card 5 > span (`CaseOverviewPanel.tsx:227`) | Label | Khoảng trống đội ngũ cần lưu ý: | — | Hiển thị khi `teamGaps.length > 0` |
| `supporter.overview.teamFit.commercialGapsLabel` | Card 5 > span (`CaseOverviewPanel.tsx:241`) | Label | Khoảng trống thương mại & thị trường: | — | Hiển thị khi `commercialGaps.length > 0` |
| `supporter.overview.members.title` | Card 6 > h3 (`CaseOverviewPanel.tsx:259`) | Heading | `<code>Thành viên đội ngũ ({tfTeam.length})</code>` | — | Hiển thị khi có danh sách thành viên `tfTeam.length > 0` |
| `supporter.overview.needsCard.title` | Card 7 > h3 (`CaseOverviewPanel.tsx:277`) | Heading | Nhu cầu hỗ trợ chuyên môn | — | default |
| `supporter.overview.needsCard.primaryNeedLabel` | Card 7 > span (`CaseOverviewPanel.tsx:284`) | Label | Nhu cầu hỗ trợ chính: | — | default |
| `supporter.overview.needsCard.primaryNeedValue` | Card 7 > p (`CaseOverviewPanel.tsx:286–288`) | Item | `<code>{primaryNeedText \|\| "Cần phản biện để làm rõ khách hàng mục tiêu và vấn đề cốt lõi"}</code>` | — | default |
| `supporter.overview.needsCard.expectedOutputsLabel` | Card 7 > span (`CaseOverviewPanel.tsx:295`) | Label | Kết quả mong đợi sau phản biện: | — | default |
| `supporter.overview.needsCard.expectedOutputsValue` | Card 7 > p (`CaseOverviewPanel.tsx:297`) | Item | `<code>{expectedOutputs \|\| "Chưa nhập ghi chú kỳ vọng"}</code>` | — | default |
| `supporter.overview.needsCard.extraNotesLabel` | Card 7 > span (`CaseOverviewPanel.tsx:303`) | Label | Ghi chú thêm cho Supporter: | — | default |
| `supporter.overview.needsCard.extraNotesValue` | Card 7 > p (`CaseOverviewPanel.tsx:305`) | Item | `<code>{extraNotes \|\| "Chưa nhập ghi chú thêm"}</code>` | — | default |

---

### 2.8 Tab Trao đổi & Chat với Supporter (`TabDiscussionChat`)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/TabDiscussionChat.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.chat.header.title` | Chat Header > span (`TabDiscussionChat.tsx:147`) | Heading | Trao đổi | — | default |
| `supporter.chat.header.refreshTooltip` | Chat Header > Tooltip (`TabDiscussionChat.tsx:150`) | Helper | Tải tin nhắn mới | — | default |
| `supporter.chat.header.refreshBtn` | Chat Header > ActionIcon (`TabDiscussionChat.tsx:151–161`) | CTA | *(Icon RefreshCw)* | Làm mới danh sách tin nhắn (`refetch()`) | Disabled khi đang fetch (`isFetching === true`) |
| `supporter.chat.empty.title` | Chat List > p (`TabDiscussionChat.tsx:183`) | Heading | Chưa có trao đổi nào | — | Hiển thị khi danh sách tin nhắn rỗng (`messages.length === 0`) |
| `supporter.chat.empty.desc` | Chat List > p (`TabDiscussionChat.tsx:184–186`) | Description | Đây là nơi nhóm và Supporter phối hợp trong suốt quá trình phản biện. | — | Hiển thị cùng tiêu đề rỗng |
| `supporter.chat.badge.admin` | Message card > Role badge (`TabDiscussionChat.tsx:41`) | Badge | Admin | — | Tin nhắn do Admin gửi |
| `supporter.chat.badge.supporter` | Message card > Role badge (`TabDiscussionChat.tsx:47`) | Badge | Supporter | — | Tin nhắn do Supporter gửi |
| `supporter.chat.badge.student` | Message card > Role badge (`TabDiscussionChat.tsx:50`) | Badge | Sinh viên | — | Tin nhắn do Sinh viên gửi |
| `supporter.chat.input.ariaLabel` | Textarea aria-label (`TabDiscussionChat.tsx:357`) | Aria-label | Nhập nội dung tin nhắn | — | Thuộc tính trợ năng |
| `supporter.chat.input.placeholder.default` | Textarea placeholder (`TabDiscussionChat.tsx:361`) | Placeholder | Nhắn gì đó… | — | default khi chat mở bình thường |
| `supporter.chat.input.placeholder.closed` | Textarea placeholder (`TabDiscussionChat.tsx:361`) | Placeholder | Chat hiện không khả dụng | — | Hiển thị khi `isChatClosed === true` |
| `supporter.chat.input.placeholder.locked` | Textarea placeholder (`TabDiscussionChat.tsx:361`) | Placeholder | Hết lượt kiểm tra và ân hạn. Vui lòng nạp thêm credit. | — | Hiển thị khi `isChatLocked === true` |
| `supporter.chat.btn.send` | Button gửi tin nhắn (`TabDiscussionChat.tsx:388–410`) | CTA | *(Icon ArrowUp)* | Gửi tin nhắn vào kênh chat (`handleSend()`) | Disabled khi `!inputText.trim() \|\| isSending` |
| `supporter.chat.alert.closed` | Alert (`TabDiscussionChat.tsx:418`) | Error | Chat hiện không khả dụng. Vui lòng liên hệ qua email hoặc điện thoại. | — | Hiển thị khi `isChatClosed === true` |
| `supporter.chat.alert.locked` | Alert (`TabDiscussionChat.tsx:427–429`) | Error | Hết lượt kiểm tra và đã qua thời gian ân hạn 24h. Vui lòng mua thêm credit để tiếp tục trao đổi. | — | Hiển thị khi `isChatLocked === true` |

---

### 2.9 Tab Lịch sử hoạt động (`ActivityTimeline`)

*Nguồn: `apps/web-1/app/dashboard/case/[id]/_components/ActivityTimeline.tsx`, `apps/web-1/lib/event-details.ts`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.timeline.empty` | Div thông báo rỗng (`ActivityTimeline.tsx:32`) | Empty state | Chưa có hoạt động nào được ghi nhận cho hồ sơ này. | — | Hiển thị khi không có sự kiện (`sortedEvents.length === 0`) |
| `supporter.timeline.reasonPrefix` | Event card text (`ActivityTimeline.tsx:64`) | Helper | `<code> — Lý do: {reason}</code>` | — | Hiển thị khi sự kiện bị từ chối hoặc phủ quyết |
| `supporter.timeline.actorPrefix` | Event card text (`ActivityTimeline.tsx:69`) | Item | `<code>Thực hiện bởi: <strong>{event.actor.name}</strong> ({roleLabel})</code>` | — | Hiển thị tên và vai trò (Admin / Supporter / Sinh viên) |
| `supporter.timeline.event.created` | Event label (`event-details.ts:28, 34`) | Item | Khởi tạo hồ sơ | — | Sự kiện `case_created` |
| `supporter.timeline.event.submitted` | Event label (`event-details.ts:40`) | Item | Hồ sơ đã nộp | — | Sự kiện `case_submitted` |
| `supporter.timeline.event.accepted` | Event label (`event-details.ts:46`) | Item | Hồ sơ được duyệt | — | Sự kiện `case_accepted` |
| `supporter.timeline.event.rejected` | Event label (`event-details.ts:52`) | Item | Hồ sơ bị từ chối | — | Sự kiện `case_rejected` |
| `supporter.timeline.event.resubmitted` | Event label (`event-details.ts:58`) | Item | Nộp lại hồ sơ | — | Sự kiện `case_resubmitted` |
| `supporter.timeline.event.assigned` | Event label (`event-details.ts:64`) | Item | Đã phân công người hỗ trợ | — | Sự kiện `supporter_assigned` |
| `supporter.timeline.event.requestInfo` | Event label (`event-details.ts:70`) | Item | Yêu cầu bổ sung thông tin | — | Sự kiện `more_info_requested` |
| `supporter.timeline.event.revisionSubmitted` | Event label (`event-details.ts:76`) | Item | Đã nộp bản sửa đổi | — | Sự kiện `revision_submitted` |
| `supporter.timeline.event.reportDraft` | Event label (`event-details.ts:124`) | Item | Tạo bản nháp phản biện AI | — | Sự kiện `report_draft_created` |
| `supporter.timeline.event.reportApproved` | Event label (`event-details.ts:130`) | Item | Báo cáo chính thức | — | Sự kiện `report_approved` |

---

### 2.10 Hiện trạng & Dữ liệu lịch sử: Module Biên tập Báo cáo Phản biện AI (FindingEditor, ReviewActionsPanel & Report Findings)

*Ghi chú kỹ thuật: Nhằm đáp ứng mục tiêu kiểm kê đầy đủ theo phạm vi nghiệp vụ được giao, mục này trích xuất toàn bộ câu chữ nguyên văn từ các component chuyên dụng đã từng tồn tại trong luồng phản biện Supporter (Mã nguồn commit `b8f221a^` trước đợt dọn dẹp dead code) và thành phần xem/tải báo cáo hiện hành (`TabReportFindings.tsx`, `RoundCard.tsx`).*

*Nguồn: `apps/web-1/app/supporter/case/[id]/review/*` (lịch sử commit `b8f221a^`), `apps/web-1/app/dashboard/case/[id]/_components/TabReportFindings.tsx`, `RoundCard.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `supporter.reviewHist.nav.back` | Review Page > Button (`review/page.tsx:210–217`) | Navigation | Quay lại Hồ sơ | Điều hướng về `/supporter/case/${caseId}` | [Lịch sử / Dead Code] |
| `supporter.reviewHist.header.title` | Review Page > h2 (`review/page.tsx:219`) | Heading | Biên tập Báo cáo Phản biện | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.header.code` | Review Page > p (`review/page.tsx:220`) | Item | `<code>Mã hồ sơ: {caseData?.case_code}</code>` | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.onboarding.title` | Review Page Onboarding > h3 (`review/page.tsx:231`) | Heading | Khởi tạo Báo cáo Phản biện | — | [Lịch sử / Dead Code] khi chưa có draft |
| `supporter.reviewHist.onboarding.desc` | Review Page Onboarding > p (`review/page.tsx:232–234`) | Description | Hồ sơ này chưa có báo cáo phản biện. Supporter chuyên môn có thể khởi tạo bản nháp phản biện AI dựa trên dữ liệu đầu vào của học viên để tiết kiệm thời gian biên tập. | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.onboarding.btn` | Review Page Onboarding > Button (`review/page.tsx:237–245`) | CTA | Khởi tạo bản nháp AI | Kích hoạt `generateDraft()` gọi API sinh bản nháp AI | [Lịch sử / Dead Code] |
| `supporter.reviewHist.onboarding.btnLoading` | Review Page Onboarding > Button (`review/page.tsx:243`) | Status | Đang phân tích hồ sơ và tạo bản nháp... | — | [Lịch sử / Dead Code] khi `isGenerating === true` |
| `supporter.reviewHist.unsavedAlert` | Review Page > Alert (`review/page.tsx:251–254`) | Error | Bạn có thay đổi chưa lưu. Vui lòng click "Lưu nháp" để không bị mất dữ liệu. | — | [Lịch sử / Dead Code] khi `hasUnsavedChanges === true` |
| `supporter.reviewHist.disclaimer.title` | `DisclaimerBanner` > h4 (`DisclaimerBanner.tsx:14`) | Heading | Dự thảo Phản biện AI | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.disclaimer.desc` | `DisclaimerBanner` > p (`DisclaimerBanner.tsx:16–18`) | Description | Nội dung dưới đây được khởi tạo tự động bởi AI của Nexus. Với vai trò Supporter chuyên môn, bạn bắt buộc phải kiểm duyệt, sửa đổi các nhận định hoặc gợi ý chưa phù hợp, bổ sung bằng chứng xác đáng để đảm bảo độ tin cậy của báo cáo trước khi gửi đến sinh viên. | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.findings.empty` | Review Page > empty state (`review/page.tsx:263`) | Empty state | Chưa có khía cạnh phản biện nào. Vui lòng click "Thêm khía cạnh mới". | — | [Lịch sử / Dead Code] khi `findings.length === 0` |
| `supporter.reviewHist.panel.totalCount` | `ReviewActionsPanel` > span (`ReviewActionsPanel.tsx:26–28`) | Item | `<code>Tổng số: {findingsCount} khía cạnh phản biện</code>` | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.panel.addFinding` | `ReviewActionsPanel` > button (`ReviewActionsPanel.tsx:31–36`) | CTA | Thêm khía cạnh mới | Thêm một khía cạnh phản biện rỗng vào danh sách (`onAddFinding()`) | [Lịch sử / Dead Code] |
| `supporter.reviewHist.panel.saveDraft` | `ReviewActionsPanel` > Button (`ReviewActionsPanel.tsx:41–48`) | CTA | Lưu nháp | Gọi `handleSaveDraft()` lưu bản nháp qua API | [Lịch sử / Dead Code] |
| `supporter.reviewHist.panel.approve` | `ReviewActionsPanel` > Button (`ReviewActionsPanel.tsx:51–58`) | CTA | Duyệt & Gửi báo cáo | Gọi `handleApproveAndSend()` phê duyệt báo cáo sang `APPROVED` và gửi cho sinh viên | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.title` | `FindingCard` edit mode > span (`FindingCard.tsx:75`) | Heading | Đang chỉnh sửa khía cạnh | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.btnCancel` | `FindingCard` edit mode > Button (`FindingCard.tsx:78–84`) | CTA | Hủy | Hủy thao tác sửa khía cạnh | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.btnSave` | `FindingCard` edit mode > Button (`FindingCard.tsx:85–91`) | CTA | Lưu | Lưu khía cạnh vào danh sách nháp | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.fieldSelect` | `FindingEditor` > `Select` label (`FindingEditor.tsx:39`) | Label | Khía cạnh đánh giá | — | [Lịch sử / Dead Code] (Options: Ý tưởng sản phẩm, Chân dung khách hàng, Vấn đề thị trường, Giải pháp thay thế, Năng lực của nhóm) |
| `supporter.reviewHist.editor.statusLabel` | `FindingEditor` > `TextInput` label (`FindingEditor.tsx:49`) | Label | Loại vấn đề / Trạng thái | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.statusPlaceholder` | `FindingEditor` > `TextInput` placeholder (`FindingEditor.tsx:52`) | Placeholder | Ví dụ: Thiếu thông tin, Chưa rõ ràng, Mâu thuẫn... | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.evidenceLabel` | `FindingEditor` > `Textarea` label (`FindingEditor.tsx:59`) | Label | Bằng chứng dẫn chiếu (Trích nguyên văn từ bản nộp) | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.evidencePlaceholder` | `FindingEditor` > `Textarea` placeholder (`FindingEditor.tsx:62`) | Placeholder | Trích dẫn nguyên văn tài liệu hoặc ghi 'Không tìm thấy thông tin trong bản nộp'... | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.reasonLabel` | `FindingEditor` > `Textarea` label (`FindingEditor.tsx:70`) | Label | Lý do đánh giá (Giải thích chi tiết lỗi logic) | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.reasonPlaceholder` | `FindingEditor` > `Textarea` placeholder (`FindingEditor.tsx:73`) | Placeholder | Giải thích vì sao khía cạnh này bị đánh giá là có vấn đề... | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.questionLabel` | `FindingEditor` > `Textarea` label (`FindingEditor.tsx:81`) | Label | Câu hỏi phản biện hướng dẫn (Học viên cần trả lời gì?) | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.questionPlaceholder` | `FindingEditor` > `Textarea` placeholder (`FindingEditor.tsx:84`) | Placeholder | Đặt câu hỏi cụ thể để học viên tư duy và làm rõ ý tưởng... | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.nextActionLabel` | `FindingEditor` > `Textarea` label (`FindingEditor.tsx:92`) | Label | Hành động khắc phục gợi ý (Cần sửa đổi gì?) | — | [Lịch sử / Dead Code] |
| `supporter.reviewHist.editor.nextActionPlaceholder` | `FindingEditor` > `Textarea` placeholder (`FindingEditor.tsx:95`) | Placeholder | Đề xuất các đầu việc chi tiết để sửa lỗi logic... | — | [Lịch sử / Dead Code] |
| `supporter.report.viewNewTab` | `TabReportFindings` > Button (`TabReportFindings.tsx:110–119`) | CTA | Mở tab mới | Mở tệp PDF báo cáo trong tab mới (`pdfViewUrl`) | Hiển thị khi báo cáo mở rộng |
| `supporter.report.downloadPdf` | `TabReportFindings` > Button (`TabReportFindings.tsx:123–131`) | CTA | Tải Báo Cáo PDF | Gọi hàm `downloadPdf(reportFilename)` tải file PDF trực tiếp | Hiển thị khi báo cáo mở rộng, loading khi `isDownloadingPdf` |
| `supporter.report.toggleCollapse` | `TabReportFindings` > Button (`TabReportFindings.tsx:136–145`) | CTA | Thu gọn | Thu gọn khung xem trước PDF | Hiển thị khi `isSingleExpanded === true` |
| `supporter.report.toggleExpand` | `TabReportFindings` > Button (`TabReportFindings.tsx:136–145`) | CTA | Xem báo cáo | Mở rộng khung xem trước PDF | Hiển thị khi `isSingleExpanded === false` |
| `supporter.report.round.downloadPdf` | `RoundCard` > Button (`RoundCard.tsx:109–117`) | CTA | Tải PDF | Tải báo cáo PDF của đợt đánh giá tương ứng | Hiển thị khi thẻ vòng mở rộng (`isExpanded === true`) |
| `supporter.report.round.newTab` | `RoundCard` > Button (`RoundCard.tsx:97–107`) | CTA | Mở tab mới | Mở link PDF của đợt đánh giá trong tab mới | Hiển thị khi thẻ vòng mở rộng |
| `supporter.report.round.toggle` | `RoundCard` > Button (`RoundCard.tsx:122–131`) | CTA | `<code>{isExpanded ? "Thu gọn" : "Xem báo cáo"}</code>` | Đóng/mở chi tiết báo cáo đợt | default |

---

## Layer 3: Page Notes

### 3.1 Biến thể thuật ngữ xuất hiện trên trang
- **Vai trò Người hỗ trợ:**
  - Tiêu đề màn hình & đường dẫn: `Supporter` (`/supporter/case/[id]`).
  - Thanh Sidebar: `Chat với Supporter` (thay vì "Trao đổi với nhóm" hay "Chat với sinh viên").
  - Thẻ người liên hệ & ghi chú: `Supporter` ("Ghi chú thêm cho Supporter").
  - Modal tải tệp: `Tải output hỗ trợ` / `Tệp output đính kèm`.
  - Bộ lọc tài liệu: `Supporter ({supporterDocCount})`.
  - Dòng thời gian lịch sử: `Đã phân công người hỗ trợ` (`supporter_assigned`).
  - Module lịch sử Review: `Supporter chuyên môn`.
- **Hồ sơ & Đề tài:**
  - Header trang: `Hồ sơ phản biện` (kèm mã hồ sơ ví dụ `NX-785364`).
  - Thẻ thông tin đội ngũ: `Tên đề tài:` (thay vì "Tên dự án" hay "Tên nhóm").
  - Thẻ chi tiết ý tưởng: `Chi tiết Ý tưởng Khởi nghiệp`.
  - Bảng tài liệu: `Tài liệu bài nộp` vs `Đánh giá bên ngoài` vs `Báo cáo phản biện`.
- **Hành động phản biện & Thẩm định:**
  - Nút Action bar: `Bắt đầu xử lý` (transition T7, internal status `supporter_working`).
  - Nút Action bar: `Yêu cầu bổ sung` (transition T8, internal status `waiting_user`).
  - Nút Action bar: `Tiếp nhận bản sửa đổi` (transition T10, tự lặp lại `supporter_working`).
  - Nút tải output: `Tải output hỗ trợ` (transition T11).
  - Module lịch sử Review: `Lưu nháp` vs `Duyệt & Gửi báo cáo`.
  - Tab báo cáo: `Tải Báo Cáo PDF` vs `Tải PDF`.

### 3.2 Hiện trạng kỹ thuật quan sát được trong code
- **Xác thực và phân quyền (Auth Guard):**
  - Tệp `apps/web-1/app/supporter/case/[id]/page.tsx` kiểm tra session tại chỗ. Nếu `userRole !== "supporter" && userRole !== "admin"`, người dùng bị chuyển hướng ngay sang `/dashboard`.
- **Thanh Sidebar bị thiếu prop `stage`:**
  - Tại `page.tsx:124–137`, component `WorkspaceSidebar` được render mà không truyền prop `stage={caseData.user_facing_stage}`. Hậu quả là điều kiện `stage === "report_ready" || stage === "completed" || ...` trong `WorkspaceSidebar.tsx:50–58` không bao giờ thỏa mãn. Do đó, tab "Báo cáo phản biện" không hiển thị trên thanh Sidebar của Supporter, dù hằng số `VALID_WORKSPACE_TABS` vẫn khai báo tab `"report"`.
- **Khu vực DocumentWorkspace không nhận props báo cáo đầy đủ:**
  - Tại `page.tsx:235`, `<DocumentWorkspace workspace={documentWorkspace} />` được gọi mà không truyền `roundHistory`, `projectName`, `caseCode`. Do đó `reportCount` trong header tài liệu được tính bằng `roundHistory ? roundHistory.length : 0` sẽ luôn là 0 khi Supporter truy cập, khiến tab "Báo cáo phản biện" trong DocumentWorkspace bị ẩn đi trên giao diện Supporter hiện tại.
- **Tiến hóa kiến trúc: Xóa bỏ module Review trực tiếp (Commit `b8f221a`):**
  - Trước đây hệ thống dự định có một trang con `/supporter/case/[id]/review` để Supporter tự sinh dự thảo AI (`generateDraft`), biên tập từng tiêu chí (`FindingEditor`, `FindingCard`), và ấn nút `Duyệt & Gửi báo cáo`.
  - Nhánh chức năng này đã bị gỡ bỏ toàn bộ khỏi giao diện web (`apps/web-1/app/supporter/case/[id]/review` bị xóa). Luồng phản biện thực tế hiện tại là: Supporter xem tài liệu nộp tại `DocumentWorkspace`, trao đổi với nhóm qua `TabDiscussionChat`, và nộp các tài liệu kết quả/output phản biện qua modal `SupporterOutputUploadModal` ("Tải output hỗ trợ").
- **Xử lý Chat và giới hạn thời gian (Chat Gate):**
  - Khung chat `TabDiscussionChat` có cơ chế kiểm tra lỗi từ server (`CHAT_FREE_TIER`, `CHAT_REJECTED`, `CHAT_CLOSED`, `CHAT_LOCKED`). Khi tài khoản hết lượt kiểm tra và qua thời gian ân hạn 24h (`CHAT_LOCKED`), ô nhập tin nhắn bị khóa và hiển thị thông báo yêu cầu mua thêm credit.

### 3.3 Điểm chưa xác minh (Unknowns / Questions)
- **Cơ chế duyệt xuất bản báo cáo chính thức:** Khi Supporter tải lên tệp qua modal "Tải output hỗ trợ" (`SupporterOutputUploadModal`), tệp này được lưu dưới dạng `doc_type: "supporter_output"`. Làm thế nào tài liệu này được tổng hợp hoặc xuất bản thành bản ghi `report` chính thức để chuyển hồ sơ sang trạng thái `completed`? Cần xác minh xem vai trò Admin sẽ thực hiện phê duyệt qua API `/reports/:id/approve` hay hệ thống có luồng ngầm tự động.
- **Hiển thị nhãn Sidebar "Chat với Supporter":** Trên giao diện của chính Supporter, tab chat lại hiển thị nhãn là "Chat với Supporter" (kế thừa từ nhãn góc nhìn của sinh viên trong component dùng chung `WorkspaceSidebar.tsx:63`). Cần làm rõ với Product Owner xem có nên điều chỉnh thành "Trao đổi với nhóm sinh viên" hoặc "Thảo luận" khi ở trang `/supporter/case/[id]` hay không.
- **Hiển thị tab Báo cáo phản biện cho Supporter:** Việc tab "Báo cáo phản biện" không xuất hiện trên cả Sidebar lẫn trong `DocumentWorkspace` phía Supporter là chủ đích thiết kế (Supporter chỉ giao tiếp qua tài liệu bài nộp & output) hay là thiếu sót kỹ thuật do chưa truyền prop `stage` và `roundHistory`? Cần xác nhận lại từ đội ngũ kỹ thuật.
