import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { AppError } from "../../../shared/domain/app-error.js";
import { resolveRepoRoot } from "../omp-audit.service.js";
import type { AuditPlan } from "./audit-registry.js";

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

/** Appended to both instructions; the manifest exists only when the team uploaded files. */
const MANIFEST_HINT =
  " Nếu có input/attachments_manifest.json: đó là chỉ mục các tệp nhóm tải lên, không phải tài liệu của nhóm; đọc nó trước để biết nhóm gắn nhãn loại gì cho từng tệp (nhãn nhóm tự chọn, chưa kiểm chứng, nội dung tệp mới là căn cứ). Tệp nhãn lecturer_guidance chỉ là tài liệu tham chiếu, không phải bằng chứng về nhóm, và không thay thế hay ghi đè các tệp trong system_prompt/.";

/** Read the CP1 submission-specific prompt (last file of the list) to inline into the instruction. */
function readCp1SubmissionPrompt(fileName: string): string {
  const promptFilePath = resolve(resolveRepoRoot(), "data", "system-prompts", fileName);
  if (!existsSync(promptFilePath)) return "";
  try {
    return readFileSync(promptFilePath, "utf-8").trim();
  } catch {
    return "";
  }
}

function cp1Instruction(plan: AuditPlan, submissionType: string, submissionInstructions: string): string {
  const promptFilesDesc = plan.prompts.map((fileName) => `system_prompt/${fileName}`).join(", ");
  return (
    `Hãy đọc tệp AGENTS.md để nắm vững quy trình và tiêu chuẩn thẩm định 2 bước (Fixed Two-Step Workflow). Đọc kỹ các tài liệu chuẩn trong: ${promptFilesDesc}. Đọc toàn bộ tài liệu nhóm trong input/ (hỗ trợ đọc tài liệu .docx, .pdf, .md, .txt bao gồm cả các bản bóc tách văn bản .extracted.md), tra cứu đối chiếu kiến thức trong knowledge/ (startup_knowledge.db và startup_knowledge.json).` +
    MANIFEST_HINT +
    (submissionInstructions
      ? `\n\n--- HƯỚNG DẪN BỔ SUNG (${submissionType}) ---\n${submissionInstructions}\n--- KẾT THÚC HƯỚNG DẪN ---\n\n`
      : "") +
    ` Sau đó thực hiện chuẩn xác Step 1 xuất output/triad_handoff_packet.md, rồi Step 2 xuất output/input_clarification_audit.md và output/report.json theo đúng cấu trúc quy định.`
  );
}

function cp2Instruction(plan: AuditPlan): string {
  const promptFilesDesc = plan.prompts.map((fileName) => `system_prompt/${fileName}`).join(", ");
  return `Đọc AGENTS.md (khóa cấu trúc report.json và lệnh kiểm tra), rồi đọc lần lượt các tệp hướng dẫn: ${promptFilesDesc}. Tệp đầu là nguyên tắc chung, tệp sau là hướng dẫn riêng. Đọc toàn bộ tài liệu trong input/.${MANIFEST_HINT} Làm đúng bốn bước trong mục 4 của tệp nguyên tắc chung: ghi output/cp2_evidence.json, tính lại mọi phép tính bằng shell, quyết định từng tiêu chí, rồi ghi output/report.md và output/report.json. Chạy lệnh kiểm tra trong AGENTS.md cho tới khi báo OK mới kết thúc.`;
}

/**
 * Build the worker JobSpec from a resolved audit plan. Fails fast (400) on an
 * invalid output contract so a broken registry entry can never reach the queue.
 */
export function buildOmpJobSpec(plan: AuditPlan, submissionType: string): OmpJobSpec {
  // Output names must be plain basenames: no traversal, no absolute paths, no nesting.
  for (const name of [...plan.outputs.required, ...plan.outputs.optional]) {
    if (name.length === 0 || name !== basename(name) || name.includes("\0")) {
      throw new AppError(400, "INVALID_OUTPUT_CONTRACT", `Tên tệp output không hợp lệ: ${name}`);
    }
  }

  const submissionInstructions =
    plan.checkpoint === "CP1" ? readCp1SubmissionPrompt(plan.prompts[plan.prompts.length - 1]) : "";
  const instruction =
    plan.checkpoint === "CP1" ? cp1Instruction(plan, submissionType, submissionInstructions) : cp2Instruction(plan);

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
