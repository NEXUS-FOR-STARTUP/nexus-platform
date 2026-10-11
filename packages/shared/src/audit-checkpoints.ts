/**
 * Single lookup table for every point where audit checkpoints differ.
 * Data only so the API and the worker can both import it; the lookup lives in
 * `audit-checkpoint-lookup.ts`. Adding a checkpoint = one entry here + its prompt
 * files + one input assembler and one post-processor in the API registry.
 *
 * CP1 `scope` is the prompt mode (`full` | `lite`). Each prompt list is complete:
 * the last file is the submission-specific prompt the worker inlines for CP1.
 */
export const AUDIT_CHECKPOINTS = {
  CP1: {
    serviceType: "cp1_audit",
    input: "cp1_intake",
    postProcess: "cp1_legacy",
    scopes: {
      full: {
        prompts: {
          initial: ["triad_framework_v1_1.md", "input_clarification_gate_v4_1.md"],
          resubmit: ["triad_framework_v1_1.md", "input_clarification_gate_v4_1.md", "input_clarification_gate_v4_1_resubmit.md"],
          logic_check: ["triad_framework_v1_1.md", "input_clarification_gate_v4_1.md", "input_clarification_gate_v4_1_logic.md"],
        },
        reportType: {
          initial: "input_clarification",
          resubmit: "input_clarification",
          logic_check: "input_clarification",
        },
      },
      lite: {
        prompts: {
          initial: ["triad_framework_v1_1.md", "input_clarification_gate_lite_v1_1.md", "input_clarification_gate_v4_1.md"],
          resubmit: ["triad_framework_v1_1.md", "input_clarification_gate_lite_v1_1.md", "input_clarification_gate_v4_1_resubmit.md"],
          logic_check: ["triad_framework_v1_1.md", "input_clarification_gate_lite_v1_1.md", "input_clarification_gate_v4_1_logic.md"],
        },
        reportType: {
          initial: "input_clarification",
          resubmit: "input_clarification",
          logic_check: "input_clarification",
        },
      },
    },
  },
  CP2: {
    serviceType: "cp2_audit",
    input: "cp2_answers",
    postProcess: "cp2_scored",
    scopes: {
      questionnaire: {
        prompts: { initial: ["cp2_audit_core_v1.md", "cp2_questionnaire_review_v1.md"] },
        reportType: { initial: "cp2_questionnaire" },
      },
      full: {
        prompts: {
          initial: ["cp2_audit_core_v1.md", "cp2_full_review_v1.md"],
          resubmit: ["cp2_audit_core_v1.md", "cp2_full_review_v1.md", "cp2_full_resubmit_v1.md"],
        },
        reportType: { initial: "cp2_full", resubmit: "cp2_full_resubmit" },
      },
    },
  },
} as const;

export type AuditCheckpointCode = keyof typeof AUDIT_CHECKPOINTS;
export const AUDIT_CHECKPOINT_CODES = Object.keys(AUDIT_CHECKPOINTS) as [AuditCheckpointCode, ...AuditCheckpointCode[]];
export type AuditSubmissionType = "initial" | "resubmit" | "logic_check";
