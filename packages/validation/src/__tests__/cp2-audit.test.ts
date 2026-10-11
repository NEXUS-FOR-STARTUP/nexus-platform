import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CP2_FULL_CHECKS,
  CP2_FULL_GROUP_WEIGHTS,
  CP2_QUESTIONNAIRE_CHECKS,
  CP2_QUESTIONNAIRE_GROUP_WEIGHTS,
  CP2_SCHEMAS,
  CP2_VERDICTS,
  scoreCp2Report,
  validateCp2Report,
  type Cp2CheckStatus,
  type Cp2SchemaId,
} from "../index.js";

const PROMPT_DIR = resolve(import.meta.dirname, "../../../../data/system-prompts");
const ID_ROW = /^\| `((?:fr|qr)_[a-z0-9_]+)`/;

function promptIds(file: string): string[] {
  return readFileSync(resolve(PROMPT_DIR, file), "utf-8")
    .split(/\r?\n/)
    .map((line) => ID_ROW.exec(line)?.[1])
    .filter((id): id is string => id !== undefined);
}

const FULL_IDS = Object.keys(CP2_FULL_CHECKS);
const gates = FULL_IDS.filter((id) => CP2_FULL_CHECKS[id as keyof typeof CP2_FULL_CHECKS].tier === "gate");
const cores = FULL_IDS.filter((id) => CP2_FULL_CHECKS[id as keyof typeof CP2_FULL_CHECKS].tier === "core");

function checks(ids: string[], status: Cp2CheckStatus, overrides: Record<string, Cp2CheckStatus> = {}) {
  return ids.map((id) => ({ id, status: overrides[id] ?? status }));
}

describe("prompt id table <-> constants", () => {
  it("full review prompt lists exactly the 30 ids", () => {
    const ids = promptIds("cp2_full_review_v1.md");
    assert.equal(ids.length, 30);
    assert.deepEqual([...ids].sort(), [...FULL_IDS].sort());
  });
  it("questionnaire prompt lists exactly the 12 ids", () => {
    const ids = promptIds("cp2_questionnaire_review_v1.md");
    assert.equal(ids.length, 12);
    assert.deepEqual([...ids].sort(), Object.keys(CP2_QUESTIONNAIRE_CHECKS).sort());
  });
  it("group weights sum to 100", () => {
    assert.equal(Object.values(CP2_FULL_GROUP_WEIGHTS).reduce((a, b) => a + b, 0), 100);
    assert.equal(Object.values(CP2_QUESTIONNAIRE_GROUP_WEIGHTS).reduce((a, b) => a + b, 0), 100);
  });
  it("tiers match the plan", () => {
    assert.deepEqual(gates.sort(), ["fr_ai_disclosure", "fr_expert_gate", "fr_survey_gate"]);
    assert.equal(cores.length, 7);
  });
});

describe("scoreCp2Report (full)", () => {
  it("all pass -> 100 ready", () => {
    const s = scoreCp2Report("cp2_full_v1", checks(FULL_IDS, "pass"));
    assert.equal(s.overallScore, 100);
    assert.equal(s.verdict, CP2_VERDICTS.full.ready);
    assert.equal(s.categoryScores.evidence, 100);
  });
  it("one gate fail, rest pass -> capped 49 blocked", () => {
    const s = scoreCp2Report("cp2_full_v1", checks(FULL_IDS, "pass", { fr_expert_gate: "fail" }));
    assert.equal(s.overallScore, 49);
    assert.equal(s.verdict, CP2_VERDICTS.full.blocked);
  });
  it("gate missing counts as fail", () => {
    const s = scoreCp2Report("cp2_full_v1", checks(FULL_IDS, "pass", { fr_survey_gate: "missing" }));
    assert.ok(s.overallScore <= 49);
  });
  it("one gate partial, rest pass -> capped 74 needs work", () => {
    const s = scoreCp2Report("cp2_full_v1", checks(FULL_IDS, "pass", { fr_survey_gate: "partial" }));
    assert.equal(s.overallScore, 74);
    assert.equal(s.verdict, CP2_VERDICTS.full.needs_work);
  });
  it("gate partial + gate fail -> <= 49", () => {
    const s = scoreCp2Report("cp2_full_v1", checks(FULL_IDS, "pass", { fr_survey_gate: "partial", fr_expert_gate: "fail" }));
    assert.ok(s.overallScore <= 49);
    assert.equal(s.verdict, CP2_VERDICTS.full.blocked);
  });
  it("core missing, rest pass -> capped 74 needs work", () => {
    const s = scoreCp2Report("cp2_full_v1", checks(FULL_IDS, "pass", { fr_som_bottom_up: "missing" }));
    assert.ok(s.overallScore <= 74);
    assert.equal(s.verdict, CP2_VERDICTS.full.needs_work);
  });
  it("not_applicable leaves the denominator", () => {
    const s = scoreCp2Report("cp2_full_v1", checks(FULL_IDS, "pass", { fr_harvard: "not_applicable", fr_appendix: "not_applicable" }));
    assert.equal(s.overallScore, 100);
    assert.equal(s.categoryScores.compliance, 100);
  });
  it("partial is worth half a pass and normal weighs 1 vs core 2", () => {
    const ids = ["fr_problem_situation", "fr_segment_narrow"]; // customer: normal + core
    const s = scoreCp2Report("cp2_full_v1", [
      { id: ids[0], status: "partial" },
      { id: ids[1], status: "pass" },
    ]);
    assert.equal(s.categoryScores.customer, Math.round((100 * (0.5 + 2)) / 3));
  });
  it("group with no scored criterion is omitted and weights renormalise", () => {
    const only = FULL_IDS.filter((id) => CP2_FULL_CHECKS[id as keyof typeof CP2_FULL_CHECKS].group === "market");
    const s = scoreCp2Report("cp2_full_v1", checks(only, "pass"));
    assert.deepEqual(Object.keys(s.categoryScores), ["market"]);
    assert.equal(s.overallScore, 100);
  });
});

describe("scoreCp2Report (questionnaire)", () => {
  const ids = Object.keys(CP2_QUESTIONNAIRE_CHECKS);
  it("all pass -> ready", () => {
    const s = scoreCp2Report("cp2_questionnaire_v1", checks(ids, "pass"));
    assert.equal(s.overallScore, 100);
    assert.equal(s.verdict, CP2_VERDICTS.questionnaire.ready);
  });
  it("gate fail -> blocked, core fail -> needs work", () => {
    assert.equal(scoreCp2Report("cp2_questionnaire_v1", checks(ids, "pass", { qr_survey_minimum: "fail" })).verdict, CP2_VERDICTS.questionnaire.blocked);
    assert.equal(scoreCp2Report("cp2_questionnaire_v1", checks(ids, "pass", { qr_past_behavior: "fail" })).verdict, CP2_VERDICTS.questionnaire.needs_work);
  });
});

function validReport(schema: Cp2SchemaId) {
  const defs = CP2_SCHEMAS[schema].checks;
  return {
    schema,
    projectName: "Demo",
    checks: Object.keys(defs).map((id) => ({ id, status: "pass", evidence: [{ source: "cp2_problem_need", quote: "trích" }], note: "" })),
    calcChecks: [],
    crossIssues: [],
    itemReviews: [],
    boardQuestions: [],
    actionPlan: [],
  };
}

describe("validateCp2Report", () => {
  const allowed: Cp2SchemaId[] = ["cp2_full_v1"];
  it("accepts a complete report", () => {
    assert.equal(validateCp2Report(validReport("cp2_full_v1"), allowed).ok, true);
  });
  it("rejects a missing id", () => {
    const r = validReport("cp2_full_v1");
    r.checks.pop();
    assert.equal(validateCp2Report(r, allowed).ok, false);
  });
  it("rejects an extra or duplicate id", () => {
    const extra = validReport("cp2_full_v1");
    extra.checks.push({ id: "fr_made_up", status: "pass", evidence: [{ source: "a", quote: "b" }], note: "" });
    assert.equal(validateCp2Report(extra, allowed).ok, false);
    const dup = validReport("cp2_full_v1");
    dup.checks[1] = { ...dup.checks[0] };
    assert.equal(validateCp2Report(dup, allowed).ok, false);
  });
  it("rejects an unknown status", () => {
    const r = validReport("cp2_full_v1");
    (r.checks[0] as { status: string }).status = "great";
    assert.equal(validateCp2Report(r, allowed).ok, false);
  });
  it("rejects pass without evidence, accepts missing without evidence", () => {
    const r = validReport("cp2_full_v1");
    r.checks[0].evidence = [];
    assert.equal(validateCp2Report(r, allowed).ok, false);
    r.checks[0].status = "missing";
    assert.equal(validateCp2Report(r, allowed).ok, true);
  });
  it("rejects a schema the job may not produce", () => {
    assert.equal(validateCp2Report(validReport("cp2_questionnaire_v1"), allowed).ok, false);
    assert.equal(validateCp2Report(validReport("cp2_full_resubmit_v1"), ["cp2_full_v1", "cp2_full_resubmit_v1"]).ok, true);
  });
  it("issues never echo document content", () => {
    const r = validReport("cp2_full_v1");
    r.checks[0].evidence = [];
    const res = validateCp2Report(r, allowed);
    assert.equal(res.ok, false);
    if (!res.ok) assert.ok(res.issues.every((i) => Object.keys(i).sort().join() === "code,path"));
  });
});
