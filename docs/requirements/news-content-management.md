# News Content Management — Product & Technical Requirements

_Cập nhật: 2026-10-06. Trạng thái: Implemented._

## 1. Mục tiêu & Phạm vi

Phục vụ truyền thông, chia sẻ kinh nghiệm khởi nghiệp và hướng dẫn gọi vốn từ đội ngũ Nexus qua 2 hình thức:
- **Bài viết chuyên sâu (Article)**: Bài viết nội bộ do Nexus xuất bản, có trang đọc chi tiết chuẩn SEO.
- **Video chia sẻ (Video)**: Video YouTube chính thức hoặc tuyển chọn, dẫn trực tiếp về YouTube.

### Phạm vi loại trừ (HOLD SCOPE)
- Không làm: danh mục đa cấp, thẻ (tags), thanh tìm kiếm toàn văn, bình luận, nút thả tim/reaction, theo dõi tác giả, đo lường analytics nội bộ, RSS feed, hẹn giờ đăng tự động.

## 2. Mô hình Dữ liệu (`news_items`)

Một bảng cơ sở dữ liệu duy nhất với trường phân loại `type: "article" | "video"`:
- **ID**: UUID v4 primary key.
- **type**: `"article"` hoặc `"video"`.
- **status**: `"draft"` (mặc định) hoặc `"published"`.
- **title**: Tiêu đề (1–200 ký tự).
- **slug**: Đường dẫn tĩnh (1–160 ký tự, unique). Bắt buộc khi xuất bản bài viết; `null` đối với video.
- **excerpt**: Đoạn mô tả tóm tắt (0–320 ký tự).
- **content_json**: Cây TipTap JSON (closed grammar). Áp dụng cho bài viết; `null` đối với video.
- **youtube_video_id**: Mã định danh 11 ký tự YouTube (ví dụ: `dQw4w9WgXcQ`). Áp dụng cho video; `null` đối với bài viết.
- **cover_image_url**, **cover_image_public_id**, **cover_image_alt**: Quản lý ảnh bìa Cloudinary cho bài viết.
- **published_at**: Mốc thời gian xuất bản đầu tiên (giữ nguyên khi sửa bài đã xuất bản).
- **created_by_auth_user_id**, **updated_by_auth_user_id**: Lưu chuỗi UUID admin (không tạo khóa ngoại cứng để tránh cascade lock khi xóa user).
- **Index**:
  - `[status, published_at DESC, id DESC]` tối ưu truy vấn danh sách công khai.
  - `[updated_at DESC, id DESC]` tối ưu quản lý admin.

## 3. Quy tắc Nghiệp vụ & Bảo mật

1. **Tác giả công khai**:
   - Mọi bài viết công khai hiển thị byline cố định là **`Nexus Team`**. Không bao giờ để lộ ID, email hoặc tên thật của admin qua public endpoint.
2. **Quy tắc sửa bài đang xuất bản (Live edit)**:
   - Cho phép sửa trực tiếp bài đã xuất bản mà không cần hủy xuất bản.
   - Khi sửa bài đã xuất bản: `slug` và `published_at` ban đầu được giữ cố định (bất biến).
   - Sử dụng `expected_updated_at` trong payload request để kiểm soát tương tranh lạc quan (optimistic concurrency). Trả về 409 nếu dữ liệu bị sửa đổi giữa chừng.
3. **Quy tắc xóa nội dung**:
   - Chỉ cho phép xóa khi nội dung đang ở trạng thái **Bản nháp (`draft`)**.
   - Bài viết đang xuất bản bắt buộc phải qua thao tác "Hủy xuất bản" trước khi xóa nhằm tránh rủi ro xóa nhầm bài đang có traffic.
4. **Rich Text Sanitation (TipTap JSON)**:
   - Chỉ chấp nhận các node: `doc`, `paragraph`, `heading` (chỉ cấp độ 2 và 3 — từ chối cấp độ 1), `bulletList`, `orderedList`, `listItem`, `blockquote`, `horizontalRule`, `hardBreak`.
   - Chỉ chấp nhận các mark: `bold`, `italic`, `strike`, `underline`, `link`.
   - URL trong thẻ `link` bắt buộc phải là `https://`, `http://` hoặc đường dẫn nội bộ root-relative; từ chối tuyệt đối `javascript:`, `data:` và ký tự điều khiển.
   - Dung lượng serialized JSON tối đa 512 KiB.
5. **Xử lý Video YouTube**:
   - Chuẩn hóa mọi định dạng URL (`youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...`) về đúng mã 11 ký tự.
   - Không tải hay lưu trữ video/thumbnail lên Cloudinary; thumbnail trích xuất từ `https://img.youtube.com/vi/<id>/hqdefault.jpg`.
   - Card video mở tab mới với `rel="noopener noreferrer"`.
6. **Bộ nhớ đệm (Cache policy)**:
   - Public API và Next.js Server Component fetch sử dụng `Cache-Control: public, max-age=0, must-revalidate, no-store` để cập nhật tức thì khi có bài mới hoặc sửa đổi.
   - Admin API dùng `Cache-Control: private, no-store`.

## 4. Trải nghiệm Đọc (Editorial Hierarchy - Spiderum inspired)

1. **Trang danh sách (`/news`)**:
   - Header: Tiêu đề lớn + mô tả tóm tắt.
   - Bộ lọc: "Tất cả", "Bài viết", "Video".
   - Lưới card responsive: 1 cột (mobile < 640px), 2 cột (tablet 640px–1023px), 3 cột (desktop ≥ 1024px).
   - Tỷ lệ hiển thị ảnh/video: cố định 16:9 (`aspect-video`).
2. **Trang đọc bài viết (`/news/[slug]`)**:
   - Badge "Bài viết", Tiêu đề H1 lớn (3xl–5xl font-black).
   - Đoạn mở đầu / Deck tóm tắt (text-xl text-text-muted).
   - Hàng thông tin: `Nexus Team · DD/MM/YYYY · x phút đọc`.
   - Ảnh bìa rộng (tỷ lệ 16:9, viền bo tròn 16px, shadow nhẹ).
   - Cột đọc trung tâm: **Độ rộng chuẩn 720px** (`max-w-[720px] mx-auto`), cỡ chữ 18px (text-lg), khoảng cách dòng thoáng (leading-relaxed), giúp mắt đọc không bị mỏi.
   - Giữ nguyên hệ thống font `Google Sans Flex` và màu sắc `Sapphire Blue` của Nexus.

## 5. Quản trị Desktop-only (`/admin?tab=news`)

- Bảng quản lý tin tức với thumbnail 96×54, lọc theo loại, lọc theo trạng thái, sắp xếp.
- Trang soạn thảo riêng:
  - `/admin/news/new`: Tạo bài viết / video mới.
  - `/admin/news/[id]`: Chỉnh sửa, xuất bản, hủy xuất bản, thay ảnh bìa.
- Trình soạn thảo TipTap client-only với thanh công cụ định dạng trực quan.
- Chặn truy cập trên màn hình nhỏ hơn 1024px theo quy chuẩn `DesktopOnlyNotice`.
