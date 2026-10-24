-- Data migration: display-name rename only. Package ids are unchanged.
-- Guarded by the old name, so it is idempotent and never overwrites an admin-edited name.
UPDATE "service_packages"
SET "name" = 'Gói chấm Ý tưởng'
WHERE "id" = 'pkg_ai_audit' AND "name" = 'Basic AI Audit';

UPDATE "service_packages"
SET "name" = 'Gói chấm Thị trường'
WHERE "id" = 'pkg_cp2_audit' AND "name" = 'Gói chấm Checkpoint 2';
