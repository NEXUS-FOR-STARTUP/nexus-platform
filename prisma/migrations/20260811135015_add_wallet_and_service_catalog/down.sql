-- Down migration: rollback wallet and service catalog
DROP TABLE IF EXISTS "wallet_topups" CASCADE;
DROP TABLE IF EXISTS "wallet_transactions" CASCADE;
DROP TABLE IF EXISTS "user_wallets" CASCADE;
ALTER TABLE "service_packages" DROP CONSTRAINT IF EXISTS "service_packages_service_type_id_fkey";
DROP INDEX IF EXISTS "service_packages_service_type_id_idx";
ALTER TABLE "service_packages" DROP COLUMN IF EXISTS "service_type_id";
DROP TABLE IF EXISTS "service_pricing" CASCADE;
DROP TABLE IF EXISTS "service_types" CASCADE;
DROP TYPE IF EXISTS "WalletTxType";
