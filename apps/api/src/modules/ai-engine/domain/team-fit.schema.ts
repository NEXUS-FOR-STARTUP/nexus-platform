import { z } from 'zod';

/**
 * Zod schema for Team-Idea Fit evaluation report.
 *
 * 4-part structure: overview, strengths, weaknesses, recommendations.
 * Compatible with Gemini structured output (no z.union, z.discriminatedUnion, or z.record).
 */
export const TeamFitReportSchema = z.object({
  /** Tổng quan 1 câu: đánh giá mức độ phù hợp giữa đội ngũ và ý tưởng */
  overview: z.string().describe('Tổng quan 1 câu: đánh giá mức độ phù hợp giữa đội ngũ và ý tưởng'),
  /** Mức độ phù hợp: strong, moderate, weak, poor */
  fitLevel: z.enum(['strong', 'moderate', 'weak', 'poor']).describe('Mức độ phù hợp'),
  /** Nhãn tiếng Việt tương ứng fitLevel */
  fitLabel: z.string().describe('Nhãn tiếng Việt'),
  /** Các ưu điểm của đội ngũ so với ý tưởng */
  strengths: z.array(
    z.object({
      area: z.string(),
      detail: z.string(),
      evidence: z.string().default(''),
    }).describe('Một ưu điểm cụ thể'),
  ).describe('Các ưu điểm của đội ngũ so với ý tưởng'),
  /** Các điểm yếu / rủi ro của đội ngũ so với ý tưởng */
  weaknesses: z.array(
    z.object({
      area: z.string(),
      severity: z.enum(['critical', 'moderate', 'low']),
      detail: z.string(),
      recommendation: z.string(),
    }).describe('Một điểm yếu cụ thể'),
  ).describe('Các điểm yếu / rủi ro của đội ngũ so với ý tưởng'),
  /** Các khuyến nghị hành động */
  recommendations: z.array(z.string()).describe('Các khuyến nghị hành động'),
});

/** Inferred type for Team-Idea Fit evaluation report */
export type TeamFitReport = z.infer<typeof TeamFitReportSchema>;
