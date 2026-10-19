"use client";

import { Group, Paper, Stack, Text } from "@mantine/core";
import { Button } from "../ui/Button";
import { findStageByCode } from "@app/shared/stages";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import s from "./overview.module.css";
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
    <section className={s.section}>
      <h2 className={s.sectionTitle}>Báo cáo gần đây</h2>
      {recentReports.length === 0 ? (
        <Text className={s.note}>
          Chưa có báo cáo nào. Hoàn thiện câu trả lời và bấm chấm để nhận đánh giá đầu tiên.
        </Text>
      ) : (
        <Stack gap="sm">
          {recentReports.map((entry) => {
            const slug = slugForReport(entry);
            return (
              <Paper key={entry.report_id} p="md" withBorder radius="md">
                <Group justify="space-between" wrap="nowrap" gap="sm">
                  <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                    <FileTypeIcon extension="pdf" size={28} />
                    <Stack gap={0} style={{ minWidth: 0 }}>
                      <Text className={s.name} truncate>
                        {reportLabel(entry)}
                        {typeof entry.version_no === "number" ? ` (bản ${String(entry.version_no + 1).padStart(2, "0")})` : ""}
                      </Text>
                      <Text className={s.note}>{formatDateShort(entry.submitted_at)}</Text>
                    </Stack>
                  </Group>
                  {slug && (
                    <Button size="sm" variant="quiet" onClick={() => onOpenStage(slug, "results")}>
                      Xem
                    </Button>
                  )}
                </Group>
              </Paper>
            );
          })}
        </Stack>
      )}
    </section>
  );
}
