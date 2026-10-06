-- AlterTable
ALTER TABLE "news_items" ADD COLUMN "category" VARCHAR(50) NOT NULL DEFAULT 'khoi-nghiep';

-- CreateIndex
CREATE INDEX "news_items_status_category_published_at_idx" ON "news_items"("status", "category", "published_at" DESC);
