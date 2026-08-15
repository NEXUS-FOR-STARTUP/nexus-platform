import { test } from "node:test";
import assert from "node:assert";
import type { Prisma } from "@prisma/client";

test("Document supersede — repository helpers", async (t) => {
  const {
    buildDocumentRecordInput,
    upsertDocumentRecordsForUnit,
    findDocumentRecordsByCaseId,
  } = await import(
    "../../../modules/documents/infrastructure/persistence/document.repository.js"
  );

  await t.test("buildDocumentRecordInput: category forces system doc_type + metadata category", () => {
    const input = buildDocumentRecordInput(
      "case-1",
      "cp-1",
      "unit-1",
      "v00",
      {
        file_url: "https://res.cloudinary.com/demo/file.pdf",
        document_type: "idea_report",
      },
      0,
      "user-1",
      "intake_document",
      "inbound",
      "idea_report",
    );

    assert.ok(input);
    assert.strictEqual(input?.doc_type, "intake_document");
    assert.deepStrictEqual(input?.metadata_json, { category: "idea_report" });
  });

  await t.test("buildDocumentRecordInput: no category keeps legacy doc_type override", () => {
    const input = buildDocumentRecordInput(
      "case-1",
      "cp-1",
      "unit-1",
      "v01",
      {
        file_url: "https://res.cloudinary.com/demo/file.pdf",
        doc_type: "revision_attachment",
      },
      1,
      "user-1",
      "revision_document",
      "outbound",
    );

    assert.ok(input);
    assert.strictEqual(input?.doc_type, "revision_attachment");
  });

  await t.test("buildDocumentRecordInput: skips empty urls", () => {
    const input = buildDocumentRecordInput(
      "case-1",
      "cp-1",
      "unit-1",
      "v00",
      { file_url: "", drive_url: "", document_type: "other" },
      0,
      "user-1",
      "intake_document",
      "inbound",
      "other",
    );
    assert.strictEqual(input, null);
  });

  await t.test("upsertDocumentRecordsForUnit: per-doc category fn + updateMany caller marks superseded", async () => {
    const createdRows: any[] = [];
    const fakeClient = {
      documentRecord: {
        upsert: async (args: any) => {
          const row = { id: args.where.id, ...args.create };
          createdRows.push(row);
          return row;
        },
      },
    };

    const docs = [
      {
        file_url: "https://res.cloudinary.com/demo/a.pdf",
        document_type: "idea_report",
      },
      {
        file_url: "https://res.cloudinary.com/demo/b.pdf",
        document_type: "pitch_deck",
      },
      { file_url: "", document_type: "other" },
    ];

    const records = await upsertDocumentRecordsForUnit(
      "case-1",
      "cp-1",
      "unit-1",
      "v00",
      docs,
      "user-1",
      "intake_document",
      "inbound",
      fakeClient as unknown as Prisma.TransactionClient,
      (doc) =>
        typeof doc.document_type === "string" && doc.document_type.trim()
          ? doc.document_type
          : undefined,
    );

    assert.strictEqual(records.length, 2);
    assert.strictEqual(createdRows[0].doc_type, "intake_document");
    assert.deepStrictEqual(createdRows[0].metadata_json, { category: "idea_report" });
    assert.deepStrictEqual(createdRows[1].metadata_json, { category: "pitch_deck" });
  });

  await t.test("findDocumentRecordsByCaseId filters superseded_at null", async () => {
    const { prisma } = await import("../../../db.js");
    const original = prisma.documentRecord.findMany;
    let captured: any = null;
    prisma.documentRecord.findMany = (async (args: any) => {
      captured = args;
      return [];
    }) as unknown as typeof prisma.documentRecord.findMany;
    try {
      await findDocumentRecordsByCaseId("case-9");
    } finally {
      prisma.documentRecord.findMany = original;
    }
    assert.deepStrictEqual(captured?.where, { case_id: "case-9", superseded_at: null });
  });
});
