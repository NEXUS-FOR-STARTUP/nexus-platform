'use client';

import React from 'react';
import Link from 'next/link';
import { Button, Group, Text, Title, SimpleGrid } from '@mantine/core';
import { NewsCard } from './NewsCard';
import type { NewsListResult } from '@/lib/news-server';

interface NewsFeedProps {
  data: NewsListResult;
  currentType?: string;
}

export function NewsFeed({ data, currentType }: NewsFeedProps) {
  const { items, page, total_pages } = data;

  const filters = [
    { label: 'Tất cả', value: '' },
    { label: 'Bài viết', value: 'article' },
    { label: 'Video', value: 'video' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 sm:mb-12">
        <Title order={1} className="text-3xl sm:text-4xl font-extrabold text-text-app tracking-tight mb-3">
          Tin tức & Bài viết
        </Title>
        <Text size="lg" className="text-text-muted max-w-2xl leading-relaxed">
          Cập nhật tin tức hệ sinh thái khởi nghiệp, kiến thức và phân tích chuyên sâu từ đội ngũ Nexus.
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
                size="sm"
                radius="xl"
                variant={isActive ? 'filled' : 'light'}
                color={isActive ? 'brand' : 'gray'}
                className="font-medium"
              >
                {f.label}
              </Button>
            );
          })}
        </Group>
      </div>

      {/* Grid or Empty */}
      {items.length === 0 ? (
        <div className="text-center py-48 bg-surface-app rounded-2xl border border-border-app">
          <Text size="lg" fw={500} className="text-text-app mb-1">
            Chưa có nội dung nào
          </Text>
          <Text size="sm" c="dimmed">
            Nội dung mới sẽ sớm được cập nhật. Vui lòng quay lại sau!
          </Text>
        </div>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
          {items.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </SimpleGrid>
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
          <Text size="sm" className="text-text-muted px-2">
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
