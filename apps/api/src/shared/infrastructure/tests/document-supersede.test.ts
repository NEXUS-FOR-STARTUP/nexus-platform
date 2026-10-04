import { test } from "node:test";
import assert from "node:assert";
import type { Prisma } from "@prisma/client";

test("Document supersede — repository helpers", async (t) => {
  const {
    buildDocumentRecordId,
    buildDocumentRecordInput,
    upsertDocumentRecord,
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
    const createdRows: Array<{ doc_type: string; metadata_json: unknown }> = [];
    const fakeClient = {
      documentRecord: {
        findFirst: async () => null,
        create: async (args: { data: { doc_type: string; metadata_json: unknown } }) => {
          createdRows.push(args.data);
          return args.data;
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

  await t.test("upsertDocumentRecord updates existing row by unit+doc_type+seq", async () => {
    const finds: Array<{ where: { lifecycle_unit_id: string; doc_type: string; seq: number } }> = [];
    const updates: Array<{ where: { id: string }; data: { superseded_at: Date | null } }> = [];
    let created = false;
    const fakeClient = {
      documentRecord: {
        findFirst: async (args: { where: { lifecycle_unit_id: string; doc_type: string; seq: number } }) => {
          finds.push(args);
          return { id: "existing-uuid" };
        },
        update: async (args: { where: { id: string }; data: { superseded_at: Date | null } }) => {
          updates.push(args);
          return { id: args.where.id };
        },
        create: async () => {
          created = true;
          throw new Error("must not create when row exists");
        },
      },
    };

    const input = buildDocumentRecordInput(
      "case-1",
      "cp-1",
      "unit-1",
      "v00",
      { file_url: "https://res.cloudinary.com/demo/a.pdf", document_type: "idea_report" },
      0,
      "user-1",
      "intake_document",
      "inbound",
      "idea_report",
    );
    assert.ok(input);

    const row = await upsertDocumentRecord(
      input!,
      fakeClient as unknown as Prisma.TransactionClient,
    );

    assert.strictEqual(row.id, "existing-uuid");
    assert.strictEqual(created, false);
    assert.deepStrictEqual(finds[0].where, {
      lifecycle_unit_id: "unit-1",
      doc_type: "intake_document",
      seq: 0,
    });
    assert.strictEqual(updates[0].where.id, "existing-uuid");
    assert.strictEqual(updates[0].data.superseded_at, null);
  });

  await t.test("upsertDocumentRecord creates hashed id when no existing unit row", async () => {
    let createdId: string | undefined;
    const fakeClient = {
      documentRecord: {
        findFirst: async () => null,
        create: async (args: { data: { id: string } }) => {
          createdId = args.data.id;
          return args.data;
        },
        update: async () => {
          throw new Error("must not update when row missing");
        },
      },
    };

    const input = buildDocumentRecordInput(
      "case-1",
      "cp-1",
      "unit-1",
      "v00",
      { file_url: "https://res.cloudinary.com/demo/a.pdf" },
      0,
      "user-1",
      "intake_document",
      "inbound",
    );
    assert.ok(input);

    await upsertDocumentRecord(
      input!,
      fakeClient as unknown as Prisma.TransactionClient,
    );

    assert.strictEqual(createdId, buildDocumentRecordId(input!));
  });

  await t.test("upsertDocumentRecord falls back to hashed id when unit is null", async () => {
    type UpsertArgs = {
      where: { id?: string };
    };
    const calls: UpsertArgs[] = [];
    const fakeClient = {
      documentRecord: {
        upsert: async (args: UpsertArgs) => {
          calls.push(args);
          return { id: args.where.id };
        },
      },
    };

    const input = buildDocumentRecordInput(
      "case-1",
      "cp-1",
      null,
      null,
      { file_url: "https://res.cloudinary.com/demo/orphan.pdf" },
      0,
      "user-1",
      "intake_document",
      "inbound",
    );
    assert.ok(input);

    await upsertDocumentRecord(
      input!,
      fakeClient as unknown as Prisma.TransactionClient,
    );

    assert.strictEqual(calls[0].where.id, buildDocumentRecordId(input!));
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
