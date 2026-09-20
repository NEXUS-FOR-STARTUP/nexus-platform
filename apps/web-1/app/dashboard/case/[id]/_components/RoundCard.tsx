"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button, Badge, LoadingOverlay } from "@mantine/core";
import { useDownloadReportPdfById } from "../hooks/useDownloadReportPdf";
import type { RoundHistoryEntry } from "@/types/case";
import {
  type RichReportData,
  SUBMISSION_TYPE_LABELS,
  SUBMISSION_TYPE_COLORS,
  getReportPdfFilename,
  formatDateShort,
} from "./report.utils";

interface RoundCardProps {
  round: RoundHistoryEntry;
  caseId: string;
  defaultExpanded?: boolean;
}

export default function RoundCard({ round, caseId, defaultExpanded = false }: RoundCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [pdfLoading, setPdfLoading] = useState(true);

  const parsedReport = useMemo<RichReportData | null>(() => {
    if (!round.report) return null;
    const r = round.report;
    if (r.metadata_json && typeof r.metadata_json === "object") {
      return r.metadata_json as unknown as RichReportData;
    }
    if (!r.content_md) return null;
    try {
      const data = JSON.parse(r.content_md) as unknown;
      if (data && typeof data === "object") return data as RichReportData;
    } catch {
      // plain markdown
    }
    return null;
  }, [round.report]);

  const projectName = parsedReport?.projectName || "Dự án khởi nghiệp";
  const reportFilename = useMemo(
    () =>
      getReportPdfFilename(
        projectName,
        round.report?.created_at || round.submitted_at,
        round.submission_type,
        round.version_no,
      ),
    [
      projectName,
      round.report?.created_at,
      round.submitted_at,
      round.submission_type,
      round.version_no,
    ],
  );

  const pdfViewUrl =
    round.pdfUrl || (caseId ? `/api/cases/${caseId}/report/${reportFilename}?view=inline` : "");

  const { mutate: downloadReportPdf, isPending: isDownloadingPdf } = useDownloadReportPdfById();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadReportPdf({ reportId: round.report_id, caseShort: caseId, versionNo: round.version_no });
  };

  const submissionType = round.submission_type || "initial";
  const typeLabel = SUBMISSION_TYPE_LABELS[submissionType] || "Báo cáo";
  const typeColor = SUBMISSION_TYPE_COLORS[submissionType] || "gray";

  return (
    <div className="border border-border-app rounded-xl overflow-hidden bg-surface-app animate-fade-in transition-all shadow-none">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-surface-soft/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <Badge variant="light" color={typeColor} size="md" radius="sm">
            {typeLabel}
          </Badge>
          <span className="text-base font-bold text-text-app tracking-tight">
            {round.version_no ? `Phiên bản ${round.version_no}` : "Phiên bản —"}
          </span>
          <span className="text-xs text-text-muted">
            {formatDateShort(round.submitted_at)}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isExpanded && (
            <>
              <Button
                component="a"
                href={pdfViewUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="default"
                size="sm"
                leftSection={<ExternalLink size={15} />}
                className="font-medium"
              >
                Mở tab mới
              </Button>
              <Button
                leftSection={<Download size={15} />}
                color="brand"
                size="sm"
                loading={isDownloadingPdf}
                onClick={handleDownload}
                className="font-semibold cursor-pointer"
              >
                Tải PDF
              </Button>
            </>
          )}

          {/* Prominent Expand / Collapse toggle button at the far right */}
          <Button
            variant={isExpanded ? "default" : "light"}
            color={isExpanded ? "gray" : "brand"}
            size="md"
            onClick={() => setIsExpanded(!isExpanded)}
            rightSection={isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            className="font-bold text-sm cursor-pointer border border-border-app px-4 shadow-sm"
          >
            {isExpanded ? "Thu gọn" : "Xem báo cáo"}
          </Button>
        </div>
      </div>

      {/* Collapsible PDF Viewer Content */}
      {isExpanded && (
        <div className="border-t border-border-app">
          {round.report ? (
            <>
              <div className="relative w-full h-[calc(100vh-440px)] min-h-[480px]">
                <LoadingOverlay visible={pdfLoading} />
                <iframe
                  src={pdfViewUrl}
                  className="w-full h-full border-0"
                  title={`Báo cáo - ${typeLabel} - v${round.version_no ?? "?"}`}
                  onLoad={() => setPdfLoading(false)}
                />
              </div>
              <div className="flex items-center justify-end px-4 py-2 bg-surface-soft/40 border-t border-border-app">
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  onClick={() => setIsExpanded(false)}
                  leftSection={<ChevronUp size={14} />}
                  className="font-medium cursor-pointer hover:bg-surface-soft"
                >
                  Thu gọn báo cáo
                </Button>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 text-text-subtle mx-auto mb-2" />
              <p className="text-sm text-text-muted">Chưa có báo cáo cho phiên bản này.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
