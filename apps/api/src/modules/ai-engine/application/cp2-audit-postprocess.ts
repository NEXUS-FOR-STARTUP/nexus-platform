import { existsSync, readFileSync, readdirSync } from "node:fs";
import { extname, resolve } from "node:path";
import { scoreCp2Report, validateCp2Report, type Cp2SchemaId } from "@repo/validation";
import logger from "../../../shared/infrastructure/logger.js";
import { AppError } from "../../../shared/domain/app-error.js";
import { extractTextFromBuffer } from "../../guided-documents/infrastructure/document-parser.js";
import { CP2_ANSWERS_FILE, CP2_ATTACHMENTS_DIR, CP2_SELF_CHECKS_FILE } from "./cp2-audit-input.js";
import { verifyCp2Quotes, type QuoteSource } from "./cp2-quote-verify.js";

export interface PostProcessContext {
  caseId: string;
  aiJobId?: string;
  /** Sandbox directory holding `input/` and `output/`. */
  jobDir: string;
  scope: string;
  submissionType: string;
  reportJson: Record<string, unknown>;
}

export type PostProcessor = (ctx: PostProcessContext) => Promise<Record<string, unknown>>;

const PARSEABLE_EXTENSIONS = new Set([".md", ".txt", ".docx", ".pdf"]);

/** CP1 keeps its existing finalizer behaviour: the model's report.json is stored as is. */
export const postProcessCp1Legacy: PostProcessor = async (ctx) => ctx.reportJson;

function allowedSchemas(scope: string, submissionType: string): Cp2SchemaId[] {
  if (scope === "questionnaire") return ["cp2_questionnaire_v1"];
  // A resubmit without a usable previous report is graded as a first full audit (prompt rule).
  return submissionType === "resubmit" ? ["cp2_full_v1", "cp2_full_resubmit_v1"] : ["cp2_full_v1"];
}

function readOptional(path: string): string | null {
  return existsSync(path) ? readFileSync(path, "utf-8") : null;
}

async function loadAttachmentSources(inputDir: string, caseId: string): Promise<QuoteSource[]> {
  const dir = resolve(inputDir, CP2_ATTACHMENTS_DIR);
  if (!existsSync(dir)) return [];
  const sources: QuoteSource[] = [];
  for (const name of readdirSync(dir)) {
    if (!PARSEABLE_EXTENSIONS.has(extname(name).toLowerCase())) {
      sources.push({ name, text: null });
      continue;
    }
    try {
      sources.push({ name, text: await extractTextFromBuffer(readFileSync(resolve(dir, name)), name) });
    } catch (err: unknown) {
      logger.warn({ caseId, ext: extname(name), err: err instanceof Error ? err.message : String(err) }, "CP2 attachment text extraction failed; its quotes will be unchecked");
      sources.push({ name, text: null });
    }
  }
  return sources;
}

/** validate (zod) -> verify quotes -> score. Throws AppError(422) so the job fails and the credit is refunded. */
export const postProcessCp2Scored: PostProcessor = async (ctx) => {
  const validation = validateCp2Report(ctx.reportJson, allowedSchemas(ctx.scope, ctx.submissionType));
  if (!validation.ok) {
    logger.error({ jobId: ctx.aiJobId, caseId: ctx.caseId, issues: validation.issues }, "CP2 report.json failed validation");
    throw new AppError(422, "CP2_REPORT_INVALID", "Báo cáo CP2 không hợp lệ.");
  }
  const { report } = validation;

  const inputDir = resolve(ctx.jobDir, "input");
  const answers = readOptional(resolve(inputDir, CP2_ANSWERS_FILE));
  const selfChecks = readOptional(resolve(inputDir, CP2_SELF_CHECKS_FILE));
  const attachments = await loadAttachmentSources(inputDir, ctx.caseId);

  let evidenceUnverified: string[] = [];
  let evidenceUnchecked: string[] = [];
  if (answers === null) {
    logger.warn({ jobId: ctx.aiJobId, caseId: ctx.caseId }, "CP2 input snapshot missing at finalize; quotes not checked");
    evidenceUnchecked = report.checks.filter((c) => c.evidence.length > 0).map((c) => c.id);
  } else {
    const verified = verifyCp2Quotes(report, [answers, selfChecks ?? ""], attachments);
    evidenceUnverified = verified.unverified;
    evidenceUnchecked = verified.unchecked;
  }
  if (evidenceUnverified.length > 0) {
    logger.warn({ jobId: ctx.aiJobId, caseId: ctx.caseId, count: evidenceUnverified.length }, "CP2 report has quotes not found in the input");
  }

  const score = scoreCp2Report(report.schema, report.checks);
  return { ...ctx.reportJson, ...score, evidenceUnverified, evidenceUnchecked };
};
