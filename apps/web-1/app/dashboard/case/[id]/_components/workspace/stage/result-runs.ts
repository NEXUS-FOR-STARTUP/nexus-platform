import { isCp2ReportType } from "@repo/validation";
import type { Report, RoundHistoryEntry } from "@/types";

export interface ResultRun {
  id: string;
  label: string;
  submittedAt: string;
  isLatest: boolean;
  pdfUrl: string;
  versionNo: number | null;
  report: Report | null;
  submissionType: RoundHistoryEntry["submission_type"];
}

/**
 * Rounds owned by one stage, newest first. Ownership by checkpoint id; with no id, by report type.
 * Never falls back to the full history, or another stage's results leak in while the checkpoint row loads.
 */
export function toResultRuns(
  rounds: RoundHistoryEntry[] | null | undefined,
  checkpointId: string | undefined,
  checkpointCode: string | undefined,
): ResultRun[] {
  if (!rounds || rounds.length === 0) return [];
  let owned: RoundHistoryEntry[];
  if (checkpointId) {
    owned = rounds.filter((r) => r.report?.checkpoint_id === checkpointId);
  } else if (checkpointCode) {
    const wantsCp2 = checkpointCode === "CP2";
    owned = rounds.filter((r) => isCp2ReportType(r.report?.report_type) === wantsCp2);
  } else {
    return [];
  }
  const oldestFirst = [...owned].sort((a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at));
  return oldestFirst
    .map((r, i) => ({
      id: r.report_id,
      label: `Lần ${i + 1}`,
      submittedAt: r.submitted_at,
      isLatest: i === oldestFirst.length - 1,
      pdfUrl: r.pdfUrl || `/api/reports/${r.report_id}/download?view=inline`,
      versionNo: r.version_no,
      report: r.report,
      submissionType: r.submission_type,
    }))
    .reverse();
}
