import { newsCoverGateway } from '../infrastructure/cloudinary/news-cover.gateway.js';
import logger from '../../../shared/infrastructure/logger.js';

export interface UploadNewsContentImageResult {
  url: string;
  publicId: string;
}

export async function uploadNewsContentImageUseCase(
  actorId: string,
  buffer: Buffer,
  mimeType: string
): Promise<UploadNewsContentImageResult> {
  const uploaded = await newsCoverGateway.uploadContentImage(buffer, mimeType);

  logger.info(
    { actorId, publicId: uploaded.publicId, url: uploaded.url },
    'Uploaded news content image'
  );

  return uploaded;
}
