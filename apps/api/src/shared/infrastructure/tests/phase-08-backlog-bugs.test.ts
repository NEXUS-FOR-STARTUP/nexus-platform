import { test } from "node:test";
import assert from "node:assert/strict";

test("phase-08 auto-done — anchor logic neo latest T11 (7 ngày)", async (t) => {
  const { isAutoDoneDue, AUTO_DONE_AFTER_MS } = await import(
    "../../../modules/cases/application/auto-done-sweep.js"
  );

  await t.test("AUTO_DONE_AFTER_MS = 7 ngày", () => {
    assert.strictEqual(AUTO_DONE_AFTER_MS, 7 * 24 * 3600_000);
  });

  await t.test("6 ngày 23h → chưa due", () => {
    const anchor = new Date(Date.now() - (7 * 24 * 3600_000 - 3600_000));
    assert.strictEqual(isAutoDoneDue(anchor), false);
  });

  await t.test("đúng 7 ngày → due", () => {
    const anchor = new Date(Date.now() - 7 * 24 * 3600_000);
    assert.strictEqual(isAutoDoneDue(anchor), true);
  });

  await t.test("8 ngày → due", () => {
    const anchor = new Date(Date.now() - 8 * 24 * 3600_000);
    assert.strictEqual(isAutoDoneDue(anchor), true);
  });

  await t.test("now param tường minh cho test boundary chính xác", () => {
    const now = new Date("2026-08-16T12:00:00Z").getTime();
    const justBefore = new Date(now - 7 * 24 * 3600_000 + 60_000);
    const exactlyAt = new Date(now - 7 * 24 * 3600_000);
    assert.strictEqual(isAutoDoneDue(justBefore, now), false);
    assert.strictEqual(isAutoDoneDue(exactlyAt, now), true);
  });
});

test("phase-08 case_deleted — realtime publish shape (#16)", async (t) => {
  const { buildCaseDeletedMessage, chatChannel } = await import(
    "../../../modules/realtime/domain/realtime.types.js"
  );

  await t.test("payload đúng shape {type, caseId}", () => {
    const msg = buildCaseDeletedMessage("case-x");
    assert.deepStrictEqual(msg, { type: "case_deleted", caseId: "case-x" });
  });

  await t.test("type luôn là case_deleted", () => {
    assert.strictEqual(buildCaseDeletedMessage("any").type, "case_deleted");
  });

  await t.test("channel publish = chat:{caseId}", () => {
    assert.strictEqual(chatChannel("case-x"), "chat:case-x");
  });

  await t.test("payload caseId khớp channel", () => {
    const caseId = "case-77";
    assert.ok(chatChannel(caseId).endsWith(caseId));
    assert.strictEqual(buildCaseDeletedMessage(caseId).caseId, caseId);
  });
});

test("phase-08 admin list — intake bucket tách khỏi review queue (#9)", async (t) => {
  const { isValidAdminCaseStage, isValidAdminInternalStatus } = await import(
    "../../../modules/admin/domain/admin.types.js"
  );
  const { isPreSubmissionStage, isFinalCaseStage, isValidCaseStage } = await import(
    "../../../modules/cases/domain/case.types.js"
  );

  await t.test("review queue filter hợp lệ: stage=submitted + internal=triage_pending", () => {
    assert.strictEqual(isValidAdminCaseStage("submitted"), true);
    assert.strictEqual(isValidAdminInternalStatus("triage_pending"), true);
  });

  await t.test("bucket intake_pending là pre-submission — nằm ngoài review queue", () => {
    assert.strictEqual(isValidCaseStage("intake_pending"), true);
    assert.strictEqual(isPreSubmissionStage("intake_pending"), true);
    assert.strictEqual(isValidAdminCaseStage("intake_pending"), false);
  });

  await t.test("terminal stages không nằm trong review queue filter", () => {
    assert.strictEqual(isFinalCaseStage("completed"), true);
    assert.strictEqual(isFinalCaseStage("rejected"), true);
    assert.strictEqual(isFinalCaseStage("closed"), true);
    assert.strictEqual(isFinalCaseStage("submitted"), false);
    assert.strictEqual(isFinalCaseStage("intake_pending"), false);
  });

  await t.test("internal_status intake_pending không tồn tại (không lẫn bucket)", () => {
    assert.strictEqual(isValidAdminInternalStatus("intake_pending"), false);
  });

  await t.test("stage/internal không hợp lệ bị chặn bởi validation", () => {
    assert.strictEqual(isValidAdminCaseStage("bogus"), false);
    assert.strictEqual(isValidAdminInternalStatus("bogus"), false);
  });
});

test("phase-08 supersede — marking khi nộp lại intake (#12)", async (t) => {
  const { buildSupersedeUpdateArgs } = await import(
    "../../../modules/cases/application/submit-intake.usecase.js"
  );

  await t.test("where nhắm case + v00 intake_document + chỉ record chưa supersede + loại record mới", () => {
    const args = buildSupersedeUpdateArgs("case-1", ["r1", "r2"]);
    assert.deepStrictEqual(args.where, {
      case_id: "case-1",
      unit_code: "v00",
      doc_type: "intake_document",
      superseded_at: null,
      id: { notIn: ["r1", "r2"] },
    });
    assert.ok(args.data.superseded_at instanceof Date);
  });

  await t.test("bao phủ mọi checkpoint — không giới hạn theo lifecycle unit", () => {
    const args = buildSupersedeUpdateArgs("case-1", ["r9"]);
    assert.strictEqual(args.where.case_id, "case-1");
    assert.ok(!("lifecycle_unit_id" in args.where));
  });

  await t.test("không đụng record revision/supporter output (unit_code khác v00)", () => {
    const args = buildSupersedeUpdateArgs("case-1", ["r9"]);
    assert.strictEqual(args.where.unit_code, "v00");
    assert.strictEqual(args.where.doc_type, "intake_document");
  });

  await t.test("không đụng record của case khác", () => {
    const args = buildSupersedeUpdateArgs("case-A", ["r1"]);
    assert.strictEqual(args.where.case_id, "case-A");
  });

  await t.test("resubmit 0 tài liệu mới → toàn bộ record cũ bị supersede", () => {
    const args = buildSupersedeUpdateArgs("case-1", []);
    assert.deepStrictEqual(args.where.id, { notIn: [] });
  });

  await t.test("now param tường minh dùng được cho test", () => {
    const fixed = new Date("2026-08-16T00:00:00Z");
    const args = buildSupersedeUpdateArgs("case-1", ["r1"], fixed);
    assert.strictEqual(args.data.superseded_at, fixed);
  });

  await t.test("record đã supersede không bị ghi đè timestamp lần nữa", () => {
    const args = buildSupersedeUpdateArgs("case-1", ["r1"], new Date("2026-08-16T00:00:00Z"));
    assert.strictEqual(args.where.superseded_at, null);
    assert.ok(args.data.superseded_at instanceof Date);
  });
});
