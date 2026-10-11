"use client";

import { Stack, Paper, Text, Button, Group } from "@mantine/core";
import { FileCheck, Sparkles, Download } from "lucide-react";
import type { StageSummary } from "../../../hooks/useStageSummaries";

interface StageResultsViewProps {
  caseId: string;
  summary?: StageSummary;
  onAudit: () => void;
  canAudit: boolean;
}

export default function StageResultsView({
  caseId,
  summary,
  onAudit,
  canAudit,
}: StageResultsViewProps) {
  const report = summary?.latest_report;

  if (!report) {
    return (
      <Paper p="xl" withBorder radius="md" style={{ textAlign: "center" }}>
        <Stack align="center" gap="md">
          <FileCheck size={40} className="text-gray-400" />
          <Stack gap={2}>
            <Text fw={600} size="md">Chưa có kết quả chấm bài</Text>
            <Text size="xs" c="dimmed">
              Sau khi bạn hoàn thành việc soạn thảo hoặc tải tài liệu lên, hãy bấm Chấm bài để nhận đánh giá từ AI.
            </Text>
          </Stack>
          {canAudit && (
            <Button size="xs" color="blue" leftSection={<Sparkles size={16} />} onClick={onAudit}>
              Chấm bài ngay
            </Button>
          )}
        </Stack>
      </Paper>
    );
  }

  const createdDate = new Date(report.created_at).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Stack gap="md">
      <Paper p="md" withBorder radius="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Stack gap={2}>
            <Group gap="xs">
              <FileCheck size={18} className="text-green-600" />
              <Text fw={600} size="sm">Báo cáo đánh giá mới nhất</Text>
            </Group>
            <Text size="xs" c="dimmed">Hoàn thành lúc {createdDate} · Loại: {report.report_type}</Text>
          </Stack>

          <Group gap="xs">
            <Button
              component="a"
              href={`/api/cases/${caseId}/report/pdf`}
              target="_blank"
              size="xs"
              variant="default"
              leftSection={<Download size={14} />}
            >
              Tải PDF
            </Button>
            {canAudit && (
              <Button size="xs" color="blue" leftSection={<Sparkles size={14} />} onClick={onAudit}>
                Chấm lại bản đã sửa
              </Button>
            )}
          </Group>
        </Group>
      </Paper>
    </Stack>
  );
}
