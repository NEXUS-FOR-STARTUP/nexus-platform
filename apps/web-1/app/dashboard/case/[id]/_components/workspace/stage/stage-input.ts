import { getAuditStageUi } from "@/lib/audit-stage-ui";
import type { StageSummary } from "../../../hooks/useStageSummaries";

/**
 * A stage can be graded on files or on answers, never on nothing. Shared by the audit modal
 * (which blocks "Tiếp tục") and the start guide so both say the same thing.
 * Source-based stages need enough substantive answers (`answers_ready_*`, the questionnaire bar only where
 * the stage has that scope); CP1 needs at least one answer.
 */
export function hasStageInput(stageCode: string, summary?: StageSummary): boolean {
  if (!summary) return false;
  if (summary.file_count > 0) return true;
  const ui = getAuditStageUi(stageCode);
  if (!ui?.sourceBased) return summary.answered_count > 0;
  return summary.answers_ready_full || (ui.scopes.includes("questionnaire") && summary.answers_ready_questionnaire);
}
