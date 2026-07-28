/*
  Warnings:

  - You are about to drop the column `audit_round_id` on the `case_events` table. All the data in the column will be lost.
  - You are about to drop the column `audit_round_id` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the `audit_rounds` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "audit_rounds" DROP CONSTRAINT "audit_rounds_case_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_rounds" DROP CONSTRAINT "audit_rounds_checkpoint_id_fkey";

-- DropForeignKey
ALTER TABLE "audit_rounds" DROP CONSTRAINT "audit_rounds_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "case_events" DROP CONSTRAINT "case_events_audit_round_id_fkey";

-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_package_id_fkey";

-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_audit_round_id_fkey";

-- AlterTable
ALTER TABLE "case_events" DROP COLUMN "audit_round_id";

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "sla_deadline_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "metadata_json" JSONB,
ALTER COLUMN "package_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "reports" DROP COLUMN "audit_round_id";

-- DropTable
DROP TABLE "audit_rounds";

-- CreateTable
CREATE TABLE "credit_ledgers" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reference_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_ledgers_idempotency_key_key" ON "credit_ledgers"("idempotency_key");

-- CreateIndex
CREATE INDEX "credit_ledgers_case_id_created_at_idx" ON "credit_ledgers"("case_id", "created_at");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledgers" ADD CONSTRAINT "credit_ledgers_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
