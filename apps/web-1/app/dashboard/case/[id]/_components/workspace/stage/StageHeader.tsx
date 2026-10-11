"use client";

import { Group, Stack, Text, Badge, Button } from "@mantine/core";
import { ChevronLeft, Sparkles, Plus } from "lucide-react";
import type { StageDefinition } from "@app/shared/stages";
import { TEMPLATE_REGISTRY } from "@repo/validation";
import type { StageSummary } from "../../../hooks/useStageSummaries";

interface StageHeaderProps {
  stage: StageDefinition;
  summary?: StageSummary;
  creditsRemaining: number;
  onBack: () => void;
  onAudit: () => void;
  onBuyCredits: () => void;
}

export default function StageHeader({
  stage,
  summary,
  creditsRemaining,
  onBack,
  onAudit,
  onBuyCredits,
}: StageHeaderProps) {
  const isGrading = summary?.status === "grading";
  const hasResult = summary?.status === "has_result";
  const auditLabel = hasResult ? "Chấm lại" : "Chấm bài";

  return (
    <Stack gap="xs">
      <div>
        <Button variant="subtle" size="sm" leftSection={<ChevronLeft className="w-4 h-4" />} onClick={onBack}>
          Quay lại
        </Button>
      </div>

      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Stack gap={2}>
          <Group gap="xs">
            <Text fw={700} size="xl">{stage.name}</Text>
            {isGrading ? (
              <Badge color="orange" variant="filled">Đang chấm</Badge>
            ) : summary?.status === "has_result" ? (
              <Badge color="green" variant="light">Đã có kết quả</Badge>
            ) : null}
          </Group>
          <Text size="xs" c="dimmed">
            {summary?.answered_count ?? 0}/
            {TEMPLATE_REGISTRY[stage.templateKey]?.phases.flatMap((p) => p.questions).length ?? 0}{" "}
            câu đã trả lời · {summary?.file_count ?? 0} tệp đính kèm · Còn {creditsRemaining} lượt chấm
          </Text>
        </Stack>

        <Group gap="xs">
          {creditsRemaining > 0 ? (
            <Button
              size="sm"
              color="blue"
              leftSection={<Sparkles size={16} />}
              disabled={isGrading}
              onClick={onAudit}
            >
              {auditLabel}
            </Button>
          ) : (
            <Button
              size="sm"
              color="orange"
              leftSection={<Plus size={16} />}
              onClick={onBuyCredits}
            >
              Mua lượt chấm
            </Button>
          )}
        </Group>
      </Group>
    </Stack>
  );
}
