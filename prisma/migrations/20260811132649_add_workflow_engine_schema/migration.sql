-- Case: optimistic lock for workflow engine refactor (F2)
ALTER TABLE "cases" ADD COLUMN "version_no" INTEGER NOT NULL DEFAULT 0;

-- CaseEvent: audit actor role (F13)
ALTER TABLE "case_events" ADD COLUMN "actor_role" TEXT;

-- DocumentRecord: composite unique for idempotent upserts (F14)
-- Note: NULL != NULL in PostgreSQL, so constraint only protects docs WITH lifecycle_unit_id
CREATE UNIQUE INDEX "document_records_lifecycle_unit_id_doc_type_seq_key"
  ON "document_records" ("lifecycle_unit_id", "doc_type", "seq")
  WHERE "lifecycle_unit_id" IS NOT NULL;
