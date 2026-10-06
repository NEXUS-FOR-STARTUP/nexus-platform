import { newsRepository } from '../infrastructure/persistence/prisma-news.repository.js';
import { newsCoverGateway } from '../infrastructure/cloudinary/news-cover.gateway.js';
import { validatePublishInvariants } from '../domain/news-rules.js';
import { AppError } from '../../../shared/domain/app-error.js';
import {
  generateNewsSlug,
  extractYouTubeVideoId,
  type CreateNewsItemInput,
  type UpdateNewsItemInput,
} from '@repo/validation';
import { Prisma } from '@prisma/client';

export async function createNewsItemUseCase(actorId: string, input: CreateNewsItemInput) {
  if (input.type === 'article') {
    const slug = input.slug?.trim() ? input.slug.trim() : generateNewsSlug(input.title);
    if (slug) {
      const hasConflict = await newsRepository.findSlugConflict(slug);
      if (hasConflict) {
        throw new AppError(409, 'SLUG_CONFLICT', `Đường dẫn "${slug}" đã tồn tại`);
      }
    }

    const data: Prisma.NewsItemCreateInput = {
      type: 'article',
      status: 'draft',
      title: input.title,
      slug: slug || null,
      excerpt: input.excerpt || '',
      category: input.category || 'khoi-nghiep',
      tags: input.tags || [],
      content_json: input.content_json ? (input.content_json as Prisma.InputJsonValue) : Prisma.JsonNull,
      cover_image_url: input.cover_image_url || null,
      cover_image_public_id: input.cover_image_public_id || null,
      cover_image_alt: input.cover_image_alt || null,
      created_by_auth_user_id: actorId,
      updated_by_auth_user_id: actorId,
    };

    return newsRepository.createNewsItem(data);
  }

  const youtubeVideoId = extractYouTubeVideoId(input.youtube_url_or_id);
  if (!youtubeVideoId) {
    throw new AppError(400, 'INVALID_YOUTUBE_URL', 'URL hoặc ID YouTube không hợp lệ');
  }

  const data: Prisma.NewsItemCreateInput = {
    type: 'video',
    status: 'draft',
    title: input.title,
    excerpt: input.excerpt || '',
    category: input.category || 'khoi-nghiep',
    tags: input.tags || [],
    youtube_video_id: youtubeVideoId,
    created_by_auth_user_id: actorId,
    updated_by_auth_user_id: actorId,
  };

  return newsRepository.createNewsItem(data);
}

export async function updateNewsItemUseCase(actorId: string, id: string, input: UpdateNewsItemInput) {
  const current = await newsRepository.findAdminNewsById(id);
  if (!current) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy mục tin tức');

  const expectedDate = new Date(input.expected_updated_at);
  if (isNaN(expectedDate.getTime())) throw new AppError(400, 'INVALID_DATE', 'expected_updated_at không hợp lệ');

  const isPublished = current.status === 'published';
  let targetSlug = current.slug;

  if (input.slug !== undefined && current.type === 'article') {
    if (isPublished && input.slug !== current.slug) {
      throw new AppError(400, 'SLUG_IMMUTABLE', 'Không thể thay đổi đường dẫn tĩnh của bài viết đã xuất bản');
    }
    targetSlug = input.slug.trim() || null;
    if (targetSlug && targetSlug !== current.slug) {
      const conflict = await newsRepository.findSlugConflict(targetSlug, id);
      if (conflict) throw new AppError(409, 'SLUG_CONFLICT', `Đường dẫn "${targetSlug}" đã tồn tại`);
    }
  }

  let youtubeVideoId = current.youtube_video_id;
  if (input.youtube_url_or_id !== undefined && current.type === 'video') {
    const extracted = extractYouTubeVideoId(input.youtube_url_or_id);
    if (!extracted) throw new AppError(400, 'INVALID_YOUTUBE_URL', 'URL hoặc ID YouTube không hợp lệ');
    youtubeVideoId = extracted;
  }

  const mergedItem = {
    type: current.type,
    title: input.title ?? current.title,
    slug: targetSlug,
    excerpt: input.excerpt ?? current.excerpt,
    category: input.category !== undefined ? input.category : current.category,
    tags: input.tags !== undefined ? input.tags : current.tags,
    content_json: input.content_json !== undefined ? input.content_json : current.content_json,
    youtube_video_id: youtubeVideoId,
    cover_image_url: input.cover_image_url !== undefined ? input.cover_image_url : current.cover_image_url,
    cover_image_alt: input.cover_image_alt !== undefined ? input.cover_image_alt : current.cover_image_alt,
  };

  if (isPublished) {
    const check = validatePublishInvariants(mergedItem);
    if (!check.ok) throw new AppError(400, 'INVALID_PUBLISHED_ITEM', check.error);
  }

  const updateData: Prisma.NewsItemUpdateInput = {
    title: mergedItem.title,
    slug: mergedItem.slug,
    excerpt: mergedItem.excerpt,
    category: mergedItem.category,
    tags: mergedItem.tags,
    content_json: mergedItem.content_json !== undefined ? (mergedItem.content_json as Prisma.InputJsonValue) : undefined,
    youtube_video_id: mergedItem.youtube_video_id,
    cover_image_url: mergedItem.cover_image_url,
    cover_image_public_id: input.cover_image_public_id !== undefined ? input.cover_image_public_id : current.cover_image_public_id,
    cover_image_alt: mergedItem.cover_image_alt,
    updated_by_auth_user_id: actorId,
  };

  const updated = await newsRepository.updateNewsItemConditional(id, expectedDate, updateData, actorId);
  if (!updated) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Mục tin tức đã được sửa bởi người khác');
  return updated;
}

export async function publishNewsItemUseCase(actorId: string, id: string, expectedUpdatedAt: string) {
  const current = await newsRepository.findAdminNewsById(id);
  if (!current) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy mục tin tức');

  const expectedDate = new Date(expectedUpdatedAt);
  if (isNaN(expectedDate.getTime())) throw new AppError(400, 'INVALID_DATE', 'expected_updated_at không hợp lệ');

  const check = validatePublishInvariants(current);
  if (!check.ok) throw new AppError(400, 'PUBLISH_VALIDATION_FAILED', check.error);

  const updateData: Prisma.NewsItemUpdateInput = {
    status: 'published',
    published_at: current.published_at ?? new Date(),
    updated_by_auth_user_id: actorId,
  };

  const updated = await newsRepository.updateNewsItemConditional(id, expectedDate, updateData);
  if (!updated) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Mục tin tức đã được sửa bởi người khác');
  return updated;
}

export async function unpublishNewsItemUseCase(actorId: string, id: string, expectedUpdatedAt: string) {
  const current = await newsRepository.findAdminNewsById(id);
  if (!current) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy mục tin tức');

  const expectedDate = new Date(expectedUpdatedAt);
  if (isNaN(expectedDate.getTime())) throw new AppError(400, 'INVALID_DATE', 'expected_updated_at không hợp lệ');

  const updateData: Prisma.NewsItemUpdateInput = {
    status: 'draft',
    updated_by_auth_user_id: actorId,
  };

  const updated = await newsRepository.updateNewsItemConditional(id, expectedDate, updateData);
  if (!updated) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Mục tin tức đã được sửa bởi người khác');
  return updated;
}

export async function deleteNewsItemUseCase(id: string, expectedUpdatedAt: string) {
  const current = await newsRepository.findAdminNewsById(id);
  if (!current) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy mục tin tức');

  if (current.status === 'published') {
    throw new AppError(409, 'CANNOT_DELETE_PUBLISHED', 'Không thể xóa mục tin tức đã xuất bản. Vui lòng hủy xuất bản trước.');
  }

  const expectedDate = new Date(expectedUpdatedAt);
  if (isNaN(expectedDate.getTime())) throw new AppError(400, 'INVALID_DATE', 'expected_updated_at không hợp lệ');

  const deleted = await newsRepository.deleteNewsItemConditional(id, expectedDate);
  if (!deleted) throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Mục tin tức đã được sửa bởi người khác');

  if (current.cover_image_public_id) {
    await newsCoverGateway.deleteCover(current.cover_image_public_id).catch(() => {});
  }

  return { ok: true };
}

export { uploadArticleCoverUseCase } from './news-cover.usecase.js';
