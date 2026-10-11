import { z } from "zod";

// ---------------------------------------------------------------------------
// Catalog types — the two-level catalog lives in code (plan section 5, D2).
// Question ids are stable strings, never reused or renumbered. Classification
// lives on the template (not the question) so the same canonical question can
// be "required" in CP2 but "supplemental" in CP1.
// ---------------------------------------------------------------------------

export const CLASSIFICATIONS = ["required", "recommended", "supplemental"] as const;
export type Classification = (typeof CLASSIFICATIONS)[number];

/** An external reading link shown under a question's explanation. Must be an https URL. */
export interface FurtherReading {
  url: string;
  title: string;
}

/** A canonical question. `id` matches its key in the question registry. */
export interface Question {
  id: string;
  text: string;
  explanation: string;
  suggested_actions: string[];
  further_reading?: readonly FurtherReading[];
}

/** A question reference inside a template phase, with its per-template classification. */
export interface TemplateQuestion {
  question_id: string;
  classification: Classification;
  unlock_requires?: string[];
}

/** A phase groups questions and unlocks only when its `unlock_requires` questions are complete. */
export interface Phase {
  id: string;
  title: string;
  unlock_requires: string[];
  questions: TemplateQuestion[];
}

export type TemplatePhase = Phase;

/** A template selects relevant questions and groups them into phases. */
export interface Template {
  template_key: string;
  title: string;
  /** One-line Vietnamese summary shown on the template gallery card. */
  description: string;
  /** Optional public path of the gallery cover screenshot (A4 portrait). Omit to use the CSS cover. */
  cover_image?: string;
  phases: Phase[];
}

/** The combined catalog: version + question registry + templates. */
export interface Catalog {
  version: string;
  questions: Record<string, Question>;
  templates: Template[];
}

// ---------------------------------------------------------------------------
// Zod schemas — a catalog must satisfy these shapes (used at API boundaries).
// ---------------------------------------------------------------------------

export const ClassificationSchema = z.enum(CLASSIFICATIONS);

export const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  explanation: z.string(),
  suggested_actions: z.array(z.string()),
  further_reading: z
    .array(z.object({ url: z.url({ protocol: /^https$/ }), title: z.string().trim().min(1) }))
    .optional(),
});

export const TemplateQuestionSchema = z.object({
  question_id: z.string().min(1),
  classification: ClassificationSchema,
  unlock_requires: z.array(z.string()).optional(),
});

export const PhaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  unlock_requires: z.array(z.string()),
  questions: z.array(TemplateQuestionSchema),
});

export const TemplateSchema = z.object({
  template_key: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  cover_image: z.string().min(1).optional(),
  phases: z.array(PhaseSchema),
});

export const CatalogSchema = z.object({
  version: z.string().min(1),
  questions: z.record(z.string(), QuestionSchema),
  templates: z.array(TemplateSchema),
});
