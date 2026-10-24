# Phase 5 — DB và gói bán

**Cảnh báo an toàn DB (đọc `.agents/rules/prisma-migration-safety.md` trước):** agent chỉ tạo file migration bằng `--create-only` và viết seed; **không** chạy `migrate deploy`, `db seed`, `db push`, `migrate reset`, `db execute` lên DB production. DB local chỉ dùng để smoke. Người vận hành chạy `migrate deploy` và seed gói trên VPS.

## Việc làm

1. **Migration additive, viết tay**: tạo thư mục `prisma/migrations/<timestamp>_cp3_service_type/` với `migration.sql` chỉ gồm `INSERT INTO "service_types" ("id","code","name","description","is_active") VALUES (gen_random_uuid()::text, 'cp3_audit', …, true) ON CONFLICT ("code") DO NOTHING;` theo đúng mẫu `prisma/migrations/20261010170000_cp2_credit_ledger_by_service_type/migration.sql:16-21`. **Không** chạy `prisma migrate dev --create-only` và **không** dùng `DATABASE_URL`/`DIRECT_URL` trong lệnh: `.agents/rules/prisma-migration-safety.md` cấm đưa chuỗi kết nối vào lệnh shell (dòng 115) và chỉ cho `--create-only` khi `DATABASE_URL` là local (dòng 460); thay đổi này cũng không có diff `schema.prisma` nên `--create-only` chỉ sinh migration rỗng. Chỉ chạy `npx prisma validate`. Không `UPDATE`/`DELETE`/`ALTER`, không backfill. Tên/mô tả tiếng Việt theo mẫu hai dòng CP1/CP2.
2. **Seed** `prisma/seeds/seed-active-packages.ts`: thêm `cp3_audit` vào `SERVICE_TYPES`; thêm gói `pkg_cp3_audit` (giá 79000, `credits_granted: 2`, `service_type_code: "cp3_audit"`, `is_active: true`, `features` theo mẫu CP2: `sla_hours: 0`, `mode: "ai_automated"`, `auto_delivery: true`, các `items` nói rõ chấm Mô hình kinh doanh và SWOT, "2 lượt chấm", **ghi chú phần sản phẩm thử/giao diện không nằm trong phần chấm**). Seed là upsert độc lập; đã tìm trong `package.json`, `docker-compose*.yml`, `Dockerfile*`, `.github` không thấy nơi nào tự chạy `seed-active-packages.ts` khi deploy → phải chạy tay trên VPS, ghi vào checklist vận hành.
3. **Ràng buộc đã kiểm**: credit tính theo `(case_id, service_type_id)` nên cô lập sẵn; mã giảm giá gắn theo `service_type_id` nên CP3 không rò sang gói khác; `credit-audit-order.helpers.ts:67-70` (nâng cấp gói miễn phí) chỉ áp CP1, CP3 đi đường chung. Hoàn credit hủy case duyệt từng service type độc lập: không nhánh CP2 cứng.
4. **Test**: `credit-ledger-by-service-type.test.ts` thêm `CP3_ID` vào fixture và ca mua/tiêu/hoàn credit CP3 độc lập với CP1/CP2; `phase-03-discount-codes.test.ts`: mã gắn CP3 không áp cho gói CP2.

## Checklist vận hành (người làm, không phải agent)

1. Deploy image API có migration; chạy `prisma migrate deploy` theo `docs/db-migration-guide.md`.
2. Kiểm dòng `service_types.cp3_audit` bằng truy vấn chỉ đọc.
3. Chạy seed gói trên VPS (hoặc tạo gói qua giao diện admin nếu có), kiểm `pkg_cp3_audit` 79.000đ / 2 lượt.
4. `data/system-prompts` trên VPS có đủ ba file CP3 (API không khởi động nếu thiếu: `assertAuditPromptsPresent`).
5. Rollback bán: `is_active=false` ở gói/`service_types` (không xóa dòng).

## Acceptance

Migration chỉ có `INSERT … ON CONFLICT DO NOTHING`; seed chạy được trên DB local trống và chạy lại không đổi gì; test ví/giảm giá xanh.
