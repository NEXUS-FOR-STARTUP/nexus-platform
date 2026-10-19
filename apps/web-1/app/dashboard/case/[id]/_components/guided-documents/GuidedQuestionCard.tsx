"use client";

import type { ReactNode, Ref } from "react";
import { Button, Textarea } from "@mantine/core";
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight } from "@phosphor-icons/react";
import { QUESTION_REGISTRY, type Classification, type Question } from "@repo/validation";
import { countWords, isThinAnswer, THIN_ANSWER_WORDS } from "./answer-quality";
import s from "./guided-editor.module.css";

const CLASSIFICATION_LABEL: Record<Classification, string> = {
  required: "Bắt buộc",
  recommended: "Nên có",
  supplemental: "Tuỳ chọn",
};

interface GuidedQuestionCardProps {
  questionId: string;
  /** Display number in "phase.question" form, matching the table of contents. */
  questionNumber: string;
  classification: Classification;
  value: string;
  isDirty: boolean;
  onChange: (value: string) => void;
  onSave: (questionId: string, value: string) => Promise<void>;
  isSaving: boolean;
  /** Moves focus here after a phone user picks a question from the folded list. */
  headingRef: Ref<HTMLHeadingElement>;
  /** Undefined when there is no unlocked neighbour in that direction. */
  onPrev?: () => void;
  onNext?: () => void;
  /** Extra content rendered between the answer box and the footer. */
  children?: ReactNode;
}

export default function GuidedQuestionCard({
  questionId,
  value,
  isDirty,
  onChange,
  onSave,
  isSaving,
  questionNumber,
  classification,
  headingRef,
  onPrev,
  onNext,
  children,
}: GuidedQuestionCardProps) {
  const question = (QUESTION_REGISTRY as Record<string, Question | undefined>)[questionId];
  const wordCount = countWords(value);
  const savedLabel = isDirty ? "Chưa lưu" : value.trim() ? "Đã lưu" : "Chưa có câu trả lời";

  return (
    <div className={s.panel}>
      <div>
        <h2 ref={headingRef} tabIndex={-1} className={s.heading}>
          {question?.text || questionId}
        </h2>
        <p className={s.meta}>
          <span>Câu {questionNumber}</span>
          <span>{CLASSIFICATION_LABEL[classification]}</span>
        </p>
      </div>

      <Textarea
        aria-label={`Câu trả lời cho câu ${questionNumber}`}
        placeholder="Nhập câu trả lời của nhóm bạn..."
        minRows={8}
        autosize
        maxRows={16}
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        classNames={{ input: `font-body ${s.answer}` }}
      />

      {isThinAnswer(questionId, value) && (
        <p role="status" className={s.warn}>
          Câu trả lời còn ngắn ({wordCount}/{THIN_ANSWER_WORDS} từ). Viết thêm để AI có đủ căn cứ chấm.
        </p>
      )}
      {children}

      <div className={s.foot}>
        <p aria-live="polite" className={s.status}>
          {savedLabel}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="subtle"
            size="sm"
            disabled={!onPrev}
            onClick={onPrev}
            leftSection={<ChevronLeft size={16} aria-hidden />}
          >
            Câu trước
          </Button>
          <Button size="sm" loading={isSaving} disabled={!isDirty} onClick={() => onSave(questionId, value)}>
            Lưu
          </Button>
          <Button
            variant="subtle"
            size="sm"
            disabled={!onNext}
            onClick={onNext}
            rightSection={<ChevronRight size={16} aria-hidden />}
          >
            Câu tiếp
          </Button>
        </div>
      </div>
    </div>
  );
}
