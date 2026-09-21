# Page: Thông báo bảo trì hệ thống
Route: `/maintenance`  
Access: `Public (điều hướng tự động toàn bộ người dùng khi kích hoạt chế độ bảo trì)`

---

## Page Context

### User
- **Primary user:** Toàn bộ người dùng truy cập vào Nexus Platform trong thời gian bảo trì hệ thống (Sinh viên, Supporter, Admin, Khách vãng lai).
- **Typical state:** `[Assumption / Cần xác minh]` Đang cố gắng truy cập nền tảng để học tập, kiểm tra tiến độ, nộp bài hoặc phản biện hồ sơ nhưng gặp gián đoạn tạm thời.
- **Knowledge level:** Không nhận được thông báo trước hoặc vừa gặp màn hình chuyển hướng đột ngột; cần biết trạng thái hệ thống và thời điểm có thể sử dụng lại.

### User goals
- Biết lý do tại sao không thể truy cập các tính năng của nền tảng.
- Tìm kiếm thông tin về thời gian bảo trì dự kiến kết thúc để quay lại làm việc.
- Tìm kênh liên hệ hỗ trợ khẩn cấp nếu đang có công việc cấp bách (ví dụ: cận hạn nộp bài Checkpoint 1).

### Business/Product goals
- Chặn tạm thời toàn bộ truy cập của người dùng vào các route nghiệp vụ khi hệ thống đang cập nhật hạ tầng hoặc tái cấu trúc các gói dịch vụ (nguồn: `docs/journals/journal-2026-09-08-website-maintenance-mode-plan.md:9-13`).
- Ngăn chặn phát sinh giao dịch, tạo hồ sơ mới hoặc sai lệch dữ liệu trong lúc bảo trì.
- Đảm bảo trang bảo trì hoạt động độc lập và ổn định, không phụ thuộc vào kết nối cơ sở dữ liệu.
- Cung cấp thông điệp ngắn gọn, rõ ràng bằng tiếng Việt.

### Primary action
- Không có tương tác UI trực tiếp (màn hình thông báo tĩnh, không có nút bấm hay liên kết hành động). Người dùng chỉ có thể đóng tab hoặc chờ đợi hệ thống mở lại để reload trang.

### Secondary actions
- Không có.

### Entry
- Tự động điều hướng từ toàn bộ các route thuộc cấu hình matcher trong `apps/web-1/proxy.ts` (`/`, `/auth/:path*`, `/dashboard/:path*`, `/supporter/:path*`, `/admin/:path*`) khi biến môi trường `MAINTENANCE_MODE="true"` (nguồn: `apps/web-1/proxy.ts:72-78, 122-130`).
- Người dùng truy cập trực tiếp đường dẫn `/maintenance` trong thời gian bảo trì.

### Exit / next step
- Khi chế độ bảo trì kết thúc (`MAINTENANCE_MODE="false"`): Người dùng truy cập hoặc reload lại route `/maintenance` sẽ được proxy tự động chuyển hướng về trang chủ `/` (nguồn: `apps/web-1/proxy.ts:82-87`).
- Trong thời gian bảo trì: Người dùng không có liên kết thoát trên giao diện.

### Product facts / constraints
- Cơ chế kích hoạt: Điều khiển qua biến môi trường `MAINTENANCE_MODE` trong file cấu hình `.env` (nguồn: `apps/web-1/proxy.ts:41-64`, `.env.example:81`).
- Tầng gác cổng Middleware: `apps/web-1/proxy.ts` kiểm tra trạng thái bảo trì trực tiếp qua file system tại runtime, không truy vấn database nhằm tránh lỗi khi database ngừng hoạt động (nguồn: `docs/journals/journal-2026-09-08-website-maintenance-mode-plan.md:10-13`).
- Cơ chế chuyển hướng khi tắt bảo trì: Khi `MAINTENANCE_MODE="false"`, nếu người dùng truy cập trực tiếp route `/maintenance`, proxy sẽ trả về chuyển hướng 307 về `/` và xóa toàn bộ search params (nguồn: `apps/web-1/proxy.ts:82-87`).
- Phạm vi matcher của proxy: Các route được bảo vệ gồm `/`, `/auth/:path*`, `/dashboard/:path*`, `/supporter/:path*`, `/admin/:path*`, `/maintenance`. Các trang chính sách tĩnh (`/terms`, `/privacy`, `/refund-policy`, `/fair-use-policy`) không nằm trong matcher này (nguồn: `apps/web-1/proxy.ts:122-130`).
- Hiện trạng giao diện `apps/web-1/app/maintenance/page.tsx`: Là một Server Component tĩnh, chỉ render 1 ảnh minh họa `/maintenance.svg`, 1 tiêu đề `h1` và 1 đoạn mô tả `p`.
- Các thành phần chưa triển khai: Các nội dung như "thời gian dự kiến hoàn thành", "thông tin/hướng dẫn liên hệ hỗ trợ khẩn cấp", và "nút quay lại trang chủ / tải lại trang" **hoàn toàn chưa có trong mã nguồn hiện tại** (nguồn: `apps/web-1/app/maintenance/page.tsx:1-31`).

---

## Interactive Inventory

*Source: `apps/web-1/app/maintenance/page.tsx`*

| ID | Component / Vị trí | Type | Current wording | Action / Destination | State |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `maintenance.illustration.alt` | `Image[alt]` (Hình minh họa bảo trì) | Alt text | `Hệ thống đang bảo trì` | — | default (chỉ đọc) |
| `maintenance.heading` | `h1` (Tiêu đề chính) | Heading | `Hệ thống đang bảo trì` | — | default |
| `maintenance.description` | `p` (Đoạn mô tả chi tiết) | Description | `Trang web hiện đang trong quá trình bảo trì và nâng cấp hệ thống. Chúng tôi sẽ sớm quay trở lại.` | — | default |

---

## Page Notes

### Biến thể thuật ngữ xuất hiện trên trang
- Cụm từ mô tả hiện trạng: `"bảo trì và nâng cấp hệ thống"`.
- Không phân chia vai trò: Toàn bộ đối tượng (Sinh viên, Supporter, Admin) đều nhận cùng một nội dung thông báo chung khi truy cập vào thời điểm này.

### Hiện trạng kỹ thuật quan sát được
- Component `MaintenancePage` không dùng client-side state hay Mantine UI component; sử dụng thuần HTML với các lớp tiện ích của Tailwind CSS (`bg-bg-app`, `text-text-app`, `text-text-muted`).
- Hình minh họa `/maintenance.svg` có các class `select-none pointer-events-none` nhằm vô hiệu hóa thao tác kéo thả chuột của người dùng.
- Không có bất kỳ thẻ điều hướng (`<Link>`, `<a>`) hoặc nút bấm (`<button>`) nào được render trong component.
- Kiểm tra file `.env` động: Middleware tại `apps/web-1/proxy.ts` kiểm tra trực tiếp các đường dẫn file `.env` qua `fs.readFileSync` để cập nhật trạng thái `MAINTENANCE_MODE` ngay lập tức mà không cần khởi động lại tiến trình Node.js.
- Chuyển hướng tự động: Khi tắt cờ bảo trì (`MAINTENANCE_MODE="false"`), middleware tự động điều hướng người dùng từ `/maintenance` về trang chủ `/`.

### Điểm chưa xác minh (Unknowns / Questions)
- **Thời gian dự kiến hoàn thành (ETA):** Giao diện hiện tại thiếu mốc thời gian cụ thể (ví dụ: dự kiến kéo dài bao lâu hoặc hoàn tất vào khung giờ nào), khiến người dùng không chủ động được kế hoạch quay lại làm việc.
- **Kênh hỗ trợ khẩn cấp:** Chưa có hướng dẫn liên hệ (email hỗ trợ, hotline hoặc kênh chat cộng đồng) để người dùng liên hệ nếu có vấn đề cấp bách sát hạn nộp hồ sơ Checkpoint.
- **Nút quay lại trang chủ / Tải lại trang:** Trang hiện không có nút thao tác. Cần lưu ý về mặt kỹ thuật: Trong khi cờ `MAINTENANCE_MODE="true"` đang bật, nếu bổ sung nút "Quay lại trang chủ" (`/`), middleware sẽ ngay lập tức điều hướng người dùng quay lại `/maintenance`. Do đó, nếu bổ sung hành động, giải pháp phù hợp hơn là nút "Tải lại trang" (để người dùng bấm kiểm tra xem hệ thống đã mở lại chưa).
