// DEPRECATED (2026-10-10): only used by the hidden Finance tab. Replaced by the downloadable FINANCE TEMPLATE. Do not extend.
import { z } from "zod";

// ---------------------------------------------------------------------------
// Finance plan — a P&L the team types in by hand, following the lecturer's
// "FINANCE TEMPLATE" (sheet "Profit and Loss (P&L) Statement"). By design this
// module never *produces* numbers for the team: `checkFinancePlan` only reports
// WHICH cells disagree with the formula, never what the right value is.
// ---------------------------------------------------------------------------

export type FinanceRowKind = "input" | "derived";

export interface FinanceRow {
  key: string;
  label: string;
  kind: FinanceRowKind;
  /** Percent rows are typed as plain percent numbers, e.g. 69.3 for 69.3%. */
  percent?: boolean;
  /** Shown next to a derived row so the team knows which formula to apply. */
  formula?: string;
  /** Row is a section header with no values. */
  section?: boolean;
}

const EXPENSE_ROWS = [
  ["advertising", "Advertising & Promotion"],
  ["depreciation", "Depreciation & Amortization"],
  ["insurance", "Insurance"],
  ["maintenance", "Maintenance"],
  ["office_supplies", "Office Supplies"],
  ["rent", "Rent"],
  ["salaries", "Salaries, Benefits & Wages"],
  ["telecommunication", "Telecommunication"],
  ["travel", "Travel"],
  ["utilities", "Utilities"],
  ["other_expense_1", "Other Expense 1"],
  ["other_expense_2", "Other Expense 2"],
] as const;

export const FINANCE_ROWS: readonly FinanceRow[] = [
  { key: "revenue_1", label: "Revenue stream 1", kind: "input" },
  { key: "revenue_2", label: "Revenue stream 2", kind: "input" },
  { key: "refunds", label: "Returns, Refunds, Discounts", kind: "input" },
  {
    key: "net_revenue",
    label: "Total Net Revenue",
    kind: "derived",
    formula: "Revenue 1 + Revenue 2 + Returns/Refunds (nhập hoàn tiền là số âm)",
  },
  { key: "cogs", label: "Cost of Goods Sold", kind: "input" },
  { key: "gross_profit", label: "Gross Profit", kind: "derived", formula: "Total Net Revenue − COGS" },
  {
    key: "gross_margin",
    label: "Gross Profit Margin %",
    kind: "derived",
    percent: true,
    formula: "Gross Profit ÷ Total Net Revenue × 100",
  },
  { key: "expenses_header", label: "Expenses", kind: "input", section: true },
  ...EXPENSE_ROWS.map(([key, label]): FinanceRow => ({ key, label, kind: "input" })),
  { key: "total_expenses", label: "Total Expenses", kind: "derived", formula: "Tổng 12 dòng chi phí" },
  { key: "ebit", label: "Earnings Before Interest & Taxes (EBIT)", kind: "derived", formula: "Gross Profit − Total Expenses" },
  {
    key: "ebit_margin",
    label: "EBIT margin %",
    kind: "derived",
    percent: true,
    formula: "EBIT ÷ Total Net Revenue × 100",
  },
  { key: "loan", label: "Loan (Outstanding debt)", kind: "input" },
  { key: "interest_rate", label: "Interest rate (%/kỳ)", kind: "input", percent: true },
  {
    key: "interest_expense",
    label: "Interest Expense",
    kind: "derived",
    formula: "Loan × Interest rate ÷ 100",
  },
  { key: "ebt", label: "Earnings Before Taxes (EBT)", kind: "derived", formula: "EBIT − Interest Expense" },
  {
    key: "ebt_margin",
    label: "EBT margin %",
    kind: "derived",
    percent: true,
    formula: "EBT ÷ Total Net Revenue × 100",
  },
  {
    key: "tax",
    label: "Corporate Taxes (20%)",
    kind: "derived",
    formula: "Nếu EBT > 0 thì EBT × 20%, ngược lại bằng 0",
  },
  { key: "net_earnings", label: "Net Earnings", kind: "derived", formula: "EBT − Corporate Taxes" },
];

const VALUE_ROW_KEYS = FINANCE_ROWS.filter((r) => !r.section).map((r) => r.key);

export const FINANCE_MAX_PERIODS = 20;
export const FINANCE_CORPORATE_TAX_RATE = 0.2;
/** VND amounts typed by hand are often rounded; allow one unit of rounding. */
export const FINANCE_AMOUNT_TOLERANCE = 1;
/** Percent cells are often typed with one decimal. */
export const FINANCE_PERCENT_TOLERANCE = 0.1;

const FinanceValueSchema = z.number().finite().nullable();

export const FinancePlanSchema = z
  .object({
    unit: z.string().trim().min(1).max(40).default("VND"),
    /** Column names are the team's own (month, quarter, semester, year). */
    periods: z.array(z.string().trim().min(1).max(40)).min(1).max(FINANCE_MAX_PERIODS),
    values: z.record(z.string(), z.array(FinanceValueSchema)),
    /** Assumptions, sweat-equity notes and other remarks, in the team's own words. */
    notes: z.string().max(5000).default(""),
  })
  .superRefine((plan, ctx) => {
    for (const [key, cells] of Object.entries(plan.values)) {
      if (!VALUE_ROW_KEYS.includes(key)) {
        ctx.addIssue({ code: "custom", path: ["values", key], message: `Unknown row "${key}"` });
      } else if (cells.length !== plan.periods.length) {
        ctx.addIssue({
          code: "custom",
          path: ["values", key],
          message: `Row "${key}" has ${cells.length} cells, expected ${plan.periods.length}`,
        });
      }
    }
  });

export type FinancePlan = z.infer<typeof FinancePlanSchema>;

export interface FinanceIssue {
  row: string;
  /** Column index into `plan.periods`. */
  period: number;
  /** `mismatch`: typed value disagrees with the formula. `empty`: formula inputs exist but the cell is blank. */
  kind: "mismatch" | "empty";
}

type Read = (key: string) => number | null;

/** Applies `fn` only when every dependency was typed; a blank dependency is already reported as its own `empty` issue. */
function when(deps: Array<number | null>, fn: (...d: number[]) => number | null): number | null {
  return deps.every((d) => d !== null) ? fn(...(deps as number[])) : null;
}

function percentOf(part: number, whole: number): number | null {
  return whole === 0 ? null : (part / whole) * 100;
}

/**
 * Expected value of each derived row from the rows it depends on, or null when it
 * cannot be checked (a dependency is blank, or a margin would divide by zero).
 * `v` reads an input row with blank = 0, like SUM in the lecturer's template.
 */
const DERIVED: Record<string, (n: Read, v: (k: string) => number) => number | null> = {
  net_revenue: (_n, v) => v("revenue_1") + v("revenue_2") + v("refunds"),
  gross_profit: (n, v) => when([n("net_revenue")], (net) => net - v("cogs")),
  gross_margin: (n) => when([n("gross_profit"), n("net_revenue")], percentOf),
  total_expenses: (_n, v) => EXPENSE_ROWS.reduce((sum, [key]) => sum + v(key), 0),
  ebit: (n) => when([n("gross_profit"), n("total_expenses")], (gp, exp) => gp - exp),
  ebit_margin: (n) => when([n("ebit"), n("net_revenue")], percentOf),
  interest_expense: (_n, v) => (v("loan") * v("interest_rate")) / 100,
  ebt: (n) => when([n("ebit"), n("interest_expense")], (ebit, interest) => ebit - interest),
  ebt_margin: (n) => when([n("ebt"), n("net_revenue")], percentOf),
  tax: (n) => when([n("ebt")], (ebt) => (ebt > 0 ? ebt * FINANCE_CORPORATE_TAX_RATE : 0)),
  net_earnings: (n) => when([n("ebt"), n("tax")], (ebt, tax) => ebt - tax),
};

/**
 * Compares the derived rows the team typed against the formula and lists the
 * disagreeing cells. The expected values are deliberately NOT returned: the
 * team must find and fix the mistake themselves.
 *
 * Each derived cell is compared against a value computed from the *typed*
 * values of the rows it depends on, so one wrong cell does not cascade into
 * false errors in every row after it.
 */
export function checkFinancePlan(plan: FinancePlan): FinanceIssue[] {
  const issues: FinanceIssue[] = [];
  const cell = (key: string, period: number): number | null => plan.values[key]?.[period] ?? null;

  for (let period = 0; period < plan.periods.length; period++) {
    const hasAnyData = VALUE_ROW_KEYS.some((key) => cell(key, period) !== null);
    if (!hasAnyData) continue;

    const typed = (key: string): number | null => cell(key, period);
    const asNumber = (key: string): number => typed(key) ?? 0;

    for (const row of FINANCE_ROWS) {
      if (row.kind !== "derived") continue;
      const compute = DERIVED[row.key];
      if (!compute) continue;

      const expected = compute(typed, asNumber);
      if (expected === null) continue;

      const actual = typed(row.key);
      if (actual === null) {
        issues.push({ row: row.key, period, kind: "empty" });
        continue;
      }
      const tolerance = row.percent ? FINANCE_PERCENT_TOLERANCE : FINANCE_AMOUNT_TOLERANCE;
      if (Math.abs(actual - expected) > tolerance) {
        issues.push({ row: row.key, period, kind: "mismatch" });
      }
    }
  }

  return issues;
}

export function emptyFinancePlan(periods: string[]): FinancePlan {
  return { unit: "VND", periods, values: {}, notes: "" };
}
