"use client";

import { Paper, Stack, Group, Text, Badge, Button } from "@mantine/core";
import { ArrowRight, Lock } from "lucide-react";
import type { StageDefinition } from "@app/shared/stages";
import type { StageSummary } from "../../hooks/useStageSummaries";

interface StageCardProps {
  stage: StageDefinition;
  summary?: StageSummary;
  creditsRemaining: number;
  onOpen: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  not_started: { label: "Chưa bắt đầu", color: "gray" },
  drafting: { label: "Đang soạn", color: "blue" },
  files_submitted: { label: "Đã nộp tệp", color: "cyan" },
  grading: { label: "Đang chấm", color: "orange" },
  has_result: { label: "Đã có kết quả", color: "green" },
};

export default function StageCard({
  stage,
  summary,
  creditsRemaining,
  onOpen,
}: StageCardProps) {
  const isAvailable = stage.available;
  const statusInfo = STATUS_LABELS[summary?.status ?? "not_started"] ?? STATUS_LABELS.not_started!;

  return (
    <Paper
      p="md"
      withBorder
      radius="md"
      className={`transition-shadow ${isAvailable ? "hover:shadow-sm" : "opacity-60 bg-gray-50"}`}
    >
      <Stack justify="space-between" h="100%" gap="md">
        <Stack gap="xs">
          <Group justify="space-between" align="flex-start">
            <Text fw={600} size="md">{stage.name}</Text>
            {isAvailable ? (
              <Badge color={statusInfo.color} variant="light" size="sm">
                {statusInfo.label}
              </Badge>
            ) : (
              <Badge color="gray" variant="outline" size="sm" leftSection={<Lock size={12} />}>
                Sắp ra mắt
              </Badge>
            )}
          </Group>

          <Text size="xs" c="dimmed">
            {isAvailable
              ? `Đã trả lời ${summary?.answered_count ?? 0} câu · ${summary?.file_count ?? 0} tài liệu`
              : "Nội dung đang được hoàn thiện, sẽ mở trong các phiên bản tiếp theo."}
          </Text>

          {isAvailable && (
            <Text size="xs" fw={500} c={creditsRemaining > 0 ? "blue" : "dimmed"}>
              Còn {creditsRemaining} lượt chấm
            </Text>
          )}
        </Stack>

        <Group justify="flex-end">
          {isAvailable ? (
            <Button size="xs" variant="light" rightSection={<ArrowRight size={14} />} onClick={onOpen}>
              Vào giai đoạn
            </Button>
          ) : (
            <Button size="xs" variant="default" disabled>
              Chưa mở
            </Button>
          )}
        </Group>
      </Stack>
    </Paper>
  );
}
