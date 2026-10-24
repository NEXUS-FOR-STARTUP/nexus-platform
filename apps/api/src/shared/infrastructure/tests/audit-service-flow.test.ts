import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, test } from "node:test";
import { AUDIT_CHECKPOINTS } from "@app/shared";
import { TEMPLATE_REGISTRY } from "@repo/validation";
import { AUDIT_STAGE_INPUT_RULES } from "../../../env.js";
import { prisma } from "../../../db.js";
import { AppError } from "../../domain/app-error.js";
import { assertAuditPromptsPresent, resolveAuditPlan } from "../../../modules/ai-engine/application/audit-registry.js";
import { getAuditService } from "../../../modules/ai-engine/application/audit-services.js";
import { libraryFileName, loadStageContext } from "../../../modules/ai-engine/application/case-library.js";
import { TriggerOptsSchema } from "../../../modules/ai-engine/application/trigger-opts.js";

process.env.NODE_ENV = "test";

// Prisma delegates are not plain objects, so node:test mock.method cannot wrap them: swap by assignment and restore.
const swaps: Array<() => void> = [];
function swap(target: object, key: string, impl: unknown) {
  const original = Reflect.get(target, key);
  Reflect.set(target, key, impl);
  swaps.push(() => Reflect.set(target, key, original));
}
const realFetch = globalThis.fetch;
const dirs: string[] = [];
const tmp = (prefix: string) => {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  dirs.push(dir);
  return dir;
};
afterEach(() => {
  while (swaps.length) swaps.pop()!();
  globalThis.fetch = realFetch;
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const cp1QuestionId = TEMPLATE_REGISTRY.cp1.phases[0].questions[0].question_id;
const doc = (id: string, url: string | null, name: string) => ({ id, download_url: url, original_name: name, canonical_name: name, extension: "pdf", metadata_json: { category: "other" } });

function stubStage(answers: Array<{ question_id: string; answer_text: string }>, docs: unknown[]) {
  swap(prisma.projectAnswer, "findMany", async () => answers);
  swap(prisma.checkpoint, "findUnique", async () => ({ id: "cp-1" }));
  swap(prisma.documentRecord, "findMany", async () => docs);
}

test("CP1 context: answers copied into context/, documents referenced in the library, a failed download is skipped", async () => {
  stubStage([{ question_id: cp1QuestionId, answer_text: "Ý tưởng của nhóm" }], [doc("d1", "https://cdn/v1/a.pdf", "a.pdf"), doc("d2", "https://cdn/v1/bad.pdf", "bad.pdf"), doc("d3", null, "nourl.pdf")]);
  globalThis.fetch = (async (url: string) => (url.endsWith("bad.pdf") ? new Response("", { status: 500 }) : new Response("A-BYTES"))) as typeof fetch;
  const library = tmp("lib-");

  const ctx = await loadStageContext("case-1", "CP1", library);

  assert.deepEqual(ctx.files.map((f) => f.name), ["context/cp1_answers.md"]);
  assert.match(String(ctx.files[0].content), /Ý tưởng của nhóm/);
  const libName = libraryFileName("https://cdn/v1/a.pdf", "a.pdf");
  assert.deepEqual(ctx.libraryNames, [libName]);
  assert.equal(readFileSync(join(library, libName), "utf-8"), "A-BYTES");
  assert.deepEqual(ctx.entries.map((e) => [e.file, e.stage, e.role]), [
    ["context/cp1_answers.md", "CP1", "context"],
    [`../../_library/${libName}`, "CP1", "context"],
  ]);
});

test("CP1 context: nothing answered and nothing uploaded -> nothing added", async () => {
  stubStage([{ question_id: cp1QuestionId, answer_text: "   " }], []);
  const ctx = await loadStageContext("case-1", "CP1", tmp("lib-"));
  assert.deepEqual([ctx.files, ctx.entries, ctx.libraryNames], [[], [], []]);
});

test("CP2 resubmit without a previous full report is graded as initial; other types are untouched", async () => {
  const normalize = getAuditService("CP2").normalizeSubmissionType!;
  swap(prisma.report, "findFirst", async () => null);
  assert.equal(await normalize("case-1", "resubmit"), "initial");
  assert.equal(await normalize("case-1", "initial"), "initial");
  swap(prisma.report, "findFirst", async () => ({ id: "r1" }));
  assert.equal(await normalize("case-1", "resubmit"), "resubmit");
});

test("CP2 preflight rejects thin answers before any credit is charged", async () => {
  swap(prisma.checkpoint, "upsert", async () => ({ id: "cp-2" }));
  swap(prisma.checkpoint, "findUnique", async () => ({ id: "cp-2" }));
  swap(prisma.projectAnswer, "findMany", async () => []);
  swap(prisma.documentRecord, "count", async () => 0);
  const plan = resolveAuditPlan("CP2", "full", "initial");
  await assert.rejects(
    getAuditService("CP2").preflight({ caseId: "case-1", plan, submissionType: "initial", override: false }),
    (err) => err instanceof AppError && err.status === 400 && err.code === "CP2_ANSWERS_TOO_THIN",
  );
});

test("boot guard: names every missing prompt, passes when all are shipped", () => {
  const root = tmp("app-root-");
  const promptDir = join(root, "data", "system-prompts");
  mkdirSync(promptDir, { recursive: true });
  const all = new Set<string>();
  for (const service of Object.values(AUDIT_CHECKPOINTS)) {
    for (const scope of Object.values(service.scopes)) {
      for (const list of Object.values(scope.prompts) as ReadonlyArray<readonly string[]>) list.forEach((f) => all.add(f));
    }
  }
  const [missing, ...shipped] = [...all];
  for (const file of shipped) writeFileSync(join(promptDir, file), "x");
  const previous = process.env.APP_ROOT;
  process.env.APP_ROOT = root;
  try {
    assert.throws(() => assertAuditPromptsPresent(), (err) => err instanceof Error && err.message.includes(missing));
    writeFileSync(join(promptDir, missing), "x");
    assert.doesNotThrow(() => assertAuditPromptsPresent());
    assert.equal(existsSync(join(promptDir, missing)), true);
  } finally {
    if (previous === undefined) delete process.env.APP_ROOT;
    else process.env.APP_ROOT = previous;
  }
});

test("an unknown checkpoint is rejected at the trigger boundary, not defaulted to CP1", () => {
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP9" }).success, false);
});

test("CP3 resubmit without a previous report is graded as initial; other types are untouched", async () => {
  const normalize = getAuditService("CP3").normalizeSubmissionType!;
  swap(prisma.report, "findFirst", async () => null);
  assert.equal(await normalize("case-1", "resubmit"), "initial");
  assert.equal(await normalize("case-1", "initial"), "initial");
  swap(prisma.report, "findFirst", async () => ({ id: "r1" }));
  assert.equal(await normalize("case-1", "resubmit"), "resubmit");
});

test("CP3 preflight rejects thin answers before any credit is charged, and a files source without files", async () => {
  swap(prisma.checkpoint, "upsert", async () => ({ id: "cp-3" }));
  swap(prisma.checkpoint, "findUnique", async () => ({ id: "cp-3" }));
  swap(prisma.projectAnswer, "findMany", async () => []);
  swap(prisma.documentRecord, "count", async () => 0);
  const plan = resolveAuditPlan("CP3", "full", "initial");
  await assert.rejects(
    getAuditService("CP3").preflight({ caseId: "case-1", plan, submissionType: "initial", inputSource: "answers", override: false }),
    (err) => err instanceof AppError && err.status === 400 && err.code === "CP3_ANSWERS_TOO_THIN",
  );
  await assert.rejects(
    getAuditService("CP3").preflight({ caseId: "case-1", plan, submissionType: "initial", inputSource: "files", override: false }),
    (err) => err instanceof AppError && err.status === 400 && err.code === "CP3_FILES_REQUIRED",
  );
});

test("CP3 context loads each earlier stage on its own: CP1 answers are not repeated inside the CP2 file", async () => {
  const cp2QuestionId = TEMPLATE_REGISTRY.cp2.phases[0].questions[0].question_id;
  stubStage(
    [
      { question_id: cp1QuestionId, answer_text: "Câu trả lời CP1" },
      { question_id: cp2QuestionId, answer_text: "Câu trả lời CP2" },
    ],
    [],
  );
  const ctx = await loadStageContext("case-1", "CP2", tmp("lib-"), { ownAnswersOnly: true });
  const text = String(ctx.files[0].content);
  assert.match(text, /Câu trả lời CP2/);
  assert.doesNotMatch(text, /Câu trả lời CP1/);
  const accumulated = await loadStageContext("case-1", "CP2", tmp("lib-"));
  assert.match(String(accumulated.files[0].content), /Câu trả lời CP1/);
});

// AUDIT_STAGE_INPUT_RULES is read once at import, so each mode runs in its own process:
//   AUDIT_STAGE_INPUT_RULES=false tsx --test ...   and   AUDIT_STAGE_INPUT_RULES=true tsx --test ...
function stubIntake(existingReport: boolean, calls: { reportQueries: number }) {
  swap(prisma.lifecycleUnit, "findFirst", async () => ({ id: "unit-v00" }));
  swap(prisma.report, "findFirst", async () => (calls.reportQueries++, existingReport ? { id: "r1" } : null));
}
const cp1Preflight = (submissionType: "initial" | "resubmit", override: boolean) =>
  getAuditService("CP1").preflight({ caseId: "case-1", plan: resolveAuditPlan("CP1", "full", submissionType), submissionType, override });

test("CP1 preflight (stage rules off): a second initial is a 409 unless it is an override, no report or a resubmit passes", { skip: AUDIT_STAGE_INPUT_RULES }, async () => {
  const calls = { reportQueries: 0 };
  stubIntake(true, calls);
  await assert.rejects(cp1Preflight("initial", false), (err) => err instanceof AppError && err.status === 409 && err.code === "AUDIT_IN_PROGRESS");
  await assert.doesNotReject(cp1Preflight("initial", true));
  await assert.doesNotReject(cp1Preflight("resubmit", false));
  stubIntake(false, calls);
  await assert.doesNotReject(cp1Preflight("initial", false));
  swap(prisma.lifecycleUnit, "findFirst", async () => null);
  await assert.doesNotReject(cp1Preflight("initial", false));
});

test("CP1 preflight (stage rules on): an existing report never blocks and is not even queried", { skip: !AUDIT_STAGE_INPUT_RULES }, async () => {
  const calls = { reportQueries: 0 };
  stubIntake(true, calls);
  await assert.doesNotReject(cp1Preflight("initial", false));
  assert.equal(calls.reportQueries, 0);
});
