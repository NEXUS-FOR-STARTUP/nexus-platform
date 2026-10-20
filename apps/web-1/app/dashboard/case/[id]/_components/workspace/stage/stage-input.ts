import type { StageSummary } from "../../../hooks/useStageSummaries";

/**
 * A stage can be graded on files or on answers, never on nothing. Shared by the audit modal
 * (which blocks "Tiếp tục") and the start guide so both say the same thing.
 * CP2 needs enough substantive answers (`answers_ready_*`); CP1 needs at least one answer.
 */
export function hasStageInput(isCp2: boolean, summary?: StageSummary): boolean {
  if (!summary) return false;
  if (summary.file_count > 0) return true;
  return isCp2 ? summary.answers_ready_full || summary.answers_ready_questionnaire : summary.answered_count > 0;
}
