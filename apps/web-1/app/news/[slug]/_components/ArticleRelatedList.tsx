import Link from 'next/link';
import Image from 'next/image';
import { Newspaper } from 'lucide-react';
import { Avatar } from '@mantine/core';
import { getNewsCategoryName } from '@repo/validation';
import { isOptimizedImageDomain } from '@/lib/image-utils';

export interface RelatedArticle {
  id: string;
  title: string;
  slug: string;
  published_at: string;
  excerpt: string | null;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  category?: string;
  author_byline?: string;
  author_avatar_url?: string | null;
}

interface ArticleRelatedListProps {
  articles: RelatedArticle[];
  formatDate: (iso: string) => string;
}

export function ArticleRelatedList({ articles, formatDate }: ArticleRelatedListProps) {
  if (articles.length === 0) return null;

  return (
    <div className="mt-16 pt-8 border-t border-border-app">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-sans font-bold text-xl text-text-app tracking-tight">
          Bài viết cùng chủ đề
        </h3>
        <Link href="/news" className="text-xs text-brand hover:underline font-medium">
          Xem tất cả
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {articles.map((rel) => {
          const authorName = rel.author_byline || 'Nexus Team';
          const authorInitials =
            authorName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'NX';
          const categoryTag = rel.category
            ? getNewsCategoryName(rel.category).toUpperCase()
            : 'KHỞI NGHIỆP';

          return (
            <article
              key={rel.id}
              className="group flex flex-col bg-surface-app border border-border-app rounded-lg overflow-hidden hover:border-brand/40 transition-all duration-200"
            >
              {/* Ảnh bìa */}
              <Link
                href={`/news/${rel.slug}`}
                className="relative w-full aspect-video bg-surface-soft overflow-hidden block"
              >
                {rel.cover_image_url ? (
                  <Image
                    src={rel.cover_image_url}
                    alt={rel.cover_image_alt || rel.title}
                    fill
                    unoptimized={!isOptimizedImageDomain(rel.cover_image_url)}
                    sizes="(max-width: 640px) 100vw, 350px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <Newspaper size={32} />
                  </div>
                )}
              </Link>

              {/* Nội dung bên dưới ảnh */}
              <div className="flex-1 flex flex-col justify-between p-4">
                <div>
                  <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1 block">
                    {categoryTag}
                  </span>

                  <Link href={`/news/${rel.slug}`} className="block">
                    <h4 className="font-bold text-text-app group-hover:text-brand transition-colors text-sm sm:text-base line-clamp-2 leading-snug mb-2">
                      {rel.title}
                    </h4>
                  </Link>

                  {rel.excerpt && (
                    <p className="text-xs text-text-app/75 line-clamp-2 leading-relaxed mb-3">
                      {rel.excerpt}
                    </p>
                  )}
                </div>

                {/* Tác giả & Ngày đăng */}
                <div className="flex items-center gap-2 pt-2 border-t border-border-app/40 text-[11px] text-text-muted mt-auto">
                  <Avatar
                    src={rel.author_avatar_url}
                    color="blue"
                    radius="xl"
                    size={20}
                    className="font-bold shrink-0 text-[10px]"
                  >
                    {authorInitials}
                  </Avatar>
                  <span className="font-medium text-text-app truncate max-w-[110px]">
                    {authorName}
                  </span>
                  <span>•</span>
                  <span className="shrink-0">{formatDate(rel.published_at)}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
