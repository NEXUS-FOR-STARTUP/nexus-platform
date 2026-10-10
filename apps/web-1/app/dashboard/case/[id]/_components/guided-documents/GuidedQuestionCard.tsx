"use client";

import React from "react";
import { Button, Textarea } from "@mantine/core";
import { Save } from "lucide-react";
import { QUESTION_REGISTRY, type Question } from "@repo/validation";

interface GuidedQuestionCardProps {
  questionId: string;
  /** Display number in "phase.question" form, matching the table of contents. */
  questionNumber: string;
  value: string;
  isDirty: boolean;
  onChange: (value: string) => void;
  onSave: (questionId: string, value: string) => Promise<void>;
  isSaving: boolean;
}

export default function GuidedQuestionCard({
  questionId,
  value,
  isDirty,
  onChange,
  onSave,
  isSaving,
  questionNumber,
}: GuidedQuestionCardProps) {
  const question = (
    QUESTION_REGISTRY as Record<string, Question | undefined>
  )[questionId];

  const handleSave = async () => {
    await onSave(questionId, value);
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
          <p className="leading-relaxed whitespace-pre-line">{question.explanation}</p>
          {question.suggested_actions && question.suggested_actions.length > 0 && (
            <div className="flex flex-col gap-1 pt-1">
              <p className="text-xs font-semibold">Tự kiểm tra trước khi lưu:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                {question.suggested_actions.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>
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
        onChange={(e) => onChange(e.currentTarget.value)}
        classNames={{
          input: "font-body text-sm leading-relaxed",
        }}
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-app">
        {isDirty && <span className="text-xs text-amber-600 font-medium">Chưa lưu thay đổi</span>}
        <Button
          variant="filled"
          color="blue"
          size="sm"
          loading={isSaving}
          disabled={!isDirty}
          onClick={handleSave}
          leftSection={<Save className="w-4 h-4" />}
        >
          Lưu câu này
        </Button>
      </div>
    </div>
  );
}
