import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SYNC_RULES,
  TEMPLATE_REGISTRY,
  QUESTION_REGISTRY,
  buildSyncProposals,
  type SyncSources,
} from "../index.js";

const baseSources = (over: Partial<SyncSources> = {}): SyncSources => ({
  projectName: null,
  idea: null,
  team: null,
  answers: {},
  ...over,
});

const idea = {
  targetCustomer: "Sinh viên EXE101",
  problem: "Không biết bài sai ở đâu",
  solution: "Audit theo tiêu chí môn học",
  mvp: "Báo cáo audit thủ công",
};

describe("Sync rules catalog", () => {
  it("every rule targets a question that belongs to its own template and reads existing questions", () => {
    for (const [templateKey, rules] of Object.entries(SYNC_RULES)) {
      const template = TEMPLATE_REGISTRY[templateKey as keyof typeof TEMPLATE_REGISTRY];
      assert.ok(template, `unknown template ${templateKey}`);
      const ids = new Set(template.phases.flatMap((p) => p.questions.map((q) => q.question_id)));
      for (const rule of rules) {
        assert.ok(ids.has(rule.target), `${rule.target} is not in ${templateKey}`);
        for (const source of rule.from) {
          if (source.kind === "answer") {
            assert.ok(source.question_id in QUESTION_REGISTRY, `${source.question_id} is not a question`);
          }
        }
      }
    }
  });
});

describe("buildSyncProposals", () => {
  it("fills CP1 from the project name and the saved Team-Fit idea", () => {
    const { proposals } = buildSyncProposals(
      "cp1",
      baseSources({ projectName: "Nexus", idea: { ...idea } }),
    );
    const byId = Object.fromEntries(proposals.map((p) => [p.question_id, p.answer_text]));
    assert.equal(byId.cp1_team_name, "Nexus");
    assert.equal(byId.cp1_idea_name, "Nexus");
    assert.equal(byId.cp1_main_problem, idea.problem);
    assert.equal(byId.cp1_mvp_definition, idea.mvp);
  });

  it("formats Team-Fit members one per line", () => {
    const { proposals } = buildSyncProposals(
      "cp1",
      baseSources({
        team: [
          { roleLabel: "Kinh doanh", major: "Quản trị kinh doanh", strengths: ["thuyết trình", "đàm phán"] },
          { roleLabel: "Kỹ thuật", major: "Kỹ thuật phần mềm", strengths: [] },
        ],
      }),
    );
    const members = proposals.find((p) => p.question_id === "cp1_team_members");
    assert.equal(
      members?.answer_text,
      "Thành viên 1 — Kinh doanh, ngành Quản trị kinh doanh. Thế mạnh: thuyết trình; đàm phán.\n" +
        "Thành viên 2 — Kỹ thuật, ngành Kỹ thuật phần mềm.",
    );
  });

  it("never overwrites a saved answer and reports how many were skipped", () => {
    const result = buildSyncProposals(
      "cp1",
      baseSources({
        projectName: "Nexus",
        idea: { ...idea },
        answers: { cp1_team_name: "Tên tự gõ", cp1_main_problem: "  " },
      }),
    );
    const ids = result.proposals.map((p) => p.question_id);
    assert.ok(!ids.includes("cp1_team_name"));
    assert.ok(ids.includes("cp1_main_problem"), "whitespace-only answer counts as empty");
    assert.equal(result.skipped_filled, 1);
  });

  it("prefers a saved earlier answer over the Team-Fit idea when syncing CP2", () => {
    const { proposals } = buildSyncProposals(
      "cp2",
      baseSources({ idea: { ...idea }, answers: { cp1_main_problem: "Vấn đề đã chỉnh ở CP1" } }),
    );
    const problem = proposals.find((p) => p.question_id === "cp2_problem_need");
    const solution = proposals.find((p) => p.question_id === "cp2_solution");
    assert.equal(problem?.answer_text, "Vấn đề đã chỉnh ở CP1");
    assert.equal(solution?.answer_text, idea.solution, "falls back to Team-Fit when CP1 has no answer");
  });

  it("returns nothing when no source has data or the template has no rules", () => {
    assert.deepEqual(buildSyncProposals("cp1", baseSources()), { proposals: [], skipped_filled: 0 });
    assert.deepEqual(buildSyncProposals("nope", baseSources({ projectName: "X" })), {
      proposals: [],
      skipped_filled: 0,
    });
  });
});
