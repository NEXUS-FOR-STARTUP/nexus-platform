> **Status: COMPLETED (Verified 2026-09-21)**

# Phase 1: Landing, Pricing, FAQ & Contact

## 1. Mục tiêu & Định vị công khai
- **Khóa ngôn ngữ public:** Định vị Nexus là **"Hệ thống đánh giá và phản biện tự động dành cho các nhóm phát triển dự án ở giai đoạn ý tưởng"**.
- **Loại bỏ định vị hạn hẹp:** Bỏ hoàn toàn việc tự khóa Nexus vào `Checkpoint 1 (CP1)`, `FPT University`, `syllabus học thuật`.
- **Sửa thông tin gói dịch vụ:** Gói 79.000đ phải ghi rõ **Bao gồm 2 lượt đánh giá** (lượt 1: đánh giá ban đầu; lượt 2: đánh giá lại sau khi sửa), không để `79.000 VND / lượt`.
- **Xóa bỏ các claim sai sự thật / chưa hỗ trợ:** Bỏ claim `< 1 phút`, bỏ claim Supporter/Mentor đồng hành trực tiếp ở gói Basic, xóa Google Drive ở FAQ.
- **Xóa False Affordance:** Xóa hoàn toàn Contact Form không có backend, thay bằng thẻ thông tin liên hệ trực tiếp (Email, Hotline, Fanpage).

---

## 2. Danh sách Files cần sửa
1. `apps/web-1/components/landing/LandingHero.tsx`
2. `apps/web-1/components/landing/FeaturesGrid.tsx`
3. `apps/web-1/components/landing/LandingPricing.tsx`
4. `apps/web-1/components/landing/FAQSection.tsx`
5. `apps/web-1/components/landing/ContactUs.tsx`
6. `apps/web-1/components/layout/AppShell.tsx`

---

## 3. Chi tiết thay đổi theo từng File

### 3.1. `LandingHero.tsx`
- **Headline (H1):**
  - Cũ: `Kiểm định Ý tưởng & Đánh giá Checkpoint 1`
  - Mới (Chốt duy nhất): `Đánh giá và phản biện dự án khởi nghiệp`
- **Description:**
  - Cũ: *Nexus giúp các nhóm sinh viên kiểm định nội dung Checkpoint 1 (CP1) theo đúng tiêu chí chấm điểm học thuật, phát hiện lỗi logic lập luận bằng AI và nhận phản biện thực tế từ Supporter giàu kinh nghiệm.*
  - Mới: *Nexus đưa dự án của nhóm bạn qua quy trình đánh giá có cấu trúc — phát hiện điểm thiếu logic, nhận diện các giả định chưa kiểm chứng và gợi ý hướng hoàn thiện trước khi trình bày.*
- **Feature Bullets:**
  - Bullet 1: **Đánh giá có cấu trúc** – Báo cáo chi tiết chỉ ra các lỗ hổng lập luận và khoảng trống dữ liệu.
  - Bullet 2: **Định vị minh chứng** – Đối chiếu trực tiếp nhận xét với các phần nội dung liên quan trong tài liệu.
  - Bullet 3: **Ưu tiên hành động** – Phân loại rõ vấn đề cần xử lý trước và các gợi ý hoàn thiện thêm. *(Thay thế bullet Supporter)*
- **CTAs:**
  - Primary Button (Chốt duy nhất): `Kiểm tra nhanh ý tưởng` (Dẫn tới `/dashboard/team-fit` với đúng kỳ vọng free preview).
  - Secondary Button (Chốt duy nhất): `Xem bảng giá` (Cuộn xuống `#pricing`).

### 3.2. `FeaturesGrid.tsx`
- **Tiêu đề section:** `Quy trình đánh giá của Nexus`
- **Subtitle:** *Tập trung kiểm tra tính hợp lý, bằng chứng thực tế và mức độ sẵn sàng của dự án.*
- **4 Cards tính năng:**
  1. **Phát hiện lỗ hổng lập luận:** Chỉ ra các khẳng định thiếu căn cứ, mâu thuẫn giữa vấn đề và giải pháp đề xuất.
  2. **Định vị theo tài liệu:** Trích dẫn vị trí cụ thể trong tài liệu để nhóm biết chính xác cần sửa ở đâu.
  3. **Quản lý theo phiên bản:** Lưu trữ lịch sử từng lần đánh giá (Phiên bản 1, 2, 3...) giúp nhóm theo dõi tiến độ hoàn thiện.
  4. **5 nhóm tiêu chí đánh giá:** Đánh giá dự án qua 5 nhóm tiêu chí về vấn đề, thị trường, mô hình kinh doanh, lợi thế cạnh tranh và khả năng triển khai. *(Bám sát engine, bỏ `syllabus học thuật`, `khách hàng` và `Supporter`)*.

### 3.3. `LandingPricing.tsx`
- **Header:**
  - Subtitle: *Chi phí minh bạch, tính theo gói đánh giá tài liệu cho cả nhóm.*
- **Card Basic (Gói cốt lõi 79.000đ):**
  - Tên (Chốt duy nhất): **Đánh giá Dự án Tự động**
  - Giá: **79.000đ** / **Bao gồm 2 lượt đánh giá** *(Mỗi lượt dùng để đánh giá một phiên bản tài liệu).*
  - Sub-description: *Phù hợp cho nhóm cần rà soát tài liệu, nhận diện điểm yếu và đánh giá lại sau khi chỉnh sửa.* *(Bỏ từ "toàn diện")*.
  - Checklist:
    - `2 lượt đánh giá tài liệu độc lập`
    - `Đánh giá theo 5 nhóm tiêu chí cốt lõi`
    - `Phân loại vấn đề theo mức độ ưu tiên xử lý`
    - `Kết quả thường có sau khoảng 10 phút` *(Thay thế claim sai `< 1 phút`)*
    - `Chỉ ~16.000đ mỗi thành viên (nhóm 5 người)`
  - CTA Button: `Bắt đầu đánh giá` (Dẫn tới `/dashboard/intake?packageId=pkg_ai_audit`)
- **Xử lý Card Premium (Chốt quyết định dứt điểm):**
  - **ẨN HOÀN TOÀN CARD PREMIUM KHỎI LANDING PAGE TRONG ĐỢT NÀY.**
  - Tập trung 100% sự chú ý vào gói sản phẩm hoạt động thực tế duy nhất: Gói Đánh giá Dự án Tự động (79.000đ / 2 lượt).
  - Không hiển thị giá 149.000đ, không hiển thị checklist tính năng chưa hỗ trợ.
### 3.4. `FAQSection.tsx`
- **Câu 1 (Cách thức):** Sửa câu trả lời: *Nexus phân tích tài liệu slide hoặc đề cương bạn tải lên, đối chiếu qua 5 nhóm tiêu chí đánh giá...* *(Bỏ chữ "link Drive")*.
- **Câu 2 (Cam kết đỗ/đạt):** *Báo cáo của Nexus có đảm bảo dự án sẽ đạt kết quả tốt không?* -> *Không. Nexus là hệ thống phản biện hỗ trợ hoàn thiện tài liệu. Kết quả bảo vệ phụ thuộc vào thực tế triển khai và năng lực thuyết trình của nhóm.*
- **Câu 3 (Supporter):** Thay bằng câu hỏi về **Quy trình 2 lượt đánh giá**:
  - Q: *Gói 79.000đ bao gồm những gì và dùng thế nào?*
  - A: *Mỗi gói cấp 2 lượt đánh giá cho dự án. Lượt 1 giúp nhóm phát hiện các điểm yếu ban đầu. Sau khi chỉnh sửa tài liệu, nhóm sử dụng lượt 2 để đánh giá lại phiên bản mới.*
- **Câu 4 (Phiên bản):** Bỏ `v00, v01, v02` -> dùng `Phiên bản 1, Phiên bản 2, Phiên bản 3`.
- **Câu 5 (Bảo mật):** Bỏ slogan *bảo mật tuyệt đối / không chia sẻ bên thứ ba / xử lý an toàn*. Sử dụng câu mô tả chuẩn sự thật: *Nexus sử dụng tài liệu nhóm cung cấp để thực hiện đánh giá. Trong quá trình xử lý, nội dung có thể được truyền tới các nhà cung cấp công nghệ hỗ trợ việc phân tích. Xem chi tiết tại Chính sách bảo mật.*

### 3.5. `ContactUs.tsx`
- **Hành động cốt lõi:** **Xóa bỏ form submit giả lập (false affordance)** gây thất vọng cho người dùng khi submit chỉ hiện toast.
- **Layout mới:** Thiết kế dạng Card thông tin liên hệ gọn gàng, trang trọng:
  - Tiêu đề: **Cần hỗ trợ hoặc đóng góp ý kiến?**
  - Subtitle: *Liên hệ trực tiếp với đội ngũ phát triển Nexus qua các kênh chính thức.*
  - Kênh hiển thị:
    - **Email:** `phungluuhoanglong@gmail.com`
    - **Hotline / Zalo:** `0399 292 208`
    - **Facebook Fanpage:** Link trực tiếp fanpage Nexus chính thức (`https://www.facebook.com/profile.php?id=61591506814865`).

### 3.6. `AppShell.tsx` (Header & Footer)
- Header Desktop Action (Chốt duy nhất): Nút CTA `Đăng nhập` (href `/auth`).
- Footer links: Giữ nguyên các liên kết pháp lý chuẩn.

---

## 4. Checklist kiểm tra & Tiêu chí nghiệm thu (Verification)

1. **Build & Type Check:**
   ```bash
   bun run check-types
   ```
2. **Grep cấm từ trên Landing:**
   ```bash
   grep -E "CP1|Checkpoint 1|syllabus|Rubric|Supporter|link Drive|< 1 phút|VND / lượt|credit" apps/web-1/components/landing/
   ```
   *Kỳ vọng:* Không còn xuất hiện trên `LandingHero.tsx`, `FeaturesGrid.tsx`, `LandingPricing.tsx`, `FAQSection.tsx`, `ContactUs.tsx`.
3. **Kiểm tra trực quan (UI Verification):**
   - Card giá hiển thị: `79.000đ` và `Bao gồm 2 lượt đánh giá`.
   - Form liên hệ đã được gỡ bỏ; chỉ còn các thẻ liên hệ trực tiếp có thể click (mailto, tel, fb link).
   - Hero CTA bấm vào dẫn thẳng `/dashboard/team-fit` (label `Kiểm tra nhanh ý tưởng`).
