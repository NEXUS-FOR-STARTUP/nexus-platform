"use client";

import { CP2_SELF_CHECKS, type Cp2SelfCheckId } from "@repo/validation";
import s from "./guided-editor.module.css";

/** Rubric pass conditions the paid CP2 audit reads, keyed by the question that evidences each one. */
export const CP2_SELF_CHECK_BY_QUESTION: Readonly<Record<string, Cp2SelfCheckId>> = {
  cp2_expert_interviews: "cp2_selfcheck_interviews",
};

interface Cp2SelfCheckProps {
  questionId: string;
  answersMap: Record<string, string>;
  isSaving: boolean;
  onSaveAnswers: (answers: Array<{ question_id: string; answer_text: string }>) => Promise<unknown>;
}

export default function Cp2SelfCheck({ questionId, answersMap, isSaving, onSaveAnswers }: Cp2SelfCheckProps) {
  const checkId = CP2_SELF_CHECK_BY_QUESTION[questionId];
  const check = CP2_SELF_CHECKS.find((c) => c.id === checkId);
  if (!check) return null;

  return (
    <div className={s.selfCheck}>
      <label>
        <input
          type="checkbox"
          checked={answersMap[check.id] === "true"}
          disabled={isSaving}
          onChange={(e) => onSaveAnswers([{ question_id: check.id, answer_text: String(e.currentTarget.checked) }])}
        />
        <span>{check.label}</span>
      </label>
      <p className={s.selfCheckNote}>
        Mục quan trọng khi chấm. Nhóm tự xác nhận, AI chấm sẽ đọc xác nhận này.
      </p>
    </div>
  );
}
