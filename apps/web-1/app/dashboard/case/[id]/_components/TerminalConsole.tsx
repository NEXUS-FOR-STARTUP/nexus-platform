"use client";

import { useEffect, useRef } from "react";
import { Badge, Text } from "@mantine/core";
import { Terminal, Radio } from "lucide-react";
import type { LogEntry } from "../hooks/useCaseAiStatus";

interface TerminalConsoleProps {
  logs: LogEntry[];
  isStreaming?: boolean;
}

function getBadgeInfo(message: string): { label: string; color: string } {
  if (message.includes("🛑") || message.includes("hủy")) {
    return { label: "ĐÃ DỪNG", color: "bg-rose-950/40 text-rose-400 border-rose-500/30" };
  }
  if (message.includes("gián đoạn") || message.includes("thất bại") || message.includes("Error")) {
    return { label: "CẢNH BÁO", color: "bg-red-950/40 text-red-400 border-red-500/30" };
  }
  if (message.includes("📦") || message.includes("Cột mốc")) {
    return { label: "CỘT MỐC", color: "bg-teal-950/40 text-teal-300 border-teal-500/30" };
  }
  if (message.includes("🏁") || message.includes("Hoàn thành")) {
    return { label: "HOÀN TẤT", color: "bg-emerald-950/40 text-emerald-300 border-emerald-500/30" };
  }
  if (message.includes("📄") || message.includes("tài liệu") || message.includes("tiếp nhận")) {
    return { label: "TÀI LIỆU", color: "bg-sky-950/40 text-sky-300 border-sky-500/30" };
  }
  if (message.includes("📚") || message.includes("tri thức")) {
    return { label: "TRI THỨC", color: "bg-indigo-950/40 text-indigo-300 border-indigo-500/30" };
  }
  return { label: "TIẾN TRÌNH", color: "bg-zinc-800 text-zinc-300 border-zinc-700" };
}

function getLogTextColor(message: string): string {
  if (message.includes("gián đoạn") || message.includes("thất bại") || message.includes("Error") || message.includes("🛑")) {
    return "text-rose-400 font-semibold";
  }
  if (message.includes("📦") || message.includes("Cột mốc")) {
    return "text-teal-300 font-medium";
  }
  if (message.includes("🏁") || message.includes("Hoàn thành")) {
    return "text-emerald-400 font-medium";
  }
  if (message.includes("📄")) {
    return "text-sky-200";
  }
  if (message.includes("📚")) {
    return "text-indigo-200";
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
            Nhật ký Hoạt động Đánh giá
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            · {logs.length} bản ghi
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
              Trực tiếp
            </Badge>
          )}
          <Badge variant="outline" color="gray" size="xs" className="font-mono text-[10px]">
            Nexus AI
          </Badge>
        </div>
      </div>

      {/* Log Screen */}
      <div
        ref={containerRef}
        className="h-[360px] overflow-y-auto p-3.5 font-mono text-[11px] leading-relaxed select-text space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 italic space-y-2">
            <Radio className="w-6 h-6 animate-pulse text-zinc-600" />
            <Text size="xs" c="dimmed">
              Đang kết nối luồng trực tiếp... Tiến trình đánh giá AI sẽ cập nhật hoạt động tại đây.
            </Text>
          </div>
        ) : (
          logs.map((log, idx) => {
            const cleanMessage = (log.message || "").replace(/[()]/g, "");
            const badge = getBadgeInfo(cleanMessage);
            return (
              <div
                key={idx}
                className="flex items-start gap-2.5 py-1 px-2 rounded hover:bg-zinc-900/60 transition-colors"
              >
                <span className="text-zinc-500/80 shrink-0 select-none">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString("vi-VN") : "--:--:--"}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 border ${badge.color}`}
                >
                  {badge.label}
                </span>
                <span
                  className={`break-words flex-grow whitespace-pre-wrap ${getLogTextColor(cleanMessage)}`}
                >
                  {cleanMessage}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
