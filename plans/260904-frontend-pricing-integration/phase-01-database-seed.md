# Phase 01: Database Seed Updates

## Target
- `prisma/seeds/seed-packages.ts`
- `prisma/seeds/seed-active-packages.ts`

## Change
1. Mở file `seed-packages.ts`:
   - Tìm mảng `NEW_PACKAGES`.
   - Cập nhật gói `pkg_tf_audit` thành: `is_active: false` (nếu mảng này có lưu cờ `is_active`, nếu không thì để nguyên nhưng phải xử lý ở bước 3).
   - Thêm gói 1: `{ id: "pkg_ai_audit", name: "Basic AI Audit", price: 79000, features: {} }`
   - Thêm gói 2: `{ id: "pkg_supporter_audit", name: "Premium Mentor Audit", price: 149000, features: {} }`
2. Mở file `seed-active-packages.ts`:
   - Tìm mảng `ACTIVE_PACKAGES`.
   - Chuyển `is_active: false` cho gói `pkg_tf_audit` (để nó không hiện lên API `GET /packages` cho khách mới, nhưng vẫn giữ trong DB cho các bảng nối).
   - Thêm mới 2 block định nghĩa cho `pkg_ai_audit` (79k) và `pkg_supporter_audit` (149k) với `is_active: true`, điền một số `features` dạng chuỗi để giao diện web nếu có đọc thì hiển thị được.

## Acceptance
- Chạy lệnh `npm run prisma:generate` và `npx tsx prisma/seeds/seed.ts` không sinh ra lỗi.
- Kiểm tra trực tiếp trên DB (hoặc qua logic `GET /packages`) chỉ còn 3 gói active: `pkg_tf_free`, `pkg_ai_audit`, `pkg_supporter_audit`. Gói `pkg_tf_audit` cũ đã bị ẩn đi.