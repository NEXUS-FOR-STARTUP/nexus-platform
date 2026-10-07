import type { Context } from 'hono';
import {
  getPublicNewsListUseCase,
  getPublicArticleDetailUseCase,
} from '../application/news-query.usecases.js';
import { handleError } from '../../../shared/infrastructure/http-helpers.js';
import { PublicNewsListQuerySchema } from '@repo/validation';

export async function getPublicNewsListHandler(c: Context) {
  try {
    const rawQuery = c.req.query();
    const query = PublicNewsListQuerySchema.parse(rawQuery);
    const result = await getPublicNewsListUseCase(query);

    c.header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function getPublicArticleDetailHandler(c: Context) {
  try {
    const slug = c.req.param('slug') || '';
    const result = await getPublicArticleDetailUseCase(slug);

    c.header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}
