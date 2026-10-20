import { basename } from "node:path";
import type { AuditSubmissionType } from "@app/shared";
import { AppError } from "../../../shared/domain/app-error.js";
import type { AuditPlan } from "./audit-registry.js";
import { getAuditService } from "./audit-services.js";

/**
 * Self-contained execution contract for the OMP worker. The API resolves every
 * domain decision (prompt selection, instruction text, output contract, milestone
 * log wording) so the worker stays a dumb engine: adding or editing a service
 * never requires rebuilding the worker image.
 */
export interface OmpJobSpec {
  specVersion: 1;
  /** Full instruction handed to the OMP process; the worker never assembles prompts. */
  instruction: string;
  /** Missing any of these after the run = job failure. */
  requiredOutputs: string[];
  /** Synced when present, ignored when absent. */
  optionalOutputs: string[];
  /** Output file → progress log message shown in the job log panel (cosmetic; real
   *  progress steps come from API-side file scanning via `computeProgressSteps`). */
  milestones: Record<string, string>;
}

/** Output file → user-facing milestone log. Mirrors the worker's legacy wording exactly. */
const MILESTONE_MESSAGE_BY_FILE: Record<string, string> = {
  "triad_handoff_packet.md": "📦 Cột mốc 1 - Hoàn thành xây dựng ma trận Vấn đề - Giải pháp - Khách hàng",
  "input_clarification_audit.md": "📦 Cột mốc 2 - Hoàn thành phản biện chuyên sâu các giả định và tiêu chí khởi nghiệp",
  "cp2_evidence.json": "📦 Cột mốc 1 - Hoàn thành trích xuất bằng chứng từ tài liệu nhóm",
  "report.md": "📦 Cột mốc 2 - Hoàn thành viết báo cáo thẩm định",
  "report.json": "📦 Cột mốc 3 - Hoàn thành tổng hợp điểm số và hoàn tất báo cáo thẩm định",
};

/**
 * Build the worker JobSpec from a resolved audit plan. Fails fast (400) on an
 * invalid output contract so a broken registry entry can never reach the queue.
 */
export function buildOmpJobSpec(plan: AuditPlan, submissionType: AuditSubmissionType): OmpJobSpec {
  // Output names must be plain basenames: no traversal, no absolute paths, no nesting.
  for (const name of [...plan.outputs.required, ...plan.outputs.optional]) {
    if (name.length === 0 || name !== basename(name) || name.includes("\0")) {
      throw new AppError(400, "INVALID_OUTPUT_CONTRACT", `Tên tệp output không hợp lệ: ${name}`);
    }
  }

  const instruction = getAuditService(plan.checkpoint).instruction(plan, submissionType);

  const milestones: Record<string, string> = {};
  for (const name of [...plan.outputs.required, ...plan.outputs.optional]) {
    milestones[name] = MILESTONE_MESSAGE_BY_FILE[name] ?? `📦 Hoàn thành ${name}`;
  }

  return {
    specVersion: 1,
    instruction,
    requiredOutputs: [...plan.outputs.required],
    optionalOutputs: [...plan.outputs.optional],
    milestones,
  };
}
