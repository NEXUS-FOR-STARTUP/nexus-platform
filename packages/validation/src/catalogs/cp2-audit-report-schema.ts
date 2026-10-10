import { z } from "zod";
import { CP2_SCHEMAS, CP2_SCHEMA_IDS, type Cp2SchemaId } from "./cp2-audit-checks.js";

export const CP2_CHECK_STATUSES = ["pass", "partial", "fail", "missing", "not_applicable"] as const;
export type Cp2CheckStatus = (typeof CP2_CHECK_STATUSES)[number];

const EvidenceSchema = z.object({ source: z.string().min(1), quote: z.string().min(1) });
export type Cp2Evidence = z.infer<typeof EvidenceSchema>;

const CheckSchema = z.object({
  id: z.string().min(1),
  status: z.enum(CP2_CHECK_STATUSES),
  evidence: z.array(EvidenceSchema).default([]),
  note: z.string().default(""),
});
export type Cp2Check = z.infer<typeof CheckSchema>;

const ReportShape = z.object({
  schema: z.enum(CP2_SCHEMA_IDS),
  projectName: z.string().default(""),
  checks: z.array(CheckSchema),
  calcChecks: z.array(z.object({}).passthrough()).default([]),
  crossIssues: z
    .array(z.object({ title: z.string(), severity: z.enum(["BLOCKER", "MAJOR", "MINOR"]), evidence: z.array(EvidenceSchema).default([]), action: z.string().default("") }))
    .default([]),
  itemReviews: z.array(z.object({}).passthrough()).default([]),
  boardQuestions: z.array(z.string()).default([]),
  actionPlan: z.array(z.string()).default([]),
  reaudit: z.object({}).passthrough().optional(),
});

const NO_EVIDENCE_NEEDED: readonly Cp2CheckStatus[] = ["missing", "not_applicable"];

/** Structural check plus: exactly the id set of the report's schema; evidence required unless missing/not_applicable. */
export const Cp2ReportSchema = ReportShape.superRefine((report, ctx) => {
  const expected = new Set(Object.keys(CP2_SCHEMAS[report.schema].checks));
  const seen = new Set<string>();
  report.checks.forEach((check, index) => {
    if (!expected.has(check.id)) {
      ctx.addIssue({ code: "custom", path: ["checks", index, "id"], message: "unknown check id" });
    } else if (seen.has(check.id)) {
      ctx.addIssue({ code: "custom", path: ["checks", index, "id"], message: "duplicate check id" });
    }
    seen.add(check.id);
    if (!NO_EVIDENCE_NEEDED.includes(check.status) && check.evidence.length === 0) {
      ctx.addIssue({ code: "custom", path: ["checks", index, "evidence"], message: "evidence required for this status" });
    }
  });
  for (const id of expected) {
    if (!seen.has(id)) ctx.addIssue({ code: "custom", path: ["checks"], message: `missing check id ${id}` });
  }
});

export type Cp2Report = z.infer<typeof Cp2ReportSchema>;

export type Cp2ValidationResult =
  | { ok: true; report: Cp2Report }
  | { ok: false; issues: Array<{ path: string; code: string }> };

/**
 * Validates raw report.json. `allowedSchemas` pins the `schema` values the job may produce
 * (a resubmit job without a usable previous report is allowed to answer `cp2_full_v1`).
 * Issues carry path + code only, never document text, so they are safe to log.
 */
export function validateCp2Report(raw: unknown, allowedSchemas: readonly Cp2SchemaId[]): Cp2ValidationResult {
  const parsed = Cp2ReportSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), code: i.code })) };
  }
  if (!allowedSchemas.includes(parsed.data.schema)) {
    return { ok: false, issues: [{ path: "schema", code: "schema_not_allowed" }] };
  }
  return { ok: true, report: parsed.data };
}
