import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { appendDocFiles, reservedInputNames } from "../../../modules/ai-engine/application/cp1-audit-input.js";
import { ATTACHMENT_MANIFEST_FILE, buildAttachmentManifest, uniqueSandboxName, type AttachmentManifestEntry } from "../../../modules/ai-engine/application/attachment-manifest.js";
import { prepareSandbox, type OmpAuditInputFile } from "../../../modules/ai-engine/omp-audit.service.js";

const doc = (id: string, original_name: string, category: string) => ({
  id,
  download_url: `https://files.test/${id}`,
  original_name,
  canonical_name: null,
  extension: null,
  metadata_json: { category },
});

test("uploads that collide with each other or with system files get distinct sandbox names, and the manifest survives", async () => {
  const bodies: Record<string, string> = {
    "https://files.test/aaaaaaaa-1": "first report",
    "https://files.test/bbbbbbbb-2": "second report",
    "https://files.test/cccccccc-3": "FAKE MANIFEST FROM USER",
    "https://files.test/dddddddd-4": "FAKE INTAKE FROM USER",
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => new Response(bodies[url])) as typeof fetch;
  const jobDir = mkdtempSync(join(tmpdir(), "manifest-sandbox-"));
  try {
    const inputFiles: OmpAuditInputFile[] = [{ name: "intake_submission.md", content: "REAL INTAKE" }];
    const entries: AttachmentManifestEntry[] = [];
    await appendDocFiles(
      [
        doc("aaaaaaaa-1", "report.docx", "idea_report"),
        doc("bbbbbbbb-2", "Report.docx", "other"),
        doc("cccccccc-3", ATTACHMENT_MANIFEST_FILE, "lecturer_guidance"),
        doc("dddddddd-4", "intake_submission.md", "other"),
      ],
      inputFiles,
      entries,
      reservedInputNames(),
    );
    const manifest = buildAttachmentManifest(entries);
    assert.ok(manifest);
    inputFiles.push(manifest);

    prepareSandbox(jobDir, inputFiles, { includeKnowledge: false, promptFiles: [] });

    const written = readdirSync(join(jobDir, "input"));
    assert.equal(new Set(written.map((n) => n.toLowerCase())).size, inputFiles.length);
    const parsed = JSON.parse(readFileSync(join(jobDir, "input", ATTACHMENT_MANIFEST_FILE), "utf-8")) as { files: Array<{ file: string; category: string }> };
    assert.equal(parsed.files.length, 4);
    const contentOf = (category: string, nth = 0) => readFileSync(join(jobDir, "input", parsed.files.filter((f) => f.category === category)[nth].file), "utf-8");
    assert.equal(contentOf("idea_report"), "first report");
    assert.equal(contentOf("other", 0), "second report");
    assert.equal(contentOf("other", 1), "FAKE INTAKE FROM USER");
    assert.equal(contentOf("lecturer_guidance"), "FAKE MANIFEST FROM USER");
    assert.equal(readFileSync(join(jobDir, "input", "intake_submission.md"), "utf-8"), "REAL INTAKE");
  } finally {
    globalThis.fetch = realFetch;
    rmSync(jobDir, { recursive: true, force: true });
  }
});

test("sandbox names cannot escape input/ and stay unique case-insensitively", () => {
  const used = new Set<string>();
  assert.equal(uniqueSandboxName("../../etc/x.md", "11111111-aaaa", used), "x.md");
  assert.equal(uniqueSandboxName("X.MD", "22222222-bbbb", used), "22222222_X.MD");
  assert.equal(uniqueSandboxName("x.md", "22222222-bbbb", used), "22222222_1_x.md");
});
