# UX Wording Context: Nexus Platform

> **Tài liệu tham chiếu bối cảnh sản phẩm (Product Context Reference)**  
> Dùng để cung cấp thông tin nền tảng về sản phẩm, luồng người dùng và các thuật ngữ đang xuất hiện trong codebase/UI phục vụ quá trình audit wording.  
> *Lưu ý: Tài liệu này phản ánh **thực tế hiện tại của sản phẩm** và ghi nhận các **điểm chưa thống nhất cần audit**, không tự ý áp đặt quy chuẩn khi chưa có quyết định từ Product Owner.*

---

## 1. Product Overview (Tổng quan sản phẩm từ Codebase & Docs)

- **Nexus Platform là gì:** Nền tảng hỗ trợ sinh viên kiểm tra, phát hiện lỗi logic lập luận và nhận phản biện cho tài liệu slide/đề cương đề án (theo `apps/web-1/components/landing/*` và `AGENTS.md` root). Trọng tâm hiện tại trên giao diện là Checkpoint 1 (CP1) môn Khởi nghiệp (EXE101).
- **Vấn đề giải quyết:** Hỗ trợ sinh viên rà soát slide trước khi bảo vệ trước hội đồng, chỉ ra lỗi lập luận và thiếu sót bằng chứng theo tiêu chí đánh giá.
- **Cách thức hoạt động theo UI:** Người dùng dán link tài liệu Google Drive → Hệ thống AI phân tích đối chiếu tiêu chí → Trả báo cáo phản biện.

---

## 2. Target Users (Đối tượng người dùng)

- **Primary user:** Sinh viên đại học làm đề án khởi nghiệp chuẩn bị bảo vệ Checkpoint 1 (CP1).
  - *Trạng thái:* Đang chuẩn bị bài nộp/slide, cần biết bài làm đã ổn chưa, áp lực thời gian và điểm số.
- **Secondary user:** Supporter / Mentor học thuật (hệ thống có route `/supporter` và module backend `apps/api/src/modules/supporter`).
- **Admin:** Quản trị viên vận hành hệ thống (route `/admin`).

---

## 3. Core User Flows (Theo cấu trúc Routes trong Codebase)

1. **Discovery (Trang chủ `/`):** Xem giới thiệu tính năng, bảng giá, FAQ → CTA đăng nhập hoặc kiểm tra miễn phí (`/dashboard/team-fit`).
2. **Authentication (`/auth`):** Đăng nhập / Đăng ký qua Better Auth (Email, Google) → Xác thực email (`/auth/verify-email`).
3. **Intake (`/dashboard/intake`):** Điền thông tin đề tài, dán link Google Drive slide/tài liệu.
4. **Payment & Wallet (`/dashboard/payment`, `/dashboard/wallet`):** Thanh toán qua SePay VietQR (nạp ví hoặc thanh toán đơn hàng).
5. **Case & Report (`/dashboard/case/[id]`):** Theo dõi trạng thái hồ sơ, xem báo cáo phản biện, tải file PDF, nộp phiên bản chỉnh sửa tiếp theo (v0, v1, v2...).
6. **Team-Fit Quiz (`/dashboard/team-fit`):** Trắc nghiệm đánh giá mức độ tương thích của đội ngũ.

---

## 4. Product Terminology (Hiện trạng sử dụng & Ambiguities cần audit)

Bảng dưới đây ghi nhận thực tế các từ ngữ đang được dùng đan xen trong codebase và UI. Đây là **danh mục cần audit và chuẩn hóa xuyên suốt các trang**:

| Khái niệm | Từ ngữ trong Codebase | Từ ngữ đang xuất hiện trên UI | Hiện trạng & Điểm cần audit |
| :--- | :--- | :--- | :--- |
| **Hồ sơ bài nộp** | `Case` (DB model, route `/case/[id]`) | `Hồ sơ`, `Dự án`, `Ý tưởng` | UI dùng không đồng nhất giữa các màn hình (lúc gọi là "Hồ sơ khởi nghiệp", lúc gọi là "Ý tưởng", lúc gọi là "Dự án"). |
| **Lượt kiểm tra** | `Audit`, `Package` | `Kiểm tra`, `Đánh giá`, `Phản biện`, `Kiểm định` | Hero dùng "Kiểm định", Features dùng "Phản biện", Pricing dùng "Kiểm tra" và "Audit". |
| **Người cố vấn / Phản biện** | Role `supporter` trong auth & API | `Supporter`, `giảng viên/mentor`, `Mentor FPT`, `chuyên gia, giảng viên hoặc mentor` | **Ambiguity lớn cần audit:** Chưa rõ định vị vai trò là "Supporter" hay "Mentor" cho sinh viên. Cần khảo sát toàn bộ các trang để tổng hợp. |
| **Kỳ đánh giá** | `Checkpoint`, `CP1` | `Checkpoint 1`, `CP1`, `Hội đồng` | Chủ yếu định vị rõ ở mốc Checkpoint 1 (CP1). |
| **Báo cáo kết quả** | `Report` | `Báo cáo chi tiết`, `Báo cáo phản biện`, `Bản draft phản biện` | Cần rà soát tên gọi chính xác của file xuất ra cho sinh viên. |
| **Khung tiêu chí** | `Rubric` | `Tiêu chí Checkpoint`, `Rubric chuẩn (5 tiêu chí)`, `Syllabus học thuật` | Các cụm từ xuất hiện rải rác chưa đồng bộ. |

---

## 5. Verified Product Truths & Constraints (Sự thật & Giới hạn đã xác minh qua Code)

1. **Gói Basic AI Audit:**
   - Giá: `79,000 VND / lượt` (nguồn: `LandingPricing.tsx`).
   - Thời gian trả kết quả cam kết trên UI: `< 1 phút` (nguồn: `LandingPricing.tsx:67`).
   - Hình thức: Tự động hoàn toàn bằng AI.
2. **Gói Premium Mentor Audit:**
   - Giá: `149,000 VND / lượt` (nguồn: `LandingPricing.tsx`).
   - Trạng thái trên UI: `Sắp ra mắt` (Badge và Button đều ghi `Sắp ra mắt`, button bị `disabled`).
   - Cam kết thời gian ghi trên UI: `SLA: 24h-48h` (nguồn: `LandingPricing.tsx:129`).
3. **Cam kết kết quả học tập:**
   - FAQ xác nhận rõ: Nexus **không** đảm bảo sinh viên sẽ pass checkpoint (nguồn: `FAQSection.tsx:11-13`).
4. **Tài liệu nộp:**
   - Nhận qua link Google Drive (nguồn: `FAQSection.tsx:8`).
5. **Nút "Kiểm tra miễn phí" trên Landing:**
   - Dẫn sang `/dashboard/team-fit` (nguồn: `LandingHero.tsx:55`).
6. **Form liên hệ trên Landing:**
   - Submit chỉ kích hoạt Toast thông báo *"Tính năng gửi liên hệ đang được phát triển. Vui lòng liên hệ trực tiếp qua Email hoặc Hotline bên cạnh."* (nguồn: `ContactUs.tsx:9-17`).

---

## 6. Writing & UX Observations (Ghi chú định hướng viết lại sau audit)

- Ngôn ngữ trên landing page hiện tại có sự pha trộn giữa thuật ngữ học thuật trang trọng (*"kiểm định"*, *"syllabus học thuật"*), tiếng Anh công nghệ (*"Basic AI Audit"*, *"Premium Mentor Audit"*), và thuật ngữ IT nội bộ (*"rà soát ảo giác"*, *"BLOCKER"*, *"SLA"*).
- Cần ưu tiên cách diễn đạt tự nhiên, trực diện, dễ hiểu với sinh viên đại học trong bước viết lại sau khi hoàn thành audit toàn bộ các màn hình.
