# Phase 3: Automated Tests, Regression & Verification

## Objective

Xây dựng bộ kiểm thử tự động (Unit / Integration Tests) cho tính năng tải lên ảnh đại diện trong `apps/api/src/shared/infrastructure/tests/avatar-upload.test.ts`, kiểm tra tính toàn vẹn type (`npm run check-types`) và kiểm tra toàn bộ luồng nghiệp vụ không phụ thuộc database vật lý.

---

## Ma trận Kiểm thử Độc lập (Unit Test Matrix via Dependency Injection)

Sử dụng test runner tích hợp của Node.js (`node:test` và `node:assert/strict`):

### 1. Domain Validation Tests
- **Test case 1.1**: Chấp nhận các extension hợp lệ (`.jpg`, `.jpeg`, `.png`, `.webp`, cả chữ hoa lẫn chữ thường).
- **Test case 1.2**: Từ chối các extension không hợp lệ (`.pdf`, `.exe`, `.gif`, `.svg`, `.txt`, `.mp4`, chuỗi rỗng).
- **Test case 1.3**: Đối chiếu MIME type với extension (chặn extension `.png` nhưng MIME `application/pdf`).
- **Test case 1.4**: Từ chối file vượt quá kích thước 2MB (`MAX_AVATAR_FILE_SIZE_BYTES`).

### 2. Use Case & Cloudinary Lifecycle Tests
- **Test case 2.1 (Happy Path)**: Upload ảnh hợp lệ -> gọi Cloudinary `uploadFile` với resource type `image` và folder `nexus-platform/avatars` -> cập nhật `User.image` -> trả về URL và publicId mới.
- **Test case 2.2 (Previous Avatar Cleanup)**: Nếu user đã có `previousImage` thuộc Cloudinary -> gọi `deleteFile(previousPublicId, "image")` để dọn dẹp ảnh cũ.
- **Test case 2.3 (External Previous Image)**: Nếu `previousImage` là URL bên ngoài (Google OAuth) -> `extractPublicId` trả về `null` và không gọi `deleteFile`.
- **Test case 2.4 (Database Failure Rollback)**: Nếu thao tác update database bị lỗi -> gọi `deleteFile(newPublicId, "image")` để xóa ảnh vừa tải lên Cloudinary và throw lỗi 500 `AVATAR_UPDATE_ERROR`.

---

## Lệnh Kiểm thử & Xác minh

```bash
# 1. Chạy test avatar upload
npx --prefix apps/api tsx --test src/shared/infrastructure/tests/avatar-upload.test.ts

# 2. Chạy toàn bộ test suite backend
npm test

# 3. Kiểm tra kiểu dữ liệu toàn bộ monorepo
npm run check-types

# 4. Kiểm tra linting
npm run lint
```

---

## Tiêu chuẩn Nghiệm thu (Acceptance Criteria)

1. [x] Toàn bộ 8 test case trong ma trận kiểm thử chạy thành công (100% pass).
2. [x] Không có lỗi type trong toàn bộ monorepo (`npm run check-types` pass).
3. [x] Toàn bộ test suite `apps/api` chạy pass không bị ảnh hưởng.
