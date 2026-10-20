"use client";

import { formatDateShort } from "../../report.utils";
import type { ResultRun } from "./result-runs";
import s from "./stage-results.module.css";

interface ResultRunListProps {
  runs: ResultRun[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ResultRunList({ runs, selectedId, onSelect }: ResultRunListProps) {
  return (
    <section className={s.list} aria-label="Lịch sử chấm">
      <div className={s.listHead}>
        <h2 className={s.listTitle}>Lịch sử chấm</h2>
        <span className={s.note}>{runs.length} lần</span>
      </div>
      <div className={s.runs}>
        {runs.map((run) => (
          <button
            key={run.id}
            type="button"
            className={s.run}
            data-active={run.id === selectedId}
            aria-pressed={run.id === selectedId}
            onClick={() => onSelect(run.id)}
          >
            <span className={s.runLabel}>
              {run.label}
              {run.isLatest && <span className={s.chip}>Mới nhất</span>}
            </span>
            <span className={s.note}>{formatDateShort(run.submittedAt)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
