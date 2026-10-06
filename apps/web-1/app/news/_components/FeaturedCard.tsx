'use client';

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
            {/* Tag/Phân loại: góc trên bên trái, viết hoa, không màu, không badge, font-serif nhỏ ngang description */}
            <span className="font-serif text-xs sm:text-sm text-text-muted uppercase font-normal tracking-normal mb-2 block">
              {categoryTag}
            </span>

            <Link href={targetUrl} target={isVideo ? '_blank' : undefined} rel={isVideo ? 'noopener noreferrer' : undefined}>
              <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-text-app group-hover:text-brand transition-colors leading-snug tracking-tight mb-3">
                {item.title}
              </h2>
            </Link>

            {item.excerpt && (
              <p className="font-serif text-base text-text-app/80 line-clamp-3 leading-relaxed mb-4">
                {item.excerpt}
              </p>
            )}
          </div>

          {/* Profile và ngày đăng ở dưới description */}
          <div className="flex items-center gap-2 pt-2 text-xs sm:text-sm text-text-muted">
            <Avatar
              src={item.author_avatar_url}
              color={isVideo ? 'red' : 'blue'}
              radius="xl"
              size="xs"
              className="font-bold shrink-0"
            >
              {authorInitials}
            </Avatar>
            <span className="font-semibold text-text-app truncate">
              {authorName}
            </span>
            <span>•</span>
            <span className="shrink-0">
              {formatDate(item.published_at)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
