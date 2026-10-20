import { test } from "node:test";
import assert from "node:assert/strict";
import { saveOmpAuditReport } from "../../../modules/reports/infrastructure/persistence/report.repository.js";

type Db = Parameters<typeof saveOmpAuditReport>[1];

/**
 * `saveOmpAuditReport` files the report under the checkpoint the caller names. It must not guess one
 * (the old lookup sent every report to the oldest checkpoint, then to CP1 by default).
 */
test("saveOmpAuditReport files the report under the caller's checkpoint and type", async () => {
  const upserts: string[] = [];
  const created: Array<Record<string, unknown>> = [];
  const db = {
    checkpoint: {
      upsert: async (args: { where: { case_id_checkpoint_code: { checkpoint_code: string } } }) => {
        const code = args.where.case_id_checkpoint_code.checkpoint_code;
        upserts.push(code);
        return { id: `cp-${code}` };
      },
    },
    report: { create: async (args: { data: Record<string, unknown> }) => (created.push(args.data), args.data) },
  } as unknown as Db;

  await saveOmpAuditReport({ caseId: "c", lifecycleUnitId: "u1", contentMd: "md", checkpointCode: "CP1", reportType: "input_clarification" }, db);
  await saveOmpAuditReport({ caseId: "c", contentMd: "md", checkpointCode: "CP2", reportType: "cp2_full" }, db);

  assert.deepEqual(upserts, ["CP1", "CP2"]);
  assert.deepEqual(created.map((r) => [r.checkpoint_id, r.report_type, r.lifecycle_unit_id]), [
    ["cp-CP1", "input_clarification", "u1"],
    ["cp-CP2", "cp2_full", null],
  ]);
});
