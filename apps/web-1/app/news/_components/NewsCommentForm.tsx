'use client';

import React, { useState } from 'react';
import { Textarea, Button, Group, Text, Paper, Avatar } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { MessageSquare, X } from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';

interface NewsCommentFormProps {
  onSubmit: (content: string, parentId?: string | null) => Promise<void>;
  parentId?: string | null;
  replyToName?: string | null;
  onCancelReply?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function NewsCommentForm({
  onSubmit,
  parentId = null,
  replyToName = null,
  onCancelReply,
  placeholder = 'Chia sẻ suy nghĩ của bạn về bài viết...',
  autoFocus = false,
}: NewsCommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState(replyToName ? `@${replyToName} ` : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (replyToName) {
      setContent(`@${replyToName} `);
    } else if (!parentId) {
      setContent('');
    }
  }, [replyToName, parentId]);

  React.useEffect(() => {
    if (autoFocus && textareaRef.current) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const len = textareaRef.current.value.length;
          textareaRef.current.setSelectionRange(len, len);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, replyToName]);

  if (!session?.user) {
    return (
      <Paper p="md" radius="md" withBorder className="bg-stone-50 text-center py-6">
        <MessageSquare className="mx-auto text-stone-400 mb-2" size={28} />
        <Text size="sm" fw={500} c="dimmed" mb="xs">
          Vui lòng đăng nhập để tham gia thảo luận và để lại bình luận.
        </Text>
        <Button
          component={Link}
          href="/auth"
          size="xs"
          radius="md"
          variant="light"
          color="blue"
        >
          Đăng nhập ngay
        </Button>
      </Paper>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    const prefix = replyToName ? `@${replyToName}` : '';
    if (!trimmed || trimmed === prefix) {
      notifications.show({
        title: 'Chưa nhập nội dung',
        message: 'Vui lòng nhập nội dung bình luận.',
        color: 'orange',
      });
      return;
    }

    if (trimmed.length > 1000) {
      notifications.show({
        title: 'Bình luận quá dài',
        message: 'Bình luận không được vượt quá 1000 ký tự.',
        color: 'red',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(trimmed, parentId);
      setContent('');
      if (onCancelReply) {
        onCancelReply();
      }
      notifications.show({
        title: 'Thành công',
        message: parentId ? 'Đã gửi phản hồi.' : 'Đã đăng bình luận.',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể gửi bình luận. Vui lòng thử lại sau.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {replyToName && (
        <Group justify="space-between" className="bg-blue-50/70 px-3 py-1.5 rounded-md text-xs text-blue-700">
          <span>
            Đang phản hồi <strong>@{replyToName}</strong>
          </span>
          {onCancelReply && (
            <button
              type="button"
              onClick={onCancelReply}
              className="text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
            >
              <X size={14} /> Hủy
            </button>
          )}
        </Group>
      )}

      <div className="flex gap-3">
        <Avatar
          src={session.user.image}
          alt={session.user.name || 'User'}
          radius="xl"
          size="md"
          color="blue"
        >
          {(session.user.name || 'U').charAt(0).toUpperCase()}
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.currentTarget.value)}
            placeholder={placeholder}
            minRows={parentId ? 2 : 3}
            maxRows={6}
            autosize
            autoFocus={autoFocus}
            maxLength={1000}
            disabled={isSubmitting}
            className="w-full"
          />
          <Group justify="space-between" align="center">
            <Text size="xs" c={content.length > 900 ? 'red' : 'dimmed'}>
              {content.length}/1000 ký tự
            </Text>
            <Group gap="xs">
              {onCancelReply && (
                <Button
                  size="sm"
                  variant="subtle"
                  color="gray"
                  onClick={onCancelReply}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                color="blue"
                px="xl"
                className="min-w-[88px] font-medium"
                loading={isSubmitting}
                disabled={!content.trim()}
              >
                Gửi
              </Button>
            </Group>
          </Group>
        </div>
      </div>
    </form>
  );
}
