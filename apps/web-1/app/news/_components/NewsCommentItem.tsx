'use client';

import React, { useState } from 'react';
import { Avatar, Text, Group, Button, Badge, Modal, Menu, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { MoreVertical, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import type { NewsCommentItem as CommentType, NewsCommentReplyItem, NewsReactionType } from '@repo/validation';
import { NewsCommentForm } from './NewsCommentForm';

interface NewsCommentItemProps {
  comment: CommentType | NewsCommentReplyItem;
  isReply?: boolean;
  candidateNames?: string[];
  onReply?: (content: string, parentId?: string | null) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReact?: (commentId: string, type: NewsReactionType) => Promise<void>;
  onReplyToUser?: (userName: string) => void;
}

function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 30) return `${diffDay} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  } catch {
    return '';
  }
}

export function NewsCommentItem({
  comment,
  isReply = false,
  candidateNames = [],
  onReply,
  onDelete,
  onReact,
  onReplyToUser,
}: NewsCommentItemProps) {
  const { data: session } = useSession();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyTargetUser, setReplyTargetUser] = useState<string>(comment.user.name);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReacting, setIsReacting] = useState(false);

  const isAuthor = session?.user?.id === comment.user_id;
  const isModerator = session?.user?.role === 'admin' || session?.user?.role === 'writer';
  const canDelete = !comment.deleted_at && (isAuthor || isModerator);

  const isLiked = comment.user_reaction === 'LIKE';
  const isDisliked = comment.user_reaction === 'DISLIKE';

  const handleReaction = async (type: NewsReactionType) => {
    if (!session?.user) {
      notifications.show({
        title: 'Yêu cầu đăng nhập',
        message: 'Vui lòng đăng nhập để bày tỏ cảm xúc với bình luận.',
        color: 'orange',
      });
      return;
    }
    if (!onReact) return;
    try {
      setIsReacting(true);
      await onReact(comment.id, type);
    } catch {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể gửi cảm xúc. Vui lòng thử lại.',
        color: 'red',
      });
    } finally {
      setIsReacting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(comment.id);
      setShowDeleteModal(false);
      notifications.show({
        title: 'Thành công',
        message: 'Đã xóa bình luận.',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Lỗi',
        message: 'Không thể xóa bình luận. Vui lòng thử lại.',
        color: 'red',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isDeleted = !!comment.deleted_at;
  const replies = 'replies' in comment ? comment.replies : [];

  const threadNames = React.useMemo(() => {
    const list = [comment.user.name, ...replies.map((r) => r.user.name), ...candidateNames];
    return Array.from(new Set(list));
  }, [comment.user.name, replies, candidateNames]);

  const handleReplyToChild = (userName: string) => {
    setReplyTargetUser(userName);
    setShowReplyForm(true);
  };

  const renderFormattedContent = () => {
    if (isDeleted) {
      return (
        <Text fs="italic" c="dimmed" size="sm">
          Bình luận này đã bị xóa.
        </Text>
      );
    }

    const sortedNames = [...threadNames].sort((a, b) => b.length - a.length);
    for (const name of sortedNames) {
      if (comment.content.startsWith(`@${name}`)) {
        const mention = `@${name}`;
        const rest = comment.content.slice(mention.length);
        return (
          <span>
            <span className="text-blue-600 font-medium hover:underline cursor-pointer mr-1">
              {mention}
            </span>
            <span>{rest}</span>
          </span>
        );
      }
    }

    const genericMatch = comment.content.match(/^(@\S+)\s*([\s\S]*)$/);
    if (genericMatch && comment.content.startsWith('@')) {
      return (
        <span>
          <span className="text-blue-600 font-medium hover:underline cursor-pointer mr-1">
            {genericMatch[1]}
          </span>
          <span>{genericMatch[2]}</span>
        </span>
      );
    }

    return comment.content;
  };

  return (
    <div className={`space-y-3 ${isReply ? 'mt-3 pl-3 sm:pl-4 border-l-2 border-stone-200' : 'pb-4 border-b border-stone-100'}`}>
      <div className="flex items-start gap-3">
        <Avatar
          src={comment.user.avatar_url}
          alt={comment.user.name}
          radius="xl"
          size={isReply ? 'sm' : 'md'}
          color="blue"
        >
          {comment.user.name.charAt(0).toUpperCase()}
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Text size="sm" fw={600} className="text-stone-900 truncate">
                {comment.user.name}
              </Text>

              {comment.user.role === 'admin' && (
                <Badge size="xs" color="blue" variant="filled">
                  Quản trị viên
                </Badge>
              )}
              {comment.user.role === 'writer' && (
                <Badge size="xs" color="teal" variant="light">
                  Biên tập viên
                </Badge>
              )}

              <Text size="xs" c="dimmed">
                • {formatRelativeTime(comment.created_at)}
              </Text>
            </div>

            {canDelete && (
              <Menu position="bottom-end" shadow="md" withinPortal>
                <Menu.Target>
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="xs"
                    className="text-stone-400 hover:text-stone-700"
                    aria-label="Tùy chọn bình luận"
                  >
                    <MoreVertical size={14} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    color="red"
                    leftSection={<Trash2 size={14} />}
                    onClick={() => setShowDeleteModal(true)}
                  >
                    Xóa bình luận
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </div>

          <div className="text-sm text-stone-700 whitespace-pre-wrap break-words">
            {renderFormattedContent()}
          </div>

          {!isDeleted && (
            <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 flex-wrap">
              {/* Thích bình luận */}
              <button
                type="button"
                onClick={() => handleReaction('LIKE')}
                disabled={isReacting}
                className={`inline-flex items-center gap-1.5 text-xs py-1 px-2 rounded-full transition-colors hover:bg-stone-100 ${
                  isLiked
                    ? 'text-emerald-600 font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Thích bình luận"
              >
                <ThumbsUp
                  size={13}
                  className={`stroke-[1.75] transition-colors ${
                    isLiked ? 'fill-emerald-600 text-emerald-600' : 'fill-transparent'
                  }`}
                />
                {comment.likes > 0 && <span>{comment.likes}</span>}
              </button>

              {/* Không thích bình luận */}
              <button
                type="button"
                onClick={() => handleReaction('DISLIKE')}
                disabled={isReacting}
                className={`inline-flex items-center gap-1.5 text-xs py-1 px-2 rounded-full transition-colors hover:bg-stone-100 ${
                  isDisliked
                    ? 'text-rose-600 font-semibold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Không thích bình luận"
              >
                <ThumbsDown
                  size={13}
                  className={`stroke-[1.75] transition-colors ${
                    isDisliked ? 'fill-rose-600 text-rose-600' : 'fill-transparent'
                  }`}
                />
                {comment.dislikes > 0 && <span>{comment.dislikes}</span>}
              </button>

              {/* Nút Trả lời cho comment chính */}
              {!isReply && onReply && (
                <button
                  type="button"
                  onClick={() => {
                    setReplyTargetUser(comment.user.name);
                    setShowReplyForm(!showReplyForm);
                  }}
                  className="inline-flex items-center text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full px-2.5 py-1 transition-colors"
                >
                  <span>Trả lời</span>
                </button>
              )}

              {/* Nút Trả lời cho comment con (replies) */}
              {isReply && onReplyToUser && (
                <button
                  type="button"
                  onClick={() => onReplyToUser(comment.user.name)}
                  className="inline-flex items-center text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-full px-2.5 py-1 transition-colors"
                >
                  <span>Trả lời</span>
                </button>
              )}
            </div>
          )}

          {showReplyForm && onReply && (
            <div className="mt-3 pt-2">
              <NewsCommentForm
                parentId={comment.id}
                replyToName={replyTargetUser}
                onCancelReply={() => setShowReplyForm(false)}
                onSubmit={async (content, parentId) => {
                  await onReply(content, parentId);
                  setShowReplyForm(false);
                }}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="space-y-3">
          {replies.map((reply) => (
            <NewsCommentItem
              key={reply.id}
              comment={reply}
              isReply={true}
              candidateNames={threadNames}
              onDelete={onDelete}
              onReact={onReact}
              onReplyToUser={handleReplyToChild}
            />
          ))}
        </div>
      )}

      <Modal
        opened={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa bình luận"
        centered
        size="sm"
      >
        <Text size="sm" mb="md">
          Bạn có chắc chắn muốn xóa bình luận này không? Nội dung bình luận sẽ bị ẩn.
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button
            variant="default"
            size="xs"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button
            color="red"
            size="xs"
            onClick={handleDelete}
            loading={isDeleting}
          >
            Xác nhận xóa
          </Button>
        </Group>
      </Modal>
    </div>
  );
}
