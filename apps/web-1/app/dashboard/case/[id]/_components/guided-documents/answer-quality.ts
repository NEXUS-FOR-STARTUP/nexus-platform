/** Mirrors the API defaults `CP2_MIN_AVG_WORDS` / `CP3_MIN_AVG_WORDS`; the server remains the authority at grading time. */
export const THIN_ANSWER_WORDS = 10;
const THIN_WARNING_PREFIXES = ["cp2_", "cp3_"];

/** True for answers the audit reads: every CP2 and CP3 template question. */
export function isGradedQuestion(questionId: string): boolean {
  return THIN_WARNING_PREFIXES.some((prefix) => questionId.startsWith(prefix));
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Has content but too thin to grade on - the same bar GuidedQuestionCard warns about. */
export function isThinAnswer(questionId: string, raw: string | undefined): boolean {
  if (!isGradedQuestion(questionId)) return false;
  const words = countWords(raw ?? "");
  return words > 0 && words < THIN_ANSWER_WORDS;
}
