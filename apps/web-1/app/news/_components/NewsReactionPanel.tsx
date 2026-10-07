'use client';

import React from 'react';
import { Group, Button, Text, Tooltip } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import { useNewsReactions } from '../hooks/useNewsReactions';

interface NewsReactionPanelProps {
  idOrSlug: string;
}

export function NewsReactionPanel({ idOrSlug }: NewsReactionPanelProps) {
  const { data: session } = useSession();
  const { summary, isPending, toggleReaction } = useNewsReactions(idOrSlug);

  const handleReaction = (type: 'LIKE' | 'DISLIKE') => {
    if (!session?.user) {
      notifications.show({
        title: 'Yêu cầu đăng nhập',
        message: 'Vui lòng đăng nhập để bày tỏ cảm xúc với bài viết.',
        color: 'orange',
      });
      return;
    }

    toggleReaction(type);
  };

  const isLiked = summary.user_reaction === 'LIKE';
  const isDisliked = summary.user_reaction === 'DISLIKE';

  return (
    <Group gap="sm" align="center" className="my-6 py-4 border-y border-stone-200">
      <Text size="sm" fw={500} c="dimmed">
        Bạn thấy bài viết này thế nào?
      </Text>

      <Tooltip
        label={!session?.user ? 'Đăng nhập để thích bài viết' : isLiked ? 'Bạn đã thích bài viết' : 'Thích bài viết'}
        withArrow
      >
        <Button
          size="sm"
          radius="xl"
          variant="default"
          leftSection={
            <ThumbsUp
              size={16}
              className={`text-emerald-500 stroke-[2] transition-colors ${
                isLiked ? 'fill-emerald-500' : 'fill-transparent'
              }`}
            />
          }
          onClick={() => handleReaction('LIKE')}
          disabled={isPending}
        >
          <span className={isLiked ? 'font-semibold text-stone-900' : 'text-stone-700'}>
            {summary.likes > 0 ? summary.likes : 'Thích'}
          </span>
        </Button>
      </Tooltip>

      <Tooltip
        label={!session?.user ? 'Đăng nhập để không thích' : isDisliked ? 'Bạn không thích bài viết' : 'Không thích'}
        withArrow
      >
        <Button
          size="sm"
          radius="xl"
          variant="default"
          leftSection={
            <ThumbsDown
              size={16}
              className={`text-rose-500 stroke-[2] transition-colors ${
                isDisliked ? 'fill-rose-500' : 'fill-transparent'
              }`}
            />
          }
          onClick={() => handleReaction('DISLIKE')}
          disabled={isPending}
        >
          <span className={isDisliked ? 'font-semibold text-stone-900' : 'text-stone-700'}>
            {summary.dislikes > 0 ? summary.dislikes : 'Không thích'}
          </span>
        </Button>
      </Tooltip>
    </Group>
  );
}
