"use client";

import { useState } from "react";
import { LoadingOverlay } from "@mantine/core";
import { DownloadSimpleIcon } from "@phosphor-icons/react";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import { useDownloadReportPdfById } from "../../../hooks/useDownloadReportPdf";
import { formatDateShort, getReportPdfFilename } from "../../report.utils";
import { Button } from "../../ui/Button";
import type { ResultRun } from "./result-runs";
import s from "./stage-results.module.css";

interface ResultPdfActionsProps {
  run: ResultRun;
  caseId: string;
  openLabel: string;
}

export function ResultPdfActions({ run, caseId, openLabel }: ResultPdfActionsProps) {
  const { mutate: download, isPending } = useDownloadReportPdfById();
  return (
    <div className={s.acts}>
      <Button variant="quiet" href={run.pdfUrl} external>
        {openLabel}
      </Button>
      <Button
        leftSection={<DownloadSimpleIcon size={16} aria-hidden />}
        loading={isPending}
        onClick={() => download({ reportId: run.id, caseShort: caseId, versionNo: run.versionNo })}
      >
        Tải PDF
      </Button>
    </div>
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
    <section className={s.viewer}>
      <div className={s.viewerHead}>
        <div className={s.file}>
          <FileTypeIcon name={fileName} size={32} />
          <div>
            <div className={s.fileName}>{fileName}</div>
            <div className={s.note}>PDF · Chấm lúc {formatDateShort(run.submittedAt)}</div>
          </div>
        </div>
        <ResultPdfActions run={run} caseId={caseId} openLabel="Mở toàn màn hình" />
      </div>
      <div className={s.paper}>
        <div className={s.frameWrap}>
          <LoadingOverlay visible={loadedUrl !== run.pdfUrl} />
          <iframe key={run.pdfUrl} src={run.pdfUrl} className={s.frame} title={`Báo cáo ${run.label}`} onLoad={() => setLoadedUrl(run.pdfUrl)} />
        </div>
      </div>
    </section>
  );
}
