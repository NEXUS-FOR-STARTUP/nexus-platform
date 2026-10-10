// DEPRECATED (2026-10-10): part of the hidden Finance tab, replaced by the downloadable FINANCE TEMPLATE. Do not extend.
import { Workbook } from "exceljs";
import { FINANCE_ROWS, type FinancePlan } from "@repo/validation";

const SHEET_NAME = "P&L";
const EXPORT_FILE_NAME = "finance-plan.xlsx";
const LABEL_COLUMN_WIDTH = 44;
const VALUE_COLUMN_WIDTH = 16;

/**
 * Builds the workbook from exactly what the team typed. Cells are plain values,
 * never formulas, so the file contains no calculation the team did not make.
 */
export async function buildFinanceXlsx(plan: FinancePlan): Promise<ArrayBuffer> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet(SHEET_NAME);

  sheet.addRow(["Profit and Loss (P&L) Statement"]).font = { bold: true, size: 14 };
  sheet.addRow([`Unit: ${plan.unit}`]);
  sheet.addRow([]);
  sheet.addRow(["", ...plan.periods]).font = { bold: true };

  for (const row of FINANCE_ROWS) {
    if (row.section) {
      sheet.addRow([row.label]).font = { bold: true };
      continue;
    }
    const cells = plan.periods.map((_, i) => plan.values[row.key]?.[i] ?? null);
    const added = sheet.addRow([row.label, ...cells]);
    if (row.kind === "derived") added.font = { bold: true };
  }

  if (plan.notes.trim()) {
    sheet.addRow([]);
    sheet.addRow(["Notes"]).font = { bold: true };
    sheet.addRow([plan.notes]);
  }

  sheet.getColumn(1).width = LABEL_COLUMN_WIDTH;
  for (let col = 2; col <= plan.periods.length + 1; col++) {
    sheet.getColumn(col).width = VALUE_COLUMN_WIDTH;
  }

  return workbook.xlsx.writeBuffer();
}

export async function downloadFinanceXlsx(plan: FinancePlan): Promise<void> {
  const buffer = await buildFinanceXlsx(plan);
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = EXPORT_FILE_NAME;
  link.click();
  URL.revokeObjectURL(url);
}
