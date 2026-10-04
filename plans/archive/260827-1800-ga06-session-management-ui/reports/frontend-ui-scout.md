# Báo cáo Khảo sát Kỹ thuật: GA-06 Frontend Settings UI & Navigation

## 1. Cấu trúc Navigation Cài đặt
- File cấu hình: `apps/web-1/app/dashboard/settings/_components/settings-nav.ts`
- Mảng `SETTINGS_NAV_SUB_ITEMS`:
  - Hiện có: `/profile` (Thông tin cơ bản), `/password` (Đổi mật khẩu).
  - Bổ sung: `/sessions` (Thiết bị & Phiên đăng nhập, icon: `MonitorSmartphone` từ `lucide-react`).
- Hàm `getSettingsNav(basePath)` tự động ghép tiền tố `/dashboard/settings` hoặc `/supporter/settings` nên chỉ cần sửa 1 chỗ là cả 2 phân quyền đều nhận được tab mới.

## 2. Layout & Thiết kế Mantine UI v9
- Pattern Container: `Paper p="xl" radius="md" className="bg-surface-app border border-border-app"`
- Sắp xếp: `Stack gap="xl"`
- Bảng danh sách thiết bị:
  - Hiển thị danh sách card hoặc table với icon thiết bị (Desktop / Smartphone / Tablet / Globe).
  - Tên thiết bị + Hệ điều hành + Trình duyệt (phân tích từ `userAgent`).
  - Địa chỉ IP (chuẩn hóa IPv4, IPv6, localhost).
  - Thời gian đăng nhập (`created_at`) và thời gian hết hạn (`expires_at`).
  - Badge "Phiên hiện tại" (`Badge variant="light" color="teal"`).
  - Nút "Đăng xuất" cho từng phiên khác (`Button variant="light" color="red"`).
- Khối "Đăng xuất tất cả thiết bị khác":
  - `Button variant="light" color="red" leftSection={<LogOut className="w-4 h-4" />}`
  - Modal xác nhận: `Modal centered size="md" radius="md"` giải thích rõ hành động sẽ đăng xuất khỏi tất cả trình duyệt và thiết bị khác ngoại trừ thiết bị đang dùng.

## 3. User Agent Parser Utility
- Do `package.json` không có sẵn `ua-parser-js` và theo nguyên tắc KISS / Zero Bloat, xây dựng tiện ích nhẹ `apps/web-1/lib/utils/ua-parser.ts`:
  - Phân tích Browser: Chrome, Firefox, Safari, Edge, Opera, Coc Coc, Arc, Brave, Other.
  - Phân tích OS: Windows, macOS, iOS, Android, Linux, ChromeOS, Other.
  - Phân tích Device Type: Desktop, Mobile, Tablet, Unknown.
  - Trả về Icon Lucide tương ứng.
