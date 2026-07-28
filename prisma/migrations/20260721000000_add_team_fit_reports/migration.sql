-- CreateTable
CREATE TABLE "team_fit_reports" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "idea_snapshot" JSONB NOT NULL,
    "team_snapshot" JSONB NOT NULL,
    "result_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_fit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_fit_reports_case_id_key" ON "team_fit_reports"("case_id");

-- CreateIndex
CREATE INDEX "team_fit_reports_case_id_idx" ON "team_fit_reports"("case_id");

-- AddForeignKey
ALTER TABLE "team_fit_reports" ADD CONSTRAINT "team_fit_reports_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
