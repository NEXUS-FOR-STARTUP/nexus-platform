'use client';

import Link from 'next/link';
import { Button, Group, Text } from '@mantine/core';

interface NewsPaginationProps {
  page: number;
  totalPages: number;
  currentType?: string;
  currentCategory?: string;
  currentTag?: string;
  currentSearch?: string;
}

export function NewsPagination({
  page,
  totalPages,
  currentType,
  currentCategory,
  currentTag,
  currentSearch,
}: NewsPaginationProps) {
  if (totalPages <= 1) return null;

  const buildUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    params.set('page', String(targetPage));
    if (currentType) params.set('type', currentType);
    if (currentCategory) params.set('category', currentCategory);
    if (currentTag) params.set('tag', currentTag);
    if (currentSearch) params.set('search', currentSearch);
    return `/news?${params.toString()}`;
  };

  return (
    <Group justify="center" mt="xl" gap="sm">
      {page > 1 && (
        <Button
          component={Link}
          href={buildUrl(page - 1)}
          variant="default"
          size="sm"
          radius="md"
        >
          Trang trước
        </Button>
      )}
      <Text size="sm" className="text-text-muted px-2 font-serif">
        Trang {page} / {totalPages}
      </Text>
      {page < totalPages && (
        <Button
          component={Link}
          href={buildUrl(page + 1)}
          variant="default"
          size="sm"
          radius="md"
        >
          Trang sau
        </Button>
      )}
    </Group>
  );
}
