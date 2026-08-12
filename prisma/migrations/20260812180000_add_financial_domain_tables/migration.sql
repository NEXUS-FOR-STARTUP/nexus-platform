-- AlterEnum: add service_payment to WalletTxType
ALTER TYPE "WalletTxType" ADD VALUE 'service_payment';

-- CreateTable: deposits
CREATE TABLE "deposits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "transfer_content" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "proof_file_url" TEXT,
    "rejection_reason" TEXT,
    "bank_transaction_id" TEXT,
    "bank_credited_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "verification_source" "VerificationSource" NOT NULL DEFAULT 'manual',
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: deposits
CREATE UNIQUE INDEX "deposits_transfer_content_key" ON "deposits"("transfer_content");
CREATE UNIQUE INDEX "deposits_idempotency_key_key" ON "deposits"("idempotency_key");
CREATE INDEX "deposits_user_id_created_at_idx" ON "deposits"("user_id", "created_at");
CREATE INDEX "deposits_status_created_at_idx" ON "deposits"("status", "created_at");

-- AddForeignKey: deposits
ALTER TABLE "deposits" ADD CONSTRAINT "deposits_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: orders
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "idempotency_key" TEXT NOT NULL,
    "wallet_transaction_id" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: orders
CREATE UNIQUE INDEX "orders_idempotency_key_key" ON "orders"("idempotency_key");
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- AddForeignKey: orders
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: order_items
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey: order_items
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: domain_event_outbox
CREATE TABLE "domain_event_outbox" (
    "id" SERIAL NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "processing_at" TIMESTAMP(3),
    "next_retry_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_event_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: domain_event_outbox
CREATE INDEX "domain_event_outbox_status_next_retry_at_idx" ON "domain_event_outbox"("status", "next_retry_at");
CREATE INDEX "domain_event_outbox_status_created_at_idx" ON "domain_event_outbox"("status", "created_at");

-- AlterTable: wallet_transactions — expand-contract: ADD columns, keep source_type/source_id
ALTER TABLE "wallet_transactions" ADD COLUMN "reference_type" TEXT;
ALTER TABLE "wallet_transactions" ADD COLUMN "reference_id" TEXT;

-- AlterTable: payments — add type column for transition period
ALTER TABLE "payments" ADD COLUMN "type" TEXT DEFAULT 'purchase';

-- AlterTable: credit_ledgers — add reference_type discriminator
ALTER TABLE "credit_ledgers" ADD COLUMN "reference_type" TEXT;
