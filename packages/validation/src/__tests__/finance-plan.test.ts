// DEPRECATED (2026-10-10): tests the hidden Finance tab's checker. Remove together with finance-plan.ts.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { FinancePlanSchema, checkFinancePlan, type FinancePlan } from "../index.js";

/** One consistent column: net 1000, COGS 400, expenses 300, loan 100 at 2%/period. */
const consistentColumn: Record<string, number> = {
  revenue_1: 900,
  revenue_2: 150,
  refunds: -50,
  net_revenue: 1000,
  cogs: 400,
  gross_profit: 600,
  gross_margin: 60,
  advertising: 100,
  salaries: 200,
  total_expenses: 300,
  ebit: 300,
  ebit_margin: 30,
  loan: 100,
  interest_rate: 2,
  interest_expense: 2,
  ebt: 298,
  ebt_margin: 29.8,
  tax: 59.6,
  net_earnings: 238.4,
};

const planOf = (...columns: Array<Record<string, number>>): FinancePlan => {
  const keys = new Set(columns.flatMap((c) => Object.keys(c)));
  const values: FinancePlan["values"] = {};
  for (const key of keys) values[key] = columns.map((c) => c[key] ?? null);
  return { unit: "VND", periods: columns.map((_, i) => `Q${i + 1}`), values, notes: "" };
};

describe("checkFinancePlan", () => {
  it("reports nothing for a column whose derived rows follow the formulas", () => {
    assert.deepEqual(checkFinancePlan(planOf(consistentColumn)), []);
  });

  it("flags the wrong cell and the cells that no longer agree with it, never revealing a right value", () => {
    const issues = checkFinancePlan(planOf({ ...consistentColumn, gross_profit: 700 }));
    assert.deepEqual(
      issues.map((i) => i.row),
      ["gross_profit", "gross_margin", "ebit"],
    );
    for (const issue of issues) {
      assert.deepEqual(Object.keys(issue).sort(), ["kind", "period", "row"]);
    }
  });

  it("flags only the source when the team carried a wrong value consistently through later rows", () => {
    const issues = checkFinancePlan(
      planOf({ ...consistentColumn, gross_profit: 700, gross_margin: 70, ebit: 400, ebit_margin: 40, ebt: 398, ebt_margin: 39.8, tax: 79.6, net_earnings: 318.4 }),
    );
    assert.deepEqual(issues, [{ row: "gross_profit", period: 0, kind: "mismatch" }]);
  });

  it("flags a blank derived cell when the column has data, and skips cells that depend on it", () => {
    const { ebit: _omitted, ...withoutEbit } = consistentColumn;
    const issues = checkFinancePlan(planOf(withoutEbit));
    assert.deepEqual(issues, [{ row: "ebit", period: 0, kind: "empty" }]);
  });

  it("skips a column the team has not started", () => {
    assert.deepEqual(checkFinancePlan(planOf(consistentColumn, {})), []);
  });

  it("does not flag margins when net revenue is zero", () => {
    const issues = checkFinancePlan(
      planOf({ cogs: 0, advertising: 50, net_revenue: 0, gross_profit: 0, total_expenses: 50, ebit: -50, interest_expense: 0, ebt: -50, tax: 0, net_earnings: -50 }),
    );
    assert.ok(!issues.some((i) => i.row.endsWith("_margin") && i.kind === "mismatch"));
  });

  it("expects zero tax on a loss and flags a tax that was charged anyway", () => {
    const loss = { ...consistentColumn, cogs: 900, gross_profit: 100, gross_margin: 10, ebit: -200, ebit_margin: -20, ebt: -202, ebt_margin: -20.2 };
    assert.deepEqual(checkFinancePlan(planOf({ ...loss, tax: 0, net_earnings: -202 })), []);
    const issues = checkFinancePlan(planOf({ ...loss, tax: 20, net_earnings: -222 }));
    assert.deepEqual(issues, [{ row: "tax", period: 0, kind: "mismatch" }]);
  });

  it("accepts a one-unit rounding difference on amounts", () => {
    assert.deepEqual(checkFinancePlan(planOf({ ...consistentColumn, tax: 60, net_earnings: 238 })), []);
  });
});

describe("FinancePlanSchema", () => {
  it("rejects a row whose cell count differs from the period count", () => {
    const result = FinancePlanSchema.safeParse({ periods: ["Q1", "Q2"], values: { cogs: [1] } });
    assert.equal(result.success, false);
  });

  it("rejects an unknown row key", () => {
    const result = FinancePlanSchema.safeParse({ periods: ["Q1"], values: { made_up: [1] } });
    assert.equal(result.success, false);
  });

  it("applies defaults for unit and notes", () => {
    const result = FinancePlanSchema.parse({ periods: ["Q1"], values: { cogs: [null] } });
    assert.equal(result.unit, "VND");
    assert.equal(result.notes, "");
  });
});
