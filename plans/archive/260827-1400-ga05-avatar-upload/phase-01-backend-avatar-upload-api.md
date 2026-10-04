# Phase 1: Backend Avatar Upload API & Cloudinary Integration

## Objective

Xây dựng và hoàn thiện API tải lên ảnh đại diện `POST /api/profile/avatar` trong backend Hono, tích hợp trực tiếp với dịch vụ Cloudinary có sẵn, áp dụng các quy tắc bảo mật tệp tin nghiêm ngặt, cơ chế chống DoS và quản lý vòng đời file ảnh đại diện.

---

## Chi tiết Kiến trúc & Luồng Thực thi

### 1. Domain Validation Rules (`apps/api/src/modules/profile/domain/avatar-upload-rules.ts`)
- **Hằng số**:
  - `ALLOWED_AVATAR_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const`
  - `MAX_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024` (2MB)
  - `MIME_BY_EXTENSION`: Mapping chuẩn giữa phần mở rộng và danh sách MIME type cho phép:
    - `.jpg`, `.jpeg`: `["image/jpeg"]`
    - `.png`: `["image/png"]`
    - `.webp`: `["image/webp"]`
- **Hàm validation**:
  - `isAllowedAvatarExtension(extension: string): boolean`: Kiểm tra phần mở rộng (không phân biệt hoa thường).
  - `isAllowedAvatarMime(extension: string, mimeType?: string): boolean`: Đối chiếu extension và MIME type thực tế của file để chống giả mạo định dạng (MIME Spoofing).

### 2. HTTP Controller & DoS Guards (`apps/api/src/modules/profile/http/avatar.controller.ts`)
- **Phòng thủ DoS qua Content-Length**:
  - Kiểm tra header `content-length` **trước khi gọi `c.req.parseBody()`**.
  - Giới hạn: `MAX_AVATAR_MULTIPART_BYTES = MAX_AVATAR_FILE_SIZE_BYTES + 64 * 1024` ($2\text{ MB} + 64\text{ KB}$ overhead multipart).
  - Nếu `contentLength > MAX_AVATAR_MULTIPART_BYTES`, lập tức ngắt kết nối và trả về `400 FILE_TOO_LARGE`.
- **Kiểm tra Payload Body**:
  - Parse body: `const body = await c.req.parseBody(); const file = body["file"];`
  - Chặn request thiếu file, file là chuỗi văn bản, hoặc gửi mảng nhiều file: `if (!file || typeof file === "string" || Array.isArray(file))` -> trả về `400 VALIDATION_ERROR`.
  - Bắt lỗi và format qua `handleError(c, error)`.

### 3. Use Case & Cloudinary Lifecycle (`apps/api/src/modules/profile/application/upload-avatar.usecase.ts`)
- **Hỗ trợ Dependency Injection (`UploadAvatarDeps`)**:
  - `uploadFile`, `deleteFile`, `extractPublicId`, `findUserImage`, `updateUserImage` để phục vụ Unit Testing độc lập mà không cần kết nối Cloudinary/DB thật.
- **Quy trình thực thi**:
  1. `validateAvatarFile(file)`: Kiểm tra extension, MIME type và dung lượng file $\le 2\text{ MB}$.
  2. Lấy URL ảnh đại diện hiện tại của user: `previousImage = await findUserImage(userId)`.
  3. Đọc dữ liệu file thành `Buffer`: `Buffer.from(await file.arrayBuffer())`.
  4. Sinh `publicId` ngẫu nhiên độc nhất: `user-${safeUserId}-${crypto.randomBytes(3).toString("hex")}`.
  5. Tải lên Cloudinary: `uploadFile(buffer, "nexus-platform/avatars", publicId, "image")`.
  6. **Cập nhật Database & Rollback**:
     - Cập nhật trường `User.image` trong PostgreSQL bằng `updateUserImage(userId, uploaded.fileUrl)`.
     - Nếu cập nhật DB bị lỗi (timeout, connection drop), block `catch` lập tức kích hoạt:
       `await remove(uploaded.publicId, "image")` -> xóa file vừa tải lên trên Cloudinary để tránh rác lưu trữ (orphan file) rồi mới throw `AppError(500, "AVATAR_UPDATE_ERROR")`.
  7. **Dọn dẹp ảnh cũ (Cleanup)**:
     - Nếu `previousImage` tồn tại, trích xuất `previousPublicId = extract(previousImage)`.
     - Nếu `previousPublicId` hợp lệ (thuộc Cloudinary) và khác `uploaded.publicId`, gọi `deleteFile(previousPublicId, "image")`.
     - Nếu `previousImage` là URL ngoài (như Google OAuth `lh3.googleusercontent.com`), `extract` trả về `null` -> bỏ qua dọn dẹp an toàn.

### 4. Router & Mount (`apps/api/src/modules/profile/http/profile.routes.ts`)
- Đăng ký route với middleware xác thực:
  `profileRouter.post("/avatar", requireAuth, uploadAvatarHandler)`

---

## Tiêu chuẩn Nghiệm thu (Acceptance Criteria)

1. [x] Endpoint `POST /api/profile/avatar` yêu cầu đăng nhập hợp lệ (`requireAuth`), trả về `401 Unauthorized` nếu chưa đăng nhập.
2. [x] Từ chối các tệp không phải định dạng `.jpg`, `.jpeg`, `.png`, `.webp` với mã lỗi `400 INVALID_FILE_TYPE`.
3. [x] Từ chối các tệp có MIME type không khớp với phần mở rộng với mã lỗi `400 INVALID_FILE_TYPE`.
4. [x] Từ chối các tệp có dung lượng vượt quá 2MB với mã lỗi `400 FILE_TOO_LARGE`.
5. [x] Chặn các request multipart vượt quá Content-Length cho phép trước khi parse body vào RAM.
6. [x] Lưu trữ ảnh vào folder `nexus-platform/avatars` trên Cloudinary với `resource_type: "image"`.
7. [x] Cập nhật thành công trường `User.image` trong database PostgreSQL.
8. [x] Tự động xóa ảnh đại diện cũ trên Cloudinary sau khi cập nhật ảnh mới thành công.
9. [x] Bỏ qua xóa an toàn nếu ảnh cũ là URL bên thứ 3 (Google OAuth).
10. [x] Rollback xóa ảnh trên Cloudinary nếu thao tác cập nhật database bị lỗi.
