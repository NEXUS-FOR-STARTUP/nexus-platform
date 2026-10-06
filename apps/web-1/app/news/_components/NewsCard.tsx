'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Avatar, Badge } from '@mantine/core';
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

    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function NewsCard({ item }: { item: NewsItemPublicCard }) {
  if (item.type === 'video') {
    const youtubeUrl = `https://www.youtube.com/watch?v=${item.youtube_video_id}`;
    return (
      <article className="group bg-surface-app border border-border-app rounded-xl p-4 sm:p-5 hover:border-brand/40 transition-all duration-200 flex flex-col justify-between">
        {/* Card Header: Author info on left, Badge on top right */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Avatar color="red" radius="xl" size="sm" className="text-xs font-bold">
              YT
            </Avatar>
            <span className="text-sm font-semibold text-text-app">Nexus Video</span>
            <span className="text-xs text-text-muted">{formatDate(item.published_at)}</span>
          </div>
          <Badge
            color="red"
            variant="light"
            size="md"
            radius="sm"
            className="font-bold uppercase tracking-wider text-xs px-2.5 py-1"
          >
            Video
          </Badge>
        </div>

        {/* Card Content & Thumbnail */}
        <div className="flex flex-col-reverse sm:flex-row gap-4 items-start flex-1 mb-3">
          <div className="flex-1 min-w-0">
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h3 className="text-base sm:text-lg font-bold text-text-app group-hover:text-brand transition-colors line-clamp-2 leading-snug mb-2">
                {item.title}
              </h3>
            </a>
            {item.excerpt && (
              <p className="font-serif text-sm text-text-app/85 line-clamp-2 leading-relaxed mb-3">
                {item.excerpt}
              </p>
            )}
          </div>

          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative w-full sm:w-44 md:w-48 aspect-video rounded-lg overflow-hidden bg-surface-soft shrink-0 block"
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
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-surface-app border border-border-app rounded-xl p-4 sm:p-5 hover:border-brand/40 transition-all duration-200 flex flex-col justify-between">
      {/* Card Header: Author info on left, Badge on top right */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Avatar color="blue" radius="xl" size="sm" className="text-xs font-bold">
            NX
          </Avatar>
          <span className="text-sm font-semibold text-text-app">Nexus Team</span>
          <span className="text-xs text-text-muted">{formatDate(item.published_at)}</span>
        </div>
        <Badge
          color="blue"
          variant="light"
          size="md"
          radius="sm"
          className="font-bold uppercase tracking-wider text-xs px-2.5 py-1"
        >
          Bài viết
        </Badge>
      </div>

      {/* Card Content & Thumbnail */}
      <div className="flex flex-col-reverse sm:flex-row gap-4 items-start flex-1 mb-3">
        <div className="flex-1 min-w-0">
          <Link href={`/news/${item.slug}`} className="block">
            <h3 className="text-base sm:text-lg font-bold text-text-app group-hover:text-brand transition-colors line-clamp-2 leading-snug mb-2">
              {item.title}
            </h3>
          </Link>
          {item.excerpt && (
            <p className="font-serif text-sm text-text-app/85 line-clamp-2 leading-relaxed mb-3">
              {item.excerpt}
            </p>
          )}
        </div>

        {item.cover_image_url ? (
          <Link
            href={`/news/${item.slug}`}
            className="relative w-full sm:w-44 md:w-48 aspect-video rounded-lg overflow-hidden bg-surface-soft shrink-0 block"
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
          <div className="hidden sm:flex w-44 md:w-48 aspect-video rounded-lg bg-surface-soft items-center justify-center text-text-muted shrink-0">
            <Newspaper size={28} />
          </div>
        )}
      </div>
    </article>
  );
}
