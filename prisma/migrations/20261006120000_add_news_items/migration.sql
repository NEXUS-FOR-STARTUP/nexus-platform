-- CreateTable
CREATE TABLE IF NOT EXISTS "news_items" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(160),
    "excerpt" VARCHAR(320) NOT NULL DEFAULT '',
    "content_json" JSONB,
    "youtube_video_id" VARCHAR(11),
    "cover_image_url" TEXT,
    "cover_image_public_id" TEXT,
    "cover_image_alt" VARCHAR(200),
    "published_at" TIMESTAMP(3),
    "created_by_auth_user_id" TEXT NOT NULL,
    "updated_by_auth_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "news_items_slug_key" ON "news_items"("slug");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "news_items_status_published_at_id_idx" ON "news_items"("status", "published_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "news_items_updated_at_id_idx" ON "news_items"("updated_at" DESC, "id" DESC);
