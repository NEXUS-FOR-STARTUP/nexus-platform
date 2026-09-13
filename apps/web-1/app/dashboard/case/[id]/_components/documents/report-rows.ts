import type { RoundHistoryEntry } from "@/types/case";
import type { DocumentRow } from "./document-workspace.types";

export const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  initial: "Lần đầu",
  resubmit: "Đã sửa",
  logic_check: "Soi logic",
};

export function buildAssessmentReportRows(
  history: RoundHistoryEntry[] | null | undefined,
  projectName?: string,
  caseCode?: string,
): DocumentRow[] {
  if (!history || history.length === 0) return [];

  return history.map((round) => {
    const vNum = round.version_no ?? 1;
    const vLabel = `v${String(vNum).padStart(2, "0")}`;
    const submissionType = round.submission_type || "initial";
    const typeLabel = SUBMISSION_TYPE_LABELS[submissionType] || "Báo cáo";
    const rawName = projectName || caseCode || "de_an";
    const slug = rawName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const fileName = `${slug}_bao_cao_phan_bien_${vLabel}.pdf`;
    const url = round.pdfUrl || `/api/reports/${round.report_id}/download`;

    return {
      key: `report-${round.report_id}`,
      versionLabel: vLabel,
      contextLabel: typeLabel,
      categoryKey: "report",
      displayName: fileName,
      url,
      hasAction: true,
      sourceLabel: "Hệ thống AI",
      formatLabel: "PDF",
      uploaderLabel: "Nexus AI",
      uploaderRole: "supporter",
      createdAt: round.submitted_at || "",
    };
  });
}
