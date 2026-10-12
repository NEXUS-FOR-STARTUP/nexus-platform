// DEPRECATED (2026-10-10): part of the hidden Finance tab, replaced by the downloadable FINANCE TEMPLATE. Do not extend.
import { FINANCE_ROWS, type FinancePlan } from "@repo/validation";

/** Cell text per row key, one entry per period. Text (not numbers) so "29." survives while typing. */
export type CellTexts = Record<string, string[]>;

export const DEFAULT_PERIOD_COUNT = 4;

const VALUE_ROWS = FINANCE_ROWS.filter((row) => !row.section);

export const defaultPeriods = (): string[] =>
  Array.from({ length: DEFAULT_PERIOD_COUNT }, (_, i) => `Kỳ ${i + 1}`);

export function toTexts(plan: FinancePlan): CellTexts {
  const texts: CellTexts = {};
  for (const row of VALUE_ROWS) {
    texts[row.key] = plan.periods.map((_, i) => {
      const value = plan.values[row.key]?.[i];
      return value === null || value === undefined ? "" : String(value);
    });
  }
  return texts;
}

/** Blank → null; thousands separators (comma, space) are ignored; anything else non-numeric → "invalid". */
function parseCell(text: string): number | null | "invalid" {
  const cleaned = text.replace(/[,\s]/g, "");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : "invalid";
}

export interface InvalidCell {
  row: string;
  period: number;
}

export function toPlan(
  unit: string,
  periods: string[],
  texts: CellTexts,
  notes: string,
): { plan: FinancePlan } | { invalid: InvalidCell[] } {
  const values: FinancePlan["values"] = {};
  const invalid: InvalidCell[] = [];

  for (const row of VALUE_ROWS) {
    values[row.key] = periods.map((_, period) => {
      const parsed = parseCell(texts[row.key]?.[period] ?? "");
      if (parsed === "invalid") {
        invalid.push({ row: row.key, period });
        return null;
      }
      return parsed;
    });
  }

  return invalid.length > 0 ? { invalid } : { plan: { unit, periods, values, notes } };
}
