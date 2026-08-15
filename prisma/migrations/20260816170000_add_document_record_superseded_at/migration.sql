-- AlterTable
ALTER TABLE "document_records" ADD COLUMN "superseded_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "document_records_case_id_superseded_at_idx" ON "document_records"("case_id", "superseded_at");
