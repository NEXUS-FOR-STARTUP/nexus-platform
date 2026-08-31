process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test";
process.env.CLOUDINARY_CLOUD_NAME ??= "test_cloud";
process.env.CLOUDINARY_API_KEY ??= "test_key";
process.env.CLOUDINARY_API_SECRET ??= "test_secret";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedAvatarExtension,
  isAllowedAvatarMime,
  MAX_AVATAR_FILE_SIZE_BYTES,
} from "../../../modules/profile/domain/avatar-upload-rules.js";
import {
  uploadAvatarUseCase,
  validateAvatarFile,
  type AvatarFile,
  type UploadAvatarDeps,
} from "../../../modules/profile/application/upload-avatar.usecase.js";
import { AppError } from "../../domain/app-error.js";

describe("GA05: Avatar Upload - Domain Rules", () => {
  it("should allow valid extensions: .jpg, .jpeg, .png, .webp", () => {
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".PNG", ".WebP"];
    for (const ext of validExtensions) {
      assert.equal(isAllowedAvatarExtension(ext), true, `Expected ${ext} to be allowed`);
    }
  });

  it("should reject invalid extensions: .pdf, .exe, .gif, .svg, .txt", () => {
    const invalidExtensions = [".pdf", ".exe", ".gif", ".svg", ".txt", ".mp4", "", "jpg"];
    for (const ext of invalidExtensions) {
      assert.equal(isAllowedAvatarExtension(ext), false, `Expected ${ext} to be rejected`);
    }
  });

  it("should validate MIME type against extension", () => {
    assert.equal(isAllowedAvatarMime(".jpg", "image/jpeg"), true);
    assert.equal(isAllowedAvatarMime(".jpeg", "image/jpeg"), true);
    assert.equal(isAllowedAvatarMime(".png", "image/png"), true);
    assert.equal(isAllowedAvatarMime(".webp", "image/webp"), true);

    // Mismatched / Malicious MIME
    assert.equal(isAllowedAvatarMime(".png", "application/pdf"), false);
    assert.equal(isAllowedAvatarMime(".jpg", "text/html"), false);
    assert.equal(isAllowedAvatarMime(".webp", "image/gif"), false);
    // Missing MIME type is accepted for basic extension checks
    assert.equal(isAllowedAvatarMime(".png", undefined), true);
  });

  it("should validate file size within 2MB limit", () => {
    assert.equal(MAX_AVATAR_FILE_SIZE_BYTES, 2 * 1024 * 1024);
  });

  it("should reject 0-byte or negative size files", () => {
    const emptyFile: AvatarFile = {
      name: "empty.png",
      size: 0,
      type: "image/png",
      arrayBuffer: async () => new ArrayBuffer(0),
    };

    assert.throws(
      () => validateAvatarFile(emptyFile),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.status, 400);
        assert.equal(err.code, "INVALID_FILE");
        return true;
      },
    );
  });
});

describe("GA05: Avatar Upload - Use Case Lifecycle", () => {
  function createMockAvatarFile(options: {
    name?: string;
    type?: string;
    size?: number;
  } = {}): AvatarFile {
    const {
      name = "avatar.png",
      type = "image/png",
      size = 500 * 1024,
    } = options;

    return {
      name,
      type,
      size,
      arrayBuffer: async () => new ArrayBuffer(Math.min(size, 1024)),
    };
  }

  it("should successfully upload avatar, update DB, and return URL", async () => {
    const mockFile = createMockAvatarFile();
    let uploadedFolder = "";
    let uploadedResourceType = "";
    let updatedUserId = "";
    let updatedImage = "";

    const deps: UploadAvatarDeps = {
      uploadFile: async (
        _buffer: Buffer,
        folder: string,
        publicId: string,
        resourceType: string = "image",
      ) => {
        uploadedFolder = folder;
        uploadedResourceType = resourceType;
        return {
          fileUrl: `https://res.cloudinary.com/demo/image/upload/v123456/${publicId}.png`,
          publicId,
          resourceType,
        };
      },
      deleteFile: async () => {},
      extractPublicId: () => null,
      findUserImage: async () => null,
      updateUserImage: async (userId: string, image: string) => {
        updatedUserId = userId;
        updatedImage = image;
      },
    };

    const result = await uploadAvatarUseCase("user-123", mockFile, deps);

    assert.equal(uploadedFolder, "nexus-platform/avatars");
    assert.equal(uploadedResourceType, "image");
    assert.equal(updatedUserId, "user-123");
    assert.ok(result.url.startsWith("https://res.cloudinary.com/"));
    assert.ok(result.publicId.startsWith("user-user-123-"));
    assert.equal(updatedImage, result.url);
  });

  it("should delete previous Cloudinary avatar when a new avatar is uploaded", async () => {
    const mockFile = createMockAvatarFile();
    let deletedPublicId = "";
    let deletedResourceType = "";

    const previousAvatarUrl =
      "https://res.cloudinary.com/demo/image/upload/v123456/nexus-platform/avatars/user-user-123-old123.png";

    const deps: UploadAvatarDeps = {
      uploadFile: async (
        _buffer: Buffer,
        _folder: string,
        publicId: string,
        resourceType: string = "image",
      ) => ({
        fileUrl: `https://res.cloudinary.com/demo/image/upload/v789012/${publicId}.png`,
        publicId,
        resourceType,
      }),
      deleteFile: async (publicId: string, resourceType: string = "image") => {
        deletedPublicId = publicId;
        deletedResourceType = resourceType;
      },
      extractPublicId: (url: string) => {
        if (url.includes("nexus-platform/avatars")) {
          return "nexus-platform/avatars/user-user-123-old123";
        }
        return null;
      },
      findUserImage: async () => previousAvatarUrl,
      updateUserImage: async () => {},
    };

    await uploadAvatarUseCase("user-123", mockFile, deps);

    assert.equal(deletedPublicId, "nexus-platform/avatars/user-user-123-old123");
    assert.equal(deletedResourceType, "image");
  });

  it("should not delete previous avatar if it was an external URL (e.g. Google OAuth)", async () => {
    const mockFile = createMockAvatarFile();
    let deleteCalled = false;

    const externalGoogleUrl =
      "https://lh3.googleusercontent.com/a/ACg8ocLxyz123=s96-c";

    const deps: UploadAvatarDeps = {
      uploadFile: async (
        _buffer: Buffer,
        _folder: string,
        publicId: string,
        resourceType: string = "image",
      ) => ({
        fileUrl: `https://res.cloudinary.com/demo/image/upload/v789012/${publicId}.png`,
        publicId,
        resourceType,
      }),
      deleteFile: async () => {
        deleteCalled = true;
      },
      extractPublicId: () => null, // External URLs do not match Cloudinary regex
      findUserImage: async () => externalGoogleUrl,
      updateUserImage: async () => {},
    };

    await uploadAvatarUseCase("user-123", mockFile, deps);

    assert.equal(deleteCalled, false, "Should not delete external avatar URL");
  });

  it("should rollback newly uploaded Cloudinary image if database update fails", async () => {
    const mockFile = createMockAvatarFile();
    let rollbackPublicId = "";
    let rollbackResourceType = "";
    let newlyUploadedPublicId = "";

    const deps: UploadAvatarDeps = {
      uploadFile: async (
        _buffer: Buffer,
        _folder: string,
        publicId: string,
        resourceType: string = "image",
      ) => {
        newlyUploadedPublicId = publicId;
        return {
          fileUrl: `https://res.cloudinary.com/demo/image/upload/v789012/${publicId}.png`,
          publicId,
          resourceType,
        };
      },
      deleteFile: async (publicId: string, resourceType: string = "image") => {
        rollbackPublicId = publicId;
        rollbackResourceType = resourceType;
      },
      extractPublicId: () => null,
      findUserImage: async () => null,
      updateUserImage: async () => {
        throw new Error("PostgreSQL connection timeout");
      },
    };

    await assert.rejects(
      async () => uploadAvatarUseCase("user-123", mockFile, deps),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.status, 500);
        assert.equal(err.code, "AVATAR_UPDATE_ERROR");
        return true;
      },
    );

    assert.equal(rollbackResourceType, "image");
    assert.equal(rollbackPublicId, newlyUploadedPublicId);
  });
});
