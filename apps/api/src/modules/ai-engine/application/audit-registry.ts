import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { AUDIT_CHECKPOINTS, getAuditScopeEntry, type AuditCheckpointCode, type Cp2InputSource, type AuditScopeEntry, type AuditSubmissionType } from "@app/shared";
import { AppError } from "../../../shared/domain/app-error.js";
import { resolveRepoRoot, type OmpAuditInputFile } from "../omp-audit.service.js";
import { assembleCp1InputFiles } from "./cp1-audit-input.js";
import { assembleCp2InputFiles } from "./cp2-audit-input.js";
import { postProcessCp1Legacy, postProcessCp2Scored, type PostProcessor } from "./cp2-audit-postprocess.js";

export interface InputRequest {
  caseId: string;
  submissionType: AuditSubmissionType;
  lifecycleUnitId: string | null;
  changeSummary?: string;
  userNote?: string;
  scope?: string;
  inputSource?: Cp2InputSource;
  /** Case library folder (`storage/jobs/<caseId>/_library`) where earlier-stage context files live. */
  libraryDir: string;
}

export interface AssembledInput {
  inputFiles: OmpAuditInputFile[];
  resolvedLifecycleUnitId: string | null;
  /** Library files this run references; the coordinator mirrors them next to a mirrored sandbox. */
  libraryNames?: string[];
}

export type InputAssembler = (req: InputRequest) => Promise<AssembledInput>;

/** Keys are the `input` / `postProcess` values of `AUDIT_CHECKPOINTS`; a test keeps them in lockstep. */
export const INPUT_ASSEMBLERS: Record<string, InputAssembler> = {
  cp1_intake: (req) => assembleCp1InputFiles(req.caseId, req.submissionType, req.lifecycleUnitId, req.changeSummary),
  cp2_answers: (req) => assembleCp2InputFiles({ caseId: req.caseId, submissionType: req.submissionType, changeSummary: req.changeSummary, userNote: req.userNote, scope: req.scope, inputSource: req.inputSource, libraryDir: req.libraryDir }),
};

export const POST_PROCESSORS: Record<string, PostProcessor> = {
  cp1_legacy: postProcessCp1Legacy,
  cp2_scored: postProcessCp2Scored,
};

export interface AuditPlan extends AuditScopeEntry {
  checkpoint: AuditCheckpointCode;
  scope: string;
}

/** Table lookup; any combination missing from the table is a 400. */
export function resolveAuditPlan(checkpoint: AuditCheckpointCode, scope: string, submissionType: string): AuditPlan {
  const entry = getAuditScopeEntry(checkpoint, scope, submissionType);
  if (!entry) {
    throw new AppError(400, "INVALID_AUDIT_COMBINATION", "Tổ hợp checkpoint, phạm vi và loại thẩm định không được hỗ trợ.");
  }
  return { ...entry, checkpoint, scope };
}

/**
 * Boot-time guard: every prompt a registered service can ask for must exist on disk. A deploy that
 * forgot to ship them fails here instead of failing a paid grading run later.
 */
export function assertAuditPromptsPresent(): void {
  const dir = resolve(resolveRepoRoot(), "data", "system-prompts");
  const missing = new Set<string>();
  for (const service of Object.values(AUDIT_CHECKPOINTS)) {
    for (const scope of Object.values(service.scopes)) {
      for (const prompts of Object.values(scope.prompts) as ReadonlyArray<readonly string[]>) {
        for (const file of prompts) if (!existsSync(resolve(dir, file))) missing.add(file);
      }
    }
  }
  if (missing.size > 0) throw new Error(`Audit prompt files missing in ${dir}: ${[...missing].join(", ")}`);
}
