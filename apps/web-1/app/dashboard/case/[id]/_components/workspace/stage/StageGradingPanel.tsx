"use client";

import { useEffect, useState } from "react";
import { Collapse, Paper } from "@mantine/core";
import { useClipboard } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { useCaseAiStatus } from "../../../hooks/useCaseAiStatus";
import { useTriggerAudit, type SubmissionType } from "../../../hooks/useTriggerAudit";
import GradingPanelHeader from "./GradingPanelHeader";
import { describeGradingState } from "./grading-state";
import GradingSteps from "./GradingSteps";

interface StageGradingPanelProps {
  caseId: string;
  checkpoint: "CP1" | "CP2";
  /** Submission type for "Chạy lại" (retry after a failed run reuses the previous run's type; the API falls back to initial when there is no previous report). The note is carried from the last run's status. */
  submissionType: SubmissionType;
  onViewResults: () => void;
}

/** Short labels mirroring the grading modal's source + scope choice, so the run confirms what it reads. */
const SOURCE_LABEL: Record<string, string> = {
  answers: "câu trả lời",
  files: "tài liệu",
  both: "câu trả lời và tài liệu",
};
/** Legacy jobs carry no input_source: they read the answers plus any attachments that existed. */
const LEGACY_SOURCE_LABEL = "câu trả lời và tài liệu (nếu có)";
const SCOPE_LABEL: Record<string, string> = {
  questionnaire: "soát bảng hỏi",
  full: "đánh giá toàn diện",
};

function formatElapsed(totalSeconds: number): string {
  const mm = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const ss = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Live grading progress for one stage, rendered above the stage tabs so it is visible from every tab.
 * Shown while a job is queued/running, after a failure/cancel, and once right after a run finishes
 * (until dismissed). Collapsible to a single line. Polls one endpoint; no SSE.
 * Students cannot stop a running job; only support/admin can, from the admin job drawer.
 */
export default function StageGradingPanel({ caseId, checkpoint, submissionType, onViewResults }: StageGradingPanelProps) {
  const queryClient = useQueryClient();
  const { data } = useCaseAiStatus(caseId, checkpoint);
  const { triggerAudit, isTriggering } = useTriggerAudit(caseId);
  const clipboard = useClipboard({ timeout: 4000 });
  const [opened, setOpened] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [seenActive, setSeenActive] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const status = data?.status ?? "unknown";
  const isActive = status === "queued" || status === "running";

  // Adjust-state-during-render: remember that this mount watched a run, so "completed" is only shown for a run we saw.
  if (isActive && !seenActive) setSeenActive(true);
  if (isActive && dismissed) setDismissed(false);

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isActive]);

  // Report + case data changed server-side when a run we watched finishes.
  useEffect(() => {
    if (status === "completed" && seenActive) queryClient.invalidateQueries({ queryKey: ["case", caseId] });
  }, [status, seenActive, caseId, queryClient]);

  const state = describeGradingState(status);
  const visible = isActive || status === "failed" || status === "cancelled" || (status === "completed" && seenActive && !dismissed);
  if (!data || !state || !visible) return null;

  const steps = data.steps;
  const doneCount = steps.filter((s) => s.state === "done").length;
  const activeStep = steps.find((s) => s.state === "active");
  const startMs = data.startedAt ? Date.parse(data.startedAt) : NaN;
  const elapsed = isActive && !Number.isNaN(startMs) ? Math.max(0, Math.floor((now - startMs) / 1000)) : null;
  const sourceLabel = data.inputSource !== undefined ? SOURCE_LABEL[data.inputSource] ?? data.inputSource : LEGACY_SOURCE_LABEL;
  const scopeLabel = data.scope !== undefined ? SCOPE_LABEL[data.scope] ?? data.scope : null;
  const readsWhat = checkpoint === "CP2" ? `Đang đọc: ${sourceLabel}${scopeLabel ? ` / ${scopeLabel}` : ""}` : null;

  const headline: Record<string, string> = {
    queued: "Đang xếp hàng, sắp bắt đầu chấm",
    running: activeStep ? `Bước ${doneCount + 1}/${steps.length}: ${activeStep.label}` : "Đang chấm bài",
    completed: "Chấm xong. Báo cáo đã sẵn sàng",
    failed: "Lần chấm bị gián đoạn. Lượt chấm đã được hoàn lại, bạn có thể chạy lại",
    cancelled: "Lần chấm đã dừng. Lượt chấm đã được hoàn lại",
  };

  const retryScope = data.scope === "questionnaire" ? ("questionnaire" as const) : ("full" as const);

  // Zalo group links cannot carry prefilled text, so the report is copied to the clipboard and the user pastes it into the group.
  const copyReport = () => {
    const lines = [
      "Mình gặp lỗi khi chấm bài, nhờ admin hỗ trợ:",
      `- Trang: ${window.location.href}`,
      `- Mã lần chấm: ${data.jobId ?? "không có"}`,
      `- Mã dự án: ${caseId}`,
      `- Thời điểm: ${new Date().toLocaleString("vi-VN")}`,
    ];
    clipboard.copy(lines.join("\n"));
  };
  const handleRetry = () =>
    triggerAudit({
      submission_type: retryScope === "questionnaire" ? "initial" : submissionType,
      ...(checkpoint === "CP2"
        ? {
            checkpoint: "CP2" as const,
            scope: retryScope,
            ...(data.inputSource === "answers" || data.inputSource === "files" || data.inputSource === "both"
              ? { input_source: data.inputSource }
              : {}),
            ...(typeof data.userNote === "string" && data.userNote.trim() ? { user_note: data.userNote } : {}),
            ...(typeof data.changeSummary === "string" && data.changeSummary.trim() ? { change_summary: data.changeSummary } : {}),
          }
        : {}),
    });

  const handleViewResults = () => {
    setDismissed(true);
    onViewResults();
  };

  return (
    <Paper withBorder radius="md" p="md">
      <GradingPanelHeader
        state={state}
        headline={headline[status]}
        elapsed={elapsed !== null ? formatElapsed(elapsed) : null}
        jobId={data.jobId}
        opened={opened}
        isRetrying={isTriggering}
        zaloCopied={clipboard.copied}
        onRetry={handleRetry}
        onZaloClick={copyReport}
        onViewResults={handleViewResults}
        onClose={() => setDismissed(true)}
        onToggle={() => setOpened((o) => !o)}
      />
      <Collapse expanded={opened && status !== "completed"}>
        <GradingSteps data={data} doneCount={doneCount} readsWhat={readsWhat} />
      </Collapse>
    </Paper>
  );
}
