'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button, Group, Text, Title, Badge, Avatar } from '@mantine/core';
import { Play } from 'lucide-react';
import { NewsCard } from './NewsCard';
import type { NewsListResult } from '@/lib/news-server';
import type { NewsItemPublicCard } from '@repo/validation';

interface NewsFeedProps {
  data: NewsListResult;
  currentType?: string;
}

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffHours < 48) return 'Hôm qua';

    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function FeaturedCard({ item }: { item: NewsItemPublicCard }) {
  const isVideo = item.type === 'video';
  const targetUrl = isVideo
    ? `https://www.youtube.com/watch?v=${item.youtube_video_id}`
    : `/news/${item.slug}`;

  return (
    <article className="group mb-10 bg-surface-app border border-border-app rounded-2xl p-5 sm:p-7 hover:border-brand/50 transition-all duration-200">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-center">
        {/* Featured Image */}
        <div className="relative w-full lg:w-[480px] aspect-video rounded-xl overflow-hidden bg-surface-soft shrink-0">
          {isVideo ? (
            <a href={targetUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full relative">
              <Image
                src={item.youtube_thumbnail_url}
                alt={item.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/35 transition-colors">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
                  <Play size={22} className="fill-current ml-0.5" />
                </div>
              </div>
            </a>
          ) : item.cover_image_url ? (
            <Link href={targetUrl} className="block w-full h-full relative">
              <Image
                src={item.cover_image_url}
                alt={item.cover_image_alt || item.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
          ) : null}
        </div>

        {/* Featured Info */}
        <div className="flex-1 flex flex-col justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Avatar color={isVideo ? 'red' : 'blue'} radius="xl" size="xs" className="text-[10px] font-bold">
                {isVideo ? 'YT' : 'NX'}
              </Avatar>
              <span className="text-xs font-semibold text-text-app">
                {isVideo ? 'Nexus Video' : 'Nexus Team'}
              </span>
              <Badge color={isVideo ? 'red' : 'blue'} variant="light" size="xs" radius="xs" className="font-semibold uppercase tracking-wider text-[10px]">
                {isVideo ? 'Video nổi bật' : 'Bài viết mới nhất'}
              </Badge>
            </div>

            <Link href={targetUrl} target={isVideo ? '_blank' : undefined} rel={isVideo ? 'noopener noreferrer' : undefined}>
              <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-text-app group-hover:text-brand transition-colors leading-snug tracking-tight mb-3">
                {item.title}
              </h2>
            </Link>

            {item.excerpt && (
              <p className="font-serif text-base text-text-app/85 line-clamp-3 leading-relaxed mb-4">
                {item.excerpt}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border-app/60 text-xs text-text-muted">
            <span className="text-xs text-text-muted">
              {formatDate(item.published_at)}
            </span>
            <Link
              href={targetUrl}
              target={isVideo ? '_blank' : undefined}
              rel={isVideo ? 'noopener noreferrer' : undefined}
              className="text-brand font-semibold hover:underline"
            >
              {isVideo ? 'Xem ngay trên YouTube' : 'Đọc bài viết'}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export function NewsFeed({ data, currentType }: NewsFeedProps) {
  const { items, page, total_pages } = data;

  const filters = [
    { label: 'Tất cả', value: '' },
    { label: 'Bài viết', value: 'article' },
    { label: 'Video', value: 'video' },
  ];

  const featuredItem = page === 1 && items.length > 0 ? items[0] : null;
  const listItems = page === 1 && items.length > 0 ? items.slice(1) : items;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 sm:mb-10">
        <Title order={1} className="text-3xl sm:text-4xl font-extrabold text-text-app tracking-tight mb-2.5">
          Khởi nghiệp & Góc nhìn
        </Title>
        <Text size="md" className="font-serif text-text-muted max-w-2xl leading-relaxed">
          Bài viết chuyên sâu, kinh nghiệm thực chiến và tài liệu hướng dẫn khởi nghiệp từ Nexus Platform.
        </Text>

        {/* Filter Pills */}
        <Group gap="xs" mt="lg">
          {filters.map((f) => {
            const isActive = (currentType || '') === f.value;
            const queryParams = new URLSearchParams();
            if (f.value) queryParams.set('type', f.value);
            const href = `/news${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

            return (
              <Button
                key={f.label}
                component={Link}
                href={href}
                size="xs"
                radius="xl"
                variant={isActive ? 'filled' : 'light'}
                color={isActive ? 'brand' : 'gray'}
                className="font-medium px-4 text-xs h-8"
              >
                {f.label}
              </Button>
            );
          })}
        </Group>
      </div>

      {/* Empty State */}
      {items.length === 0 ? (
        <div className="text-center py-36 bg-surface-app rounded-2xl border border-border-app">
          <Text size="lg" fw={500} className="text-text-app mb-1">
            Chưa có nội dung nào
          </Text>
          <Text size="sm" c="dimmed" className="font-serif">
            Nội dung mới sẽ sớm được cập nhật. Vui lòng quay lại sau!
          </Text>
        </div>
      ) : (
        <>
          {/* Featured Hero Card on Page 1 */}
          {featuredItem && <FeaturedCard item={featuredItem} />}

          {/* Regular List Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {listItems.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {total_pages > 1 && (
        <Group justify="center" mt="xl" gap="sm">
          {page > 1 && (
            <Button
              component={Link}
              href={`/news?page=${page - 1}${currentType ? `&type=${currentType}` : ''}`}
              variant="default"
              size="sm"
              radius="md"
            >
              Trang trước
            </Button>
          )}
          <Text size="sm" className="text-text-muted px-2 font-serif">
            Trang {page} / {total_pages}
          </Text>
          {page < total_pages && (
            <Button
              component={Link}
              href={`/news?page=${page + 1}${currentType ? `&type=${currentType}` : ''}`}
              variant="default"
              size="sm"
              radius="md"
            >
              Trang sau
            </Button>
          )}
        </Group>
      )}
    </div>
  );
}
