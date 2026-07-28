import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test";
process.env.BETTER_AUTH_URL ??= "http://localhost:8000";
process.env.GOOGLE_CLIENT_ID ??= "test-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-client-secret";

const makeFile = (name: string, size: number) => ({
  name,
  size,
  arrayBuffer: async () => new ArrayBuffer(Math.max(size, 8)),
});

test("Phase 05 - Cloudinary uploads", async (t) => {
  await t.test("rejects unsupported proof file type", async () => {
    const { fileStorageService } = await import("../../../modules/payments/infrastructure/file-storage.service.js");
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await fileStorageService.saveProofFile(makeFile("proof.exe", 128) as any);
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "INVALID_FILE_TYPE");
    }
  });

  await t.test("rejects proof file over limit", async () => {
    const { fileStorageService } = await import("../../../modules/payments/infrastructure/file-storage.service.js");
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await fileStorageService.saveProofFile(makeFile("proof.pdf", 6 * 1024 * 1024) as any);
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "FILE_TOO_LARGE");
    }
  });

  await t.test("uploads proof file through injected storage deps", async () => {
    const { uploadPaymentProofUseCase } = await import("../../../modules/payments/application/upload-payment-proof.usecase.js");

    let deleted = "";
    const result = await uploadPaymentProofUseCase(
      "user-1",
      "case-1",
      makeFile("proof.pdf", 1024) as any,
      {
        findCaseByIdWithAllRelations: async () => ({
          package_id: "pkg-1",
          package: { price: 199000 },
          locked_price: 199000,
          payment_status: "unpaid",
        } as any),
        saveProofFile: async () => ({
          fileUrl: "https://res.cloudinary.com/demo/image/upload/v1/proof.pdf",
          publicId: "nexus-platform/payment-proofs/proof-1",
          resourceType: "raw",
        } as any),
        deleteFile: async (publicId: string) => {
          deleted = publicId;
        },
        submitPaymentProof: async (data: any) => ({
          id: "pay-1",
          status: "pending_verification",
          ...data,
        } as any),
      } as any,
    );

    assert.strictEqual(result.proofFileUrl, "https://res.cloudinary.com/demo/image/upload/v1/proof.pdf");
    assert.strictEqual(deleted, "");
  });

  await t.test("cleans up Cloudinary asset when DB write fails", async () => {
    const { uploadPaymentProofUseCase } = await import("../../../modules/payments/application/upload-payment-proof.usecase.js");

    let deleted = "";
    const result = await uploadPaymentProofUseCase(
      "user-1",
      "case-1",
      makeFile("proof.pdf", 1024) as any,
      {
        findCaseByIdWithAllRelations: async () => ({
          package_id: "pkg-1",
          package: { price: 199000 },
          locked_price: 199000,
          payment_status: "unpaid",
        } as any),
        saveProofFile: async () => ({
          fileUrl: "https://res.cloudinary.com/demo/image/upload/v1/proof.pdf",
          publicId: "nexus-platform/payment-proofs/proof-2",
          resourceType: "raw",
        } as any),
        deleteFile: async (publicId: string) => {
          deleted = publicId;
        },
        submitPaymentProof: async () => {
          throw new Error("db failure");
        },
      } as any,
    ).catch((error) => error);

    assert.ok(result instanceof Error);
    assert.strictEqual(deleted, "nexus-platform/payment-proofs/proof-2");
  });
});
