"use client";

import { useEffect, useRef } from "react";
import { Badge, Text } from "@mantine/core";
import { Terminal, Radio } from "lucide-react";
import type { LogEntry } from "../hooks/useCaseAiStatus";

interface TerminalConsoleProps {
  logs: LogEntry[];
  isStreaming?: boolean;
}

function getLogColor(message: string): string {
  if (message.includes("[stderr]") || message.includes("thất bại") || message.includes("Error") || message.includes("❌")) {
    return "text-rose-400 font-semibold";
  }
  if (message.includes("[Suy nghĩ]") || message.includes("💭")) {
    return "text-amber-300";
  }
  if (message.includes("[Gọi Tool]") || message.includes("🔧")) {
    return "text-cyan-300 font-mono font-medium";
  }
  if (message.includes("[Xong Tool]") || message.includes("✅")) {
    return "text-emerald-400 font-mono font-medium";
  }
  if (message.includes("[Cột mốc]") || message.includes("📦")) {
    return "text-teal-300 font-medium";
  }
  if (message.includes("🛑 [HỦY]")) {
    return "text-red-400 font-bold";
  }
  if (message.includes("[Vòng lặp]") || message.includes("🔄")) {
    return "text-blue-300";
  }
  if (message.includes("[Lượt hoàn thành]") || message.includes("⏱️")) {
    return "text-indigo-300";
  }
  return "text-zinc-300";
}

export default function TerminalConsole({ logs, isStreaming = false }: TerminalConsoleProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/95 overflow-hidden shadow-2xl text-left">
      {/* Console Topbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-semibold text-zinc-200">
            Docker Sandbox Process Stdout/Stderr
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            ({logs.length} dòng)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isStreaming && (
            <Badge
              size="xs"
              variant="dot"
              color="teal"
              className="font-mono text-[10px] uppercase animate-pulse"
            >
              SSE Live
            </Badge>
          )}
          <Badge variant="outline" color="gray" size="xs" className="font-mono text-[10px]">
            OMP Sandbox
          </Badge>
        </div>
      </div>

      {/* Log Screen */}
      <div
        ref={containerRef}
        className="h-[460px] overflow-y-auto p-4 font-mono text-[11px] leading-relaxed select-text space-y-1 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 italic space-y-2">
            <Radio className="w-6 h-6 animate-pulse text-zinc-600" />
            <Text size="xs" c="dimmed">
              Đang kết nối SSE stream... Tiến trình worker OMP sẽ xuất log trực tiếp vào đây.
            </Text>
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 py-0.5 px-1.5 rounded hover:bg-zinc-900/60 transition-colors"
            >
              <span className="text-zinc-500/80 shrink-0 select-none">
                {log.timestamp ? new Date(log.timestamp).toLocaleTimeString("vi-VN") : "--:--:--"}
              </span>
              {log.agent && (
                <span className="text-[9px] px-1 py-0.5 rounded bg-zinc-800 font-bold uppercase shrink-0 text-emerald-400 border border-emerald-500/20">
                  {log.agent}
                </span>
              )}
              <span className={`break-words flex-grow whitespace-pre-wrap ${getLogColor(log.message)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
