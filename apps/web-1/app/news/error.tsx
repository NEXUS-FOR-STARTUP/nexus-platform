'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button, Group, Text, Title } from '@mantine/core';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function NewsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('News error boundary:', error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={28} />
      </div>

      <Title order={2} className="text-2xl font-bold text-text-app mb-2">
        Đã xảy ra lỗi tải tin tức
      </Title>

      <Text size="sm" c="dimmed" className="mb-6">
        Hệ thống không thể tải dữ liệu lúc này. Vui lòng thử lại hoặc quay về trang chủ.
      </Text>

      <Group justify="center" gap="sm">
        <Button
          onClick={() => reset()}
          variant="filled"
          color="brand"
          radius="md"
          leftSection={<RotateCcw size={16} />}
        >
          Thử lại
        </Button>
        <Button
          component={Link}
          href="/"
          variant="default"
          radius="md"
        >
          Về trang chủ
        </Button>
      </Group>
    </div>
  );
}
