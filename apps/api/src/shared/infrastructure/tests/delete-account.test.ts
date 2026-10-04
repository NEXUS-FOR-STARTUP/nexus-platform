process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test";
process.env.CLOUDINARY_CLOUD_NAME ??= "test_cloud";
process.env.CLOUDINARY_API_KEY ??= "test_key";
process.env.CLOUDINARY_API_SECRET ??= "test_secret";

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { deleteAccountUseCase, type DeleteAccountDeps } from "../../../modules/profile/application/delete-account.usecase.js";
import { AppError } from "../../../shared/domain/app-error.js";
import type { AuditLogEntry } from "../audit-logger.js";

describe("deleteAccountUseCase (GA-04 User Account Deletion)", () => {
  it("should successfully soft-delete a normal user account and revoke sessions", async () => {
    let txExecuted = false;
    let loggedEntry: Omit<AuditLogEntry, "timestamp" | "level"> | undefined;

    const mockUser = {
      id: "user-123",
      email: "student@fpt.edu.vn",
      role: "student",
      banned: false,
    };

    const result = await deleteAccountUseCase("user-123", {
      findUser: async (id) => (id === mockUser.id ? mockUser : null),
      executeTransaction: async (userId, originalEmail, scrambledEmail) => {
        assert.equal(userId, "user-123");
        assert.equal(originalEmail, "student@fpt.edu.vn");
        assert.ok(scrambledEmail.startsWith("deleted_"));
        assert.ok(scrambledEmail.endsWith("_student@fpt.edu.vn"));
        txExecuted = true;
      },
      logAudit: (entry) => {
        loggedEntry = entry;
      },
    });

    assert.equal(result.success, true);
    assert.equal(result.message, "Tài khoản đã được xóa thành công");
    assert.equal(txExecuted, true);
    assert.ok(loggedEntry !== undefined);
    assert.equal(loggedEntry?.operation, "user.delete_account");
    assert.equal(loggedEntry?.actor_id, "user-123");
    assert.equal(loggedEntry?.actor_role, "student");
    assert.equal(loggedEntry?.action, "soft_delete");
  });

  it("should reject with VALIDATION_ERROR if userId is empty or whitespace", async () => {
    await assert.rejects(
      async () => {
        await deleteAccountUseCase("   ");
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.status, 400);
        assert.equal(err.code, "VALIDATION_ERROR");
        return true;
      },
    );
  });

  it("should reject with NOT_FOUND if user does not exist", async () => {
    await assert.rejects(
      async () => {
        await deleteAccountUseCase("non-existent-id", {
          findUser: async () => null,
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.status, 404);
        assert.equal(err.code, "NOT_FOUND");
        return true;
      },
    );
  });

  it("should reject with NOT_FOUND if user is already banned or deleted", async () => {
    const mockBannedUser = {
      id: "banned-123",
      email: "deleted_12345_user@test.com",
      role: "student",
      banned: true,
    };

    await assert.rejects(
      async () => {
        await deleteAccountUseCase("banned-123", {
          findUser: async () => mockBannedUser,
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.status, 404);
        assert.equal(err.code, "NOT_FOUND");
        return true;
      },
    );
  });

  it("should reject with CANNOT_DELETE_LAST_ADMIN when deleting the only active admin", async () => {
    const mockAdmin = {
      id: "admin-1",
      email: "admin@nexus.vn",
      role: "admin",
      banned: false,
    };

    await assert.rejects(
      async () => {
        await deleteAccountUseCase("admin-1", {
          findUser: async () => mockAdmin,
          countActiveAdmins: async () => 1,
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.equal(err.status, 400);
        assert.equal(err.code, "CANNOT_DELETE_LAST_ADMIN");
        return true;
      },
    );
  });

  it("should allow admin deletion when other active admins exist", async () => {
    let txExecuted = false;

    const mockAdmin = {
      id: "admin-2",
      email: "admin2@nexus.vn",
      role: "admin",
      banned: false,
    };

    const result = await deleteAccountUseCase("admin-2", {
      findUser: async () => mockAdmin,
      countActiveAdmins: async () => 2,
      executeTransaction: async () => {
        txExecuted = true;
      },
      logAudit: () => {},
    });

    assert.equal(result.success, true);
    assert.equal(txExecuted, true);
  });

  it("should propagate transaction failure and not log successful audit", async () => {
    let auditLogged = false;

    const mockUser = {
      id: "user-456",
      email: "user456@test.com",
      role: "student",
      banned: false,
    };

    await assert.rejects(
      async () => {
        await deleteAccountUseCase("user-456", {
          findUser: async () => mockUser,
          executeTransaction: async () => {
            throw new Error("DB_CONNECTION_LOST");
          },
          logAudit: () => {
            auditLogged = true;
          },
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.equal(err.message, "DB_CONNECTION_LOST");
        return true;
      },
    );

    assert.equal(auditLogged, false);
  });
});
