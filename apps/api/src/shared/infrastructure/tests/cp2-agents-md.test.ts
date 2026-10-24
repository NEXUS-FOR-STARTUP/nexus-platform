import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { CP2_SCHEMAS } from "@repo/validation";
import { buildCp2AgentsMd, cp2ValidatorSource } from "../../../modules/ai-engine/application/cp2-agents-md.js";

const cases = [
  ["questionnaire", "initial", "cp2_questionnaire_v1"],
  ["full", "initial", "cp2_full_v1"],
  ["full", "resubmit", "cp2_full_resubmit_v1"],
] as const;

for (const [scope, submissionType, schema] of cases) {
  test(`CP2 AGENTS.md ${scope}/${submissionType} pins schema and every check id`, () => {
    const md = buildCp2AgentsMd(scope, submissionType);
    assert.ok(md.includes(`"schema": "${schema}"`));
    for (const id of Object.keys(CP2_SCHEMAS[schema].checks)) assert.ok(md.includes(`- ${id}\n`), id);
  });
}

test("bundled validator CLI: accepts a valid report, rejects the real-world wrong shape with readable lines", () => {
  const { src } = cp2ValidatorSource();
  const dir = mkdtempSync(join(tmpdir(), "cp2-val-"));
  try {
    const good = join(dir, "good.json");
    const bad = join(dir, "bad.json");
    writeFileSync(good, JSON.stringify({ schema: "cp2_full_v1", checks: Object.keys(CP2_SCHEMAS.cp2_full_v1.checks).map((id) => ({ id, status: "missing" })) }));
    writeFileSync(bad, JSON.stringify({ schema: "cp2_full_review_v1", automatic_failure_checks: { checks: [] } }));
    const ok = spawnSync("bun", [src, good, "cp2_full_v1"], { encoding: "utf-8" });
    assert.equal(ok.status, 0);
    assert.match(ok.stdout, /^OK/);
    const ko = spawnSync("bun", [src, bad, "cp2_full_v1"], { encoding: "utf-8" });
    assert.equal(ko.status, 1);
    assert.match(ko.stdout, /schema:/);
    assert.match(ko.stdout, /checks:/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
