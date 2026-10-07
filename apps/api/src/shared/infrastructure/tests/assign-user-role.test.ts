import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { assignUserRoleUseCase } from "../../../modules/admin/application/assign-user-role.usecase.js";
import { prisma } from "../../../db.js";
import { AppError } from "../../../shared/domain/app-error.js";

describe("assignUserRoleUseCase - Unit & Logic Tests", () => {
  const origFindUnique = prisma.user.findUnique;
  const origUpdate = prisma.user.update;
  const origDeleteMany = prisma.session.deleteMany;

  test("1. Từ chối khi vai trò không hợp lệ (INVALID_ROLE)", async () => {
    await assert.rejects(
      async () => {
        await assignUserRoleUseCase("admin-1", "user-1", "superman");
      },
      (err: any) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.status, 400);
        assert.strictEqual(err.code, "INVALID_ROLE");
        return true;
      },
    );
  });

  test("2. Từ chối khi target user không tồn tại (NOT_FOUND)", async () => {
    prisma.user.findUnique = (async () => null) as any;

    try {
      await assert.rejects(
        async () => {
          await assignUserRoleUseCase("admin-1", "non-existent-user", "supporter");
        },
        (err: any) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.status, 404);
          assert.strictEqual(err.code, "NOT_FOUND");
          return true;
        },
      );
    } finally {
      prisma.user.findUnique = origFindUnique;
    }
  });

  test("3. Chặn thay đổi vai trò tài khoản system", async () => {
    prisma.user.findUnique = (async () => ({
      id: "sys-1",
      name: "System",
      email: "system@nexus.internal",
      role: "system",
    })) as any;

    try {
      await assert.rejects(
        async () => {
          await assignUserRoleUseCase("admin-1", "sys-1", "user");
        },
        (err: any) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.status, 403);
          assert.strictEqual(err.code, "FORBIDDEN");
          return true;
        },
      );
    } finally {
      prisma.user.findUnique = origFindUnique;
    }
  });

  test("4. Chặn admin tự hạ quyền của chính mình (CANNOT_DEMOTE_SELF)", async () => {
    prisma.user.findUnique = (async () => ({
      id: "admin-1",
      name: "Admin Me",
      email: "admin@nexus.test",
      role: "admin",
    })) as any;

    try {
      await assert.rejects(
        async () => {
          await assignUserRoleUseCase("admin-1", "admin-1", "supporter");
        },
        (err: any) => {
          assert.ok(err instanceof AppError);
          assert.strictEqual(err.status, 400);
          assert.strictEqual(err.code, "CANNOT_DEMOTE_SELF");
          return true;
        },
      );
    } finally {
      prisma.user.findUnique = origFindUnique;
    }
  });

  test("5. Đổi vai trò thành công cho user khác và thu hồi session nếu hạ quyền admin", async () => {
    let sessionRevokedFor: string | null = null;
    let updatedData: any = null;

    prisma.user.findUnique = (async () => ({
      id: "target-admin-2",
      name: "Admin 2",
      email: "admin2@nexus.test",
      role: "admin",
    })) as any;

    prisma.user.update = (async ({ data }: any) => {
      updatedData = data;
      return {
        id: "target-admin-2",
        name: "Admin 2",
        email: "admin2@nexus.test",
        role: data.role,
        updated_at: new Date(),
      };
    }) as any;

    prisma.session.deleteMany = (async ({ where }: any) => {
      sessionRevokedFor = where.user_id;
      return { count: 2 };
    }) as any;

    try {
      const res = await assignUserRoleUseCase("admin-1", "target-admin-2", "supporter");
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.user.role, "supporter");
      assert.strictEqual(updatedData?.role, "supporter");
      assert.strictEqual(sessionRevokedFor, "target-admin-2");
    } finally {
      prisma.user.findUnique = origFindUnique;
      prisma.user.update = origUpdate;
      prisma.session.deleteMany = origDeleteMany;
    }
  });

  test("6. Đổi vai trò user thành supporter thành công (không xóa session)", async () => {
    let sessionRevoked = false;

    prisma.user.findUnique = (async () => ({
      id: "student-1",
      name: "Student One",
      email: "student1@nexus.test",
      role: "user",
    })) as any;

    prisma.user.update = (async ({ data }: any) => ({
      id: "student-1",
      name: "Student One",
      email: "student1@nexus.test",
      role: data.role,
      updated_at: new Date(),
    })) as any;

    prisma.session.deleteMany = (async () => {
      sessionRevoked = true;
      return { count: 0 };
    }) as any;

    try {
      const res = await assignUserRoleUseCase("admin-1", "student-1", "supporter");
      assert.strictEqual(res.success, true);
      assert.strictEqual(res.user.role, "supporter");
      assert.strictEqual(sessionRevoked, false);
    } finally {
      prisma.user.findUnique = origFindUnique;
      prisma.user.update = origUpdate;
      prisma.session.deleteMany = origDeleteMany;
    }
  });
});
