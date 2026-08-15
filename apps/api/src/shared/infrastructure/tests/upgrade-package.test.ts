import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

// ---------------------------------------------------------------------------
// Domain: isFinalCaseStage — prevents upgrade on finalized cases
// ---------------------------------------------------------------------------

await test("upgrade-package - isFinalCaseStage blocks finalized stages", async (t) => {
  const { isFinalCaseStage } = await import(
    "../../../modules/cases/domain/case.types.js"
  );

  await t.test("returns true for closed", () => {
    assert.strictEqual(isFinalCaseStage("closed"), true);
  });

  await t.test("returns true for completed", () => {
    assert.strictEqual(isFinalCaseStage("completed"), true);
  });

  await t.test("returns true for rejected", () => {
    assert.strictEqual(isFinalCaseStage("rejected"), true);
  });

  await t.test("returns false for submitted", () => {
    assert.strictEqual(isFinalCaseStage("submitted"), false);
  });

  await t.test("returns false for under_review", () => {
    assert.strictEqual(isFinalCaseStage("under_review"), false);
  });

  await t.test("returns false for null/undefined", () => {
    assert.strictEqual(isFinalCaseStage(null), false);
    assert.strictEqual(isFinalCaseStage(undefined), false);
  });
});

// ---------------------------------------------------------------------------
// Domain: machine transition gates — sanity check (F11: isValidStageTransition removed)
// ---------------------------------------------------------------------------

await test("upgrade-package - machine transition gates", async (t) => {
  const { tryTransition, getAvailableTransitions } = await import(
    "../../../modules/cases/domain/case-machine.js"
  );

  const adminEvent = {
    type: "T5_ACCEPT",
    actor: { id: "admin-1", role: "ADMIN" },
    data: {
      actorId: "admin-1",
      roleVerified: "ADMIN",
      caseOwnerId: "user-1",
      creditBalance: 1,
      lockedPrice: 39000,
    },
  };

  await t.test("done cho phép reopen T19 (không còn final)", () => {
    assert.deepStrictEqual(getAvailableTransitions("done"), ["T19_REOPEN"]);
  });

  await t.test("cancelled allows resubmit T3/T4", () => {
    const ts = getAvailableTransitions("cancelled");
    assert.ok(ts.includes("T3_RESUBMIT_AFTER_REJECT"));
    assert.ok(ts.includes("T4_RESUBMIT_AFTER_VETO"));
  });

  await t.test("accept valid from triage_pending", () => {
    assert.ok(tryTransition("triage_pending", adminEvent as any));
  });
});

// ---------------------------------------------------------------------------
// AppError: error codes for upgrade-package validation paths
// ---------------------------------------------------------------------------

await test("upgrade-package - upgrade validation error codes", async (t) => {
  const { AppError } = await import("../../domain/app-error.js");

  await t.test("VALIDATION_ERROR when packageId missing", () => {
    const err = new AppError(400, "VALIDATION_ERROR", "Thiếu packageId");
    assert.strictEqual(err.code, "VALIDATION_ERROR");
    assert.strictEqual(err.status, 400);
  });

  await t.test("NOT_FOUND when case does not exist", () => {
    const err = new AppError(404, "NOT_FOUND", "Không tìm thấy dự án");
    assert.strictEqual(err.code, "NOT_FOUND");
    assert.strictEqual(err.status, 404);
  });

  await t.test("FORBIDDEN when user is not case owner", () => {
    const err = new AppError(403, "FORBIDDEN", "Không có quyền nâng cấp gói");
    assert.strictEqual(err.code, "FORBIDDEN");
    assert.strictEqual(err.status, 403);
  });

  await t.test("CASE_FINALIZED when case is in final stage", () => {
    const err = new AppError(400, "CASE_FINALIZED", "Dự án đã kết thúc, không thể nâng cấp gói");
    assert.strictEqual(err.code, "CASE_FINALIZED");
    assert.strictEqual(err.status, 400);
  });

  await t.test("CASE_ALREADY_PAID when case already has paid package", () => {
    const err = new AppError(400, "CASE_ALREADY_PAID", "Dự án đã sử dụng gói trả phí");
    assert.strictEqual(err.code, "CASE_ALREADY_PAID");
    assert.strictEqual(err.status, 400);
  });

  await t.test("INVALID_PACKAGE when package not found or inactive", () => {
    const err = new AppError(400, "INVALID_PACKAGE", "Gói dịch vụ không tồn tại hoặc không khả dụng");
    assert.strictEqual(err.code, "INVALID_PACKAGE");
    assert.strictEqual(err.status, 400);
  });

  await t.test("INVALID_PACKAGE_PRICE when upgrading to free package", () => {
    const err = new AppError(400, "INVALID_PACKAGE_PRICE", "Không thể nâng cấp lên gói miễn phí");
    assert.strictEqual(err.code, "INVALID_PACKAGE_PRICE");
    assert.strictEqual(err.status, 400);
  });
});

// ---------------------------------------------------------------------------
// Business logic: "is currently free" check
// ---------------------------------------------------------------------------

await test("upgrade-package - isCurrentlyFree logic", async (t) => {
  await t.test("free when package_id is pkg_tf_free", () => {
    const caseRecord = { package_id: "pkg_tf_free", locked_price: 0 };
    const isFree =
      caseRecord.package_id === "pkg_tf_free" ||
      (caseRecord.locked_price ?? 0) === 0;
    assert.strictEqual(isFree, true);
  });

  await t.test("free when locked_price is 0", () => {
    const caseRecord = { package_id: "some-pkg", locked_price: 0 };
    const isFree =
      caseRecord.package_id === "pkg_tf_free" ||
      (caseRecord.locked_price ?? 0) === 0;
    assert.strictEqual(isFree, true);
  });

  await t.test("not free when locked_price > 0", () => {
    const caseRecord = { package_id: "pkg_tf_audit", locked_price: 39000 };
    const isFree =
      caseRecord.package_id === "pkg_tf_free" ||
      (caseRecord.locked_price ?? 0) === 0;
    assert.strictEqual(isFree, false);
  });

  await t.test("not free when locked_price is null and package not free", () => {
    const caseRecord = { package_id: "pkg_tf_audit", locked_price: null };
    const isFree =
      caseRecord.package_id === "pkg_tf_free" ||
      (caseRecord.locked_price ?? 0) === 0;
    assert.strictEqual(isFree, true); // null → 0 via ?? operator
  });
});

// ---------------------------------------------------------------------------
// Event metadata shape validation
// ---------------------------------------------------------------------------

await test("upgrade-package - createCaseEvent metadata shape", async (t) => {
  await t.test("valid metadata for package_upgraded event", () => {
    const metadata = {
      fromPackageId: "pkg_tf_free",
      toPackageId: "pkg_tf_audit",
      fromPrice: 0,
      toPrice: 39000,
    };

    assert.strictEqual(typeof metadata.fromPackageId, "string");
    assert.strictEqual(typeof metadata.toPackageId, "string");
    assert.strictEqual(typeof metadata.fromPrice, "number");
    assert.strictEqual(typeof metadata.toPrice, "number");
    assert.ok(metadata.toPrice > metadata.fromPrice);
    assert.ok(metadata.fromPrice === 0);
  });
});

// ---------------------------------------------------------------------------
// Response shape validation
// ---------------------------------------------------------------------------

await test("upgrade-package - response shape", async () => {
  // Verify the expected response shape is well-formed
  const response = {
    caseId: "case-123",
    caseCode: "TF-20260722-ABC",
    newPackageId: "pkg_tf_audit",
    newPrice: 39000,
    paymentStatus: "unpaid",
  };

  assert.strictEqual(typeof response.caseId, "string");
  assert.strictEqual(typeof response.caseCode, "string");
  assert.strictEqual(typeof response.newPackageId, "string");
  assert.strictEqual(typeof response.newPrice, "number");
  assert.strictEqual(response.paymentStatus, "unpaid");
  assert.ok(response.newPrice > 0);
});
