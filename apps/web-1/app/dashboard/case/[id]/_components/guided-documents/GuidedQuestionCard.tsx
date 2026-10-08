"use client";

import React, { useState, useEffect } from "react";
import { Button, Textarea } from "@mantine/core";
import { Lightbulb, Check, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { QUESTION_REGISTRY, type Question } from "@repo/validation";

interface GuidedQuestionCardProps {
  questionId: string;
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

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="flex-1 bg-surface-app border border-border-app rounded-xl p-5 md:p-6 flex flex-col gap-6">
      {/* Header & Question */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand">
          Mã câu hỏi: {questionId}
        </span>
        <h2 className="text-lg md:text-xl font-bold text-text-app">
          {question?.text || questionId}
        </h2>
      </div>

      {/* Explanation & Guidance */}
      {question?.explanation && (
        <div className="bg-surface-soft border border-border-app/60 rounded-xl p-4 flex gap-3 text-sm text-text-muted">
          <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-2">
            <p className="leading-relaxed">{question.explanation}</p>
            {question.suggested_actions && question.suggested_actions.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-xs text-text-app pt-1">
                {question.suggested_actions.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Answer Input */}
      <div className="flex flex-col gap-2">
        <Textarea
          label="Nội dung trả lời của nhóm bạn"
          placeholder="Nhập chi tiết nội dung trả lời tại đây..."
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

        <div className="flex items-center justify-between text-xs text-text-muted pt-1">
          <span>
            {wordCount} từ ({value.length} ký tự)
          </span>
          {isDirty && (
            <span className="text-amber-600 font-medium">Chưa lưu thay đổi</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border-app">
        <Button
          variant="default"
          size="sm"
          disabled={!hasPrev}
          onClick={onNavigatePrev}
          leftSection={<ChevronLeft className="w-4 h-4" />}
        >
          Câu trước
        </Button>

        <div className="flex items-center gap-2">
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

          <Button
            variant="default"
            size="sm"
            disabled={!hasNext}
            onClick={onNavigateNext}
            rightSection={<ChevronRight className="w-4 h-4" />}
          >
            Câu tiếp theo
          </Button>
        </div>
      </div>
    </div>
  );
}
