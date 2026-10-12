import { useMemo } from "react";
import { CP2_SELF_CHECKS, computeReadiness, type Cp2SelfCheckId, type Readiness, type Template } from "@repo/validation";
import { useCaseDetails } from "./useCaseDetails";

const CP2_CHECKPOINT_CODE = "CP2";

/**
 * Readiness is computed client-side from answers already loaded by useGuidedAnswers.
 * Attachment source: the case document workspace (same cache as the case page). It is empty
 * until the case has a CP2 checkpoint; superseded files are not distinguishable in that payload.
 */
export function useCp2Readiness(caseId: string, template: Template, answersMap: Record<string, string>): Readiness {
  const { documentWorkspace } = useCaseDetails(caseId);

  const hasCp2Attachment = (documentWorkspace?.checkpoints ?? []).some(
    (cp) => cp.checkpoint_code.toUpperCase() === CP2_CHECKPOINT_CODE && cp.overview.total_files > 0,
  );

  return useMemo(() => {
    const selfChecks: Partial<Record<Cp2SelfCheckId, boolean>> = {};
    for (const { id } of CP2_SELF_CHECKS) selfChecks[id] = answersMap[id] === "true";
    return computeReadiness(template, answersMap, selfChecks, hasCp2Attachment);
  }, [template, answersMap, hasCp2Attachment]);
}
