import { z } from "zod";
import { AUDIT_CHECKPOINT_CODES, CP2_INPUT_SOURCES } from "@app/shared";

const SubmissionTypeSchema = z.enum(["initial", "resubmit", "logic_check"]);
const CHANGE_SUMMARY_MAX_CHARS = 5000;
const USER_NOTE_MAX_CHARS = 2000;

/** Body of `POST /cases/:id/ai-retry` and every internal trigger. No `checkpoint` = CP1, as before CP2 existed. */
export const TriggerOptsSchema = z
  .object({
    submission_type: SubmissionTypeSchema.default("initial"),
    checkpoint: z.enum(AUDIT_CHECKPOINT_CODES).default("CP1"),
    /** CP2 only. CP1 scope is `prompt_mode`, chosen by admin. */
    scope: z.enum(["questionnaire", "full"]).optional(),
    /** CP2 only: which student inputs the grader reads. Omitted = legacy (answers + opportunistic attachments). */
    input_source: z.enum(CP2_INPUT_SOURCES).optional(),
    /** CP2 resubmit only: what the team changed since the previous full report. */
    change_summary: z.string().max(CHANGE_SUMMARY_MAX_CHARS).optional(),
    /** CP2 only: free note from the team (e.g. which part to focus on). Passed to the grader as input. */
    user_note: z.string().max(USER_NOTE_MAX_CHARS).optional(),
    lifecycle_unit_id: z.string().uuid().optional(),
    model: z.string().optional(),
    prompt_mode: z.enum(["full", "lite"]).optional(),
    skip_credit_check: z.boolean().optional(),
    admin_triggered: z.boolean().optional(),
    force_supersede: z.boolean().optional(),
  })
  .superRefine((opts, ctx) => {
    if (opts.checkpoint === "CP2") {
      if (opts.scope === undefined) ctx.addIssue({ code: "custom", path: ["scope"], message: "scope is required for CP2" });
      if (opts.submission_type === "logic_check") {
        ctx.addIssue({ code: "custom", path: ["submission_type"], message: "logic_check is not available for CP2" });
      }
    } else if (opts.scope !== undefined) {
      ctx.addIssue({ code: "custom", path: ["scope"], message: "scope is only accepted for CP2" });
    }
    if (opts.checkpoint !== "CP2" && opts.input_source !== undefined) {
      ctx.addIssue({ code: "custom", path: ["input_source"], message: "input_source is only accepted for CP2" });
    }
  });

