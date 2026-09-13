import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { requireCaseAccess } from "../../../shared/infrastructure/authorization.js";
import { handleError, readJsonBody } from "../../../shared/infrastructure/http-helpers.js";
import { jobStore } from "../../ai-engine/infrastructure/persistence/job-store.repository.js";
import { getCaseAiAuditStatus } from "../../ai-engine/application/omp-audit-status.js";
import {
  triggerOmpAuditForCase,
  cancelOmpAuditForCase,
} from "../../ai-engine/application/omp-audit-coordinator.js";

/**
 * GET /api/cases/:id/ai-status — Current audit status, Job ID, and latest logs
 */
export async function getCaseAiStatusHandler(c: Context) {
  const caseId = c.req.param("id") || "";
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    const status = await getCaseAiAuditStatus(caseId);
    return c.json(status);
  } catch (err) {
    return handleError(c, err);
  }
}

/**
 * GET /api/cases/:id/ai-events — Live SSE log stream & state updates
 */
export async function streamCaseAiEventsHandler(c: Context) {
  const caseId = c.req.param("id") || "";
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  return streamSSE(c, async (stream) => {
    // 1. Initial status handshake
    const initialStatus = await getCaseAiAuditStatus(caseId);
    await stream.writeSSE({
      event: "job_state",
      data: JSON.stringify(initialStatus),
    });

    // 2. Initial existing logs replay from Redis
    const existingLogs = await jobStore.getLogs(caseId);
    for (const log of existingLogs) {
      await stream.writeSSE({
        event: "log",
        data: JSON.stringify(log),
      });
    }

    // 3. EventEmitter / Redis PubSub listeners
    const onJobUpdate = (updatedJob: any) => {
      stream
        .writeSSE({
          event: "job_state",
          data: JSON.stringify(updatedJob),
        })
        .catch(() => {});
    };

    const onLog = (logEntry: any) => {
      stream
        .writeSSE({
          event: "log",
          data: JSON.stringify(logEntry),
        })
        .catch(() => {});
    };

    jobStore.on(`job:${caseId}`, onJobUpdate);
    jobStore.on(`log:${caseId}`, onLog);

    stream.onAbort(() => {
      jobStore.off(`job:${caseId}`, onJobUpdate);
      jobStore.off(`log:${caseId}`, onLog);
    });

    // 4. SSE heartbeat loop to keep connection alive without disk polling
    while (!stream.aborted) {
      await stream.sleep(15000);
      try {
        await stream.writeSSE({
          event: "ping",
          data: "",
        });
      } catch {
        break;
      }
    }
  });
}

/**
 * POST /api/cases/:id/ai-cancel — Cancel running OMP audit job
 */
export async function cancelCaseAiAuditHandler(c: Context) {
  const caseId = c.req.param("id") || "";
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    const result = await cancelOmpAuditForCase(caseId);
    return c.json(result);
  } catch (err) {
    return handleError(c, err);
  }
}

/**
 * POST /api/cases/:id/ai-retry — Retry OMP Audit for case
 * Body: { submission_type: 'initial' | 'resubmit' | 'logic_check', lifecycle_unit_id?: string }
 */
export async function retryCaseAiAuditHandler(c: Context) {
  const caseId = c.req.param("id") || "";
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    const body = await readJsonBody(c);
    const submissionType = body?.submission_type;
    const lifecycleUnitId = body?.lifecycle_unit_id;

    await triggerOmpAuditForCase(caseId, {
      submission_type: submissionType,
      lifecycle_unit_id: lifecycleUnitId,
    });

    return c.json({ success: true, message: "Đã kích hoạt thẩm định AI OMP" });
  } catch (err) {
    return handleError(c, err);
  }
}
