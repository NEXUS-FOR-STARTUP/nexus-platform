-- AlterTable: Update default for internal_status to match workflow initialMarking
ALTER TABLE "cases" ALTER COLUMN "internal_status" SET DEFAULT 'triage_pending';
