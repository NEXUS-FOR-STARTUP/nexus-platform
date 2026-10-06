'use client';

import { useState } from 'react';

export function useArticleShare({ title }: { title: string }) {
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

  return {
    copied,
    handleShare,
  };
}
