import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../shared/domain/app-error.js';
import logger from '../shared/infrastructure/logger.js';

// ---------------------------------------------------------------------------
// Config (single source)
// ---------------------------------------------------------------------------

const DEFAULT_SIGNED_URL_TTL = 7200; // 2 hours

let cloudinaryConfigured = false;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new AppError(500, 'CLOUDINARY_CONFIG_ERROR', `${name} is required`);
  }
  return value;
}

function ensureConfig() {
  if (cloudinaryConfigured) return;

  cloudinary.config({
    cloud_name: requiredEnv('CLOUDINARY_CLOUD_NAME'),
    api_key: requiredEnv('CLOUDINARY_API_KEY'),
    api_secret: requiredEnv('CLOUDINARY_API_SECRET'),
    secure: true,
  });

  cloudinaryConfigured = true;
}

// ---------------------------------------------------------------------------
// Upload / Delete
// ---------------------------------------------------------------------------

export interface UploadResult {
  fileUrl: string;
  publicId: string;
  resourceType: string;
}

function uploadBuffer(buffer: Buffer, options: Record<string, unknown>): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    });
    stream.end(buffer);
  });
}

export async function uploadFile(
  buffer: Buffer,
  folder: string,
  publicId: string,
  resourceType: string = 'raw',
): Promise<UploadResult> {
  ensureConfig();
  const t0 = Date.now();

  try {
    const result = await uploadBuffer(buffer, {
      folder,
      public_id: publicId,
      resource_type: resourceType,
      overwrite: false,
    });

    const fileUrl = result?.secure_url || result?.url;
    const resultPublicId = result?.public_id;

    if (!fileUrl || !resultPublicId) {
      throw new Error('Cloudinary upload missing url or public_id');
    }

    logger.info({ publicId, folder, resourceType, duration_ms: Date.now() - t0 }, 'Cloudinary upload success');

    return {
      fileUrl,
      publicId: resultPublicId,
      resourceType,
    };
  } catch (error: any) {
    if (error instanceof AppError) throw error;
    throw new AppError(500, 'CLOUDINARY_UPLOAD_ERROR', `Lỗi khi tải lên Cloudinary: ${error?.message ?? 'Unknown error'}`);
  }
}

export async function deleteFile(publicId: string, resourceType: string = 'raw'): Promise<void> {
  if (!publicId) return;
  const t0 = Date.now();

  try {
    ensureConfig();
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    logger.info({ publicId, resourceType, duration_ms: Date.now() - t0 }, 'Cloudinary delete success');
  } catch (err) {
    logger.error({ err, publicId, resourceType, duration_ms: Date.now() - t0 }, 'Cloudinary delete failed');
  }
}

// ---------------------------------------------------------------------------
// URL operations
// ---------------------------------------------------------------------------

export function getCloudName(): string {
  return requiredEnv('CLOUDINARY_CLOUD_NAME');
}

export function getCloudinaryHost(): string {
  return 'res.cloudinary.com';
}

export function isValidCloudinaryUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.hostname === getCloudinaryHost();
  } catch {
    return false;
  }
}

export function validateCloudinaryUrl(url: string): void {
  if (!isValidCloudinaryUrl(url)) {
    throw new Error('INVALID_CLOUDINARY_HOST');
  }

  const parsed = new URL(url);
  const firstPathSegment = parsed.pathname.split('/')[1] ?? '';
  if (firstPathSegment !== getCloudName()) {
    throw new Error('INVALID_CLOUDINARY_CLOUD_NAME');
  }
}

export function generateSignedUrl(
  publicId: string,
  ttlSeconds: number = DEFAULT_SIGNED_URL_TTL,
  originalFilename?: string | null,
  version?: string | null,
): string {
  if (!publicId) {
    throw new AppError(400, 'INVALID_PUBLIC_ID', 'publicId is required');
  }

  ensureConfig();

  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;

  const options: Record<string, any> = {
    sign_url: true,
    expires_at: expiresAt,
    resource_type: 'raw',
    secure: true,
  };

  if (version) {
    options.version = version;
  }

  if (originalFilename) {
    // Strip file extension to prevent Cloudinary 400 bad request "Invalid flag in transformation: pdf"
    const nameWithoutExt = originalFilename.split('?')[0].split('#')[0].replace(/\.[^/.]+$/, "");
    const encodedFilename = encodeURIComponent(nameWithoutExt);
    options.flags = `attachment:${encodedFilename}`;
  }

  return cloudinary.url(publicId, options);
}

export function extractPublicId(url: string): string | null {
  if (!url || !isValidCloudinaryUrl(url)) return null;

  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    // Skip cloud_name, asset_type, delivery_type, and any transformation segments
    // Find the version segment (vNNNN) and everything after it is the public_id
    const versionIndex = parts.findIndex((part) => /^v\d+$/.test(part));
    if (versionIndex === -1 || versionIndex === parts.length - 1) return null;

    const publicId = parts.slice(versionIndex + 1).join('/');
    return publicId || null;
  } catch {
    return null;
  }
}

export function extractVersion(url: string): string | null {
  if (!url || !isValidCloudinaryUrl(url)) return null;
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const versionSegment = parts.find((part) => /^v\d+$/.test(part));
    if (versionSegment) {
      return versionSegment.substring(1); // Remove the 'v' prefix
    }
  } catch {}
  return null;
}
