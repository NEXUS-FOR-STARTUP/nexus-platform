import { validatePlWorkbook } from "../finance/pl-validator.js";
import { readPlSheets } from "./read-pl-sheets.js";

/** Usage: tsx src/cli/validate-pl-workbook.ts <file.xlsx>. Exit 1 when any blocking error exists. */
const EXIT_BLOCKING = 1;
const EXIT_USAGE = 2;
const file = process.argv[2];
if (!file) {
  console.error("usage: validate-pl-workbook <file.xlsx>");
  process.exit(EXIT_USAGE);
}
const issues = validatePlWorkbook(await readPlSheets(file));
for (const i of issues) console.log(`${i.severity.toUpperCase()} ${i.code} ${i.cell ?? "-"} [${i.row_label}] ${i.message}`);
console.log(`${issues.length} issue(s), ${issues.filter((i) => i.severity === "error").length} error(s)`);
process.exit(issues.some((i) => i.severity === "error") ? EXIT_BLOCKING : 0);
