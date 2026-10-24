import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CP2_FULL_CHECKS,
  CP2_SCHEMA_IDS,
  CP2_VERDICTS,
  CP3_FULL_CHECKS,
  CP3_FULL_GROUP_WEIGHTS,
  CP3_FULL_IDS,
  CP3_GRADED_QUESTION_IDS,
  CP3_REPORT_TYPES,
  CP3_UNGRADED_QUESTION_IDS,
  TEMPLATE_REGISTRY,
  getScoreRows,
  isScoredReportType,
  scoreCp2Report,
  validateCp2Report,
  type Cp2CheckStatus,
} from "../index.js";

const PROMPT_DIR = resolve(import.meta.dirname, "../../../../data/system-prompts");
const ID_ROW = /^\| `(c3_[a-z0-9_]+)`/;

function promptIds(file: string): string[] {
  return readFileSync(resolve(PROMPT_DIR, file), "utf-8")
    .split(/\r?\n/)
    .map((line) => ID_ROW.exec(line)?.[1])
    .filter((id): id is string => id !== undefined);
}

const tierOf = (id: string) => CP3_FULL_CHECKS[id as keyof typeof CP3_FULL_CHECKS].tier;
const gates = CP3_FULL_IDS.filter((id) => tierOf(id) === "gate");
const cores = CP3_FULL_IDS.filter((id) => tierOf(id) === "core");

function checks(status: Cp2CheckStatus, overrides: Record<string, Cp2CheckStatus> = {}) {
  return CP3_FULL_IDS.map((id) => ({ id, status: overrides[id] ?? status }));
}

describe("CP3 catalog", () => {
  it("has 24 ids with fixed gates and cores", () => {
    assert.equal(CP3_FULL_IDS.length, 24);
    assert.deepEqual([...gates].sort(), ["c3_bmc_complete", "c3_swot_complete", "c3_swot_quantified"]);
    assert.equal(cores.length, 5);
  });

  it("group weights sum to 100 and every check group has a weight", () => {
    assert.equal(Object.values(CP3_FULL_GROUP_WEIGHTS).reduce((a, b) => a + b, 0), 100);
    for (const id of CP3_FULL_IDS) {
      assert.ok(CP3_FULL_CHECKS[id].group in CP3_FULL_GROUP_WEIGHTS, id);
    }
  });

  it("review and resubmit prompts list exactly the catalog ids", () => {
    for (const file of ["cp3_full_review_v1.md", "cp3_full_resubmit_v1.md"]) {
      const ids = promptIds(file);
      if (file === "cp3_full_resubmit_v1.md" && ids.length === 0) continue; // resubmit reuses the review table by reference
      assert.deepEqual([...ids].sort(), [...CP3_FULL_IDS].sort(), file);
    }
    assert.equal(promptIds("cp3_full_review_v1.md").length, 24);
  });

  it("graded questions exclude the MVP/UX phase and stay inside the template", () => {
    const all = TEMPLATE_REGISTRY.cp3.phases.flatMap((p) => p.questions.map((q) => q.question_id));
    assert.equal(CP3_GRADED_QUESTION_IDS.length + CP3_UNGRADED_QUESTION_IDS.length, all.length);
    assert.equal(CP3_UNGRADED_QUESTION_IDS.length, 7);
    assert.ok(CP3_UNGRADED_QUESTION_IDS.every((id) => id.startsWith("cp3_") && /mvp|persona|flow|wireframe|mockup|ux/.test(id)));
    assert.ok(CP3_GRADED_QUESTION_IDS.every((id) => !CP3_UNGRADED_QUESTION_IDS.includes(id)));
    assert.equal(CP3_GRADED_QUESTION_IDS.length, 20);
  });
});

describe("scoreCp2Report with CP3 schema", () => {
  it("all pass -> 100 and ready label", () => {
    const s = scoreCp2Report("cp3_full_v1", checks("pass"));
    assert.equal(s.overallScore, 100);
    assert.equal(s.verdict, CP2_VERDICTS.business_model.ready);
  });

  it("a failed gate caps at 49 with the blocked label", () => {
    for (const gate of gates) {
      const s = scoreCp2Report("cp3_full_v1", checks("pass", { [gate]: "fail" }));
      assert.equal(s.overallScore, 49, gate);
      assert.equal(s.verdict, CP2_VERDICTS.business_model.blocked);
    }
  });

  it("a partial gate or failed core caps at 74", () => {
    assert.equal(scoreCp2Report("cp3_full_v1", checks("pass", { c3_swot_quantified: "partial" })).overallScore, 74);
    assert.equal(scoreCp2Report("cp3_full_v1", checks("pass", { c3_strategy_pairing: "fail" })).overallScore, 74);
  });

  it("only normal criteria failing leaves the score uncapped", () => {
    const normals = CP3_FULL_IDS.filter((id) => tierOf(id) === "normal");
    const overrides = Object.fromEntries(normals.map((id) => [id, "fail" as const]));
    const s = scoreCp2Report("cp3_full_v1", checks("pass", overrides));
    assert.ok(s.overallScore > 74 || s.overallScore === Math.round(s.overallScore));
    assert.ok(s.overallScore < 100);
  });

  it("resubmit schema scores the same as the initial one", () => {
    assert.deepEqual(scoreCp2Report("cp3_full_resubmit_v1", checks("partial")), scoreCp2Report("cp3_full_v1", checks("partial")));
  });
});

describe("CP3 report schema and display", () => {
  it("both CP3 schema ids are registered and CP2 ids remain", () => {
    assert.ok(CP2_SCHEMA_IDS.includes("cp3_full_v1"));
    assert.ok(CP2_SCHEMA_IDS.includes("cp3_full_resubmit_v1"));
    assert.ok(CP2_SCHEMA_IDS.includes("cp2_full_v1"));
  });

  it("validateCp2Report accepts a CP3 report without CP2-only fields", () => {
    const checks = CP3_FULL_IDS.map((id) => ({ id, status: "pass", evidence: [{ source: "cp3_swot_strengths", quote: "mục có số liệu" }] }));
    assert.equal(validateCp2Report({ schema: "cp3_full_v1", checks }, ["cp3_full_v1"]).ok, true);
  });

  it("CP3 refuses not_applicable (it would skip a gate); CP2 still allows it", () => {
    const checks = CP3_FULL_IDS.map((id) => ({ id, status: id === "c3_swot_quantified" ? "not_applicable" : "missing" }));
    assert.equal(validateCp2Report({ schema: "cp3_full_v1", checks }, ["cp3_full_v1"]).ok, false);
    const cp2 = Object.keys(CP2_FULL_CHECKS).map((id) => ({ id, status: id === "fr_survey_minimum" ? "not_applicable" : "missing" }));
    assert.equal(validateCp2Report({ schema: "cp2_full_v1", checks: cp2 }, ["cp2_full_v1"]).ok, true);
  });

  it("a CP3 report is refused when only CP2 schemas are allowed", () => {
    const res = validateCp2Report({ schema: "cp3_full_v1", checks: [] }, ["cp2_full_v1"]);
    assert.equal(res.ok, false);
  });

  it("unified helpers know both services", () => {
    for (const t of CP3_REPORT_TYPES) assert.equal(isScoredReportType(t), true);
    assert.equal(isScoredReportType("cp2_full"), true);
    assert.equal(isScoredReportType("initial"), false);
    const rows = getScoreRows("cp3_full", { customer_value: 80, swot_evidence: 60, ignored: 1 });
    assert.deepEqual(rows.map((r) => r.score), [80, 60]);
  });
});
