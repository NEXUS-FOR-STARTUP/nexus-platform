import { Hono } from 'hono';
import {
  getPublicNewsListHandler,
  getPublicArticleDetailHandler,
} from './news-public.controller.js';
import {
  getNewsReactionSummaryHandler,
  toggleNewsReactionHandler,
  getNewsCommentsHandler,
  createNewsCommentHandler,
  deleteNewsCommentHandler,
  toggleNewsCommentReactionHandler,
} from './news-reaction-comment.controller.js';

export const newsPublicRouter = new Hono();

// Reactions
newsPublicRouter.get('/:idOrSlug/reactions', getNewsReactionSummaryHandler);
newsPublicRouter.post('/:idOrSlug/reactions', toggleNewsReactionHandler);

// Comments
newsPublicRouter.get('/:idOrSlug/comments', getNewsCommentsHandler);
newsPublicRouter.post('/:idOrSlug/comments', createNewsCommentHandler);
newsPublicRouter.delete('/comments/:commentId', deleteNewsCommentHandler);
newsPublicRouter.post('/comments/:commentId/reaction', toggleNewsCommentReactionHandler);

// Public news list & article details
newsPublicRouter.get('/', getPublicNewsListHandler);
newsPublicRouter.get('/:slug', getPublicArticleDetailHandler);

