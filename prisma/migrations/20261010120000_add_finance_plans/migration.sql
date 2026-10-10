-- CreateTable
CREATE TABLE "finance_plans" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finance_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "finance_plans_case_id_key" ON "finance_plans"("case_id");

-- AddForeignKey
ALTER TABLE "finance_plans" ADD CONSTRAINT "finance_plans_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
