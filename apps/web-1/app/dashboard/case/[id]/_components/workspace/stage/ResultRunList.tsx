"use client";

import { StatusChip } from "@/components/ui/StatusChip";
import { formatDateShort } from "../../report.utils";
import type { ResultRun } from "./result-runs";
import styles from "./result-runs.module.css";

interface ResultRunListProps {
  runs: ResultRun[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ResultRunList({ runs, selectedId, onSelect }: ResultRunListProps) {
  return (
    <div className={styles.list}>
      {runs.map((run) => (
        <button key={run.id} type="button" className={styles.runItem} data-active={run.id === selectedId} aria-pressed={run.id === selectedId} onClick={() => onSelect(run.id)}>
          <span className={styles.runLabel}>{run.label}</span>
          {run.isLatest && <span><StatusChip tone="ok">Mới nhất</StatusChip></span>}
          <span className={styles.note}>{formatDateShort(run.submittedAt)}</span>
        </button>
      ))}
    </div>
  );
}
