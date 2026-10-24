import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { PL_ISSUE_CODES, validatePlSheet, validatePlWorkbook, type PlCell, type PlGrid } from "../index.js";
import { readPlSheets } from "../cli/read-pl-sheets.js";

const TEMPLATE_PATH = fileURLToPath(new URL("../../../../apps/web-1/public/templates/finance-template.xlsx", import.meta.url));
const colLetter = (c: number): string => String.fromCharCode(65 + c);
const num = (value: number): PlCell => ({ formula: null, value, error: null });
const fx = (formula: string, value: number | null = 0): PlCell => ({ formula, value, error: null });
const txt = (value: string): PlCell => ({ formula: null, value, error: null });

/** Builds a consistent P&L grid; `streams` revenue rows, `periods` columns, labels carry suffixes like real student files. */
function buildGrid(streams: number, periods: number): PlCell[][] {
  const rows: Array<[string, (x: string) => PlCell]> = [];
  for (let i = 1; i <= streams; i++) rows.push([`Revenue Stream ${i} - Plan`, () => num(100)]);
  const first = 5; // 1-based row of first stream; header sits on row 4
  const last = first + streams - 1;
  let r = last + 1;
  const at = (offset: number): number => r + offset;
  rows.push(["Returns, Refunds, Discounts (1%)", (x) => fx(`${x}${first}*1%`, 1)]);
  rows.push(["Total Net Revenue", (x) => fx(`SUM(${x}${first}:${x}${at(0)})`, 300)]);
  const net = at(1);
  rows.push(["Cost of Goods Sold", () => num(50)]);
  rows.push(["Gross Profit", (x) => fx(`${x}${net}-${x}${at(2)}`)]);
  rows.push(["Expenses", () => ({ formula: null, value: null, error: null })]);
  rows.push(["Advertising & Promotion", () => num(10)]);
  rows.push(["Other Expense 1 (ChatGPT Plus)", () => num(5)]);
  rows.push(["Total Expenses", (x) => fx(`SUM(${x}${at(5)}:${x}${at(6)})`)]);
  rows.push(["Earnings Before Interest & Taxes (EBIT)", (x) => fx(`${x}${at(3)}-${x}${at(7)}`)]);
  rows.push(["Ebit margin %", (x) => fx(`IF(${x}${net}=0,"",${x}${at(8)}/${x}${net})`)]);
  rows.push(["Loan (Outstanding debt)", () => num(0)]);
  rows.push(["Interest rate (%/Quarter)", () => num(0.02)]);
  rows.push(["Interest Expense", (x) => fx(`${x}${at(10)}*${x}${at(11)}`)]);
  rows.push(["Earnings Before Taxes (EBT)", (x) => fx(`${x}${at(8)}-${x}${at(12)}`)]);
  rows.push(["Corporate Taxes (20%)", (x) => fx(`IF(${x}${at(13)}>0,${x}${at(13)}*20%,0)`)]);
  rows.push(["Net Earnings", (x) => fx(`${x}${at(13)}-${x}${at(14)}`)]);
  const header = [txt("Unit"), ...Array.from({ length: periods }, (_, c) => txt(`Semester ${c + 1}`))];
  const body = rows.map(([label, make]) => [txt(label), ...Array.from({ length: periods }, (_, c) => make(colLetter(c + 1)))]);
  return [[txt("Title")], [txt("P&L")], [txt("Unit: VND")], header, ...body];
}

const codes = (grid: PlGrid): string[] => validatePlSheet(grid).map((i) => `${i.code}@${i.cell}`);
const set = (grid: PlCell[][], rowLabel: string, col: number, cell: PlCell | null): void => {
  const row = grid.find((g) => g[0]?.value === rowLabel);
  if (!row) throw new Error(`fixture row missing: ${rowLabel}`);
  row[col] = cell as PlCell;
};

describe("validatePlSheet", () => {
  it("accepts the repo template with zero issues", async () => {
    assert.deepEqual(validatePlWorkbook(await readPlSheets(TEMPLATE_PATH)), []);
  });

  it("handles restructured sheets: 3 streams, 3 periods, suffixed labels", () => {
    assert.deepEqual(codes(buildGrid(3, 3)), []);
    assert.deepEqual(codes(buildGrid(1, 12)), []);
  });

  it("flags the original template defects with exact codes and cells", () => {
    const g = buildGrid(2, 3);
    set(g, "Interest Expense", 1, fx("B14*B15")); // wrong rows / not loan×rate
    set(g, "Corporate Taxes (20%)", 2, num(0));
    set(g, "Revenue Stream 1 - Plan", 1, null);
    set(g, "Earnings Before Taxes (EBT)", 3, { formula: "C1/0", value: "#REF!", error: null });
    const rowOf = (label: string): number => g.findIndex((r) => r[0]?.value === label) + 1;
    assert.deepEqual(codes(g).sort(), [
      `${PL_ISSUE_CODES.BLANK_INPUT}@B5`,
      `${PL_ISSUE_CODES.CELL_ERROR}@D${rowOf("Earnings Before Taxes (EBT)")}`,
      `${PL_ISSUE_CODES.INTEREST_BAD_REFERENCE}@B${rowOf("Interest Expense")}`,
      `${PL_ISSUE_CODES.TAX_NOT_FORMULA}@C${rowOf("Corporate Taxes (20%)")}`,
    ].sort());
  });

  it("detects a self-referencing interest formula and wrong-column tax", () => {
    const g = buildGrid(1, 2);
    const interestRow = g.findIndex((r) => r[0]?.value === "Interest Expense") + 1;
    set(g, "Interest Expense", 1, fx(`B${interestRow - 2}*B${interestRow}`));
    set(g, "Corporate Taxes (20%)", 2, fx("IF(B15>0,B15*20%,0)"));
    assert.deepEqual(codes(g).sort(), [
      `${PL_ISSUE_CODES.INTEREST_BAD_REFERENCE}@B${interestRow}`,
      `${PL_ISSUE_CODES.TAX_BAD_REFERENCE}@C${interestRow + 2}`,
    ].sort());
  });

  it("separates blocking errors from advisory warnings", () => {
    const g = buildGrid(1, 2);
    set(g, "Net Earnings", 1, num(123));
    set(g, "Cost of Goods Sold", 2, num(-5));
    set(g, "Interest rate (%/Quarter)", 1, num(5));
    const bySeverity = Object.fromEntries(validatePlSheet(g).map((i) => [i.code, i.severity]));
    assert.deepEqual(bySeverity, {
      [PL_ISSUE_CODES.TOTAL_NOT_FORMULA]: "error",
      [PL_ISSUE_CODES.NEGATIVE_INPUT]: "warning",
      [PL_ISSUE_CODES.INTEREST_RATE_RANGE]: "warning",
    });
  });

  it("reports every missing required row", () => {
    const g = buildGrid(1, 2).filter((r) => !["Cost of Goods Sold", "Earnings Before Taxes (EBT)"].includes(String(r[0]?.value)));
    const missing = validatePlSheet(g).filter((i) => i.code === PL_ISSUE_CODES.MISSING_ROW).map((i) => i.row_label).sort();
    assert.deepEqual(missing, ["Cost of Goods Sold", "EBT"]);
  });

  it("fails loudly when no period header can be found instead of passing clean", () => {
    const noHeader = buildGrid(1, 2).filter((r) => r[0]?.value !== "Unit");
    assert.deepEqual(codes(noHeader).filter((c) => c.startsWith(PL_ISSUE_CODES.NO_PERIOD_COLUMNS)), [`${PL_ISSUE_CODES.NO_PERIOD_COLUMNS}@null`]);
    assert.ok(validatePlSheet([]).some((i) => i.code === PL_ISSUE_CODES.NO_PERIOD_COLUMNS && i.severity === "error"));
  });

  it("rejects interest and tax formulas that reference the right cells with the wrong operation", () => {
    const g = buildGrid(1, 3);
    const rowOf = (label: string): number => g.findIndex((r) => r[0]?.value === label) + 1;
    const [loan, rate, ebt] = [rowOf("Loan (Outstanding debt)"), rowOf("Interest rate (%/Quarter)"), rowOf("Earnings Before Taxes (EBT)")];
    set(g, "Interest Expense", 1, fx(`B${loan}+B${rate}`));
    set(g, "Corporate Taxes (20%)", 1, fx(`B${ebt}`));
    set(g, "Corporate Taxes (20%)", 2, fx(`C${ebt}*20%`)); // no guard: a loss would give a negative tax
    assert.deepEqual(codes(g).sort(), [
      `${PL_ISSUE_CODES.INTEREST_BAD_OPERATION}@B${rowOf("Interest Expense")}`,
      `${PL_ISSUE_CODES.TAX_BAD_OPERATION}@B${rowOf("Corporate Taxes (20%)")}`,
      `${PL_ISSUE_CODES.TAX_BAD_OPERATION}@C${rowOf("Corporate Taxes (20%)")}`,
    ].sort());
  });

  it("accepts equivalent spellings of the correct interest and tax formulas", () => {
    const g = buildGrid(1, 2);
    const rowOf = (label: string): number => g.findIndex((r) => r[0]?.value === label) + 1;
    const [loan, rate, ebt] = [rowOf("Loan (Outstanding debt)"), rowOf("Interest rate (%/Quarter)"), rowOf("Earnings Before Taxes (EBT)")];
    set(g, "Interest Expense", 1, fx(`$B$${rate} * B${loan}`));
    set(g, "Corporate Taxes (20%)", 2, fx(`MAX(0,C${ebt})*0.2`));
    assert.deepEqual(codes(g), []);
  });
});
