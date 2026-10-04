process.env.NODE_ENV = "test";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { setPasswordUseCase } from "../../../modules/profile/application/set-password.usecase.js";
import { AppError } from "../../../shared/domain/app-error.js";
import type { prisma } from "../../../db.js";

type DbStub = typeof prisma;

describe("Set Password Usecase Test Suite", () => {
  it("TC01: hashes login password on first set", async () => {
    let createdAccount: Record<string, unknown> | null = null;

    const mockDb = {
      account: {
        findFirst: async () => null,
        create: async ({ data }: { data: Record<string, unknown> }) => {
          createdAccount = data;
          return data;
        },
        update: async () => null,
      },
      $transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn(mockDb),
    };

    const typedPass = "CustomPass1234!";
    const result = await setPasswordUseCase(
      "user-typed-1",
      typedPass,
      mockDb as unknown as DbStub,
    );

    assert.equal(result.ok, true);
    assert.ok(createdAccount);
    const acc = createdAccount as Record<string, unknown>;
    assert.notEqual(acc.password, typedPass);
  });

  it("TC02: rejects password if already set", async () => {
    const mockDb = {
      account: {
        findFirst: async () => ({ id: "acc-1", password: "hash" }),
      },
    };

    await assert.rejects(
      () =>
        setPasswordUseCase(
          "user-has-pass",
          "NewSecretPass123",
          mockDb as unknown as DbStub,
        ),
      (err: unknown) => err instanceof AppError && err.status === 409,
    );
  });

  it("TC03: rejects password shorter than 8 chars", async () => {
    const mockDb = {};
    await assert.rejects(
      () => setPasswordUseCase("user-1", "short", mockDb as unknown as DbStub),
      (err: unknown) => err instanceof AppError && err.status === 400,
    );
  });

  it("TC04: rejects empty password instead of generating one", async () => {
    const mockDb = {};
    await assert.rejects(
      () => setPasswordUseCase("user-empty-1", "", mockDb as unknown as DbStub),
      (err: unknown) => err instanceof AppError && err.status === 400,
    );
  });
});
