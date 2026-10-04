---
name: Nexus Platform
description: "AI-powered venture critique & academic startup mentorship workspace"
version: "1.0.0"
colors:
  # Primary Brand (Sapphire Blue)
  primary: "#2563EB"
  primary-hover: "#1D4ED8"
  primary-active: "#1E40AF"
  primary-soft: "#DBEAFE"
  primary-subtle: "#EFF6FF"
  primary-dark: "#3B82F6"
  primary-dark-hover: "#60A5FA"

  # Warm Accent (Energetic Orange)
  accent: "#F97316"
  accent-hover: "#EA580C"
  accent-soft: "#FFEDD5"

  # Semantic & Status
  success: "#10B981"
  success-soft: "#D1FAE5"
  warning: "#F59E0B"
  warning-soft: "#FEF3C7"
  danger: "#EF4444"
  danger-soft: "#FEE2E2"
  info: "#3B82F6"
  info-soft: "#DBEAFE"

  # Light Mode Surfaces & Neutrals (Slate Palette)
  background: "#F8FAFC"
  surface: "#FFFFFF"
  surface-soft: "#F1F5F9"
  surface-muted: "#E2E8F0"
  border: "#E2E8F0"
  border-strong: "#CBD5E1"
  text-primary: "#0F172A"
  text-muted: "#475569"
  text-subtle: "#64748B"

  # Dark Mode Surfaces & Neutrals (Midnight Slate)
  dark-background: "#090E1A"
  dark-surface: "#121B2E"
  dark-surface-soft: "#1B2640"
  dark-surface-muted: "#243257"
  dark-border: "#1E294B"
  dark-border-strong: "#2E3D6B"
  dark-text-primary: "#F8FAFC"
  dark-text-muted: "#94A3B8"
  dark-text-subtle: "#64748B"

  # Specialized Callout Tokens
  audit-cta-bg: "#F0FDFA"
  audit-cta-border: "#99F6E4"
  audit-cta-title: "#115E59"
  dark-audit-cta-bg: "rgba(13, 148, 136, 0.15)"
  dark-audit-cta-border: "#0F766E"
  dark-audit-cta-title: "#5EEAD4"

typography:
  fontFamily: "Google Sans Flex, Inter, -apple-system, BlinkMacSystemFont, sans-serif"
  h1:
    fontSize: "2.25rem" # 36px
    lineHeight: "2.75rem"
    fontWeight: 700
  h2:
    fontSize: "1.75rem" # 28px
    lineHeight: "2.25rem"
    fontWeight: 600
  h3:
    fontSize: "1.375rem" # 22px
    lineHeight: "1.75rem"
    fontWeight: 600
  h4:
    fontSize: "1.125rem" # 18px
    lineHeight: "1.5rem"
    fontWeight: 600
  h5:
    fontSize: "1rem" # 16px
    lineHeight: "1.5rem"
    fontWeight: 600
  h6:
    fontSize: "0.875rem" # 14px
    lineHeight: "1.25rem"
    fontWeight: 600
  body-lg:
    fontSize: "1.125rem" # 18px
    lineHeight: "1.75rem"
    fontWeight: 400
  body-md:
    fontSize: "1rem" # 16px (0.875rem on mobile)
    lineHeight: "1.5rem"
    fontWeight: 400
  body-sm:
    fontSize: "0.875rem" # 14px (0.8125rem on mobile)
    lineHeight: "1.25rem"
    fontWeight: 400
  caption:
    fontSize: "0.75rem" # 12px
    lineHeight: "1rem"
    fontWeight: 500

rounded:
  none: "0px"
  xs: "2px"
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"

spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "20px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"

elevation:
  sm: "0 0 12px 1px rgba(15, 23, 42, 0.04), 0 2px 4px 0 rgba(15, 23, 42, 0.02)"
  md: "0 0 18px 2px rgba(15, 23, 42, 0.06), 0 4px 6px -1px rgba(15, 23, 42, 0.03)"
  none: "none"
---

# Nexus Platform — Design System Specification

## 1. System Overview
**Nexus Platform** là nền tảng cố vấn và phản biện khởi nghiệp học thuật kết hợp AI chuyên sâu và chuyên gia con người (Supporter).
- **Ngăn xếp công nghệ UI**: Next.js 16 App Router, Mantine UI v9, Tailwind CSS v4, Lucide React.
- **Phong cách thị giác (Visual Tone)**: Tinh tế, điềm đạm (calm), chuẩn mực học thuật & startup công nghệ, rõ ràng (clear), đáng tin cậy (trustworthy). Tuyệt đối không rực rỡ giả tạo, không dùng hiệu ứng AI neon sáo rỗng.
- **Ngôn ngữ giao diện**: Ưu tiên tiếng Việt tự nhiên, trực diện, tôn trọng văn phong học thuật và khởi nghiệp thực chiến.

### 1.1 Bảng ánh xạ Utility Classes (Tailwind CSS v4 @theme)
Toàn bộ biến giao diện được khai báo tại `apps/web-1/app/globals.css`. Khi viết mã JSX/Tailwind, bắt buộc dùng các class token chuẩn sau thay vì các màu mặc định:

| Nhóm Token | Utility Class (Tailwind v4) | CSS Variable tương ứng | Ứng dụng cụ thể |
|---|---|---|---|
| **Nền ứng dụng** | `bg-bg-app` | `var(--color-bg)` (`#F8FAFC`) | Nền chung của page / viewport |
| **Bề mặt chính** | `bg-surface-app` | `var(--color-surface)` (`#FFFFFF`) | Thẻ Card, Panel, Modal, Drawer |
| **Bề mặt phụ** | `bg-surface-soft` | `var(--color-surface-soft)` (`#F1F5F9`) | Khung phụ, container thứ cấp, input background |
| **Bề mặt mờ** | `bg-surface-muted` | `var(--color-surface-muted)` (`#E2E8F0`) | Hàng bảng hover, tab không kích hoạt |
| **Đường viền** | `border-border-app` | `var(--color-border)` (`#E2E8F0`) | Viền tiêu chuẩn của card, table, divider |
| **Đường viền nhấn** | `border-border-strong` | `var(--color-border-strong)` (`#CBD5E1`) | Viền phân cách đậm, viền trạng thái active |
| **Chữ chính** | `text-text-app` | `var(--color-text)` (`#0F172A`) | Tiêu đề chính, văn bản thân (body) |
| **Chữ phụ** | `text-text-muted` | `var(--color-text-muted)` (`#475569`) | Đoạn mô tả phụ, nhãn chỉ dẫn |
| **Chữ mờ** | `text-text-subtle` | `var(--color-text-subtle)` (`#64748B`) | Thời gian (timestamp), metadata, ghi chú |
| **Màu thương hiệu** | `text-brand`, `bg-brand` | `var(--color-brand)` (`#2563EB`) | Nút CTA chính, link, tab đang chọn |
| **Hover thương hiệu**| `hover:bg-brand-hover` | `var(--color-brand-hover)` (`#1D4ED8`) | Trạng thái hover của nút chính |
| **Nền thương hiệu nhạt**| `bg-brand-soft` | `var(--color-brand-soft)` (`#DBEAFE`) | Chip highlight, container thông báo nhẹ |
| **Màu nhấn ấm** | `text-accent-warm`, `bg-accent-warm` | `var(--color-accent-warm)` (`#F97316`) | Điểm nhấn quan trọng, thông báo chú ý |

---

## 2. Core Design Principles (Nguyên tắc cốt lõi)

### 2.1 Minh bạch & Giải trình (Explainable AI)
- Mọi đánh giá hoặc chấm điểm từ AI bắt buộc phải đi kèm 6 trường cấu trúc:
  1. **Lĩnh vực (Field)**: Tiêu chí/phần nào của ý tưởng.
  2. **Trạng thái (Status)**: Vấn đề phát hiện.
  3. **Bằng chứng (Evidence)**: Dẫn chứng trích xuất từ dữ liệu/tài liệu sinh viên nộp.
  4. **Lý do (Reason)**: Luận điểm tại sao được đánh giá như vậy.
  5. **Câu hỏi trọng tâm (Question)**: Vấn đề sinh viên bắt buộc phải tự trả lời.
  6. **Hành động đề xuất (Next Action)**: Bước cụ thể để sửa chữa.
- Khi thiếu dữ liệu, AI phải nói rõ "Chưa đủ dữ liệu để kết luận", không phóng đại sự chắc chắn.

### 2.2 Tách biệt 3 tầng dữ liệu (Separation of Concerns)
UI luôn phân biệt trực quan 3 tầng:
1. **Dữ liệu sinh viên nộp (Student Input)**: Giữ nguyên văn, nhãn rõ ràng.
2. **Bản thảo phân tích của AI (AI Critique / Draft)**: Gắn nhãn bản nháp, có giải trình.
3. **Phê duyệt của Supporter/Admin (Human Decision)**: Đóng dấu duyệt, phản hồi chính thức, chỉ định điểm số.

### 2.3 Thiết kế dựa trên niềm tin (Trust Over Magic)
- Tránh từ ngữ tâng bốc thần thánh hóa AI (ví dụ: "AI tự động tối ưu đỗ 100%").
- Dùng từ ngữ phản ánh đúng thực tế: "Nexus kiểm tra tài liệu theo tiêu chí checkpoint", "Bản phản biện có cấu trúc cần được supporter xem xét".

### 2.4 Trạng thái luôn trực quan (Visible System Status)
- Mọi trạng thái (case, tài liệu, thanh toán, phản biện) đều hiển thị cả **màu sắc + icon + nhãn chữ tiếng Việt**:
  - `Chưa thanh toán` (Warning `#F59E0B`)
  - `Đang phản biện AI` (Info `#3B82F6`)
  - `Cần bổ sung tài liệu` (Accent `#F97316`)
  - `Chờ Supporter duyệt` (Brand `#2563EB`)
  - `Đã hoàn thành` (Success `#10B981`)

---

## 3. Persona Surfaces & Phân bổ thiết bị

| Persona | Phạm vi URL | Thiết bị hỗ trợ | Đặc trưng bố cục |
|---|---|---|---|
| **Sinh viên (Student)** | `/dashboard/*`, `/intake`, `/team-fit` | **Mobile Responsive & Desktop** | Thẻ card trực quan, drawer menu trên mobile, bảng dữ liệu co giãn thông minh, thanh tiến độ sinh động. |
| **Cố vấn (Supporter)** | `/supporter/*` | **Desktop Only (≥ 1024px)** | Màn hình làm việc chia 2 cột (split view): tài liệu gốc bên trái, công cụ phản biện & chấm điểm bên phải. Có `DesktopOnlyNotice`. |
| **Quản trị viên (Admin)** | `/admin/*` | **Desktop Only (≥ 1024px)** | Dashboard quản trị mật độ dữ liệu cao (high density), 7 phân hệ tab (?tab=), KPI worker, bảng phân quyền. |

---

## 4. Component Specifications

### 4.1 Buttons (Nút tương tác)
- **Primary Button**: Nền `primary` (`#2563EB`), chữ trắng `#FFFFFF`, bo góc `rounded-md` (`8px`), chiều cao 38-42px. Hover: `primary-hover` (`#1D4ED8`). Dành cho hành động chính duy nhất trong mỗi khu vực (ví dụ: "Bắt đầu phản biện", "Gửi tài liệu").
- **Secondary / Outline Button**: Nền trong suốt hoặc `surface`, viền 1.5px `border` (`#E2E8F0`), chữ `text-primary`. Hover: nền `surface-soft` (`#F1F5F9`).
- **Destructive Button**: Nền trong suốt, viền hoặc chữ `danger` (`#EF4444`). Hover: nền `danger-soft` (`#FEE2E2`).
- **Ngoại quan chung**: Không dùng gradient, không dùng shadow đậm. Micro-transition 150ms.

### 4.2 Cards & Panels (Thẻ thông tin)
- **Nền**: Màu phẳng đồng nhất (`#FFFFFF` ở Light Mode, `#121B2E` ở Dark Mode).
- **Viền (Border)**: Luôn có viền thực `1.5px solid var(--color-border)`.
- **Đổ bóng (Shadow)**: **Tuyệt đối KHÔNG dùng box-shadow trên Card và Paper**. Tôn trọng nguyên tắc thiết kế tối giản, sạch sẽ dựa trên đường viền sắc nét (Border-driven hierarchy).
- **Padding**: 16px (`spacing-base`) trên mobile, 20-24px (`spacing-lg` - `spacing-xl`) trên desktop.

### 4.3 Form Inputs (Ô nhập liệu)
- **Border**: 1.5px `border` (`#E2E8F0`), khi focus chuyển sang `primary` (`#2563EB`) với subtle ring mờ.
- **Label**: Nằm phía trên input, `font-weight: 500`, kích cỡ `body-sm`, màu `text-primary`.
- **Mô tả & Hướng dẫn (Helper text)**: Giảm tải suy nghĩ cho người dùng bằng ví dụ cụ thể thay vì câu hỏi trừu tượng.
- **Thông báo lỗi**: Hiển thị ngay dưới ô nhập liệu với màu `danger` (`#EF4444`) và icon cảnh báo.

### 4.4 Status Badges & Chips
- **Cấu trúc**: Nền nhạt (`soft color`) kết hợp viền mờ và chữ màu đậm (`status color`).
- **Border radius**: `rounded-full` hoặc `rounded-sm` (4px).
- **Kích thước**: Chiều cao 22-26px, padding ngang 8-10px, typography `caption` (font-weight: 600).

### 4.5 Case Workspace (Không gian làm việc 7 Tab)
Đồng bộ URL qua query string `?tab=`:
1. `overview`: Radar chart đánh giá tổng quan, thẻ giai đoạn dự án, hướng dẫn trạng thái tiếp theo.
2. `documents`: Danh sách tài liệu đã upload, phiên bản nộp, tài liệu mẫu.
3. `report`: Báo cáo phản biện AI, thẻ điểm chi tiết, nút tải PDF Typst.
4. `discussion`: Khung chat thời gian thực (Centrifugo WebSocket). **Lưu ý quan trọng**: Tab này bị ẩn hoàn toàn đối với gói thuần AI (`pkg_ai_audit` - Gói 79k Basic AI Audit), chỉ hiển thị cho các gói có chuyên viên hỗ trợ (`pkg_supporter_audit` - Gói 149k trở lên).
5. `timeline`: Sổ cái ghi nhận lịch sử thay đổi trạng thái theo thứ tự thời gian.
6. `settings`: Chỉnh sửa thông tin thành viên, nhóm, tên đề tài.
7. `credits`: Số dư tín dụng phản biện, gói dịch vụ nâng cấp (tự động khóa CTA mua khi case `completed`).

---

## 5. Quy chuẩn tiền tệ & Định dạng (Formatting Standards)

### 5.1 Quy tắc tiền tệ bắt buộc
- **Đơn vị tiền tệ**: Luôn hiển thị chữ **`VND`** (in hoa, cách số 1 khoảng trắng).
- **Tuyệt đối KHÔNG** dùng ký hiệu `₫`, chữ `đ` thường, hoặc `VNĐ`.
- **Phân cách hàng ngàn**: Bắt buộc dùng dấu phẩy `,` (chuẩn quốc tế/tiếng Anh số học: `en-US`).
- **Tuyệt đối KHÔNG** dùng dấu chấm `.` để phân cách hàng ngàn.
- **Ví dụ đúng**: `100,000 VND`, `250,000 VND`, `1,500,000 VND`.
- **Ví dụ sai**: `100.000đ`, `100.000 VND`, `100,000₫`.

### 5.2 Kho từ ngữ chuẩn UX (UX Wording Single Source of Truth)
- Toàn bộ nhãn giao diện, trạng thái dự án, hướng dẫn hành động và micro-copy bắt buộc phải đối chiếu và tuân thủ quy chuẩn từ ngữ tại **`design-system/wording/`**:
  - `design-system/wording/wording-overhaul-report.md` (Báo cáo tổng hợp quy chuẩn từ ngữ toàn hệ thống).
  - Thư mục 28 file audit chi tiết cho từng màn hình (`01-auth-pages.md` đến `28-*.md`).
- Nguyên tắc cốt lõi: Dùng mô hình tư duy của sinh viên (Ví dụ: "Hồ sơ dự án", "Báo cáo phản biện", "Lượt đánh giá") thay vì thuật ngữ kỹ thuật nội bộ ("Case", "Lifecycle unit", "Credit ledger").

---

## 6. Do's and Don'ts (Những điều NÊN và KHÔNG NÊN làm)

### Do's (NÊN):
- **Nên** duy trì hệ thống lưới 4px / 8px nhất quán trên mọi màn hình.
- **Nên** ưu tiên viền phẳng 1.5px tinh gọn thay vì các hiệu ứng bóng đổ phức tạp.
- **Nên** tách biệt rõ ràng khu vực của Sinh viên, AI, và Cố vấn con người.
- **Nên** viết thông báo lỗi có khả năng hành động ngay (nêu rõ lỗi gì, ở đâu, bước sửa tiếp theo).
- **Nên** giữ thiết kế giao diện Admin và Supporter ở chế độ Desktop-first với mật độ thông tin cao.

### Don'ts (KHÔNG ĐƯỢC):
- **Không** sử dụng nền chuyển sắc (gradients) loè loẹt trên các thẻ Card, Paper, Button.
- **Không** dùng bóng đổ đậm (`shadow-md`, `shadow-lg`) lên các thành phần thẻ của Mantine.
- **Không** import icon từ `@mantine/icons-react` hoặc `@tabler/icons-react`. Toàn bộ dự án chỉ dùng duy nhất thư viện `lucide-react`.
- **Không** viết responsive layout mobile cho giao diện Admin và Supporter (bắt buộc dùng `DesktopOnlyNotice`).
- **Không** dùng thuật ngữ kỹ thuật nội bộ (mã enum, transition state) làm nhãn UI cho sinh viên.
- **Không** can thiệp class positioning cứng (`fixed`, `inset-0`) đè lên các component Mantine Modal/Drawer vì sẽ phá hỏng canh giữa tự động.
- **Không** tạo nút bấm AI tạo cảm giác ma thuật, cam kết sai sự thật.
