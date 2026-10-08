"use client";

import { CheckCircle2, Lock, Circle, ChevronRight } from "lucide-react";
import { QUESTION_REGISTRY, type Question, type Template } from "@repo/validation";

interface GuidedTOCProps {
  template: Template;
  answersMap: Record<string, string>;
  activeQuestionId: string;
  onSelectQuestion: (questionId: string) => void;
  isQuestionUnlocked: (phaseIndex: number, questionIndex: number) => boolean;
}

export default function GuidedTOC({
  template,
  answersMap,
  activeQuestionId,
  onSelectQuestion,
  isQuestionUnlocked,
}: GuidedTOCProps) {
  return (
    <div className="w-full md:w-80 shrink-0 bg-surface-app border border-border-app rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-border-app">
        <h3 className="font-semibold text-sm text-text-app">Mục lục tài liệu</h3>
        <span className="text-xs text-text-muted">
          {Object.keys(answersMap).filter((k) => answersMap[k]?.trim().length > 0).length} /{" "}
          {template.phases.reduce((sum, p) => sum + p.questions.length, 0)} câu
        </span>
      </div>

      <div className="flex flex-col gap-4 overflow-y-auto max-h-[600px] pr-1">
        {template.phases.map((phase, pIndex) => (
          <div key={phase.id} className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider px-2">
              Phần {pIndex + 1}: {phase.title}
            </span>

            <div className="flex flex-col gap-1">
              {phase.questions.map((tq, qIndex) => {
                const isUnlocked = isQuestionUnlocked(pIndex, qIndex);
                const hasAnswer = (answersMap[tq.question_id]?.trim().length ?? 0) > 0;
                const isActive = activeQuestionId === tq.question_id;
                const questionMeta = (
                  QUESTION_REGISTRY as Record<string, Question | undefined>
                )[tq.question_id];
                const questionTitle = questionMeta?.text || tq.question_id;

                return (
                  <button
                    key={tq.question_id}
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => onSelectQuestion(tq.question_id)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                      isActive
                        ? "bg-brand text-white font-semibold"
                        : isUnlocked
                          ? "text-text-app hover:bg-surface-soft"
                          : "text-text-disabled cursor-not-allowed opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      {!isUnlocked ? (
                        <Lock className="w-3.5 h-3.5 shrink-0 text-text-muted" />
                      ) : hasAnswer ? (
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? "text-white" : "text-emerald-500"
                          }`}
                        />
                      ) : (
                        <Circle
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? "text-white" : "text-text-muted"
                          }`}
                        />
                      )}
                      <span className="truncate" title={questionTitle}>
                        {pIndex + 1}.{qIndex + 1} {questionTitle}
                      </span>
                    </div>

                    {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
