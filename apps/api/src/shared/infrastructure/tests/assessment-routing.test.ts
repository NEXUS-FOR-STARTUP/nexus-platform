import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * P5 — assessment routing.
 *
 * DB-free test of `saveOmpAuditReport` checkpoint resolution. The bug under fix
 * routed every OMP audit report to the OLDEST checkpoint (CP1) via
 * `checkpoint.findFirst({ orderBy: { created_at: "asc" } })`. These tests pin
 * the corrected priority: lifecycle unit's own checkpoint > case
 * `current_checkpoint` > highest `latest_version_no` > create CP1.
 */
test("P5 assessment routing — saveOmpAuditReport routes to the correct checkpoint", async (t) => {
  const { saveOmpAuditReport } = await import(
    "../../../modules/reports/infrastructure/persistence/report.repository.js"
  );
  type Db = Parameters<typeof saveOmpAuditReport>[1];

  type FakeCheckpoint = { id: string; checkpoint_code: string; latest_version_no: number };
  type FakeUnit = { id: string; case_id: string; checkpoint_id: string };

  const buildDb = (overrides: {
    unit?: FakeUnit | null;
    unitCaseId?: string;
    currentCheckpoint?: string | null;
    checkpoints?: FakeCheckpoint[];
    onCreate?: (data: Record<string, unknown>) => FakeCheckpoint;
  }) => {
    const createdReports: Array<Record<string, unknown>> = [];
    const db = {
      lifecycleUnit: {
        findUnique: async (args: { where: { id: string } }) => {
          const unit = overrides.unit ?? null;
          if (!unit) return null;
          return { id: unit.id, case_id: overrides.unitCaseId ?? "case-1", checkpoint_id: unit.checkpoint_id };
        },
      },
      case: {
        findUnique: async () =>
          overrides.currentCheckpoint === undefined
            ? { current_checkpoint: "CP1" }
            : { current_checkpoint: overrides.currentCheckpoint },
      },
      checkpoint: {
        findUnique: async (args: { where: { id: string } }) =>
          (overrides.checkpoints ?? []).find((cp) => cp.id === args.where.id) ?? null,
        findFirst: async (args: {
          where: Record<string, unknown>;
          orderBy?: unknown;
        }) => {
          const code = args.where?.checkpoint_code as string | undefined;
          if (code) {
            return (overrides.checkpoints ?? []).find((cp) => cp.checkpoint_code === code) ?? null;
          }
          // latest_version_no fallback
          const list = overrides.checkpoints ?? [];
          if (list.length === 0) return null;
          return [...list].sort(
            (a, b) => b.latest_version_no - a.latest_version_no,
          )[0] ?? null;
        },
        upsert: async (args: { create: Record<string, unknown> }) =>
          overrides.onCreate
            ? overrides.onCreate(args.create)
            : { id: "cp-created", checkpoint_code: "CP1", latest_version_no: 1 },
      },
      report: {
        create: async (args: { data: Record<string, unknown> }) => {
          createdReports.push(args.data);
          return args.data;
        },
      },
    };
    return { db: db as unknown as Db, createdReports };
  };

  await t.test("routes to the lifecycle unit's own checkpoint, not the oldest", async () => {
    const { db, createdReports } = buildDb({
      unit: { id: "unit-2", case_id: "case-1", checkpoint_id: "cp-2" },
      unitCaseId: "case-1",
      checkpoints: [
        { id: "cp-1", checkpoint_code: "CP1", latest_version_no: 1 },
        { id: "cp-2", checkpoint_code: "CP2", latest_version_no: 2 },
      ],
    });

    await saveOmpAuditReport(
      { caseId: "case-1", lifecycleUnitId: "unit-2", contentMd: "md", metadataJson: { a: 1 } },
      db,
    );

    assert.strictEqual(createdReports.length, 1);
    assert.strictEqual(createdReports[0].checkpoint_id, "cp-2");
    assert.strictEqual(createdReports[0].lifecycle_unit_id, "unit-2");
    assert.strictEqual(createdReports[0].report_type, "input_clarification");
  });

  await t.test("falls back to case.current_checkpoint when no lifecycle unit", async () => {
    const { db, createdReports } = buildDb({
      unit: null,
      currentCheckpoint: "CP2",
      checkpoints: [
        { id: "cp-1", checkpoint_code: "CP1", latest_version_no: 1 },
        { id: "cp-2", checkpoint_code: "CP2", latest_version_no: 2 },
      ],
    });

    await saveOmpAuditReport({ caseId: "case-1", lifecycleUnitId: null, contentMd: "md" }, db);

    assert.strictEqual(createdReports[0].checkpoint_id, "cp-2");
    assert.strictEqual(createdReports[0].lifecycle_unit_id, null);
  });

  await t.test("falls back to highest latest_version_no when current_checkpoint does not match", async () => {
    const { db, createdReports } = buildDb({
      unit: null,
      currentCheckpoint: "CP9",
      checkpoints: [
        { id: "cp-1", checkpoint_code: "CP1", latest_version_no: 3 },
        { id: "cp-2", checkpoint_code: "CP2", latest_version_no: 5 },
      ],
    });

    await saveOmpAuditReport({ caseId: "case-1", lifecycleUnitId: null, contentMd: "md" }, db);

    assert.strictEqual(createdReports[0].checkpoint_id, "cp-2");
  });

  await t.test("ignores a lifecycle unit that belongs to another case", async () => {
    const { db, createdReports } = buildDb({
      unit: { id: "unit-x", case_id: "other-case", checkpoint_id: "cp-x" },
      unitCaseId: "other-case",
      currentCheckpoint: "CP1",
      checkpoints: [
        { id: "cp-1", checkpoint_code: "CP1", latest_version_no: 1 },
      ],
    });

    await saveOmpAuditReport(
      { caseId: "case-1", lifecycleUnitId: "unit-x", contentMd: "md" },
      db,
    );

    assert.strictEqual(createdReports[0].checkpoint_id, "cp-1");
  });

  await t.test("creates CP1 when no checkpoint exists (backward compatible)", async () => {
    const { db, createdReports } = buildDb({
      unit: null,
      currentCheckpoint: null,
      checkpoints: [],
      onCreate: (data) => ({
        id: "cp-created",
        checkpoint_code: String(data.checkpoint_code),
        latest_version_no: Number(data.latest_version_no),
      }),
    });

    await saveOmpAuditReport({ caseId: "case-1", lifecycleUnitId: null, contentMd: "md" }, db);

    assert.strictEqual(createdReports[0].checkpoint_id, "cp-created");
  });
});
