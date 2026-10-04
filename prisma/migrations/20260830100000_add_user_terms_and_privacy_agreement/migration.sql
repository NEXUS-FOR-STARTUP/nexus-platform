-- AlterTable
ALTER TABLE "users" ADD COLUMN "terms_and_privacy_version" TEXT,
ADD COLUMN "terms_and_privacy_accepted_at" TIMESTAMP(3);
