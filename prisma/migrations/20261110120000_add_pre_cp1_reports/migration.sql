-- CreateTable
CREATE TABLE "pre_cp1_reports" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "auth_user_id" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "input_snapshot" JSONB NOT NULL,
    "ai_labels" JSONB,
    "report_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pre_cp1_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pre_cp1_reports_case_id_input_hash_key" ON "pre_cp1_reports"("case_id", "input_hash");

-- CreateIndex
CREATE INDEX "pre_cp1_reports_case_id_created_at_idx" ON "pre_cp1_reports"("case_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "pre_cp1_reports_auth_user_id_created_at_idx" ON "pre_cp1_reports"("auth_user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "pre_cp1_reports" ADD CONSTRAINT "pre_cp1_reports_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_cp1_reports" ADD CONSTRAINT "pre_cp1_reports_auth_user_id_fkey" FOREIGN KEY ("auth_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
