"use client";

import { STAGES } from "@app/shared/stages";
import type { StageSummary } from "../../hooks/useStageSummaries";
import JourneyProgress from "./JourneyProgress";
import StageRow from "./StageRow";
import { STAGE_STATUS, stageQuestionTotal } from "./stage-status";
import type { StageView } from "./stage-view";
import s from "./overview.module.css";
import r from "./stage-rows.module.css";

interface OverviewJourneyListProps {
  stages?: StageSummary[];
  onOpenStage: (slug: string, view: StageView) => void;
}

export default function OverviewJourneyList({ stages, onOpenStage }: OverviewJourneyListProps) {
  const summaryByCode = new Map(stages?.map((st) => [st.checkpoint_code, st]));

  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>Hành trình</h2>
      <div className={s.progress}>
        <JourneyProgress stages={stages} />
      </div>
      <div className={r.rows}>
        {STAGES.map((stage) => {
          const summary = summaryByCode.get(stage.code);
          const status = summary?.status ?? "not_started";
          return (
            <StageRow
              key={stage.code}
              name={stage.name}
              status={status}
              note={`Đã trả lời ${summary?.answered_count ?? 0}/${stageQuestionTotal(stage.templateKey)} câu${stage.serviceType ? ` · ${summary?.file_count ?? 0} tài liệu` : ""}`}
              onOpen={() => onOpenStage(stage.slug, STAGE_STATUS[status].view)}
            />
          );
        })}
      </div>
    </section>
  );
}
