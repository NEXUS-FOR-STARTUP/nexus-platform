"use client";

import { Stack, Text } from "@mantine/core";
import { STAGES } from "@app/shared/stages";
import StageRow from "./StageRow";
import { stageQuestionTotal } from "./stage-status";
import { STAGE_DESCRIPTIONS } from "./stage-descriptions";
import s from "./overview.module.css";
import type { StageSummary } from "../../hooks/useStageSummaries";
import type { CreditBalances } from "@/lib/credit-balances";

interface JourneyTabProps {
  stages?: StageSummary[];
  balances?: CreditBalances | null;
  onOpenStage: (slug: string) => void;
}

export default function JourneyTab({ stages, balances, onOpenStage }: JourneyTabProps) {
  const summaryByCode = new Map(stages?.map((st) => [st.checkpoint_code, st]));
  const lockedNames = STAGES.filter((st) => !st.available).map((st) => st.name);

  return (
    <div className={s.page}>
      <Stack gap={4}>
        <h1 className={s.title}>Hành trình dự án</h1>
        <Text className={s.note}>
          {STAGES.length} giai đoạn phát triển ý tưởng khởi nghiệp từ sơ khai tới gọi vốn.
        </Text>
      </Stack>
      <Stack gap="sm">
        {STAGES.filter((st) => st.available).map((stage) => {
          const summary = summaryByCode.get(stage.code);
          const credits = stage.serviceType ? balances?.[stage.serviceType] ?? 0 : 0;
          const note = [
            STAGE_DESCRIPTIONS[stage.slug],
            `${summary?.answered_count ?? 0}/${stageQuestionTotal(stage.templateKey)} câu đã trả lời`,
            `${summary?.file_count ?? 0} tài liệu`,
            credits > 0 ? `Còn ${credits} lượt chấm` : "Hết lượt chấm",
          ].join("\n");
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
        {lockedNames.length > 0 && (
          <StageRow locked name={lockedNames.join(", ")} note="Sẵn sàng khi bạn hoàn thành các giai đoạn trước." />
        )}
      </Stack>
    </div>
  );
}
