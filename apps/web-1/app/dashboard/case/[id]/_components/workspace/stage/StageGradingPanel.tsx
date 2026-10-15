"use client";

import { useEffect, useState } from "react";
import { ActionIcon, Badge, Button, Collapse, CopyButton, Group, Paper, Progress, Stack, Stepper, Text, Tooltip } from "@mantine/core";
import { useClipboard, useMediaQuery } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, ChevronUp, Copy, MessageCircle, X } from "lucide-react";
import { useCaseAiStatus, type CaseAiStatusResponse } from "../../../hooks/useCaseAiStatus";
import { useTriggerAudit, type SubmissionType } from "../../../hooks/useTriggerAudit";
import RadarLogsViewer from "../../RadarLogsViewer";
import { filterCleanLogs } from "../../radar.utils";
import { ZALO_GROUP_URL } from "@/lib/zalo";

interface StageGradingPanelProps {
  caseId: string;
  checkpoint: "CP1" | "CP2";
  /** Submission type for "Chạy lại" (retry after a failed run reuses the previous run's type; the API falls back to initial when there is no previous report). The note is carried from the last run's status. */
  submissionType: SubmissionType;
  onViewResults: () => void;
}

type Status = CaseAiStatusResponse["status"];

const BADGE: Partial<Record<Status, { label: string; color: string }>> = {
  queued: { label: "Hàng đợi", color: "yellow" },
  running: { label: "Đang chấm", color: "blue" },
  completed: { label: "Hoàn tất", color: "green" },
  failed: { label: "Gián đoạn", color: "red" },
  cancelled: { label: "Đã dừng", color: "gray" },
};

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

/** Cap on the raw error shown in the support tooltip. */
const RAW_ERROR_MAX_CHARS = 300;

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
  const isNarrow = useMediaQuery("(max-width: 48em)");
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

  const visible = isActive || status === "failed" || status === "cancelled" || (status === "completed" && seenActive && !dismissed);
  if (!data || !visible) return null;

  const steps = data.steps;
  const doneCount = steps.filter((s) => s.state === "done").length;
  const activeStep = steps.find((s) => s.state === "active");
  const badge = BADGE[status];
  const startMs = data.startedAt ? Date.parse(data.startedAt) : NaN;
  const elapsed = isActive && !Number.isNaN(startMs) ? Math.max(0, Math.floor((now - startMs) / 1000)) : null;
  const shortJobId = data.jobId ? data.jobId.slice(0, 8) : null;
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
      `- Mã hồ sơ: ${caseId}`,
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
      <Group justify="space-between" wrap="wrap" gap="sm">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          {badge && <Badge color={badge.color} variant={isActive ? "filled" : "light"}>{badge.label}</Badge>}
          <Text fw={600} size="sm" truncate>{headline[status]}</Text>
          {elapsed !== null && <Text size="xs" c="dimmed" ff="monospace">{formatElapsed(elapsed)}</Text>}
          {shortJobId && data.jobId && (
            <CopyButton value={data.jobId}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? "Đã sao chép" : `Mã lần chấm: ${data.jobId}`} withArrow>
                  <ActionIcon variant="subtle" color="gray" size="sm" onClick={copy} aria-label="Sao chép mã lần chấm">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          )}
          {shortJobId && <Text size="xs" c="dimmed" ff="monospace">#{shortJobId}</Text>}
        </Group>
        <Group gap="xs" wrap="wrap">
          {(status === "failed" || status === "cancelled") && (
            <Button size="sm" loading={isTriggering} onClick={handleRetry}>
              Chạy lại
            </Button>
          )}
          {status === "failed" && (
            <Tooltip label="Sao chép nội dung báo lỗi và mở nhóm Zalo hỗ trợ. Dán vào nhóm để gửi admin." multiline maw={280} withArrow>
              <Button
                size="sm"
                variant="light"
                color={clipboard.copied ? "green" : "red"}
                component="a"
                href={ZALO_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                leftSection={clipboard.copied ? <Check size={14} /> : <MessageCircle size={14} />}
                onClick={copyReport}
              >
                {clipboard.copied ? "Đã sao chép, hãy dán vào Zalo" : "Báo lỗi qua Zalo"}
              </Button>
            </Tooltip>
          )}
          {status === "completed" && (
            <Button size="sm" color="green" onClick={handleViewResults}>
              Xem kết quả
            </Button>
          )}
          {status === "completed" ? (
            <ActionIcon variant="subtle" color="gray" aria-label="Đóng" onClick={() => setDismissed(true)}>
              <X size={16} />
            </ActionIcon>
          ) : (
            <ActionIcon variant="subtle" color="gray" aria-label={opened ? "Thu gọn" : "Mở rộng"} onClick={() => setOpened((o) => !o)}>
              {opened ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </ActionIcon>
          )}
        </Group>
      </Group>

      <Collapse expanded={opened && status !== "completed"}>
        <Stack gap="md" mt="md">
          {readsWhat && <Text size="xs" c="dimmed">{readsWhat}</Text>}
          {status === "failed" && data.error && (
            // Raw worker/queue text is English and internal: keep it in a tooltip for support, never in the layout.
            <Tooltip label={data.error.slice(0, RAW_ERROR_MAX_CHARS)} multiline maw={360} withArrow>
              <Text size="xs" c="red" w="fit-content">Hệ thống chưa tạo được báo cáo hoàn chỉnh. Di chuột để xem chi tiết kỹ thuật cho hỗ trợ.</Text>
            </Tooltip>
          )}
          <Progress value={(doneCount / Math.max(steps.length, 1)) * 100} animated={status === "running"} color={status === "failed" ? "red" : "blue"} size="sm" radius="xl" />
          <Stepper
            active={doneCount}
            size="xs"
            orientation={isNarrow ? "vertical" : "horizontal"}
            color={status === "failed" ? "red" : "blue"}
            allowNextStepsSelect={false}
          >
            {steps.map((step) => (
              <Stepper.Step key={step.id} label={step.label} loading={step.state === "active"} />
            ))}
          </Stepper>
          <RadarLogsViewer logs={filterCleanLogs(data.logs ?? [])} />
        </Stack>
      </Collapse>
    </Paper>
  );
}
