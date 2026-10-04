# Phase 1: Database Schema & Migration An toàn (`prisma-migration-safety.md`)

## 1. Mục tiêu
Bổ sung hai trường phục vụ lưu vết chấp thuận điều khoản và chính sách bảo mật (`terms_and_privacy_version`, `terms_and_privacy_accepted_at`) vào bảng `users` theo chuẩn Nghị định 13/2023/NĐ-CP, đảm bảo an toàn tuyệt đối 100% cho cơ sở dữ liệu.

## 2. Kế hoạch thay đổi Schema (`prisma/schema.prisma`)

Trong `model User`:
```prisma
model User {
  id                               String      @id
  name                             String
  email                            String
  // ... các trường hiện có ...

  // --- Terms & Privacy Audit Trail (GA-12 / NĐ 13/2023) ---
  terms_and_privacy_version        String?     // Phiên bản điều khoản & bảo mật đã đồng ý (vd: "2026-08-v1")
  terms_and_privacy_accepted_at   DateTime?   // Thời điểm người dùng tích chọn đồng ý

  // ... các relations hiện có ...
}
```

## 3. Phân loại An toàn Migration
- **Loại thay đổi:** Additive safe change (Thêm cột nullable, không can thiệp cột cũ, không đổi kiểu, không xóa).
- **Rủi ro:** 0% (Không ảnh hưởng dữ liệu hiện có, các bản ghi cũ sẽ nhận giá trị `NULL`).

## 4. Các bước thực hiện chi tiết

1. **Cập nhật file `prisma/schema.prisma`:**
   - Thêm 2 trường `terms_and_privacy_version` và `terms_and_privacy_accepted_at` (nullable `?`).
2. **Kiểm tra môi trường DB:**
   - Xác định `DATABASE_URL` (không in trực tiếp credentials ra output).
3. **Tạo file Migration an toàn:**
   - Chạy lệnh:
     ```bash
     npx prisma migrate dev --create-only --name add_user_terms_and_privacy_agreement
     ```
4. **Kiểm tra file SQL sinh ra trong `prisma/migrations/`:**
   - Xác minh file `.sql` chỉ chứa lệnh an toàn:
     ```sql
     ALTER TABLE "users" ADD COLUMN "terms_and_privacy_version" TEXT,
     ADD COLUMN "terms_and_privacy_accepted_at" TIMESTAMP(3);
     ```
5. **Sinh lại Prisma Client:**
   - Chạy `npm run prisma:generate` để cập nhật TypeScript types trong toàn monorepo.
6. **Cập nhật Backend Auth Hook (`apps/api/src/auth.ts`):**
   - Trong `databaseHooks.user.create.after` (nơi đã có hook auto-create wallet ở GA-22), bổ sung logic cập nhật `terms_and_privacy_version: "2026-08-v1"` và `terms_and_privacy_accepted_at: new Date()` cho tài khoản mới đăng ký.

## 5. Tiêu chí Hoàn thành (Definition of Done)
- [ ] File `prisma/schema.prisma` có 2 trường `terms_and_privacy_version` và `terms_and_privacy_accepted_at`.
- [ ] File migration được tạo thành công trong `prisma/migrations/`.
- [ ] `npm run prisma:generate` chạy thành công không có cảnh báo.
- [ ] TypeScript nhận diện `user.terms_and_privacy_version` và `user.terms_and_privacy_accepted_at`.
