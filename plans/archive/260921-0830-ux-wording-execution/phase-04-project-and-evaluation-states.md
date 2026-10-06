# Phase 4: Project & Evaluation States (Lifecycle & States)

## 1. Mục tiêu & Chuẩn hóa Trạng thái
- **Chuyển dịch đối tượng:** Thay thế toàn bộ `Case / Hồ sơ` thành **"Dự án"** trên giao diện sinh viên.
- **Đơn giản hóa State Machine:** Không bắt sinh viên học trạng thái kỹ thuật của backend. Gom các trạng thái phức tạp thành 5 trạng thái người dùng dễ hiểu:
  1. **Sẵn sàng đánh giá:** Tài liệu đã có, đủ lượt. CTA: `Bắt đầu đánh giá`.
  2. **Đang chuẩn bị xử lý:** Hệ thống đã tiếp nhận yêu cầu.
  3. **Đang đánh giá:** Nexus đang phân tích tài liệu. *(Thời gian: ~10 phút; người dùng có thể rời trang).*
  4. **Có kết quả:** Báo cáo đã hoàn tất. CTA: `Xem báo cáo`.
  5. **Có sự cố / Chưa hoàn tất:** Thông báo lỗi thân thiện, khẳng định lượt đánh giá đã được hoàn lại, CTA: `Thử lại`.
- **Loại bỏ Developer-Speak:** Xóa sạch các từ: `Nexus AI Engine`, `tiến trình thẩm định tự động`, `Worker`, `Queue`, `Pipeline`, `Admin phân công Supporter trong 12-24h`.

---

## 2. Danh sách Files cần sửa

### A. Dashboard Home & Danh sách Dự án
1. `apps/web-1/app/dashboard/page.tsx`
2. `apps/web-1/app/dashboard/_components/CaseCard.tsx`
3. `apps/web-1/app/dashboard/_components/CaseListFilters.tsx`
4. `apps/web-1/app/dashboard/_components/DashboardEmptyState.tsx`
5. `apps/web-1/types/case.ts` (`statusThemeMap`)

### B. Chi tiết Dự án & Trạng thái Đánh giá
6. `apps/web-1/app/dashboard/case/[id]/page.tsx`
7. `apps/web-1/app/dashboard/case/[id]/_components/CaseStatusHeader.tsx`
8. `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceSidebar.tsx`
9. `apps/web-1/app/dashboard/case/[id]/_components/WorkspaceTabs.tsx`
10. `apps/web-1/app/dashboard/case/[id]/_components/StatusGuidanceCard.tsx`
11. `apps/web-1/app/dashboard/case/[id]/_components/statusCopyMap.ts`
12. `apps/web-1/app/dashboard/case/[id]/_components/overview/CaseOverviewTab.tsx`
13. `apps/web-1/app/dashboard/case/[id]/_components/overview/caseOverviewModel.ts`
14. `apps/web-1/app/dashboard/case/[id]/_components/ActiveRadarScanning.tsx`
15. `apps/web-1/app/dashboard/case/[id]/_components/RadarHeader.tsx`
16. `apps/web-1/app/dashboard/case/[id]/_components/RadarStagePipeline.tsx`

### C. Workspace Quản lý Tài liệu
17. `apps/web-1/app/dashboard/case/[id]/_components/documents/DocumentWorkspace.tsx`
18. `apps/web-1/app/dashboard/case/[id]/_components/documents/DocumentWorkspaceHeader.tsx`
19. `apps/web-1/app/dashboard/case/[id]/_components/documents/DocumentRowsTable.tsx`
20. `apps/web-1/app/dashboard/case/[id]/_components/documents/StudentDocumentUploadModal.tsx`

---

## 3. Chi tiết thay đổi

### 3.1. `types/case.ts` (Tách biệt Student Mapping và Admin Mapping)
> **Lưu ý kiến trúc quan trọng:** `statusThemeMap` hiện đang được dùng chung bởi cả Admin (`AdminCaseAssignmentTable`, `AdminCaseDetailModal`) và Student UI. **Không được ghi đè trực tiếp `statusThemeMap`** vì sẽ làm sai lệch các trạng thái điều phối nội bộ của Admin.
Thay vào đó: Bổ sung `studentStatusThemeMap` chuyên biệt cho Student UI và trỏ các component sinh viên (`CaseCard`, `CaseStatusHeader`, `CaseOverviewTab`) vào map này:
- `intake_pending`: `Chưa kích hoạt — Cần mua lượt đánh giá` *(Bỏ chữ `credit`)*
- `intake_ready`: `Sẵn sàng đánh giá`
- `submitted`: `Đang chuẩn bị đánh giá`
- `under_review`: `Đang đánh giá tài liệu`
- `report_ready`: `Báo cáo đã sẵn sàng` *(Bỏ `Báo cáo phản biện sẵn sàng`)*
- `waiting_for_revision`: `Chờ nhóm cập nhật tài liệu`
- `revision_submitted`: `Đã tải lên phiên bản mới`
- `completed`: `Đã hoàn tất đánh giá`
- `rejected`: `Yêu cầu chưa được duyệt` *(Phân biệt rõ với sự cố hệ thống `failed`)*
### 3.2. `CaseCard.tsx` & `DashboardEmptyState.tsx`
- **`CaseCard.tsx`:**
  - Fallback tên: `Dự án chưa đặt tên` *(Thay vì `Hồ sơ chưa đặt tên nhóm`)*
  - Badge số lượt: `Còn ${item.credit_balance} lượt đánh giá` *(Thay thế `Có ${item.credit_balance} credit`)*
- **`DashboardEmptyState.tsx`:**
  - Tiêu đề: `Nhóm bạn chưa có dự án nào`
  - Mô tả: *Bắt đầu bằng việc kiểm tra nhanh ý tưởng hoặc đăng ký đánh giá tài liệu dự án.*
  - Nút bấm: `Đăng ký đánh giá dự án mới`

### 3.3. `statusCopyMap.ts` & `StatusGuidanceCard.tsx`
Viết lại toàn bộ copy hướng dẫn trạng thái (Tuân thủ nghiêm ngặt: KHÔNG dùng "ít phút", KHÔNG hứa thời gian cố định, KHÔNG lộ worker/engine/admin phân công):
- **`AI_STATUS_GUIDANCE_COPY.submitted`:**
  - Tiêu đề: `Đang chuẩn bị đánh giá`
  - Mô tả: *Nexus đã tiếp nhận tài liệu và đang chuẩn bị đưa vào quy trình đánh giá.*
- **`AI_STATUS_GUIDANCE_COPY.under_review`:**
  - Tiêu đề: `Nexus đang đánh giá tài liệu của nhóm bạn`
  - Mô tả: *Hệ thống đang phân tích chi tiết tài liệu theo 5 nhóm tiêu chí. Kết quả thường có sau khoảng 10 phút. Bạn có thể quay lại dự án sau để kiểm tra kết quả.*
- **`STATUS_GUIDANCE_COPY.submitted`:**
  - Tiêu đề: `Đã tiếp nhận yêu cầu đánh giá`
  - Mô tả: *Hệ thống đang kiểm tra tính hợp lệ của tài liệu đã tải lên. Bạn chưa cần làm gì thêm.*
- **`STATUS_GUIDANCE_COPY.report_ready`:**
  - Tiêu đề: `Báo cáo đánh giá đã sẵn sàng`
  - Mô tả: *Đánh giá chi tiết tài liệu của nhóm đã hoàn thành. Hãy xem báo cáo để nắm rõ các điểm cần chỉnh sửa.*
  - CTA: `Xem báo cáo ngay`
- **`STATUS_GUIDANCE_COPY.revision_submitted` (Trong `StatusGuidanceCard.tsx`):**
  - Tiêu đề: `Đã tiếp nhận phiên bản mới — Đang chuẩn bị đánh giá` *(Bỏ hoàn toàn "Chờ Admin phân công" và "Chờ Supporter thẩm định")*
  - Mô tả: *Tài liệu cập nhật của nhóm đã được ghi nhận và đang được đưa vào lượt đánh giá tiếp theo.*
- **`intake_pending` (Trong `StatusGuidanceCard.tsx`):**
  - Sửa `Đã có X credit` -> `Đã có X lượt đánh giá khả dụng — Hãy nộp tài liệu để bắt đầu đánh giá`
  - Bỏ `Mua credit` -> `Mua lượt đánh giá`
- **Trạng thái Thất bại / Sự cố (Tuân thủ nguyên tắc không hứa hẹn refund khi chưa xác minh):**
  - Tiêu đề: `Đánh giá chưa hoàn tất`
  - Mô tả: *Có sự cố trong quá trình xử lý. Hãy thử lại.*
  - CTA: `Thử lại`
  - **Quy tắc hiển thị thông tin hoàn lượt:** Tuyệt đối không khẳng định chung chung *"Lượt đánh giá đã được giữ nguyên hoặc hoàn lại"*. Chỉ bổ sung câu *"Lượt đánh giá đã được hoàn lại."* khi frontend nhận được xác nhận chính xác từ backend về system failure kèm refund event.
### 3.4. `WorkspaceSidebar.tsx` & `WorkspaceTabs.tsx`
- Tab Overview: `Tổng quan dự án`
- Tab Documents: `Tài liệu`
- Tab Report: `Báo cáo đánh giá` *(Thay vì `Báo cáo phản biện`)*
- Tab Discussion: `Thảo luận` *(Thay vì `Chat với Supporter`)*
- Tab Credits: `Lượt đánh giá` *(Thay vì `Quản lý số dư credit`)*
- Tab Timeline: `Lịch sử hoạt động`

### 3.5. Radar Scanner & Pipeline (`ActiveRadarScanning.tsx`, `RadarHeader.tsx`, `RadarStagePipeline.tsx`)
- Thay thế các thuật ngữ radar máy móc bằng mô tả thân thiện:
  - Cũ: *Đang quét tín hiệu radar... OMP audit pipeline...*
  - Mới: *Đang phân tích cấu trúc tài liệu và đối chiếu các tiêu chí lập luận...*
  - Bỏ nhắc đến `OMP Worker`, `Redis Queue`, `Session ID`.

---

## 4. Checklist kiểm tra & Tiêu chí nghiệm thu (Verification)

1. **Build & Type Check:**
   ```bash
   bun run check-types
   ```
2. **Grep cấm từ trong Lifecycle & States:**
   ```bash
   grep -E "thẩm định tự động qua Nexus AI Engine|Phân công Supporter trong|Có [0-9]+ credit|Hồ sơ chưa đặt tên|Báo cáo phản biện sẵn sàng" apps/web-1/app/dashboard/case/ apps/web-1/types/case.ts
   ```
   *Kỳ vọng:* 0 kết quả khớp.
3. **Kiểm tra trực quan (UI Verification):**
   - Dashboard hiển thị các thẻ `Dự án`, badge hiển thị `Còn X lượt đánh giá`.
   - Trang chi tiết dự án: StatusGuidanceCard hiển thị đúng 5 nhóm trạng thái thân thiện.
   - Khi đang chạy đánh giá, có thông điệp rõ ràng: *Kết quả thường có sau khoảng 10 phút. Bạn có thể quay lại dự án sau để kiểm tra kết quả.*
