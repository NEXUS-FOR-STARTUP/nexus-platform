import { test } from "node:test";
import assert from "node:assert";
import { pathToFileURL } from "node:url";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test";
process.env.BETTER_AUTH_URL ??= "http://localhost:8000";
process.env.GOOGLE_CLIENT_ID ??= "test-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-client-secret";

test("backend demo regression coverage", async (t) => {
  await t.test("package list seeds defaults on empty db", async () => {
    const { listPackagesUseCase } = await import(
      "../../../modules/packages/application/list-packages.usecase.js"
    );

    const created: Array<{ name: string; price: number; features: string[] }> = [];
    const defaultPackages = [
      { name: "Seed A", price: 0, features: ["A"] },
      { name: "Seed B", price: 100, features: ["B"] },
    ];

    const packages = await listPackagesUseCase({
      findActivePackages: async () => (created.length === 0 ? [] : (created as any)),
      findAllPackages: async () => (created.length === 0 ? [] : (created as any)),
      createPackage: async (data: { name: string; price: number; features: string[] }) => {
        created.push({ ...data, is_active: true } as any);
        return { id: `pkg-${created.length}`, ...data, is_active: true } as any;
      },
      defaultPackages,
    } as any);

    assert.strictEqual(created.length, 2);
    assert.deepStrictEqual(
      created.map(({ is_active, ...pkg }: any) => pkg),
      defaultPackages,
    );
    assert.strictEqual(packages.length, 2);
  });

  await t.test("revision submit keeps attachment refs metadata-only", async () => {
    const { submitRevisionUseCase } = await import(
      "../../../modules/cases/application/submit-revision.usecase.js"
    );

    const documents = [
      { drive_url: "https://drive.google.com/drive/folders/demo", document_type: "Deck", role_description: "Main deck" },
      { file_url: "https://docs.google.com/document/d/demo", document_type: "Notes", role_description: "Notes" },
    ];

    let captured: any = null;
    const result = await submitRevisionUseCase(
      "user-1",
      "case-1",
      {
        change_summary: "Updated user research and solution framing",
        documents,
        remaining_blockers: "Need one last review round",
      } as any,
      {
        findCaseByIdWithMembersAndCheckpoints: async () => ({
          owner_auth_user_id: "user-1",
          members: [],
          user_facing_stage: "report_ready",
          checkpoints: [{ id: "cp-1", latest_version_no: 2 }],
        } as any),
        submitCaseRevision: async (data: any) => {
          captured = data;
          return { id: "rev-1", ...data } as any;
        },
      } as any,
    );

    assert.strictEqual(captured.changeSummary, "Updated user research and solution framing");
    assert.deepStrictEqual(captured.documents, [
      {
        original_name: undefined,
        file_url: "https://drive.google.com/drive/folders/demo",
        drive_url: "https://drive.google.com/drive/folders/demo",
        doc_type: undefined,
        document_type: "Deck",
        extension: undefined,
        mime_type: undefined,
      },
      {
        original_name: undefined,
        file_url: "https://docs.google.com/document/d/demo",
        drive_url: undefined,
        doc_type: undefined,
        document_type: "Notes",
        extension: undefined,
        mime_type: undefined,
      },
    ]);
    assert.strictEqual(result.id, "rev-1");
  });

  await t.test("payment proof upload cleans up on db failure", async () => {
    const { uploadPaymentProofUseCase } = await import(
      "../../../modules/payments/application/upload-payment-proof.usecase.js"
    );

    let cleaned = "";
    const result = await uploadPaymentProofUseCase(
      "user-1",
      "case-1",
      {
        name: "proof.pdf",
        size: 1024,
        arrayBuffer: async () => new ArrayBuffer(8),
      },
      {
        findCaseByIdWithAllRelations: async () => ({
          package_id: "pkg-1",
          package: { price: 199000 },
          locked_price: 199000,
          payment_status: "unpaid",
        } as any),
        saveProofFile: async () => ({
          fileUrl: "https://res.cloudinary.com/demo/image/upload/v1/proof.pdf",
          publicId: "nexus-platform/payment-proofs/proof.pdf",
          resourceType: "raw",
        }),
        deleteFile: async (publicId: string) => {
          cleaned = publicId;
        },
        submitPaymentProof: async () => {
          throw new Error("db failure");
        },
      } as any,
    ).catch((error) => error);

    assert.ok(result instanceof Error);
    assert.strictEqual(cleaned, "nexus-platform/payment-proofs/proof.pdf");
  });

  await t.test("backfill script helpers produce deterministic ids and quarantine empty urls", async () => {
    const moduleUrl = pathToFileURL(
      "E:/FPT/Semester_7/EXE101/product-workspace/nexus-platform/apps/api/src/modules/documents/infrastructure/persistence/document.repository.ts",
    ).href;
    const {
      buildDocumentRecordInput,
      buildDocumentRecordId,
      buildReportArtifactDocumentRecordId,
    } = await import(moduleUrl);

    const input = buildDocumentRecordInput(
      "case-2",
      "cp-2",
      "unit-2",
      "v02",
      { file_url: "https://docs.google.com/document/d/demo", original_name: "notes.docx" },
      1,
      "system",
      "revision_document",
      "revision",
    );

    assert.ok(input);
    assert.strictEqual(buildDocumentRecordId(input), buildDocumentRecordId({ ...input }));
    assert.strictEqual(buildReportArtifactDocumentRecordId("report-99"), "report-artifact-report-99");
    assert.strictEqual(
      buildDocumentRecordInput(
        "case-2",
        "cp-2",
        "unit-2",
        "v02",
        { file_url: "" },
        0,
        "system",
        "revision_document",
        "revision",
      ),
      null,
    );
  });
});
