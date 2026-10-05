import { Hono } from 'hono';
import {
  getPublicNewsListHandler,
  getPublicArticleDetailHandler,
} from './news-public.controller.js';

export const newsPublicRouter = new Hono();

newsPublicRouter.get('/', getPublicNewsListHandler);
newsPublicRouter.get('/:slug', getPublicArticleDetailHandler);
