import path from "node:path";
import crypto from "node:crypto";
import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";
import { uploadFile, deleteFile } from "../../../services/cloudinary.js";
import {
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  isAllowedDocumentExtension,
} from "../domain/document-upload-rules.js";

export type ManagedUploadFile = {
  name: string;
  size: number;
  type?: string;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

export type UploadedManagedDocument = {
  original_name: string;
  file_url: string;
  download_url: string;
  cloudinary_public_id: string;
  extension: string;
  mime_type: string;
};

const CLOUDINARY_FOLDER = "nexus-platform/case-documents";

function normalizeExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

export function validateManagedDocumentFile(file: ManagedUploadFile) {
  const extension = normalizeExtension(file.name);
  if (!isAllowedDocumentExtension(extension)) {
    throw new AppError(
      400,
      "INVALID_FILE_TYPE",
      "Chỉ hỗ trợ tải lên tệp .pdf, .docx, .xlsx, .pptx, .md, .txt",
    );
  }

  if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new AppError(
      400,
      "FILE_TOO_LARGE",
      "Dung lượng tài liệu tối đa là 15MB",
    );
  }

  return extension;
}

function generateSafeCloudinaryPublicId(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, ext);

  const cleanBase = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese accents
    .replace(/[^a-zA-Z0-9-_]/g, "_")  // Replace other characters with underscore
    .replace(/_+/g, "_")              // Collapse multiple underscores
    .slice(0, 80);                    // Limit length

  const randomChars = Math.random().toString(36).substring(2, 6);
  return `${cleanBase}-${randomChars}${ext}`;
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      // Don't retry AppErrors — they signal domain-level failures
      if (error instanceof AppError) throw error;
      if (attempt < maxAttempts) {
        logger.warn({ attempt, maxAttempts, err: lastError }, "Cloudinary upload retry");
        await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}

export async function uploadManagedDocumentFile(file: ManagedUploadFile): Promise<UploadedManagedDocument> {
  const extension = validateManagedDocumentFile(file);

  try {
    const t0 = Date.now();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const publicId = generateSafeCloudinaryPublicId(file.name);
    const result = await withRetry(() => uploadFile(buffer, CLOUDINARY_FOLDER, publicId, "raw"));

    logger.info({ publicId, originalName: file.name, fileSize: file.size, duration_ms: Date.now() - t0 }, "Cloudinary document upload success");

    return {
      original_name: file.name,
      file_url: result.fileUrl,
      download_url: result.fileUrl,
      cloudinary_public_id: result.publicId,
      extension: extension.replace(/^\./, ""),
      mime_type: file.type?.trim() || "application/octet-stream",
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    // Log raw error for debugging, never leak SDK internals to client
    logger.error({ err: error, fileName: file?.name }, "Cloudinary document upload failed");

    throw new AppError(
      500,
      "CLOUDINARY_UPLOAD_ERROR",
      "Lỗi khi tải tài liệu lên Cloudinary",
    );
  }
}

export async function deleteManagedDocumentFile(publicId: string) {
  await deleteFile(publicId);
}
