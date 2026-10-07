-- CreateTable
CREATE TABLE "news_item_revisions" (
    "id" TEXT NOT NULL,
    "news_item_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_by_auth_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_item_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "news_item_revisions_news_item_id_created_at_idx" ON "news_item_revisions"("news_item_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "news_item_revisions" ADD CONSTRAINT "news_item_revisions_news_item_id_fkey" FOREIGN KEY ("news_item_id") REFERENCES "news_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
