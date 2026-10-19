"use client";

import { useState } from "react";
import { useMediaQuery } from "@mantine/hooks";
import { CaretDownIcon } from "@phosphor-icons/react";
import { QUESTION_REGISTRY, type Question, type Template } from "@repo/validation";
import { GUIDED_MOBILE_QUERY } from "../../hooks/useGuidedNavigation";
import { isThinAnswer } from "./answer-quality";
import TocQuestionRow, { type TocQuestionState } from "./TocQuestionRow";
import s from "./guided-toc.module.css";

interface GuidedTOCProps {
  template: Template;
  answersMap: Record<string, string>;
  activeQuestionId: string;
  onSelectQuestion: (questionId: string) => void;
  isQuestionUnlocked: (phaseIndex: number, questionIndex: number) => boolean;
  /** Questions whose absence can fail the rubric outright; flagged in the list. */
  criticalQuestionIds?: readonly string[];
}

const titleOf = (id: string) => (QUESTION_REGISTRY as Record<string, Question | undefined>)[id]?.text || id;

export default function GuidedTOC({
  template,
  answersMap,
  activeQuestionId,
  onSelectQuestion,
  isQuestionUnlocked,
  criticalQuestionIds,
}: GuidedTOCProps) {
  const questionIds = template.phases.flatMap((p) => p.questions.map((q) => q.question_id));
  const isAnswered = (id: string) => Boolean(answersMap[id]?.trim());
  const answeredCount = questionIds.filter(isAnswered).length;
  const activeIndex = Math.max(0, questionIds.indexOf(activeQuestionId));
  const isMobile = useMediaQuery(GUIDED_MOBILE_QUERY);
  // null = follow the viewport default (open on desktop, collapsed on phones); boolean = user's choice.
  const [openedOverride, setOpenedOverride] = useState<boolean | null>(null);
  const opened = openedOverride ?? !isMobile;

  const handleSelect = (questionId: string) => {
    onSelectQuestion(questionId);
    if (isMobile) setOpenedOverride(false);
  };

  const stateOf = (questionId: string, phaseIndex: number, questionIndex: number): TocQuestionState => {
    if (!isQuestionUnlocked(phaseIndex, questionIndex)) return "locked";
    if (isThinAnswer(questionId, answersMap[questionId])) return "thin";
    return isAnswered(questionId) ? "answered" : "empty";
  };

  return (
    <div className={s.toc}>
      <button
        type="button"
        className={`${s.fold} ${opened ? s.foldOpen : ""}`}
        onClick={() => setOpenedOverride(!opened)}
        aria-expanded={opened}
      >
        <span className={s.foldTitle}>
          Câu {activeIndex + 1} trên {questionIds.length}
          <span className={s.note}> · {titleOf(activeQuestionId)}</span>
        </span>
        <span className={s.note}>{answeredCount} đã trả lời</span>
        <CaretDownIcon size={16} className={s.chevron} aria-hidden />
      </button>

      {opened && (
        <div className={s.list}>
          {template.phases.map((phase, pIndex) => (
            <div key={phase.id}>
              <div className={s.group}>
                {phase.title}
                <span>
                  {phase.questions.filter((q) => isAnswered(q.question_id)).length}/{phase.questions.length}
                </span>
              </div>
              {phase.questions.map((tq, qIndex) => (
                <TocQuestionRow
                  key={tq.question_id}
                  title={titleOf(tq.question_id)}
                  state={stateOf(tq.question_id, pIndex, qIndex)}
                  important={criticalQuestionIds?.includes(tq.question_id) ?? false}
                  selected={activeQuestionId === tq.question_id}
                  onSelect={() => handleSelect(tq.question_id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
