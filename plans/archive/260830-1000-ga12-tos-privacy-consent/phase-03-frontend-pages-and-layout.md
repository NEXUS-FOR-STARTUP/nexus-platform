# Phase 3: Giao diện Trang /terms và /privacy (`apps/web-1`)

## 1. Mục tiêu
Xây dựng 2 trang công khai `/terms` và `/privacy` trên `apps/web-1` với chuẩn UI/UX cao cấp, thiết kế chỉn chu, đọc văn bản dễ dàng, hỗ trợ Table of Contents (TOC) điều hướng nhanh, và tích hợp chặt chẽ vào `AppShell`.

---

## 2. Kiến trúc Giao diện & Thành phần (Component Design)

### 2.1. Cấu trúc Layout Chung (`PolicyLayout`)
- Bọc ngoài bởi `<AppShell>` để giữ Header và Footer đồng bộ.
- Phần thân gồm 2 cột trên Desktop (Grid: `[1fr_260px]` hoặc `[240px_1fr]`):
  - **Cột Nội dung chính:** Văn bản chia theo từng Điều khoản với các Anchor ID rõ ràng (`id="dieu-1"`, `id="dieu-2"`,...), Typography chuẩn font chữ dự án (`font-display` cho tiêu đề, `font-body` cho nội dung), badge ngày có hiệu lực ("Cập nhật lần cuối: 30/08/2026").
  - **Cột Mục lục (Sticky TOC Navigation):** Hiển thị danh sách các mục chính, tự động highlight mục đang xem hoặc cho phép bấm cuộn mượt (smooth scroll) đến mục tương ứng.
- Responsive: Trên Mobile, TOC thu gọn thành một Accordion/Dropdown "Mục lục văn bản" ở đầu trang.

### 2.2. Chi tiết các File cần tạo
1. `apps/web-1/app/terms/page.tsx`:
   - Metadata Next.js: `title: "Điều khoản dịch vụ | Nexus Platform"`, `description: "Điều khoản sử dụng và quy định quyền sở hữu trí tuệ của Nexus Platform"`.
   - Nội dung Điều khoản Dịch vụ soạn thảo từ Phase 2.
2. `apps/web-1/app/privacy/page.tsx`:
   - Metadata Next.js: `title: "Chính sách bảo mật | Nexus Platform"`, `description: "Chính sách bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP của Nexus Platform"`.
   - Nội dung Chính sách Bảo mật soạn thảo từ Phase 2.
3. `apps/web-1/components/policy/PolicyDocumentLayout.tsx` (Component tái sử dụng):
   - Đóng gói khung hiển thị: Header tiêu đề lớn, badge phiên bản, thanh chia cột, sticky TOC, nút "Quay lại trang chủ" và nút in/tải tài liệu nếu cần.

---

## 3. Quy chuẩn Styling (Mantine UI v9 & Tailwind)

- Không vi phạm anti-pattern của repo:
  - Sử dụng biến màu hệ thống: `bg-bg-app`, `bg-surface-app`, `text-text-main`, `text-text-muted`, `border-border-app`, `text-brand`.
  - Không thêm class bóng đổ thủ công (`shadow-sm`/`shadow-md`) lên Mantine Paper/Card.
  - Tương thích 100% với Dark Mode và Light Mode (ThemeToggler).

---

## 4. Tiêu chí Hoàn thành (Definition of Done)
- [ ] Truy cập trực tiếp được vào `http://localhost:3001/terms` và `http://localhost:3001/privacy`.
- [ ] Giao diện responsive mượt mà trên cả màn hình Desktop và Mobile.
- [ ] Mục lục điều hướng (TOC) hoạt động chính xác khi click cuộn đến từng điều khoản.
- [ ] Hoàn toàn không phát sinh lỗi CSS/Hydration/Console warning.
