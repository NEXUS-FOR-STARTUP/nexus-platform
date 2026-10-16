"use client";

import { useMemo } from "react";
import { Stack, Paper, Text, Button } from "@mantine/core";
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
  onGoDraft?: () => void;
  onGoFiles?: () => void;
  onAudit?: () => void;
}
export default function StageResultsView({
  caseId,
  summary,
  roundHistory,
  checkpointId,
  projectName,
  onGoDraft,
  onGoFiles,
  onAudit,
}: StageResultsViewProps) {
  const stageRoundHistory = useMemo(() => {
    if (!roundHistory || roundHistory.length === 0) return null;
    // Ownership by checkpoint; never fall back to the full history, or another
    // stage's results leak in while the checkpoint row is missing/loading.
    if (checkpointId) {
      return roundHistory.filter((round) => round.report?.checkpoint_id === checkpointId);
    }
    if (!summary?.checkpoint_code) return null;
    const wantsCp2 = summary.checkpoint_code === "CP2";
    return roundHistory.filter((round) => isCp2ReportType(round.report?.report_type) === wantsCp2);
  }, [roundHistory, checkpointId, summary?.checkpoint_code]);

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
            <Text size="xs" c="dimmed">3 bước để có kết quả:</Text>
          </Stack>
          <Stack gap="xs" align="flex-start">
            <Button variant="subtle" size="xs" onClick={onGoDraft}>1. Trả lời câu hỏi ở tab Soạn thảo</Button>
            <Button variant="subtle" size="xs" onClick={onGoFiles}>2. Tải tài liệu ở tab Tài liệu</Button>
            <Button variant="filled" size="xs" color="blue" onClick={onAudit}>3. Bấm Chấm bài</Button>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <TabReportFindings
      report={report}
      caseId={caseId}
      projectName={projectName}
      roundHistory={stageRoundHistory}
      hideCheckpointFilter
    />
  );
}
