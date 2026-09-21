"use client";

import { useMemo, useState, useEffect } from "react";
import { Download, ExternalLink, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button, Group, Stack, Tooltip, LoadingOverlay } from "@mantine/core";
import { useDownloadReportPdf } from "../hooks/useDownloadReportPdf";
import type { RoundHistoryEntry } from "@/types/case";
import RoundCard from "./RoundCard";
import { type RichReportData, getReportPdfFilename } from "./report.utils";

interface TabReportFindingsProps {
  report: {
    content_md: string;
    metadata_json?: Record<string, unknown> | null;
    created_at?: string | Date | null;
  } | null;
  caseId?: string;
  roundHistory?: RoundHistoryEntry[] | null;
}

export default function TabReportFindings({ report, caseId, roundHistory }: TabReportFindingsProps) {
  const [pdfLoading, setPdfLoading] = useState(true);
  const [isSingleExpanded, setIsSingleExpanded] = useState(true);

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
          <h4 className="font-heading font-semibold text-sm text-text-app">Chưa có báo cáo đánh giá</h4>
          <p className="font-body text-xs text-text-muted leading-relaxed">
            Báo cáo đánh giá chi tiết sẽ xuất hiện tại đây sau khi hệ thống hoàn tất quá trình phân tích tài liệu của nhóm.
          </p>
        </div>
      </div>
    );
  }

  // Has round history — render round list with first round expanded and others collapsed
  if (roundHistory && roundHistory.length > 0) {
    return (
      <Stack gap="md" className="animate-fade-in font-body pb-8">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-sm text-text-app">
            Lịch sử các lần đánh giá ({roundHistory.length} phiên bản)
          </h3>
        </div>

        <Stack gap="sm">
          {roundHistory.map((round, index) => (
            <RoundCard
              key={round.report_id}
              round={round}
              caseId={caseId || ""}
              defaultExpanded={index === 0}
            />
          ))}
        </Stack>
      </Stack>
    );
  }

  // Fallback: has report but no round history — show legacy single-report view with expand/collapse
  const projectName = parsedReport?.projectName || "Dự án khởi nghiệp";
  const reportFilename = getReportPdfFilename(projectName, report?.created_at);
  const pdfViewUrl = caseId ? `/api/cases/${caseId}/report/${reportFilename}?view=inline` : "";

  useEffect(() => {
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
          {isSingleExpanded && (
            <>
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
                  Mở xem toàn màn hình
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
                Tải báo cáo (PDF)
              </Button>
            </>
          )}

          {/* Prominent Expand / Collapse toggle button at the far right */}
          <Button
            variant={isSingleExpanded ? "default" : "light"}
            color={isSingleExpanded ? "gray" : "brand"}
            size="md"
            onClick={() => setIsSingleExpanded(!isSingleExpanded)}
            rightSection={isSingleExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            className="font-bold text-sm cursor-pointer border border-border-app px-4 shadow-sm"
          >
            {isSingleExpanded ? "Thu gọn" : "Xem báo cáo"}
          </Button>
        </Group>
      )}

      {caseId && isSingleExpanded && (
        <div className="relative w-full h-[calc(100vh-380px)] min-h-[480px] rounded-xl overflow-hidden border border-border-app bg-surface-app">
          <LoadingOverlay visible={pdfLoading} />
          <iframe
            src={pdfViewUrl}
            className="w-full h-full border-0"
            title={`Báo cáo đánh giá - ${projectName}`}
            onLoad={() => setPdfLoading(false)}
          />
        </div>
      )}
    </Stack>
  );
}
