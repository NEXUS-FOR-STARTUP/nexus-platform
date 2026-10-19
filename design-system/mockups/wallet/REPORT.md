# Mockup trang Ví Nexus & Lịch sử giao dịch (Wallet): Báo cáo quyết định thiết kế

Tệp này ghi nhận toàn bộ quyết định thiết kế cho giao diện `http://localhost:3001/dashboard/wallet` của Nexus Platform. Mockup là bản đề xuất UI tương tác hoàn chỉnh, mở độc lập được từ trình duyệt.

## 1. Cách xem

- Mở trực tiếp `index.html` bằng trình duyệt (giao thức `file://`), không cần cài đặt hay bật server.
- Điều hướng bằng tham số URL query:
  - `?tab=wallet|spec`: Chuyển giữa màn hình Ví và Quy ước thiết kế.
  - `?view=history|proofs`: Chuyển tab giữa Lịch sử giao dịch và Ảnh minh chứng.
  - `?topup=open`: Tự động mở modal nạp tiền.
  - `?amount=79000`: Tự động mở modal nạp tiền và điền sẵn số tiền 79.000 VND (hỗ trợ luồng nạp bù từ trang thanh toán).
- Hỗ trợ phím tắt `Esc` để đóng modal nạp tiền hoặc chi tiết giao dịch.

## 2. Cấu trúc tệp

| Tệp | Vai trò |
|---|---|
| `index.html` | Khung trang, cấu trúc DOM và thứ tự nạp script |
| `css/base.css` | Hệ thống token (màu, font, khoảng cách), layout shell và nút bấm |
| `css/views.css` | Style thẻ số dư, bảng giao dịch, chip trạng thái và hộp mã QR |
| `js/icons.js` | Icon Phosphor inline (chuyển từ `@phosphor-icons/core` regular, mở được bằng `file://`) |
| `js/data/wallet.js` | Dữ liệu số dư ví mẫu, cấu hình mức nạp tối thiểu và thông tin ngân hàng |
| `js/data/transactions.js` | Danh sách 6 giao dịch mẫu đầy đủ các loại (Nạp, Trừ ví, Hoàn tiền, Điều chỉnh) |
| `js/data/deposits.js` | Danh sách 4 yêu cầu nạp tiền kèm minh chứng và trạng thái |
| `js/app.js` | Điều hướng router theo query, quản lý view tabs và drawer mobile |
| `js/views/balance.js` | Thẻ số dư ví thiết kế lại: Số dư lớn, nhãn trạng thái và 3 chỉ số phụ |
| `js/views/history.js` | Bảng Lịch sử giao dịch: Lọc loại, sắp xếp thời gian/tiền, phân trang |
| `js/views/proofs.js` | Bảng Ảnh minh chứng: Lọc trạng thái, sao chép nội dung chuyển khoản |
| `js/views/topup-modal.js` | Modal nạp tiền: Chọn mức nạp gợi ý, tạo mã VietQR và mô phỏng hoàn tất |
| `js/views/tx-detail-modal.js` | Modal tra cứu vết kiểm toán (audit log) chi tiết của từng giao dịch |
| `js/views/spec.js` | Thang đo thiết kế, bảng màu, nguyên tắc house rules và so sánh đối chiếu |

## 3. Hệ thống chung & Nguyên tắc Minimalist UI

- **Tokens đồng bộ `apps/web-1`**: Nền trang `#f8fafc` (slate-50), bề mặt thẻ trắng `#ffffff` có viền 1px `#e2e8f0` (Mantine Paper `withBorder`), màu nhấn thương hiệu `#2563eb` (blue-600), bo góc 8px (`radius="md"`).
- **Tabular figures cho dữ liệu tài chính**: Toàn bộ số tiền VND hiển thị với thuộc tính `font-variant-numeric: tabular-nums` để đảm bảo độ rộng ký tự đồng đều, số liệu thẳng hàng dọc theo cột khi so sánh.
- **Loại bỏ triệt để trang trí thừa (House rules)**:
  - **Loại bỏ thẻ gradient**: Trong giao diện cũ `apps/web-1`, thẻ số dư dùng gradient chéo `bg-linear-to-br from-brand/90 to-brand` kèm 2 hình tròn mờ trang trí (`w-32 h-32 bg-white/5 rounded-full`). Đây là kiểu thiết kế hình thức không mang lại giá trị sử dụng. Mockup mới chuyển sang thẻ nền trắng viền xám tinh tế, số dư chữ đen đậm rõ nét, giúp mắt người dùng tập trung vào con số thực tế.
  - **Tabs chuẩn Type A**: Bỏ kiểu tabs khối xám bo tròn (`pills`), thay bằng tabs chữ phẳng có gạch chân xanh dày 3px khi chọn, đồng bộ với tab trong trang Chi tiết dự án (`case-detail`).
  - **Không shadow ở trạng thái nghỉ**: Chỉ modal nạp tiền và modal chi tiết giao dịch (lớp phủ floating) mới có shadow nhẹ.

## 4. Chi tiết màn hình & Quyết định tương tác

### 4.1 Thẻ Số dư ví (WalletBalanceCard Redesign)
- Hiển thị số dư khả dụng nổi bật: `158.000 VND` kèm nhãn xanh lá "Đang hoạt động".
- Chú thích rõ ràng mục đích: "Dùng để thanh toán các gói đánh giá dự án Ý tưởng (CP1) và Thị trường (CP2)".
- Bổ sung 3 chỉ số phụ thiết thực:
  - Tổng tiền đã nạp (`250.000 VND`)
  - Tổng tiền đã dùng (`92.000 VND`)
  - Lượt đánh giá khả dụng tương đương (`~3 lượt chấm`) giúp sinh viên ước lượng kế hoạch làm bài.

### 4.2 Lịch sử giao dịch (Expandable Rows theo chuẩn `case-detail/billing`)
- **Dòng đơn giản, dễ đọc khi thu gọn (Collapsed state)**:
  - Cột thời gian: `18/10/2026 14:22` (gọn gàng, dễ quét mắt).
  - Tiêu đề & diễn giải phụ: Ví dụ `"Nạp tiền vào ví"` kèm dòng chữ nhỏ `"Chuyển khoản VietQR · Khớp lệnh tự động"`.
  - Biến động số dư: `+100.000 VND` (xanh lá) hoặc `-50.000 VND` (đỏ), định dạng `tabular-nums`.
  - Chip trạng thái: `Thành công` (xanh lá), `Hoàn tất` (cam), `Đã hoàn tiền` (xanh dương).
  - Mũi tên chỉ báo: Icon `down` tự động xoay 180 độ khi mở rộng.
- **Chi tiết đầy đủ khi mở rộng (Expanded state - `.txd`)**:
  - **Giao dịch**: Thời gian đến từng giây, loại giao dịch, số dư trước và sau giao dịch, nguồn phát sinh, ID giao dịch (kèm nút sao chép inline) và mã tham chiếu.
  - **Thanh toán & Ngân hàng (đối với dòng nạp tiền)**: Phương thức VietQR, ngân hàng MB Bank, số tài khoản, tên thụ hưởng, nội dung chuyển khoản (kèm nút sao chép) và mã giao dịch ngân hàng.
  - **Đơn hàng (đối với dòng mua lượt chấm)**: Bảng chi tiết gồm Tên dịch vụ, số lượng, đơn giá và tổng tiền.
- **Bộ lọc loại & khoảng thời gian**:
  - Tabs loại: `Tất cả (6)`, `Nạp tiền (2)`, `Mua gói (2)`, `Hoàn tiền (1)`, `Điều chỉnh (1)`.
  - Dropdown khoảng thời gian: `Tất cả thời gian`, `3 ngày qua`, `7 ngày qua`.
  - Trên màn hình nhỏ điện thoại (≤820px): Giới hạn hiển thị 5 dòng kèm nút `"Xem thêm N giao dịch"`.

### 4.3 Tab Ảnh minh chứng (Expandable Rows)
- Áp dụng cùng cấu trúc dòng `<details class="tx">`:
  - Thu gọn: Hiện ngày tạo, mã nạp, nội dung CK, số tiền và chip trạng thái xác minh.
  - Mở rộng: Hiện chi tiết số tiền yêu cầu, thực nhận, tên tệp minh chứng đính kèm và thời gian xác minh.

### 4.4 Modal Nạp tiền & Mô phỏng VietQR
- Mở qua nút "+ Nạp tiền" hoặc tự động mở qua URL param `?amount=79000`.
- 4 nút chọn nhanh mức nạp phổ biến: `50.000đ`, `79.000đ` (gói 2 lượt), `100.000đ`, `200.000đ`.
- **Lưu ý quy trình**: Bước hiển thị mã VietQR tại modal được gắn nhãn rõ ràng là **Đề xuất thử nghiệm (Unvalidated proposal)** để kiểm thử trải nghiệm tại chỗ; trong mã nguồn sản phẩm thực tế (`apps/web-1`), hệ thống tạo deposit rồi chuyển hướng sang `/dashboard/payment?pid=...`.

## 5. Bảng đối chiếu Trước / Sau

| Yếu tố | Giao diện cũ (`apps/web-1`) | Đề xuất trong Mockup mới |
|---|---|---|
| **Thẻ số dư ví** | Nền gradient xanh + hình khối tròn trang trí mờ | Nền trắng viền 1px, số dư đen to rõ, có thêm 3 chỉ số tài chính phụ |
| **Cấu trúc danh sách** | Bảng Table cố định nhiều cột, trên mobile chuyển sang thẻ rời rạc | Dòng `details.tx` đơn giản, bấm để mở rộng chi tiết tại chỗ (giống case-detail/billing) |
| **Kiểm toán chi tiết** | Chỉ giao dịch nạp tiền mới bấm xem được | Tất cả giao dịch đều mở rộng xem vết kiểm toán và hóa đơn dịch vụ |
| **Bộ lọc & Sắp xếp** | Dropdown Select đơn điệu | Hàng tabs phân loại kèm số đếm trực quan + bộ lọc khoảng thời gian |
| **Modal nạp tiền** | Chỉ có 1 ô nhập số, không có gợi ý nhanh | Bổ sung 4 nút chọn nhanh số tiền và mô phỏng VietQR rõ ràng |
