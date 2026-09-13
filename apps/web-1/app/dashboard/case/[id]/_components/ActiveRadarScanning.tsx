"use client";

import { useState, useEffect } from "react";
import { Paper, Text, Group, Badge, Button, ActionIcon, Tooltip } from "@mantine/core";
import { Clock, RotateCcw, Square, Copy, Check, Sparkles, AlertTriangle } from "lucide-react";
import { useCaseAiStatus, type LogEntry } from "../hooks/useCaseAiStatus";
import TerminalConsole from "./TerminalConsole";

interface ActiveRadarScanningProps {
  caseId: string;
  caseCode?: string;
  projectName?: string;
  onAuditCompleted?: () => void;
}

export default function ActiveRadarScanning({
  caseId,
  caseCode,
  projectName,
  onAuditCompleted,
}: ActiveRadarScanningProps) {
  const { aiStatusData, cancel, isCancelling, retry, isRetrying } = useCaseAiStatus(caseId);
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const status = aiStatusData?.status || "running";
  const isTerminal = status === "completed" || status === "failed" || status === "cancelled";
  const jobId = aiStatusData?.jobId || caseId;
  const startedAt = aiStatusData?.startedAt;

  useEffect(() => {
    if (aiStatusData?.logs && aiStatusData.logs.length > logs.length) {
      setLogs(aiStatusData.logs);
    }
  }, [aiStatusData?.logs]);

  useEffect(() => {
    if (!startedAt || isTerminal) return;
    const startMs = new Date(startedAt).getTime();
    const tick = () => setElapsedSecs(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt, isTerminal]);
  useEffect(() => {
    if (status === "completed" || status === "failed" || status === "cancelled") {
      setIsStreaming(false);
      return;
    }
    const apiBase = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "http://localhost:8000/api";
    const eventSource = new EventSource(`${apiBase}/cases/${caseId}/ai-events`, { withCredentials: true });
    setIsStreaming(true);

    eventSource.addEventListener("log", (e) => {
      try {
        const entry = JSON.parse(e.data) as LogEntry;
        setLogs((prev) => prev.some((p) => p.timestamp === entry.timestamp && p.message === entry.message) ? prev : [...prev, entry]);
      } catch {}
    });
    eventSource.addEventListener("job_state", (e) => {
      try {
        if (JSON.parse(e.data).status === "completed") onAuditCompleted?.();
      } catch {}
    });
    eventSource.onerror = () => setIsStreaming(false);
    return () => { eventSource.close(); setIsStreaming(false); };
  }, [caseId, status, onAuditCompleted]);

  useEffect(() => {
    if (status === "completed") onAuditCompleted?.();
  }, [status, onAuditCompleted]);

  if (aiStatusData && !aiStatusData.isAiPackage) return null;

  const handleCopyJobId = () => {
    navigator.clipboard.writeText(jobId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCancel = () => {
    if (window.confirm(`Bạn có chắc chắn muốn ngắt ngang và hủy tiến trình thẩm định của job ${jobId}?`)) {
      cancel();
    }
  };

  const isRunningOrQueued = status === "running" || status === "queued";
  const badgeColor = status === "failed" ? "red" : status === "cancelled" ? "orange" : status === "queued" ? "yellow" : "blue";
  const badgeLabel = status === "queued" ? "Trong hàng đợi OMP" : status === "cancelled" ? "Tiến trình đã hủy" : status === "failed" ? "Thẩm định gián đoạn" : "OMP Worker Đang Thẩm Định";

  return (
    <Paper withBorder radius="lg" p="md" className="bg-surface-app/70 border-border-app space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-surface-card border border-border-app">
        <div className="space-y-1">
          <Group gap="xs" wrap="wrap">
            <Badge
              variant="light"
              color={badgeColor}
              size="md"
              leftSection={status === "failed" ? <AlertTriangle size={12} /> : <Sparkles size={12} className={isRunningOrQueued ? "animate-spin" : ""} />}
            >
              {badgeLabel}
            </Badge>

            <Tooltip label={isCopied ? "Đã sao chép!" : "Sao chép Job ID"} withArrow>
              <Badge
                variant="outline"
                color="gray"
                size="md"
                className="font-mono cursor-pointer hover:border-brand transition-colors"
                onClick={handleCopyJobId}
                rightSection={
                  <ActionIcon size="xs" variant="transparent" color="gray">
                    {isCopied ? <Check size={11} className="text-teal-500" /> : <Copy size={11} />}
                  </ActionIcon>
                }
              >
                Job: {jobId.slice(0, 8)}...
              </Badge>
            </Tooltip>

            <Badge variant="outline" color="gray" size="md" leftSection={<Clock size={12} />}>
              {elapsedSecs}s
            </Badge>
          </Group>

          <Text fw={700} size="sm" className="text-text-app">
            {projectName || caseCode || "Dự án thẩm định"} {caseCode && <span className="text-xs text-dimmed font-normal">({caseCode})</span>}
          </Text>
        </div>

        <Group gap="xs">
          {isRunningOrQueued && (
            <Button size="xs" color="red" variant="light" leftSection={<Square size={13} className="fill-current" />} loading={isCancelling} onClick={handleCancel}>
              Hủy Job
            </Button>
          )}
          {(status === "failed" || status === "cancelled") && (
            <Button size="xs" color="brand" variant="filled" leftSection={<RotateCcw size={13} />} loading={isRetrying} onClick={() => retry()}>
              Chạy lại Thẩm định AI
            </Button>
          )}
        </Group>
      </div>

      <TerminalConsole logs={logs} isStreaming={isStreaming} />
    </Paper>
  );
}
