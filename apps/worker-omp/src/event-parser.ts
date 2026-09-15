import { logJob } from "./storage.js";

function getFileName(filePath: string): string {
  const parts = filePath.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || filePath;
}

export function parseAndLogAgentEvent(jobId: string, line: string): void {
  const trimmed = line.trim();
  if (!trimmed) return;

  // If not JSON, ignore raw CLI traces or prompt leaks
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    if (
      trimmed.includes("# SYSTEM PROMPT") ||
      trimmed.includes("--- HƯỚNG DẪN") ||
      trimmed.includes("Fixed Two-Step") ||
      trimmed.includes("bun ") ||
      trimmed.includes("node ")
    ) {
      return;
    }
    // Only log if it is a meaningful clean Vietnamese message
    if (trimmed.startsWith("🛑") || trimmed.startsWith("📦") || trimmed.startsWith("✅")) {
      logJob(jobId, trimmed);
    }
    return;
  }

  try {
    const ev = JSON.parse(trimmed);
    switch (ev.type) {
      case "turn_start":
        // Keep turn_start quiet to prevent log spam
        break;

      case "tool_execution_start": {
        const pathArg = ev.args?.path || ev.args?.filePath || "";
        if (typeof pathArg === "string" && pathArg) {
          // Internal framework files - do not leak
          if (pathArg.includes("system_prompt/") || pathArg.includes(".omp-session/")) {
            return;
          }
          if (pathArg.includes("knowledge/")) {
            logJob(jobId, "📚 Đối chiếu dữ liệu với cơ sở tri thức khởi nghiệp và tiêu chuẩn chuyên môn");
            return;
          }
          if (pathArg.includes("input/")) {
            const fileName = getFileName(pathArg).replace(/:raw$/, "");
            logJob(jobId, `📄 Đang tiếp nhận và bóc tách dữ liệu: ${fileName}`);
            return;
          }
          if (pathArg.includes("output/")) {
            // Output creation is handled via milestone watcher
            return;
          }
        }
        break;
      }

      case "tool_execution_end":
        // Do not leak raw character counts or low-level tool completions
        break;

      case "message_update": {
        const ame = ev.assistantMessageEvent;
        if (ame?.type === "text_end" && ame.content) {
          const text = ame.content.trim();
          if (
            text &&
            !text.includes("# SYSTEM PROMPT") &&
            !text.includes("--- HƯỚNG DẪN") &&
            !text.includes("```") &&
            text.length < 200
          ) {
            // Strip any accidental parentheses
            const cleanText = text.replace(/[()]/g, "");
            logJob(jobId, `📝 ${cleanText}`);
          }
        }
        break;
      }

      case "turn_end": {
        // Log token metrics only to server console, never to user activity stream
        const usage = ev.message?.usage;
        if (usage) {
          console.log(
            `[Worker-OMP][${jobId}][Usage] In: ${usage.input || 0} | Out: ${usage.output || 0} | Total: ${usage.totalTokens || 0}`
          );
        }
        break;
      }

      case "agent_end":
        logJob(jobId, "🏁 Hoàn tất các bước phân tích tự hành");
        break;

      default:
        break;
    }
  } catch {
    // Ignore JSON parse errors for non-conforming lines
  }
}
