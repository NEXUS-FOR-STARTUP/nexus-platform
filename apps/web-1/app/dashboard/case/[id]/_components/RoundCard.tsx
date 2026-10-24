"use client";

import { useMemo, useState } from "react";
import { DownloadSimple as Download, ArrowSquareOut as ExternalLink, FileText, CaretDown as ChevronDown, CaretUp as ChevronUp } from "@phosphor-icons/react";
import { Badge, LoadingOverlay } from "@mantine/core";
import { Button } from "./ui/Button";
import { useDownloadReportPdfById } from "../hooks/useDownloadReportPdf";
import type { RoundHistoryEntry } from "@/types/case";
import {
  SUBMISSION_TYPE_LABELS,
  SCORED_REPORT_TYPE_LABELS,
  SUBMISSION_TYPE_COLORS,
  getReportPdfFilename,
  formatDateShort,
} from "./report.utils";

interface RoundCardProps {
  round: RoundHistoryEntry;
  caseId: string;
  projectName?: string;
  defaultExpanded?: boolean;
}

export default function RoundCard({ round, caseId, projectName: caseProjectName, defaultExpanded = false }: RoundCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [pdfLoading, setPdfLoading] = useState(true);

  const projectName = caseProjectName || "Dự án khởi nghiệp";
  const reportFilename = useMemo(
    () =>
      getReportPdfFilename(
        projectName,
        round.report?.report_type,
        round.report?.created_at || round.submitted_at,
        round.submission_type,
      ),
    [
      projectName,
      round.report?.report_type,
      round.report?.created_at,
      round.submitted_at,
      round.submission_type,
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
  const typeLabel =
    SCORED_REPORT_TYPE_LABELS[round.report?.report_type ?? ""] ?? SUBMISSION_TYPE_LABELS[submissionType] ?? "Báo cáo";
  const typeColor = SUBMISSION_TYPE_COLORS[submissionType] || "gray";
  const displayVersion = typeof round.version_no === "number" ? round.version_no + 1 : 1;
  return (
    <div className="border border-border-app rounded-xl overflow-hidden bg-surface-app animate-fade-in transition-all shadow-none">
      {/* Header bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-3 sm:py-3.5 text-left hover:bg-surface-soft/50 transition-colors cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-wrap">
          <Badge variant="light" color={typeColor} size="md" radius="sm" className="h-5 sm:h-6 text-[10px] sm:text-xs">
            {typeLabel}
          </Badge>
          <span className="text-sm sm:text-base font-bold text-text-app tracking-tight">
            Phiên bản {displayVersion}
          </span>
          <span className="text-[11px] sm:text-xs text-text-muted">
            {formatDateShort(round.submitted_at)}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {isExpanded && (
            <div className="hidden sm:flex items-center gap-2.5">
              <Button
                href={pdfViewUrl}
                external
                variant="quiet"
                size="sm"
                leftSection={<ExternalLink size={15} />}
              >
                Mở xem toàn màn hình
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftSection={<Download size={15} />}
                loading={isDownloadingPdf}
                onClick={handleDownload}
              >
                Tải báo cáo (PDF)
              </Button>
            </div>
          )}

          {/* Prominent Expand / Collapse toggle button at the far right */}
          <Button
            variant={isExpanded ? "quiet" : "primary"}
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            rightSection={isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          >
            {isExpanded ? "Thu gọn" : "Xem báo cáo"}
          </Button>
        </div>
      </div>

      {/* Mobile Action Bar (Only on mobile when expanded) */}
      {isExpanded && (
        <div
          className="sm:hidden px-3.5 py-2.5 bg-surface-soft/60 border-t border-border-app flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            href={pdfViewUrl}
            external
            variant="quiet"
            size="sm"
            leftSection={<ExternalLink size={14} />}
            className="flex-1"
          >
            Toàn màn hình
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftSection={<Download size={14} />}
            loading={isDownloadingPdf}
            onClick={handleDownload}
            className="flex-1"
          >
            Tải PDF
          </Button>
        </div>
      )}
      {/* Collapsible PDF Viewer Content */}
      {isExpanded && (
        <div className="border-t border-border-app">
          {round.report ? (
            <>
              <div className="hidden sm:block relative w-full h-[calc(100vh-440px)] min-h-[480px]">
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
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  leftSection={<ChevronUp size={14} />}
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
