import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { AUDIT_CHECKPOINTS } from "@app/shared";
import { AppError } from "../../../shared/domain/app-error.js";
import { TriggerOptsSchema } from "../../../modules/ai-engine/application/trigger-opts.js";
import {
  INPUT_ASSEMBLERS,
  POST_PROCESSORS,
  resolveAuditPlan,
} from "../../../modules/ai-engine/application/audit-registry.js";
import { consumeAuditCredit, grantAuditRefund } from "../../../modules/ai-engine/application/audit-credit.js";

process.env.NODE_ENV = "test";

const PROMPT_DIR = resolve(import.meta.dirname, "../../../../../../data/system-prompts");

test("no checkpoint in body -> CP1 exactly as before (service, report type, prompts)", () => {
  const opts = TriggerOptsSchema.parse({ submission_type: "initial" });
  assert.equal(opts.checkpoint, "CP1");
  const plan = resolveAuditPlan(opts.checkpoint, opts.prompt_mode ?? "full", opts.submission_type);
  assert.equal(plan.serviceType, "cp1_audit");
  assert.equal(plan.reportType, "input_clarification");
  assert.deepEqual([...plan.prompts], ["triad_framework_v1_1.md", "input_clarification_gate_v4_1.md"]);
  const resubmit = resolveAuditPlan("CP1", "full", "resubmit");
  assert.equal(resubmit.prompts[resubmit.prompts.length - 1], "input_clarification_gate_v4_1_resubmit.md");
  const lite = resolveAuditPlan("CP1", "lite", "initial");
  assert.ok(lite.prompts.includes("input_clarification_gate_lite_v1_1.md"));
});

test("CP2 body rules: scope required, logic_check refused, CP1 refuses scope", () => {
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP2" }).success, false);
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP2", scope: "full", submission_type: "logic_check" }).success, false);
  assert.equal(TriggerOptsSchema.safeParse({ scope: "full" }).success, false);
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP2", scope: "questionnaire" }).success, true);
  assert.equal(TriggerOptsSchema.safeParse({ checkpoint: "CP3" }).success, false);
});

test("CP2 plan: own service type, report types and prompts; never CP1 triad or gate prompts", () => {
  const q = resolveAuditPlan("CP2", "questionnaire", "initial");
  assert.equal(q.serviceType, "cp2_audit");
  assert.equal(q.reportType, "cp2_questionnaire");
  assert.equal(resolveAuditPlan("CP2", "full", "initial").reportType, "cp2_full");
  const r = resolveAuditPlan("CP2", "full", "resubmit");
  assert.equal(r.reportType, "cp2_full_resubmit");
  assert.deepEqual([...r.prompts], ["cp2_audit_core_v1.md", "cp2_full_review_v1.md", "cp2_full_resubmit_v1.md"]);
  for (const scope of ["questionnaire", "full"] as const) {
    for (const p of resolveAuditPlan("CP2", scope, "initial").prompts) {
      assert.ok(p.startsWith("cp2_"), `${p} must be a CP2 prompt`);
    }
  }
});

test("combinations missing from the table are 400", () => {
  for (const [cp, scope, sub] of [
    ["CP2", "questionnaire", "resubmit"],
    ["CP2", "full", "logic_check"],
    ["CP2", "lite", "initial"],
    ["CP1", "questionnaire", "initial"],
  ] as const) {
    assert.throws(
      () => resolveAuditPlan(cp, scope, sub),
      (err: unknown) => err instanceof AppError && err.status === 400,
      `${cp}/${scope}/${sub}`,
    );
  }
});

test("table integrity: every input/postProcess key has a function, every prompt file exists", () => {
  for (const [code, cp] of Object.entries(AUDIT_CHECKPOINTS)) {
    assert.equal(typeof INPUT_ASSEMBLERS[cp.input], "function", `${code} input ${cp.input}`);
    assert.equal(typeof POST_PROCESSORS[cp.postProcess], "function", `${code} postProcess ${cp.postProcess}`);
    for (const scope of Object.values(cp.scopes)) {
      for (const list of Object.values(scope.prompts) as ReadonlyArray<readonly string[]>) {
        for (const file of list) assert.ok(existsSync(resolve(PROMPT_DIR, file)), `${file} missing in data/system-prompts`);
      }
    }
  }
});

interface Row { case_id: string; service_type_id: string; amount: number; type: string; idempotency_key: string }
function fakeTx(rows: Row[]) {
  const types = [{ id: "st1", code: "cp1_audit" }, { id: "st2", code: "cp2_audit" }];
  return {
    creditLedger: {
      aggregate: async ({ where }: { where: { case_id: string; service_type_id: string } }) => ({
        _sum: { amount: rows.filter((r) => r.case_id === where.case_id && r.service_type_id === where.service_type_id).reduce((s, r) => s + r.amount, 0) },
      }),
      create: async ({ data }: { data: Row }) => {
        if (rows.some((r) => r.idempotency_key === data.idempotency_key)) throw Object.assign(new Error("dup"), { code: "P2002" });
        rows.push(data);
        return data;
      },
    },
    serviceType: { findUnique: async ({ where }: { where: { code: string } }) => types.find((t) => t.code === where.code) ?? null },
  };
}
const seed = (id: string, amount: number): Row => ({ case_id: "c1", service_type_id: id, amount, type: "purchase", idempotency_key: `seed-${id}` });
const balance = (rows: Row[], id: string) => rows.filter((r) => r.service_type_id === id).reduce((s, r) => s + r.amount, 0);

test("consuming a CP2 credit leaves the CP1 balance alone; refund goes back to CP2", async () => {
  const rows = [seed("st1", 2), seed("st2", 4)];
  const tx = fakeTx(rows) as never;
  await consumeAuditCredit(tx, { caseId: "c1", serviceTypeCode: "cp2_audit", idempotencyKey: "t1" });
  assert.equal(balance(rows, "st2"), 3);
  assert.equal(balance(rows, "st1"), 2);
  await grantAuditRefund(tx, { caseId: "c1", serviceTypeCode: "cp2_audit", idempotencyKey: "r1", reason: "test" });
  assert.equal(balance(rows, "st2"), 4);
  assert.equal(balance(rows, "st1"), 2);
  await assert.rejects(grantAuditRefund(tx, { caseId: "c1", serviceTypeCode: "cp2_audit", idempotencyKey: "r1", reason: "test" }), { code: "P2002" });
  assert.equal(balance(rows, "st2"), 4);
});

test("no CP2 credits -> 402 even when CP1 credits remain", async () => {
  const rows = [seed("st1", 3)];
  await assert.rejects(
    consumeAuditCredit(fakeTx(rows) as never, { caseId: "c1", serviceTypeCode: "cp2_audit", idempotencyKey: "t2" }),
    (err: unknown) => err instanceof AppError && err.status === 402,
  );
  assert.equal(balance(rows, "st1"), 3);
});
