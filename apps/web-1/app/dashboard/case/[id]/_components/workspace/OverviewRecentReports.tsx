 "use client";

import { Button, Group, Paper, Stack, Text } from "@mantine/core";
import { findStageByCode } from "@app/shared/stages";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import type { DocumentWorkspace, RoundHistoryEntry } from "@/types";
import { CP2_REPORT_TYPE_LABELS, SUBMISSION_TYPE_LABELS, formatDateShort } from "../report.utils";

interface OverviewRecentReportsProps {
  roundHistory?: RoundHistoryEntry[] | null;
  documentWorkspace?: DocumentWorkspace | null;
  onOpenStage: (slug: string, view: "draft" | "files" | "results") => void;
}

const RECENT_REPORTS_LIMIT = 3;

function reportLabel(entry: RoundHistoryEntry): string {
  return (
    CP2_REPORT_TYPE_LABELS[entry.report?.report_type ?? ""] ??
    SUBMISSION_TYPE_LABELS[entry.submission_type ?? ""] ??
    "Báo cáo"
  );
}

export default function OverviewRecentReports({
  roundHistory,
  documentWorkspace,
  onOpenStage,
}: OverviewRecentReportsProps) {
  const checkpointCodeById = new Map(
    documentWorkspace?.checkpoints?.map((c) => [c.checkpoint_id, c.checkpoint_code]) ?? [],
  );
  const slugForReport = (entry: RoundHistoryEntry): string | null => {
    const code = entry.report?.checkpoint_id
      ? checkpointCodeById.get(entry.report.checkpoint_id)
      : undefined;
    const stage = code ? findStageByCode(code) : undefined;
    return stage ? stage.slug : null;
  };
  const recentReports = [...(roundHistory ?? [])]
    .sort((a, b) => +new Date(b.submitted_at) - +new Date(a.submitted_at))
    .slice(0, RECENT_REPORTS_LIMIT);

  return (
    <Paper p="md" withBorder radius="md">
      <Group gap="xs" mb="sm">
        <Text fw={600} size="sm">Báo cáo gần đây</Text>
      </Group>
      {recentReports.length === 0 ? (
        <Text size="sm" c="dimmed">
          Chưa có báo cáo nào. Hoàn thiện câu trả lời và bấm chấm để nhận đánh giá đầu tiên.
        </Text>
      ) : (
        <Stack gap="xs">
          {recentReports.map((entry) => {
            const slug = slugForReport(entry);
            return (
              <Group key={entry.report_id} justify="space-between" wrap="nowrap" gap="sm">
                <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                  <FileTypeIcon extension="pdf" size={28} />
                  <Stack gap={0} style={{ minWidth: 0 }}>
                    <Text fw={600} size="sm" truncate>
                      {reportLabel(entry)}
                      {typeof entry.version_no === "number" ? ` (bản ${String(entry.version_no + 1).padStart(2, "0")})` : ""}
                    </Text>
                    <Text size="xs" c="dimmed">{formatDateShort(entry.submitted_at)}</Text>
                  </Stack>
                </Group>
                {slug && (
                  <Button
                    size="sm"
                    variant="light"
                    onClick={() => onOpenStage(slug, "results")}
                  >
                    Xem
                  </Button>
                )}
              </Group>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}
