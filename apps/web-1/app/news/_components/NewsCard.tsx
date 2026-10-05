'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge, Card, Group, Text } from '@mantine/core';
import { ExternalLink, Play, Newspaper } from 'lucide-react';
import type { NewsItemPublicCard } from '@repo/validation';

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

export function NewsCard({ item }: { item: NewsItemPublicCard }) {
  if (item.type === 'video') {
    const youtubeUrl = `https://www.youtube.com/watch?v=${item.youtube_video_id}`;
    return (
      <Card
        component="a"
        href={youtubeUrl}
        target="_blank"
        rel="noopener noreferrer"
        radius="lg"
        padding="md"
        className="group flex flex-col h-full bg-surface-app border border-border-app hover:border-brand/40 transition-all duration-200"
      >
        <div className="relative aspect-video w-full rounded-md overflow-hidden bg-surface-soft mb-3.5">
          <Image
            src={item.youtube_thumbnail_url}
            alt={item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
            <div className="w-11 h-11 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-md">
              <Play size={20} className="fill-current ml-0.5" />
            </div>
          </div>
          <Badge
            color="red"
            variant="filled"
            size="sm"
            className="absolute top-2.5 left-2.5 font-medium"
          >
            Video
          </Badge>
        </div>

        <div className="flex flex-col flex-1">
          <Group justify="space-between" mb={6}>
            <Text size="xs" c="dimmed">
              {formatDate(item.published_at)}
            </Text>
            <span className="inline-flex items-center gap-1 text-xs text-brand font-medium">
              Mở YouTube
              <ExternalLink size={12} />
              <span className="sr-only">(mở trong tab mới)</span>
            </span>
          </Group>

          <Text
            fw={600}
            size="md"
            className="text-text-app line-clamp-2 group-hover:text-brand transition-colors mb-1.5"
          >
            {item.title}
          </Text>

          {item.excerpt && (
            <Text size="sm" c="dimmed" className="line-clamp-2 mt-auto">
              {item.excerpt}
            </Text>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      component={Link}
      href={`/news/${item.slug}`}
      radius="lg"
      padding="md"
      className="group flex flex-col h-full bg-surface-app border border-border-app hover:border-brand/40 transition-all duration-200"
    >
      <div className="relative aspect-video w-full rounded-md overflow-hidden bg-surface-soft mb-3.5">
        {item.cover_image_url ? (
          <Image
            src={item.cover_image_url}
            alt={item.cover_image_alt || item.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <Newspaper size={32} />
          </div>
        )}
        <Badge
          color="blue"
          variant="filled"
          size="sm"
          className="absolute top-2.5 left-2.5 font-medium"
        >
          Bài viết
        </Badge>
      </div>

      <div className="flex flex-col flex-1">
        <Text size="xs" c="dimmed" mb={6}>
          {formatDate(item.published_at)}
        </Text>

        <Text
          fw={600}
          size="md"
          className="text-text-app line-clamp-2 group-hover:text-brand transition-colors mb-1.5"
        >
          {item.title}
        </Text>

        {item.excerpt && (
          <Text size="sm" c="dimmed" className="line-clamp-2 mt-auto">
            {item.excerpt}
          </Text>
        )}
      </div>
    </Card>
  );
}
