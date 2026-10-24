import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { CP3_GRADED_QUESTION_IDS, TEMPLATE_REGISTRY } from "@repo/validation";
import { AppError } from "../../../shared/domain/app-error.js";
import { TriggerOptsSchema } from "../../../modules/ai-engine/application/trigger-opts.js";
import { INPUT_ASSEMBLERS, POST_PROCESSORS, resolveAuditPlan } from "../../../modules/ai-engine/application/audit-registry.js";
import { getAuditService } from "../../../modules/ai-engine/application/audit-services.js";
import { assertCp3InputSource, evaluateCp3Answers, renderCp3Answers } from "../../../modules/ai-engine/application/cp3-audit-input.js";
import { buildCp3AgentsMd } from "../../../modules/ai-engine/application/cp3-agents-md.js";

process.env.NODE_ENV = "test";

const PROMPT_DIR = resolve(import.meta.dirname, "../../../../../../data/system-prompts");
const words = (n: number) => Array.from({ length: n }, (_, i) => `từ${i}`).join(" ");
const answered = (ids: readonly string[], text: string) => Object.fromEntries(ids.map((id) => [id, text]));

test("CP3 body rules: scope optional but only `full`, logic_check refused", () => {
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP3" }).success, true);
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP3", scope: "full", input_source: "both" }).success, true);
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP3", scope: "questionnaire" }).success, false);
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP3", submission_type: "logic_check" }).success, false);
});

test("CP3 plan: own service type, report types and prompts; one scope only", () => {
  const initial = resolveAuditPlan("CP3", "full", "initial");
  assert.equal(initial.serviceType, "cp3_audit");
  assert.equal(initial.reportType, "cp3_full");
  const resubmit = resolveAuditPlan("CP3", "full", "resubmit");
  assert.equal(resubmit.reportType, "cp3_full_resubmit");
  assert.deepEqual([...resubmit.prompts], ["cp3_audit_core_v1.md", "cp3_full_review_v1.md", "cp3_full_resubmit_v1.md"]);
  for (const prompt of resubmit.prompts) assert.ok(existsSync(resolve(PROMPT_DIR, prompt)), prompt);
  for (const [scope, sub] of [["questionnaire", "initial"], ["full", "logic_check"], ["lite", "initial"]] as const) {
    assert.throws(() => resolveAuditPlan("CP3", scope, sub), (err) => err instanceof AppError && err.status === 400);
  }
});

test("CP3 is wired into the registry and the sandbox", () => {
  assert.ok(INPUT_ASSEMBLERS.cp3_answers);
  assert.ok(POST_PROCESSORS.cp3_scored);
  const sandbox = getAuditService("CP3").sandbox(resolveAuditPlan("CP3", "full", "resubmit"), "resubmit");
  assert.equal(sandbox.tools?.length, 1);
  assert.match(sandbox.agentsMd ?? "", /cp3_full_resubmit_v1/);
  assert.doesNotMatch(buildCp3AgentsMd("initial"), /not_applicable \|/);
  assert.equal(getAuditService("CP3").lifecycleUnit, false);
});

test("cp3_answers.md carries only graded questions and no earlier-stage answers", () => {
  const template = TEMPLATE_REGISTRY.cp3.phases.flatMap((p) => p.questions.map((q) => q.question_id));
  const md = renderCp3Answers({ ...answered(template, "Nội dung nhóm"), cp1_anything: "Của giai đoạn Ý tưởng" });
  for (const id of CP3_GRADED_QUESTION_IDS) assert.ok(md.includes(`## [${id}]`), id);
  assert.equal(md.includes("Của giai đoạn Ý tưởng"), false);
});

test("answer bar counts the template questions", () => {
  assert.equal(evaluateCp3Answers(answered(CP3_GRADED_QUESTION_IDS, words(30))).ok, true);
  assert.equal(evaluateCp3Answers(answered(CP3_GRADED_QUESTION_IDS.slice(0, 2), words(30))).ok, false);
  assert.equal(evaluateCp3Answers(answered(CP3_GRADED_QUESTION_IDS, "ngắn")).ok, false);
});

test("input source gate: answers need the bar, files need a file, both need both", () => {
  const good = answered(CP3_GRADED_QUESTION_IDS, words(30));
  const code = (fn: () => void) => {
    try {
      fn();
      return null;
    } catch (err) {
      return err instanceof AppError ? err.code : "other";
    }
  };
  assert.equal(code(() => assertCp3InputSource("c", good, "answers", 0)), null);
  assert.equal(code(() => assertCp3InputSource("c", {}, "answers", 3)), "CP3_ANSWERS_TOO_THIN");
  assert.equal(code(() => assertCp3InputSource("c", {}, "files", 1)), null);
  assert.equal(code(() => assertCp3InputSource("c", good, "files", 0)), "CP3_FILES_REQUIRED");
  assert.equal(code(() => assertCp3InputSource("c", good, "both", 0)), "CP3_FILES_REQUIRED");
  assert.equal(code(() => assertCp3InputSource("c", {}, "both", 1)), "CP3_ANSWERS_TOO_THIN");
  assert.equal(code(() => assertCp3InputSource("c", good, "both", 1)), null);
});
