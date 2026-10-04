import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
// @ts-expect-error node:sqlite is natively supported in Node 22+
import { DatabaseSync } from "node:sqlite";
test("knowledge-sqlite: startup_knowledge.db exists and contains complete 12 groups dataset", () => {
  const candidates = [
    resolve(process.cwd(), "data/knowledge/startup_knowledge.db"),
    resolve(process.cwd(), "../../data/knowledge/startup_knowledge.db"),
  ];
  const dbPath = candidates.find(existsSync);
  assert.ok(dbPath, "Database file must exist");

  const db = new DatabaseSync(dbPath, { readOnly: true });

  // 1. Check evaluation_criteria
  const criteriaStmt = db.prepare("SELECT count(*) as count FROM evaluation_criteria");
  const criteriaResult = criteriaStmt.get() as { count: number };
  assert.strictEqual(criteriaResult.count, 14, "Must contain exactly 14 evaluation criteria");

  // Verify crit_team_structure exists
  const teamCritStmt = db.prepare("SELECT * FROM evaluation_criteria WHERE id = 'crit_team_structure'");
  const teamCrit = teamCritStmt.get() as { id: string; weight: number } | undefined;
  assert.ok(teamCrit, "Must contain crit_team_structure criterion");
  assert.strictEqual(teamCrit?.weight, 2, "crit_team_structure weight must be 2");

  // 2. Check evaluation_indicators
  const indicatorsStmt = db.prepare("SELECT count(*) as count FROM evaluation_indicators");
  const indicatorsResult = indicatorsStmt.get() as { count: number };
  assert.strictEqual(indicatorsResult.count, 29, "Must contain exactly 29 evaluation indicators");

  // Verify severity breakdown
  const blockerStmt = db.prepare("SELECT count(*) as count FROM evaluation_indicators WHERE severity = 'BLOCKER'");
  const blockerResult = blockerStmt.get() as { count: number };
  assert.ok(blockerResult.count >= 8, "Must have at least 8 BLOCKER indicators");

  // 3. Check case_audit_violations
  const violationsStmt = db.prepare("SELECT count(*) as count FROM case_audit_violations");
  const violationsResult = violationsStmt.get() as { count: number };
  assert.strictEqual(violationsResult.count, 28, "Must contain exactly 28 historical case violations");

  db.close();
});
