'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Avatar } from '@mantine/core';
import { Play, Newspaper } from 'lucide-react';
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
    return 'CÔNG NGHỆ';
  }
  if (text.includes('khởi nghiệp') || text.includes('startup') || text.includes('founder') || text.includes('sản phẩm') || text.includes('mvp') || text.includes('pmf')) {
    return 'KHỞI NGHIỆP';
  }
  if (text.includes('vốn') || text.includes('đầu tư') || text.includes('tài chính') || text.includes('kinh doanh') || text.includes('doanh thu')) {
    return 'TÀI CHÍNH';
  }
  if (text.includes('sách') || text.includes('đọc sách')) {
    return 'SÁCH';
  }
  if (text.includes('bài học') || text.includes('triết lý') || text.includes('phát triển') || text.includes('góc nhìn') || text.includes('tư duy')) {
    return 'GÓC NHÌN';
  }
  return item.type === 'video' ? 'VIDEO CHIA SẺ' : 'KHỞI NGHIỆP';
}

export function NewsCard({ item }: { item: NewsItemPublicCard }) {
  const isVideo = item.type === 'video';
  const authorName = item.author_byline || (isVideo ? 'Nexus Video' : 'Nexus Team');
  const authorInitials = authorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || (isVideo ? 'YT' : 'NX');
  const categoryTag = getCategoryTag(item);

  if (item.type === 'video') {
    const youtubeUrl = `https://www.youtube.com/watch?v=${item.youtube_video_id}`;
    return (
      <article className="group bg-surface-app border border-border-app rounded-lg p-4 sm:p-5 hover:border-brand/40 transition-all duration-200 h-full">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch h-full">
          {/* Thumbnail bên trái */}
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full sm:w-44 md:w-48 aspect-video sm:aspect-auto rounded-md overflow-hidden bg-surface-soft shrink-0 block"
          >
            <Image
              src={item.youtube_thumbnail_url}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 100vw, 200px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/25 flex items-center justify-center group-hover:bg-black/35 transition-colors">
              <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-white shadow-md">
                <Play size={16} className="fill-current ml-0.5" />
              </div>
            </div>
          </a>

          {/* Cột nội dung bên phải */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              {/* Tag/Phân loại: góc trên bên trái, 14px */}
              <span className="text-[14px] text-text-muted uppercase font-medium tracking-wide mb-1.5 block">
                {categoryTag}
              </span>

              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <h3 className="text-[18px] sm:text-[20px] font-bold text-text-app group-hover:text-brand transition-colors line-clamp-2 leading-snug mb-2">
                  {item.title}
                </h3>
              </a>
              {item.excerpt && (
                <p className="text-[14px] text-text-app/75 line-clamp-2 leading-relaxed mb-3">
                  {item.excerpt}
                </p>
              )}
            </div>

            {/* Profile và ngày đăng ở dưới description: 14px */}
            <div className="flex items-center gap-2.5 pt-2 text-[14px] text-text-muted">
              <Avatar
                src={item.author_avatar_url}
                color="red"
                radius="xl"
                size={28}
                className="font-bold shrink-0 text-xs"
              >
                {authorInitials}
              </Avatar>
              <span className="font-semibold text-text-app truncate max-w-[140px] text-[14px] leading-none">{authorName}</span>
              <span className="leading-none">•</span>
              <span className="shrink-0 text-[14px] leading-none">{formatDate(item.published_at)}</span>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-surface-app border border-border-app rounded-lg p-4 sm:p-5 hover:border-brand/40 transition-all duration-200 h-full">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-stretch h-full">
        {/* Thumbnail bên trái */}
        {item.cover_image_url ? (
          <Link
            href={`/news/${item.slug}`}
            className="relative w-full sm:w-44 md:w-48 aspect-video sm:aspect-auto rounded-md overflow-hidden bg-surface-soft shrink-0 block"
          >
            <Image
              src={item.cover_image_url}
              alt={item.cover_image_alt || item.title}
              fill
              sizes="(max-width: 640px) 100vw, 200px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        ) : (
          <div className="hidden sm:flex w-44 md:w-48 aspect-video sm:aspect-auto rounded-md bg-surface-soft items-center justify-center text-text-muted shrink-0">
            <Newspaper size={28} />
          </div>
        )}

        {/* Cột nội dung bên phải */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            {/* Tag/Phân loại: góc trên bên trái, 14px */}
            <span className="text-[14px] text-text-muted uppercase font-medium tracking-wide mb-1.5 block">
              {categoryTag}
            </span>

            <Link href={`/news/${item.slug}`} className="block">
              <h3 className="text-[18px] sm:text-[20px] font-bold text-text-app group-hover:text-brand transition-colors line-clamp-2 leading-snug mb-2">
                {item.title}
              </h3>
            </Link>
            {item.excerpt && (
              <p className="text-[14px] text-text-app/75 line-clamp-2 leading-relaxed mb-3">
                {item.excerpt}
              </p>
            )}
          </div>

          {/* Profile và ngày đăng ở dưới description: 14px */}
          <div className="flex items-center gap-2.5 pt-2 text-[14px] text-text-muted">
            <Avatar
              src={item.author_avatar_url}
              color="blue"
              radius="xl"
              size={28}
              className="font-bold shrink-0 text-xs"
            >
              {authorInitials}
            </Avatar>
            <span className="font-semibold text-text-app truncate max-w-[140px] text-[14px] leading-none">{authorName}</span>
            <span className="leading-none">•</span>
            <span className="shrink-0 text-[14px] leading-none">{formatDate(item.published_at)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
