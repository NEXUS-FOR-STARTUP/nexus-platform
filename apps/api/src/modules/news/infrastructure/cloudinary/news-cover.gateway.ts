import { randomUUID } from 'node:crypto';
import { uploadFile, deleteFile } from '../../../../services/cloudinary.js';
import { AppError } from '../../../../shared/domain/app-error.js';

const CONTENT_IMAGE_FOLDER = 'nexus/news-content';
const MAX_COVER_SIZE_BYTES = 5 * 1024 * 1024; // 5 MiB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadCoverResult {
  url: string;
  publicId: string;
}

export class NewsCoverGateway {
  private validateImage(buffer: Buffer, mimeType: string, label: string): void {
    if (buffer.length > MAX_COVER_SIZE_BYTES) {
      throw new AppError(400, 'FILE_TOO_LARGE', `${label} không được vượt quá 5MB`);
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
      throw new AppError(
        400,
        'INVALID_MIME_TYPE',
        'Định dạng ảnh không hỗ trợ. Vui lòng chọn JPEG, PNG hoặc WebP'
      );
    }
  }

  async uploadCover(
    buffer: Buffer,
    mimeType: string,
    articleId: string
  ): Promise<UploadCoverResult> {
    this.validateImage(buffer, mimeType, 'Ảnh bìa');

    const publicId = `cover_${articleId}_${Date.now()}`;
    const result = await uploadFile(
      buffer,
      'nexus/news-covers',
      publicId,
      'image',
      true
    );

    return {
      url: result.fileUrl,
      publicId: result.publicId,
    };
  }

  async uploadContentImage(buffer: Buffer, mimeType: string): Promise<UploadCoverResult> {
    this.validateImage(buffer, mimeType, 'Ảnh');

    const result = await uploadFile(
      buffer,
      CONTENT_IMAGE_FOLDER,
      `content_${randomUUID()}`,
      'image',
      false
    );

    return {
      url: result.fileUrl,
      publicId: result.publicId,
    };
  }
  async deleteCover(publicId: string): Promise<void> {
    if (!publicId) return;
    await deleteFile(publicId, 'image');
  }
}

export const newsCoverGateway = new NewsCoverGateway();
