import { AUDIT_CHECKPOINTS, type AuditCheckpointCode, type AuditCheckpointOutputs, type AuditSubmissionType } from "./audit-checkpoints.js";

export interface AuditScopeEntry {
  serviceType: string;
  input: string;
  postProcess: string;
  prompts: readonly string[];
  reportType: string;
  outputs: AuditCheckpointOutputs;
}

interface ScopeShape {
  prompts: Partial<Record<AuditSubmissionType, readonly string[]>>;
  reportType: Partial<Record<AuditSubmissionType, string>>;
}

type CheckpointTableEntry = (typeof AUDIT_CHECKPOINTS)[AuditCheckpointCode];

/** Null when the checkpoint/scope/submission combination is not in the table. */
export function getAuditScopeEntry(
  checkpoint: string,
  scope: string,
  submissionType: string,
): AuditScopeEntry | null {
  if (!Object.hasOwn(AUDIT_CHECKPOINTS, checkpoint)) return null;
  const cp: CheckpointTableEntry = AUDIT_CHECKPOINTS[checkpoint as AuditCheckpointCode];
  const scopes: Record<string, ScopeShape> = cp.scopes;
  if (!Object.hasOwn(scopes, scope)) return null;
  const entry = scopes[scope];
  const prompts = entry.prompts[submissionType as AuditSubmissionType];
  const reportType = entry.reportType[submissionType as AuditSubmissionType];
  if (!prompts || !reportType) return null;
  const outputs: AuditCheckpointOutputs = cp.outputs;
  return { serviceType: cp.serviceType, input: cp.input, postProcess: cp.postProcess, prompts, reportType, outputs };
}

export type AuditStepState = "done" | "active" | "pending";
export interface AuditProgressStepState {
  id: string;
  label: string;
  state: AuditStepState;
}

/**
 * Step states from the files present in the job's output dir.
 * A step is done when its file exists or any later step is done; the first not-done step is
 * `active` while the job runs. Only `finished` (report saved) completes the last step.
 */
export function computeProgressSteps(
  checkpoint: string,
  presentFiles: readonly string[],
  opts: { finished: boolean; running: boolean },
): AuditProgressStepState[] {
  if (!Object.hasOwn(AUDIT_CHECKPOINTS, checkpoint)) return [];
  const steps = AUDIT_CHECKPOINTS[checkpoint as AuditCheckpointCode].progressSteps;
  const present = new Set(presentFiles);
  // The last step is "report saved", which only the finalizer completes: its file existing on disk is not
  // enough (and report.json is shared by every checkpoint, so a stray one must not mark a failed run done).
  const lastIndex = steps.length - 1;
  const isDone = (step: { doneWhenFile: string | null }, i: number) =>
    opts.finished || (step.doneWhenFile === null ? opts.running : i < lastIndex && present.has(step.doneWhenFile));
  const lastDone = steps.reduce((last, step, i) => (isDone(step, i) ? i : last), -1);
  return steps.map((step, i) => ({
    id: step.id,
    label: step.label,
    state: i <= lastDone ? "done" : opts.running && i === lastDone + 1 ? "active" : "pending",
  }));
}
