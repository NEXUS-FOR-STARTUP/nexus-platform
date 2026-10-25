import { OTHER_CHOICE_VALUE, parseChoice, serializeChoice, type Question } from "@repo/validation";

export interface ChoiceInputState {
  /** Selected radio value. Can be "other" while the stored answer is still "" (empty Khác field). */
  pick: string | null;
  otherText: string;
}

type ChoiceQuestion = Pick<Question, "options" | "allow_other">;

export function choiceStateFromValue(value: string, question: ChoiceQuestion): ChoiceInputState {
  const stored = parseChoice(value, question);
  return { pick: stored?.value ?? null, otherText: stored?.otherText ?? "" };
}

/** Answer string for a pick; an unfinished "Khác" (empty text) is "" so it is never stored. */
export function choiceValueFor(pick: string | null, otherText: string): string {
  if (pick === null) return "";
  if (pick !== OTHER_CHOICE_VALUE) return serializeChoice({ value: pick, otherText: null });
  const text = otherText.trim();
  return text === "" ? "" : serializeChoice({ value: pick, otherText: text });
}

/**
 * Keeps local state when `value` is just our own last emission (preserves an empty "Khác" pick);
 * rebuilds from `value` when it changed from outside (late-loaded answer, discarded recovered draft).
 */
export function reconcileChoiceState(
  current: ChoiceInputState,
  value: string,
  lastEmitted: string,
  question: ChoiceQuestion,
): ChoiceInputState {
  return value === lastEmitted ? current : choiceStateFromValue(value, question);
}
