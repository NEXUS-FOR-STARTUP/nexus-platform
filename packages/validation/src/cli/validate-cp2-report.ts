import { readFileSync } from "node:fs";
import type { Cp2SchemaId } from "../catalogs/cp2-audit-checks.js";
import { validateCp2Report } from "../catalogs/cp2-audit-report-schema.js";

/**
 * Standalone checker shipped into the job sandbox (bundled with zod, see tsup.cli.config.ts).
 * Usage: bun validate-report.mjs <report.json> <schemaId,schemaId>
 * Exit 0 = valid; 1 = invalid (problems on stdout, one per line); 2 = bad usage.
 */
const MAX_PROBLEMS_PRINTED = 30;
const EXIT_INVALID = 1;
const EXIT_USAGE = 2;

const [file, schemas] = process.argv.slice(2);
if (!file || !schemas) {
  console.error("usage: validate-report.mjs <report.json> <schemaId,schemaId>");
  process.exit(EXIT_USAGE);
}

let raw: unknown;
try {
  raw = JSON.parse(readFileSync(file, "utf-8"));
} catch (err: unknown) {
  console.log(`INVALID: ${file} không đọc được hoặc không phải JSON (${err instanceof Error ? err.message : String(err)})`);
  process.exit(EXIT_INVALID);
}

const result = validateCp2Report(raw, schemas.split(",") as Cp2SchemaId[]);
if (result.ok) {
  console.log("OK");
} else {
  console.log("INVALID: sửa các lỗi sau trong cùng tệp rồi chạy lại");
  for (const issue of result.issues.slice(0, MAX_PROBLEMS_PRINTED)) console.log(`- ${issue.path || "(gốc)"}: ${issue.message}`);
  if (result.issues.length > MAX_PROBLEMS_PRINTED) console.log(`- ... và ${result.issues.length - MAX_PROBLEMS_PRINTED} lỗi khác`);
  process.exit(EXIT_INVALID);
}
