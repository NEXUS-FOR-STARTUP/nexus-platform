# Phase 3: Frontend Intake - Clean Deadline Bug v5

## Mục tiêu
Dọn dẹp hiển thị trường dư thừa "Hạn nộp bài mong muốn" tại bước 6 (Xác nhận) trong quy trình điền form Intake (`apps/web-1/app/dashboard/intake`), giải quyết phản ánh bug v5 từ người dùng.

## Chi tiết kỹ thuật

### 1. Phân tích hiện trạng
- Trong form Intake, sinh viên trải qua các bước:
  1. Tình huống (`SituationStep`)
  2. Liên hệ (`ContactStep`)
  3. Bối cảnh dự án (`ProjectContextStep`)
  4. Nhu cầu hỗ trợ (`SupportNeedsStep` - chỉ với gói có Supporter)
  5. Tài liệu (`DocumentInputStep`)
  6. Phạm vi cam kết (`BoundaryStep`)
  7. Xác nhận (`ReviewSubmitStep`)
- Trong toàn bộ form, không có trường nào cho phép người dùng nhập `values.deadline`.
- Tại bước `ReviewSubmitStep.tsx`, phần hiển thị "4. Hạn chót & gói dịch vụ" lại hiển thị:
  ```tsx
  <div className="font-semibold text-text-app">Hạn nộp bài mong muốn:</div>
  <div className="text-text-app">{formatDate(values.deadline)}</div>
  ```
  Dẫn đến giá trị luôn là "Chưa xác định" hoặc trống, gây hiểu lầm cho người dùng.

### 2. File chỉnh sửa: `apps/web-1/app/dashboard/intake/_components/Steps/ReviewSubmitStep.tsx`
- Xóa bỏ khối:
  ```tsx
  <div className="font-semibold text-text-app">Hạn nộp bài mong muốn:</div>
  <div className="text-text-app">{formatDate(values.deadline)}</div>
  ```
- Giữ nguyên tiêu đề:
  ```tsx
  <h3 className="text-base font-semibold text-brand uppercase tracking-wider">4. Hạn chót & gói dịch vụ</h3>
  ```
- Phần còn lại trong mục 4:
  - Gói phản biện đã chọn (`selectedPackage?.name ...`)
  - Mức độ ưu tiên xử lý (`isAiOnly ? "Tự động phản hồi (trong khoảng 10 phút)" : ...`)

## Tiêu chí hoàn thành (Acceptance Criteria)
- Tại Bước 6. Xác nhận (`ReviewSubmitStep`), không còn xuất hiện dòng "Hạn nộp bài mong muốn".
- Bố cục grid mục 4 cân đối, giữ nguyên tiêu đề "4. Hạn chót & gói dịch vụ" và các trường thông tin gói, mức độ ưu tiên xử lý.
- Luồng submit intake vẫn hoạt động chính xác mà không gặp bất kỳ lỗi dữ liệu nào.
