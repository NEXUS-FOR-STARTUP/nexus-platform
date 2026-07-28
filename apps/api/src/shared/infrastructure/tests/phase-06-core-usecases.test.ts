import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal valid intake body that passes validateCp1Intake */
function validIntakeBody(overrides: Record<string, unknown> = {}) {
  return {
    package_id: "pkg-1",
    current_blocker: "Nhóm đang bị kẹt ở phần phản biện giải pháp và cần hỗ trợ gấp.",
    current_situations: [],
    case_summary: "Dự án nhóm đang gặp khó khăn trong việc xác định hướng giải pháp tối ưu.",
    school: "Đại học FPT",
    course_context: "EXE101",
    team_context: {
      project_name: "Demo project",
      group_no: "1",
    },
    contact: {
      full_name: "Nguyen Van A",
      student_code: "SE12345",
      team_role: "Leader",
      zalo: "0912345678",
      email: "a@example.com",
    },
    support_needs: {
      primary_need: "critique_feasibility",
    },
    documents: [
      {
        drive_url: "https://drive.google.com/file/d/demo",
        document_type: "report",
        role_description: "main",
      },
    ],
    deadline: "2099-12-31",
    expected_outputs: "Muốn có góp ý cụ thể về hướng giải pháp",
    boundary_confirmations: ["1", "2", "3"],
    ...overrides,
  };
}

test("Phase 06 - Core usecases", async (t) => {
  // -----------------------------------------------------------------------
  // createCaseUseCase (has DI)
  // -----------------------------------------------------------------------
  await t.test("createCaseUseCase - validation errors", async () => {
    const { createCaseUseCase } = await import(
      "../../../modules/cases/application/create-case.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    // Missing package_id
    try {
      await createCaseUseCase("user-1", { package_id: "" } as any);
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "VALIDATION_ERROR");
    }

    // Invalid deadline
    try {
      await createCaseUseCase("user-1", {
        ...validIntakeBody(),
        deadline: "not-a-date",
      } as any);
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "VALIDATION_ERROR");
    }
  });

  await t.test("createCaseUseCase - package not found", async () => {
    const { createCaseUseCase } = await import(
      "../../../modules/cases/application/create-case.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await createCaseUseCase("user-1", validIntakeBody() as any, {
        findPackageById: async () => null,
        createCaseWithCheckpointAndIntake: async () => {
          throw new Error("Should not reach");
        },
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "INVALID_PACKAGE");
    }
  });

  await t.test("createCaseUseCase - package inactive", async () => {
    const { createCaseUseCase } = await import(
      "../../../modules/cases/application/create-case.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await createCaseUseCase("user-1", validIntakeBody() as any, {
        findPackageById: async () => ({
          id: "pkg-1",
          name: "Inactive",
          price: 100000,
          is_active: false,
          features: [],
        } as any),
        createCaseWithCheckpointAndIntake: async () => {
          throw new Error("Should not reach");
        },
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "PACKAGE_INACTIVE");
    }
  });

  await t.test("createCaseUseCase - invalid price", async () => {
    const { createCaseUseCase } = await import(
      "../../../modules/cases/application/create-case.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await createCaseUseCase("user-1", validIntakeBody() as any, {
        findPackageById: async () => ({
          id: "pkg-1",
          name: "InvalidPrice",
          price: -1,
          is_active: true,
          features: [],
        } as any),
        createCaseWithCheckpointAndIntake: async () => {
          throw new Error("Should not reach");
        },
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "INVALID_PACKAGE_PRICE");
    }
  });

  await t.test("createCaseUseCase - P2002 retry then succeeds", async () => {
    const { createCaseUseCase } = await import(
      "../../../modules/cases/application/create-case.usecase.js"
    );
    const insertedCodes: string[] = [];

    const result = await createCaseUseCase("user-1", validIntakeBody() as any, {
      findPackageById: async () => ({
        id: "pkg-1",
        name: "Standard",
        price: 500000,
        is_active: true,
        features: [],
      } as any),
      createCaseWithCheckpointAndIntake: (async (data: any) => {
        insertedCodes.push(data.caseCode);
        // Simulate P2002 on first call, succeed on second
        if (insertedCodes.length === 1) {
          const err = new Error("Unique constraint") as any;
          err.code = "P2002";
          throw err;
        }
        return {
          id: "case-new",
          case_code: data.caseCode,
          owner_auth_user_id: data.userId,
        };
      }) as any,
    });

    assert.ok(result);
    assert.strictEqual(result.owner_auth_user_id, "user-1");
    assert.strictEqual(insertedCodes.length, 2);
    assert.notStrictEqual(insertedCodes[0], insertedCodes[1]);
  });

  await t.test("createCaseUseCase - P2002 all retries exhausted", async () => {
    const { createCaseUseCase } = await import(
      "../../../modules/cases/application/create-case.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await createCaseUseCase("user-1", validIntakeBody() as any, {
        findPackageById: async () => ({
          id: "pkg-1",
          name: "Standard",
          price: 500000,
          is_active: true,
          features: [],
        } as any),
        createCaseWithCheckpointAndIntake: async () => {
          const err = new Error("Unique constraint") as any;
          err.code = "P2002";
          throw err;
        },
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "INTERNAL_ERROR");
      assert.match(err.message, /mã case duy nhất/);
    }
  });

  await t.test("createCaseUseCase - non-P2002 error propagates", async () => {
    const { createCaseUseCase } = await import(
      "../../../modules/cases/application/create-case.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await createCaseUseCase("user-1", validIntakeBody() as any, {
        findPackageById: async () => ({
          id: "pkg-1",
          name: "Standard",
          price: 500000,
          is_active: true,
          features: [],
        } as any),
        createCaseWithCheckpointAndIntake: async () => {
          throw new AppError(500, "DB_CONNECTION", "Database down");
        },
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "DB_CONNECTION");
    }
  });

  // -----------------------------------------------------------------------
  // deleteCaseUseCase (no DI — hits real DB)
  // Only NOT_FOUND path testable without seeding
  // -----------------------------------------------------------------------
  await t.test("deleteCaseUseCase - not found", async () => {
    const { deleteCaseUseCase } = await import(
      "../../../modules/cases/application/delete-case.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await deleteCaseUseCase("user-1", "admin", "nonexistent-id");
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "NOT_FOUND");
    }
  });

  // -----------------------------------------------------------------------
  // updateCaseSettingsUseCase (no DI — hits real DB)
  // -----------------------------------------------------------------------
  await t.test("updateCaseSettingsUseCase - not found", async () => {
    const { updateCaseSettingsUseCase } = await import(
      "../../../modules/cases/application/update-case-settings.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await updateCaseSettingsUseCase("user-1", "admin", "nonexistent-id", {});
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "NOT_FOUND");
    }
  });

  // -----------------------------------------------------------------------
  // updateCaseStatusUseCase (no DI — hits real DB)
  // Domain validation (stage/internals format) IS testable before DB call
  // -----------------------------------------------------------------------
  await t.test("updateCaseStatusUseCase - not found", async () => {
    const { updateCaseStatusUseCase } = await import(
      "../../../modules/cases/application/update-case-status.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await updateCaseStatusUseCase("user-1", "admin", "nonexistent", undefined, undefined);
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "NOT_FOUND");
    }
  });

  await t.test("updateCaseStatusUseCase - invalid stage value", async () => {
    const { isValidCaseStage } = await import(
      "../../../modules/cases/domain/case.types.js"
    );
    assert.strictEqual(isValidCaseStage("invalid_stage_xyz"), false);
    assert.strictEqual(isValidCaseStage("submitted"), true);
  });

  await t.test("updateCaseStatusUseCase - invalid internal status", async () => {
    const { isValidInternalStatus } = await import(
      "../../../modules/cases/domain/case.types.js"
    );
    assert.strictEqual(isValidInternalStatus("bogus_status"), false);
    assert.strictEqual(isValidInternalStatus("triage_pending"), true);
  });

  await t.test("updateCaseStatusUseCase - stage transition rules", async () => {
    const { isValidStageTransition, isFinalCaseStage } = await import(
      "../../../modules/cases/domain/case.types.js"
    );
    assert.ok(isValidStageTransition("submitted", "under_review"));
    assert.ok(!isValidStageTransition("submitted", "completed"));
    assert.ok(!isValidStageTransition("completed", "under_review"));
    assert.ok(isFinalCaseStage("completed"));
    assert.ok(!isFinalCaseStage("submitted"));
  });

  // -----------------------------------------------------------------------
  // sendMessageUseCase (no DI — hits real DB)
  // -----------------------------------------------------------------------
  await t.test("sendMessageUseCase - empty content", async () => {
    const { sendMessageUseCase } = await import(
      "../../../modules/cases/application/send-message.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await sendMessageUseCase("user-1", "user", "case-1", "");
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "VALIDATION_ERROR");
    }
  });

  await t.test("sendMessageUseCase - max length exceeded", async () => {
    const { sendMessageUseCase } = await import(
      "../../../modules/cases/application/send-message.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await sendMessageUseCase("user-1", "user", "case-1", "x".repeat(5001));
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "VALIDATION_ERROR");
      assert.match(err.message, /5000/);
    }
  });

  await t.test("sendMessageUseCase - case not found", async () => {
    const { sendMessageUseCase } = await import(
      "../../../modules/cases/application/send-message.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await sendMessageUseCase("user-1", "user", "nonexistent", "Hello");
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "NOT_FOUND");
    }
  });

  // -----------------------------------------------------------------------
  // verifyPaymentUseCase (has DI)
  // -----------------------------------------------------------------------
  await t.test("verifyPaymentUseCase - invalid decision", async () => {
    const { verifyPaymentUseCase } = await import(
      "../../../modules/payments/application/verify-payment.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await verifyPaymentUseCase("admin-1", "pay-1", "invalid_decision" as any, "");
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "INVALID_DECISION");
    }
  });

  await t.test("verifyPaymentUseCase - rejection reason too short", async () => {
    const { verifyPaymentUseCase } = await import(
      "../../../modules/payments/application/verify-payment.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await verifyPaymentUseCase("admin-1", "pay-1", "rejected", "short");
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "VALIDATION_ERROR");
      assert.match(err.message, /Lý do từ chối/);
    }
  });

  await t.test("verifyPaymentUseCase - payment not found", async () => {
    const { verifyPaymentUseCase } = await import(
      "../../../modules/payments/application/verify-payment.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await verifyPaymentUseCase("admin-1", "pay-404", "paid", "", {
        findPaymentById: async () => null,
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "PAYMENT_NOT_FOUND");
    }
  });

  await t.test("verifyPaymentUseCase - happy path approve", async () => {
    const { verifyPaymentUseCase } = await import(
      "../../../modules/payments/application/verify-payment.usecase.js"
    );

    const result = await verifyPaymentUseCase("admin-1", "pay-1", "paid", "", {
      findPaymentById: async () => ({
        id: "pay-1",
        case_id: "case-1",
        status: "pending_verification",
      } as any),
      verifyPayment: async (data: any) => ({
        id: data.paymentId,
        status: "paid",
        rejection_reason: null,
      }),
    });

    assert.ok(result);
    assert.strictEqual(result.status, "paid");
  });

  await t.test("verifyPaymentUseCase - happy path reject", async () => {
    const { verifyPaymentUseCase } = await import(
      "../../../modules/payments/application/verify-payment.usecase.js"
    );

    const result = await verifyPaymentUseCase(
      "admin-1", "pay-2", "rejected", "Minh chứng không hợp lệ, vui lòng upload lại.",
      {
        findPaymentById: async () => ({
          id: "pay-2",
          case_id: "case-1",
          status: "pending_verification",
        } as any),
        verifyPayment: async (data: any) => ({
          id: data.paymentId,
          status: "rejected",
          rejection_reason: data.rejectionReason,
        }),
      },
    );

    assert.ok(result);
    assert.strictEqual(result.status, "rejected");
  });

  // -----------------------------------------------------------------------
  // approveReportUseCase (no DI — hits real DB)
  // -----------------------------------------------------------------------
  await t.test("approveReportUseCase - not found", async () => {
    const { approveReportUseCase } = await import(
      "../../../modules/reports/application/approve-report.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await approveReportUseCase("user-1", "nonexistent-id");
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "NOT_FOUND");
    }
  });

  // -----------------------------------------------------------------------
  // editReportUseCase (has DI)
  // -----------------------------------------------------------------------
  await t.test("editReportUseCase - not found", async () => {
    const { editReportUseCase } = await import(
      "../../../modules/reports/application/edit-report.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await editReportUseCase("nonexistent", "case-1", "content", {
        findReportById: async () => null,
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "NOT_FOUND");
    }
  });

  await t.test("editReportUseCase - case mismatch", async () => {
    const { editReportUseCase } = await import(
      "../../../modules/reports/application/edit-report.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await editReportUseCase("rep-1", "wrong-case", "content", {
        findReportById: async () => ({
          id: "rep-1",
          case_id: "case-1",
          status: "draft",
        } as any),
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "FORBIDDEN");
    }
  });

  await t.test("editReportUseCase - already published", async () => {
    const { editReportUseCase } = await import(
      "../../../modules/reports/application/edit-report.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await editReportUseCase("rep-1", "case-1", "content", {
        findReportById: async () => ({
          id: "rep-1",
          case_id: "case-1",
          status: "sent",
        } as any),
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "INVALID_REPORT_STATUS");
    }
  });

  await t.test("editReportUseCase - empty content", async () => {
    const { editReportUseCase } = await import(
      "../../../modules/reports/application/edit-report.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await editReportUseCase("rep-1", "case-1", "   ", {
        findReportById: async () => ({
          id: "rep-1",
          case_id: "case-1",
          status: "draft",
        } as any),
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "VALIDATION_ERROR");
    }
  });

  await t.test("editReportUseCase - happy path", async () => {
    const { editReportUseCase } = await import(
      "../../../modules/reports/application/edit-report.usecase.js"
    );

    const result = await editReportUseCase("rep-1", "case-1", "Updated report content", {
      findReportById: async () => ({
        id: "rep-1",
        case_id: "case-1",
        status: "draft",
      } as any),
      updateReportDraftContent: (async (_id: string, _content: string) => ({
        id: _id,
        content_md: _content,
      })) as any,
    });

    assert.ok(result);
    assert.strictEqual(result.content_md, "Updated report content");
  });

  // -----------------------------------------------------------------------
  // closeCaseUseCase (no DI — hits real DB)
  // -----------------------------------------------------------------------
  await t.test("closeCaseUseCase - not found", async () => {
    const { closeCaseUseCase } = await import(
      "../../../modules/supporter/application/close-case.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await closeCaseUseCase("sup-1", "nonexistent-id");
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "NOT_FOUND");
    }
  });

  // -----------------------------------------------------------------------
  // listCasesUseCase — smoke test
  // -----------------------------------------------------------------------
  await t.test("listCasesUseCase - returns array", async () => {
    const { listCasesUseCase } = await import(
      "../../../modules/cases/application/list-cases.usecase.js"
    );

    const result = await listCasesUseCase({ user: { id: "user-1", role: "user" } });
    assert.ok(Array.isArray(result));
  });

  // -----------------------------------------------------------------------
  // listDocumentTypesUseCase — smoke test
  // -----------------------------------------------------------------------
  await t.test("listDocumentTypesUseCase - filters by flow", async () => {
    const { listDocumentTypesUseCase } = await import(
      "../../../modules/documents/application/list-document-types.usecase.js"
    );

    const result = await listDocumentTypesUseCase({
      flow: "revision",
    });
    assert.ok(result);
    assert.ok(Array.isArray(result.items));
  });

  // -----------------------------------------------------------------------
  // getCaseDocumentWorkspaceUseCase (no DI — hits real DB)
  // -----------------------------------------------------------------------
  await t.test("getCaseDocumentWorkspaceUseCase - not found", async () => {
    const { getCaseDocumentWorkspaceUseCase } = await import(
      "../../../modules/cases/application/get-case-detail.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await getCaseDocumentWorkspaceUseCase("nonexistent-id");
      assert.fail("Should throw");
    } catch (err: any) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "NOT_FOUND");
    }
  });
});
