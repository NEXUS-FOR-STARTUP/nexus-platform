/**
 * Single lookup table for every point where audit checkpoints differ.
 * Data only so the API and the worker can both import it; the lookup lives in
 * `audit-checkpoint-lookup.ts`. Adding a checkpoint = one entry here + its prompt
 * files + one input assembler and one post-processor in the API registry.
 *
 * CP1 `scope` is the prompt mode (`full` | `lite`). Each prompt list is complete:
 * the last file is the submission-specific prompt the worker inlines for CP1.
 */
export interface AuditCheckpointOutputs {
  /** Files the agent MUST write; missing any = job failure. */
  required: readonly string[];
  /** Nice-to-have; synced when present, ignored when absent. */
  optional: readonly string[];
}

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
    outputs: {
      required: ["report.json", "input_clarification_audit.md"],
      optional: ["triad_handoff_packet.md"],
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
    outputs: {
      required: ["report.json", "report.md", "cp2_evidence.json"],
      optional: [],
    },
  },
} as const;

export type AuditCheckpointCode = keyof typeof AUDIT_CHECKPOINTS;
export const AUDIT_CHECKPOINT_CODES = Object.keys(AUDIT_CHECKPOINTS) as [AuditCheckpointCode, ...AuditCheckpointCode[]];
export type AuditSubmissionType = "initial" | "resubmit" | "logic_check";

/** CP2 only: which student inputs the grader reads. `both` requires answers AND files to pass their gates. */
export const CP2_INPUT_SOURCES = ["answers", "files", "both"] as const;
export type Cp2InputSource = (typeof CP2_INPUT_SOURCES)[number];
