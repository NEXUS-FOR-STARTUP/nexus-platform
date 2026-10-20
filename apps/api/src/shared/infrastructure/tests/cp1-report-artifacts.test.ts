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

type DocWhere = { checkpoint_id?: string; source_kind?: { notIn: string[] }; doc_type?: { notIn?: string[]; not?: string } };

// Applies the same filters the database would, so the result depends on the query, not on a canned list.
function dbFilter<T extends { checkpoint_id?: string; doc_type: string; source_kind: string }>(rows: T[], where: DocWhere) {
  return rows.filter(
    (d) =>
      (where.checkpoint_id === undefined || d.checkpoint_id === where.checkpoint_id) &&
      !where.source_kind?.notIn.includes(d.source_kind) &&
      !where.doc_type?.notIn?.includes(d.doc_type) &&
      d.doc_type !== where.doc_type?.not,
  );
}

test("CP1 first grading reads only the team's CP1 uploads: no grading output, no generated exports, no CP2 uploads", async () => {
  const rows = [
    { ...doc("d1", "Paper.docx", "intake_document", "cloudinary"), checkpoint_id: "cp1" },
    { ...doc("d2", "tiboo_y_tuong_lan_dau_20261013001720.pdf", "assessment_report", "cloudinary"), checkpoint_id: "cp1" },
    { ...doc("d3", "export.docx", "guided_cp1", "system_generated"), checkpoint_id: "cp1" },
    { ...doc("d4", "CP2 Rubric.pdf", "intake_document", "cloudinary"), checkpoint_id: "cp2" },
    { ...doc("d5", "tedi_cp2_full.pdf", "assessment_report", "cloudinary"), checkpoint_id: "cp2" },
  ];
  swap(prisma.lifecycleUnit, "findFirst", async () => ({ id: "v00", content: "intake" }));
  swap(prisma.teamFitReport, "findUnique", async () => null);
  swap(prisma.projectAnswer, "findMany", async () => []);
  swap(prisma.checkpoint, "findUnique", async () => ({ id: "cp1" }));
  swap(prisma.documentRecord, "findMany", async (args: { where: DocWhere }) => dbFilter(rows, args.where));
  globalThis.fetch = (async () => new Response("x")) as typeof fetch;

  const { inputFiles } = await assembleCp1InputFiles("case-1", "initial", null);
  const names = inputFiles.map((f) => f.name).filter((n) => n !== "attachments_manifest.json");

  assert.deepEqual(names, ["intake_submission.md", "Paper.docx"]);
});

test("CP1 re-grading with no new upload reads the same files, never its earlier verdicts", async () => {
  const rows = [
    { ...doc("d1", "Paper.docx", "intake_document", "cloudinary"), checkpoint_id: "cp1" },
    { ...doc("d2", "first_run.pdf", "assessment_report", "cloudinary"), checkpoint_id: "cp1" },
    { ...doc("d3", "second_run.pdf", "assessment_report", "cloudinary"), checkpoint_id: "cp1" },
  ];
  swap(prisma.lifecycleUnit, "findFirst", async () => ({ id: "v00", content: "intake" }));
  swap(prisma.teamFitReport, "findUnique", async () => null);
  swap(prisma.projectAnswer, "findMany", async () => []);
  swap(prisma.checkpoint, "findUnique", async () => ({ id: "cp1" }));
  swap(prisma.documentRecord, "findMany", async (args: { where: DocWhere }) => dbFilter(rows, args.where));
  globalThis.fetch = (async () => new Response("x")) as typeof fetch;

  const { inputFiles } = await assembleCp1InputFiles("case-1", "initial", null);
  assert.deepEqual(inputFiles.map((f) => f.name).filter((n) => n.endsWith(".pdf")), []);
});

test("CP1 logic_check input and manifest drop saved report PDFs of the unit", async () => {
  const unitDocs = [
    doc("d1", "Paper.docx", "revision_document", "cloudinary"),
    doc("d2", "tiboo_y_tuong_lan_dau_20261013001720.pdf", "assessment_report", "cloudinary"),
  ];
  swap(prisma.lifecycleUnit, "findFirst", async () => ({ id: "v01" }));
  swap(prisma.documentRecord, "findMany", async (args: { where: DocWhere }) => dbFilter(unitDocs, args.where));
  swap(prisma.report, "findMany", async () => []);
  globalThis.fetch = (async () => new Response("x")) as typeof fetch;

  const { inputFiles } = await assembleCp1InputFiles("case-1", "logic_check", null);
  const manifest = inputFiles.find((f) => f.name === "attachments_manifest.json");

  assert.deepEqual(inputFiles.map((f) => f.name).filter((n) => n !== "attachments_manifest.json"), ["Paper.docx"]);
  assert.ok(manifest);
  assert.equal(String(manifest.content).includes("tiboo_y_tuong"), false);
});

test("CP1 writes the team's note as user_note.md; a blank note adds nothing; an upload named user_note.md cannot take its place", async () => {
  const rows = [{ ...doc("d1", "user_note.md", "intake_document", "cloudinary"), checkpoint_id: "cp1" }];
  const stub = () => {
    swap(prisma.lifecycleUnit, "findFirst", async () => ({ id: "v00", content: "intake" }));
    swap(prisma.teamFitReport, "findUnique", async () => null);
    swap(prisma.projectAnswer, "findMany", async () => []);
    swap(prisma.checkpoint, "findUnique", async () => ({ id: "cp1" }));
    swap(prisma.documentRecord, "findMany", async (args: { where: DocWhere }) => dbFilter(rows, args.where));
    globalThis.fetch = (async () => new Response("UPLOADED")) as typeof fetch;
  };

  stub();
  const withNote = await assembleCp1InputFiles("case-1", "initial", null, undefined, "  soi kỹ thị trường  ");
  const note = withNote.inputFiles.filter((f) => f.name === "user_note.md");
  assert.equal(note.length, 1);
  assert.match(String(note[0].content), /soi kỹ thị trường/);
  assert.equal(withNote.inputFiles.filter((f) => String(f.content) === "UPLOADED").length, 1);

  stub();
  const blank = await assembleCp1InputFiles("case-1", "initial", null, undefined, "   ");
  assert.equal(blank.inputFiles.filter((f) => f.name === "user_note.md" && !String(f.content).includes("UPLOADED")).length, 0);
});
