-- ============================================================================
-- DB Cleanup: Old Gói 0-3 Cases & Packages (T1.2)
-- ============================================================================
-- PURPOSE: Remove 6 old cases using Gói 0-3 packages, then drop the packages.
--          Keep pkg_tf_free and pkg_tf_audit (active packages).
--
-- ⚠️  WARNING: This script DELETES data. Read every line before running.
-- ⚠️  PREREQUISITE: T1.1 (Cloudinary cleanup) MUST complete first —
--     we need public_ids from document_records before cascade deletes them.
--
-- REQUIRED: This is a HUMAN-RUN script. Do NOT execute automatically.
--           Run in a psql session with explicit transaction control.
-- ============================================================================

-- ============================================================================
-- SECTION 0: SAFETY FIRST — ROLLBACK & BACKUP
-- ============================================================================

-- Uncomment ROLLBACK line below to make entire script a dry-run (no-op):
-- ROLLBACK; -- ← uncomment to make this script a dry-run

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  STEP 0.1: CREATE A BACKUP BEFORE RUNNING THIS SCRIPT                    ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- Run this OUTSIDE of psql (in terminal) BEFORE executing this script:
--
--   pg_dump --no-owner --no-privileges --clean --if-exists \
--     -f backup_before_g0_3_cleanup_$(date +%Y%m%d_%H%M%S).sql
--
-- Or with Supabase:
--   supabase db dump --db-url "$PROD_DATABASE_URL" \
--     -f backup_before_g0_3_cleanup_$(date +%Y%m%d_%H%M%S).sql --use-copy --data-only
--
-- VERIFY the backup file exists AND is non-empty before proceeding.
-- ╔═══════════════════════════════════════════════════════════════════════════╗

BEGIN;

-- ============================================================================
-- SECTION 1: IDENTIFY PACKAGES TO KEEP vs DELETE
-- ============================================================================
-- Show what we're working with before any deletion.

\echo '========================================'
\echo 'SECTION 1: PACKAGE INVENTORY'
\echo '========================================'

-- 1a. All packages currently in DB
SELECT
    id,
    name,
    price,
    is_active,
    (SELECT COUNT(*) FROM cases WHERE cases.package_id = service_packages.id) AS case_count
FROM service_packages
ORDER BY name;

-- 1b. Summary: which are KEPT vs DELETED
\echo ''
\echo '--- Packages to KEEP (id NOT IN delete list) ---'
SELECT id, name, price
FROM service_packages
WHERE id IN ('pkg_tf_free', 'pkg_tf_audit');

\echo ''
\echo '--- Packages to DELETE (old Gói 0-3) ---'
SELECT id, name, price
FROM service_packages
WHERE id NOT IN ('pkg_tf_free', 'pkg_tf_audit');

-- ============================================================================
-- SECTION 2: PREVIEW — CASES & CHILD RECORDS THAT WILL BE DELETED
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'SECTION 2: CASES TO DELETE (PREVIEW)'
\echo '========================================'

-- 2a. List all cases with their package names
--     NOTE: NULL package_id cases are excluded (NOT IN handles this in SQL)
SELECT
    c.id,
    c.case_code,
    c.team_name,
    sp.name AS package_name,
    c.user_facing_stage,
    c.internal_status,
    c.created_at
FROM cases c
LEFT JOIN service_packages sp ON sp.id = c.package_id
WHERE c.package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit');

\echo ''

-- 2b. UUID list of cases to delete (for logging/audit)
\echo '--- Case UUIDs to delete ---'
SELECT c.id AS case_uuid
FROM cases c
WHERE c.package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit');

\echo ''

-- 2c. Count of child records that will cascade-delete
SELECT
    'cases'              AS table_name,
    COUNT(*)             AS row_count
FROM cases
WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
UNION ALL
SELECT
    'case_members',
    COUNT(*)
FROM case_members
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
UNION ALL
SELECT
    'checkpoints',
    COUNT(*)
FROM checkpoints
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
UNION ALL
SELECT
    'lifecycle_units',
    COUNT(*)
FROM lifecycle_units
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
UNION ALL
SELECT
    'reports',
    COUNT(*)
FROM reports
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
UNION ALL
SELECT
    'payments',
    COUNT(*)
FROM payments
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
UNION ALL
SELECT
    'case_messages',
    COUNT(*)
FROM case_messages
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
UNION ALL
SELECT
    'case_events',
    COUNT(*)
FROM case_events
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
UNION ALL
SELECT
    'ai_jobs',
    COUNT(*)
FROM ai_jobs
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
UNION ALL
SELECT
    'document_records',
    COUNT(*)
FROM document_records
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
UNION ALL
SELECT
    'team_fit_reports',
    COUNT(*)
FROM team_fit_reports
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
UNION ALL
SELECT
    'audit_rounds',
    COUNT(*)
FROM audit_rounds
WHERE case_id IN (
    SELECT id FROM cases WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit')
)
ORDER BY table_name;

-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  STOP HERE if the preview counts don't match expectations.              ║
-- ║  Expected: ~6 cases, ~6 case_members, ~6 checkpoints,                   ║
-- ║            ~13 lifecycle_units, ~7 payments, ~19 docs,                  ║
-- ║            ~74 events, ~19 messages                                     ║
-- ║                                                                         ║
-- ║  Press Ctrl+C to abort, or continue to SECTION 3 to execute deletes.    ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝

-- ============================================================================
-- SECTION 3: DRY-RUN — uncomment to preview without deleting
-- ============================================================================
-- Uncomment the block below to run SELECTs that match the DELETEs
-- without actually deleting. This helps verify the WHERE clauses.

/*
-- DRY-RUN: Preview which rows would be deleted (no actual DELETE executed)
\echo ''
\echo '========================================'
\echo 'DRY-RUN: Rows that WOULD be deleted'
\echo '========================================'

-- Dry-run case deletes
SELECT 'WOULD DELETE FROM cases' AS action, c.id, c.case_code, sp.name AS package_name
FROM cases c
LEFT JOIN service_packages sp ON sp.id = c.package_id
WHERE c.package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit');

-- Dry-run package deletes
SELECT 'WOULD DELETE FROM service_packages' AS action, id, name
FROM service_packages
WHERE id NOT IN ('pkg_tf_free', 'pkg_tf_audit');

\echo '--- DRY-RUN COMPLETE — no data was deleted ---'
*/

-- ============================================================================
-- SECTION 4: DELETE OLD CASES
-- ============================================================================
-- Cascade rules (from Prisma schema):
--   cases → case_members    (CASCADE)
--   cases → checkpoints     (CASCADE)
--   cases → lifecycle_units (CASCADE)
--   cases → reports         (CASCADE)
--   cases → payments        (CASCADE)
--   cases → case_messages   (CASCADE)
--   cases → case_events     (CASCADE)
--   cases → ai_jobs         (CASCADE)
--   cases → document_records(CASCADE)
--   cases → team_fit_reports(CASCADE)
--   cases → audit_rounds    (CASCADE)
--
-- Deleting from cases will automatically cascade-delete all child records.

\echo ''
\echo '========================================'
\echo 'SECTION 4: DELETING OLD CASES'
\echo '========================================'

-- Print UUIDs before deletion (for audit log)
\echo '--- Deleting cases with these UUIDs ---'
SELECT id, case_code
FROM cases
WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit');

-- Execute the delete
DELETE FROM cases
WHERE package_id NOT IN ('pkg_tf_free', 'pkg_tf_audit');

\echo '--- Cases deleted ---'

-- ============================================================================
-- SECTION 5: DELETE OLD PACKAGES
-- ============================================================================
-- Now that no cases reference the old packages, we can delete them.
-- Payment references ServicePackage with NO CASCADE (Restrict by default),
-- but payments were cascade-deleted in SECTION 4, so no orphan risk.

\echo ''
\echo '========================================'
\echo 'SECTION 5: DELETING OLD PACKAGES'
\echo '========================================'

\echo '--- Deleting packages ---'
SELECT id, name
FROM service_packages
WHERE id NOT IN ('pkg_tf_free', 'pkg_tf_audit');

DELETE FROM service_packages
WHERE id NOT IN ('pkg_tf_free', 'pkg_tf_audit');

\echo '--- Packages deleted ---'

-- ============================================================================
-- SECTION 6: VERIFY — CONFIRM CLEANUP
-- ============================================================================

\echo ''
\echo '========================================'
\echo 'SECTION 6: VERIFICATION'
\echo '========================================'

-- 6a. Remaining cases (should only be pkg_tf_free / pkg_tf_audit / NULL)
\echo '--- Remaining cases by package ---'
SELECT
    COALESCE(sp.name, '(no package)') AS package_name,
    COUNT(*) AS case_count
FROM cases c
LEFT JOIN service_packages sp ON sp.id = c.package_id
GROUP BY sp.name
ORDER BY sp.name;

-- 6b. Remaining packages (should be only pkg_tf_free, pkg_tf_audit)
\echo ''
\echo '--- Remaining packages ---'
SELECT id, name, price, is_active
FROM service_packages
ORDER BY name;

-- 6c. Quick sanity: child tables should have 0 rows for old cases
\echo ''
\echo '--- Orphan check (should all be 0) ---'
SELECT 'case_members'    AS table_name, COUNT(*) AS orphan_count
FROM case_members    WHERE case_id NOT IN (SELECT id FROM cases)
UNION ALL
SELECT 'checkpoints',     COUNT(*) FROM checkpoints     WHERE case_id NOT IN (SELECT id FROM cases)
UNION ALL
SELECT 'lifecycle_units', COUNT(*) FROM lifecycle_units WHERE case_id NOT IN (SELECT id FROM cases)
UNION ALL
SELECT 'reports',         COUNT(*) FROM reports         WHERE case_id NOT IN (SELECT id FROM cases)
UNION ALL
SELECT 'payments',        COUNT(*) FROM payments        WHERE case_id NOT IN (SELECT id FROM cases)
UNION ALL
SELECT 'case_messages',   COUNT(*) FROM case_messages   WHERE case_id NOT IN (SELECT id FROM cases)
UNION ALL
SELECT 'case_events',     COUNT(*) FROM case_events     WHERE case_id NOT IN (SELECT id FROM cases)
UNION ALL
SELECT 'ai_jobs',         COUNT(*) FROM ai_jobs         WHERE case_id NOT IN (SELECT id FROM cases)
UNION ALL
SELECT 'document_records',COUNT(*) FROM document_records WHERE case_id NOT IN (SELECT id FROM cases)
UNION ALL
SELECT 'team_fit_reports',COUNT(*) FROM team_fit_reports WHERE case_id NOT IN (SELECT id FROM cases)
UNION ALL
SELECT 'audit_rounds',    COUNT(*) FROM audit_rounds    WHERE case_id NOT IN (SELECT id FROM cases);

\echo ''
\echo '========================================'
\echo 'CLEANUP COMPLETE'
\echo '========================================'
\echo 'If verification looks good, run COMMIT below.'
\echo 'If anything is wrong, run ROLLBACK instead.'
\echo ''

-- ============================================================================
-- FINAL: COMMIT OR ROLLBACK
-- ============================================================================
-- ⚠️  DEFAULT: ROLLBACK is active (script is SAFE by default).
--     To actually save changes, COMMENT the ROLLBACK line and UNCOMMENT COMMIT.

ROLLBACK;  -- ← comment this line after verifying results are correct
-- COMMIT; -- ← uncomment this line to save changes

-- ============================================================================
-- POST-CLEANUP NOTES
-- ============================================================================
-- After COMMIT:
--   1. Verify app still works (login, create new case, view existing cases)
--   2. Check Cloudinary / file storage for orphaned files
--   3. Update any external reports or dashboards that referenced old cases
--   4. Optionally run VACUUM ANALYZE to reclaim space:
--      VACUUM ANALYZE cases;
--      VACUUM ANALYZE service_packages;
-- ============================================================================
