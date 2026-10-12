"use client";

import { useEffect, useState } from "react";
import { ActionIcon, Badge, Button, Collapse, Group, Modal, Paper, Progress, Stack, Stepper, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { useCaseAiStatus, type CaseAiStatusResponse } from "../../../hooks/useCaseAiStatus";
import { useTriggerAudit, type SubmissionType } from "../../../hooks/useTriggerAudit";
import RadarLogsViewer from "../../RadarLogsViewer";
import { filterCleanLogs } from "../../radar.utils";

interface StageGradingPanelProps {
  caseId: string;
  checkpoint: "CP1" | "CP2";
  /** Submission type for "Chạy lại"; same rule the grading modal uses. */
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

function formatElapsed(totalSeconds: number): string {
  const mm = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const ss = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * Live grading progress for one stage, rendered above the stage tabs so it is visible from every tab.
 * Shown while a job is queued/running, after a failure/cancel, and once right after a run finishes
 * (until dismissed). Collapsible to a single line. Polls one endpoint; no SSE.
 */
export default function StageGradingPanel({ caseId, checkpoint, submissionType, onViewResults }: StageGradingPanelProps) {
  const queryClient = useQueryClient();
  const { data, cancel, isCancelling } = useCaseAiStatus(caseId, checkpoint);
  const { triggerAudit, isTriggering } = useTriggerAudit(caseId);
  const isNarrow = useMediaQuery("(max-width: 48em)");
  const [opened, setOpened] = useState(true);
  const [cancelOpen, setCancelOpen] = useState(false);
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

  const headline: Record<string, string> = {
    queued: "Đang xếp hàng, sắp bắt đầu chấm",
    running: activeStep ? `Bước ${doneCount + 1}/${steps.length}: ${activeStep.label}` : "Đang chấm bài",
    completed: "Chấm xong. Báo cáo đã sẵn sàng",
    failed: "Lần chấm bị gián đoạn. Lượt chấm đã được hoàn lại, bạn có thể chạy lại",
    cancelled: "Đã dừng theo yêu cầu. Lượt chấm đã được hoàn lại",
  };

  const handleRetry = () =>
    triggerAudit({
      submission_type: submissionType,
      ...(checkpoint === "CP2"
        ? {
            checkpoint: "CP2" as const,
            scope: data.scope === "questionnaire" ? ("questionnaire" as const) : ("full" as const),
            ...(data.inputSource === "answers" || data.inputSource === "files" || data.inputSource === "both"
              ? { input_source: data.inputSource }
              : {}),
          }
        : {}),
    });

  const handleViewResults = () => {
    setDismissed(true);
    onViewResults();
  };

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          {badge && <Badge color={badge.color} variant={isActive ? "filled" : "light"}>{badge.label}</Badge>}
          <Text fw={600} size="sm" truncate>{headline[status]}</Text>
          {elapsed !== null && <Text size="xs" c="dimmed" ff="monospace">{formatElapsed(elapsed)}</Text>}
        </Group>
        <Group gap="xs" wrap="nowrap">
          {isActive && (
            <Button size="xs" variant="light" color="red" onClick={() => setCancelOpen(true)}>
              Dừng
            </Button>
          )}
          {(status === "failed" || status === "cancelled") && (
            <Button size="xs" loading={isTriggering} onClick={handleRetry}>
              Chạy lại
            </Button>
          )}
          {status === "completed" && (
            <Button size="xs" color="green" onClick={handleViewResults}>
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

      <Modal opened={cancelOpen} onClose={() => setCancelOpen(false)} title="Dừng chấm bài" centered size="sm">
        <Stack gap="md">
          <Text size="sm">Dừng lần chấm đang chạy? Lượt chấm sẽ được hoàn lại và bạn có thể chấm lại bất cứ lúc nào.</Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setCancelOpen(false)} disabled={isCancelling}>
              Tiếp tục chạy
            </Button>
            <Button
              color="red"
              loading={isCancelling}
              onClick={() => {
                cancel();
                setCancelOpen(false);
              }}
            >
              Dừng
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  );
}
