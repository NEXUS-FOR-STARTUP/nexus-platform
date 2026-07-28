import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

test("Phase 07 - Symflow transitions", async (t) => {
  const { applyTransition, canTransition } = await import(
    "../../../modules/cases/infrastructure/persistence/case-workflow-engine.js"
  );

  // ── canTransition tests ─────────────────────────────────────────────
  await t.test("canTransition — accept_case", () => {
    assert.strictEqual(canTransition({ internal_status: "triage_pending" }, "accept_case"), true);
    assert.strictEqual(canTransition({ internal_status: "done" }, "accept_case"), false);
    assert.strictEqual(canTransition({ internal_status: "assigned" }, "accept_case"), false);
  });

  await t.test("canTransition — assign_supporter", () => {
    assert.strictEqual(canTransition({ internal_status: "accepted_unassigned" }, "assign_supporter"), true);
    assert.strictEqual(canTransition({ internal_status: "triage_pending" }, "assign_supporter"), false);
    assert.strictEqual(canTransition({ internal_status: "supporter_working" }, "assign_supporter"), false);
  });

  await t.test("canTransition — start_work", () => {
    assert.strictEqual(canTransition({ internal_status: "assigned" }, "start_work"), true);
    assert.strictEqual(canTransition({ internal_status: "triage_pending" }, "start_work"), false);
  });

  await t.test("canTransition — request_info", () => {
    assert.strictEqual(canTransition({ internal_status: "supporter_working" }, "request_info"), true);
    assert.strictEqual(canTransition({ internal_status: "waiting_user" }, "request_info"), false);
  });

  await t.test("canTransition — resume_work", () => {
    assert.strictEqual(canTransition({ internal_status: "waiting_user" }, "resume_work"), true);
    assert.strictEqual(canTransition({ internal_status: "supporter_working" }, "resume_work"), false);
  });

  await t.test("canTransition — publish_report", () => {
    assert.strictEqual(canTransition({ internal_status: "supporter_working" }, "publish_report"), true);
    assert.strictEqual(canTransition({ internal_status: "waiting_user" }, "publish_report"), false);
  });

  await t.test("canTransition — complete_case", () => {
    assert.strictEqual(canTransition({ internal_status: "report_ready_to_publish" }, "complete_case"), true);
    assert.strictEqual(canTransition({ internal_status: "supporter_working" }, "complete_case"), false);
  });

  await t.test("canTransition — cancel", () => {
    // valid from early states
    assert.strictEqual(canTransition({ internal_status: "triage_pending" }, "cancel"), true);
    assert.strictEqual(canTransition({ internal_status: "accepted_unassigned" }, "cancel"), true);
    // invalid from assigned or later
    assert.strictEqual(canTransition({ internal_status: "assigned" }, "cancel"), false);
    assert.strictEqual(canTransition({ internal_status: "done" }, "cancel"), false);
  });

  await t.test("canTransition — unknown transition", () => {
    assert.strictEqual(canTransition({ internal_status: "triage_pending" }, "nonexistent"), false);
  });

  // ── applyTransition tests ──────────────────────────────────────────
  await t.test("applyTransition — mutates internal_status", () => {
    const caseObj = { internal_status: "triage_pending" };
    applyTransition(caseObj, "accept_case");
    assert.strictEqual(caseObj.internal_status, "accepted_unassigned");
  });

  await t.test("applyTransition — triage_pending → accepted_unassigned → assigned → supporter_working", () => {
    const caseObj = { internal_status: "triage_pending" };

    applyTransition(caseObj, "accept_case");
    assert.strictEqual(caseObj.internal_status, "accepted_unassigned");

    applyTransition(caseObj, "assign_supporter");
    assert.strictEqual(caseObj.internal_status, "assigned");

    applyTransition(caseObj, "start_work");
    assert.strictEqual(caseObj.internal_status, "supporter_working");
  });

  // ── SLA trigger tests ──────────────────────────────────────────────
  await t.test("SLA trigger — sla_deadline_at set on start_work", () => {
    const caseObj: Record<string, any> = { internal_status: "assigned", sla_deadline_at: null };
    applyTransition(caseObj, "start_work");
    assert.strictEqual(caseObj.internal_status, "supporter_working");
    assert.ok(caseObj.sla_deadline_at !== null);
    // SLA should be now + 48h (within 5s tolerance)
    const expectedSla = Date.now() + 48 * 60 * 60 * 1000;
    const actualSla = (caseObj.sla_deadline_at as Date).getTime();
    const diff = Math.abs(actualSla - expectedSla);
    assert.ok(diff < 5000, `SLA deadline diff ${diff}ms should be < 5000ms`);
  });

  await t.test("SLA trigger — sla_deadline_at NOT set on non-start_work transitions", () => {
    const caseObj = { internal_status: "accepted_unassigned", sla_deadline_at: null };
    applyTransition(caseObj, "assign_supporter");
    assert.strictEqual(caseObj.internal_status, "assigned");
    assert.strictEqual(caseObj.sla_deadline_at, null);
  });
});
