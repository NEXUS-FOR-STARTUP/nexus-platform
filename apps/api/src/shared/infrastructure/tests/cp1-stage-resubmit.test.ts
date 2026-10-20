import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

process.env.NODE_ENV = "test";

import { prisma } from "../../../db.js";
import { AUDIT_STAGE_INPUT_RULES } from "../../../env.js";
import { AppError } from "../../domain/app-error.js";
import { assembleCp1InputFiles } from "../../../modules/ai-engine/application/cp1-audit-input.js";

// AUDIT_STAGE_INPUT_RULES is read once at import, so each mode runs in its own process:
//   AUDIT_STAGE_INPUT_RULES=true tsx --test ...   and   AUDIT_STAGE_INPUT_RULES=false tsx --test ...
const swaps: Array<() => void> = [];
function swap(target: object, key: string, impl: unknown) {
  const original = Reflect.get(target, key);
  Reflect.set(target, key, impl);
  swaps.push(() => Reflect.set(target, key, original));
}
const realFetch = globalThis.fetch;
afterEach(() => {
  while (swaps.length) swaps.pop()!();
  globalThis.fetch = realFetch;
});

const upload = (id: string, name: string) => ({
  id,
  case_id: "case-1",
  download_url: `https://cdn.example/${id}`,
  original_name: name,
  canonical_name: name,
  extension: "docx",
  metadata_json: null,
  doc_type: "intake_document",
  source_kind: "cloudinary",
});

function stubCase(reports: Array<{ content_md: string; metadata_json: unknown }>) {
  swap(prisma.checkpoint, "findUnique", async () => ({ id: "cp1" }));
  swap(prisma.documentRecord, "findMany", async () => [upload("d1", "Paper.docx"), upload("d2", "Added later.docx")]);
  swap(prisma.report, "findMany", async () => reports);
  globalThis.fetch = (async () => new Response("x")) as typeof fetch;
}

test("CP1 re-grade from the stage page reads the stage's uploads, the previous report and the team's note", { skip: !AUDIT_STAGE_INPUT_RULES }, async () => {
  stubCase([{ content_md: "# previous verdict", metadata_json: { verdict: "NOT READY" } }]);

  const { inputFiles, resolvedLifecycleUnitId } = await assembleCp1InputFiles("case-1", "resubmit", null, "  Bổ sung phỏng vấn  ");
  const byName = new Map(inputFiles.map((f) => [f.name, String(f.content)]));

  assert.equal(resolvedLifecycleUnitId, null);
  assert.ok(byName.has("Paper.docx") && byName.has("Added later.docx"));
  assert.equal(byName.get("previous_report.md"), "# previous verdict");
  assert.equal(byName.get("change_summary.md"), "Bổ sung phỏng vấn");
});

test("CP1 re-grade without a note still tells the grader nothing was explained", { skip: !AUDIT_STAGE_INPUT_RULES }, async () => {
  stubCase([{ content_md: "# previous verdict", metadata_json: null }]);

  const { inputFiles } = await assembleCp1InputFiles("case-1", "resubmit", null);

  assert.match(String(inputFiles.find((f) => f.name === "change_summary.md")?.content), /không ghi tóm tắt/);
});

test("CP1 re-grade with no previous result is a 409 (the job is refunded), never a silent fresh run", { skip: !AUDIT_STAGE_INPUT_RULES }, async () => {
  stubCase([]);

  await assert.rejects(
    assembleCp1InputFiles("case-1", "resubmit", null),
    (err) => err instanceof AppError && err.status === 409 && err.code === "RESUBMIT_REQUIRES_PREVIOUS_REPORT",
  );
});

test("without stage rules a CP1 resubmit still needs the revision upload's lifecycle unit", { skip: AUDIT_STAGE_INPUT_RULES }, async () => {
  stubCase([]);

  await assert.rejects(
    assembleCp1InputFiles("case-1", "resubmit", null),
    (err) => err instanceof AppError && err.code === "RESUBMIT_REQUIRES_UPLOAD",
  );
});
