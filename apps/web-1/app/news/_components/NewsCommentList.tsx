'use client';

import React from 'react';
import { Title, Text, Stack, Skeleton } from '@mantine/core';
import { Chat as MessageSquare } from "@phosphor-icons/react";
import { useNewsComments } from '../hooks/useNewsComments';
import { NewsCommentForm } from './NewsCommentForm';
import { NewsCommentItem } from './NewsCommentItem';

interface NewsCommentListProps {
  idOrSlug: string;
}

export function NewsCommentList({ idOrSlug }: NewsCommentListProps) {
  const { comments, total, isLoading, createComment, deleteComment, reactComment } = useNewsComments(idOrSlug);

  return (
    <div className="mt-10 pt-8">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare size={22} className="text-text-app" />
        <Title order={3} className="text-xl font-bold text-text-app">
          Bình luận {total > 0 ? `(${total})` : ''}
        </Title>
      </div>

      <div className="mb-8">
        <NewsCommentForm
          onSubmit={async (content, parentId) => {
            await createComment({ content, parent_id: parentId });
          }}
        />
      </div>

      {isLoading ? (
        <Stack gap="md">
          <Skeleton height={60} radius="md" />
          <Skeleton height={60} radius="md" />
          <Skeleton height={60} radius="md" />
        </Stack>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-text-subtle">
          <Text size="sm">Chưa có bình luận nào. Hãy là người đầu tiên để lại ý kiến!</Text>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <NewsCommentItem
              key={comment.id}
              comment={comment}
              onReply={async (content, parentId) => {
                await createComment({ content, parent_id: parentId });
              }}
              onDelete={async (commentId) => {
                await deleteComment(commentId);
              }}
              onReact={async (commentId, type) => {
                await reactComment({ commentId, type });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
