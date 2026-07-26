-- CreateEnum
CREATE TYPE "VerificationSource" AS ENUM ('auto', 'manual');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN "verification_source" "VerificationSource" NOT NULL DEFAULT 'manual';
