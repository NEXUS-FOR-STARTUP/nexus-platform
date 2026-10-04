-- CreateTable
CREATE TABLE "case_chat_read_states" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_message_id" TEXT,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_chat_read_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "case_chat_read_states_case_id_idx" ON "case_chat_read_states"("case_id");

-- CreateIndex
CREATE INDEX "case_chat_read_states_user_id_idx" ON "case_chat_read_states"("user_id");

-- CreateIndex
CREATE INDEX "case_chat_read_states_case_id_last_read_at_idx" ON "case_chat_read_states"("case_id", "last_read_at");

-- CreateIndex
CREATE UNIQUE INDEX "case_chat_read_states_case_id_user_id_key" ON "case_chat_read_states"("case_id", "user_id");

-- AddForeignKey
ALTER TABLE "case_chat_read_states" ADD CONSTRAINT "case_chat_read_states_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_chat_read_states" ADD CONSTRAINT "case_chat_read_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

