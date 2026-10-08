"use client";

import React, { useState, useEffect } from "react";
import { Button, Textarea } from "@mantine/core";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { QUESTION_REGISTRY, type Question } from "@repo/validation";

interface GuidedQuestionCardProps {
  questionId: string;
  /** Display number in "phase.question" form, matching the table of contents. */
  questionNumber: string;
  initialValue: string;
  onSave: (questionId: string, value: string) => Promise<void>;
  onNavigatePrev?: () => void;
  onNavigateNext?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  isSaving: boolean;
}

export default function GuidedQuestionCard({
  questionId,
  initialValue,
  onSave,
  onNavigatePrev,
  onNavigateNext,
  hasPrev,
  hasNext,
  isSaving,
  questionNumber,
}: GuidedQuestionCardProps) {
  const [value, setValue] = useState(initialValue);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setValue(initialValue);
    setIsDirty(false);
  }, [initialValue, questionId]);

  const question = (
    QUESTION_REGISTRY as Record<string, Question | undefined>
  )[questionId];

  const handleSave = async () => {
    await onSave(questionId, value);
    setIsDirty(false);
  };

  return (
    <div className="flex-1 min-w-0 w-full bg-surface-app border border-border-app rounded-xl p-4 sm:p-5 md:p-6 flex flex-col gap-5 md:gap-6">
      {/* Header & Question */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">
          Câu {questionNumber}
        </span>
        <h2 className="text-lg md:text-xl font-bold text-text-app">
          {question?.text || questionId}
        </h2>
      </div>

      {/* Explanation & Guidance */}
      {question?.explanation && (
        <blockquote className="m-0 bg-warning-soft border-l-4 border-warning rounded-r-lg px-4 py-3 text-sm text-text-app flex flex-col gap-2">
          <p className="leading-relaxed">{question.explanation}</p>
          {question.suggested_actions && question.suggested_actions.length > 0 && (
            <ul className="list-disc list-inside space-y-1 text-xs pt-1">
              {question.suggested_actions.map((act, i) => (
                <li key={i}>{act}</li>
              ))}
            </ul>
          )}
        </blockquote>
      )}

      {/* Answer Input */}
      <Textarea
        aria-label={`Câu trả lời cho câu ${questionNumber}`}
        placeholder="Nhập câu trả lời của nhóm bạn..."
        minRows={8}
        autosize
        maxRows={16}
        value={value}
        onChange={(e) => {
          setValue(e.currentTarget.value);
          setIsDirty(true);
        }}
        classNames={{
          input: "font-body text-sm leading-relaxed",
        }}
      />

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border-app sm:flex sm:items-center">
        <Button
          variant="default"
          size="sm"
          className="w-full sm:w-auto sm:order-1"
          disabled={!hasPrev}
          onClick={onNavigatePrev}
          leftSection={<ChevronLeft className="w-4 h-4" />}
        >
          Câu trước
        </Button>

        <div className="col-span-2 order-first flex items-center justify-between gap-3 sm:order-2 sm:ml-auto">
          {isDirty && <span className="text-xs text-amber-600 font-medium">Chưa lưu thay đổi</span>}
          <Button
            variant="filled"
            color="blue"
            size="sm"
            className="ml-auto"
            loading={isSaving}
            disabled={!isDirty}
            onClick={handleSave}
            leftSection={<Save className="w-4 h-4" />}
          >
            Lưu câu này
          </Button>
        </div>

        <Button
          variant="default"
          size="sm"
          className="w-full sm:w-auto sm:order-3"
          disabled={!hasNext}
          onClick={onNavigateNext}
          rightSection={<ChevronRight className="w-4 h-4" />}
        >
          Câu tiếp theo
        </Button>
      </div>
    </div>
  );
}
