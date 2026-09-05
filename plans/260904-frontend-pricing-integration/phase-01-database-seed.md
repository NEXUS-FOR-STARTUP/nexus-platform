# Phase 01: Database Seed Updates

## Target
- `prisma/seeds/seed-active-packages.ts`

## Nguyên lý kỹ thuật (Seed vs Migration)
- **Migration**: Lưu trữ lịch sử tuần tự theo thời gian, tuyệt đối không sửa file cũ.
- **Seed**: Lưu trữ **ảnh chụp trạng thái mong muốn mới nhất (Desired State Snapshot)** để khi bất kỳ dev nào chạy `make db-seed`, DB mới sẽ nhận ngay danh mục gói chuẩn nhất hiện tại mà không phải chạy hàng chục file seed mồ côi.

## Change
1. Mở file `prisma/seeds/seed-active-packages.ts`:
   - Chuyển `pkg_tf_audit` (39k) sang `is_active: false` (giữ lại trong DB cho các liên kết cũ nhưng ẩn khỏi giao diện bán mới).
   - Bổ sung 2 gói dịch vụ active mới vào mảng `ACTIVE_PACKAGES`:
     - `pkg_ai_audit` (79.000 VNĐ / lượt)
     - `pkg_supporter_audit` (149.000 VNĐ / lượt)

## Acceptance
- Chạy lệnh `make db-seed` hoặc `npx tsx prisma/seeds/seed-active-packages.ts` không sinh ra lỗi.
- API `GET /packages` chỉ trả về 3 gói active: `pkg_tf_free`, `pkg_ai_audit`, `pkg_supporter_audit`. Gói 39k cũ đã chuyển sang `is_active: false`.