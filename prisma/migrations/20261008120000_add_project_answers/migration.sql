-- CreateTable
CREATE TABLE "project_answers" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_answers_case_id_question_id_key" ON "project_answers"("case_id", "question_id");

-- CreateIndex
CREATE INDEX "project_answers_case_id_idx" ON "project_answers"("case_id");

-- AddForeignKey
ALTER TABLE "project_answers" ADD CONSTRAINT "project_answers_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
