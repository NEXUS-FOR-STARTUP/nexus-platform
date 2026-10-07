import type { Context } from 'hono';
import {
  getAdminNewsListUseCase,
  getAdminNewsDetailUseCase,
} from '../application/news-query.usecases.js';
import {
  createNewsItemUseCase,
  updateNewsItemUseCase,
  publishNewsItemUseCase,
  unpublishNewsItemUseCase,
  deleteNewsItemUseCase,
  uploadArticleCoverUseCase,
} from '../application/news-command.usecases.js';
import { handleError } from '../../../shared/infrastructure/http-helpers.js';
import {
  AdminNewsListQuerySchema,
  CreateNewsItemInputSchema,
  UpdateNewsItemInputSchema,
} from '@repo/validation';
import { AppError } from '../../../shared/domain/app-error.js';

export async function listAdminNewsHandler(c: Context) {
  try {
    const rawQuery = c.req.query();
    const query = AdminNewsListQuerySchema.parse(rawQuery);
    const result = await getAdminNewsListUseCase(query);

    c.header('Cache-Control', 'private, no-store');
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function getAdminNewsDetailHandler(c: Context) {
  try {
    const id = c.req.param('id') || '';
    const result = await getAdminNewsDetailUseCase(id);

    c.header('Cache-Control', 'private, no-store');
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function createNewsItemHandler(c: Context) {
  try {
    const user = c.get('user');
    const body = await c.req.json();
    const input = CreateNewsItemInputSchema.parse(body);
    const result = await createNewsItemUseCase(user.id, input);

    c.header('Cache-Control', 'private, no-store');
    return c.json(result, 201);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function updateNewsItemHandler(c: Context) {
  try {
    const user = c.get('user');
    const id = c.req.param('id') || '';
    const body = await c.req.json();
    const input = UpdateNewsItemInputSchema.parse(body);
    const result = await updateNewsItemUseCase(user.id, id, input);

    c.header('Cache-Control', 'private, no-store');
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function publishNewsItemHandler(c: Context) {
  try {
    const user = c.get('user');
    const id = c.req.param('id') || '';
    const body = await c.req.json();
    const expectedUpdatedAt = typeof body?.expected_updated_at === 'string' ? body.expected_updated_at : '';
    const result = await publishNewsItemUseCase(user.id, id, expectedUpdatedAt);

    c.header('Cache-Control', 'private, no-store');
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function unpublishNewsItemHandler(c: Context) {
  try {
    const user = c.get('user');
    const id = c.req.param('id') || '';
    const body = await c.req.json();
    const expectedUpdatedAt = typeof body?.expected_updated_at === 'string' ? body.expected_updated_at : '';
    const result = await unpublishNewsItemUseCase(user.id, id, expectedUpdatedAt);

    c.header('Cache-Control', 'private, no-store');
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function deleteNewsItemHandler(c: Context) {
  try {
    const id = c.req.param('id') || '';
    let expectedUpdatedAt = c.req.query('expected_updated_at') || '';
    if (!expectedUpdatedAt) {
      try {
        const body = await c.req.json();
        expectedUpdatedAt = typeof body?.expected_updated_at === 'string' ? body.expected_updated_at : '';
      } catch {
        // Body may be empty in DELETE request
      }
    }
    const result = await deleteNewsItemUseCase(id, expectedUpdatedAt);

    c.header('Cache-Control', 'private, no-store');
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}

export async function uploadCoverHandler(c: Context) {
  try {
    const user = c.get('user');
    const id = c.req.param('id') || '';
    const body = await c.req.parseBody();
    const file = body['cover'];
    const expectedUpdatedAt = typeof body['expected_updated_at'] === 'string' ? body['expected_updated_at'] : '';

    if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
      throw new AppError(400, 'FILE_REQUIRED', 'Tệp ảnh bìa (cover) là bắt buộc');
    }

    const fileObj = file as File;
    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = fileObj.type || 'image/jpeg';

    const result = await uploadArticleCoverUseCase(user.id, id, buffer, mimeType, expectedUpdatedAt);

    c.header('Cache-Control', 'private, no-store');
    return c.json(result);
  } catch (error: unknown) {
    return handleError(c, error);
  }
}
