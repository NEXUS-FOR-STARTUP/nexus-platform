import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { scoreCp2Report, validateCp2Report, type Cp2SchemaId } from "@repo/validation";
import logger from "../../../shared/infrastructure/logger.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { CP3_ANSWERS_FILE } from "./cp3-audit-input.js";
import { loadAttachmentSources, type PostProcessor } from "./cp2-audit-postprocess.js";
import { verifyCp2Quotes } from "./cp2-quote-verify.js";

/** Sources a CP3 quote may cite as the team's own words: CP3 question ids and the CP3 answers file. */
export const CP3_QUESTION_SOURCE = /^(cp3_[a-z0-9_]+|cp3_answers\.md)$/i;

export function cp3AllowedSchemas(submissionType: string): Cp2SchemaId[] {
  // A resubmit without a usable previous report is graded as a first audit (prompt rule).
  return submissionType === "resubmit" ? ["cp3_full_v1", "cp3_full_resubmit_v1"] : ["cp3_full_v1"];
}

/**
 * validate (zod) -> verify quotes -> score. Throws AppError(422) so the job fails and the credit is refunded.
 * Copy of the CP2 flow on purpose: the paid CP2 path stays untouched until both are proven.
 */
export const postProcessCp3Scored: PostProcessor = async (ctx) => {
  const validation = validateCp2Report(ctx.reportJson, cp3AllowedSchemas(ctx.submissionType));
  if (!validation.ok) {
    logger.error({ jobId: ctx.aiJobId, caseId: ctx.caseId, issues: validation.issues }, "CP3 report.json failed validation");
    throw new AppError(422, "CP3_REPORT_INVALID", "Báo cáo CP3 không hợp lệ.");
  }
  const { report } = validation;

  const inputDir = resolve(ctx.jobDir, "input");
  const answersPath = resolve(inputDir, CP3_ANSWERS_FILE);
  const answers = existsSync(answersPath) ? readFileSync(answersPath, "utf-8") : null;
  const attachments = await loadAttachmentSources(inputDir, ctx.caseId);

  let evidenceUnverified: string[] = [];
  let evidenceUnchecked: string[] = [];
  if (answers === null) {
    logger.warn({ jobId: ctx.aiJobId, caseId: ctx.caseId }, "CP3 input snapshot missing at finalize; quotes not checked");
    evidenceUnchecked = report.checks.filter((c) => c.evidence.length > 0).map((c) => c.id);
  } else {
    const verified = verifyCp2Quotes(report, [answers], attachments, CP3_QUESTION_SOURCE);
    evidenceUnverified = verified.unverified;
    evidenceUnchecked = verified.unchecked;
  }
  if (evidenceUnverified.length > 0) {
    logger.warn({ jobId: ctx.aiJobId, caseId: ctx.caseId, count: evidenceUnverified.length }, "CP3 report has quotes not found in the input");
  }

  const score = scoreCp2Report(report.schema, report.checks);
  return { ...ctx.reportJson, ...score, evidenceUnverified, evidenceUnchecked };
};
