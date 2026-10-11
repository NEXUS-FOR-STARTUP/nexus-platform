"use client";

import { useMemo } from "react";
import { Stack, Paper, Text } from "@mantine/core";
import { FileCheck } from "lucide-react";
import { isCp2ReportType } from "@repo/validation";
import type { StageSummary } from "../../../hooks/useStageSummaries";
import type { RoundHistoryEntry, Report } from "@/types";
import TabReportFindings from "../../TabReportFindings";

interface StageResultsViewProps {
  caseId: string;
  summary?: StageSummary;
  roundHistory?: RoundHistoryEntry[] | null;
  checkpointId?: string;
  projectName?: string;
  caseCode?: string;
}

export default function StageResultsView({
  caseId,
  summary,
  roundHistory,
  checkpointId,
}: StageResultsViewProps) {
  const stageRoundHistory = useMemo(() => {
    if (!roundHistory || roundHistory.length === 0) return null;
    if (checkpointId) {
      return roundHistory.filter((round) => round.report?.checkpoint_id === checkpointId);
    }
    // Fallback for rare cases where the workspace hasn't loaded yet:
    // if the latest report for this stage exists, keep rounds whose report type
    // matches that report. This keeps the view stable while data is fetching.
    if (summary?.latest_report?.report_type) {
      const isCp2 = isCp2ReportType(summary.latest_report.report_type);
      return roundHistory.filter((round) =>
        isCp2 ? isCp2ReportType(round.report?.report_type) : !isCp2ReportType(round.report?.report_type),
      );
    }
    return roundHistory;
  }, [roundHistory, checkpointId, summary?.latest_report?.report_type]);

  // Prefer the full Report object carried by round history so the PDF viewer
  // and parsed metadata work exactly like the legacy report tab.
  const report: Report | null = useMemo(() => {
    if (stageRoundHistory && stageRoundHistory.length > 0) {
      return stageRoundHistory[0].report;
    }
    return null;
  }, [stageRoundHistory]);

  if (!report && (!stageRoundHistory || stageRoundHistory.length === 0)) {
    return (
      <Paper p="xl" withBorder radius="md" style={{ textAlign: "center" }}>
        <Stack align="center" gap="md">
          <FileCheck size={40} className="text-gray-400" />
          <Stack gap={2}>
            <Text fw={600} size="md">Chưa có kết quả chấm bài</Text>
            <Text size="xs" c="dimmed">
              Sau khi bạn hoàn thành việc soạn thảo hoặc tải tài liệu lên, hãy bấm Chấm bài ở góc trên bên phải để nhận đánh giá từ AI.
            </Text>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <TabReportFindings
      report={report}
      caseId={caseId}
      roundHistory={stageRoundHistory}
      hideCheckpointFilter
    />
  );
}
