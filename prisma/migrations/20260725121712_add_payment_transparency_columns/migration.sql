-- AlterTable
ALTER TABLE "payments" ADD COLUMN "transfer_content" TEXT,
ADD COLUMN "bank_transaction_id" TEXT,
ADD COLUMN "bank_credited_at" TIMESTAMP(3),
ADD COLUMN "payer_auth_user_id" TEXT,
ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'VND',
ADD COLUMN "payment_method" TEXT NOT NULL DEFAULT 'bank_transfer';

-- CreateIndex
CREATE UNIQUE INDEX "payments_transfer_content_key" ON "payments"("transfer_content");

-- CreateIndex
CREATE INDEX "payments_transfer_content_idx" ON "payments"("transfer_content");

-- CreateIndex
CREATE INDEX "payments_bank_transaction_id_idx" ON "payments"("bank_transaction_id");

-- CreateIndex
CREATE INDEX "payments_payer_auth_user_id_idx" ON "payments"("payer_auth_user_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_auth_user_id_fkey" FOREIGN KEY ("payer_auth_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
