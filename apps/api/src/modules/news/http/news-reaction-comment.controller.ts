import type { Context } from 'hono';
import {
  getNewsReactionSummaryUseCase,
  toggleNewsReactionUseCase,
  getNewsCommentsUseCase,
  createNewsCommentUseCase,
  deleteNewsCommentUseCase,
  toggleNewsCommentReactionUseCase,
} from '../application/news-reaction-comment.usecases.js';
import { getSession, handleError } from '../../../shared/infrastructure/http-helpers.js';
import { AppError } from '../../../shared/domain/app-error.js';
import {
  ToggleNewsReactionInputSchema,
  CreateNewsCommentInputSchema,
} from '@repo/validation';

export async function getNewsReactionSummaryHandler(c: Context) {
  try {
    const idOrSlug = c.req.param('idOrSlug') || '';
    const session = await getSession(c);
    const userId = session?.user?.id ?? null;

    const result = await getNewsReactionSummaryUseCase(idOrSlug, userId);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function toggleNewsReactionHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session?.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để bày tỏ cảm xúc');
    }

    const idOrSlug = c.req.param('idOrSlug') || '';
    const rawBody = await c.req.json();
    const body = ToggleNewsReactionInputSchema.parse(rawBody);

    const result = await toggleNewsReactionUseCase(idOrSlug, session.user.id, body.type);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function getNewsCommentsHandler(c: Context) {
  try {
    const idOrSlug = c.req.param('idOrSlug') || '';
    const session = await getSession(c);
    const userId = session?.user?.id ?? null;
    const result = await getNewsCommentsUseCase(idOrSlug, userId);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function createNewsCommentHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session?.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để bình luận');
    }

    const idOrSlug = c.req.param('idOrSlug') || '';
    const rawBody = await c.req.json();
    const body = CreateNewsCommentInputSchema.parse(rawBody);

    const result = await createNewsCommentUseCase(
      idOrSlug,
      session.user.id,
      body.content,
      body.parent_id
    );
    return c.json(result, 201);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function deleteNewsCommentHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session?.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để thực hiện');
    }

    const commentId = c.req.param('commentId') || '';
    const result = await deleteNewsCommentUseCase(
      commentId,
      session.user.id,
      session.user.role
    );
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function toggleNewsCommentReactionHandler(c: Context) {
  try {
    const session = await getSession(c);
    if (!session?.user) {
      throw new AppError(401, 'UNAUTHORIZED', 'Vui lòng đăng nhập để bày tỏ cảm xúc');
    }

    const commentId = c.req.param('commentId') || '';
    const rawBody = await c.req.json();
    const body = ToggleNewsReactionInputSchema.parse(rawBody);

    const result = await toggleNewsCommentReactionUseCase(commentId, session.user.id, body.type);
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}
