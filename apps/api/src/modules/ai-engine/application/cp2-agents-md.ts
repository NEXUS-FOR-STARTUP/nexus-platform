import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { CP2_SCHEMAS } from "@repo/validation";
import { cp2AllowedSchemas } from "./cp2-audit-postprocess.js";

const CP2_VALIDATOR_FILE = "validate-cp2-report.mjs";
/** Path of the validator inside the job sandbox, relative to its root. */
export const CP2_VALIDATOR_SANDBOX_PATH = `tools/${CP2_VALIDATOR_FILE}`;

/** Bundled (zod inlined) checker built next to @repo/validation's dist; needs `@repo/validation` built first. */
export function cp2ValidatorSource(): { name: string; src: string } {
  const dist = dirname(createRequire(import.meta.url).resolve("@repo/validation"));
  return { name: CP2_VALIDATOR_FILE, src: resolve(dist, CP2_VALIDATOR_FILE) };
}


/**
 * Sandbox `AGENTS.md` for CP2 jobs. omp loads it into the model's system context, the same
 * channel CP1 uses for its report.json skeleton. Built from CP2_SCHEMAS so the id list and
 * `schema` value can never drift from what `validateCp2Report` accepts.
 */
export function buildCp2AgentsMd(scope: string, submissionType: string): string {
  const allowed = cp2AllowedSchemas(scope, submissionType);
  const schema = allowed[allowed.length - 1];
  const ids = Object.keys(CP2_SCHEMAS[schema].checks);
  const skeleton = {
    schema,
    projectName: "Tên dự án",
    checks: [{ id: ids[0], status: "pass | partial | fail | missing | not_applicable", evidence: [{ source: "question_id hoặc tên tệp", quote: "trích nguyên văn" }], note: "nhận xét ngắn" }],
    calcChecks: [],
    crossIssues: [],
    itemReviews: [],
    boardQuestions: [],
    actionPlan: [],
  };
  return [
    "# Quy tắc đầu ra CP2",
    "",
    "Hệ thống kiểm `output/report.json` bằng zod. Sai cấu trúc thì phải ghi lại, nên ghi đúng ngay từ đầu.",
    "Nội dung chấm theo `system_prompt/` (nguyên tắc chung trước, hướng dẫn riêng sau). Tệp này chỉ khóa hình dạng JSON.",
    "",
    "## report.json",
    "",
    `- \`schema\` là chuỗi \`${schema}\`${allowed.length > 1 ? ` (hoặc \`${allowed[0]}\` nếu không có báo cáo lần trước)` : ""}. Đây không phải tên tệp prompt.`,
    "- `checks` là mảng ở cấp gốc, đúng một phần tử cho mỗi id dưới đây, không thêm, không bỏ.",
    "- `evidence` bắt buộc có phần tử khi status là pass, partial hoặc fail; được để trống khi missing hoặc not_applicable.",
    "- Không thêm `overallScore`, `verdict`, `categoryScores`; hệ thống tự tính.",
    "- Không lồng `checks` trong đối tượng khác.",
    "",
    "```json",
    JSON.stringify(skeleton, null, 2),
    "```",
    "",
    "## Danh sách id cho `checks`",
    "",
    ...ids.map((id) => `- ${id}`),
    "",
    "Chi tiết các trường còn lại (`calcChecks`, `crossIssues`, `itemReviews`, `boardQuestions`, `actionPlan`, `reaudit`): mục 7.2 của `system_prompt/cp2_audit_core_v1.md`.",
    `Trước khi kết thúc BẮT BUỘC chạy \`bun ${CP2_VALIDATOR_SANDBOX_PATH} output/report.json ${allowed.join(",")}\`. In OK thì xong; in INVALID thì sửa theo từng dòng lỗi, ghi đè tệp rồi chạy lại cho tới khi OK. Không chấm lại từ đầu.`,
    "",
  ].join("\n");
}
