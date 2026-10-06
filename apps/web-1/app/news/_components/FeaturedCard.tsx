'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Badge, Avatar } from '@mantine/core';
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

    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function FeaturedCard({ item }: { item: NewsItemPublicCard }) {
  const isVideo = item.type === 'video';
  const targetUrl = isVideo
    ? `https://www.youtube.com/watch?v=${item.youtube_video_id}`
    : `/news/${item.slug}`;
  const authorName = item.author_byline || (isVideo ? 'Nexus Video' : 'Nexus Team');
  const authorInitials = authorName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || (isVideo ? 'YT' : 'NX');

  return (
    <article className="group mb-10 bg-surface-app border border-border-app rounded-lg p-5 sm:p-7 hover:border-brand/50 transition-all duration-200">
      <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 items-center">
        {/* Featured Image */}
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

        {/* Featured Info */}
        <div className="flex-1 flex flex-col justify-between w-full">
          <div>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar
                  src={item.author_avatar_url}
                  color={isVideo ? 'red' : 'blue'}
                  radius="xl"
                  size="sm"
                  className="text-xs font-bold shrink-0"
                >
                  {authorInitials}
                </Avatar>
                <span className="text-sm font-semibold text-text-app truncate">
                  {authorName}
                </span>
                <span className="text-xs text-text-muted shrink-0">
                  {formatDate(item.published_at)}
                </span>
              </div>
              <Badge
                color={isVideo ? 'red' : 'blue'}
                variant="light"
                size="md"
                radius="xs"
                className="font-bold uppercase tracking-wider text-xs px-2.5 py-1"
              >
                {isVideo ? 'Video nổi bật' : 'Bài viết mới nhất'}
              </Badge>
            </div>

            <Link href={targetUrl} target={isVideo ? '_blank' : undefined} rel={isVideo ? 'noopener noreferrer' : undefined}>
              <h2 className="text-xl sm:text-2xl lg:text-[26px] font-bold text-text-app group-hover:text-brand transition-colors leading-snug tracking-tight mb-3">
                {item.title}
              </h2>
            </Link>

            {item.excerpt && (
              <p className="font-serif text-base text-text-app/85 line-clamp-3 leading-relaxed">
                {item.excerpt}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
