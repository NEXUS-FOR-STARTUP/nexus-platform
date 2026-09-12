"use client";

import React, { useMemo, useState } from "react";
import { Download, ExternalLink, FileText } from "lucide-react";
import { Button, Group, Stack, Tooltip, LoadingOverlay, Badge } from "@mantine/core";
import { useDownloadReportPdf, useDownloadReportPdfById } from "../hooks/useDownloadReportPdf";
import type { RoundHistoryEntry, Report } from "@/types/case";

export interface RichReportData {
  projectName?: string;
  overallScore?: number;
  verdict?: string;
  pdfUrl?: string;
  [key: string]: unknown;
}

interface TabReportFindingsProps {
  report: {
    content_md: string;
    metadata_json?: Record<string, unknown> | null;
    created_at?: string | Date | null;
  } | null;
  caseId?: string;
  roundHistory?: RoundHistoryEntry[] | null;
}

const SUBMISSION_TYPE_LABELS: Record<string, string> = {
  initial: "Lần đầu",
  resubmit: "Đã sửa",
  logic_check: "Soi logic",
};

const SUBMISSION_TYPE_COLORS: Record<string, string> = {
  initial: "blue",
  resubmit: "orange",
  logic_check: "violet",
};


function makeDownloadSlug(name: string): string {
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

function getReportPdfFilename(projectName: string, createdAt?: string | Date | null): string {
  const slug = makeDownloadSlug(projectName);
  const d = createdAt ? new Date(createdAt) : new Date();
  const validDate = isNaN(d.getTime()) ? new Date() : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${validDate.getFullYear()}${pad(validDate.getMonth() + 1)}${pad(validDate.getDate())}${pad(validDate.getHours())}${pad(validDate.getMinutes())}${pad(validDate.getSeconds())}`;
  return `${slug}_input_clarification_${timestamp}.pdf`;
}

function formatDateShort(dateStr?: string | null): string {
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

function RoundCard({ round, caseId }: { round: RoundHistoryEntry; caseId: string }) {
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
    () => getReportPdfFilename(projectName, round.report?.created_at),
    [projectName, round.report?.created_at],
  );

  const pdfViewUrl = round.pdfUrl || (caseId ? `/api/cases/${caseId}/report/${reportFilename}?view=inline` : "");

  const { mutate: downloadReportPdf, isPending: isDownloadingPdf } = useDownloadReportPdfById();

  const handleDownload = () => {
    downloadReportPdf({ reportId: round.report_id, caseShort: caseId, versionNo: round.version_no });
  };

  const typeLabel = SUBMISSION_TYPE_LABELS[round.submission_type] || round.submission_type;
  const typeColor = SUBMISSION_TYPE_COLORS[round.submission_type] || "gray";

  return (
    <div className="border border-border-app rounded-xl overflow-hidden bg-surface-app animate-fade-in">
      {/* Header — content below always open */}
      <div className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="flex items-center gap-3 min-w-0">
          <Badge variant="light" color={typeColor} size="sm">
            {typeLabel}
          </Badge>
          <span className="text-sm font-semibold text-text-app">
            {round.version_no ? `Phiên bản ${round.version_no}` : "Phiên bản —"}
          </span>
          <span className="text-xs text-text-muted">
            {formatDateShort(round.submitted_at)}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
        </div>
      </div>

      {/* Content — always open, no collapse */}
      <div className="border-t border-border-app">
          {round.report ? (
            <div className="relative w-full h-[calc(100vh-440px)] min-h-[480px]">
              <LoadingOverlay visible={pdfLoading} />
              <iframe
                src={pdfViewUrl}
                className="w-full h-full border-0"
                title={`Báo cáo - ${typeLabel} - v${round.version_no ?? "?"}`}
                onLoad={() => setPdfLoading(false)}
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 text-text-subtle mx-auto mb-2" />
              <p className="text-sm text-text-muted">Chưa có báo cáo cho phiên bản này.</p>
            </div>
          )}
      </div>
    </div>
  );
}

export default function TabReportFindings({ report, caseId, roundHistory }: TabReportFindingsProps) {
  const [pdfLoading, setPdfLoading] = useState(true);
  const parsedReport = useMemo<RichReportData | null>(() => {
    if (report?.metadata_json && typeof report.metadata_json === "object") {
      return report.metadata_json as unknown as RichReportData;
    }
    if (!report?.content_md) return null;
    try {
      const data = JSON.parse(report.content_md) as unknown;
      if (data && typeof data === "object") {
        return data as RichReportData;
      }
    } catch {
      // Content is plain markdown
    }
    return null;
  }, [report]);

  // If no report at all, show empty state
  if (!report && (!roundHistory || roundHistory.length === 0)) {
    return (
      <div className="bg-surface-app border border-border-app rounded-lg p-8 md:p-12 text-center flex flex-col items-center justify-center gap-4 animate-fade-in font-body">
        <div className="w-12 h-12 rounded-full bg-surface-soft border border-border-app text-text-subtle flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h4 className="font-heading font-semibold text-sm text-text-app">Chưa có báo cáo phản biện</h4>
          <p className="font-body text-xs text-text-muted leading-relaxed">
            Báo cáo phản biện chính thức sẽ hiển thị ở đây sau khi hệ thống hoàn tất thẩm định ý tưởng khởi nghiệp.
          </p>
        </div>
      </div>
    );
  }

  // Has round history — render round list
  if (roundHistory && roundHistory.length > 0) {
    return (
      <Stack gap="md" className="animate-fade-in font-body pb-8">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-sm text-text-app">
            Lịch sử đánh giá ({roundHistory.length} lượt)
          </h3>
        </div>

        <Stack gap="sm">
          {roundHistory.map((round) => (
            <RoundCard
              key={round.report_id}
              round={round}
              caseId={caseId || ""}
            />
          ))}
        </Stack>
      </Stack>
    );
  }

  // Fallback: has report but no round history — show legacy single-report view
  const projectName = parsedReport?.projectName || "Dự án khởi nghiệp";
  const reportFilename = useMemo(() => {
    return getReportPdfFilename(projectName, report?.created_at);
  }, [projectName, report?.created_at]);

  const pdfViewUrl = caseId ? `/api/cases/${caseId}/report/${reportFilename}?view=inline` : "";

  React.useEffect(() => {
    if (pdfViewUrl) {
      setPdfLoading(true);
    }
  }, [pdfViewUrl]);

  const { mutate: downloadPdf, isPending: isDownloadingPdf } = useDownloadReportPdf(caseId || "");

  const handleDownloadPdf = () => {
    if (!caseId) return;
    setPdfLoading(true);
    downloadPdf(reportFilename);
  };

  return (
    <Stack gap="md" className="animate-fade-in font-body pb-8">
      {caseId && (
        <Group gap="xs" justify="flex-end">
          <Tooltip label="Mở file PDF trong tab mới để in ấn hoặc đọc toàn màn hình">
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
          </Tooltip>

          <Button
            leftSection={<Download size={15} />}
            color="brand"
            size="sm"
            loading={isDownloadingPdf}
            onClick={handleDownloadPdf}
            className="font-semibold cursor-pointer"
          >
            Tải Báo Cáo PDF
          </Button>
        </Group>
      )}

      {caseId && (
        <div className="relative w-full h-[calc(100vh-380px)] min-h-[480px] rounded-xl overflow-hidden border border-border-app bg-surface-app">
          <LoadingOverlay visible={pdfLoading} />
          <iframe
            src={pdfViewUrl}
            className="w-full h-full border-0"
            title={`Báo cáo phản biện - ${projectName}`}
            onLoad={() => setPdfLoading(false)}
          />
        </div>
      )}
    </Stack>
  );
}
