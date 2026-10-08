import { cp1 } from "./cp1.js";
import { cp2 } from "./cp2.js";
import { validateCatalog } from "./validate-catalog.js";
import { QUESTION_REGISTRY } from "./questions.js";

export * from "./types.js";
export { QUESTION_REGISTRY } from "./questions.js";
export type { QuestionId } from "./questions.js";
export { cp1, cp2, validateCatalog };

export const CP1_TEMPLATE = cp1;
export const CP2_TEMPLATE = cp2;
export const CATALOG_QUESTIONS = QUESTION_REGISTRY;
export const VALID_QUESTION_IDS = Object.keys(QUESTION_REGISTRY) as Array<keyof typeof QUESTION_REGISTRY>;

// Single monotonic string stamped on every ProjectAnswer write.
export const CATALOG_VERSION = "2026-10-05.1";

// Fail fast at module load — a catalog bug must surface in CI/tests, not at runtime.
validateCatalog(cp1);
validateCatalog(cp2);
