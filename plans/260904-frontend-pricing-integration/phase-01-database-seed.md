# Phase 01: Database Seed Updates

## Target
- `prisma/seeds/seed-20260904-pricing-tiers.ts` (Tạo mới, bảo toàn 100% các file seed cũ trong lịch sử)

## Change
1. Giữ nguyên trạng thái gốc của `seed-packages.ts` và `seed-active-packages.ts` để đảm bảo tính tái lập (reproducibility) của các đợt phát triển trước.
2. Tạo file seed gia số mới: `prisma/seeds/seed-20260904-pricing-tiers.ts`:
   - Tìm gói `pkg_tf_audit` (39k) và cập nhật `is_active: false` (ẩn đi đối với khách mới).
   - Thực hiện `upsert` gói 1: `{ id: "pkg_ai_audit", name: "Basic AI Audit", price: 79000, features: { ... }, is_active: true }`
   - Thực hiện `upsert` gói 2: `{ id: "pkg_supporter_audit", name: "Premium Mentor Audit", price: 149000, features: { ... }, is_active: true }`
   - Đảm bảo tính lũy đẳng (idempotent) — có thể chạy lại nhiều lần mà không sinh lỗi hoặc nhân bản bản ghi.
## Acceptance
- Chạy lệnh `npx tsx prisma/seeds/seed-20260904-pricing-tiers.ts` không sinh ra lỗi.
- Kiểm tra trực tiếp trên DB (hoặc qua logic `GET /packages`) chỉ còn 3 gói active: `pkg_tf_free`, `pkg_ai_audit`, `pkg_supporter_audit`. Gói `pkg_tf_audit` cũ đã được chuyển sang `is_active: false`.