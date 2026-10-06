-- AlterTable
ALTER TABLE "news_items" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT '{}';
