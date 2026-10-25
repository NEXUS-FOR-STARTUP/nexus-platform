import test from "node:test";
import assert from "node:assert/strict";
import { STAGES } from "@app/shared";
import { QUESTION_REGISTRY } from "@repo/validation";
import { countAnswersByStage, pickStageStatus } from "../../../modules/cases/application/derive-stage-summaries.js";

const base = { grading: false, hasReport: false, fileCount: 0, answeredCount: 0 };

test("stage status precedence: grading > result > files > drafting > not_started", () => {
  assert.equal(pickStageStatus(base), "not_started");
  assert.equal(pickStageStatus({ ...base, answeredCount: 2 }), "drafting");
  assert.equal(pickStageStatus({ ...base, answeredCount: 2, fileCount: 1 }), "files_submitted");
  assert.equal(pickStageStatus({ ...base, fileCount: 1, hasReport: true }), "has_result");
  assert.equal(pickStageStatus({ ...base, hasReport: true, grading: true }), "grading");
});

test("answer counting skips empty answers, self-checks and ids removed from the catalog, groups by stage prefix", () => {
  const counts = countAnswersByStage([
    { question_id: "cp1_team_name", answer_text: "x" },
    { question_id: "cp2_problem_need", answer_text: "  " },
    { question_id: "cp2_solution", answer_text: "ok" },
    { question_id: "cp2_selfcheck_interviews", answer_text: "true" },
    { question_id: "cp3_key_findings", answer_text: "câu đã bỏ khỏi catalog" },
  ]);
  assert.equal(counts.get("CP1"), 1);
  assert.equal(counts.get("CP2") ?? 0, 1);
  assert.equal(counts.get("CP3") ?? 0, 0);
});

test("every catalog question id carries a stage prefix", () => {
  const prefixes = STAGES.map((s) => `${s.templateKey}_`);
  for (const id of Object.keys(QUESTION_REGISTRY)) {
    assert.ok(prefixes.some((p) => id.startsWith(p)), id);
  }
});
