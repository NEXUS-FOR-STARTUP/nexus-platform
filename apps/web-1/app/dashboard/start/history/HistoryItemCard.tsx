"use client";

import Link from "next/link";
import { Button, Group, Stack } from "@mantine/core";
import { StatusChip } from "@/components/ui/StatusChip";
import { isTeamFitFreeReportV2, TEAM_FIT_VERDICT_LABELS } from "@repo/validation";
import type { PreCp1HistoryItem } from "../_hooks/usePreCp1History";
import {
  formatHistoryDate,
  historyItemTitle,
  parseHistoryAiResult,
  parseHistoryInput,
  parseHistoryReport,
} from "./historyUtils";
import s from "./history.module.css";

export function HistoryItemCard({
  item,
  onSelectAction,
}: {
  item: PreCp1HistoryItem;
  onSelectAction: (id: string) => void;
}) {
  const input = parseHistoryInput(item.input_snapshot);
  const report = parseHistoryReport(item.report_snapshot, input);
  const aiResult = parseHistoryAiResult(item.team_fit_snapshot);
  const aiVerdict =
    aiResult && isTeamFitFreeReportV2(aiResult) && aiResult.ai?.verdict
      ? aiResult.ai.verdict
      : null;

  return (
    <div className={s.card}>
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="sm">
        <Stack gap={6} style={{ minWidth: 0, flex: 1 }}>
          <Group gap="xs" wrap="wrap" align="center">
            <h3 className={s.cardTitle}>{historyItemTitle(item, input)}</h3>
            <StatusChip tone={item.case ? "ok" : "neutral"}>
              {item.case
                ? `Dự án: ${item.case.team_name || item.case.case_code}`
                : "Chưa gắn dự án"}
            </StatusChip>
            {aiVerdict && (
              <StatusChip tone={aiVerdict === "san_sang" ? "ok" : "warn"}>
                AI: {TEAM_FIT_VERDICT_LABELS[aiVerdict]}
              </StatusChip>
            )}
          </Group>

          {report?.verdict?.title && <p className={s.note}>{report.verdict.title}</p>}
          <p className={s.note}>{formatHistoryDate(item.created_at)}</p>
        </Stack>

        <Group gap="xs">
          {item.case && (
            <Button
              size="sm"
              variant="default"
              component={Link}
              href={`/dashboard/case/${item.case.id}?tab=overview`}
            >
              Mở dự án
            </Button>
          )}
          <Button size="sm" color="brand" onClick={() => onSelectAction(item.id)}>
            Xem kết quả
          </Button>
        </Group>
      </Group>
    </div>
  );
}
