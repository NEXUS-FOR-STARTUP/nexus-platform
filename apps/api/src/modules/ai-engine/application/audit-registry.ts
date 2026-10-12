import { getAuditScopeEntry, type AuditCheckpointCode, type Cp2InputSource, type AuditScopeEntry, type AuditSubmissionType } from "@app/shared";
import { AppError } from "../../../shared/domain/app-error.js";
import type { OmpAuditInputFile } from "../omp-audit.service.js";
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
}

export type InputAssembler = (req: InputRequest) => Promise<{ inputFiles: OmpAuditInputFile[]; resolvedLifecycleUnitId: string | null }>;

/** Keys are the `input` / `postProcess` values of `AUDIT_CHECKPOINTS`; a test keeps them in lockstep. */
export const INPUT_ASSEMBLERS: Record<string, InputAssembler> = {
  cp1_intake: (req) => assembleCp1InputFiles(req.caseId, req.submissionType, req.lifecycleUnitId),
  cp2_answers: (req) => assembleCp2InputFiles({ caseId: req.caseId, submissionType: req.submissionType, changeSummary: req.changeSummary, userNote: req.userNote, scope: req.scope, inputSource: req.inputSource }),
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
