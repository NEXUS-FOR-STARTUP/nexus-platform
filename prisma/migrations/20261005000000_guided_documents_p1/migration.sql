-- CreateTable
CREATE TABLE "project_answers" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "answer_text" TEXT NOT NULL,
    "needs_review" BOOLEAN NOT NULL DEFAULT false,
    "review_reason" TEXT,
    "catalog_version" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_answers_case_id_question_id_key" ON "project_answers"("case_id", "question_id");

-- CreateIndex
CREATE INDEX "project_answers_case_id_idx" ON "project_answers"("case_id");

-- AddForeignKey
ALTER TABLE "project_answers" ADD CONSTRAINT "project_answers_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "answer_revisions" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "revision_no" INTEGER NOT NULL DEFAULT 1,
    "answer_text" TEXT NOT NULL,
    "status_after" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "source_document_record_id" TEXT,
    "catalog_version" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "answer_revisions_case_id_question_id_revision_no_key" ON "answer_revisions"("case_id", "question_id", "revision_no");

-- CreateIndex
CREATE INDEX "answer_revisions_case_id_idx" ON "answer_revisions"("case_id");

-- AddForeignKey
ALTER TABLE "answer_revisions" ADD CONSTRAINT "answer_revisions_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "import_proposals" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "source_document_record_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proposed_items" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "import_proposals_case_id_idx" ON "import_proposals"("case_id");

-- AddForeignKey
ALTER TABLE "import_proposals" ADD CONSTRAINT "import_proposals_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "authoring_jobs" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "checkpoint_id" TEXT NOT NULL,
    "template_key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "input_revision_snapshot" JSONB NOT NULL,
    "output_lifecycle_unit_id" TEXT,
    "error" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "catalog_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authoring_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authoring_jobs_idempotency_key_key" ON "authoring_jobs"("idempotency_key");

-- CreateIndex
CREATE INDEX "authoring_jobs_case_id_idx" ON "authoring_jobs"("case_id");

-- AddForeignKey
ALTER TABLE "authoring_jobs" ADD CONSTRAINT "authoring_jobs_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed: add generated_document document type (additive; does not modify existing rows).
INSERT INTO "document_types" ("code", "label", "flow", "unit_scope", "sort_order")
VALUES ('generated_document', 'Tài liệu được sinh tự động', 'revision', 'version', 70)
ON CONFLICT ("code") DO NOTHING;
