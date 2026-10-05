import type { Phase, Question, Template } from "@repo/validation/catalogs";
import { cp1, cp2, QUESTION_REGISTRY, CATALOG_VERSION } from "@repo/validation/catalogs";

// ---------------------------------------------------------------------------
// Authoring domain — pure, DB-free catalog logic (plan §5, §6).
//
// Everything here is a deterministic function of (template, answers). It is
// imported by the HTTP layer for read/shape decisions and by the DB-free tests.
// No Prisma, no I/O, no credit ledger. The generation/import queue coordinator
// NEVER imports the credit repository (plan §3 landmine, guard test T9).
// ---------------------------------------------------------------------------

export type AnswerStatus = "draft" | "complete";
export type AnswerAction = "save_draft" | "complete";

/** Per-question UI state for the TOC (clause 2, 5). */
export type QuestionState =
  | "locked"
  | "unanswered"
  | "draft"
  | "complete"
  | "needs_review";

/** The current state of a canonical answer, lifted out of `ProjectAnswer`. */
export interface AnswerState {
  status: AnswerStatus;
  needs_review: boolean;
}

export type AnswerStateMap = Record<string, AnswerState>;

export const TEMPLATES: readonly Template[] = [cp1, cp2];

// The registry is a literal-keyed object (closed union of question ids). Cast to
// a string-indexed view for lookups by arbitrary catalog ids from HTTP params.
const registry = QUESTION_REGISTRY as Record<string, Question | undefined>;

export function getTemplate(templateKey: string): Template | undefined {
  return TEMPLATES.find((t) => t.template_key === templateKey);
}

export function getQuestion(questionId: string): Question | undefined {
  return registry[questionId];
}

export function getPhaseForQuestion(
  template: Template,
  questionId: string,
): Phase | undefined {
  return template.phases.find((p) =>
    p.questions.some((q) => q.question_id === questionId),
  );
}

export function findTemplateForQuestion(questionId: string): Template | undefined {
  return TEMPLATES.find((t) => getPhaseForQuestion(t, questionId));
}

/**
 * Clause 5 — a phase is locked iff any of its `unlock_requires` questions is
 * not complete. Unanswered-but-unlocked questions stay open.
 */
export function isPhaseLocked(phase: Phase, answers: AnswerStateMap): boolean {
  return phase.unlock_requires.some(
    (depId) => answers[depId]?.status !== "complete",
  );
}

/**
 * Clause 2, 5 — per-question state. Locked (phase gate) takes precedence over
 * the answer's own status; `needs_review` (clause 7) is a distinct state.
 */
export function classifyQuestionState(
  template: Template,
  questionId: string,
  answers: AnswerStateMap,
): QuestionState {
  const phase = getPhaseForQuestion(template, questionId);
  if (!phase) return "unanswered";
  if (isPhaseLocked(phase, answers)) return "locked";
  const answer = answers[questionId];
  if (!answer) return "unanswered";
  if (answer.needs_review) return "needs_review";
  return answer.status;
}

export interface TemplateProgress {
  required_done: number;
  required_total: number;
  recommended_done: number;
  recommended_total: number;
  supplemental_done: number;
  supplemental_total: number;
  total_done: number;
  total: number;
}

const EMPTY_PROGRESS: TemplateProgress = {
  required_done: 0,
  required_total: 0,
  recommended_done: 0,
  recommended_total: 0,
  supplemental_done: 0,
  supplemental_total: 0,
  total_done: 0,
  total: 0,
};

/** Clause 1, 4 — required/recommended/supplemental done-vs-total counts. */
export function computeTemplateProgress(
  template: Template,
  answers: AnswerStateMap,
): TemplateProgress {
  const progress: TemplateProgress = { ...EMPTY_PROGRESS };
  for (const phase of template.phases) {
    for (const { question_id, classification } of phase.questions) {
      progress[`${classification}_total`] += 1;
      const answer = answers[question_id];
      if (answer && answer.status === "complete") {
        progress[`${classification}_done`] += 1;
      }
    }
  }
  progress.total_done =
    progress.required_done + progress.recommended_done + progress.supplemental_done;
  progress.total =
    progress.required_total + progress.recommended_total + progress.supplemental_total;
  return progress;
}

export interface GenerationGate {
  ok: boolean;
  missing_required: string[];
  stale_required: string[];
  warnings: string[];
}

/**
 * Clause 8 — generation runs only after all `required` questions are complete
 * AND no required question carries a `needs_review` flag. Optional (recommended
 * / supplemental) omissions produce warnings only, never a block.
 */
export function checkGenerationGate(
  template: Template,
  answers: AnswerStateMap,
): GenerationGate {
  const missing_required: string[] = [];
  const stale_required: string[] = [];
  const warnings: string[] = [];
  for (const phase of template.phases) {
    for (const { question_id, classification } of phase.questions) {
      const answer = answers[question_id];
      const complete = answer?.status === "complete";
      const stale = answer?.needs_review === true;
      if (classification === "required") {
        if (stale) stale_required.push(question_id);
        else if (!complete) missing_required.push(question_id);
      } else if (!complete) {
        warnings.push(question_id);
      }
    }
  }
  return {
    ok: missing_required.length === 0 && stale_required.length === 0,
    missing_required,
    stale_required,
    warnings,
  };
}

export type AnswerTransition = "create" | "draft_save" | "complete" | "reopen";

/**
 * Clause 6 — save_draft/complete state machine. Draft is in-progress; complete
 * is user-declared; reopening (save_draft on a complete answer) reverts to draft.
 */
export function resolveAnswerTransition(
  action: AnswerAction,
  currentStatus: AnswerStatus | undefined,
): { status: AnswerStatus; transition: AnswerTransition } {
  if (action === "complete") {
    return { status: "complete", transition: "complete" };
  }
  if (currentStatus === "complete") {
    return { status: "draft", transition: "reopen" };
  }
  if (currentStatus === "draft") {
    return { status: "draft", transition: "draft_save" };
  }
  return { status: "draft", transition: "create" };
}

/**
 * Clause 7 — completed-answer edits invalidate downstream relevance through the
 * configured dependency graph (`unlock_requires` edges, transitively). Returns
 * the downstream question ids (excluding the edited question itself) that must
 * be flagged `needs_review`.
 */
export function computeDownstreamQuestionIds(
  template: Template,
  editedQuestionId: string,
): string[] {
  const phaseByQuestion = new Map<string, Phase>();
  for (const phase of template.phases) {
    for (const q of phase.questions) phaseByQuestion.set(q.question_id, phase);
  }

  const result = new Set<string>();
  const visited = new Set<string>();
  const queue: Phase[] = template.phases.filter((p) =>
    p.unlock_requires.includes(editedQuestionId),
  );

  while (queue.length > 0) {
    const phase = queue.shift()!;
    if (visited.has(phase.id)) continue;
    visited.add(phase.id);

    for (const q of phase.questions) {
      if (q.question_id !== editedQuestionId) result.add(q.question_id);
    }

    for (const other of template.phases) {
      if (visited.has(other.id) || queue.some((p) => p.id === other.id)) continue;
      const depends = other.unlock_requires.some((depId) =>
        phase.questions.some((q) => q.question_id === depId),
      );
      if (depends) queue.push(other);
    }
  }

  return [...result];
}

/**
 * Clause 14 — durable idempotency key for generation. Same answer-revision
 * snapshot → same key (returns the existing job); changed snapshot → new key
 * (new immutable version).
 */
export function buildGenerateIdempotencyKey(
  caseId: string,
  templateKey: string,
  snapshot: Record<string, number>,
): string {
  const serialized = Object.keys(snapshot)
    .sort()
    .map((questionId) => `${questionId}:${snapshot[questionId]}`)
    .join(",");
  return `authoring-generate:${caseId}:${templateKey}:${serialized}`;
}

export interface ProposedItem {
  question_id: string;
  proposed_text: string;
  source_pointer: string;
}

export interface ImportAcceptPlan {
  applied: ProposedItem[];
  conflicts: string[];
  skipped: string[];
}

/**
 * Clause 13 — review-before-accept. Acceptance writes draft-only answers and
 * never silently overwrites an existing answer: a question with a current
 * answer is surfaced as a conflict (side-by-side diff), not applied.
 */
export function planImportAccept(
  proposedItems: ProposedItem[],
  acceptIds: string[],
  existingAnswers: AnswerStateMap,
): ImportAcceptPlan {
  const applied: ProposedItem[] = [];
  const conflicts: string[] = [];
  const skipped: string[] = [];
  for (const questionId of acceptIds) {
    const item = proposedItems.find((p) => p.question_id === questionId);
    if (!item) {
      skipped.push(questionId);
      continue;
    }
    if (existingAnswers[questionId]) {
      conflicts.push(questionId);
      continue;
    }
    applied.push(item);
  }
  return { applied, conflicts, skipped };
}

export { CATALOG_VERSION };
