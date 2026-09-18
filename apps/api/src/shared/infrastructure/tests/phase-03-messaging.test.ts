import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

test("Phase 03 - Messaging & reports", async (t) => {
  await t.test("send message - validation", async () => {
    const { sendMessageUseCase } = await import("../../../modules/cases/application/send-message.usecase.js");
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await sendMessageUseCase("user-1", "user", "case-1", "");
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "VALIDATION_ERROR");
    }
  });

  await t.test("edit report - draft only", async () => {
    const { editReportUseCase } = await import("../../../modules/reports/application/edit-report.usecase.js");
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await editReportUseCase("rep-1", "case-1", "new content", {
        findReportById: async () => ({ id: "rep-1", case_id: "case-1", status: "published" } as any),
      });
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "INVALID_REPORT_STATUS");
    }
  });

  await t.test("report payload - malformed JSON handling", async () => {
    const { parseReportDraftContent } = await import("../../../modules/reports/domain/report.types.js");
    const result = parseReportDraftContent("invalid json");
    assert.strictEqual(result, null);
  });

  await t.test("chat access - block pkg_ai_audit", async () => {
    const { evaluateChatAccess } = await import("../../../modules/cases/application/chat-access.js");
    const result = evaluateChatAccess({
      lockedPrice: 79000,
      stage: "under_review",
      creditBalance: 2,
      completedAt: null,
      creditExhaustedAt: null,
      packageId: "pkg_ai_audit",
    });
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, "CHAT_AI_TIER");
  });

  await t.test("chat access - allow pkg_supporter_audit and legacy paid cases", async () => {
    const { evaluateChatAccess } = await import("../../../modules/cases/application/chat-access.js");
    const supporterResult = evaluateChatAccess({
      lockedPrice: 149000,
      stage: "under_review",
      creditBalance: 2,
      completedAt: null,
      creditExhaustedAt: null,
      packageId: "pkg_supporter_audit",
    });
    assert.strictEqual(supporterResult.ok, true);
    assert.strictEqual(supporterResult.code, "CHAT_OK");

    const legacyResult = evaluateChatAccess({
      lockedPrice: 39000,
      stage: "under_review",
      creditBalance: 1,
      completedAt: null,
      creditExhaustedAt: null,
      packageId: null,
    });
    assert.strictEqual(legacyResult.ok, true);
    assert.strictEqual(legacyResult.code, "CHAT_OK");
  });
});
