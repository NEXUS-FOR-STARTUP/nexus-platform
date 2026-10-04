# Journal: GA05 Avatar Upload via Cloudinary Implementation

**Date:** 2026-08-27
**Scope:** Backend Hono API, Cloudinary Storage, Better Auth Session Sync, Frontend UI & Automated Unit Testing
**Plan:** `plans/260827-1400-ga05-avatar-upload/`

---

## 1. Summary of Changes

Triển khai hoàn thiện tính năng **GA05: Avatar Upload via Cloudinary**:
- **Backend**:
  - Endpoint `POST /api/profile/avatar` bảo vệ bởi `requireAuth`.
  - Kiểm tra dung lượng multipart trước khi parse body ($2\text{ MB} + 64\text{ KB}$) để ngăn chặn DoS.
  - Kiểm tra MIME type và extension nghiêm ngặt (.jpg, .jpeg, .png, .webp), chặn file 0-byte.
  - Quản lý vòng đời Cloudinary: upload vào thư mục `nexus-platform/avatars`, lưu `User.image` vào PostgreSQL, dọn avatar cũ trên Cloudinary, bỏ qua URL Google OAuth ngoài, rollback tự động xóa ảnh trên Cloudinary nếu DB update thất bại.
- **Frontend**:
  - `useProfileMutations.ts`: Tích hợp `changeAvatar` mutation với `authClient.getSession()`, `queryClient.invalidateQueries` cho `session`, `user`, `profile`.
  - `ProfileInfoForm.tsx`: Nút "Đổi ảnh", file input ẩn, loading spinner, chống race condition khi double-click, auto-reset input value.
  - `UserMenu.tsx`: Tự động đồng bộ và hiển thị avatar mới trên thanh Navbar.
- **Testing & Quality**:
  - `apps/api/src/shared/infrastructure/tests/avatar-upload.test.ts`: Bộ unit test 9/9 kịch bản độc lập qua Dependency Injection (MIME spoofing, DoS limit, 0-byte, lifecycle, cleanup, rollback, external OAuth skip).

---

## 2. Verification Evidence

- **Unit Tests**: `9/9 pass (100%)`
  - `GA05: Avatar Upload - Domain Rules` (5/5 pass)
  - `GA05: Avatar Upload - Use Case Lifecycle` (4/4 pass)
- **Type Checking**: `npm run check-types` pass 3/3 packages, 0 errors.
- **Code Review**: Đánh giá bởi `code-reviewer` agent đạt **PASS (Score: 9.5/10)**.
