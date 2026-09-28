"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Progress } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useCaseAiStatus, type LogEntry, type CaseAiStatusResponse } from "../hooks/useCaseAiStatus";
import RadarHeader from "./RadarHeader";
import RadarStagePipeline from "./RadarStagePipeline";
import RadarLogsViewer from "./RadarLogsViewer";
import {
  DEFAULT_STAGES,
  filterCleanLogs,
  calculateRadarProgress,
} from "./radar.utils";

interface ActiveRadarScanningProps {
  caseId: string;
  projectName?: string;
}

export default function ActiveRadarScanning({
  caseId,
  projectName,
}: ActiveRadarScanningProps) {
  const queryClient = useQueryClient();
  const { aiStatusData, cancel, isCancelling, retry, isRetrying } =
    useCaseAiStatus(caseId);
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const status = aiStatusData?.status || "running";
  const isTerminal =
    status === "completed" || status === "failed" || status === "cancelled";
  const jobId = aiStatusData?.jobId || caseId;
  const startedAt = aiStatusData?.startedAt;

  // Reset live logs and elapsed time when a new job starts (new jobId or startedAt)
  useEffect(() => {
    setLiveLogs([]);
    setElapsedSecs(0);
  }, [jobId, startedAt]);

  // Accurately count elapsed time while active, freeze at true duration when completed
  useEffect(() => {
    if (!startedAt) {
      setElapsedSecs(aiStatusData?.elapsedSeconds || 0);
      return;
    }
    const startMs = new Date(startedAt).getTime();
    if (isNaN(startMs)) {
      setElapsedSecs(aiStatusData?.elapsedSeconds || 0);
      return;
    }

    const calcElapsed = () =>
      Math.max(0, Math.floor((Date.now() - startMs) / 1000));

    if (isTerminal) {
      if (typeof aiStatusData?.elapsedSeconds === "number" && aiStatusData.elapsedSeconds > 0) {
        setElapsedSecs(aiStatusData.elapsedSeconds);
      } else {
        setElapsedSecs(calcElapsed());
      }
      return;
    }

    const tick = () => setElapsedSecs(calcElapsed());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt, isTerminal, aiStatusData?.elapsedSeconds, jobId]);

  // Connect SSE for live logs and real-time state events
  useEffect(() => {
    if (isTerminal) return;
    const apiBase = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}/api`
      : "http://localhost:8000/api";
    const es = new EventSource(`${apiBase}/cases/${caseId}/ai-events`, {
      withCredentials: true,
    });
    es.addEventListener("log", (e) => {
      try {
        const item = JSON.parse(e.data) as LogEntry;
        setLiveLogs((prev) =>
          prev.some((p) => p.message === item.message) ? prev : [...prev, item],
        );
      } catch {}
    });
    es.addEventListener("job_state", (e) => {
      try {
        const item = JSON.parse(e.data) as Partial<CaseAiStatusResponse>;
        if (item) {
          queryClient.setQueryData(["case-ai-status", caseId], (prev: any) => ({
            ...prev,
            ...item,
          }));
        }
      } catch {}
    });
    return () => es.close();
  }, [caseId, isTerminal, jobId, queryClient]);

  const handleRetry = useCallback(() => {
    setLiveLogs([]);
    setElapsedSecs(0);
    retry();
  }, [retry]);
  const logs = useMemo(() => {
    const base = aiStatusData?.logs || [];
    if (!liveLogs.length) return base;
    const merged = [...base];
    for (const item of liveLogs) {
      if (
        !merged.some(
          (p) =>
            p.message === item.message &&
            (p.timestamp === item.timestamp ||
              Math.abs(
                new Date(p.timestamp).getTime() -
                  new Date(item.timestamp).getTime(),
              ) < 1500),
        )
      ) {
        merged.push(item);
      }
    }
    return merged;
  }, [aiStatusData?.logs, liveLogs]);

  const cleanLogs = useMemo(() => filterCleanLogs(logs), [logs]);
  const { currentStep, progressPercent, statusText } = useMemo(
    () => calculateRadarProgress(status, logs),
    [status, logs],
  );

  if (aiStatusData && !aiStatusData.isAiPackage) return null;

  return (
    <div className="p-5 sm:p-6 rounded-xl border border-border-app bg-surface-app space-y-4 shadow-none">
      <RadarHeader
        status={status}
        projectName={projectName}
        elapsedSecs={elapsedSecs}
        jobId={jobId}
        isCancelling={isCancelling}
        isRetrying={isRetrying}
        onCancel={cancel}
        onRetry={handleRetry}
      />

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
          <p className="font-semibold text-text-app sm:truncate text-xs sm:text-sm">
            {statusText}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-text-subtle">
              Giai đoạn {currentStep}/{DEFAULT_STAGES.length}
            </span>
            <span className="font-mono font-bold text-brand text-sm">
              {progressPercent}%
            </span>
          </div>
        </div>
        <Progress
          value={progressPercent}
          color="blue"
          size="sm"
          radius="xl"
          animated={status === "running"}
        />
      </div>

      <RadarStagePipeline
        stages={DEFAULT_STAGES}
        currentStep={currentStep}
        status={status}
      />

      <RadarLogsViewer
        logs={cleanLogs}
        showLogs={showLogs}
        onToggle={() => setShowLogs((prev) => !prev)}
      />
    </div>
  );
}
