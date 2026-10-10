import { useCaseDetails } from "./useCaseDetails";
import { useTriggerAudit } from "./useTriggerAudit";

type Cp2Scope = "questionnaire" | "full";

/** CP2 audit actions + the state the readiness panel needs (credits left, prior full report). */
export function useCp2Audit(caseId: string) {
  const { creditBalances, roundHistory, caseData } = useCaseDetails(caseId);
  const { triggerAudit, isTriggering } = useTriggerAudit(caseId);

  const hasFullReport = (roundHistory ?? []).some(
    (round) => round.report?.report_type === "cp2_full" || round.report?.report_type === "cp2_full_resubmit",
  );

  const run = (scope: Cp2Scope, resubmit: boolean) =>
    triggerAudit({ checkpoint: "CP2", scope, submission_type: resubmit ? "resubmit" : "initial" });

  return {
    creditsLeft: creditBalances.cp2_audit ?? 0,
    hasFullReport,
    isBusy: isTriggering || caseData?.user_facing_stage === "under_review",
    auditQuestionnaire: () => run("questionnaire", false),
    auditFull: () => run("full", false),
    resubmitFull: () => run("full", true),
  };
}
