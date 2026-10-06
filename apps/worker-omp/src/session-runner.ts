import type { AgentSession } from "@oh-my-pi/pi-coding-agent/session/agent-session";
import {
  AgentRegistry,
  createAgentSession,
  discoverAuthStorage,
  SessionManager,
  Settings,
} from "@oh-my-pi/pi-coding-agent";
import { ModelRegistry } from "@oh-my-pi/pi-coding-agent/config/model-registry";
import { resolveCliModel } from "@oh-my-pi/pi-coding-agent/config/model-resolver";
import { ProcessResourceTracker } from "@app/shared";
import { logJob } from "./storage.js";
import { handleAgentSessionEvent } from "./event-parser.js";
import { registerActiveJob, unregisterActiveJob } from "./process-registry.js";
import { checkJobMilestones } from "./job-sandbox.js";

export interface RunOmpSessionOptions {
  jobId: string;
  caseId?: string;
  jobDir: string;
  outputDir: string;
  model: string;
  prompt: string;
}

export interface SessionRunResult {
  exitCode: number;
  error?: string;
  rawLogs: string;
  tracker: ProcessResourceTracker | null;
}

// Grace period after cancel before forcing teardown (old SIGTERM→SIGKILL escalation, SDK terms).
const CANCEL_ESCALATION_MS = 30000;
// Cap for draining short-lived post-prompt work (async-job delivery turns) before dispose.
const POST_PROMPT_DRAIN_MS = 60000;

/** In-process OMP SDK session (was: CLI child process). Auth/keys inherited from process.env. */
export async function runOmpSession(options: RunOmpSessionOptions): Promise<SessionRunResult> {
  const { jobId, caseId, jobDir, outputDir, model: modelSelector, prompt } = options;

  let rawLogs = "";
  const emit = (message: string) => {
    rawLogs += message + "\n";
    logJob(jobId, message, caseId);
  };
  const appendEventLog = (message: string | undefined) => {
    if (message) rawLogs += message + "\n";
  };

  emit("Khởi chạy tiến trình sandbox AI (OMP Runner)...");

  // With no child PID, track the daemon itself (documents per-job heap delta limits).
  const tracker = new ProcessResourceTracker(process.pid, jobDir);
  tracker.start(350);

  const milestoneSeen = new Set<string>();
  const milestoneTimer = setInterval(() => {
    try {
      checkJobMilestones(jobId, jobDir, outputDir, milestoneSeen);
    } catch (err) {
      console.warn(`[Worker-OMP][${jobId}] Milestone check failed:`, err instanceof Error ? err.message : err);
    }
  }, 3000);

  let isCancelled = false;
  let exitCode = 0;
  let error: string | undefined;
  let session: AgentSession | undefined;
  let escalationTimer: ReturnType<typeof setTimeout> | undefined;

  const cancelMessage = "🛑 [HỦY] Đã nhận tín hiệu ngắt từ người dùng. Đang dừng phiên OMP...";
  const stoppedMessage = "Phiên OMP đã dừng do người dùng hủy bỏ.";
  const cancelledResult = (): SessionRunResult => ({ exitCode: 130, error: "CANCELLED", rawLogs, tracker });

  // Early registration: the setup below takes seconds, cancellations in that window must not be lost.
  registerActiveJob(jobId, {
    cancel: () => {
      if (isCancelled) return;
      isCancelled = true;
      emit(cancelMessage);
    },
  });

  const unregisterAll = () => {
    unregisterActiveJob(jobId);
    if (caseId && caseId !== jobId) unregisterActiveJob(caseId);
  };

  try {
    const [settings, authStorage] = await Promise.all([
      Settings.init({ cwd: jobDir }),
      discoverAuthStorage(),
    ]);
    const modelRegistry = new ModelRegistry(authStorage);
    await modelRegistry.refresh();
    const resolved = resolveCliModel({ cliModel: modelSelector, modelRegistry, settings });
    if (resolved.error || !resolved.model) {
      throw new Error(resolved.error ?? `Model "${modelSelector}" not found`);
    }

    if (isCancelled) {
      emit(stoppedMessage);
      return cancelledResult();
    }

    const created = await createAgentSession({
      cwd: jobDir,
      settings,
      authStorage,
      modelRegistry,
      model: resolved.model,
      sessionManager: SessionManager.inMemory(jobDir),
      // Private registry per session: the daemon runs concurrent sessions (concurrency 2),
      // and the SDK's shared global registry admits only one "Main" per process.
      agentRegistry: new AgentRegistry(),
      hasUI: false,
      autoApprove: true,
    });
    session = created.session;

    const cancelHandler = () => {
      if (isCancelled) return;
      isCancelled = true;
      emit(cancelMessage);
      void session?.abort({ reason: "Cancelled by user" })?.catch(() => {});
      // Escalation: cooperative abort can hang on a stuck tool — force teardown after grace.
      escalationTimer = setTimeout(() => {
        emit("⚠️ Phiên OMP chưa dừng sau 30 giây, đang cưỡng chế dọn dẹp...");
        void session?.dispose()?.catch(() => {});
      }, CANCEL_ESCALATION_MS);
    };
    registerActiveJob(jobId, { cancel: cancelHandler });
    if (caseId && caseId !== jobId) registerActiveJob(caseId, { cancel: cancelHandler });

    if (isCancelled) {
      emit(stoppedMessage);
      return cancelledResult();
    }

    const unsubscribe = session.subscribe((event) => {
      appendEventLog(handleAgentSessionEvent(jobId, event, caseId));
    });
    let dispatched = false;
    try {
      dispatched = await session.prompt(prompt);
    } finally {
      unsubscribe();
      if (escalationTimer) clearTimeout(escalationTimer);
    }

    if (!dispatched && !isCancelled) {
      throw new Error("Prompt không được chuyển tới agent.");
    }

    // Drain short-lived post-prompt work (async-job delivery turns) before dispose truncates it.
    if (!isCancelled) {
      const drainStart = Date.now();
      while (session.hasPostPromptWork && Date.now() - drainStart < POST_PROMPT_DRAIN_MS) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    if (isCancelled) {
      emit(stoppedMessage);
      exitCode = 130;
      error = "CANCELLED";
    } else {
      emit(`Phiên OMP kết thúc với mã thoát: ${exitCode}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (isCancelled) {
      emit(stoppedMessage);
      exitCode = 130;
      error = "CANCELLED";
    } else {
      emit(`Lỗi phiên OMP: ${message}`);
      exitCode = 1;
      error = message;
    }
  } finally {
    clearInterval(milestoneTimer);
    if (escalationTimer) clearTimeout(escalationTimer);
    unregisterAll();
    if (session) {
      try {
        await session.dispose();
      } catch {
        // Ignore disposal errors after abort
      }
    }
  }

  return { exitCode, error, rawLogs, tracker };
}
