"use client";

import { ChevronDown, Terminal } from "lucide-react";
import type { LogEntry } from "../hooks/useCaseAiStatus";

interface RadarLogsViewerProps {
  logs: LogEntry[];
  showLogs: boolean;
  onToggle: () => void;
}

export default function RadarLogsViewer({
  logs,
  showLogs,
  onToggle,
}: RadarLogsViewerProps) {
  if (logs.length === 0) return null;

  return (
    <div className="pt-3 border-t border-border-app">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full p-2.5 rounded-lg border border-border-app bg-surface-soft/40 hover:bg-surface-soft transition-colors cursor-pointer text-xs font-medium text-text-muted group"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-brand" />
          <span className="font-semibold text-text-app">Nhật ký hoạt động</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-surface-muted text-text-subtle border border-border-app">
            {logs.length} sự kiện
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-text-subtle group-hover:text-text-app transition-colors">
          <span>{showLogs ? "Thu gọn" : "Xem chi tiết"}</span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              showLogs ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {showLogs && (
        <div
          className="mt-2.5 max-h-48 overflow-y-auto rounded-lg border border-border-app p-3 space-y-1.5 text-xs font-mono"
          style={{
            backgroundColor: "var(--color-surface-soft)",
            borderColor: "var(--color-border)",
          }}
        >
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span
                className="shrink-0 select-none text-[11px] font-mono text-text-subtle"
              >
                {log.timestamp
                  ? new Date(log.timestamp).toLocaleTimeString("vi-VN")
                  : "--:--:--"}
              </span>
              <span className="break-words flex-grow text-[11px] text-text-app">
                {log.message}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
