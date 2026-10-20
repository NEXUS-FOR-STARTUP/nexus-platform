import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { AUDIT_CHECKPOINT_CODES } from "@app/shared";
import { AppError } from "../../domain/app-error.js";
import { getAuditService } from "../../../modules/ai-engine/application/audit-services.js";
import { ensureLibraryFile, libraryFileName } from "../../../modules/ai-engine/application/case-library.js";
import { TriggerOptsSchema } from "../../../modules/ai-engine/application/trigger-opts.js";

test("every checkpoint in the lookup table has a service; unknown codes are a 400, never CP1", () => {
  for (const code of AUDIT_CHECKPOINT_CODES) assert.ok(getAuditService(code));
  for (const code of ["CP3", "", "constructor"]) {
    assert.throws(() => getAuditService(code), (err) => err instanceof AppError && err.status === 400);
  }
});

test("admin re-run keeps the CP2 scope and source; a CP1 job re-runs with defaults", () => {
  const last = { checkpoint: "CP2", scope: "full", input_source: "files", submission_type: "resubmit" };
  assert.deepEqual(getAuditService("CP2").rerunInput(last), { checkpoint: "CP2", scope: "full", input_source: "files", submission_type: "resubmit" });
  assert.deepEqual(getAuditService("CP1").rerunInput({ checkpoint: "CP1" }), {});
});

test("option rules come from the service of the chosen checkpoint", () => {
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP1", scope: "full" }).success, false);
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP1", input_source: "files" }).success, false);
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP2" }).success, false);
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP2", scope: "full", submission_type: "logic_check" }).success, false);
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP2", scope: "full" }).success, true);
});

test("library keys on the download URL: same URL reuses the copy, a re-upload gets its own", async () => {
  const dir = mkdtempSync(join(tmpdir(), "library-"));
  const realFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async (url: string) => (calls++, new Response(`bytes of ${url}`))) as typeof fetch;
  try {
    const v1 = "https://cdn.example/v1/report.pdf";
    const v2 = "https://cdn.example/v2/report.pdf";
    const a = await ensureLibraryFile(dir, v1, "../Report.pdf");
    const again = await ensureLibraryFile(dir, v1, "../Report.pdf");
    const b = await ensureLibraryFile(dir, v2, "../Report.pdf");

    assert.equal(a, again);
    assert.notEqual(a, b);
    assert.equal(a, libraryFileName(v1, "Report.pdf"));
    assert.equal(calls, 2);
    assert.equal(readFileSync(join(dir, a), "utf-8"), `bytes of ${v1}`);
    assert.equal(readFileSync(join(dir, b), "utf-8"), `bytes of ${v2}`);
    assert.deepEqual(readdirSync(dir).filter((n) => n.endsWith(".tmp")), []);
  } finally {
    globalThis.fetch = realFetch;
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a failed download leaves no file behind", async () => {
  const dir = mkdtempSync(join(tmpdir(), "library-"));
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response("nope", { status: 404 })) as typeof fetch;
  try {
    await assert.rejects(ensureLibraryFile(dir, "https://cdn.example/v1/x.pdf", "x.pdf"));
    assert.equal(existsSync(join(dir, libraryFileName("https://cdn.example/v1/x.pdf", "x.pdf"))), false);
  } finally {
    globalThis.fetch = realFetch;
    rmSync(dir, { recursive: true, force: true });
  }
});
