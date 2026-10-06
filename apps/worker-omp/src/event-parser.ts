import type { AgentSessionEvent } from "@oh-my-pi/pi-coding-agent/session/agent-session-events";
import { logJob } from "./storage.js";

function getFileName(filePath: string): string {
  const parts = filePath.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || filePath;
}

/** Handle one typed SDK event. Returns the user-facing message when one was logged. */
export function handleAgentSessionEvent(jobId: string, event: AgentSessionEvent, caseId?: string): string | undefined {
  switch (event.type) {
    case "turn_start":
      // Keep turn_start quiet to prevent log spam
      break;

    case "tool_execution_start": {
      const pathArg = event.args?.path || event.args?.filePath || "";
      if (typeof pathArg === "string" && pathArg) {
        // Internal framework files - do not leak
        if (pathArg.includes("system_prompt/")) {
          return undefined;
        }
        if (pathArg.includes("knowledge/")) {
          const msg = "📚 Đối chiếu dữ liệu với cơ sở tri thức khởi nghiệp và tiêu chuẩn chuyên môn";
          logJob(jobId, msg, caseId);
          return msg;
        }
        if (pathArg.includes("input/")) {
          const msg = `📄 Đang tiếp nhận và bóc tách dữ liệu: ${getFileName(pathArg).replace(/:raw$/, "")}`;
          logJob(jobId, msg, caseId);
          return msg;
        }
        if (pathArg.includes("output/")) {
          // Output creation is handled via milestone watcher
          return undefined;
        }
      }
      break;
    }

    case "tool_execution_end":
      // Do not leak raw character counts or low-level tool completions
      break;

    case "message_update": {
      const ame = event.assistantMessageEvent;
      if (ame.type === "text_end") {
        const text = ame.content.trim();
        if (
          text &&
          !text.includes("# SYSTEM PROMPT") &&
          !text.includes("--- HƯỚNG DẪN") &&
          !text.includes("```") &&
          text.length < 200
        ) {
          // Strip any accidental parentheses
          const msg = `📝 ${text.replace(/[()]/g, "")}`;
          logJob(jobId, msg, caseId);
          return msg;
        }
      }
      break;
    }

    case "turn_end": {
      // Log token metrics only to server console, never to user activity stream
      if (event.message.role === "assistant") {
        const usage = event.message.usage;
        if (usage) {
          console.log(
            `[Worker-OMP][${jobId}][Usage] In: ${usage.input || 0} | Out: ${usage.output || 0} | Total: ${usage.totalTokens || 0}`
          );
        }
      }
      break;
    }

    case "agent_end":
      // isTerminal === false means async delivery will resume the session — not done yet.
      if (event.isTerminal === false) break;
      {
        const msg = "🏁 Hoàn tất các bước phân tích tự hành";
        logJob(jobId, msg, caseId);
        return msg;
      }

    case "notice":
      // Surface SDK warnings/errors to the job log (replaces stderr streaming)
      if (event.level === "error" || event.level === "warning") {
        const msg = `⚠️ [${event.source ?? "omp"}] ${event.message}`;
        logJob(jobId, msg, caseId);
        return msg;
      }
      break;

    default:
      break;
  }
  return undefined;
}
