import { Hono } from 'hono';
import {
  requireAdmin,
  verifyMutationOrigin,
} from '../../../shared/infrastructure/middlewares/auth.js';
import {
  listAdminNewsHandler,
  getAdminNewsDetailHandler,
  createNewsItemHandler,
  updateNewsItemHandler,
  publishNewsItemHandler,
  unpublishNewsItemHandler,
  deleteNewsItemHandler,
  uploadCoverHandler,
} from './news-admin.controller.js';

export const newsAdminRouter = new Hono();

newsAdminRouter.use('*', requireAdmin);
newsAdminRouter.use('*', verifyMutationOrigin);

newsAdminRouter.get('/', listAdminNewsHandler);
newsAdminRouter.get('/:id', getAdminNewsDetailHandler);
newsAdminRouter.post('/', createNewsItemHandler);
newsAdminRouter.put('/:id', updateNewsItemHandler);
newsAdminRouter.post('/:id/cover', uploadCoverHandler);
newsAdminRouter.post('/:id/publish', publishNewsItemHandler);
newsAdminRouter.post('/:id/unpublish', unpublishNewsItemHandler);
newsAdminRouter.delete('/:id', deleteNewsItemHandler);
