import { CLASSIFICATIONS, type Question, type Template } from "./types.js";
import { QUESTION_REGISTRY } from "./questions.js";

// Typed index access: QUESTION_REGISTRY is a literal-keyed object (so question ids
// stay a closed union), cast here to a string-indexed view for lookups by arbitrary ids.
const registry = QUESTION_REGISTRY as Record<string, Question | undefined>;

// ---------------------------------------------------------------------------
// validateCatalog — fail-fast guard run at module load (index.ts) and in tests.
// Rejects:
//   1. any question_id (in questions[] or unlock_requires) missing from the registry
//   2. any classification outside required | recommended | supplemental
//   3. any dependency cycle across phase unlock_requires edges
// Also rejects duplicate question placement and cross-template dependencies.
// ---------------------------------------------------------------------------

export function validateCatalog(template: Template): void {
  // Map each question_id in this template to the phase that owns it.
  const phaseByQuestion = new Map<string, string>();

  for (const phase of template.phases) {
    for (const { question_id, classification } of phase.questions) {
      if (!registry[question_id]) {
        throw new Error(
          `validateCatalog: question_id "${question_id}" (phase "${phase.id}") is not present in the question registry`,
        );
      }
      if (!CLASSIFICATIONS.includes(classification)) {
        throw new Error(
          `validateCatalog: invalid classification "${classification}" on question_id "${question_id}" (phase "${phase.id}")`,
        );
      }
      if (phaseByQuestion.has(question_id)) {
        throw new Error(
          `validateCatalog: question_id "${question_id}" appears in multiple phases`,
        );
      }
      phaseByQuestion.set(question_id, phase.id);
    }
  }

  // Build the phase dependency graph, then detect cycles.
  const adjacency = new Map<string, string[]>();
  for (const phase of template.phases) {
    adjacency.set(phase.id, []);
  }

  for (const phase of template.phases) {
    for (const depQuestionId of phase.unlock_requires) {
      if (!registry[depQuestionId]) {
        throw new Error(
          `validateCatalog: unlock_requires references question_id "${depQuestionId}" (phase "${phase.id}") not present in the question registry`,
        );
      }
      const depPhaseId = phaseByQuestion.get(depQuestionId);
      if (depPhaseId === undefined) {
        throw new Error(
          `validateCatalog: unlock_requires references question_id "${depQuestionId}" (phase "${phase.id}") that is not part of this template`,
        );
      }
      adjacency.get(phase.id)!.push(depPhaseId);
    }
  }

  assertNoDependencyCycles(adjacency);
}

function assertNoDependencyCycles(adjacency: Map<string, string[]>): void {
  const state = new Map<string, "visiting" | "visited">();

  const visit = (phaseId: string, path: string[]): void => {
    const current = state.get(phaseId);
    if (current === "visited") return;
    if (current === "visiting") {
      throw new Error(
        `validateCatalog: dependency cycle detected: ${[...path, phaseId].join(" -> ")}`,
      );
    }
    state.set(phaseId, "visiting");
    for (const dep of adjacency.get(phaseId) ?? []) {
      visit(dep, [...path, phaseId]);
    }
    state.set(phaseId, "visited");
  };

  for (const phaseId of adjacency.keys()) {
    visit(phaseId, []);
  }
}
