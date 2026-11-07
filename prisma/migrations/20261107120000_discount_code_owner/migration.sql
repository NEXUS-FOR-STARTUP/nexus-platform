-- AlterTable
ALTER TABLE "discount_codes" ADD COLUMN "owner_user_id" TEXT,
ADD COLUMN "case_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_owner_user_id_case_id_service_type_id_key" ON "discount_codes"("owner_user_id", "case_id", "service_type_id");
