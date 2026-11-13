-- DropForeignKey
ALTER TABLE "pre_cp1_reports" DROP CONSTRAINT "pre_cp1_reports_case_id_fkey";

-- AlterTable
ALTER TABLE "pre_cp1_reports" ADD COLUMN     "team_fit_snapshot" JSONB,
ALTER COLUMN "case_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "pre_cp1_reports_auth_user_id_input_hash_idx" ON "pre_cp1_reports"("auth_user_id", "input_hash");

-- AddForeignKey
ALTER TABLE "pre_cp1_reports" ADD CONSTRAINT "pre_cp1_reports_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
