import { STAGES } from "@app/shared/stages";
import type { StageStatus, StageSummary } from "../../hooks/useStageSummaries";

/**
 * Colour meaning for a journey stage. Colour follows state, never the stage's name,
 * so adding stages needs no new colour (AGENTS.md > DESIGN SYSTEM).
 *  - done:   has a grading result (green)
 *  - attn:   grading in progress (orange)
 *  - next:   the first stage still without a result, the one to work on (navy)
 *  - todo:   not the next one (pale navy)
 */
export type StageState = "done" | "attn" | "next" | "todo";

export const STAGE_STATE_LABEL: Record<StageState, string> = {
  done: "Đã có kết quả",
  attn: "Đang chấm",
  next: "Việc tiếp theo",
  todo: "Chưa bắt đầu",
};

export interface StageStep {
  code: string;
  name: string;
  state: StageState;
}

export function buildStageSteps(summaries: StageSummary[] | undefined): StageStep[] {
  const byCode = new Map(summaries?.map((s) => [s.checkpoint_code, s]));
  const statusOf = (code: string): StageStatus => byCode.get(code as StageSummary["checkpoint_code"])?.status ?? "not_started";
  const nextCode = STAGES.find((st) => !["has_result", "grading"].includes(statusOf(st.code)))?.code;

  return STAGES.map((st) => {
    const status = statusOf(st.code);
    let state: StageState;
    if (status === "has_result") state = "done";
    else if (status === "grading") state = "attn";
    else state = st.code === nextCode ? "next" : "todo";
    return { code: st.code, name: st.name, state };
  });
}
