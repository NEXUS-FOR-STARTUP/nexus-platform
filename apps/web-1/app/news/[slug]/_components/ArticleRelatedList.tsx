import Link from 'next/link';

interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  excerpt: string | null;
}

interface ArticleRelatedListProps {
  articles: RelatedArticle[];
  formatDate: (iso: string) => string;
}

export function ArticleRelatedList({ articles, formatDate }: ArticleRelatedListProps) {
  if (articles.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-sans font-bold text-xl text-text-app tracking-tight">
          Bài viết cùng chủ đề
        </h3>
        <Link href="/news" className="text-xs text-brand hover:underline font-medium">
          Xem tất cả
        </Link>
      </div>

      <div className="space-y-4">
        {articles.map((rel) => (
          <Link
            key={rel.id}
            href={`/news/${rel.slug}`}
            className="group block p-4 rounded-xl border border-border-app bg-surface-app hover:border-brand/40 transition-all"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text-app text-base line-clamp-1 group-hover:text-brand transition-colors mb-1">
                  {rel.title}
                </h4>
                {rel.excerpt && (
                  <p className="text-xs text-text-muted line-clamp-1 font-serif">
                    {rel.excerpt}
                  </p>
                )}
              </div>
              <span className="text-xs text-text-muted shrink-0">
                {formatDate(rel.published_at)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
