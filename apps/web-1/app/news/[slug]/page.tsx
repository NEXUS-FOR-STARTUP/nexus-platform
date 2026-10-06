import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { fetchPublicArticleDetail, fetchPublicNewsList } from '@/lib/news-server';
import { isOptimizedImageDomain } from '@/lib/image-utils';
import { NewsTipTapRenderer } from './_components/NewsTipTapRenderer';
import { ArticleHeader } from './_components/ArticleHeader';
import { ArticleAuthorBio } from './_components/ArticleAuthorBio';
import { ArticleRelatedList } from './_components/ArticleRelatedList';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function formatUpdateDate(isoString?: string | null): string | null {
  if (!isoString) return null;
  try {
    const d = new Date(isoString);
    const dateStr = d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeStr = d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${timeStr} ngày ${dateStr}`;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchPublicArticleDetail(slug);
  if (!article) {
    return {
      title: 'Không tìm thấy bài viết',
    };
  }

  return {
    title: article.title,
    description: article.excerpt || article.title,
    openGraph: {
      title: article.title,
      description: article.excerpt || article.title,
      type: 'article',
      publishedTime: article.published_at,
      images: article.cover_image_url ? [{ url: article.cover_image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt || article.title,
      images: article.cover_image_url ? [article.cover_image_url] : [],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await fetchPublicArticleDetail(slug);

  if (!article) {
    notFound();
  }

  let relatedArticles: Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string;
    excerpt: string | null;
  }> = [];

  try {
    const newsData = await fetchPublicNewsList({ limit: 4, type: 'article' });
    relatedArticles = newsData.items
      .filter((item): item is Extract<typeof item, { type: 'article' }> => item.type === 'article' && item.slug !== slug)
      .slice(0, 3);
  } catch {
    // Graceful fallback if related articles fail
  }

  const authorName = article.author_byline || 'Nexus Team';
  const authorInitials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'NX';

  return (
    <article className="max-w-[700px] mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top back navigation */}
      <div className="mb-8">
        <Link href="/news" className="inline-block">
          <Button
            variant="subtle"
            size="sm"
            radius="md"
            leftSection={<ArrowLeft size={16} />}
            className="text-text-muted hover:text-text-app hover:!bg-surface-soft font-medium !bg-transparent !border-0 shadow-none -ml-2 transition-colors"
          >
            Tất cả bài viết
          </Button>
        </Link>
      </div>

      {/* Spiderum-style Header */}
      <ArticleHeader
        title={article.title}
        category={article.category}
        excerpt={article.excerpt}
        authorName={authorName}
        authorInitials={authorInitials}
        authorAvatarUrl={article.author_avatar_url}
        publishedDate={formatDate(article.published_at)}
        updatedDate={formatUpdateDate(article.updated_at)}
      />

      {/* Main Cover Image (Vuông góc, max-w-[700px] khớp 100% lề chữ) */}
      {article.cover_image_url && (
        <div className="w-full mb-10 overflow-hidden bg-surface-soft">
          <div className="relative aspect-[16/10] w-full">
            <Image
              src={article.cover_image_url}
              alt={article.cover_image_alt || article.title}
              fill
              priority
              unoptimized={!isOptimizedImageDomain(article.cover_image_url)}
              sizes="(max-width: 768px) 100vw, 700px"
              className="object-cover"
            />
          </div>
          {article.cover_image_alt && (
            <p className="text-center text-xs text-text-muted mt-2 font-serif italic">
              {article.cover_image_alt}
            </p>
          )}
        </div>
      )}

      {/* Main Prose Body: 700px reading width, Merriweather font */}
      <div className="w-full">
        <NewsTipTapRenderer content={article.content_json} />

        {/* Article Tags: click để lọc theo chủ đề */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-12 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-semibold text-text-muted mr-1">Chủ đề:</span>
            {article.tags.map((rawTag) => {
              const cleanTag = rawTag.startsWith('#') ? rawTag.slice(1) : rawTag;
              return (
                <Link
                  key={rawTag}
                  href={`/news?tag=${encodeURIComponent(cleanTag)}`}
                  className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-surface-soft text-text-muted hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
                >
                  #{cleanTag}
                </Link>
              );
            })}
          </div>
        )}

        {/* Spiderum-style Author Bio Card */}
        <ArticleAuthorBio
          authorName={authorName}
          authorInitials={authorInitials}
          authorAvatarUrl={article.author_avatar_url}
        />

        {/* Related / Next Reads */}
        <ArticleRelatedList
          articles={relatedArticles}
          formatDate={formatDate}
        />
      </div>
    </article>
  );
}
