import type { Context } from "hono";
import { AUDIT_CHECKPOINT_CODES, type AuditCheckpointCode } from "@app/shared";
import { AppError } from "../../../shared/domain/app-error.js";
import { requireCaseAccess } from "../../../shared/infrastructure/authorization.js";
import { handleError, readJsonBody } from "../../../shared/infrastructure/http-helpers.js";
import { getCaseAiAuditStatus } from "../../ai-engine/application/omp-audit-status.js";
import {
  triggerOmpAuditForCase,
  cancelOmpAuditForCase,
} from "../../ai-engine/application/omp-audit-coordinator.js";

/**
 * GET /api/cases/:id/ai-status[?checkpoint=CP1|CP2] — status, progress steps and logs of the latest
 * audit job (of that checkpoint when given; the stage panel always passes it).
 */
export async function getCaseAiStatusHandler(c: Context) {
  const caseId = c.req.param("id") || "";
  const access = await requireCaseAccess(c, caseId);
  if (!access.ok) {
    return access.response;
  }

  try {
    const checkpoint = c.req.query("checkpoint");
    if (checkpoint !== undefined && !AUDIT_CHECKPOINT_CODES.includes(checkpoint as AuditCheckpointCode)) {
      throw new AppError(400, "INVALID_CHECKPOINT", "Vòng thẩm định không hợp lệ.");
    }
    const status = await getCaseAiAuditStatus(caseId, checkpoint);
    return c.json(status);
  } catch (err) {
    return handleError(c, err);
  }
}

/**
 * POST /api/cases/:id/ai-cancel — Cancel running OMP audit job
 */
export async function cancelCaseAiAuditHandler(c: Context) {
  const caseId = c.req.param("id") || "";
  // Students never stop a running job; only the assigned supporter/admin can (admin job drawer).
  const access = await requireCaseAccess(c, caseId, { allowStudent: false });
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
 * Body: { submission_type?: 'initial' | 'resubmit' | 'logic_check', lifecycle_unit_id?: string,
 *         checkpoint?: 'CP1' | 'CP2', scope?: 'questionnaire' | 'full' (CP2 only, required there),
 *         input_source?: 'answers' | 'files' | 'both' (CP2 only, default 'answers'),
 *         change_summary?: string (CP2 resubmit) }
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

    // checkpoint/scope/change_summary are validated by TriggerOptsSchema; absent checkpoint = CP1.
    await triggerOmpAuditForCase(caseId, {
      submission_type: submissionType,
      lifecycle_unit_id: lifecycleUnitId,
      checkpoint: body?.checkpoint,
      scope: body?.scope,
      input_source: body?.input_source,
      change_summary: body?.change_summary,
    });

    return c.json({ success: true, message: "Đã kích hoạt thẩm định Nexus AI Engine" });
  } catch (err) {
    return handleError(c, err);
  }
}
