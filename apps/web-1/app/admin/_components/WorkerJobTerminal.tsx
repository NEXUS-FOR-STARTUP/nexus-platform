"use client";

import { useEffect, useRef, useState } from "react";
import { ActionIcon, Button, Group, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Copy, Terminal, ArrowDown, Check } from "lucide-react";
import { useAdminWorkerLogs, type AdminWorkerLogEntry } from "../hooks/useAdminWorkers";

interface WorkerJobTerminalProps {
  jobId: string;
  isRunning: boolean;
}

export default function WorkerJobTerminal({ jobId, isRunning }: WorkerJobTerminalProps) {
  const { data, isLoading } = useAdminWorkerLogs(jobId, isRunning);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const terminalRef = useRef<HTMLPreElement>(null);
  const rawLogs = data?.logs;
  const logText = Array.isArray(rawLogs)
    ? rawLogs
        .map((entry: AdminWorkerLogEntry | string) => {
          if (typeof entry === "string") return entry;
          if (entry && typeof entry === "object") {
            const time = entry.timestamp
              ? new Date(entry.timestamp).toLocaleTimeString("vi-VN")
              : "";
            const agent = entry.agent ? `[${entry.agent.toUpperCase()}]` : "";
            const msg = entry.message || "";
            const prefix = [time, agent].filter(Boolean).join(" ");
            return prefix ? `${prefix} ${msg}` : msg || JSON.stringify(entry);
          }
          return String(entry ?? "");
        })
        .join("\n")
    : typeof rawLogs === "string"
    ? rawLogs
    : "";

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logText, autoScroll]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(logText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      notifications.show({
        title: "Đã sao chép",
        message: "Đã sao chép nhật ký terminal vào bộ nhớ tạm",
        color: "green",
      });
    } catch {
      notifications.show({
        title: "Lỗi sao chép",
        message: "Không thể sao chép văn bản vào bộ nhớ tạm",
        color: "red",
      });
    }
  };

  return (
    <div className="space-y-2">
      <Group justify="space-between" className="px-1">
        <Group gap="xs">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <Text size="xs" fw={600} className="font-mono text-text-app">
            Nhật ký thực thi {isRunning && <span className="text-blue-500 font-sans font-normal">(Đang live...)</span>}
          </Text>
        </Group>
        <Group gap="xs">
          <Button
            size="xs"
            variant={autoScroll ? "filled" : "light"}
            color={autoScroll ? "blue" : "gray"}
            leftSection={<ArrowDown className="w-3.5 h-3.5" />}
            onClick={() => setAutoScroll((prev) => !prev)}
          >
            Auto-scroll {autoScroll ? "Bật" : "Tắt"}
          </Button>
          <Tooltip label="Sao chép toàn bộ nhật ký">
            <ActionIcon size="sm" variant="light" color={copied ? "green" : "gray"} onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <pre
        ref={terminalRef}
        className="p-3 rounded-lg overflow-y-auto max-h-[500px] min-h-[300px] font-mono text-xs leading-relaxed border border-zinc-800 text-emerald-400 whitespace-pre-wrap selection:bg-emerald-900 selection:text-white"
        style={{ backgroundColor: "#0a0a0a" }}
      >
        {isLoading && !logText ? (
          <span className="text-zinc-500">Đang nạp nhật ký từ máy chủ...</span>
        ) : logText ? (
          logText
        ) : (
          <span className="text-zinc-500">Chưa có nhật ký ghi nhận cho tiến trình này.</span>
        )}
      </pre>
    </div>
  );
}
