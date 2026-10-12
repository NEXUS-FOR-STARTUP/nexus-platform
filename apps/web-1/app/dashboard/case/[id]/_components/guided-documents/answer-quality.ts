/** Mirrors the API default `CP2_MIN_AVG_WORDS`; the server remains the authority at grading time. */
export const THIN_ANSWER_WORDS = 10;
const THIN_WARNING_PREFIX = "cp2_";

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Has content but too thin to grade on — the same bar GuidedQuestionCard warns about. */
export function isThinAnswer(questionId: string, raw: string | undefined): boolean {
  if (!questionId.startsWith(THIN_WARNING_PREFIX)) return false;
  const words = countWords(raw ?? "");
  return words > 0 && words < THIN_ANSWER_WORDS;
}
