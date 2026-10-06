'use client';

import { Title, Text } from '@mantine/core';
import { WriterNewsManager } from './_components/WriterNewsManager';

export default function WriterPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      <div>
        <Title order={2} className="font-heading font-bold text-text-app">
          Không gian Người viết bài
        </Title>
        <Text size="sm" c="dimmed" mt={4}>
          Soạn thảo, quản lý và xuất bản các bài viết, video chia sẻ kiến thức trên Nexus Platform
        </Text>
      </div>

      <WriterNewsManager />
    </div>
  );
}
