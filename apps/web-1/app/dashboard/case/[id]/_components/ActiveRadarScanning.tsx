"use client";

import { useState, useEffect, useMemo } from "react";
import { Button, Progress } from "@mantine/core";
import { useCaseAiStatus, type LogEntry } from "../hooks/useCaseAiStatus";

interface ActiveRadarScanningProps {
  caseId: string;
  caseCode?: string;
  projectName?: string;
  onAuditCompleted?: () => void;
}

const STAGES = [
  { id: 1, num: "01", name: "Tiếp nhận đề án" },
  { id: 2, num: "02", name: "Mô hình Triad" },
  { id: 3, num: "03", name: "Phản biện sâu" },
  { id: 4, num: "04", name: "Báo cáo phản biện" },
];

const DIRTY = [
  "[gọi tool]",
  "🔧",
  "[xong tool]",
  "✅",
  "[vòng lặp]",
  "🔄",
  "[lượt hoàn thành]",
  "⏱️",
  "tokens",
  "system_prompt",
  "read path:",
  "glob path:",
  "[model]",
  "sandbox runner",
  "todo",
  "omp-session",
];

const BADGE_MAP: Record<string, { cls: string; label: string }> = {
  failed: {
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900/60",
    label: "Gián đoạn",
  },
  cancelled: {
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
    label: "Đã dừng",
  },
  queued: {
    cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/60",
    label: "Hàng đợi",
  },
  running: {
    cls: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border-teal-200 dark:border-teal-900/60",
    label: "Đang thẩm định",
  },
};

export default function ActiveRadarScanning({
  caseId,
  caseCode,
  projectName,
  onAuditCompleted,
}: ActiveRadarScanningProps) {
  const { aiStatusData, cancel, isCancelling, retry, isRetrying } =
    useCaseAiStatus(caseId);
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const status = aiStatusData?.status || "running";
  const isTerminal =
    status === "completed" || status === "failed" || status === "cancelled";
  const jobId = aiStatusData?.jobId || caseId;
  const startedAt = aiStatusData?.startedAt;

  useEffect(() => {
    setLogs(aiStatusData?.logs || []);
  }, [startedAt]);
  useEffect(() => {
    const fetched = aiStatusData?.logs;
    if (fetched?.length) {
      setLogs((prev) => {
        if (fetched.length < prev.length) return fetched;
        const merged = [...prev];
        for (const item of fetched) {
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
          )
            merged.push(item);
        }
        return merged;
      });
    }
  }, [aiStatusData?.logs]);

  useEffect(() => {
    if (!startedAt || isTerminal) return;
    const startMs = new Date(startedAt).getTime();
    const tick = () =>
      setElapsedSecs(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [startedAt, isTerminal]);

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
        setLogs((prev) =>
          prev.some((p) => p.message === item.message) ? prev : [...prev, item],
        );
      } catch {}
    });
    es.addEventListener("job_state", (e) => {
      try {
        if (JSON.parse(e.data).status === "completed") onAuditCompleted?.();
      } catch {}
    });
    return () => es.close();
  }, [caseId, isTerminal, onAuditCompleted]);

  useEffect(() => {
    if (status === "completed") onAuditCompleted?.();
  }, [status, onAuditCompleted]);
  if (aiStatusData && !aiStatusData.isAiPackage) return null;

  const handleCopyJobId = () => {
    navigator.clipboard.writeText(jobId);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const cleanLogs = useMemo(() => {
    return logs
      .filter(
        (l) =>
          l.message &&
          !DIRTY.some((kw) => l.message.toLowerCase().includes(kw)),
      )
      .map((l) => ({
        ...l,
        message: l.message
          .replace(/[()[\]·]/g, "-")
          .replace(/\s+-\s+/g, " - ")
          .trim(),
      }));
  }, [logs]);

  const { currentStep, progressPercent, statusText } = useMemo(() => {
    if (status === "completed")
      return {
        currentStep: 4,
        progressPercent: 100,
        statusText: "Đã hoàn tất báo cáo thẩm định đề án",
      };
    if (status === "failed")
      return {
        currentStep: 1,
        progressPercent: 20,
        statusText: "Tiến trình gặp gián đoạn, bạn có thể bấm Chạy lại",
      };
    if (status === "cancelled")
      return {
        currentStep: 1,
        progressPercent: 15,
        statusText: "Tiến trình thẩm định đã dừng theo yêu cầu",
      };
    if (status === "queued")
      return {
        currentStep: 1,
        progressPercent: 10,
        statusText: "Đang chuẩn bị môi trường thẩm định AI",
      };
    if (
      logs.some(
        (l) =>
          l.message.includes("Cột mốc 3") ||
          l.message.includes("hoàn tất báo cáo"),
      )
    )
      return {
        currentStep: 4,
        progressPercent: 95,
        statusText: "Đang tổng hợp điểm số và xuất báo cáo phản biện",
      };
    if (
      logs.some(
        (l) =>
          l.message.includes("Cột mốc 2") ||
          l.message.includes("phản biện chuyên sâu"),
      )
    )
      return {
        currentStep: 3,
        progressPercent: 70,
        statusText: "Đang phản biện chuyên sâu các giả định và rủi ro",
      };
    if (
      logs.some(
        (l) =>
          l.message.includes("Cột mốc 1") ||
          l.message.includes("ma trận Vấn đề"),
      )
    )
      return {
        currentStep: 2,
        progressPercent: 45,
        statusText:
          "Đang phân tích khung ma trận Vấn đề, Giải pháp và Khách hàng",
      };
    return {
      currentStep: 1,
      progressPercent: 25,
      statusText: "Đang tiếp nhận và bóc tách dữ liệu đề án",
    };
  }, [status, logs]);

  const badge = BADGE_MAP[status] || BADGE_MAP.running;

  return (
    <div
      className="p-5 sm:p-6 rounded-xl border border-border-app space-y-4 shadow-none"
      style={{
        backgroundColor: "var(--color-surface)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-app">
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}
          >
            {badge.label}
          </span>
          <h3
            className="text-base font-bold"
            style={{ color: "var(--color-text)" }}
          >
            {projectName || "Đề án thẩm định"}
          </h3>
          {caseCode && (
            <span
              className="text-xs font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              - Mã case {caseCode}
            </span>
          )}
          <span
            className="text-xs font-mono"
            style={{ color: "var(--color-text-subtle)" }}
          >
            {elapsedSecs}s
          </span>
        </div>
        <div>
          {(status === "running" || status === "queued") && (
            <Button
              size="xs"
              color="red"
              variant="subtle"
              loading={isCancelling}
              onClick={() => {
                if (
                  window.confirm("Bạn có chắc muốn dừng tiến trình thẩm định?")
                )
                  cancel();
              }}
            >
              Dừng thẩm định
            </Button>
          )}
          {(status === "failed" || status === "cancelled") && (
            <Button
              size="xs"
              color="brand"
              variant="filled"
              loading={isRetrying}
              onClick={() => retry()}
            >
              Chạy lại Thẩm định AI
            </Button>
          )}
        </div>
      </div>

      <div
        onClick={handleCopyJobId}
        className="inline-flex items-center gap-2 font-mono text-xs cursor-pointer transition-colors select-all"
        title="Nhấn để sao chép Job ID"
      >
        <span style={{ color: "var(--color-text-subtle)" }}>Job ID:</span>
        <span
          className="underline decoration-dotted underline-offset-4 font-semibold hover:text-brand transition-colors"
          style={{ color: "var(--color-text)" }}
        >
          {jobId}
        </span>
        {isCopied && (
          <span className="text-[11px] font-sans font-medium text-emerald-600 dark:text-emerald-400">
            Đã chép
          </span>
        )}
      </div>

      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <p
            className="font-semibold truncate text-sm"
            style={{ color: "var(--color-text)" }}
          >
            {statusText}
          </p>
          <span className="font-mono font-bold text-brand shrink-0 ml-3 text-sm">
            {progressPercent}%
          </span>
        </div>
        <Progress
          value={progressPercent}
          color="teal"
          size="sm"
          radius="xl"
          animated={status === "running"}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {STAGES.map((s) => {
          const isDone = currentStep > s.id || status === "completed";
          const isActive = currentStep === s.id && status === "running";
          return (
            <div
              key={s.id}
              className={`p-2.5 rounded-lg border transition-colors ${isDone ? "border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20" : isActive ? "border-brand/40 bg-brand/5" : "border-border-app bg-surface-soft/40"}`}
            >
              <div
                className="text-[10px] font-mono font-bold uppercase mb-0.5"
                style={{ color: "var(--color-text-subtle)" }}
              >
                {s.num}
              </div>
              <div
                className={`text-xs truncate ${isDone ? "text-emerald-700 dark:text-emerald-400 font-semibold" : isActive ? "text-brand font-bold" : "font-medium"}`}
                style={
                  !isDone && !isActive
                    ? { color: "var(--color-text-muted)" }
                    : undefined
                }
              >
                {s.name}
              </div>
            </div>
          );
        })}
      </div>

      {cleanLogs.length > 0 && (
        <div className="pt-2 border-t border-border-app">
          <button
            type="button"
            onClick={() => setShowLogs(!showLogs)}
            className="text-xs font-medium transition-colors cursor-pointer"
            style={{ color: "var(--color-text-muted)" }}
          >
            {showLogs
              ? "▴ Thu gọn nhật ký"
              : `▾ Xem hoạt động: ${cleanLogs.length} sự kiện`}
          </button>
          {showLogs && (
            <div
              className="mt-2.5 max-h-40 overflow-y-auto rounded-lg border border-border-app p-3 space-y-1.5 text-xs font-mono"
              style={{
                backgroundColor: "var(--color-surface-soft)",
                borderColor: "var(--color-border)",
              }}
            >
              {cleanLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span
                    className="shrink-0 select-none text-[11px]"
                    style={{ color: "var(--color-text-subtle)" }}
                  >
                    {log.timestamp
                      ? new Date(log.timestamp).toLocaleTimeString("vi-VN")
                      : "--:--:--"}
                  </span>
                  <span
                    className="break-words flex-grow text-[11px]"
                    style={{ color: "var(--color-text)" }}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
