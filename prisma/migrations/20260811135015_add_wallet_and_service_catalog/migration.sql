-- Enum: WalletTxType
CREATE TYPE "WalletTxType" AS ENUM ('deposit', 'withdrawal', 'refund', 'adjustment', 'migration');

-- Service Types
CREATE TABLE "service_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "service_types_code_key" ON "service_types"("code");

-- Service Pricing
CREATE TABLE "service_pricing" (
    "id" TEXT NOT NULL,
    "package_id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "previous_price" INTEGER,
    "changed_by" TEXT,
    "changed_at" TIMESTAMP(3),
    CONSTRAINT "service_pricing_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "service_pricing_package_id_is_current_idx" ON "service_pricing"("package_id", "is_current");
ALTER TABLE "service_pricing" ADD CONSTRAINT "service_pricing_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "service_packages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Service Packages: add service_type_id (nullable — backfill before making NOT NULL)
ALTER TABLE "service_packages" ADD COLUMN "service_type_id" TEXT;
CREATE INDEX "service_packages_service_type_id_idx" ON "service_packages"("service_type_id");
ALTER TABLE "service_packages" ADD CONSTRAINT "service_packages_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- User Wallets
CREATE TABLE "user_wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_wallets_user_id_key" ON "user_wallets"("user_id");
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Wallet Transactions
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "type" "WalletTxType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "balance_before" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "wallet_transactions_idempotency_key_key" ON "wallet_transactions"("idempotency_key");
CREATE INDEX "wallet_transactions_wallet_id_created_at_idx" ON "wallet_transactions"("wallet_id", "created_at");
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "user_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Wallet Topups
CREATE TABLE "wallet_topups" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "transfer_content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verified_by" TEXT,
    "verification_source" TEXT,
    "metadata_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "wallet_topups_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "wallet_topups" ADD CONSTRAINT "wallet_topups_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
