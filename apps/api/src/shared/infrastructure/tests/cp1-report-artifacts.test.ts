import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

process.env.NODE_ENV = "test";

import { prisma } from "../../../db.js";
import { assembleCp1InputFiles } from "../../../modules/ai-engine/application/cp1-audit-input.js";

// Prisma delegates are not plain objects, so node:test mock.method cannot wrap them: swap and restore by hand.
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

const doc = (id: string, name: string, doc_type: string, source_kind: string) => ({
  id,
  case_id: "case-1",
  download_url: `https://cdn.example/${id}`,
  original_name: name,
  canonical_name: name,
  extension: name.split(".").pop(),
  metadata_json: null,
  doc_type,
  source_kind,
});

test("CP1 initial input keeps the team's uploads and drops saved report PDFs, even though they are not `generated`", async () => {
  swap(prisma.lifecycleUnit, "findFirst", async () => ({ id: "v00", content: "intake" }));
  swap(prisma.teamFitReport, "findUnique", async () => null);
  swap(prisma.projectAnswer, "findMany", async () => []);
  swap(prisma.documentRecord, "findMany", async () => [
    doc("d1", "Paper.docx", "intake_document", "cloudinary"),
    doc("d2", "tiboo_y_tuong_lan_dau_20261013001720.pdf", "assessment_report", "cloudinary"),
    doc("d3", "export.docx", "intake_document", "generated"),
  ]);
  globalThis.fetch = (async () => new Response("x")) as typeof fetch;

  const { inputFiles } = await assembleCp1InputFiles("case-1", "initial", null);
  const names = inputFiles.map((f) => f.name);

  assert.ok(names.includes("Paper.docx"));
  assert.equal(names.some((n) => n.includes("tiboo_y_tuong")), false);
  assert.equal(names.includes("export.docx"), false);
});

test("CP1 logic_check input drops saved report PDFs of the unit", async () => {
  let where: { doc_type?: unknown } = {};
  swap(prisma.lifecycleUnit, "findFirst", async () => ({ id: "v01" }));
  swap(prisma.documentRecord, "findMany", async (args: { where: typeof where }) => ((where = args.where), []));
  swap(prisma.report, "findMany", async () => []);

  await assembleCp1InputFiles("case-1", "logic_check", null);
  assert.deepEqual(where.doc_type, { not: "assessment_report" });
});
