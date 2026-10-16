-- CreateTable
CREATE TABLE "receivables" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "request_key" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_contact" TEXT NOT NULL,
    "case_id" TEXT,
    "order_id" TEXT,
    "grant_tx_id" TEXT,
    "amount_due" INTEGER NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "review_reason" TEXT,
    "public_token_hash" TEXT,
    "public_token_rotated_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receivables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivable_payments" (
    "id" TEXT NOT NULL,
    "receivable_id" TEXT NOT NULL,
    "gross_amount" INTEGER NOT NULL,
    "applied_amount" INTEGER NOT NULL,
    "bank_ref" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "recorded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivable_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivable_adjustments" (
    "id" TEXT NOT NULL,
    "receivable_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "credits" INTEGER,
    "idempotency_key" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receivable_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "receivables_code_key" ON "receivables"("code");

-- CreateIndex
CREATE UNIQUE INDEX "receivables_request_key_key" ON "receivables"("request_key");

-- CreateIndex
CREATE UNIQUE INDEX "receivables_order_id_key" ON "receivables"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "receivables_grant_tx_id_key" ON "receivables"("grant_tx_id");

-- CreateIndex
CREATE UNIQUE INDEX "receivables_public_token_hash_key" ON "receivables"("public_token_hash");

-- CreateIndex
CREATE INDEX "receivables_case_id_idx" ON "receivables"("case_id");

-- CreateIndex
CREATE INDEX "receivables_due_at_idx" ON "receivables"("due_at");

-- CreateIndex
CREATE UNIQUE INDEX "receivable_payments_bank_ref_key" ON "receivable_payments"("bank_ref");

-- CreateIndex
CREATE INDEX "receivable_payments_receivable_id_idx" ON "receivable_payments"("receivable_id");

-- CreateIndex
CREATE UNIQUE INDEX "receivable_adjustments_idempotency_key_key" ON "receivable_adjustments"("idempotency_key");

-- CreateIndex
CREATE INDEX "receivable_adjustments_receivable_id_idx" ON "receivable_adjustments"("receivable_id");

-- AddForeignKey
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_case_id_fkey" FOREIGN KEY ("case_id") REFERENCES "cases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_grant_tx_id_fkey" FOREIGN KEY ("grant_tx_id") REFERENCES "wallet_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "receivables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivable_adjustments" ADD CONSTRAINT "receivable_adjustments_receivable_id_fkey" FOREIGN KEY ("receivable_id") REFERENCES "receivables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Integrity guards (new tables only)
ALTER TABLE "receivables" ADD CONSTRAINT "receivables_amount_due_positive" CHECK ("amount_due" > 0);
ALTER TABLE "receivable_payments" ADD CONSTRAINT "receivable_payments_amounts_valid" CHECK ("gross_amount" > 0 AND "applied_amount" >= 0 AND "applied_amount" <= "gross_amount");
ALTER TABLE "receivable_adjustments" ADD CONSTRAINT "receivable_adjustments_amount_nonnegative" CHECK ("amount" >= 0);
