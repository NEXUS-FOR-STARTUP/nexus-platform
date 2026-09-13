-- DataMigration: Safely add credits_granted = 2 to pkg_ai_audit features
-- Idempotent and defensive: Handles NULL, JSON object, JSON array, and existing values
UPDATE "service_packages"
SET "features" = CASE
  WHEN "features" IS NULL THEN
    '{"credits_granted": 2}'::jsonb
  WHEN jsonb_typeof("features") = 'object' THEN
    "features" || '{"credits_granted": 2}'::jsonb
  WHEN jsonb_typeof("features") = 'array' THEN
    jsonb_build_object('items', "features", 'credits_granted', 2)
  ELSE
    '{"credits_granted": 2}'::jsonb
END
WHERE "id" = 'pkg_ai_audit'
  AND ("features" IS NULL OR "features"->>'credits_granted' IS NULL OR "features"->>'credits_granted' != '2');
