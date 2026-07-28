-- Add system user for automated actions (SePay auto-verify, etc.)
-- Uses fixed UUID for deterministic reference in application code
INSERT INTO "users" ("id", "name", "email", "email_verified", "role", "created_at", "updated_at")
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Nexus System',
  'system@nexus.internal',
  true,
  'system',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;
