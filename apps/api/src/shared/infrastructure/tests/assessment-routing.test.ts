import { test } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../../../db.js";
import { findApprovedReports, saveOmpAuditReport } from "../../../modules/reports/infrastructure/persistence/report.repository.js";

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
  await saveOmpAuditReport({ caseId: "c", contentMd: "md", checkpointCode: "CP3", reportType: "cp3_full" }, db);

  assert.deepEqual(upserts, ["CP1", "CP2", "CP3"]);
  assert.deepEqual(created.map((r) => [r.checkpoint_id, r.report_type, r.lifecycle_unit_id]), [
    ["cp-CP1", "input_clarification", "u1"],
    ["cp-CP2", "cp2_full", null],
    ["cp-CP3", "cp3_full", null],
  ]);
});

/** A CP1 resubmit must never take a CP2 or CP3 report as its baseline. */
test("findApprovedReports excludes every scored report type", async () => {
  const original = Reflect.get(prisma.report, "findMany");
  let where: { report_type: { notIn: string[] } } | undefined;
  Reflect.set(prisma.report, "findMany", async (args: { where: { report_type: { notIn: string[] } } }) => ((where = args.where), []));
  try {
    await findApprovedReports("case-1");
  } finally {
    Reflect.set(prisma.report, "findMany", original);
  }
  for (const type of ["cp2_questionnaire", "cp2_full", "cp2_full_resubmit", "cp3_full", "cp3_full_resubmit"]) {
    assert.ok(where?.report_type.notIn.includes(type), type);
  }
  assert.equal(where?.report_type.notIn.includes("input_clarification"), false);
});
