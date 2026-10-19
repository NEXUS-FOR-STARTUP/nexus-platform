"use client";

import { Stack } from "@mantine/core";
import { STAGES } from "@app/shared/stages";
import type { StageSummary } from "../../hooks/useStageSummaries";
import StageRow from "./StageRow";
import { STAGE_STATUS, stageQuestionTotal } from "./stage-status";
import type { StageView } from "./stage-view";
import s from "./overview.module.css";

interface OverviewJourneyListProps {
  stages?: StageSummary[];
  onOpenStage: (slug: string, view: StageView) => void;
}

export default function OverviewJourneyList({ stages, onOpenStage }: OverviewJourneyListProps) {
  const summaryByCode = new Map(stages?.map((st) => [st.checkpoint_code, st]));
  const locked = STAGES.filter((st) => !st.available);

  return (
    <section className={s.section}>
      <h2 className={s.sectionTitle}>Hành trình</h2>
      <Stack gap="sm">
        {STAGES.filter((st) => st.available).map((stage) => {
          const summary = summaryByCode.get(stage.code);
          const status = summary?.status ?? "not_started";
          return (
            <StageRow
              key={stage.code}
              name={stage.name}
              status={status}
              note={`Đã trả lời ${summary?.answered_count ?? 0}/${stageQuestionTotal(stage.templateKey)} câu\n${summary?.file_count ?? 0} tài liệu`}
              onOpen={() => onOpenStage(stage.slug, STAGE_STATUS[status].view)}
            />
          );
        })}
        {locked.length > 0 && <StageRow locked name="Sẽ mở sau" note={locked.map((st) => st.name).join(", ")} />}
      </Stack>
    </section>
  );
}
