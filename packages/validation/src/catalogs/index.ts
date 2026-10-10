import { z } from "zod";
import { cp1 } from "./cp1.js";
import { cp2 } from "./cp2.js";
import { cp3 } from "./cp3.js";
import { cp4 } from "./cp4.js";
import { validateCatalog } from "./validate-catalog.js";
import { QUESTION_REGISTRY } from "./questions.js";
import type { Template } from "./types.js";

export * from "./types.js";
export { QUESTION_REGISTRY } from "./questions.js";
export type { QuestionId } from "./questions.js";
export { cp1, cp2, cp3, cp4, validateCatalog };
export * from "./sync-rules.js";
export * from "./file-templates.js";

export const CATALOG_QUESTIONS = QUESTION_REGISTRY;
export const VALID_QUESTION_IDS = Object.keys(QUESTION_REGISTRY) as Array<keyof typeof QUESTION_REGISTRY>;

// Single source of truth for template keys: adding a template = one entry here.
export const TEMPLATE_REGISTRY = { cp1, cp2, cp3, cp4 } as const satisfies Record<string, Template>;
export type TemplateKey = keyof typeof TEMPLATE_REGISTRY;
export const TEMPLATE_KEYS = Object.keys(TEMPLATE_REGISTRY) as [TemplateKey, ...TemplateKey[]];
export const TEMPLATE_LIST: readonly Template[] = Object.values(TEMPLATE_REGISTRY);
export const TemplateKeySchema = z.enum(TEMPLATE_KEYS);

export function isTemplateKey(value: string | null | undefined): value is TemplateKey {
  return value != null && Object.hasOwn(TEMPLATE_REGISTRY, value);
}

// Single monotonic string stamped on every ProjectAnswer write.
export const CATALOG_VERSION = "2026-10-10.3";

// Fail fast at module load — a catalog bug must surface in CI/tests, not at runtime.
for (const [key, template] of Object.entries(TEMPLATE_REGISTRY)) {
  if (key !== template.template_key) {
    throw new Error(`Template registry key "${key}" != template_key "${template.template_key}"`);
  }
  validateCatalog(template);
}
