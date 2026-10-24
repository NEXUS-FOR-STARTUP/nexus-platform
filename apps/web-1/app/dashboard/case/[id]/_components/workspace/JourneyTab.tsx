"use client";

import { STAGES } from "@app/shared/stages";
import type { CreditBalances } from "@/lib/credit-balances";
import type { StageSummary } from "../../hooks/useStageSummaries";
import PageHead from "../ui/PageHead";
import JourneyProgress from "./JourneyProgress";
import StageRow from "./StageRow";
import { STAGE_DESCRIPTIONS } from "./stage-descriptions";
import { stageQuestionTotal } from "./stage-status";
import s from "./overview.module.css";
import r from "./stage-rows.module.css";

const LOCKED_NOTE = "Mở sau khi hoàn thành các giai đoạn trước.";

interface JourneyTabProps {
  stages?: StageSummary[];
  balances?: CreditBalances | null;
  onOpenStage: (slug: string) => void;
}

export default function JourneyTab({ stages, balances, onOpenStage }: JourneyTabProps) {
  const summaryByCode = new Map(stages?.map((st) => [st.checkpoint_code, st]));

  return (
    <div className={s.page}>
      <PageHead title="Hành trình" note={`${STAGES.length} giai đoạn từ ý tưởng đến bài pitch.`} />
      <div className={s.group}>
        <JourneyProgress stages={stages} />
        <div className={r.rows}>
          {STAGES.map((stage) => {
            if (!stage.available) return <StageRow key={stage.code} locked name={stage.name} note={LOCKED_NOTE} />;
            const summary = summaryByCode.get(stage.code);
            const credits = stage.serviceType ? balances?.[stage.serviceType] ?? 0 : 0;
            const note = [
              STAGE_DESCRIPTIONS[stage.slug],
              `${summary?.answered_count ?? 0}/${stageQuestionTotal(stage.templateKey)} câu`,
              // Stages without a grading service take no uploads and have no credits.
              ...(stage.serviceType
                ? [`${summary?.file_count ?? 0} tài liệu`, credits > 0 ? `còn ${credits} lượt chấm` : "hết lượt chấm"]
                : []),
            ].join(" · ");
            return (
              <StageRow
                key={stage.code}
                name={stage.name}
                note={note}
                status={summary?.status}
                onOpen={() => onOpenStage(stage.slug)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
