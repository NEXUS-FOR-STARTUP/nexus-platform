"use client";

import { useState } from "react";
import { Collapse, UnstyledButton } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { CaretDown as ChevronDown } from "@phosphor-icons/react";
import { QUESTION_REGISTRY, type Question, type Template } from "@repo/validation";
import { GUIDED_MOBILE_QUERY } from "../../hooks/useGuidedNavigation";
import { isThinAnswer } from "./answer-quality";
import TocQuestionRow, { type TocQuestionState } from "./TocQuestionRow";
import editor from "./guided-editor.module.css";
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

export default function GuidedTOC({
  template,
  answersMap,
  activeQuestionId,
  onSelectQuestion,
  isQuestionUnlocked,
  criticalQuestionIds,
}: GuidedTOCProps) {
  const questionIds = template.phases.flatMap((p) => p.questions.map((q) => q.question_id));
  const answeredCount = questionIds.filter((id) => answersMap[id]?.trim()).length;
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
    return answersMap[questionId]?.trim() ? "answered" : "empty";
  };

  return (
    <div className={editor.panel}>
      <UnstyledButton
        className={editor.foldHead}
        onClick={() => setOpenedOverride(!opened)}
        aria-expanded={opened}
      >
        <span className={editor.foldTitle}>
          <ChevronDown size={16} className={`${editor.chevron} ${opened ? "" : editor.chevronClosed}`} aria-hidden />
          Mục lục
        </span>
        <span className={editor.foldNote}>
          {answeredCount}/{questionIds.length} câu
        </span>
      </UnstyledButton>

      <Collapse expanded={opened}>
        <div className={s.list}>
          {template.phases.map((phase, pIndex) => (
            <div key={phase.id} className={s.group}>
              <span className={s.groupTitle}>
                Phần {pIndex + 1}: {phase.title}
              </span>
              {phase.questions.map((tq, qIndex) => {
                const meta = (QUESTION_REGISTRY as Record<string, Question | undefined>)[tq.question_id];
                return (
                  <TocQuestionRow
                    key={tq.question_id}
                    number={`${pIndex + 1}.${qIndex + 1}`}
                    title={meta?.text || tq.question_id}
                    state={stateOf(tq.question_id, pIndex, qIndex)}
                    important={criticalQuestionIds?.includes(tq.question_id) ?? false}
                    selected={activeQuestionId === tq.question_id}
                    onSelect={() => handleSelect(tq.question_id)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </Collapse>
    </div>
  );
}
