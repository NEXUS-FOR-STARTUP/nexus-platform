-- CreateIndex
CREATE INDEX IF NOT EXISTS "deposits_created_at_idx" ON "deposits"("created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cases_created_at_id_idx" ON "cases"("created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cases_user_facing_stage_idx" ON "cases"("user_facing_stage");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cases_internal_status_idx" ON "cases"("internal_status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "cases_sla_deadline_at_idx" ON "cases"("sla_deadline_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lifecycle_units_case_id_unit_type_version_no_idx" ON "lifecycle_units"("case_id", "unit_type", "version_no");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "document_records_created_at_idx" ON "document_records"("created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_case_id_created_at_idx" ON "reports"("case_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_jobs_job_type_status_updated_at_idx" ON "ai_jobs"("job_type", "status", "updated_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_jobs_job_type_created_at_idx" ON "ai_jobs"("job_type", "created_at" DESC);

-- Analyze tables to refresh query planner statistics immediately
ANALYZE "cases";
ANALYZE "orders";
ANALYZE "ai_jobs";
ANALYZE "document_records";
ANALYZE "lifecycle_units";
ANALYZE "deposits";
ANALYZE "reports";
