import type { Question } from "./types.js";
import { CP1_QUESTIONS } from "./questions-cp1.js";
import { CP2_QUESTIONS } from "./questions-cp2.js";
import { CP3_QUESTIONS } from "./questions-cp3.js";

// ---------------------------------------------------------------------------
// Canonical question registry (plan section 5). One entry per stable question
// id. Every template references ids from this map; `validateCatalog` fails if a
// template references an id that is not here. Ids are stable strings, never
// reused or renumbered.
//
// Wording convention: `explanation` renders with line breaks preserved. Order:
// purpose line → what to cover (bullets) → "Không đạt" / "Đạt" example. Keep
// `suggested_actions` as short self-check items that do NOT repeat the
// explanation.
// ---------------------------------------------------------------------------

export const QUESTION_REGISTRY = {
  ...CP1_QUESTIONS,
  ...CP2_QUESTIONS,
  ...CP3_QUESTIONS,
} satisfies Record<string, Question>;

export type QuestionId = keyof typeof QUESTION_REGISTRY;
