import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

test("Phase 02 - Case lifecycle & admin triage", async (t) => {
  await t.test("case transitions - machine tryTransition gates", async () => {
    const { tryTransition } = await import("../../../modules/cases/domain/case-machine.js");
    const baseEvent = {
      type: "T5_ACCEPT",
      actor: { id: "admin-1", role: "ADMIN" },
      data: {
        actorId: "admin-1",
        roleVerified: "ADMIN",
        caseOwnerId: "user-1",
        creditBalance: 1,
        lockedPrice: 39000,
        paymentStatus: "paid",
      },
    };
    assert.ok(tryTransition("triage_pending", baseEvent as any), "admin accept valid");
    const badEvent = { ...baseEvent, data: { ...baseEvent.data, roleVerified: "USER", actorId: "user-1" } };
    assert.equal(tryTransition("triage_pending", badEvent as any), null, "non-admin accept blocked");
    assert.equal(tryTransition("done", baseEvent as any), null, "done is terminal");
  });

  await t.test("admin accept - idempotent no-op", async () => {
    const { acceptCaseUseCase } = await import("../../../modules/admin/application/accept-case.usecase.js");
    const result = await acceptCaseUseCase("admin-1", "case-1", {
      findCaseById: async () => ({ id: "case-1", user_facing_stage: "under_review", internal_status: "accepted_unassigned" } as any),
    });
    assert.strictEqual(result.stage, "under_review");
  });

  await t.test("admin reject - validation", async () => {
    const { rejectCaseUseCase } = await import("../../../modules/admin/application/reject-case.usecase.js");
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await rejectCaseUseCase("admin-1", "case-1", "short");
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "VALIDATION_ERROR");
    }
  });

  await t.test("assign supporter - same supporter no-op", async () => {
    const { assignSupporterUseCase } = await import(
      "../../../modules/cases/application/assign-supporter.usecase.js"
    );
    const result = await assignSupporterUseCase("admin-1", "case-1", "sup-1", {
      findCaseById: async () => ({ id: "case-1", assigned_supporter_auth_user_id: "sup-1", sla_deadline_at: new Date(Date.now() + 3600_000) } as any),
      findSupporterById: async () => ({ id: "sup-1", role: "supporter", name: "Supporter 1" } as any),
    });
    assert.strictEqual(result.assigned_supporter_auth_user_id, "sup-1");
  });

  await t.test("assign supporter - invalid supporter", async () => {
    const { assignSupporterUseCase } = await import(
      "../../../modules/cases/application/assign-supporter.usecase.js"
    );
    const { AppError } = await import("../../domain/app-error.js");

    try {
      await assignSupporterUseCase("admin-1", "case-1", "invalid-sup", {
        findCaseById: async () => ({ id: "case-1", assigned_supporter_auth_user_id: null } as any),
        findSupporterById: async () => null as any,
      });
      assert.fail("Should throw");
    } catch (err) {
      assert.ok(err instanceof AppError);
      assert.strictEqual(err.code, "VALIDATION_ERROR");
    }
  });

  // recall-revision tests removed — feature deleted in Nexus Domain Flow Consolidation Phase 1 (T1.6)
});
