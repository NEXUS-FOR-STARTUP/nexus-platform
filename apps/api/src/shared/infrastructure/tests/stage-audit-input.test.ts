import test from "node:test";
import assert from "node:assert/strict";
import { TEMPLATE_REGISTRY } from "@repo/validation";
import { renderStageAnswers } from "../../../modules/ai-engine/application/stage-audit-input.js";

const firstId = (key: "cp1" | "cp2") => TEMPLATE_REGISTRY[key].phases[0]!.questions[0]!.question_id;

test("renderStageAnswers puts earlier stages first and drops blank answers", () => {
  const cp1 = firstId("cp1");
  const cp2 = firstId("cp2");
  const { markdown, answered } = renderStageAnswers("CP2", { [cp1]: "ý tưởng A", [cp2]: "thị trường B", cp2_other: "   " });
  assert.equal(answered, 2);
  assert.ok(markdown.indexOf("ý tưởng A") < markdown.indexOf("thị trường B"));
  assert.ok(!markdown.includes("Nhóm chưa trả lời"));
});

test("CP1 render excludes later-stage answers", () => {
  const { markdown, answered } = renderStageAnswers("CP1", { [firstId("cp2")]: "chỉ CP2" });
  assert.equal(answered, 0);
  assert.ok(!markdown.includes("chỉ CP2"));
});
