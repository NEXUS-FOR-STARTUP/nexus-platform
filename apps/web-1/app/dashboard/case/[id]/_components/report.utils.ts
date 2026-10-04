import { buildStandardReportPdfFilename } from "@repo/validation";
export interface RichReportData {
  projectName?: string;
  overallScore?: number;
  verdict?: string;
  pdfUrl?: string;
  [key: string]: unknown;
}

export const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  initial: "Đánh giá lần đầu",
  resubmit: "Đánh giá lại",
  logic_check: "Kiểm tra lập luận",
};

export const SEVERITY_LABELS: Record<string, string> = {
  BLOCKER: "Cần giải quyết ngay",
  CRITICAL: "Quan trọng",
  MAJOR: "Cần lưu ý",
  MINOR: "Gợi ý hoàn thiện",
};

export const SUBMISSION_TYPE_COLORS: Record<string, string> = {
  initial: "blue",
  resubmit: "orange",
  logic_check: "violet",
};

export function makeDownloadSlug(name: string): string {
  return (
    name
      .replace(/[đĐ]/g, "d")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 50) || "project"
  );
}

export function getReportPdfFilename(
  projectName: string,
  createdAt?: string | Date | null,
  submissionType?: string | null,
  versionNo?: number | null,
): string {
  return buildStandardReportPdfFilename({
    projectName,
    createdAt,
    submissionType,
    versionNo,
  });
}

export function formatDateShort(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
