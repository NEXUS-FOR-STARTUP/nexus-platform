# Phase 6: Consistency Sweep & System Polish

## 1. Mục tiêu & Ranh giới Phạm vi Quét
- **Ranh giới áp dụng (Crucial Scope Boundary):**
  - **ÁP DỤNG CHO:** Toàn bộ **Student-Facing UI & Public Pages** (`apps/web-1/app/dashboard/`, `apps/web-1/components/`, `apps/web-1/app/(public)`).
  - **GIỮ NGUYÊN (Không refactor):** Các định danh kỹ thuật backend, database schema, Prisma models, API routes, và các workspace nội bộ của Admin (`apps/web-1/app/admin/`) và Supporter (`apps/web-1/app/supporter/`). Các thuật ngữ `Case`, `Credit`, `Supporter`, `LifecycleUnit` được phép tồn tại nội bộ theo đúng Báo cáo Mục XXIV.
- **Bổ sung 4 trạng thái người dùng cốt lõi (Report dòng 34-46):** Rà soát triệt để: **Upload tài liệu**, **Empty state**, **Error state**, và **Toast feedback**.
- **Điều chỉnh các claim nhạy cảm (Privacy & Policy — Tuân thủ Mục XXI, dòng 875-910):**
  - Xóa bỏ hoàn toàn claim *“Xóa dự án sẽ xóa vĩnh viễn mọi dữ liệu”* (Báo cáo đã xác nhận: file trên Cloudinary hiện chưa được cleanup).
  - Xóa bỏ claim *“Không chia sẻ với bên thứ ba”* (thực tế tài liệu được truyền tới các AI providers để phân tích).
  - Xóa bỏ claim *“Dữ liệu không được dùng để train AI”* (chưa đủ căn cứ kỹ thuật để khẳng định).
  - Không dùng các slogan tiếp thị: *“bảo mật tuyệt đối”*, *“bảo mật nghiêm ngặt”*, hay các khẳng định chung chung chưa giải thích rõ.
  - Áp dụng văn phong mô tả sự thật (Factual description): *“Nexus sử dụng tài liệu bạn cung cấp để thực hiện quá trình đánh giá. Trong quá trình xử lý, nội dung có thể được truyền tới các nhà cung cấp công nghệ hỗ trợ việc phân tích.”*
- **Rà soát Toast & Microcopy:** Thay thế các thông báo generic `Thành công / Lỗi` bằng thông báo kết quả thực tế. Cắt giảm tối đa các từ ngữ mệnh lệnh hành chính (`Vui lòng...`).
---

## 2. Danh sách Files cần sửa

### A. Chính sách & Pháp lý
1. `apps/web-1/app/terms/page.tsx`
2. `apps/web-1/app/privacy/page.tsx`
3. `apps/web-1/app/refund-policy/page.tsx`
4. `apps/web-1/app/fair-use-policy/page.tsx`
5. `apps/web-1/components/policy/PolicyDocumentLayout.tsx`

### B. Xác thực & Cài đặt
6. `apps/web-1/app/auth/page.tsx`
7. `apps/web-1/app/auth/verify-email/page.tsx`
8. `apps/web-1/app/dashboard/settings/profile/page.tsx`
9. `apps/web-1/app/dashboard/settings/password/page.tsx`
10. `apps/web-1/app/dashboard/settings/sessions/page.tsx`
11. `apps/web-1/app/dashboard/settings/notifications/page.tsx`

### C. Khung giao diện & Menu
12. `apps/web-1/components/layout/DashboardShell.tsx`
13. `apps/web-1/components/layout/_components/UserMenu.tsx`
14. `apps/web-1/components/layout/NotificationBell.tsx`

---

## 3. Danh mục rà soát & Tinh chỉnh chi tiết

### 3.1. Các trang Chính sách & Pháp lý
- **Quyền riêng tư (`privacy/page.tsx`):**
  - Viết lại phần lưu trữ và chia sẻ bằng câu mô tả chuẩn sự thật từ Báo cáo (dòng 908):
    *“Nexus sử dụng tài liệu bạn cung cấp để thực hiện quá trình đánh giá. Trong quá trình xử lý, nội dung có thể được truyền tới các nhà cung cấp công nghệ hỗ trợ việc phân tích.”*
  - Xóa bỏ dứt điểm: slogan *“bảo mật tuyệt đối”*, *“bảo mật nghiêm ngặt”*, claim *“không chia sẻ bên thứ ba”*, claim *“không dùng để train AI”*, và claim *“xóa vĩnh viễn mọi dữ liệu”*.
  - Đổi các tham chiếu từ `Case / Hồ sơ / Credit` thành `Dự án / Lượt đánh giá`.
  - Làm rõ chính sách hoàn lượt: *Nếu quá trình đánh giá gặp lỗi kỹ thuật từ hệ thống, lượt đánh giá sẽ được tự động hoàn lại vào tài khoản dự án của bạn.*

### 3.2. Màn hình Auth & Cài đặt (`auth/`, `settings/`)
- **Đăng nhập / Đăng ký (`auth/page.tsx`):**
  - Subtitle: *Nền tảng đánh giá và phản biện dự án khởi nghiệp.*
  - Nút đăng nhập: `Đăng nhập tài khoản` (bỏ `Vui lòng đăng nhập...`).
- **Cài đặt (`settings/`):**
  - Thay `Thông tin hồ sơ cá nhân` -> `Thông tin tài khoản`.
  - Bỏ các toast thừa: Thay vì `Thành công / Cập nhật hồ sơ thành công!`, chuyển thành `Đã lưu thay đổi thông tin`.

### 3.3. Khung điều hướng chung (`DashboardShell.tsx`, `UserMenu.tsx`)
- Menu điều hướng:
  - `Dự án của tôi` (Thay vì `Danh sách hồ sơ` hoặc `Cases`)
  - `Kiểm tra nhanh (Team Fit)` (Thay vì chỉ ghi `Team Fit` cộc lốc)
  - `Ví & Thanh toán` (Thay vì `Quản lý credit`)
### 3.4. Chuẩn hóa 4 Trạng thái Người dùng Nhìn thấy (User-Visible States)
Theo Báo cáo Định hướng (dòng 34–46), rà soát đồng bộ 4 nhóm trạng thái:
1. **Upload tài liệu (Upload state & Dropzone):**
   - Tiêu đề Dropzone: `Kéo thả tài liệu slide hoặc đề cương vào đây`
   - Subtext (Đúng capability thật): `Hỗ trợ PDF, PPTX, DOCX, XLSX, MD và TXT · tối đa 5 tệp, 15MB mỗi tệp.`
   - Lỗi định dạng/dung lượng: Thông báo rõ ràng nguyên nhân thay vì mã lỗi kỹ thuật.
2. **Trạng thái rỗng (Empty state):**
   - Chưa có dự án (`DashboardEmptyState.tsx`): Hướng dẫn tạo dự án hoặc kiểm tra nhanh.
   - Chưa có tài liệu (`DocumentRowsTable.tsx`): `Chưa có tài liệu nào được tải lên cho dự án này.`
   - Chưa có báo cáo (`TabReportFindings.tsx`): `Báo cáo đánh giá sẽ xuất hiện tại đây sau khi hoàn tất phân tích tài liệu.`
   - Chưa có giao dịch ví (`WalletTransactionTable.tsx`): `Chưa có lịch sử giao dịch nào.`
3. **Trạng thái lỗi (Error state & Recovery):**
   - Lỗi validation form: Đặt cạnh field vi phạm, giải thích cách sửa.
   - Lỗi mạng/upstream: `Không thể kết nối tới máy chủ. Nhóm bạn vui lòng kiểm tra mạng và thử lại.`
   - Tuyệt đối không để lộ: `API key`, `Google AI`, `Gemini`, `500 Internal Error`, `Session ID`, `HTTP Status`.
4. **Thông báo phản hồi (Toast feedback):**
   - Bỏ pattern sáo rỗng: `Thành công / Cập nhật thành công!`
   - Chuyển thành câu thông báo kết quả thật:
     - `Đã lưu thay đổi thông tin`
     - `Đã thêm ${creditsGranted} lượt đánh giá cho dự án` (Chốt duy nhất, tính động theo số lượt thực nhận)
     - `Đã tải lên tài liệu thành công`
    - `Tải tài liệu thất bại — Kiểm tra lại kích thước tệp`

---
## 4. Bảng kịch bản Grep quét sạch toàn Codebase (`apps/web-1`)

Sau khi hoàn thành 5 phase đầu, chạy các lệnh grep sau để bắt trọn các điểm còn sót:

### 1. Quét cấm từ `credit` (trong student UI):
```bash
grep -rn "credit" apps/web-1/app/dashboard/ apps/web-1/components/
```
*Yêu cầu:* Chỉ cho phép tồn tại trong các file kỹ thuật nội bộ (như hook name `useCreateCreditOrder`, type `credit_balance`). Tất cả label/chuỗi JSX hiển thị cho người dùng phải chuyển thành `lượt` hoặc `lượt đánh giá`.

### 2. Quét cấm từ hành chính `thẩm định`, `kiểm định`:
```bash
grep -rn -E "thẩm định|kiểm định" apps/web-1/app/dashboard/ apps/web-1/components/
```
*Yêu cầu:* Thay toàn bộ bằng `đánh giá` hoặc `phản biện`.

### 3. Quét cấm từ `Google Drive` / `link Drive`:
```bash
grep -rn -E "Google Drive|link Drive" apps/web-1/app/ apps/web-1/components/
```
*Yêu cầu:* 0 kết quả trên UI người dùng.

### 4. Quét cấm từ `Case` / `Hồ sơ` trên UI:
```bash
grep -rn -E "Hồ sơ của bạn|Chi tiết hồ sơ|Tạo hồ sơ|Nộp hồ sơ" apps/web-1/app/dashboard/ apps/web-1/components/
```
*Yêu cầu:* Chuyển toàn bộ thành `Dự án của bạn`, `Chi tiết dự án`, `Đăng ký đánh giá dự án`.

### 5. Quét cấm từ `AI Engine` / `OMP Worker`:
```bash
grep -rn -E "Nexus AI Engine|OMP Worker|khởi động tiến trình" apps/web-1/app/dashboard/
```
*Yêu cầu:* 0 kết quả trên student-facing copy.

### 6. Quét thừa từ `Vui lòng`:
```bash
grep -rn "Vui lòng" apps/web-1/app/dashboard/ apps/web-1/components/
```
*Yêu cầu:* Lược bỏ tối đa, chỉ giữ ở những cảnh báo pháp lý/hệ thống tối cần thiết.

---

## 5. Checklist kiểm tra cuối cùng (Final Verification Gate)

1. **Kiểm tra kiểu dữ liệu toàn monorepo:**
   ```bash
   bun run check-types
   ```
2. **Kiểm tra linter không lỗi:**
   ```bash
   bun run lint
   ```
3. **Build thử nghiệm Next.js:**
   ```bash
   bun run build
   ```
4. **Kiểm tra trải nghiệm thực tế:**
   - Đi từ Landing Page → Kiểm tra nhanh (Team Fit) → Đăng ký đánh giá (Intake) → Mua gói 79k (2 lượt) → Theo dõi trạng thái (~10 phút) → Xem báo cáo (Phiên bản 1) → Tải PDF.
   - Toàn bộ hành trình nói chung một giọng, nhất quán về thuật ngữ, không bị gián đoạn mental model.
