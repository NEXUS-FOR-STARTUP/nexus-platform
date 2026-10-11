import { CP2_SCHEMAS, CP2_VERDICTS, type Cp2SchemaId } from "./cp2-audit-checks.js";
import type { Cp2Check, Cp2CheckStatus } from "./cp2-audit-report-schema.js";

export const CP2_SCORE_READY_MIN = 75;
export const CP2_SCORE_NEEDS_WORK_MIN = 50;
/** Highest overall score allowed when a gate failed (stays below the "needs work" band). */
export const CP2_GATE_FAIL_CAP = CP2_SCORE_NEEDS_WORK_MIN - 1;
/** Highest overall score allowed when a gate is unclear or a core criterion failed. */
export const CP2_CORE_ISSUE_CAP = CP2_SCORE_READY_MIN - 1;
const STRICT_TIER_WEIGHT = 2;
const NORMAL_TIER_WEIGHT = 1;
const PERCENT = 100;
const CHECK_SCORE: Record<Exclude<Cp2CheckStatus, "not_applicable">, number> = {
  pass: 1,
  partial: 0.5,
  fail: 0,
  missing: 0,
};

export interface Cp2Score {
  categoryScores: Record<string, number>;
  overallScore: number;
  verdict: string;
}

/**
 * Pure. AI decides each criterion; this computes group scores, the overall score and the verdict.
 * `not_applicable` leaves the denominator; a group with no scored criterion is omitted and the
 * remaining group weights are renormalised. The verdict is the band of the capped overall score,
 * so the number shown and the label never disagree.
 */
export function scoreCp2Report(schema: Cp2SchemaId, checks: readonly Pick<Cp2Check, "id" | "status">[]): Cp2Score {
  const def = CP2_SCHEMAS[schema];
  const groups = new Map<string, { weighted: number; weight: number }>();
  let gateFailed = false;
  let capped74 = false;

  for (const check of checks) {
    const meta = def.checks[check.id];
    if (!meta || check.status === "not_applicable") continue;
    const weight = meta.tier === "normal" ? NORMAL_TIER_WEIGHT : STRICT_TIER_WEIGHT;
    const group = groups.get(meta.group) ?? { weighted: 0, weight: 0 };
    group.weighted += weight * CHECK_SCORE[check.status];
    group.weight += weight;
    groups.set(meta.group, group);

    const bad = check.status === "fail" || check.status === "missing";
    if (meta.tier === "gate") {
      if (bad) gateFailed = true;
      else if (check.status === "partial") capped74 = true;
    } else if (meta.tier === "core" && bad) {
      capped74 = true;
    }
  }

  const categoryScores: Record<string, number> = {};
  let weightedSum = 0;
  let weightSum = 0;
  for (const [name, { weighted, weight }] of groups) {
    const score = Math.round((PERCENT * weighted) / weight);
    categoryScores[name] = score;
    const groupWeight = def.weights[name] ?? 0;
    weightedSum += groupWeight * score;
    weightSum += groupWeight;
  }

  let overallScore = weightSum === 0 ? 0 : Math.round(weightedSum / weightSum);
  if (gateFailed) overallScore = Math.min(overallScore, CP2_GATE_FAIL_CAP);
  else if (capped74) overallScore = Math.min(overallScore, CP2_CORE_ISSUE_CAP);

  const labels = CP2_VERDICTS[def.kind];
  const verdict =
    overallScore >= CP2_SCORE_READY_MIN ? labels.ready : overallScore >= CP2_SCORE_NEEDS_WORK_MIN ? labels.needs_work : labels.blocked;
  return { categoryScores, overallScore, verdict };
}
