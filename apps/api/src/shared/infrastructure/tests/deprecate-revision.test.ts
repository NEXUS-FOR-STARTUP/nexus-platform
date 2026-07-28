import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";
process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

function mockCase(overrides: Record<string, unknown> = {}) {
  return {
    id: "case-1",
    package_id: "8e9289a4-1111-2222-3333-444444444444",
    owner_auth_user_id: "user-1",
    user_facing_stage: "waiting_for_revision",
    members: [{ auth_user_id: "user-1" }],
    checkpoints: [{ id: "cp-1", checkpoint_code: "cp3", latest_version_no: 1 }],
    ...overrides,
  } as any;
}

function validRevisionBody() {
  return {
    change_summary: "This is a valid change summary with enough characters",
    documents: [],
    remaining_blockers: "",
  };
}

function validUploadBody() {
  return {
    change_summary: "This is a valid change summary with enough characters",
    documents: [],
    remaining_blockers: "",
  };
}

const STALE_MOCK = (async () => {
  throw new Error("Should not reach — guard must fire first");
}) as any;

// ---------------------------------------------------------------------------
// submitRevisionUseCase
// ---------------------------------------------------------------------------

test("submitRevisionUseCase - pkg_tf_audit throws FEATURE_DEPRECATED", async () => {
  const { submitRevisionUseCase } = await import(
    "../../../modules/cases/application/submit-revision.usecase.js"
  );
  const { AppError } = await import("../../domain/app-error.js");

  try {
    await submitRevisionUseCase("user-1", "case-1", validRevisionBody() as any, {
      findCaseByIdWithMembersAndCheckpoints: async () =>
        mockCase({ package_id: "pkg_tf_audit" }),
      submitCaseRevision: STALE_MOCK,
    });
    assert.fail("Should throw FEATURE_DEPRECATED");
  } catch (err: any) {
    assert.ok(err instanceof AppError);
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.code, "FEATURE_DEPRECATED");
    assert.match(err.message, /mua thêm lượt/);
  }
});

test("submitRevisionUseCase - old package passes guard (triggers next check)", async () => {
  const { submitRevisionUseCase } = await import(
    "../../../modules/cases/application/submit-revision.usecase.js"
  );
  const { AppError } = await import("../../domain/app-error.js");

  try {
    await submitRevisionUseCase("user-1", "case-1", validRevisionBody() as any, {
      findCaseByIdWithMembersAndCheckpoints: async () =>
        mockCase({
          package_id: "8e9289a4-1111-2222-3333-444444444444",
          owner_auth_user_id: "other-user",
          members: [],
        }),
      submitCaseRevision: STALE_MOCK,
    });
    assert.fail("Should throw FORBIDDEN (not FEATURE_DEPRECATED)");
  } catch (err: any) {
    assert.ok(err instanceof AppError);
    assert.strictEqual(err.code, "FORBIDDEN");
    assert.notStrictEqual(err.code, "FEATURE_DEPRECATED");
  }
});

test("submitRevisionUseCase - empty string package_id passes guard", async () => {
  const { submitRevisionUseCase } = await import(
    "../../../modules/cases/application/submit-revision.usecase.js"
  );
  const { AppError } = await import("../../domain/app-error.js");

  try {
    await submitRevisionUseCase("user-1", "case-1", validRevisionBody() as any, {
      findCaseByIdWithMembersAndCheckpoints: async () =>
        mockCase({
          package_id: "",
          owner_auth_user_id: "other-user",
          members: [],
        }),
      submitCaseRevision: STALE_MOCK,
    });
    assert.fail("Should throw FORBIDDEN (not FEATURE_DEPRECATED)");
  } catch (err: any) {
    assert.ok(err instanceof AppError);
    assert.strictEqual(err.code, "FORBIDDEN");
    assert.notStrictEqual(err.code, "FEATURE_DEPRECATED");
  }
});

// ---------------------------------------------------------------------------
// submitRevisionUploadUseCase
// ---------------------------------------------------------------------------

test("submitRevisionUploadUseCase - pkg_tf_audit throws FEATURE_DEPRECATED", async () => {
  const { submitRevisionUploadUseCase } = await import(
    "../../../modules/cases/application/submit-revision.usecase.js"
  );
  const { AppError } = await import("../../domain/app-error.js");

  try {
    await submitRevisionUploadUseCase("user-1", "case-1", validUploadBody() as any, {
      findCaseByIdWithMembersAndCheckpoints: async () =>
        mockCase({ package_id: "pkg_tf_audit" }),
      submitCaseRevision: STALE_MOCK,
    });
    assert.fail("Should throw FEATURE_DEPRECATED");
  } catch (err: any) {
    assert.ok(err instanceof AppError);
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.code, "FEATURE_DEPRECATED");
    assert.match(err.message, /mua thêm lượt/);
  }
});

test("submitRevisionUploadUseCase - old package passes guard (triggers next check)", async () => {
  const { submitRevisionUploadUseCase } = await import(
    "../../../modules/cases/application/submit-revision.usecase.js"
  );
  const { AppError } = await import("../../domain/app-error.js");

  try {
    await submitRevisionUploadUseCase("user-1", "case-1", validUploadBody() as any, {
      findCaseByIdWithMembersAndCheckpoints: async () =>
        mockCase({
          package_id: "8e9289a4-1111-2222-3333-444444444444",
          owner_auth_user_id: "other-user",
          members: [],
        }),
      submitCaseRevision: STALE_MOCK,
    });
    assert.fail("Should throw FORBIDDEN (not FEATURE_DEPRECATED)");
  } catch (err: any) {
    assert.ok(err instanceof AppError);
    assert.strictEqual(err.code, "FORBIDDEN");
    assert.notStrictEqual(err.code, "FEATURE_DEPRECATED");
  }
});

test("submitRevisionUploadUseCase - null package_id passes guard", async () => {
  const { submitRevisionUploadUseCase } = await import(
    "../../../modules/cases/application/submit-revision.usecase.js"
  );
  const { AppError } = await import("../../domain/app-error.js");

  try {
    await submitRevisionUploadUseCase("user-1", "case-1", validUploadBody() as any, {
      findCaseByIdWithMembersAndCheckpoints: async () =>
        mockCase({
          package_id: null,
          owner_auth_user_id: "other-user",
          members: [],
        }),
      submitCaseRevision: STALE_MOCK,
    });
    assert.fail("Should throw FORBIDDEN (not FEATURE_DEPRECATED)");
  } catch (err: any) {
    assert.ok(err instanceof AppError);
    assert.strictEqual(err.code, "FORBIDDEN");
    assert.notStrictEqual(err.code, "FEATURE_DEPRECATED");
  }
});

test("submitRevisionUploadUseCase - pkg_tf_free passes guard", async () => {
  const { submitRevisionUploadUseCase } = await import(
    "../../../modules/cases/application/submit-revision.usecase.js"
  );
  const { AppError } = await import("../../domain/app-error.js");

  try {
    await submitRevisionUploadUseCase("user-1", "case-1", validUploadBody() as any, {
      findCaseByIdWithMembersAndCheckpoints: async () =>
        mockCase({
          package_id: "pkg_tf_free",
          owner_auth_user_id: "other-user",
          members: [],
        }),
      submitCaseRevision: STALE_MOCK,
    });
    assert.fail("Should throw FORBIDDEN (not FEATURE_DEPRECATED)");
  } catch (err: any) {
    assert.ok(err instanceof AppError);
    assert.strictEqual(err.code, "FORBIDDEN");
    assert.notStrictEqual(err.code, "FEATURE_DEPRECATED");
  }
});
