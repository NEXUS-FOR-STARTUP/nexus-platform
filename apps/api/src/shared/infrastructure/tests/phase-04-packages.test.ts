import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

test("Phase 04 - Packages & attachments", async (t) => {
  await t.test("package seed - only on empty", async () => {
    const { listPackagesUseCase } = await import(
      "../../../modules/packages/application/list-packages.usecase.js"
    );
    const existing = [{ id: "pkg-1", name: "Existing", price: 0, is_active: true, features: [] }];
    const packages = await listPackagesUseCase({
      findActivePackages: async () => existing as any,
      findAllPackages: async () => existing as any,
      createPackage: async () => {
        throw new Error("Should not seed");
      },
    } as any);
    assert.strictEqual(packages.length, 1);
  });

  await t.test("package list excludes inactive packages", async () => {
    const { listPackagesUseCase } = await import(
      "../../../modules/packages/application/list-packages.usecase.js"
    );

    const packages = await listPackagesUseCase({
      findActivePackages: async () => [{ id: "pkg-1", name: "Active", price: 0, is_active: true, features: [] }] as any,
      findAllPackages: async () => [
        { id: "pkg-1", name: "Active", price: 0, is_active: true, features: [] },
        { id: "pkg-2", name: "Inactive", price: 100, is_active: false, features: [] },
      ] as any,
      createPackage: async () => {
        throw new Error("Should not seed");
      },
    } as any);

    assert.strictEqual(packages.length, 1);
    assert.strictEqual(packages[0]?.id, "pkg-1");
  });

  await t.test("package status update rejects invalid status", async () => {
    const { updatePackageStatusUseCase } = await import(
      "../../../modules/admin/application/update-package-status.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await updatePackageStatusUseCase("pkg-1", "off" as any, "admin-1");
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "INVALID_PACKAGE_STATUS");
    }
  });

  await t.test("create case rejects inactive package", async () => {
    const { createCaseUseCase } = await import(
      "../../../modules/cases/application/create-case.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    const validBody = {
      package_id: "pkg-1",
      current_blocker: "Nhóm cần phản biện hướng giải pháp rất gấp.",
      current_situations: [],
      case_summary: "",
      school: "Đại học FPT",
      course_context: "EXE101",
      team_context: {
        project_name: "Demo project",
        group_no: "1",
        team_status_summary: "Đang làm",
      },
      contact: {
        full_name: "Nguyen Van A",
        student_code: "SE12345",
        team_role: "Leader",
        zalo: "0912345678",
        email: "a@example.com",
        telegram: "",
      },
      support_needs: {
        primary_need: "critique_feasibility",
        extra_notes: "",
      },
      documents: [
        {
          source_type: "drive",
          drive_url: "https://drive.google.com/file/d/demo/view",
          document_type: "report",
          role_description: "main",
        },
      ],
      lecturer_feedback: "",
      deadline: "2099-12-31",
      urgency: "normal",
      expected_outputs: "Muốn có góp ý cụ thể",
      boundary_confirmations: ["1", "2", "3"],
    };

    try {
      await createCaseUseCase("user-1", validBody as any, {
        findPackageById: async () => ({
          id: "pkg-1",
          name: "Inactive",
          price: 100000,
          is_active: false,
          features: [],
        } as any),
        createCaseWithCheckpointAndIntake: async () => {
          throw new Error("Should not create case");
        },
      });
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "PACKAGE_INACTIVE");
    }
  });

  await t.test("payment verify - final status guard", async () => {
    const { verifyPaymentUseCase } = await import("../../../modules/payments/application/verify-payment.usecase.js");
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await verifyPaymentUseCase("admin-1", "pay-1", "paid", "", {
        findPaymentById: async () => ({ id: "pay-1", status: "paid" } as any),
      } as any);
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "FINAL_STATUS");
    }
  });

  await t.test("revision submit - final stage guard", async () => {
    const { submitRevisionUseCase } = await import(
      "../../../modules/cases/application/submit-revision.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await submitRevisionUseCase(
        "user-1",
        "case-1",
        { change_summary: "Test", documents: [{ drive_url: "url" }] } as any,
        {
          findCaseByIdWithMembersAndCheckpoints: async () => ({
            id: "case-1",
            owner_auth_user_id: "user-1",
            members: [],
            user_facing_stage: "completed",
            checkpoints: [],
          } as any)
        }
      );
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "INVALID_CASE_STAGE");
    }
  });
});
