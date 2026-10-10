import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { CP2_FULL_CHECKS, CP2_SCHEMAS } from "@repo/validation";
import { extractTextFromBuffer } from "../../../modules/guided-documents/infrastructure/document-parser.js";
import { normalizeQuoteText, verifyCp2Quotes } from "../../../modules/ai-engine/application/cp2-quote-verify.js";
import { postProcessCp2Scored } from "../../../modules/ai-engine/application/cp2-audit-postprocess.js";
import { renderCp2Answers, renderSelfChecks } from "../../../modules/ai-engine/application/cp2-audit-input.js";

process.env.NODE_ENV = "test";

const ANSWERS = "## [cp2_problem_need] Vấn đề\n\nSinh viên năm 3 mất   2 giờ\nmỗi tuần để tìm tài liệu.\n";
const ev = (source: string, quote: string) => ({ source, quote });

test("quote matches after whitespace and NFC normalisation", () => {
  const nfd = "Sinh viên năm 3".normalize("NFD");
  const res = verifyCp2Quotes(
    { checks: [{ id: "fr_problem_situation", evidence: [ev("cp2_problem_need", `${nfd} mất 2 giờ mỗi\ntuần`)] }], crossIssues: [] },
    [ANSWERS],
    [],
  );
  assert.deepEqual(res, { unverified: [], unchecked: [] });
  assert.equal(normalizeQuoteText("a \n\t b"), "a b");
});

test("quote not in the source goes to unverified, once per check", () => {
  const res = verifyCp2Quotes(
    {
      checks: [{ id: "fr_problem_situation", evidence: [ev("cp2_problem_need", "mất 5 giờ mỗi tuần"), ev("cp2_problem_need", "mất 2 giờ mỗi tuần")] }],
      crossIssues: [{ evidence: [ev("cp2_problem_need", "không có trong bài")] }],
    },
    [ANSWERS],
    [],
  );
  assert.deepEqual(res.unverified, ["fr_problem_situation", "cross_issue_1"]);
});

test("xlsx quote is unchecked, never unverified", () => {
  const res = verifyCp2Quotes(
    { checks: [{ id: "fr_survey_gate", evidence: [ev("input/attachments/survey.xlsx", "123 phản hồi")] }], crossIssues: [] },
    [ANSWERS],
    [{ name: "survey.xlsx", text: null }],
  );
  assert.deepEqual(res, { unverified: [], unchecked: ["fr_survey_gate"] });
});

test("docx quote verifies against the text extracted by document-parser", async () => {
  const doc = new Document({ sections: [{ children: [new Paragraph({ children: [new TextRun("Đã phỏng vấn 25 người dùng thật trong ba tuần.")] })] }] });
  const buffer = await Packer.toBuffer(doc);
  const text = await extractTextFromBuffer(buffer, "interviews.docx");
  const good = verifyCp2Quotes(
    { checks: [{ id: "fr_interview_scale_method", evidence: [ev("interviews.docx", "phỏng vấn 25 người dùng thật")] }], crossIssues: [] },
    [ANSWERS],
    [{ name: "interviews.docx", text }],
  );
  assert.deepEqual(good.unverified, []);
  const bad = verifyCp2Quotes(
    { checks: [{ id: "fr_interview_scale_method", evidence: [ev("interviews.docx", "phỏng vấn 40 người")] }], crossIssues: [] },
    [ANSWERS],
    [{ name: "interviews.docx", text }],
  );
  assert.deepEqual(bad.unverified, ["fr_interview_scale_method"]);
});

function fullReport(quote: string) {
  return {
    schema: "cp2_full_v1",
    projectName: "Demo",
    checks: Object.keys(CP2_SCHEMAS.cp2_full_v1.checks).map((id) => ({
      id,
      status: id === "fr_expert_gate" ? "fail" : "pass",
      evidence: [ev("cp2_problem_need", quote)],
      note: "",
    })),
  };
}

test("postProcess: validates, flags unverified quotes, scores and overrides model-supplied scores", async () => {
  const dir = mkdtempSync(resolve(tmpdir(), "cp2-pp-"));
  try {
    mkdirSync(resolve(dir, "input", "attachments"), { recursive: true });
    writeFileSync(resolve(dir, "input", "cp2_answers.md"), ANSWERS);
    writeFileSync(resolve(dir, "input", "self_checks.md"), "x");
    const out = await postProcessCp2Scored({
      caseId: "c1",
      jobDir: dir,
      scope: "full",
      submissionType: "initial",
      reportJson: { ...fullReport("mất 2 giờ mỗi tuần"), overallScore: 100, verdict: "SẴN SÀNG BẢO VỆ" },
    });
    assert.equal(out.verdict, "CHƯA ĐỦ YÊU CẦU BẮT BUỘC");
    assert.ok((out.overallScore as number) <= 49);
    assert.deepEqual(out.evidenceUnverified, []);
    assert.ok("evidence" in (out.categoryScores as object));

    const flagged = await postProcessCp2Scored({ caseId: "c1", jobDir: dir, scope: "full", submissionType: "initial", reportJson: fullReport("câu bịa") });
    assert.equal((flagged.evidenceUnverified as string[]).length, Object.keys(CP2_FULL_CHECKS).length);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("postProcess: invalid report rejects with 422 and no content in the error", async () => {
  await assert.rejects(
    postProcessCp2Scored({ caseId: "c1", jobDir: tmpdir(), scope: "questionnaire", submissionType: "initial", reportJson: fullReport("bí mật") }),
    (err: unknown) => (err as { status?: number; message: string }).status === 422 && !(err as Error).message.includes("bí mật"),
  );
});

test("input renderer: verbatim answers in catalog order, unanswered marked, self-checks labelled self-declared", () => {
  const md = renderCp2Answers({ cp2_problem_need: "Nguyên văn\ncủa nhóm", cp2_selfcheck_survey: "true" });
  assert.match(md, /## \[cp2_problem_need\] .+\n\nNguyên văn\ncủa nhóm/);
  assert.match(md, /\(Nhóm chưa trả lời\)/);
  assert.ok(md.indexOf("[cp2_problem_need]") < md.indexOf("[cp2_solution]"));
  assert.ok(!md.includes("cp2_selfcheck"));
  const checks = renderSelfChecks({ cp2_selfcheck_survey: "true" });
  assert.match(checks, /nhóm tự khai/);
  assert.match(checks, /Đã xác nhận/);
  assert.match(checks, /Chưa xác nhận/);
});
