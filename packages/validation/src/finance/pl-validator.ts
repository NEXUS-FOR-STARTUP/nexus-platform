// Rule-based (no AI) checker for the CP4 P&L sheet. Rows are located by label, period columns by the header row,
// so students may add revenue streams / change period count and labels.

export interface PlCell {
  /** Formula text without leading "=" (null for typed values). */
  formula: string | null;
  /** Typed value, or the cached result of a formula. */
  value: string | number | boolean | null;
  /** Error literal such as "#REF!" when the cell evaluates to an error. */
  error: string | null;
}
/** grid[row][col], both 0-based; col 0 holds row labels. */
export type PlGrid = ReadonlyArray<ReadonlyArray<PlCell | null | undefined>>;
export interface PlSheet { name: string; grid: PlGrid }

export const PL_ISSUE_CODES = {
  MISSING_ROW: "PL_MISSING_ROW",
  CELL_ERROR: "PL_CELL_ERROR",
  TOTAL_NOT_FORMULA: "PL_TOTAL_NOT_FORMULA",
  INTEREST_BAD_REFERENCE: "PL_INTEREST_BAD_REFERENCE",
  TAX_NOT_FORMULA: "PL_TAX_NOT_FORMULA",
  TAX_BAD_REFERENCE: "PL_TAX_BAD_REFERENCE",
  BLANK_INPUT: "PL_BLANK_INPUT",
  NEGATIVE_INPUT: "PL_NEGATIVE_INPUT",
  INTEREST_RATE_RANGE: "PL_INTEREST_RATE_RANGE",
} as const;
export type PlIssueCode = (typeof PL_ISSUE_CODES)[keyof typeof PL_ISSUE_CODES];

export interface PlIssue {
  code: PlIssueCode;
  severity: "error" | "warning";
  row_label: string;
  /** A1 address; null when the row itself is missing. */
  cell: string | null;
  message: string;
}

export const PL_ERROR_LITERALS = ["#REF!", "#DIV/0!", "#VALUE!", "#NAME?", "#N/A"] as const;
export const PL_MIN_INTEREST_RATE = 0;
export const PL_MAX_INTEREST_RATE = 1;
const FIRST_PERIOD_COL = 1;
const CELL_REF = /\$?([A-Z]{1,3})\$?(\d+)/g;

const norm = (v: PlCell | null | undefined): string =>
  String(v?.value ?? "").replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim().toLowerCase();
const colName = (c: number): string => {
  let s = "";
  for (let n = c + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};
const addr = (r: number, c: number): string => `${colName(c)}${r + 1}`;
const isBlank = (c: PlCell | null | undefined): boolean => !c || (!c.formula && (c.value === null || c.value === ""));
const isMargin = (label: string): boolean => /margin\s*%?$/.test(label);

export function looksLikePlSheet(grid: PlGrid): boolean {
  return grid.some((row) => norm(row[0]) === "total net revenue");
}

export function validatePlWorkbook(sheets: readonly PlSheet[]): PlIssue[] {
  const sheet = sheets.find((s) => looksLikePlSheet(s.grid)) ?? sheets[0];
  return validatePlSheet(sheet?.grid ?? []);
}

export function validatePlSheet(grid: PlGrid): PlIssue[] {
  const issues: PlIssue[] = [];
  const labels = grid.map((row) => norm(row[0]));
  const rawLabel = (r: number): string => String(grid[r]?.[0]?.value ?? "").trim();
  const find = (pred: (l: string) => boolean): number[] => labels.flatMap((l, r) => (l && pred(l) ? [r] : []));
  const one = (name: string): number | undefined => find((l) => l === name)[0];

  const streams = find((l) => l.startsWith("revenue stream"));
  const rows = {
    net: one("total net revenue"), cogs: one("cost of goods sold"), gross: one("gross profit"),
    totalExp: one("total expenses"), ebit: one("earnings before interest & taxes"),
    ebt: one("earnings before taxes"), netEarn: one("net earnings"),
    tax: one("corporate taxes"), loan: find((l) => l.startsWith("loan"))[0],
    rate: one("interest rate"), interest: one("interest expense"),
  };
  const required: Array<[string, boolean]> = [
    ["Revenue stream", streams.length > 0], ["Total Net Revenue", rows.net !== undefined],
    ["Cost of Goods Sold", rows.cogs !== undefined], ["Total Expenses", rows.totalExp !== undefined],
    ["EBIT", rows.ebit !== undefined], ["EBT", rows.ebt !== undefined], ["Net Earnings", rows.netEarn !== undefined],
  ];
  for (const [label, present] of required) {
    if (!present) issues.push({ code: PL_ISSUE_CODES.MISSING_ROW, severity: "error", row_label: label, cell: null, message: `Thiếu dòng "${label}" trong bảng P&L.` });
  }

  const expenseStart = labels.indexOf("expenses");
  const expenseRows = expenseStart >= 0 && rows.totalExp !== undefined && rows.totalExp > expenseStart
    ? Array.from({ length: rows.totalExp - expenseStart - 1 }, (_, i) => expenseStart + 1 + i).filter((r) => labels[r])
    : [];
  const returns = find((l) => l.startsWith("returns"));
  const inputRows = [...streams, ...returns, rows.cogs, ...expenseRows, rows.loan, rows.rate].filter((r): r is number => r !== undefined);
  const nonNegativeRows = new Set([...streams, ...expenseRows, rows.cogs, rows.loan].filter((r): r is number => r !== undefined));

  // Period columns: contiguous non-empty header cells starting at column B, header = nearest labelled-above row.
  const firstDataRow = Math.min(...[...streams, rows.net ?? Infinity]);
  let headerRow = -1;
  for (let r = Number.isFinite(firstDataRow) ? firstDataRow - 1 : -1; r >= 0; r--) {
    if (!isBlank(grid[r]?.[FIRST_PERIOD_COL])) { headerRow = r; break; }
  }
  const periodCols: number[] = [];
  if (headerRow >= 0) for (let c = FIRST_PERIOD_COL; !isBlank(grid[headerRow]?.[c]); c++) periodCols.push(c);

  const add = (code: PlIssueCode, severity: PlIssue["severity"], r: number, c: number, message: string): void => {
    issues.push({ code, severity, row_label: rawLabel(r), cell: addr(r, c), message });
  };
  const refsOf = (f: string): Array<{ col: string; row: number }> =>
    [...f.matchAll(CELL_REF)].map((m) => ({ col: m[1] as string, row: Number(m[2]) }));
  const refsAll = (f: string, c: number, wanted: Array<number | undefined>): boolean => {
    const refs = refsOf(f);
    return refs.every((x) => x.col === colName(c)) && wanted.every((w) => w !== undefined && refs.some((x) => x.row === w + 1));
  };

  for (const c of periodCols) {
    for (let r = headerRow + 1; r < grid.length; r++) {
      const cell = grid[r]?.[c];
      // Cached error results may arrive either as `error` or as the literal string, depending on the reader.
      const err = cell?.error ?? (typeof cell?.value === "string" ? cell.value : null);
      if (err && (PL_ERROR_LITERALS as readonly string[]).includes(err) && !isMargin(labels[r] ?? "")) {
        add(PL_ISSUE_CODES.CELL_ERROR, "error", r, c, `Ô ${addr(r, c)} đang báo lỗi ${err}.`);
      }
    }
    for (const r of [rows.net, rows.gross, rows.totalExp, rows.ebit, rows.ebt, rows.netEarn]) {
      if (r !== undefined && !grid[r]?.[c]?.formula) add(PL_ISSUE_CODES.TOTAL_NOT_FORMULA, "error", r, c, `Ô tổng ${addr(r, c)} phải là công thức, không được gõ đè số.`);
    }
    if (rows.interest !== undefined) {
      const f = grid[rows.interest]?.[c]?.formula;
      if (!f || !refsAll(f, c, [rows.loan, rows.rate]) || refsOf(f).some((x) => x.row === rows.interest! + 1)) {
        add(PL_ISSUE_CODES.INTEREST_BAD_REFERENCE, "error", rows.interest, c, `Ô ${addr(rows.interest, c)} phải nhân đúng Loan và Interest rate của cùng cột.`);
      }
    }
    if (rows.tax !== undefined) {
      const f = grid[rows.tax]?.[c]?.formula;
      if (!f) add(PL_ISSUE_CODES.TAX_NOT_FORMULA, "error", rows.tax, c, `Ô thuế ${addr(rows.tax, c)} phải là công thức dựa trên EBT.`);
      else if (!refsAll(f, c, [rows.ebt])) add(PL_ISSUE_CODES.TAX_BAD_REFERENCE, "error", rows.tax, c, `Công thức thuế ${addr(rows.tax, c)} phải tham chiếu EBT của cùng cột.`);
    }
    for (const r of inputRows) {
      const cell = grid[r]?.[c];
      if (isBlank(cell)) { add(PL_ISSUE_CODES.BLANK_INPUT, "warning", r, c, `Ô ${addr(r, c)} đang trống; nhập 0 nếu không phát sinh.`); continue; }
      const v = cell?.value;
      if (typeof v !== "number") continue;
      if (nonNegativeRows.has(r) && v < 0) add(PL_ISSUE_CODES.NEGATIVE_INPUT, "warning", r, c, `Ô ${addr(r, c)} đang âm.`);
      if (r === rows.rate && (v < PL_MIN_INTEREST_RATE || v > PL_MAX_INTEREST_RATE)) add(PL_ISSUE_CODES.INTEREST_RATE_RANGE, "warning", r, c, `Lãi suất ${addr(r, c)} phải nằm trong ${PL_MIN_INTEREST_RATE}–${PL_MAX_INTEREST_RATE} (ví dụ 0.02 = 2%).`);
    }
  }
  return issues;
}
