import { CP2_REPORT_TYPES, getCp2ScoreRows, isCp2ReportType, type Cp2ReportType, type Cp2ScoreRow } from "./cp2-report-display.js";

export const CP3_REPORT_TYPES = ["cp3_full", "cp3_full_resubmit"] as const;
export type Cp3ReportType = (typeof CP3_REPORT_TYPES)[number];

/** Every report type produced by a scored audit service (CP2, CP3), in one list for callers that must not branch per service. */
export const SCORED_REPORT_TYPES = [...CP2_REPORT_TYPES, ...CP3_REPORT_TYPES] as const;
export type ScoredReportType = Cp2ReportType | Cp3ReportType;

export function isCp3ReportType(value: string | null | undefined): value is Cp3ReportType {
  return value != null && (CP3_REPORT_TYPES as readonly string[]).includes(value);
}

export function isScoredReportType(value: string | null | undefined): value is ScoredReportType {
  return isCp2ReportType(value) || isCp3ReportType(value);
}

/** Group key (as stored in report.json `categoryScores`) -> display label, in display order. */
const CP3_GROUP_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["customer_value", "Khách hàng và giá trị"],
  ["money_model", "Mô hình tiền"],
  ["operations", "Vận hành"],
  ["bmc_coherence", "Nhất quán mô hình"],
  ["swot_evidence", "Bằng chứng SWOT"],
  ["strategy", "Chiến lược"],
  ["conclusion", "Kết luận"],
];

/** Labelled category rows for any scored report; groups absent from `categoryScores` are skipped. */
export function getScoreRows(reportType: ScoredReportType, categoryScores: Record<string, unknown> | null | undefined): Cp2ScoreRow[] {
  if (!isCp3ReportType(reportType)) return getCp2ScoreRows(reportType, categoryScores);
  const rows: Cp2ScoreRow[] = [];
  for (const [key, label] of CP3_GROUP_LABELS) {
    const score = categoryScores?.[key];
    if (typeof score === "number" && Number.isFinite(score)) rows.push({ label, score });
  }
  return rows;
}
