import type { LogEntry } from "../hooks/useCaseAiStatus";

export const DIRTY_LOG_KEYWORDS = [
  "[gọi tool]", "🔧", "[xong tool]", "✅", "[vòng lặp]", "🔄",
  "[lượt hoàn thành]", "⏱️", "tokens", "system_prompt", "read path:",
  "glob path:", "[model]", "sandbox runner", "todo", "omp-session",
  "omp runner", "omp process", "omp",
];

export function filterCleanLogs(logs: LogEntry[]): LogEntry[] {
  return logs
    .filter(
      (l) =>
        l.message &&
        !DIRTY_LOG_KEYWORDS.some((kw) => l.message.toLowerCase().includes(kw)),
    )
    .map((l) => ({
      ...l,
      message: l.message
        .replace(/[()[\]·]/g, "-")
        .replace(/\s+-\s+/g, " - ")
        .trim(),
    }));
}
