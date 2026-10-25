import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, test } from "node:test";
import { prepareSandbox } from "../../../modules/ai-engine/omp-audit.service.js";

let root: string;
let jobDir: string;
let prevRoot: string | undefined;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "sandbox-root-"));
  jobDir = join(root, "job");
  prevRoot = process.env.APP_ROOT;
  process.env.APP_ROOT = root;
});
afterEach(() => {
  if (prevRoot === undefined) delete process.env.APP_ROOT;
  else process.env.APP_ROOT = prevRoot;
  rmSync(root, { recursive: true, force: true });
});

test("listed prompt file present: copied into system_prompt/", () => {
  mkdirSync(join(root, "data/system-prompts"), { recursive: true });
  writeFileSync(join(root, "data/system-prompts/a.md"), "x");
  prepareSandbox(jobDir, [], { promptFiles: ["a.md"], includeKnowledge: false });
  assert.ok(existsSync(join(jobDir, "system_prompt/a.md")));
});

test("listed prompt file missing: throws", () => {
  mkdirSync(join(root, "data/system-prompts"), { recursive: true });
  assert.throws(() => prepareSandbox(jobDir, [], { promptFiles: ["gone.md"], includeKnowledge: false }), /gone\.md/);
});

test("prompt directory missing while files are listed: throws", () => {
  assert.throws(() => prepareSandbox(jobDir, [], { promptFiles: ["a.md"], includeKnowledge: false }), /Prompt directory missing/);
});

test("unrestricted job (CP1) with no prompt directory keeps old behaviour", () => {
  assert.doesNotThrow(() => prepareSandbox(jobDir, [], {}));
});
