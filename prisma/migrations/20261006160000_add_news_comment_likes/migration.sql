-- CreateTable
CREATE TABLE "news_comment_likes" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_comment_likes_comment_id_user_id_key" ON "news_comment_likes"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "news_comment_likes_comment_id_idx" ON "news_comment_likes"("comment_id");

-- CreateIndex
CREATE INDEX "news_comment_likes_user_id_idx" ON "news_comment_likes"("user_id");

-- AddForeignKey
ALTER TABLE "news_comment_likes" ADD CONSTRAINT "news_comment_likes_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "news_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_comment_likes" ADD CONSTRAINT "news_comment_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
