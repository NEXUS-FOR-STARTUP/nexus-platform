import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

test("Phase 07 - Payment transparency", async (t) => {
  // ================================================================
  // createPaymentUseCase (DI: findCaseByIdWithMembers + createUnpaidPayment)
  //   - New fields: transfer_content, payer_auth_user_id
  // ================================================================

  await t.test("createPaymentUseCase - generates transfer_content and sets payer", async () => {
    const { createPaymentUseCase } = await import(
      "../../../modules/payments/application/create-payment.usecase.js"
    );

    let capturedParams: any = null;
    const mockCase = {
      id: "case-1",
      case_code: "CP1-TEST-001",
      owner_auth_user_id: "user-1",
      package_id: "pkg-1",
      members: [],
    };
    const mockCreate = async (params: any) => {
      capturedParams = params;
      return { id: "pay-1", ...params };
    };

    const result = await createPaymentUseCase("user-1", {
      caseId: "case-1",
      amount: 39000,
    }, {
      findCaseByIdWithMembers: async () => mockCase as any,
      createUnpaidPayment: mockCreate as any,
    });

    // transfer_content được generate (CR prefix + caseCode + random suffix)
    assert.ok(capturedParams.transferContent);
    assert.match(capturedParams.transferContent, /^CRCP1TEST001[A-Z0-9]{4}$/);

    // payer = requester
    assert.strictEqual(capturedParams.payerAuthUserId, "user-1");

    // metadata_json chứa transfer_content (expand-contract)
    assert.ok(capturedParams.metadataJson);
    assert.strictEqual(capturedParams.metadataJson.transfer_content, capturedParams.transferContent);

    // bankInfo trả về transferContent khớp
    assert.strictEqual(result.paymentId, "pay-1");
    assert.ok(result.bankInfo);
    assert.strictEqual(result.bankInfo.transferContent, capturedParams.transferContent);
    assert.ok(result.bankInfo.qrUrl);
  });

  await t.test("createPaymentUseCase - rejects non-member (FORBIDDEN)", async () => {
    const { createPaymentUseCase } = await import(
      "../../../modules/payments/application/create-payment.usecase.js"
    );
    const { AppError } = await import("../../../shared/domain/app-error.js");

    const mockCase = {
      id: "case-1",
      case_code: "CP1-TEST-001",
      owner_auth_user_id: "user-1",
      package_id: "pkg-1",
      members: [],
    };

    try {
      await createPaymentUseCase("user-999", {
        caseId: "case-1",
        amount: 39000,
      }, {
        findCaseByIdWithMembers: async () => mockCase as any,
        createUnpaidPayment: async () => ({ id: "" } as any),
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.strictEqual(err.code, "FORBIDDEN");
    }
  });

  await t.test("createPaymentUseCase - case not found (CASE_NOT_FOUND)", async () => {
    const { createPaymentUseCase } = await import(
      "../../../modules/payments/application/create-payment.usecase.js"
    );
    const { AppError } = await import("../../../shared/domain/app-error.js");

    try {
      await createPaymentUseCase("user-1", {
        caseId: "nonexistent",
        amount: 39000,
      }, {
        findCaseByIdWithMembers: async () => null,
        createUnpaidPayment: async () => ({ id: "" } as any),
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.strictEqual(err.code, "CASE_NOT_FOUND");
    }
  });

  await t.test("createPaymentUseCase - no package_id (INVALID_PACKAGE)", async () => {
    const { createPaymentUseCase } = await import(
      "../../../modules/payments/application/create-payment.usecase.js"
    );
    const { AppError } = await import("../../../shared/domain/app-error.js");

    const mockCase = {
      id: "case-1",
      case_code: "CP1-TEST-001",
      owner_auth_user_id: "user-1",
      package_id: null,
      members: [],
    };

    try {
      await createPaymentUseCase("user-1", {
        caseId: "case-1",
        amount: 39000,
      }, {
        findCaseByIdWithMembers: async () => mockCase as any,
        createUnpaidPayment: async () => ({ id: "" } as any),
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.strictEqual(err.code, "INVALID_PACKAGE");
    }
  });

  // ================================================================
  // getPaymentUseCase (DI: findPaymentById)
  //   - New fields: transfer_content, currency, payment_method
  // ================================================================

  await t.test("getPaymentUseCase - returns new fields from column", async () => {
    const { getPaymentUseCase } = await import(
      "../../../modules/payments/application/get-payment.usecase.js"
    );

    const mockPayment = {
      id: "pay-1",
      case_id: "case-1",
      package_id: "pkg-1",
      amount: 39000,
      status: "paid",
      proof_file_url: null,
      rejection_reason: null,
      verified_by_auth_user_id: null,
      verified_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      transfer_content: "CRCP1TEST001ABCD",
      currency: "VND",
      payment_method: "bank_transfer",
      metadata_json: null,
      case: { case_code: "CP1-TEST-001" },
    };

    const result = await getPaymentUseCase("user-1", "pay-1", {
      findPaymentById: async () => mockPayment as any,
    });

    assert.strictEqual(result.transfer_content, "CRCP1TEST001ABCD");
    assert.strictEqual(result.currency, "VND");
    assert.strictEqual(result.payment_method, "bank_transfer");
    assert.strictEqual(result.bankInfo.transferContent, "CRCP1TEST001ABCD");
  });

  await t.test("getPaymentUseCase - fallback to metadata_json when column NULL", async () => {
    const { getPaymentUseCase } = await import(
      "../../../modules/payments/application/get-payment.usecase.js"
    );

    const mockPayment = {
      id: "pay-2",
      case_id: "case-1",
      package_id: "pkg-1",
      amount: 39000,
      status: "unpaid",
      proof_file_url: null,
      rejection_reason: null,
      verified_by_auth_user_id: null,
      verified_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      transfer_content: null,
      currency: "VND",
      payment_method: "bank_transfer",
      metadata_json: { transfer_content: "CRCP1TEST001OLD" },
      case: { case_code: "CP1-TEST-001" },
    };

    const result = await getPaymentUseCase("user-1", "pay-2", {
      findPaymentById: async () => mockPayment as any,
    });

    // transfer_content trong response là raw column (null)
    // bankInfo.transferContent là resolved value (fallback từ metadata)
    assert.strictEqual(result.transfer_content, null);
    assert.strictEqual(result.bankInfo.transferContent, "CRCP1TEST001OLD");
  });

  await t.test("getPaymentUseCase - defaults when column + metadata null", async () => {
    const { getPaymentUseCase } = await import(
      "../../../modules/payments/application/get-payment.usecase.js"
    );

    const mockPayment = {
      id: "pay-3",
      case_id: "case-1",
      package_id: "pkg-1",
      amount: 39000,
      status: "unpaid",
      proof_file_url: null,
      rejection_reason: null,
      verified_by_auth_user_id: null,
      verified_at: null,
      created_at: new Date(),
      updated_at: new Date(),
      transfer_content: null,
      currency: "VND",
      payment_method: null as string | null,
      metadata_json: null,
      case: { case_code: "CP1-TEST-001" },
    };

    const result = await getPaymentUseCase("user-1", "pay-3", {
      findPaymentById: async () => mockPayment as any,
    });

    // currency defaults to VND
    assert.strictEqual(result.currency, "VND");
    // payment_method defaults to bank_transfer
    assert.strictEqual(result.payment_method, "bank_transfer");
    // transfer_content falls back to generated value in bankInfo
    assert.match(result.bankInfo.transferContent, /^CRCP1TEST001[A-Z0-9]{4}$/);
  });

  await t.test("getPaymentUseCase - 404 on missing payment", async () => {
    const { getPaymentUseCase } = await import(
      "../../../modules/payments/application/get-payment.usecase.js"
    );
    const { AppError } = await import("../../../shared/domain/app-error.js");

    try {
      await getPaymentUseCase("user-1", "nonexistent", {
        findPaymentById: async () => null,
      });
      assert.fail("Should throw");
    } catch (err: any) {
      assert.strictEqual(err.code, "PAYMENT_NOT_FOUND");
    }
  });

  // ================================================================
  // sepayWebhookUseCase (no DI — pure logic branches only)
  //   - New fields: bank_transaction_id, bank_credited_at (written)
  // ================================================================

  await t.test("sepayWebhookUseCase - outgoing transactions ignored", async () => {
    const { sepayWebhookUseCase } = await import(
      "../../../modules/payments/application/sepay-webhook.usecase.js"
    );

    const result = await sepayWebhookUseCase({
      id: 1,
      gateway: "sepay",
      transactionDate: "2026-07-25T10:30:00Z",
      accountNumber: "0909090909",
      code: null,
      content: "",
      transferType: "out",
      transferAmount: 39000,
      accumulated: 0,
      subAccount: null,
      referenceCode: "",
    });

    assert.strictEqual(result.action, "ignored");
    assert.strictEqual(result.matched, false);
  });

  await t.test("sepayWebhookUseCase - no code returns no_match", async () => {
    const { sepayWebhookUseCase } = await import(
      "../../../modules/payments/application/sepay-webhook.usecase.js"
    );

    const result = await sepayWebhookUseCase({
      id: 2,
      gateway: "sepay",
      transactionDate: "2026-07-25T10:30:00Z",
      accountNumber: "0909090909",
      code: null,
      content: "no match content with no CR prefix",
      transferType: "in",
      transferAmount: 39000,
      accumulated: 0,
      subAccount: null,
      referenceCode: "",
    });

    // code null + content không có CR prefix → extractCodeFromContent returns null → no_match
    assert.strictEqual(result.action, "no_match");
    assert.strictEqual(result.matched, false);
  });
});
