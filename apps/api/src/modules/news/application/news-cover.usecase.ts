import { newsRepository } from '../infrastructure/persistence/prisma-news.repository.js';
import { newsCoverGateway } from '../infrastructure/cloudinary/news-cover.gateway.js';
import { AppError } from '../../../shared/domain/app-error.js';
import type { Prisma } from '@prisma/client';

export async function uploadArticleCoverUseCase(
  actorId: string,
  id: string,
  buffer: Buffer,
  mimeType: string,
  expectedUpdatedAt: string
) {
  const current = await newsRepository.findAdminNewsById(id);
  if (!current) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy mục tin tức');
  if (current.type !== 'article') throw new AppError(400, 'NOT_AN_ARTICLE', 'Chỉ có thể tải ảnh bìa cho bài viết');

  const expectedDate = new Date(expectedUpdatedAt);
  if (isNaN(expectedDate.getTime())) throw new AppError(400, 'INVALID_DATE', 'expected_updated_at không hợp lệ');

  const uploaded = await newsCoverGateway.uploadCover(buffer, mimeType, id);

  const updateData: Prisma.NewsItemUpdateInput = {
    cover_image_url: uploaded.url,
    cover_image_public_id: uploaded.publicId,
    updated_by_auth_user_id: actorId,
  };

  const updated = await newsRepository.updateNewsItemConditional(id, expectedDate, updateData);
  if (!updated) {
    await newsCoverGateway.deleteCover(uploaded.publicId).catch(() => {});
    throw new AppError(409, 'CONCURRENCY_CONFLICT', 'Mục tin tức đã được sửa bởi người khác');
  }

  if (current.cover_image_public_id && current.cover_image_public_id !== uploaded.publicId) {
    await newsCoverGateway.deleteCover(current.cover_image_public_id).catch(() => {});
  }

  return updated;
}
