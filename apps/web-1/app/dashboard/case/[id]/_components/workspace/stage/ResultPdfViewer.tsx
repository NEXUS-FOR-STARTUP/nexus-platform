"use client";

import { useState } from "react";
import { Button, Group, LoadingOverlay, Text } from "@mantine/core";
import { DownloadSimple as Download, ArrowSquareOut as ExternalLink } from "@phosphor-icons/react";
import { useDownloadReportPdfById } from "../../../hooks/useDownloadReportPdf";
import { formatDateShort, getReportPdfFilename } from "../../report.utils";
import type { ResultRun } from "./result-runs";
import styles from "./result-runs.module.css";

interface ResultPdfActionsProps {
  run: ResultRun;
  caseId: string;
  openLabel: string;
}

export function ResultPdfActions({ run, caseId, openLabel }: ResultPdfActionsProps) {
  const { mutate: download, isPending } = useDownloadReportPdfById();
  return (
    <Group gap="xs">
      <Button component="a" href={run.pdfUrl} target="_blank" rel="noopener noreferrer" variant="default" leftSection={<ExternalLink size={16} />}>
        {openLabel}
      </Button>
      <Button leftSection={<Download size={16} />} loading={isPending} onClick={() => download({ reportId: run.id, caseShort: caseId, versionNo: run.versionNo })}>
        Tải PDF
      </Button>
    </Group>
  );
}

interface ResultPdfViewerProps {
  run: ResultRun;
  caseId: string;
  projectName?: string;
}

export default function ResultPdfViewer({ run, caseId, projectName }: ResultPdfViewerProps) {
  const [loadedUrl, setLoadedUrl] = useState<string | null>(null);
  const fileName = getReportPdfFilename(projectName || "Dự án khởi nghiệp", run.report?.report_type, run.report?.created_at || run.submittedAt, run.submissionType);

  return (
    <div className={styles.viewer}>
      <div className={styles.viewerHead}>
        <div>
          <div className={styles.fileName}>{fileName}</div>
          <Text className={styles.note}>{`PDF\nChấm lúc ${formatDateShort(run.submittedAt)}`}</Text>
        </div>
        <ResultPdfActions run={run} caseId={caseId} openLabel="Mở toàn màn hình" />
      </div>
      <div className={styles.frameWrap}>
        <LoadingOverlay visible={loadedUrl !== run.pdfUrl} />
        <iframe key={run.pdfUrl} src={run.pdfUrl} className={styles.frame} title={`Báo cáo ${run.label}`} onLoad={() => setLoadedUrl(run.pdfUrl)} />
      </div>
    </div>
  );
}
