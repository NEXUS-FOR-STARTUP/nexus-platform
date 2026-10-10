-- CP2 phase 4: one checkpoint row per (case, code). Additive constraint.
-- PRE-CHECK (run read-only before deploy; this migration FAILS LOUDLY if any row is returned):
--   SELECT case_id, checkpoint_code, COUNT(*) FROM "checkpoints" GROUP BY 1, 2 HAVING COUNT(*) > 1;

-- CreateIndex
CREATE UNIQUE INDEX "checkpoints_case_id_checkpoint_code_key" ON "checkpoints"("case_id", "checkpoint_code");
