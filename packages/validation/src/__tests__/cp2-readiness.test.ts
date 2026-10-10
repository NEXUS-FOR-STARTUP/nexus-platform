import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CP2_SELF_CHECKS, TEMPLATE_REGISTRY, computeReadiness } from "../index.js";

const cp2 = TEMPLATE_REGISTRY.cp2;
const requiredIds = cp2.phases.flatMap((p) => p.questions).filter((q) => q.classification === "required").map((q) => q.question_id);
const allAnswered = Object.fromEntries(requiredIds.map((id) => [id, "nội dung"]));
const allChecked = { cp2_selfcheck_experts: true, cp2_selfcheck_survey: true, cp2_selfcheck_ai_disclosure: true } as const;

describe("computeReadiness (CP2)", () => {
  it("empty answers: every required question is missing", () => {
    const r = computeReadiness(cp2, {}, {}, false);
    assert.equal(r.requiredDone, 0);
    assert.equal(r.requiredTotal, requiredIds.length);
    assert.deepEqual(r.missing, requiredIds);
    assert.equal(r.ready, false);
  });

  it("whitespace-only answers do not count", () => {
    const r = computeReadiness(cp2, { cp2_problem_need: "  \n\t " }, {}, false);
    assert.equal(r.requiredDone, 0);
    assert.ok(r.missing.includes("cp2_problem_need"));
  });

  it("recommended and supplemental answers do not raise requiredDone", () => {
    const r = computeReadiness(cp2, { cp2_question_bank: "x", cp2_pain_point_interviews: "x" }, {}, false);
    assert.equal(r.requiredDone, 0);
  });

  it("self-checks do not raise requiredDone but are reported", () => {
    const r = computeReadiness(cp2, {}, { cp2_selfcheck_experts: true }, false);
    assert.equal(r.requiredDone, 0);
    assert.equal(r.autoFail.length, CP2_SELF_CHECKS.length);
    assert.deepEqual(r.autoFail.filter((c) => c.checked).map((c) => c.id), ["cp2_selfcheck_experts"]);
  });

  it("ready needs all required answered and all self-checks confirmed", () => {
    assert.equal(computeReadiness(cp2, allAnswered, {}, false).ready, false);
    const r = computeReadiness(cp2, allAnswered, allChecked, false);
    assert.equal(r.ready, true);
    assert.deepEqual(r.missing, []);
  });

  it("self-check ids stay out of every phase template", () => {
    const ids = new Set(cp2.phases.flatMap((p) => p.questions.map((q) => q.question_id as string)));
    for (const c of CP2_SELF_CHECKS) assert.equal(ids.has(c.id), false);
  });

  describe("interview question-bank audit level", () => {
    const base = { cp2_research_objectives: "a", cp2_vpc_customer_profile: "b", cp2_problem_need: "c" };

    it("empty question bank + CP2 attachment: ready", () => {
      const r = computeReadiness(cp2, base, {}, true);
      assert.equal(r.interviewAuditReady, true);
    });

    it("empty question bank + no attachment: not ready", () => {
      const r = computeReadiness(cp2, base, {}, false);
      assert.equal(r.interviewAuditReady, false);
      assert.deepEqual(r.interviewAuditMissing, ["cp2_question_bank"]);
    });

    it("question bank answered without attachment: ready", () => {
      assert.equal(computeReadiness(cp2, { ...base, cp2_question_bank: "q" }, {}, false).interviewAuditReady, true);
    });

    it("missing base answers block even with attachment", () => {
      const r = computeReadiness(cp2, { cp2_problem_need: "c" }, {}, true);
      assert.equal(r.interviewAuditReady, false);
      assert.deepEqual(r.interviewAuditMissing, ["cp2_research_objectives", "cp2_vpc_customer_profile"]);
    });
  });
});
