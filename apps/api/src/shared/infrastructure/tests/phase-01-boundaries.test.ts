import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL ??= "postgresql://user:pass@localhost:5432/test";
process.env.BETTER_AUTH_URL ??= "http://localhost:8000";
process.env.GOOGLE_CLIENT_ID ??= "test-client-id";
process.env.GOOGLE_CLIENT_SECRET ??= "test-client-secret";

test("Phase 01 - Backend boundaries & contracts", async (t) => {
  await t.test("case types - valid stage validation", async () => {
    const { isValidCaseStage, isValidInternalStatus, isFinalCaseStage } = await import(
      "../../../modules/cases/domain/case.types.js"
    );
    assert.ok(isValidCaseStage("submitted"));
    assert.ok(isValidCaseStage("under_review"));
    assert.ok(!isValidCaseStage("invalid_stage"));
    assert.ok(isValidInternalStatus("triage_pending"));
    assert.ok(!isValidInternalStatus("invalid_status"));
    assert.ok(isFinalCaseStage("completed"));
    assert.ok(isFinalCaseStage("rejected"));
    assert.ok(!isFinalCaseStage("submitted"));
  });

  await t.test("admin types - filter enum validation", async () => {
    const { isValidAdminCaseStage, isValidAdminInternalStatus } = await import(
      "../../../modules/admin/domain/admin.types.js"
    );
    assert.ok(isValidAdminCaseStage("submitted"));
    assert.ok(!isValidAdminCaseStage("invalid"));
    assert.ok(isValidAdminInternalStatus("triage_pending"));
    assert.ok(!isValidAdminInternalStatus("invalid"));
  });

  await t.test("report types - payload normalization", async () => {
    const { normalizeReportDraftContent, parseReportDraftContent } = await import(
      "../../../modules/reports/domain/report.types.js"
    );
    const input = {
      overall_summary: "Test summary",
      completeness_score: 75,
      findings: [
        { field: "idea", status: "needs_work", evidence: "E", reason: "R", question: "Q", next_action: "A" },
      ],
    };
    const normalized = normalizeReportDraftContent(input);
    assert.strictEqual(normalized.overall_summary, "Test summary");
    assert.strictEqual(normalized.completeness_score, 75);
    assert.strictEqual(normalized.findings.length, 1);

    const parsed = parseReportDraftContent(JSON.stringify(input));
    assert.ok(parsed);
    assert.strictEqual(parsed?.findings.length, 1);
  });

  await t.test("payment types - decision validation", async () => {
    const { isValidPaymentDecision, isFinalPaymentStatus } = await import(
      "../../../modules/payments/domain/payment.types.js"
    );
    assert.ok(isValidPaymentDecision("paid"));
    assert.ok(isValidPaymentDecision("rejected"));
    assert.ok(!isValidPaymentDecision("invalid"));
    assert.ok(isFinalPaymentStatus("paid"));
    assert.ok(isFinalPaymentStatus("rejected"));
    assert.ok(!isFinalPaymentStatus("pending_verification"));
  });

  await t.test("AppError - structured error", async () => {
    const { AppError } = await import("../../domain/app-error.js");
    const err = new AppError(400, "TEST_ERROR", "Test message", ["detail1"]);
    assert.strictEqual(err.status, 400);
    assert.strictEqual(err.code, "TEST_ERROR");
    assert.strictEqual(err.message, "Test message");
    assert.deepStrictEqual(err.details, ["detail1"]);
  });

  await t.test("document workspace assembly - selects checkpoint and counts all files", async () => {
    const { assembleDocumentWorkspace } = await import(
      "../../../modules/documents/application/assemble-document-workspace.js",
    );

    const workspace = assembleDocumentWorkspace({
      id: "case-1",
      current_checkpoint: "CP-2",
      checkpoints: [
        { id: "cp-1", checkpoint_code: "CP-1", latest_version_no: 3, latest_assessment_no: 1 },
        { id: "cp-2", checkpoint_code: "CP-2", latest_version_no: 2, latest_assessment_no: 4 },
      ],
      lifecycle_units: [
        {
          id: "u-1",
          checkpoint_id: "cp-1",
          unit_code: "v00",
          unit_type: "version",
          version_no: 1,
          assessment_no: 0,
          linked_version_no: null,
          file_url: "https://drive.google.com/file/d/demo",
          content: null,
        },
        {
          id: "u-2",
          checkpoint_id: "cp-2",
          unit_code: "v01",
          unit_type: "version",
          version_no: 2,
          assessment_no: 0,
          linked_version_no: null,
          file_url: "https://drive.google.com/file/d/demo-2",
          content: null,
        },
      ],
      document_records: [
        {
          id: "doc-1",
          checkpoint_id: "cp-1",
          lifecycle_unit_id: "u-1",
          unit_code: "v00",
          doc_type: "intake_document",
          seq: 0,
          is_primary: true,
          source_kind: "drive",
          canonical_name: "demo",
          original_name: "demo.pdf",
          extension: "pdf",
          mime_type: "application/pdf",
          file_url: "https://drive.google.com/file/d/demo",
          download_url: "https://drive.google.com/file/d/demo",
        },
        {
          id: "doc-2",
          checkpoint_id: "cp-2",
          lifecycle_unit_id: "u-2",
          unit_code: "v01",
          doc_type: "assessment_report",
          seq: 0,
          is_primary: true,
          source_kind: "generated",
          canonical_name: "report-1",
          original_name: "report.md",
          extension: "md",
          mime_type: "text/markdown",
          file_url: null,
          download_url: null,
        },
      ],
    } as any);

    assert.strictEqual(workspace.selected_checkpoint_id, "cp-2");
    assert.strictEqual(workspace.checkpoints[0].overview.total_files, 1);
    assert.strictEqual(workspace.checkpoints[1].overview.total_files, 1);
    assert.strictEqual(workspace.checkpoints[1].overview.selected_label, "Đang chọn CP-2");
  });
  await t.test("document workspace assembly - shows stage_upload files in table", async () => {
    const { assembleDocumentWorkspace } = await import(
      "../../../modules/documents/application/assemble-document-workspace.js",
    );

    const workspace = assembleDocumentWorkspace({
      id: "case-1",
      current_checkpoint: "CP1",
      checkpoints: [
        { id: "cp-1", checkpoint_code: "CP1", latest_version_no: 1, latest_assessment_no: 0 },
      ],
      lifecycle_units: [
        {
          id: "u-s1",
          checkpoint_id: "cp-1",
          unit_code: "s-abc123",
          unit_type: "stage_upload",
          version_no: 0,
          assessment_no: 0,
          linked_version_no: null,
          file_url: null,
          content: null,
        },
      ],
      document_records: [
        {
          id: "doc-s1",
          checkpoint_id: "cp-1",
          lifecycle_unit_id: "u-s1",
          unit_code: "s-abc123",
          doc_type: "revision_document",
          seq: 0,
          is_primary: true,
          source_kind: "cloudinary",
          canonical_name: "pitch",
          original_name: "pitch.pdf",
          extension: "pdf",
          mime_type: "application/pdf",
          file_url: "https://res.cloudinary.com/demo/pitch.pdf",
          download_url: "https://res.cloudinary.com/demo/pitch.pdf",
        },
      ],
    } as any);

    assert.strictEqual(workspace.checkpoints[0].overview.total_files, 1);
    assert.strictEqual(workspace.checkpoints[0].support_flow_documents.length, 1);
  });

  await t.test("document write validation - rejects bad url and keeps allowlist fields", async () => {
    const { validateDocumentWriteInputs } = await import(
      "../../../modules/documents/application/validate-document-write.js",
    );
    const { validateDocumentUrl } = await import(
      "../../../modules/documents/application/document-dto.js",
    );

    const bad = validateDocumentWriteInputs([
      { file_url: "javascript:alert(1)", original_name: "x" },
    ]);
    assert.strictEqual(bad.ok, false);
    assert.throws(
      () => validateDocumentUrl("javascript:alert(1)", "generated", { cloudinaryCloudName: "demo" }),
      /INVALID_URL_SCHEME|INVALID_URL/,
    );

    // H2 fix: reject "generated" URLs from clients (reserved for server artifacts)
    assert.throws(
      () => validateDocumentUrl("https://evil.com/malware.pdf", "generated", { cloudinaryCloudName: "demo" }),
      /GENERATED_URLS_NOT_ALLOWED_FROM_CLIENT/,
    );

    const good = validateDocumentWriteInputs([
      {
        drive_url: "https://drive.google.com/file/d/demo",
        original_name: "demo.pdf",
        doc_type: "intake_document",
        extension: "pdf",
        mime_type: "application/pdf",
      },
    ]);
    assert.strictEqual(good.ok, true);
    if (good.ok) {
      assert.deepStrictEqual(good.inputs[0], {
        original_name: "demo.pdf",
        file_url: "https://drive.google.com/file/d/demo",
        drive_url: "https://drive.google.com/file/d/demo",
        doc_type: "intake_document",
        document_type: undefined,
        extension: "pdf",
        mime_type: "application/pdf",
      });
    }
  });

  await t.test("revision submit - picks current checkpoint or latest version", async () => {
    const { submitRevisionUseCase } = await import(
      "../../../modules/cases/application/submit-revision.usecase.js",
    );

    let checkpointId = "";
    const baseDeps = {
      submitCaseRevision: async (data: any) => {
        checkpointId = data.checkpointId;
        return data;
      },
    };

    await submitRevisionUseCase(
      "user-1",
      "case-1",
      {
        change_summary: "Updated summary for revision flow",
        documents: [],
      } as any,
      {
        ...baseDeps,
        findCaseByIdWithMembersAndCheckpoints: async () => ({
          owner_auth_user_id: "user-1",
          members: [],
          user_facing_stage: "report_ready",
          current_checkpoint: "CP-2",
          checkpoints: [
            { id: "cp-1", checkpoint_code: "CP-1", latest_version_no: 3, latest_assessment_no: 1 },
            { id: "cp-2", checkpoint_code: "CP-2", latest_version_no: 2, latest_assessment_no: 4 },
          ],
        } as any),
      } as any,
    );
    assert.strictEqual(checkpointId, "cp-2");

    checkpointId = "";
    await submitRevisionUseCase(
      "user-1",
      "case-1",
      {
        change_summary: "Updated summary for revision flow",
        documents: [],
      } as any,
      {
        ...baseDeps,
        findCaseByIdWithMembersAndCheckpoints: async () => ({
          owner_auth_user_id: "user-1",
          members: [],
          user_facing_stage: "report_ready",
          checkpoints: [
            { id: "cp-1", checkpoint_code: "CP-1", latest_version_no: 3, latest_assessment_no: 1 },
            { id: "cp-2", checkpoint_code: "CP-2", latest_version_no: 5, latest_assessment_no: 0 },
          ],
        } as any),
      } as any,
    );
    assert.strictEqual(checkpointId, "cp-2");
  });

  await t.test("document record helpers - build stable ids and skip empty urls", async () => {
    const {
      buildDocumentRecordInput,
      buildDocumentRecordId,
      buildReportArtifactDocumentRecordId,
    } = await import(
      "../../../modules/documents/infrastructure/persistence/document.repository.js",
    );

    const input = buildDocumentRecordInput(
      "case-1",
      "cp-1",
      "unit-1",
      "v01",
      { file_url: "https://drive.google.com/file/d/demo", original_name: "demo.pdf" },
      0,
      "user-1",
      "revision_document",
      "outbound",
    );

    assert.ok(input);
    assert.strictEqual(
      buildDocumentRecordId(input!),
      buildDocumentRecordId({ ...input! }),
    );
    assert.strictEqual(buildReportArtifactDocumentRecordId("rep-1"), "report-artifact-rep-1");
    assert.strictEqual(
      buildDocumentRecordInput(
        "case-1",
        "cp-1",
        "unit-1",
        "v01",
        { file_url: "   " },
        0,
        "user-1",
        "revision_document",
        "outbound",
      ),
      null,
    );
  });

  await t.test("document workspace assembly - keeps mixed source actions and broken files visible", async () => {
    const { assembleDocumentWorkspace } = await import(
      "../../../modules/documents/application/assemble-document-workspace.js",
    );

    const workspace = assembleDocumentWorkspace({
      id: "case-1",
      current_checkpoint: "CP-1",
      checkpoints: [
        { id: "cp-1", checkpoint_code: "CP-1", latest_version_no: 2, latest_assessment_no: 1 },
      ],
      lifecycle_units: [
        {
          id: "u-1",
          checkpoint_id: "cp-1",
          unit_code: "v01",
          unit_type: "version",
          version_no: 1,
          assessment_no: 0,
          linked_version_no: null,
          file_url: null,
          content: null,
        },
      ],
      document_records: [
        {
          id: "doc-drive",
          checkpoint_id: "cp-1",
          lifecycle_unit_id: "u-1",
          unit_code: "v01",
          doc_type: "revision_document",
          seq: 0,
          is_primary: true,
          source_kind: "drive",
          canonical_name: "drive-doc",
          original_name: "drive.pdf",
          extension: "pdf",
          mime_type: "application/pdf",
          file_url: "https://drive.google.com/file/d/demo",
          download_url: "https://drive.google.com/file/d/demo",
        },
        {
          id: "doc-cloudinary",
          checkpoint_id: "cp-1",
          lifecycle_unit_id: "u-1",
          unit_code: "v01",
          doc_type: "revision_document",
          seq: 1,
          is_primary: false,
          source_kind: "cloudinary",
          canonical_name: "cloud-doc",
          original_name: "cloud.pdf",
          extension: "pdf",
          mime_type: "application/pdf",
          file_url: "https://res.cloudinary.com/demo/raw/upload/v1/cloud.pdf",
          download_url: "https://res.cloudinary.com/demo/raw/upload/v1/cloud.pdf",
        },
        {
          id: "doc-generated",
          checkpoint_id: "cp-1",
          lifecycle_unit_id: "u-1",
          unit_code: "v01",
          doc_type: "assessment_report",
          seq: 2,
          is_primary: false,
          source_kind: "generated",
          canonical_name: "report-1",
          original_name: "report.md",
          extension: "md",
          mime_type: "text/markdown",
          file_url: null,
          download_url: null,
        },
      ],
    } as any);

    const files = workspace.checkpoints[0].version_units[0].files;
    assert.strictEqual(files[0].open_action, "open_url_new_tab");
    assert.strictEqual(files[1].open_action, "open_url_new_tab");
    assert.strictEqual(files[2].open_action, null);
  });
});
