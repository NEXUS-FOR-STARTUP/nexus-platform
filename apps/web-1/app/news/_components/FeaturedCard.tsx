'use client';

/**
 * ============================================================================
 * THÔNG SỐ QUAN TRỌNG, ĐỪNG NÊN THAY ĐỔI
 * Các kích thước font của FeaturedCard (tag 16px, title 26px, description 16px, profile 16px)
 * đã được khóa cố định theo chuẩn Spiderum qua CSS variables (--news-featured-*)
 * và các class tương ứng (.news-featured-tag, .news-featured-title, .news-featured-desc, .news-featured-meta).
 * ============================================================================
 */

import Link from 'next/link';
import Image from 'next/image';
import { Avatar } from '@mantine/core';
import { Play } from 'lucide-react';
import type { NewsItemPublicCard } from '@repo/validation';

function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Vừa xong';
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffHours < 48) return 'Hôm qua';

    const isCurrentYear = d.getFullYear() === now.getFullYear();
    return d.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'short',
      ...(isCurrentYear ? {} : { year: 'numeric' }),
    });
  } catch {
    return '';
  }
}

function getCategoryTag(item: NewsItemPublicCard): string {
  const text = `${item.title} ${item.excerpt || ''}`.toLowerCase();
  if (/\b(ai|llm|gpt|mô hình ngôn ngữ)\b/i.test(text) || text.includes('công nghệ') || text.includes('trí tuệ nhân tạo') || text.includes('deep learning')) {
    return 'CÔNG NGHỆ NỔI BẬT';
  }
  if (text.includes('khởi nghiệp') || text.includes('startup') || text.includes('founder') || text.includes('sản phẩm') || text.includes('mvp') || text.includes('pmf')) {
    return 'KHỞI NGHIỆP NỔI BẬT';
  }
  if (text.includes('vốn') || text.includes('đầu tư') || text.includes('tài chính') || text.includes('kinh doanh') || text.includes('doanh thu')) {
    return 'TÀI CHÍNH NỔI BẬT';
  }
  if (text.includes('sách') || text.includes('đọc sách')) {
    return 'SÁCH HAY NỔI BẬT';
  }
  if (text.includes('bài học') || text.includes('triết lý') || text.includes('phát triển') || text.includes('góc nhìn') || text.includes('tư duy')) {
    return 'GÓC NHÌN NỔI BẬT';
  }
  return item.type === 'video' ? 'VIDEO NỔI BẬT' : 'KHỞI NGHIỆP NỔI BẬT';
}

export function FeaturedCard({ item }: { item: NewsItemPublicCard }) {
  const isVideo = item.type === 'video';
  const targetUrl = isVideo
    ? `https://www.youtube.com/watch?v=${item.youtube_video_id}`
    : `/news/${item.slug}`;
  const authorName = item.author_byline || (isVideo ? 'Nexus Video' : 'Nexus Team');
  const authorInitials = authorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || (isVideo ? 'YT' : 'NX');
  const categoryTag = getCategoryTag(item);

  return (
    <article className="group mb-10 bg-surface-app border border-border-app rounded-lg p-5 sm:p-7 hover:border-brand/50 transition-all duration-200">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-stretch">
        {/* Featured Image bên trái */}
        <div className="relative w-full lg:w-[480px] aspect-video rounded-md overflow-hidden bg-surface-soft shrink-0">
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

        {/* Featured Info bên phải */}
        <div className="flex-1 flex flex-col justify-between w-full">
          <div>
            {/* Tag/Phân loại: góc trên bên trái, khóa cố định qua .news-featured-tag */}
            <span className="news-featured-tag text-text-muted uppercase font-medium tracking-wide mb-2 block">
              {categoryTag}
            </span>

            <Link href={targetUrl} target={isVideo ? '_blank' : undefined} rel={isVideo ? 'noopener noreferrer' : undefined}>
              <h2 className="news-featured-title font-bold text-text-app group-hover:text-brand transition-colors leading-snug tracking-tight mb-3">
                {item.title}
              </h2>
            </Link>

            {item.excerpt && (
              <p className="news-featured-desc text-text-app/75 line-clamp-3 leading-relaxed mb-4">
                {item.excerpt}
              </p>
            )}
          </div>

          {/* Profile và ngày đăng ở dưới description: khóa cố định qua .news-featured-meta */}
          <div className="news-featured-meta flex items-center gap-2.5 pt-2 text-text-muted">
            <Avatar
              src={item.author_avatar_url}
              color={isVideo ? 'red' : 'blue'}
              radius="xl"
              size={32}
              className="font-bold shrink-0 text-xs"
            >
              {authorInitials}
            </Avatar>
            <span className="font-semibold text-text-app truncate leading-none">
              {authorName}
            </span>
            <span className="leading-none">•</span>
            <span className="shrink-0 leading-none">
              {formatDate(item.published_at)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
