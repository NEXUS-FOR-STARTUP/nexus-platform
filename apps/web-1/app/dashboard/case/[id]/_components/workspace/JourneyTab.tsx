 "use client";

 import { useState } from "react";
 import { Stack, Text, Group, Select, SimpleGrid } from "@mantine/core";
 import { STAGES } from "@app/shared/stages";
 import StageCard from "./StageCard";
 import type { StageSummary } from "../../hooks/useStageSummaries";
 import type { CreditBalances } from "@/lib/credit-balances";
interface JourneyTabProps {
  stages?: StageSummary[];
  balances?: CreditBalances | null;
  onOpenStage: (slug: string) => void;
}

type Filter = "all" | "working" | "done" | "coming_soon";

export default function JourneyTab({ stages, balances, onOpenStage }: JourneyTabProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const summaryByCode = new Map(stages?.map((s) => [s.checkpoint_code, s]));

  const filteredStages = STAGES.filter((stage) => {
    const summary = summaryByCode.get(stage.code);
    if (filter === "all") return true;
    if (filter === "coming_soon") return !stage.available;
    if (!stage.available) return false;
    if (filter === "done") return summary?.status === "has_result";
    if (filter === "working") {
      return (
        summary?.status === "drafting" ||
        summary?.status === "files_submitted" ||
        summary?.status === "grading"
      );
    }
    return true;
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
        <div>
          <Text fw={700} size="xl">Hành trình dự án</Text>
          <Text size="sm" c="dimmed">
            {STAGES.length} giai đoạn phát triển ý tưởng khởi nghiệp từ sơ khai tới gọi vốn.
          </Text>
        </div>
        <Select
          value={filter}
          onChange={(val) => setFilter((val as Filter) || "all")}
          size="sm"
          allowDeselect={false}
          data={[
            { value: "all", label: "Tất cả" },
            { value: "working", label: "Đang làm" },
            { value: "done", label: "Đã xong" },
            { value: "coming_soon", label: "Sắp ra mắt" },
          ]}
          className="w-auto max-w-full ml-auto shrink-0 [&_input]:w-auto [&_input]:min-w-28"
        />
      </Group>
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {filteredStages.map((stage) => {
          const summary = summaryByCode.get(stage.code);
          const credits = stage.serviceType ? balances?.[stage.serviceType] ?? 0 : 0;
          return (
            <StageCard
              key={stage.code}
              stage={stage}
              summary={summary}
              creditsRemaining={credits}
              onOpen={() => onOpenStage(stage.slug)}
            />
          );
        })}
      </SimpleGrid>
    </Stack>
  );
 }
