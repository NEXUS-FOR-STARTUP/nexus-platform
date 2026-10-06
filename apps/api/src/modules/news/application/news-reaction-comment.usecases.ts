import { newsRepository } from '../infrastructure/persistence/prisma-news.repository.js';
import { AppError } from '../../../shared/domain/app-error.js';
import type {
  NewsReactionType,
  NewsReactionSummary,
  NewsCommentListResponse,
  NewsCommentItem,
  NewsCommentReactionSummary,
} from '@repo/validation';

export async function getNewsReactionSummaryUseCase(
  idOrSlug: string,
  userId?: string | null
): Promise<NewsReactionSummary> {
  const newsId = await newsRepository.resolveNewsId(idOrSlug);
  if (!newsId) {
    throw new AppError(404, 'NOT_FOUND', 'Bài viết không tồn tại');
  }

  return newsRepository.getReactionSummary(newsId, userId);
}

export async function toggleNewsReactionUseCase(
  idOrSlug: string,
  userId: string,
  type: NewsReactionType
): Promise<NewsReactionSummary> {
  const newsId = await newsRepository.resolveNewsId(idOrSlug);
  if (!newsId) {
    throw new AppError(404, 'NOT_FOUND', 'Bài viết không tồn tại');
  }

  return newsRepository.toggleReaction(newsId, userId, type);
}

export async function getNewsCommentsUseCase(
  idOrSlug: string,
  userId?: string | null
): Promise<NewsCommentListResponse> {
  const newsId = await newsRepository.resolveNewsId(idOrSlug);
  if (!newsId) {
    throw new AppError(404, 'NOT_FOUND', 'Bài viết không tồn tại');
  }

  return newsRepository.listCommentsByNewsId(newsId, userId);
}

export async function createNewsCommentUseCase(
  idOrSlug: string,
  userId: string,
  content: string,
  parentId?: string | null
): Promise<NewsCommentItem> {
  const newsId = await newsRepository.resolveNewsId(idOrSlug);
  if (!newsId) {
    throw new AppError(404, 'NOT_FOUND', 'Bài viết không tồn tại');
  }

  return newsRepository.createComment({
    newsId,
    userId,
    content,
    parentId,
  });
}

export async function deleteNewsCommentUseCase(
  commentId: string,
  actorId: string,
  actorRole?: string | null
): Promise<{ success: boolean }> {
  return newsRepository.deleteComment(commentId, actorId, actorRole);
}

export async function toggleNewsCommentReactionUseCase(
  commentId: string,
  userId: string,
  type: NewsReactionType
): Promise<NewsCommentReactionSummary> {
  return newsRepository.toggleCommentReaction(commentId, userId, type);
}
