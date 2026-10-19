"use client";

import { Group, Stack, Text, Badge, Button } from "@mantine/core";
import { ChevronLeft, Sparkles } from "lucide-react";
import BuyButton from "@/components/ui/BuyButton";
import type { StageDefinition } from "@app/shared/stages";
import { STAGE_DISPLAY_META, stageNumberOf } from "../stageDisplayMeta";
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
  const meta = STAGE_DISPLAY_META[stage.slug] ?? STAGE_DISPLAY_META["y-tuong"];

  return (
    <Stack gap="xs">
      <div>
        <Button variant="subtle" size="sm" leftSection={<ChevronLeft className="w-4 h-4" />} onClick={onBack}>
          Quay lại
        </Button>
      </div>

      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <Stack gap={2}>
          <Group gap={6} align="center">
            <Text fw={800} size="lg" c={meta.color}>
              {stageNumberOf(stage.code)}
            </Text>
            <Text fw={700} size="xl">{stage.name}</Text>
            {isGrading ? (
              <Badge color="orange" variant="filled">Đang chấm</Badge>
            ) : summary?.status === "has_result" ? (
              <Badge color="green" variant="light">Đã có kết quả</Badge>
            ) : null}
          </Group>
          <Text size="xs" c="dimmed">
            <Text span fw={700} c="blue.7">{summary?.answered_count ?? 0}/{TEMPLATE_REGISTRY[stage.templateKey]?.phases.flatMap((p) => p.questions).length ?? 0}</Text>
            {" "}câu đã trả lời / <Text span fw={700} c="blue.7">{summary?.file_count ?? 0}</Text> tệp đính kèm / Còn{" "}
            <Text span fw={700} c={creditsRemaining === 0 ? "red.7" : "blue.7"}>{creditsRemaining}</Text> lượt chấm
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
            <BuyButton size="md" onClick={onBuyCredits}>
              Mua lượt chấm
            </BuyButton>
          )}
        </Group>
      </Group>
    </Stack>
  );
}
