import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, Group, Text, Title, Button } from '@mantine/core';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import { fetchPublicArticleDetail } from '@/lib/news-server';
import { NewsTipTapRenderer } from './_components/NewsTipTapRenderer';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

function estimateReadingMinutes(content: unknown): number {
  if (!content || typeof content !== 'object') return 1;
  let words = 0;
  function walk(node: unknown) {
    if (!node || typeof node !== 'object') return;
    if ('text' in node && typeof node.text === 'string') {
      words += node.text.trim().split(/\s+/).filter(Boolean).length;
    }
    if ('content' in node && Array.isArray(node.content)) {
      for (const child of node.content) walk(child);
    }
  }
  walk(content);
  return Math.max(1, Math.ceil(words / 200));
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
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

  const readingMinutes = estimateReadingMinutes(article.content_json);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Back button */}
      <div className="mb-6 -ml-2">
        <Link href="/news">
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            leftSection={<ArrowLeft size={16} />}
            className="text-text-muted hover:text-text-app"
          >
            Tất cả tin tức
          </Button>
        </Link>
      </div>

      {/* Header section */}
      <header className="mb-8">
        <Badge color="blue" variant="light" size="md" radius="sm" className="mb-4">
          Bài viết
        </Badge>

        <Title
          order={1}
          className="text-3xl sm:text-4xl md:text-5xl font-black text-text-app tracking-tight leading-tight mb-4"
        >
          {article.title}
        </Title>

        {article.excerpt && (
          <Text size="xl" className="text-text-muted leading-relaxed mb-6 font-normal">
            {article.excerpt}
          </Text>
        )}

        {/* Byline & Metadata */}
        <Group gap="md" className="text-xs sm:text-sm text-text-muted border-y border-border-app py-3">
          <Group gap={6}>
            <User size={15} className="text-brand" />
            <Text fw={600} className="text-text-app">
              {article.author_byline}
            </Text>
          </Group>
          <span>•</span>
          <Group gap={6}>
            <Calendar size={15} />
            <span>{formatDate(article.published_at)}</span>
          </Group>
          <span>•</span>
          <Group gap={6}>
            <Clock size={15} />
            <span>{readingMinutes} phút đọc</span>
          </Group>
        </Group>
      </header>

      {/* Cover image */}
      {article.cover_image_url && (
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-surface-soft mb-10 border border-border-app shadow-sm">
          <Image
            src={article.cover_image_url}
            alt={article.cover_image_alt || article.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
          />
        </div>
      )}

      {/* Article Body: 720px reading width */}
      <div className="max-w-[720px] mx-auto">
        <NewsTipTapRenderer content={article.content_json} />
      </div>
    </article>
  );
}
