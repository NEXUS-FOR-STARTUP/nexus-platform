import { test } from "node:test";
import assert from "node:assert";

process.env.NODE_ENV = "test";

test("parseCaseListQuery", async (t) => {
  const { parseCaseListQuery } = await import(
    "../../../modules/cases/application/parse-case-list-query.js"
  );
  const { AppError } = await import("../../domain/app-error.js");
  await t.test("defaults page 1 and limit 20", () => {
    const parsed = parseCaseListQuery({});
    assert.deepStrictEqual(parsed, {
      page: 1,
      offset: 0,
      limit: 20,
      search: undefined,
      sortBy: "created_at",
      sortOrder: "desc",
      internalStatuses: undefined,
      stage: undefined,
    });
  });

  await t.test("rejects limit over max", () => {
    assert.throws(
      () => parseCaseListQuery({ limit: "51" }),
      (error: unknown) => error instanceof AppError && error.status === 400,
    );
  });
  await t.test("rejects page 0", () => {
    assert.throws(
      () => parseCaseListQuery({ page: "0" }),
      (error: unknown) => error instanceof AppError && error.status === 400,
    );
  });

  await t.test("rejects invalid sortBy", () => {
    assert.throws(
      () => parseCaseListQuery({ sortBy: "owner_email" }),
      (error: unknown) => error instanceof AppError && error.status === 400,
    );
  });

  await t.test("rejects invalid sortOrder", () => {
    assert.throws(
      () => parseCaseListQuery({ sortOrder: "sideways" }),
      (error: unknown) => error instanceof AppError && error.status === 400,
    );
  });

  await t.test("parses comma-separated internal_status allowlist", () => {
    const parsed = parseCaseListQuery({
      internal_status: "assigned,supporter_working,waiting_user",
    });
    assert.deepStrictEqual(parsed.internalStatuses, [
      "assigned",
      "supporter_working",
      "waiting_user",
    ]);
  });

  await t.test("rejects unknown internal_status", () => {
    assert.throws(
      () => parseCaseListQuery({ internal_status: "hacked" }),
      (error: unknown) => error instanceof AppError && error.status === 400,
    );
  });
  await t.test("user can filter by user_facing stage", () => {
    const parsed = parseCaseListQuery({ stage: "under_review" });
    assert.strictEqual(parsed.stage, "under_review");
    assert.strictEqual(parsed.view, undefined);
  });
  await t.test("rejects unknown stage for user", () => {
    assert.throws(
      () => parseCaseListQuery({ stage: "hacked" }),
      (error: unknown) => error instanceof AppError && error.status === 400,
    );
  });


  await t.test("admin view and intake stage are allowed", () => {
    const parsed = parseCaseListQuery(
      { view: "intake", stage: "intake_pending" },
      { admin: true },
    );
    assert.strictEqual(parsed.view, "intake");
    assert.strictEqual(parsed.stage, "intake_pending");
  });

  await t.test("rejects unknown admin view", () => {
    assert.throws(
      () => parseCaseListQuery({ view: "secret" }, { admin: true }),
      (error: unknown) => error instanceof AppError && error.status === 400,
    );
  });
});

test("csv serializer", async (t) => {
  const { csvEscape, serializeCsv } = await import(
    "../../../modules/admin/application/csv-serialize.js"
  );

  await t.test("escapes comma quote newline and unicode", () => {
    assert.strictEqual(csvEscape("a,b"), '"a,b"');
    assert.strictEqual(csvEscape('he said "hi"'), '"he said ""hi"""');
    assert.strictEqual(csvEscape("line1\nline2"), '"line1\nline2"');
    assert.strictEqual(csvEscape("Nhóm A"), "Nhóm A");
    assert.strictEqual(csvEscape(null), "");
    assert.strictEqual(csvEscape("=1+1"), "'=1+1");
    assert.strictEqual(csvEscape("+cmd"), "'+cmd");
    assert.strictEqual(csvEscape("-2"), "'-2");
    assert.strictEqual(csvEscape("@SUM(A1)"), "'@SUM(A1)");
  });

  await t.test("empty rows still emit header and BOM", () => {
    const csv = serializeCsv(["id", "name"], []);
    assert.ok(csv.startsWith("\uFEFF"));
    assert.strictEqual(csv, "\uFEFFid,name\r\n");
  });
});

test("listCasesUseCase returns envelope", async () => {
  const { prisma } = await import("../../../db.js");
  const originalFind = prisma.case.findMany;
  const originalCount = prisma.case.count;
  prisma.case.findMany = (async () => [{ id: "c1" }]) as typeof prisma.case.findMany;
  prisma.case.count = (async () => 1) as typeof prisma.case.count;

  try {
    const { listCasesUseCase } = await import(
      "../../../modules/cases/application/list-cases.usecase.js"
    );
    const result = await listCasesUseCase({ user: { id: "user-1", role: "user" } });
    assert.ok(Array.isArray(result.items));
    assert.strictEqual(result.total, 1);
    assert.strictEqual(result.page, 1);
    assert.strictEqual(result.limit, 20);
    assert.ok(!Array.isArray(result));
  } finally {
    prisma.case.findMany = originalFind;
    prisma.case.count = originalCount;
  }
});

test("export allowlist and row mapping", async (t) => {
  const { parseExportResource, EXPORT_MAX_ROWS } = await import(
    "../../../modules/admin/application/export-admin-data.usecase.js"
  );
  const { AppError } = await import("../../domain/app-error.js");

  await t.test("rejects unknown resource", () => {
    assert.throws(
      () => parseExportResource("users"),
      (error: unknown) => error instanceof AppError && error.status === 400,
    );
  });

  await t.test("accepts four resources", () => {
    assert.strictEqual(parseExportResource("cases"), "cases");
    assert.strictEqual(parseExportResource("deposits"), "deposits");
    assert.strictEqual(parseExportResource("transactions"), "transactions");
    assert.strictEqual(parseExportResource("orders"), "orders");
  });

  await t.test("row cap is explicit", () => {
    assert.strictEqual(EXPORT_MAX_ROWS, 10_000);
  });
});

test("exportAdminDataUseCase writes header-only CSV when empty", async () => {
  const { prisma } = await import("../../../db.js");
  const originalCount = prisma.case.count;
  const originalFind = prisma.case.findMany;
  prisma.case.count = (async () => 0) as typeof prisma.case.count;
  prisma.case.findMany = (async () => []) as typeof prisma.case.findMany;

  try {
    const { exportAdminDataUseCase } = await import(
      "../../../modules/admin/application/export-admin-data.usecase.js"
    );
    const { csv, filename } = await exportAdminDataUseCase("cases");
    assert.ok(csv.startsWith("\uFEFF"));
    assert.match(csv, /id,case_code,/);
    assert.ok(filename.startsWith("nexus-cases-"));
    assert.ok(filename.endsWith(".csv"));
    assert.strictEqual(csv.split("\r\n").filter(Boolean).length, 1);
  } finally {
    prisma.case.count = originalCount;
    prisma.case.findMany = originalFind;
  }
});
