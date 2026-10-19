# Mockup trang Cài đặt thông tin cá nhân (Profile Settings): Báo cáo quyết định thiết kế

Tệp này ghi nhận toàn bộ quyết định thiết kế cho giao diện `http://localhost:3001/dashboard/settings/profile` của Nexus Platform. Mockup là bản đề xuất UI tương tác hoàn chỉnh, mở độc lập được từ trình duyệt.

## 1. Cách xem

- Mở trực tiếp `index.html` bằng trình duyệt (giao thức `file://`), không cần cài đặt hay bật server.
- Điều hướng bằng tham số URL query: `?tab=profile|password|sessions|notifications|spec`.
- Hỗ trợ đầy đủ phím tắt: `Esc` để đóng menu ngăn kéo trên điện thoại hoặc đóng modal xác nhận xóa tài khoản; `Tab` điều hướng có focus trap trong ngăn kéo và modal.

## 2. Cấu trúc tệp

| Tệp | Vai trò |
|---|---|
| `index.html` | Khung trang, cấu trúc DOM và thứ tự nạp script |
| `css/base.css` | Hệ thống token (màu, khoảng cách, font, bề mặt), layout shell và nút bấm |
| `css/views.css` | Style chuyên biệt cho avatar, vùng nguy hiểm và bảng quy ước |
| `js/icons.js` | Icon Phosphor inline (chuyển từ `@phosphor-icons/core` regular, mở được bằng `file://`) |
| `js/data/user.js` | Dữ liệu phiên người dùng mẫu (session user) và cấu hình giới hạn avatar |
| `js/app.js` | Điều hướng router theo query, quản lý ngăn kéo menu trên mobile |
| `js/views/profile.js` | Màn hình Thông tin cơ bản: Avatar, Tên hiển thị, Email và tương tác lưu |
| `js/views/delete-modal.js` | Hộp thoại xác nhận xóa tài khoản 2 bước (yêu cầu gõ "XOA" hoặc "XÓA") |
| `js/views/spec.js` | Thang đo thiết kế, bảng màu, nguyên tắc house rules và màn phụ |

## 3. Hệ thống chung & Nguyên tắc Minimalist UI

- **Tokens đồng bộ `apps/web-1`**: Nền trang `#f8fafc` (slate-50), bề mặt thẻ trắng `#ffffff` có viền 1px `#e2e8f0` (Mantine Paper `withBorder`), màu nhấn thương hiệu `#2563eb` (blue-600), bo góc 8px (`radius="md"`).
- **Thang chữ 4 bậc chuẩn**:
  - Tiêu đề trang: 24px / 500
  - Tiêu đề nhóm thẻ: 18px / 500
  - Thân chữ / Nhãn: 16px / 400 và 500
  - Ghi chú / Trợ giúp / Lỗi: 14px / 400
  - Không có cỡ chữ dưới 14px.
- **Loại bỏ triệt để trang trí thừa (House rules)**:
  - Không gradient: Toàn bộ nút, thẻ, avatar đều dùng màu phẳng (flat color).
  - Không shadow ở trạng thái nghỉ: Chỉ modal và ngăn kéo mobile (lớp phủ floating) mới có shadow vừa phải để phân tách độ sâu.
  - Không micro-labels viết hoa dãn cách (tracking-wider uppercase).
  - Không dùng font monospace ngoài mã code.

## 4. Chi tiết màn hình & Quyết định tương tác

### 4.1 Cụm Avatar và Đổi ảnh
- Avatar hình tròn kích thước 96px x 96px, hiển thị 2 chữ cái đầu viết hoa của tên người dùng (`"NT"`) trên nền xanh nhạt `#dbeafe`, hoặc hiển thị ảnh đại diện khi tải lên.
- Nút "Đổi ảnh" kèm icon camera/image mở trình chọn tệp trên máy tính.
- Client validation: Chấp nhận định dạng `.jpg`, `.jpeg`, `.png`, `.webp` với dung lượng tối đa 2MB. Nếu tệp vượt quá 2MB, hiển thị ngay thanh thông báo lỗi và từ chối tải.
- Xem trước tức thì (instant preview): Khi chọn ảnh hợp lệ, avatar cập nhật ngay và kích hoạt nút "Lưu thay đổi".

### 4.2 Form Thông tin cơ bản
- **Tên hiển thị (`TextInput`)**:
  - Bắt buộc điền. Khi người dùng xóa rỗng hoặc chỉ nhập khoảng trắng, hiển thị thông báo lỗi rõ ràng `"Tên hiển thị không được để trống."` và đổi viền sang màu đỏ `aria-invalid="true"`.
  - Lỗi tự động biến mất ngay khi người dùng gõ ký tự hợp lệ.
- **Email đăng nhập (`TextInput disabled`)**:
  - Trường email bị vô hiệu hóa kèm chú thích `"Không thể thay đổi"`, vì đây là danh tính định danh tài khoản sinh viên.
- **Nút "Lưu thay đổi"**:
  - Mặc định ở trạng thái `disabled` để tránh gửi request dư thừa.
  - Tự động bật sáng khi người dùng sửa tên hiển thị hoặc chọn ảnh mới.
  - Sau khi lưu thành công, hiển thị thanh thông báo màu xanh lá và khóa lại trạng thái nút.

### 4.3 Vùng nguy hiểm & Hộp thoại Xóa tài khoản
- Khối Vùng nguy hiểm được đóng khung viền đỏ nhạt `rgba(239, 68, 68, 0.35)`, tiêu đề đỏ kèm icon cảnh báo hình tam giác `AlertTriangle`.
- Nút "Xóa tài khoản" màu đỏ nhạt (quiet danger) tránh kích thích bấm nhầm.
- **Hộp thoại xác nhận 2 bước an toàn (khớp chuẩn `DeleteAccountModal.tsx`)**:
  - Cảnh báo rõ ràng: Toàn bộ phiên đăng nhập sẽ bị hủy và thông tin tài khoản sẽ được ẩn danh hóa vĩnh viễn. Hành động này không thể hoàn tác.
  - Bắt buộc gõ `"XOA"` hoặc `"XÓA"` (hỗ trợ cả không dấu và có dấu tiếng Việt) vào ô nhập liệu thì nút "Xác nhận xóa tài khoản" mới được kích hoạt.

### 4.4 Thiết bị & Phiên đăng nhập (4 phiên mẫu)
- Cung cấp 4 phiên đăng nhập mẫu:
  1. **Chrome trên Windows 11**: Thiết bị hiện tại, Hà Nội, Việt Nam, IP: 118.70.192.44, nhãn "Đang hoạt động".
  2. **Safari trên iPhone 15 Pro**: Thiết bị di động, TP. Hồ Chí Minh, Việt Nam, IP: 14.161.22.105, hoạt động 2 giờ trước.
  3. **Edge trên Windows 10**: Thiết bị máy bàn, Đà Nẵng, Việt Nam, IP: 42.114.18.90, hoạt động 3 ngày trước.
  4. **Chrome trên MacOS Sonoma**: Laptop, Hà Nội, Việt Nam, IP: 118.70.192.44, hoạt động 1 tuần trước.
- Hỗ trợ đăng xuất từng thiết bị riêng lẻ hoặc bấm "Đăng xuất khỏi thiết bị khác" để thu hồi quyền truy cập cùng lúc của cả 3 thiết bị phụ.

### 4.5 Cài đặt thông báo (Công tắc gạt - Switch)
- Thay thế toàn bộ checkbox truyền thống bằng công tắc gạt (switch) phẳng tối giản:
  - Cấu trúc: nút switch pill 44px x 24px, núm gạt tròn 20px, chuyển động mượt 0.2s.
  - Chuẩn Accessibility: `role="switch"`, `aria-checked="true|false"`, hỗ trợ phím Space / Enter.
  - 4 nhóm thông báo thực tế: Kết quả phản biện, Biến động số dư ví, Nhắc nhở hạn nộp bài, và Bản tin hệ thống.
  - Phản hồi tức thì khi bấm bật/tắt kèm thanh thông báo lưu trạng thái.
## 5. Bảng đối chiếu Trước / Sau

| Yếu tố | Giao diện cũ (`apps/web-1`) | Đề xuất trong Mockup mới |
|---|---|---|
| **Cấu trúc bề mặt** | Nhiều lớp Paper lồng nhau, màu sắc border phân mảnh | Thẻ đơn khối trắng tinh gọn viền 1px, phân cấp thị giác rõ ràng |
| **Xác nhận xóa tài khoản** | Kiểm tra chuỗi thô, chưa có phản hồi trạng thái nút trực quan | Ô nhập liệu phản hồi real-time, nút đổi màu và bật disabled linh hoạt |
| **Trạng thái lưu** | Nút lưu luôn bật dù chưa thay đổi gì | Nút lưu chỉ bật khi có thay đổi thực tế trên form |
| **Responsive trên mobile** | Sidebar chiếm không gian hoặc bị ép co | Chuyển thành ngăn kéo trượt mượt mà có phím Esc và focus trap |
