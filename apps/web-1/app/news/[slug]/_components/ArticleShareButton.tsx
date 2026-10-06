'use client';

import { ActionIcon, Tooltip } from '@mantine/core';
import { Share2, Check } from 'lucide-react';
import { useArticleShare } from '../../hooks';

export function ArticleShareButton({ title }: { title: string }) {
  const { copied, handleShare } = useArticleShare({ title });

  return (
    <Tooltip label={copied ? 'Đã sao chép liên kết!' : 'Chia sẻ'} withArrow position="top">
      <ActionIcon
        variant="subtle"
        color={copied ? 'teal' : 'gray'}
        size="lg"
        radius="xl"
        onClick={handleShare}
        aria-label="Chia sẻ bài viết"
        className="text-text-muted hover:text-text-app hover:!bg-surface-soft transition-colors"
      >
        {copied ? <Check size={20} className="text-teal-600" /> : <Share2 size={20} />}
      </ActionIcon>
    </Tooltip>
  );
}
