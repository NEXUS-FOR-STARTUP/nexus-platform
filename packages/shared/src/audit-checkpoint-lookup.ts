import { AUDIT_CHECKPOINTS, type AuditCheckpointCode, type AuditSubmissionType } from "./audit-checkpoints.js";

export interface AuditScopeEntry {
  serviceType: string;
  input: string;
  postProcess: string;
  prompts: readonly string[];
  reportType: string;
}

interface ScopeShape {
  prompts: Partial<Record<AuditSubmissionType, readonly string[]>>;
  reportType: Partial<Record<AuditSubmissionType, string>>;
}

/** Null when the checkpoint/scope/submission combination is not in the table. */
export function getAuditScopeEntry(
  checkpoint: string,
  scope: string,
  submissionType: string,
): AuditScopeEntry | null {
  if (!Object.hasOwn(AUDIT_CHECKPOINTS, checkpoint)) return null;
  const cp = AUDIT_CHECKPOINTS[checkpoint as AuditCheckpointCode];
  const scopes: Record<string, ScopeShape> = cp.scopes;
  if (!Object.hasOwn(scopes, scope)) return null;
  const entry = scopes[scope];
  const prompts = entry.prompts[submissionType as AuditSubmissionType];
  const reportType = entry.reportType[submissionType as AuditSubmissionType];
  if (!prompts || !reportType) return null;
  return { serviceType: cp.serviceType, input: cp.input, postProcess: cp.postProcess, prompts, reportType };
}
