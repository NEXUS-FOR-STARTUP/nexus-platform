-- Down migration: rollback workflow engine schema
DROP INDEX IF EXISTS "document_records_lifecycle_unit_id_doc_type_seq_key";
ALTER TABLE "case_events" DROP COLUMN IF EXISTS "actor_role";
ALTER TABLE "cases" DROP COLUMN IF EXISTS "version_no";
