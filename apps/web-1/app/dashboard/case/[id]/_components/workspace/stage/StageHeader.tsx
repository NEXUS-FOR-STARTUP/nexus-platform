"use client";

import { Group, Stack, Text, Badge, Button, Anchor } from "@mantine/core";
import { ArrowLeft, Sparkles, FileDown, Plus } from "lucide-react";
import type { StageDefinition } from "@app/shared/stages";
import type { StageSummary } from "../../../hooks/useStageSummaries";

interface StageHeaderProps {
  stage: StageDefinition;
  summary?: StageSummary;
  creditsRemaining: number;
  onBack: () => void;
  onAudit: () => void;
  onBuyCredits: () => void;
  onExportDocx?: () => void;
  isExportingDocx?: boolean;
}

export default function StageHeader({
  stage,
  summary,
  creditsRemaining,
  onBack,
  onAudit,
  onBuyCredits,
  onExportDocx,
  isExportingDocx = false,
}: StageHeaderProps) {
  const isGrading = summary?.status === "grading";

  return (
    <Stack gap="xs" mb="md">
      <Anchor onClick={onBack} size="xs" c="dimmed" style={{ display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
        <ArrowLeft size={14} /> Quay lại Hành trình
      </Anchor>

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
            {summary?.answered_count ?? 0} câu đã trả lời · {summary?.file_count ?? 0} tệp đính kèm · Còn {creditsRemaining} lượt chấm
          </Text>
        </Stack>

        <Group gap="xs">
          {onExportDocx && (
            <Button
              size="xs"
              variant="default"
              leftSection={<FileDown size={14} />}
              loading={isExportingDocx}
              onClick={onExportDocx}
            >
              Xuất DOCX
            </Button>
          )}

          {creditsRemaining > 0 ? (
            <Button
              size="xs"
              color="blue"
              leftSection={<Sparkles size={14} />}
              disabled={isGrading}
              onClick={onAudit}
            >
              Chấm bài
            </Button>
          ) : (
            <Button
              size="xs"
              color="orange"
              leftSection={<Plus size={14} />}
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
