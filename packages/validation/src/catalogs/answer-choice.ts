import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// Single-choice answers. Stored in `project_answers.answer_text` as JSON so the
// choice survives label edits (value is stable) and free text typed under "Khác"
// can never be confused with an existing option. "" means "no answer".
// ---------------------------------------------------------------------------

export const OTHER_CHOICE_VALUE = "other";
export const MAX_OTHER_TEXT_LENGTH = 500;

export interface ChoiceAnswer {
  value: string;
  otherText: string | null;
}

export type ChoiceCheck = { ok: true; answer: ChoiceAnswer } | { ok: false; reason: string };

export function serializeChoice(answer: ChoiceAnswer): string {
  return JSON.stringify({ value: answer.value, otherText: answer.otherText });
}

/** Strict check used at the API write boundary and by `parseChoice`. */
export function checkChoiceAnswer(raw: string, question: Pick<Question, "options" | "allow_other">): ChoiceCheck {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "Câu trả lời lựa chọn không phải JSON hợp lệ" };
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, reason: "Câu trả lời lựa chọn phải là một đối tượng" };
  }
  const { value, otherText } = data as Record<string, unknown>;
  if (typeof value !== "string") return { ok: false, reason: "Thiếu giá trị lựa chọn" };
  if (otherText !== null && typeof otherText !== "string") {
    return { ok: false, reason: "Nội dung mục Khác không hợp lệ" };
  }

  if (value === OTHER_CHOICE_VALUE) {
    if (!question.allow_other) return { ok: false, reason: "Câu hỏi này không có lựa chọn Khác" };
    const text = (otherText ?? "").trim();
    if (text === "") return { ok: false, reason: "Chọn Khác thì cần nhập nội dung" };
    if (text.length > MAX_OTHER_TEXT_LENGTH) {
      return { ok: false, reason: `Nội dung mục Khác tối đa ${MAX_OTHER_TEXT_LENGTH} ký tự` };
    }
    return { ok: true, answer: { value, otherText: text } };
  }

  if (!(question.options ?? []).some((option) => option.value === value)) {
    return { ok: false, reason: "Lựa chọn không tồn tại" };
  }
  if (otherText !== null) return { ok: false, reason: "Chỉ mục Khác mới có nội dung nhập thêm" };
  return { ok: true, answer: { value, otherText: null } };
}

/** Lenient read: invalid or stale data (e.g. an option removed from the catalog) reads as "not chosen". */
export function parseChoice(raw: string | undefined, question: Pick<Question, "options" | "allow_other">): ChoiceAnswer | null {
  if (!raw || raw.trim() === "") return null;
  const result = checkChoiceAnswer(raw, question);
  return result.ok ? result.answer : null;
}

/** Human-readable text for DOCX export; empty string when nothing valid is chosen. */
export function formatChoice(raw: string | undefined, question: Pick<Question, "options" | "allow_other">): string {
  const answer = parseChoice(raw, question);
  if (!answer) return "";
  if (answer.value === OTHER_CHOICE_VALUE) return answer.otherText ?? "";
  return (question.options ?? []).find((option) => option.value === answer.value)?.label ?? "";
}
