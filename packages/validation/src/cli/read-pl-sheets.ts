import ExcelJS from "exceljs";
import type { PlCell, PlSheet } from "../finance/pl-validator.js";

/** Convert an .xlsx file or buffer into the plain grids the pure P&L validator expects. */
export async function readPlSheets(source: string | Uint8Array): Promise<PlSheet[]> {
  const wb = new ExcelJS.Workbook();
  if (typeof source === "string") await wb.xlsx.readFile(source);
  else await wb.xlsx.load(source as unknown as ArrayBuffer);
  return wb.worksheets.map((ws) => {
    const grid: Array<Array<PlCell | null>> = [];
    ws.eachRow({ includeEmpty: false }, (row, r) => {
      const cells: Array<PlCell | null> = [];
      row.eachCell({ includeEmpty: false }, (cell, c) => {
        const v = cell.value;
        const isObj = v !== null && typeof v === "object" && !(v instanceof Date);
        const formula = isObj && ("formula" in v || "sharedFormula" in v) ? (cell.formula ?? null) : null;
        const raw = isObj && "result" in v ? v.result : v;
        const errObj = isObj && "error" in v ? String(v.error) : raw !== null && typeof raw === "object" && "error" in raw ? String((raw as { error: string }).error) : null;
        const plain = raw === null || typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean" ? raw : null;
        cells[c - 1] = { formula, value: plain ?? null, error: errObj };
      });
      grid[r - 1] = cells;
    });
    return { name: ws.name, grid: Array.from(grid, (row) => row ?? []) };
  });
}
