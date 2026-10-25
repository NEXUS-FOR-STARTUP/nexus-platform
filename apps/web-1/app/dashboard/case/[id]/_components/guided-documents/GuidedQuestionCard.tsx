"use client";

import type { ReactNode, Ref } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { QUESTION_REGISTRY, type Classification, type Question } from "@repo/validation";
import type { SaveState } from "../../hooks/useGuidedDrafts";
import { Button } from "../ui/Button";
import { countWords, isThinAnswer, THIN_ANSWER_WORDS } from "./answer-quality";
import s from "./guided-editor.module.css";

const CLASSIFICATION_LABEL: Record<Classification, string> = {
  required: "Bắt buộc",
  recommended: "Nên có",
  supplemental: "Tuỳ chọn",
};

interface GuidedQuestionCardProps {
  questionId: string;
  /** 1-based position of the question across the whole template. */
  questionPosition: number;
  questionTotal: number;
  classification: Classification;
  value: string;
  isDirty: boolean;
  /** True when the draft is saved automatically (edited in this visit). */
  autoSave: boolean;
  saveState: SaveState;
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
  autoSave,
  saveState,
  onChange,
  onSave,
  isSaving,
  questionPosition,
  questionTotal,
  classification,
  headingRef,
  onPrev,
  onNext,
  children,
}: GuidedQuestionCardProps) {
  const question = (QUESTION_REGISTRY as Record<string, Question | undefined>)[questionId];
  const wordCount = countWords(value);
  const savedLabel =
    saveState === "error" && isDirty
      ? "Chưa lưu được, đang chờ kết nối để thử lại"
      : isDirty
        ? saveState === "saving"
          ? "Đang lưu…"
          : autoSave
            ? "Chưa lưu, sẽ tự lưu sau khi bạn ngừng gõ"
            : "Chưa lưu"
        : value.trim()
          ? "Đã lưu"
          : "Chưa có câu trả lời";

  return (
    <section className={s.q}>
      <h2 ref={headingRef} tabIndex={-1} className={s.heading}>
        {question?.text || questionId}
      </h2>
      <p className={s.meta}>
        Câu {questionPosition} trên {questionTotal} · {CLASSIFICATION_LABEL[classification]}
      </p>

      <textarea
        className={s.answer}
        aria-label="Câu trả lời"
        placeholder="Nhập câu trả lời của nhóm"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
      />

      {isThinAnswer(questionId, value) && (
        <p role="status" className={s.warn}>
          Câu trả lời còn ngắn ({wordCount}/{THIN_ANSWER_WORDS} từ). Viết thêm để AI có đủ căn cứ chấm.
        </p>
      )}
      {children}

      <div className={s.foot}>
        <span aria-live="polite" className={s.status}>
          {savedLabel}
        </span>
        <div className={s.footBtns}>
          <Button variant="quiet" disabled={!onPrev} onClick={onPrev} leftSection={<CaretLeftIcon size={16} aria-hidden />}>
            Câu trước
          </Button>
          <Button loading={isSaving} disabled={!isDirty} onClick={() => onSave(questionId, value)}>
            Lưu
          </Button>
          <Button
            variant="quiet"
            className={s.next}
            disabled={!onNext}
            onClick={onNext}
            rightSection={<CaretRightIcon size={16} aria-hidden />}
          >
            Câu tiếp
          </Button>
        </div>
      </div>
    </section>
  );
}
