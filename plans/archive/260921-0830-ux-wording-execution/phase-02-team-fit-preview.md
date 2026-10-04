# Phase 2: Team Fit (Free Preview Funnel)

## 1. Mục tiêu & Định vị
- **Định vị đúng vai trò:** Team Fit là công cụ **Free Preview / Surface Scan** mang tên: **"Kiểm tra nhanh ý tưởng & đội ngũ"**.
- **Kỳ vọng phù hợp:** Chỉ ra những điểm chưa rõ ràng trong ý tưởng và năng lực nhóm có thể đang thiếu. **Không hứa hẹn** phân tích chuyên sâu, không hứa xếp hạng năng lực cá nhân.
- **Che giấu lỗi hệ thống:** Tuyệt đối không để lộ thông báo kỹ thuật như: *"Không thể xác thực với Google AI. Kiểm tra lại API key."*
- **Hội tụ vào Paid Funnel:** Sau khi xem kết quả sơ bộ, dẫn dắt tự nhiên sang **"Đánh giá dự án"** (gói 79k gồm 2 lượt) để phân tích tài liệu slide/đề cương thực tế.

---

## 2. Danh sách Files cần sửa
1. `apps/web-1/app/dashboard/team-fit/page.tsx`
2. `apps/web-1/app/dashboard/team-fit/_components/StepIndicator.tsx`
3. `apps/web-1/app/dashboard/team-fit/_components/IdeaMadLibsStep.tsx`
4. `apps/web-1/app/dashboard/team-fit/_components/TeamInputStep.tsx`
5. `apps/web-1/app/dashboard/team-fit/_components/TeamMemberCard.tsx`
6. `apps/web-1/app/dashboard/team-fit/_components/ReadyState.tsx`
7. `apps/web-1/app/dashboard/team-fit/_components/TeamFitResultStep.tsx`
8. `apps/web-1/app/dashboard/team-fit/_components/ErrorBanner.tsx`
9. `apps/web-1/app/dashboard/team-fit/_components/NavigationButtons.tsx`

---

## 3. Chi tiết thay đổi theo từng File

### 3.1. `page.tsx` (Team Fit Root)
- **Tiêu đề trang (Header):**
  - Cũ: `Đánh giá Team-Idea Fit`
  - Mới: `Kiểm tra nhanh ý tưởng & đội ngũ`
- **Mô tả (Subtitle):**
  - Cũ: *Điền thông tin dự án và đội ngũ để AI phân tích sự phù hợp*
  - Mới: *Mô tả ngắn ý tưởng và các thành viên trong nhóm. Nexus sẽ chỉ ra những điểm còn chưa rõ và năng lực nhóm có thể đang thiếu.*
- **Thông báo lỗi lưu/chạy (Error handling):**
  - Bỏ các thông điệp lỗi generic/hệ thống. Thay bằng: *Chưa thể phân tích dữ liệu lúc này. Hãy kiểm tra kết nối mạng và thử lại.*

### 3.2. `StepIndicator.tsx`
- **Bước 1:** `1. Ý tưởng cốt lõi` (Thay vì `Mô tả ý tưởng`)
- **Bước 2:** `2. Thành viên nhóm` (Thay vì `Thông tin đội ngũ`)
- **Bước 3:** `3. Kết quả sơ bộ` (Thay vì `Kết quả phân tích` — nhấn mạnh tính chất preview)

### 3.3. `IdeaMadLibsStep.tsx` & `InlineBlank.tsx`
- **Hướng dẫn:** *Hoàn thành các câu bên dưới để định hình nhanh bài toán dự án đang giải quyết.*
- **Placeholder:** Đảm bảo placeholder là ví dụ cụ thể thay vì lặp lại label.
  - Tên dự án: `Ví dụ: Nền tảng tìm bạn cùng phòng` (Thay vì `Tên dự án của bạn`)
  - Khách hàng mục tiêu: `Ví dụ: Sinh viên đại học năm nhất`
  - Vấn đề: `Ví dụ: Khó khăn trong việc tìm người ở ghép phù hợp lối sống`

### 3.4. `TeamInputStep.tsx` & `TeamMemberCard.tsx`
- **Header:** *Các thành viên tham gia thực hiện dự án*
- **Helper text:** *Nexus sử dụng thông tin kỹ năng để chỉ ra những năng lực nhóm có thể đang thiếu.*
- **Nút thêm thành viên:** `Thêm thành viên` (Bỏ `Vui lòng...`)
- **Field Labels (Bám sát implementation thật `major`, `strengths`, `experience`):** `Chuyên ngành`, `Thế mạnh / kỹ năng nổi bật`, `Kinh nghiệm`. Tuyệt đối không tự bịa thêm các field mới như `Họ và tên`, `Vai trò chính` gây vỡ schema.

### 3.5. `ReadyState.tsx`
- **Tiêu đề:** *Sẵn sàng kiểm tra sơ bộ*
- **Mô tả (Factual surface scan, không overclaim):** *Nexus sẽ kiểm tra sơ bộ thông tin về ý tưởng và đội ngũ để chỉ ra những điểm còn chưa rõ hoặc năng lực nhóm có thể đang thiếu.*
- **CTA:** `Bắt đầu kiểm tra nhanh` (Thay vì `Phân tích ngay`).

### 3.6. `TeamFitResultStep.tsx` (Quan trọng nhất)
- **Banner giải thích bản chất kết quả:** Thêm thông điệp ngắn đầu trang:
  - *Đây là kết quả kiểm tra sơ bộ dựa trên thông tin mô tả ngắn của nhóm.*
- **Card 1 (Khoảng trống nhân sự):**
  - Tiêu đề: `Nhóm có thể đang thiếu...`
  - Nội dung giữ các gạch đầu dòng do AI trả về.
- **Card 2 (Khoảng trống ý tưởng):**
  - Tiêu đề: `Ý tưởng dự án cần làm rõ thêm ở...`
- **Hàng nút hành động:**
  - Nút lưu: `Lưu kết quả & Tạo dự án` (Thay vì `Lưu kết quả`)
  - Nút xem dự án sau khi lưu: `Xem dự án →` (Thay thế dứt điểm `Xem case →`)
- **Banner chuyển đổi (Upsell Banner sang Paid):**
  - Tiêu đề Cũ: *Muốn được Supporter kiểm tra chuyên sâu?*
  - Tiêu đề Mới: **Cần đánh giá kỹ hơn từ tài liệu của dự án?** *(Bỏ từ "toàn diện")*
  - Mô tả Cũ: *Nhận phản biện chi tiết từ Supporter giàu kinh nghiệm. Giá chỉ 79,000 VND / lượt.*
  - Mô tả Mới: *Tải lên slide hoặc đề cương hoàn chỉnh để nhận báo cáo phản biện chi tiết qua 5 nhóm tiêu chí. Gói 79.000đ bao gồm 2 lượt đánh giá.*
  - Nút CTA: `Đánh giá dự án` *(Bỏ từ "toàn diện" — dẫn tới dự án vừa tạo để chọn nộp tài liệu/thanh toán).*

### 3.7. `ErrorBanner.tsx`
- Không hiển thị bất kỳ chuỗi raw nào chứa `API key`, `Google AI`, `Gemini`, `500 Internal Error`.
- Map tất cả lỗi upstream về câu:
  - *Hệ thống đang bận hoặc gián đoạn kết nối. Nhóm bạn vui lòng thử lại sau giây lát.*

---

## 4. Checklist kiểm tra & Tiêu chí nghiệm thu (Verification)

1. **Build & Type Check:**
   ```bash
   bun run check-types
   ```
2. **Grep cấm từ trong Team Fit:**
   ```bash
   grep -E "API key|Google AI|Xem case|Supporter giàu kinh nghiệm|VND / lượt" apps/web-1/app/dashboard/team-fit/
   ```
   *Kỳ vọng:* 0 kết quả khớp.
3. **Kiểm tra trực quan (UI Flow Verification):**
   - Tiêu đề hiển thị đúng: `Kiểm tra nhanh ý tưởng & đội ngũ`.
   - Kết quả sơ bộ có 2 card `Nhóm có thể đang thiếu...` và `Ý tưởng dự án cần làm rõ thêm ở...`.
   - Nút điều hướng sau khi lưu chuyển thành `Xem dự án →`.
   - Banner chuyển tiếp mời đánh giá dự án ghi rõ `Gói 79.000đ bao gồm 2 lượt đánh giá`.
