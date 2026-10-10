import type { AuditCheckpointCode } from "@app/shared";

export interface RunnerPromptInput {
  checkpoint: AuditCheckpointCode;
  /** Prompt files from `AUDIT_CHECKPOINTS`, in reading order. */
  promptFiles: readonly string[];
  submissionType: string;
  /** CP1 only: contents of the submission-specific prompt, inlined into the instruction. */
  submissionInstructions: string;
}

const CP1_INSTRUCTION = ({ promptFiles, submissionType, submissionInstructions }: RunnerPromptInput): string => {
  const promptFilesDesc = promptFiles.map((fileName) => `system_prompt/${fileName}`).join(", ");
  return (
    `Hãy đọc tệp AGENTS.md để nắm vững quy trình và tiêu chuẩn thẩm định 2 bước (Fixed Two-Step Workflow). Đọc kỹ các tài liệu chuẩn trong: ${promptFilesDesc}. Đọc toàn bộ tài liệu nhóm trong input/ (hỗ trợ đọc tài liệu .docx, .pdf, .md, .txt bao gồm cả các bản bóc tách văn bản .extracted.md), tra cứu đối chiếu kiến thức trong knowledge/ (startup_knowledge.db và startup_knowledge.json).` +
    (submissionInstructions
      ? `\n\n--- HƯỚNG DẪN BỔ SUNG (${submissionType}) ---\n${submissionInstructions}\n--- KẾT THÚC HƯỚNG DẪN ---\n\n`
      : "") +
    ` Sau đó thực hiện chuẩn xác Step 1 xuất output/triad_handoff_packet.md, rồi Step 2 xuất output/input_clarification_audit.md và output/report.json theo đúng cấu trúc quy định.`
  );
};

const CP2_INSTRUCTION = ({ promptFiles }: RunnerPromptInput): string => {
  const promptFilesDesc = promptFiles.map((fileName) => `system_prompt/${fileName}`).join(", ");
  return `Đọc lần lượt các tệp hướng dẫn: ${promptFilesDesc}. Tệp đầu là nguyên tắc chung, tệp sau là hướng dẫn riêng. Đọc toàn bộ tài liệu trong input/. Làm đúng bốn bước trong mục 4 của tệp nguyên tắc chung: ghi output/cp2_evidence.json, tính lại mọi phép tính bằng shell, quyết định từng tiêu chí, rồi ghi output/report.md và output/report.json. Kiểm tra report.json hợp lệ trước khi kết thúc.`;
};

/** One builder per checkpoint; the instruction never embeds user content (only prompt files and input/). */
const INSTRUCTIONS: Record<AuditCheckpointCode, (input: RunnerPromptInput) => string> = {
  CP1: CP1_INSTRUCTION,
  CP2: CP2_INSTRUCTION,
};

export function buildRunnerPrompt(input: RunnerPromptInput): string {
  return INSTRUCTIONS[input.checkpoint](input);
}
