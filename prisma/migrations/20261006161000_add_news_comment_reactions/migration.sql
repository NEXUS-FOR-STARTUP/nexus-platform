-- DropTable
DROP TABLE IF EXISTS "news_comment_likes";

-- CreateTable
CREATE TABLE "news_comment_reactions" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NewsReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_comment_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_comment_reactions_comment_id_user_id_key" ON "news_comment_reactions"("comment_id", "user_id");

-- CreateIndex
CREATE INDEX "news_comment_reactions_comment_id_type_idx" ON "news_comment_reactions"("comment_id", "type");

-- CreateIndex
CREATE INDEX "news_comment_reactions_user_id_idx" ON "news_comment_reactions"("user_id");

-- AddForeignKey
ALTER TABLE "news_comment_reactions" ADD CONSTRAINT "news_comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "news_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news_comment_reactions" ADD CONSTRAINT "news_comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
