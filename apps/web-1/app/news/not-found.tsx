import Link from 'next/link';
import { Button, Text, Title } from '@mantine/core';
import { FileQuestion } from 'lucide-react';

export default function NewsNotFound() {
  return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-soft text-text-muted flex items-center justify-center mx-auto mb-4 border border-border-app">
        <FileQuestion size={32} />
      </div>

      <Title order={2} className="text-3xl font-extrabold text-text-app mb-3 tracking-tight">
        Không tìm thấy bài viết
      </Title>

      <Text size="md" c="dimmed" className="mb-8 max-w-md mx-auto leading-relaxed">
        Bài viết bạn tìm kiếm có thể đã bị gỡ, đổi đường dẫn hoặc chưa được xuất bản.
      </Text>

      <Link href="/news">
        <Button
          variant="filled"
          color="brand"
          radius="md"
          size="md"
        >
          Xem tất cả tin tức
        </Button>
      </Link>
    </div>
  );
}
