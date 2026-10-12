export const CP2_REPORT_TYPES = ["cp2_questionnaire", "cp2_full", "cp2_full_resubmit"] as const;
export type Cp2ReportType = (typeof CP2_REPORT_TYPES)[number];

export function isCp2ReportType(value: string | null | undefined): value is Cp2ReportType {
  return value != null && (CP2_REPORT_TYPES as readonly string[]).includes(value);
}

/** Group key (as stored in report.json `categoryScores`) -> display label, in display order. */
const FULL_GROUP_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["evidence", "Bằng chứng sơ cấp"],
  ["market", "Quy mô thị trường"],
  ["customer", "Khách hàng và vấn đề"],
  ["product", "Sản phẩm và PMF"],
  ["competition", "Cạnh tranh"],
  ["compliance", "Yêu cầu bắt buộc"],
];

const QUESTIONNAIRE_GROUP_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["alignment", "Bám mục tiêu nghiên cứu"],
  ["interview", "Phỏng vấn"],
  ["survey", "Khảo sát"],
  ["ethics", "Đồng thuận và thử trước"],
];

export interface Cp2ScoreRow {
  label: string;
  score: number;
}

/** Labelled category rows for a CP2 report; groups absent from `categoryScores` are skipped. */
export function getCp2ScoreRows(reportType: Cp2ReportType, categoryScores: Record<string, unknown> | null | undefined): Cp2ScoreRow[] {
  const labels = reportType === "cp2_questionnaire" ? QUESTIONNAIRE_GROUP_LABELS : FULL_GROUP_LABELS;
  const rows: Cp2ScoreRow[] = [];
  for (const [key, label] of labels) {
    const score = categoryScores?.[key];
    if (typeof score === "number" && Number.isFinite(score)) rows.push({ label, score });
  }
  return rows;
}
