import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { CP3_FULL_IDS, CP3_REPORT_TYPES } from "@repo/validation";
import { verifyCp2Quotes } from "../../../modules/ai-engine/application/cp2-quote-verify.js";
import { CP3_QUESTION_SOURCE, postProcessCp3Scored } from "../../../modules/ai-engine/application/cp3-audit-postprocess.js";
import { AppError } from "../../domain/app-error.js";

process.env.NODE_ENV = "test";

const ANSWERS = "## [cp3_swot_strengths] Điểm mạnh\n\nĐội ngũ 5 người, đã có 120 người dùng thử.\n";
const ev = (source: string, quote: string) => ({ source, quote });
const verify = (source: string, quote: string, attachments: Array<{ name: string; text: string | null }> = []) =>
  verifyCp2Quotes({ checks: [{ id: "c3_swot_quantified", evidence: [ev(source, quote)] }], crossIssues: [] }, [ANSWERS], attachments, CP3_QUESTION_SOURCE);

test("a CP3 question id or answers file is a valid source; a wrong quote is unverified", () => {
  assert.deepEqual(verify("cp3_swot_strengths", "đã có 120 người dùng thử"), { unverified: [], unchecked: [] });
  assert.deepEqual(verify("cp3_answers.md", "đã có 120 người dùng thử"), { unverified: [], unchecked: [] });
  assert.deepEqual(verify("cp3_swot_strengths", "đã có 999 người dùng thử").unverified, ["c3_swot_quantified"]);
});

test("context material is never evidence, even when the quote is genuine text from it", () => {
  const withContext = [{ name: "cp1_answers.md", text: "Ý tưởng cũ của nhóm" }];
  assert.deepEqual(verify("context/cp1_answers.md", "Ý tưởng cũ của nhóm", withContext).unverified, ["c3_swot_quantified"]);
  assert.deepEqual(verify("../../_library/old.pdf", "bất kỳ", withContext).unverified, ["c3_swot_quantified"]);
});

test("an unreadable pptx quote is unchecked, but a CP2 question id is not a CP3 source", () => {
  const pptx = [{ name: "bmc.pptx", text: null }];
  assert.deepEqual(verify("bmc.pptx", "Doanh thu 50 triệu", pptx), { unverified: [], unchecked: ["c3_swot_quantified"] });
  // With an unreadable file present, a CP3 id that is not found stays unchecked only for non-question sources.
  assert.equal(CP3_QUESTION_SOURCE.test("cp2_problem_need"), false);
  assert.equal(CP3_QUESTION_SOURCE.test("cp3_swot_threats"), true);
});

function writeJob(answers: string | null) {
  const dir = mkdtempSync(resolve(tmpdir(), "cp3-post-"));
  mkdirSync(resolve(dir, "input"), { recursive: true });
  if (answers !== null) writeFileSync(resolve(dir, "input", "cp3_answers.md"), answers);
  return dir;
}
const report = (schema: string, status = "pass") => ({
  schema,
  projectName: "Demo",
  checks: CP3_FULL_IDS.map((id) => ({ id, status, evidence: [ev("cp3_swot_strengths", "đã có 120 người dùng thử")], note: "" })),
});

test("post-processor scores a valid CP3 report and reports unverified quotes", async () => {
  const dir = writeJob(ANSWERS);
  try {
    const ok = await postProcessCp3Scored({ caseId: "c", jobDir: dir, scope: "full", submissionType: "initial", reportJson: report("cp3_full_v1") });
    assert.equal(ok.overallScore, 100);
    assert.deepEqual(ok.evidenceUnverified, []);
    const bad = report("cp3_full_v1");
    bad.checks[0].evidence = [ev("cp3_swot_strengths", "không có trong bài")];
    const flagged = await postProcessCp3Scored({ caseId: "c", jobDir: dir, scope: "full", submissionType: "initial", reportJson: bad });
    assert.deepEqual(flagged.evidenceUnverified, [CP3_FULL_IDS[0]]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("post-processor refuses a CP2 schema and a resubmit schema on an initial run (job fails, credit refunded)", async () => {
  const dir = writeJob(ANSWERS);
  try {
    for (const [schema, submissionType] of [["cp2_full_v1", "initial"], ["cp3_full_resubmit_v1", "initial"]] as const) {
      await assert.rejects(
        postProcessCp3Scored({ caseId: "c", jobDir: dir, scope: "full", submissionType, reportJson: report(schema) }),
        (err) => err instanceof AppError && err.status === 422 && err.code === "CP3_REPORT_INVALID",
      );
    }
    const resubmit = await postProcessCp3Scored({ caseId: "c", jobDir: dir, scope: "full", submissionType: "resubmit", reportJson: report("cp3_full_resubmit_v1") });
    assert.equal(resubmit.overallScore, 100);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a missing answers snapshot leaves quotes unchecked instead of failing the job", async () => {
  const dir = writeJob(null);
  try {
    const res = await postProcessCp3Scored({ caseId: "c", jobDir: dir, scope: "full", submissionType: "initial", reportJson: report("cp3_full_v1") });
    assert.equal((res.evidenceUnchecked as string[]).length, CP3_FULL_IDS.length);
    assert.deepEqual(res.evidenceUnverified, []);
    assert.equal(CP3_REPORT_TYPES.length, 2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
