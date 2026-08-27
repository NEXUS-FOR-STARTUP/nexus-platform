# GA-05: Tải lên ảnh đại diện người dùng (Avatar Upload)

- **ID:** GA-05
- **Priority:** P1
- **Category:** Account
- **Status:** Done
- **Nguồn:** `docs/research/mandatory-features-gap-analysis-2026-08-24.md`
- **Báo cáo hoàn thành:** `docs/journals/journal-2026-08-25-ga05-avatar.md`

---

## 1. Mô tả vấn đề
Trước đây, nút "Đổi ảnh" trong trang cài đặt thông tin cá nhân (`ProfileInfoForm.tsx:45-51`) chỉ hiển thị thông báo toast "Tính năng đang phát triển". Người dùng không thể cá nhân hóa hồ sơ và hệ thống thiếu cả API xử lý upload lẫn tích hợp lưu trữ media.

## 2. Giải pháp thực hiện
- Xây dựng UseCase `UploadAvatarUseCase` (`apps/api/src/modules/profile/application/upload-avatar.usecase.ts`):
  - Kiểm tra định dạng file ảnh (JPEG, PNG, WebP) và dung lượng tối đa (2MB).
  - Tải ảnh lên Cloudinary qua thư viện upload chuyên dụng.
  - Cập nhật trường `image` trong bảng `users` của Prisma.
  - Tự động dọn dẹp ảnh avatar cũ trên Cloudinary để tối ưu chi phí lưu trữ.
- Xây dựng Controller & Route:
  - `apps/api/src/modules/profile/http/avatar.controller.ts` xử lý multipart form-data.
  - Đăng ký route `POST /api/profile/avatar` có guard `requireAuth`.
- Cập nhật giao diện Frontend:
  - `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx`: File input ẩn, preview ảnh tức thì.
  - Hook mutation `useProfileMutations.ts` gửi FormData lên endpoint mới.

## 3. Bằng chứng mã nguồn (Evidence)
- Backend:
  - `apps/api/src/modules/profile/application/upload-avatar.usecase.ts`
  - `apps/api/src/modules/profile/http/avatar.controller.ts`
  - `apps/api/src/modules/profile/http/profile.routes.ts`
- Frontend:
  - `apps/web-1/app/dashboard/settings/profile/_components/ProfileInfoForm.tsx`
  - `apps/web-1/app/dashboard/settings/hooks/useProfileMutations.ts`
