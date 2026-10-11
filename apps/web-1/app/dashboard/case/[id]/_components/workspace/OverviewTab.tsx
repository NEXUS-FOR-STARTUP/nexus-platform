"use client";

import { Stack, Text } from "@mantine/core";
import NextActions from "./NextActions";
import ProfileSummaryCard from "./ProfileSummaryCard";
import ZaloSupportCard from "./ZaloSupportCard";
import { buildNextActions } from "../../hooks/useNextActions";
import type { StageSummary } from "../../hooks/useStageSummaries";
import type { Case } from "@/types";

interface OverviewTabProps {
  caseData?: Case;
  stages?: StageSummary[];
  onOpenStage: (slug: string, view: "draft" | "files" | "results") => void;
  onEditProfile: () => void;
}

export default function OverviewTab({
  caseData,
  stages,
  onOpenStage,
  onEditProfile,
}: OverviewTabProps) {
  const actions = buildNextActions(stages);

  return (
    <Stack gap="lg">
      <div>
        <Text fw={700} size="xl">Tổng quan dự án</Text>
        <Text size="sm" c="dimmed">
          Theo dõi tiến độ, những việc cần làm tiếp theo và thông tin dự án của bạn.
        </Text>
      </div>

      <NextActions actions={actions} onOpenStage={onOpenStage} />

      <ProfileSummaryCard caseData={caseData} onEditProfile={onEditProfile} />

      <ZaloSupportCard />
    </Stack>
  );
}
