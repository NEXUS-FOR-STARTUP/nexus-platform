import { test } from "node:test";
import assert from "node:assert";
import { AppError } from "../../domain/app-error.js";
import type { Deposit } from "@prisma/client";

process.env.NODE_ENV = "test";

// Repository is injected in every case; placeholders prevent unrelated env validation during module loading.
process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.CLOUDINARY_CLOUD_NAME ??= "test";
process.env.CLOUDINARY_API_KEY ??= "test";
process.env.CLOUDINARY_API_SECRET ??= "test";

type DepositStatus = "pending" | "verified" | "rejected";

function depositRow(
  status: DepositStatus,
  userId = "user-1",
  id = `deposit-${status}`,
): Deposit {
  return {
    id,
    user_id: userId,
    amount: 50000,
    currency: "VND",
    transfer_content: "CRTOPUPA1B2C3",
    idempotency_key: `${id}-key`,
    status,
    proof_file_url: `https://proof.example/${status}.png`,
    rejection_reason: status === "rejected" ? "Ảnh minh chứng chưa rõ" : null,
    bank_transaction_id: status === "verified" ? "bank-txn-1" : null,
    bank_credited_at: status === "verified" ? new Date("2026-08-20T10:00:00.000Z") : null,
    verified_by: status === "verified" ? "admin-1" : null,
    verification_source: "manual",
    metadata_json: null,
    created_at: new Date("2026-08-20T09:00:00.000Z"),
    updated_at: new Date("2026-08-20T09:00:00.000Z"),
  };
}

test("getDepositUseCase - deposit proof view contract", async (t) => {
  // Delayed import keeps database dependency loading consistent with existing API tests.
  const { getDepositUseCase } = await import(
    "../../../modules/deposits/application/get-deposit.usecase.js"
  );

  for (const status of ["pending", "verified", "rejected"] as const) {
    await t.test(`owner can view ${status} proof_file_url`, async () => {
      const row = depositRow(status);
      const result = await getDepositUseCase("user-1", row.id, {
        findDepositById: async () => row,
      });

      assert.strictEqual(result.status, status);
      assert.strictEqual(result.proof_file_url, row.proof_file_url);
    });
  }

  await t.test("foreign user receives 403 FORBIDDEN", async () => {
    const row = depositRow("pending", "user-2", "deposit-foreign");

    await assert.rejects(
      () =>
        getDepositUseCase("user-1", row.id, {
          findDepositById: async () => row,
        }),
      (error: unknown) => {
        if (!(error instanceof AppError)) return false;
        assert.strictEqual(error.status, 403);
        assert.strictEqual(error.code, "FORBIDDEN");
        return true;
      },
    );
  });

  await t.test("missing deposit returns 404 DEPOSIT_NOT_FOUND", async () => {
    await assert.rejects(
      () =>
        getDepositUseCase("user-1", "deposit-missing", {
          findDepositById: async () => null,
        }),
      (error: unknown) => {
        if (!(error instanceof AppError)) return false;
        assert.strictEqual(error.status, 404);
        assert.strictEqual(error.code, "DEPOSIT_NOT_FOUND");
        return true;
      },
    );
  });
});
