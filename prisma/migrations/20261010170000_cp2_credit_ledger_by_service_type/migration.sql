-- CP2 phase 2: credit ledger by service type (additive only: nullable columns, indexes, FKs, seed rows, backfill)

-- AlterTable
ALTER TABLE "service_packages" ADD COLUMN "credits_granted" INTEGER;
ALTER TABLE "credit_ledgers" ADD COLUMN "service_type_id" TEXT;
ALTER TABLE "order_items" ADD COLUMN "package_id" TEXT;

-- CreateIndex
CREATE INDEX "credit_ledgers_case_id_service_type_id_idx" ON "credit_ledgers"("case_id", "service_type_id");
CREATE INDEX "order_items_package_id_idx" ON "order_items"("package_id");

-- AddForeignKey
ALTER TABLE "credit_ledgers" ADD CONSTRAINT "credit_ledgers_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed service types (idempotent)
INSERT INTO "service_types" ("id", "code", "name", "description", "is_active")
VALUES
  (gen_random_uuid()::text, 'cp1_audit', 'Chấm Checkpoint 1', 'Lượt chấm AI cho ý tưởng ở Checkpoint 1', true),
  (gen_random_uuid()::text, 'cp2_audit', 'Chấm Checkpoint 2', 'Lượt chấm AI cho bảng hỏi phỏng vấn và Checkpoint 2', true)
ON CONFLICT ("code") DO NOTHING;

-- Backfill: every existing package and ledger row belongs to CP1 (no amount is modified)
UPDATE "service_packages"
SET "service_type_id" = (SELECT "id" FROM "service_types" WHERE "code" = 'cp1_audit')
WHERE "service_type_id" IS NULL;

UPDATE "credit_ledgers"
SET "service_type_id" = (SELECT "id" FROM "service_types" WHERE "code" = 'cp1_audit')
WHERE "service_type_id" IS NULL;

-- Backfill credits_granted: features.credits_granted -> pkg_ai_audit = 2 -> paid packages default 1
-- (1 matches the previous create-order default of `quantity` credits per purchase)
UPDATE "service_packages"
SET "credits_granted" = ("features"->>'credits_granted')::integer
WHERE "credits_granted" IS NULL
  AND jsonb_typeof("features") = 'object'
  AND ("features"->>'credits_granted') ~ '^[0-9]+$';

UPDATE "service_packages"
SET "credits_granted" = 2
WHERE "id" = 'pkg_ai_audit' AND "credits_granted" IS NULL;

UPDATE "service_packages"
SET "credits_granted" = 1
WHERE "credits_granted" IS NULL AND "price" > 0;
