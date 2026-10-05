import { cp1 } from "./cp1.js";
import { cp2 } from "./cp2.js";
import { validateCatalog } from "./validate-catalog.js";

export * from "./types.js";
export { QUESTION_REGISTRY } from "./questions.js";
export type { QuestionId } from "./questions.js";
export { cp1, cp2, validateCatalog };

// Single monotonic string stamped on every ProjectAnswer write, AnswerRevision,
// and AuthoringJob (plan section 5). Bump on any catalog content change.
export const CATALOG_VERSION = "2026-10-05.1";

// Fail fast at module load — a catalog bug must surface in CI/tests, not at runtime.
validateCatalog(cp1);
validateCatalog(cp2);
