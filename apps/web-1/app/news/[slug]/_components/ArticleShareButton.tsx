'use client';

import { useState } from 'react';
import { ActionIcon, Tooltip } from '@mantine/core';
import { Share2, Check } from 'lucide-react';

export function ArticleShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (typeof window !== 'undefined') {
        if (navigator.share) {
          try {
            await navigator.share({
              title,
              url: window.location.href,
            });
            return;
          } catch {
            // fallback to clipboard if user dismissed native share
          }
        }
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // ignore clipboard error
    }
  };

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
