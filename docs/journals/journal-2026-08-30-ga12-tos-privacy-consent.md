# Journal: GA-12 Điều khoản dịch vụ, Chính sách bảo mật & Ghi nhận Thỏa thuận

- **Ngày thực hiện:** 2026-08-30
- **Nhiệm vụ:** GA-12 (P1#8)
- **Tác giả:** Phung Luu Hoang Long / AI Assistant
- **Trạng thái:** Hoàn thành 100%

---

## 1. Bối cảnh & Mục tiêu

Tại form đăng ký tài khoản (`AuthPanel.tsx`), ô checkbox "Tôi đồng ý với điều khoản dịch vụ" trước đây là text tĩnh không có link, footer trỏ `#`, chưa có trang ToS/Privacy Policy thực tế và database chưa lưu vết `terms_and_privacy_version`, `terms_and_privacy_accepted_at`. Điều này dẫn tới thiếu căn cứ pháp lý xử lý dữ liệu và trách nhiệm chứng minh sự đồng ý theo Điều 11 Nghị định 13/2023/NĐ-CP.

Mục tiêu là soạn thảo toàn diện 2 văn bản pháp lý chính thống, tạo 2 trang công khai `/terms` và `/privacy` với Table of Contents điều hướng nhanh, tích hợp checkbox form đăng ký mở tab mới và lưu vết chấp thuận vào cơ sở dữ liệu.

---

## 2. Các công việc đã triển khai

### A. Cơ sở dữ liệu & An toàn Migration (`prisma-migration-safety.md`)
- Bổ sung 2 trường additive safe nullable vào `model User` trong `prisma/schema.prisma`:
  - `terms_and_privacy_version String?`
  - `terms_and_privacy_accepted_at DateTime?`
- Tạo file migration an toàn: `prisma/migrations/20260830100000_add_user_terms_and_privacy_agreement/migration.sql`.
- Chạy `npx prisma migrate deploy` và `npm run prisma:generate` thành công.

### B. Soạn thảo Văn bản & Xây dựng Giao diện
- **Component dùng chung:** `apps/web-1/components/policy/PolicyDocumentLayout.tsx` với Table of Contents (TOC) sticky sidebar, smooth scroll, theme toggler, banner thông tin, responsive mobile.
- **Trang Điều khoản Dịch vụ:** `apps/web-1/app/terms/page.tsx`
  - Cam kết 100% quyền sở hữu trí tuệ (IP) thuộc về sinh viên.
  - Chuẩn mực liêm chính học thuật (không làm bài hộ, không cam kết điểm).
  - Quy chế vận hành case, ví và hoàn tiền tự động khi veto/hủy.
- **Trang Chính sách Bảo mật:** `apps/web-1/app/privacy/page.tsx`
  - Tuân thủ Nghị định 13/2023/NĐ-CP.
  - Bảng danh mục dữ liệu thu thập & mục đích xử lý.
  - Công khai các bên thứ ba xử lý (Vercel AI SDK, SePay, Centrifugo, Cloudinary, Resend).
  - Quyền xóa tài khoản trong 72 giờ (GA-04) và cam kết thông báo sự cố trong 72 giờ.

### C. Tích hợp Frontend & Backend Auth
- `apps/web-1/components/layout/AppShell.tsx`: Trỏ `footerLinks` tới `/privacy` và `/terms`.
- `apps/web-1/app/auth/_components/AuthPanel.tsx`: Checkbox đăng ký liên kết trực tiếp mở tab mới tới `/terms` và `/privacy`.
- `apps/api/src/auth.ts`: Ánh xạ `termsAndPrivacyVersion`, `termsAndPrivacyAcceptedAt` trong Better Auth config và tự động gán `terms_and_privacy_version: '2026-08-v1'` + `terms_and_privacy_accepted_at: new Date()` trong `databaseHooks.user.create.before`.

---

## 3. Kết quả Kiểm thử & Nghiệm thu

1. **Automated Unit Tests:** File `apps/api/src/shared/infrastructure/tests/ga-12-terms-and-privacy.test.ts` (3/3 pass).
2. **Type Checking:** `npm run check-types` pass 100% không lỗi trên cả 3 package (`apps/api`, `apps/web-1`, `packages/validation`).
3. **Cập nhật Master Tracker:** Trạng thái `GA-12` trong `tasks/gap-analysis-tasks.md` và `tasks/README.md` đã chuyển sang `Done`.
