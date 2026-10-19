"use client";

import { useMemo, useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import type { RoundHistoryEntry } from "@/types";
import { formatDateShort } from "../../report.utils";
import ResultPdfViewer, { ResultPdfActions } from "./ResultPdfViewer";
import ResultsEmptyState from "./ResultsEmptyState";
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
      <ResultsEmptyState
        answeredCount={summary?.answered_count ?? 0}
        fileCount={summary?.file_count ?? 0}
        onGoDraft={onGoDraft}
        onGoFiles={onGoFiles}
        onAudit={onAudit}
      />
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
