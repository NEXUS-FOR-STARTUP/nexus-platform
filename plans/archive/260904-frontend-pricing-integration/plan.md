---
status: pending
blockedBy: []
blocks: []
---

# Plan: Cập Nhật Giao Diện & Bảng Giá Gói Dịch Vụ Mới (UI-First)

## 1. Mục Tiêu (Goal)
Tách rời hoàn toàn giao diện (Web UI) ra khỏi phần lõi AI. Hiển thị 2 gói dịch vụ mới (Basic AI 79k và Premium Mentor 149k) trên web và xử lý luồng nộp hồ sơ, tạo đơn hàng mà chưa cần cắm lõi AI đằng sau. Các ca mua gói mới sẽ tạm nằm ở trạng thái chờ xử lý thủ công (Manual Triage) cho đến khi lõi AI hoàn thành ở đợt nâng cấp sau.

## 2. Danh Sách Các Pha (Phases)
- **Phase 01**: `phase-01-database-seed.md` - Cập nhật dữ liệu hạt giống (Seed) để có thông tin 2 gói mới trong DB.
- **Phase 02**: `phase-02-routing-and-lib.md` - Xử lý hằng số và luồng điều hướng đăng nhập (Auth Redirect).
- **Phase 03**: `phase-03-landing-pricing-ui.md` - Thiết kế bảng giá so sánh trên trang Landing Page.
- **Phase 04**: `phase-04-dashboard-cta-refactor.md` - Nâng cấp trải nghiệm mua trên Dashboard (thêm Modal chọn gói, xóa hardcode).

## 3. Quy Ước Triển Khai (Contracts)
- **Quy tắc Mantine UI**: Không dùng Tailwind utility class cho layout/spacing (`flex`, `justify-center`, `mt-`, `mb-`) đè lên các component của Mantine (như `<Group>`, `<Stack>`, `<Container>`, `<Modal>`). Sử dụng prop của component.
- **Quy tắc DB**: Không được đụng vào DDL / chạy `migrate`. Chỉ can thiệp bằng Script Seed.
- **Tiêu chí Hoàn thành (Done)**: Luồng mua gói chạy mượt từ Landing $\rightarrow$ Login $\rightarrow$ Dashboard $\rightarrow$ Nộp hồ sơ Intake mà không bị khựng lại hay lỗi tham số.