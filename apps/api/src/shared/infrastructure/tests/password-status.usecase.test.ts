process.env.NODE_ENV = "test";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getMyPasswordStatus,
  getPasswordStatus,
} from "../../../modules/profile/application/password-status.usecase.js";
import type { prisma } from "../../../db.js";

type DbStub = typeof prisma;

describe("Password Status Usecase Test Suite", () => {
  it("TC01: returns hasPassword: false when user does not exist", async () => {
    const mockDb = {
      user: {
        findUnique: async () => null,
      },
    };

    const result = await getPasswordStatus(
      "unknown@example.com",
      mockDb as unknown as DbStub,
    );
    assert.deepEqual(result, { exists: false, hasPassword: false });
  });

  it("TC02: returns hasPassword: false when user has only OAuth / no password", async () => {
    const mockDb = {
      user: {
        findUnique: async () => ({
          id: "user-123",
          accounts: [],
        }),
      },
    };

    const result = await getPasswordStatus(
      "googleuser@example.com",
      mockDb as unknown as DbStub,
    );
    assert.deepEqual(result, { exists: true, hasPassword: false });
  });

  it("TC03: returns hasPassword: true when user has credential account with password", async () => {
    const mockDb = {
      user: {
        findUnique: async () => ({
          id: "user-456",
          accounts: [{ id: "acc-1" }],
        }),
      },
    };

    const result = await getPasswordStatus(
      "member@example.com",
      mockDb as unknown as DbStub,
    );
    assert.deepEqual(result, { exists: true, hasPassword: true });
  });

  it("TC04: normalizes email before querying user", async () => {
    let queriedEmail: string | null = null;
    const mockDb = {
      user: {
        findUnique: async ({ where }: { where: { email: string } }) => {
          queriedEmail = where.email;
          return null;
        },
      },
    };

    await getPasswordStatus(
      "  MixedCase.User@EXAMPLE.com  ",
      mockDb as unknown as DbStub,
    );
    assert.equal(queriedEmail, "mixedcase.user@example.com");
  });

  it("TC05: getMyPasswordStatus is false when no credential password", async () => {
    const mockDb = {
      account: {
        findFirst: async () => null,
      },
    };
    const result = await getMyPasswordStatus(
      "user-otp-1",
      mockDb as unknown as DbStub,
    );
    assert.deepEqual(result, { hasPassword: false });
  });

  it("TC06: getMyPasswordStatus is true when credential password exists", async () => {
    const mockDb = {
      account: {
        findFirst: async () => ({ id: "acc-1" }),
      },
    };
    const result = await getMyPasswordStatus(
      "user-pass-1",
      mockDb as unknown as DbStub,
    );
    assert.deepEqual(result, { hasPassword: true });
  });
});
