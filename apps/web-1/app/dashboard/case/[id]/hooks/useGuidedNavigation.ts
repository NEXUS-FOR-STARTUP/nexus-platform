import { useMemo, useState } from "react";
import type { Classification, Template } from "@repo/validation";

/** Phones fold the table of contents and hints; kept in sync with guided-editor.module.css. */
export const GUIDED_MOBILE_QUERY = "(max-width: 767px)";

export interface FlatQuestion {
  question_id: string;
  classification: Classification;
  phaseIndex: number;
  questionIndex: number;
}

/** Active-question state plus previous/next neighbours; a locked neighbour is undefined. */
export function useGuidedNavigation(
  template: Template,
  isQuestionUnlocked: (phaseIndex: number, questionIndex: number) => boolean
) {
  const flat = useMemo<FlatQuestion[]>(
    () =>
      template.phases.flatMap((p, phaseIndex) =>
        p.questions.map((q, questionIndex) => ({
          question_id: q.question_id,
          classification: q.classification,
          phaseIndex,
          questionIndex,
        }))
      ),
    [template]
  );
  const [activeId, select] = useState<string>(flat[0]?.question_id ?? "");

  const index = Math.max(0, flat.findIndex((q) => q.question_id === activeId));
  const open = (item: FlatQuestion | undefined) =>
    item && isQuestionUnlocked(item.phaseIndex, item.questionIndex) ? item : undefined;

  return {
    flat,
    current: flat[index],
    prev: open(flat[index - 1]),
    next: open(flat[index + 1]),
    select,
  };
}
