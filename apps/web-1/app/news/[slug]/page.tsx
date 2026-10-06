import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Avatar, Button } from '@mantine/core';
import { ArrowLeft } from 'lucide-react';
import { fetchPublicArticleDetail, fetchPublicNewsList } from '@/lib/news-server';
import { NewsTipTapRenderer } from './_components/NewsTipTapRenderer';
import { ArticleShareButton } from './_components/ArticleShareButton';

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

  // Fetch related recent articles (excluding current article)
  let relatedArticles: Array<{
    id: string;
    title: string;
    slug: string;
    published_at: string;
    cover_image_url: string | null;
    cover_image_alt: string | null;
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

  const authorInitials = article.author_byline
    ? article.author_byline.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'NX';

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

      {/* Spiderum-style Header (thống nhất 700px với toàn bộ bài viết) */}
      <header className="mb-10">
        <Badge
          color="blue"
          variant="light"
          size="lg"
          radius="xs"
          className="font-bold tracking-wider uppercase mb-5 px-3 py-1.5 !text-xs sm:!text-[13px] bg-blue-50 text-[#288ad6] !border-0"
        >
          Khởi nghiệp & Công nghệ
        </Badge>

        <h1 className="text-2xl sm:text-3xl md:text-[34px] font-black text-text-app tracking-tight leading-snug mb-8 sm:mb-10">
          {article.title}
        </h1>

        {/* Byline row: Avatar + Author + Date + Share Action (No borders, no icons, no read time, no bullets) */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Avatar color="blue" radius="xl" size="md" className="font-semibold text-xs border border-border-app">
              {authorInitials}
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text-app hover:text-[#288ad6] transition-colors">
                {article.author_byline}
              </span>
              <span className="text-xs text-text-muted">
                {formatDate(article.published_at)}
              </span>
            </div>
          </div>

          <ArticleShareButton title={article.title} />
        </div>

        {/* Excerpt / Sapo (Merriweather Serif, no left border line) */}
        {article.excerpt && (
          <p className="font-serif italic text-[19px] leading-[1.85] text-text-app mb-10">
            {article.excerpt}
          </p>
        )}
      </header>

      {/* Cover Image */}
      {article.cover_image_url && (
        <div className="w-full mb-10">
          <div className="relative aspect-video w-full overflow-hidden bg-surface-soft border border-border-app">
            <Image
              src={article.cover_image_url}
              alt={article.cover_image_alt || article.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 700px"
              className="object-cover"
            />
          </div>
          {article.cover_image_alt && (
            <p className="text-center text-xs text-text-muted mt-2 italic font-serif">
              {article.cover_image_alt}
            </p>
          )}
        </div>
      )}

      {/* Main Prose Body: 700px reading width, Merriweather font */}
      <div className="w-full">
        <NewsTipTapRenderer content={article.content_json} />

        {/* Article Tags */}
        <div className="mt-12 pt-6 border-t border-border-app flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-text-muted mr-1">Chủ đề:</span>
          {['#KhởiNghiệp', '#CôngNghệAI', '#ProductMarketFit', '#GócNhìnFounder'].map((tag) => (
            <span
              key={tag}
              className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-surface-soft text-text-muted hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Spiderum-style Author Bio Card */}
        <div className="mt-8 p-6 rounded-xl bg-surface-app border border-border-app flex items-start gap-4">
          <Avatar color="blue" radius="xl" size="lg" className="font-semibold text-base border border-border-app shrink-0">
            {authorInitials}
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-text-app text-base">{article.author_byline}</h4>
              <span className="text-xs text-brand font-medium bg-brand/10 px-2 py-0.5 rounded">Tác giả</span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed font-serif">
              Ban biên tập nội dung & cố vấn chuyên môn tại Nexus Platform. Đồng hành cùng các nhà sáng lập trẻ trên hành trình biến ý tưởng thành hiện thực.
            </p>
          </div>
        </div>

        {/* Related / Next Reads */}
        {relatedArticles.length > 0 && (
          <div className="mt-14 pt-8 border-t border-border-app">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-sans font-bold text-xl text-text-app tracking-tight">
                Bài viết cùng chủ đề
              </h3>
              <Link href="/news" className="text-xs text-brand hover:underline font-medium">
                Xem tất cả
              </Link>
            </div>

            <div className="space-y-4">
              {relatedArticles.map((rel) => (
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
        )}
      </div>
    </article>
  );
}
