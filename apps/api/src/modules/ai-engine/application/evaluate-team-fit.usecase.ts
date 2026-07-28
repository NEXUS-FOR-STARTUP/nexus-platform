import type { TeamFitInput } from "../domain/team-fit.dto.js";
import { TeamFitInputSchema } from "../domain/team-fit.dto.js";
import { TeamFitFreeReportSchema, type TeamFitFreeReport } from "@repo/validation";
import { getGoogleModel } from "../../../services/google-provider.js";
import { generateObject } from "ai";
import { AppError } from "../../../shared/domain/app-error.js";
import logger from "../../../shared/infrastructure/logger.js";

const SYSTEM_PROMPT = `Bạn là chuyên gia đánh giá đội ngũ khởi nghiệp cho sinh viên EXE101 tại Đại học FPT.

Tiêu chí đánh giá:
1. Một đội ngũ "chuẩn" cần phân bố đồng đều giữa:
   - Kỹ thuật (lập trình, thiết kế sản phẩm, dựng MVP)
   - Marketing (truyền thông, tiếp cận khách hàng, growth)
   - Kinh tế (mô hình kinh doanh, tài chính, định giá)
2. Yêu cầu bắt buộc: tối thiểu 2 ngành đào tạo khác nhau trong nhóm.
3. Kỹ năng được tính điểm cao hơn nếu có bằng chứng thực tế (project, kinh nghiệm làm việc).
4. Đánh giá dựa trên thông tin thực tế được cung cấp, không suy đoán, không bịa đặt.
5. Đưa ra khuyến nghị cụ thể, hành động được.

Output phải là tiếng Việt, có cấu trúc rõ ràng, dễ hiểu cho sinh viên năm 1-2.`;

const SYSTEM_PROMPT_FREE = `Bạn là công cụ quét bề mặt. Nhiệm vụ duy nhất: phát hiện khoảng trống. Không phân tích, không đánh giá, không đề xuất.

=== NHIỆM VỤ 1: ĐỘI NGŨ (teamGaps) ===
Dựa vào lĩnh vực dự án (field) và thông tin từng thành viên (chuyên ngành, sở trường, kinh nghiệm), liệt kê những kỹ năng hoặc lĩnh vực chuyên môn mà đội ngũ hiện chưa thể hiện.
- Mỗi gap là một câu ngắn, chỉ nêu tên sự thiếu hụt.
- Không giải thích tại sao thiếu là nguy hiểm.
- Không gợi ý cần tìm ai hay làm gì để bổ sung.

=== NHIỆM VỤ 2: THƯƠNG MẠI (commercialGaps) ===
Quét 6 trường thông tin dự án: projectName, field, targetCustomer, problem, solution, mvp.
- Chỉ ra những trường chưa rõ ràng, còn mơ hồ hoặc quá chung chung.
- Không phán xét đúng/sai.
- Không gợi ý cách cải thiện.

=== QUY TẮC CỨNG ===
- KHÔNG đưa ra: khuyến nghị, điểm mạnh, phân tích có dẫn chứng, mức độ nghiêm trọng, hành động cụ thể.
- Mỗi gap tối đa 20 từ.
- Mỗi mảng (teamGaps, commercialGaps) tối đa 5 gap.
- Toàn bộ output phải bằng tiếng Việt.
- Output phải khớp chính xác schema: { teamGaps: string[], commercialGaps: string[] }`;

function buildPrompt(input: TeamFitInput): string {
  const { idea, team } = input;

  const teamMembers = team
    .map(
      (member, index) =>
        `Thành viên ${index + 1}:
- Chuyên ngành: ${member.major}
- Sở trường: ${member.strengths.join(", ")}
- Kinh nghiệm: ${member.experience.length > 0 ? member.experience.join(", ") : "Chưa có"}`,
    )
    .join("\n\n");

  return `=== THÔNG TIN DỰ ÁN ===
Tên dự án: ${idea.projectName}
Lĩnh vực: ${idea.field}
Khách hàng mục tiêu: ${idea.targetCustomer}
Vấn đề cần giải quyết: ${idea.problem}
Giải pháp: ${idea.solution}
MVP: ${idea.mvp}

=== THÔNG TIN ĐỘI NGŨ ===
${teamMembers}`;
}

export async function evaluateTeamFitUseCase(input: TeamFitInput): Promise<TeamFitFreeReport> {
  const parsed = TeamFitInputSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    throw new AppError(400, "INVALID_INPUT", `Thiếu thông tin: ${firstError.path.join(".")}`);
  }

  const prompt = buildPrompt(input);
  const model = getGoogleModel();
  const t0 = Date.now();

  try {
    // t0 is defined at function scope for use in both try and catch + mapAIError
    const { object } = await generateObject({
      model,
      schema: TeamFitFreeReportSchema,
      system: SYSTEM_PROMPT_FREE,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 2048,
    });
    logger.info({ model: process.env.AI_TEAM_FIT_MODEL, promptLength: prompt.length, duration_ms: Date.now() - t0, gapCount: object.teamGaps?.length }, 'AI evaluation success');
    return object;
  } catch (error) {
    logger.error({ err: error, model: process.env.AI_TEAM_FIT_MODEL, duration_ms: Date.now() - t0 }, 'AI evaluation failed');
    throw mapAIError(error, Date.now() - t0);
  }
}

function mapAIError(error: unknown, durationMs?: number): Error {
  if (error instanceof AppError) return error;

  const aiError = error as { name?: string; statusCode?: number; message?: string; statusText?: string };

  if (aiError.name === "AI_APICallError" || aiError.name === "AI_APICallError") {
    const code = aiError.statusCode ?? 500;

    if (code === 401 || code === 403) {
      return new AppError(500, "AI_AUTH_ERROR", "Không thể xác thực với Google AI. Kiểm tra lại API key.");
    }
    if (code === 429) {
      return new AppError(429, "AI_RATE_LIMITED", "Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.");
    }
    if (code === 400 && aiError.message?.includes("safety")) {
      return new AppError(400, "AI_CONTENT_FILTERED", "Nội dung không phù hợp để đánh giá. Vui lòng kiểm tra lại thông tin.");
    }
    if (code === 400 && aiError.message?.includes("not found") || aiError.message?.includes("not supported")) {
      return new AppError(500, "AI_MODEL_NOT_FOUND", `Model AI không tồn tại: ${process.env.AI_TEAM_FIT_MODEL ?? "gemini-2.0-flash"}. Kiểm tra AI_TEAM_FIT_MODEL.`);
    }
  }

  if (aiError.name === "AbortError" || aiError.message?.includes("timeout") || aiError.message?.includes("abort")) {
    return new AppError(504, "AI_TIMEOUT", "Google AI phản hồi quá chậm. Vui lòng thử lại.");
  }

  if (aiError.name === "ZodError" || aiError.name === "AI_SchemaValidationError" || aiError.message?.includes("schema")) {
    return new AppError(500, "AI_INVALID_OUTPUT", "AI trả về định dạng không hợp lệ. Vui lòng thử lại.");
  }

    logger.error({ err: error, model: process.env.AI_TEAM_FIT_MODEL, duration_ms: durationMs }, 'AI evaluation unhandled error');
  return new AppError(500, "AI_INTERNAL_ERROR", "Lỗi hệ thống AI. Vui lòng thử lại sau.");
}
