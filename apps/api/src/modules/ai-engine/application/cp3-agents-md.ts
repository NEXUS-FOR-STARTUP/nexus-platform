import { CP2_SCHEMAS } from "@repo/validation";
import { CP2_VALIDATOR_SANDBOX_PATH } from "./cp2-agents-md.js";
import { cp3AllowedSchemas } from "./cp3-audit-postprocess.js";

/**
 * Sandbox `AGENTS.md` for CP3 jobs (same channel and validator bundle as CP2). Built from CP2_SCHEMAS so
 * the id list and `schema` value can never drift from what `validateCp2Report` accepts.
 */
export function buildCp3AgentsMd(submissionType: string): string {
  const allowed = cp3AllowedSchemas(submissionType);
  const schema = allowed[allowed.length - 1];
  const ids = Object.keys(CP2_SCHEMAS[schema].checks);
  const skeleton = {
    schema,
    projectName: "Tên dự án",
    checks: [{ id: ids[0], status: "pass | partial | fail | missing", evidence: [{ source: "question_id hoặc tên tệp", quote: "trích nguyên văn" }], note: "nhận xét ngắn" }],
    calcChecks: [],
    crossIssues: [],
    actionPlan: [],
  };
  return [
    "# Quy tắc đầu ra CP3",
    "",
    "Hệ thống kiểm `output/report.json` bằng zod. Sai cấu trúc thì phải ghi lại, nên ghi đúng ngay từ đầu.",
    "Nội dung chấm theo `system_prompt/` (nguyên tắc chung trước, hướng dẫn riêng sau). Tệp này chỉ khóa hình dạng JSON.",
    "",
    "## report.json",
    "",
    `- \`schema\` là chuỗi \`${schema}\`${allowed.length > 1 ? ` (hoặc \`${allowed[0]}\` nếu không có báo cáo lần trước)` : ""}. Đây không phải tên tệp prompt.`,
    "- `checks` là mảng ở cấp gốc, đúng một phần tử cho mỗi id dưới đây, không thêm, không bỏ.",
    "- `evidence` bắt buộc có phần tử khi status là pass, partial hoặc fail; được để trống khi missing. Dịch vụ này không dùng `not_applicable`.",
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
    "Chi tiết các trường còn lại (`calcChecks`, `crossIssues`, `actionPlan`, `reaudit`): mục 8.2 của `system_prompt/cp3_audit_core_v1.md`.",
    `Trước khi kết thúc BẮT BUỘC chạy \`bun ${CP2_VALIDATOR_SANDBOX_PATH} output/report.json ${allowed.join(",")}\`. In OK thì xong; in INVALID thì sửa theo từng dòng lỗi, ghi đè tệp rồi chạy lại cho tới khi OK. Không chấm lại từ đầu.`,
    "",
  ].join("\n");
}
