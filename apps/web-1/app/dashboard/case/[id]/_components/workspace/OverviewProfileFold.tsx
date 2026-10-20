"use client";

import { CaretDown } from "@phosphor-icons/react";
import type { Case, TeamFitReport } from "@/types";
import OverviewProfileDetails from "./OverviewProfileDetails";
import { countMissingProfileFields, deriveOverviewData } from "../overview/caseOverviewData";
import s from "./overview.module.css";

interface OverviewProfileFoldProps {
  caseData: Case;
  intakeSnapshot: unknown;
  teamFitReport?: TeamFitReport | null;
  onOpenSettings: () => void;
}

export default function OverviewProfileFold({
  caseData,
  intakeSnapshot,
  teamFitReport,
  onOpenSettings,
}: OverviewProfileFoldProps) {
  const data = deriveOverviewData(caseData, intakeSnapshot, teamFitReport);
  const missing = countMissingProfileFields(data);

  return (
    <details className={s.fold}>
      <summary className={s.foldSummary}>
        <span className={s.sectionTitle}>Hồ sơ dự án</span>
        {missing > 0 && (
          <span className={s.foldNote}>
            Còn thiếu {missing} thông tin ·{" "}
            <button
              type="button"
              className={s.foldLink}
              onClick={(e) => {
                // Inside <summary>: a click would also toggle the fold.
                e.preventDefault();
                onOpenSettings();
              }}
            >
              Bổ sung
            </button>
          </span>
        )}
        <CaretDown size={18} className={s.foldChevron} aria-hidden />
      </summary>
      <OverviewProfileDetails data={data} />
    </details>
  );
}
