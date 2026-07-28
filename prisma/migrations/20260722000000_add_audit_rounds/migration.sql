-- CreateTable
CREATE TABLE "audit_rounds" (
    "id" TEXT NOT NULL,
    "case_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "payment_id" TEXT,
    "checkpoint_id" TEXT,
    "sla_deadline_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_rounds_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "audit_rounds_case_id_round_number_key" UNIQUE ("case_id", "round_number")
);

-- CreateIndex
CREATE INDEX "audit_rounds_case_id_idx" ON "audit_rounds"("case_id");

-- AddForeignKey
ALTER TABLE "audit_rounds" ADD CONSTRAINT "audit_rounds_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "audit_rounds" ADD CONSTRAINT "audit_rounds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "audit_rounds" ADD CONSTRAINT "audit_rounds_checkpoint_id_fkey" FOREIGN KEY ("checkpoint_id") REFERENCES "checkpoints"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddFK constraints for existing audit_round_id columns on reports and case_events
ALTER TABLE "reports" ADD CONSTRAINT "reports_audit_round_id_fkey" FOREIGN KEY ("audit_round_id") REFERENCES "audit_rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "case_events" ADD CONSTRAINT "case_events_audit_round_id_fkey" FOREIGN KEY ("audit_round_id") REFERENCES "audit_rounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;
