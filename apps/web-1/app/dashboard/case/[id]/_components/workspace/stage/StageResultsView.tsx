"use client";

import { useMemo, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import type { RoundHistoryEntry } from "@/types";
import { formatDateShort } from "../../report.utils";
import { Button } from "../../ui/Button";
import ResultPdfViewer, { ResultPdfActions } from "./ResultPdfViewer";
import ResultRunList from "./ResultRunList";
import { toResultRuns } from "./result-runs";
import s from "./stage-results.module.css";

interface StageResultsViewProps {
  caseId: string;
  summary?: StageSummary;
  roundHistory?: RoundHistoryEntry[] | null;
  checkpointId?: string;
  projectName?: string;
  caseCode?: string;
  onGoDraft?: () => void;
  onGoFiles?: () => void;
  onAudit?: () => void;
}

export default function StageResultsView({
  caseId,
  summary,
  roundHistory,
  checkpointId,
  projectName,
  onGoDraft,
  onGoFiles,
  onAudit,
}: StageResultsViewProps) {
  const isDesktop = useMediaQuery("(min-width: 48em)");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const runs = useMemo(
    () => toResultRuns(roundHistory, checkpointId, summary?.checkpoint_code),
    [roundHistory, checkpointId, summary?.checkpoint_code],
  );

  if (runs.length === 0) {
    return (
      <div className={s.empty}>
        <h2>Chưa có kết quả chấm</h2>
        <p className={s.note}>Làm theo 3 bước để nhận kết quả:</p>
        <ol>
          <li>
            <button type="button" className={s.link} onClick={onGoDraft}>
              Trả lời các câu hỏi ở mục Soạn thảo.
            </button>
          </li>
          <li>
            <button type="button" className={s.link} onClick={onGoFiles}>
              Tải tài liệu ở mục Tài liệu.
            </button>
          </li>
          <li>Bấm Chấm bài.</li>
        </ol>
        <Button onClick={onAudit}>Chấm bài</Button>
      </div>
    );
  }

  if (!isDesktop) {
    return (
      <div>
        {runs.map((run, index) => (
          <details key={run.id} className={s.fold} open={index === 0}>
            <summary>
              Lịch sử chấm
              <span className={s.note}>{`${run.label}, ${formatDateShort(run.submittedAt)}`}</span>
            </summary>
            <div className={s.foldBody}>
              <ResultPdfActions run={run} caseId={caseId} openLabel="Mở PDF" />
            </div>
          </details>
        ))}
      </div>
    );
  }

  const selected = runs.find((run) => run.id === pickedId) ?? runs[0];
  return (
    <div className={s.layout}>
      <ResultRunList runs={runs} selectedId={selected.id} onSelect={setPickedId} />
      <ResultPdfViewer run={selected} caseId={caseId} projectName={projectName} />
    </div>
  );
}
