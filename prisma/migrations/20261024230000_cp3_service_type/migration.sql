-- CP3 audit: register the cp3_audit service type (additive only: idempotent insert, no schema change)
INSERT INTO "service_types" ("id", "code", "name", "description", "is_active")
VALUES
  (gen_random_uuid()::text, 'cp3_audit', 'Chấm bài Sản phẩm & mô hình', 'Lượt chấm AI cho mô hình kinh doanh và SWOT giai đoạn Sản phẩm & mô hình', true)
ON CONFLICT ("code") DO NOTHING;
