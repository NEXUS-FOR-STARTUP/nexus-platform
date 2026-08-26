import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

// ================================================================
// createDepositUseCase — idempotency dedup contract
//   (fix for double-submit: two rapid POST /deposits with the same
//    idempotency_key must yield exactly one deposit row)
// ================================================================

const existingDeposit = (userId: string, key: string) => ({
  id: `dep-${userId}-${key}`,
  user_id: userId,
  amount: 50000,
  transfer_content: "CRTOPUPA1B2C3",
  idempotency_key: key,
  status: "pending",
});

test("createDepositUseCase - idempotency dedup", async (t) => {
  await t.test("same key, same user, exists → returns existing; create never called", async () => {
    const { createDepositUseCase } = await import(
      "../../../modules/deposits/application/create-deposit.usecase.js"
    );

    const row = existingDeposit("user-1", "key-1");
    let createCalled = false;

    const result = await createDepositUseCase("user-1", 50000, "key-1", {
      findDepositByIdempotencyKey: async () => row as any,
      createDeposit: async () => {
        createCalled = true;
        return {} as any;
      },
    });

    assert.strictEqual(createCalled, false);
    assert.strictEqual(result.depositId, row.id);
    assert.strictEqual(result.transferContent, row.transfer_content);
    assert.strictEqual(result.amount, row.amount);
    assert.ok(result.bankInfo);
    assert.strictEqual(result.bankInfo.transferContent, row.transfer_content);
  });

  await t.test("same key, different user → 409 IDEMPOTENCY_CONFLICT", async () => {
    const { createDepositUseCase } = await import(
      "../../../modules/deposits/application/create-deposit.usecase.js"
    );

    const row = existingDeposit("user-999", "key-1");

    try {
      await createDepositUseCase("user-1", 50000, "key-1", {
        findDepositByIdempotencyKey: async () => row as any,
        createDeposit: async () => {
          throw new Error("must not be called");
        },
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.strictEqual(err.code, "IDEMPOTENCY_CONFLICT");
      assert.strictEqual(err.status, 409);
    }
  });

  await t.test("P2002 on create → re-fetch by key → returns existing winner", async () => {
    const { createDepositUseCase } = await import(
      "../../../modules/deposits/application/create-deposit.usecase.js"
    );

    const row = existingDeposit("user-1", "key-2");
    const p2002 = Object.assign(new Error("unique violation"), { code: "P2002" });
    let lookups = 0;

    const result = await createDepositUseCase("user-1", 50000, "key-2", {
      findDepositByIdempotencyKey: async () => {
        // First call = pre-check (nothing yet); second call = P2002 fallback (winner).
        lookups += 1;
        return lookups === 2 ? (row as any) : null;
      },
      createDeposit: async () => {
        throw p2002;
      },
    });

    assert.strictEqual(lookups, 2);
    assert.strictEqual(result.depositId, row.id);
    assert.strictEqual(result.transferContent, row.transfer_content);
  });

  await t.test("P2002 on create, lookup null → original error rethrown", async () => {
    const { createDepositUseCase } = await import(
      "../../../modules/deposits/application/create-deposit.usecase.js"
    );

    const p2002 = Object.assign(new Error("unique violation"), { code: "P2002" });

    try {
      await createDepositUseCase("user-1", 50000, "key-3", {
        findDepositByIdempotencyKey: async () => null,
        createDeposit: async () => {
          throw p2002;
        },
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.strictEqual(err, p2002);
    }
  });

  await t.test("no key → create called with generated fallback key", async () => {
    const { createDepositUseCase } = await import(
      "../../../modules/deposits/application/create-deposit.usecase.js"
    );

    let capturedParams: any = null;

    const result = await createDepositUseCase("user-1", 50000, undefined, {
      findDepositByIdempotencyKey: async () => null,
      createDeposit: async (params: any) => {
        capturedParams = params;
        return { id: "dep-new", ...params } as any;
      },
    });

    assert.ok(capturedParams);
    assert.match(capturedParams.idempotencyKey, /^deposit-create-/);
    assert.strictEqual(capturedParams.userId, "user-1");
    assert.strictEqual(capturedParams.amount, 50000);
    assert.strictEqual(result.depositId, "dep-new");
  });
});
