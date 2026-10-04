-- CreateIndex
CREATE INDEX "case_messages_case_id_created_at_id_idx" ON "case_messages"("case_id", "created_at", "id");
