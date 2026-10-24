import type { Cp2CheckDef } from "./cp2-audit-checks.js";
import { cp3 } from "./cp3.js";

/**
 * CP3 audit criteria (Business Model Canvas + SWOT). The ids mirror the table in
 * `data/system-prompts/cp3_full_review_v1.md` (a test keeps them in sync). The model decides each
 * criterion's status; `scoreCp2Report` computes scores and the verdict from these constants.
 * The template holds only graded questions, so every question id feeds the audit.
 */
export type Cp3FullGroup =
  | "customer_value"
  | "money_model"
  | "operations"
  | "bmc_coherence"
  | "swot_evidence"
  | "strategy"
  | "conclusion";

export const CP3_FULL_CHECKS = {
  c3_segment_narrow: { group: "customer_value", tier: "core", label: "Phân khúc khách hàng đủ hẹp" },
  c3_usp_differentiated: { group: "customer_value", tier: "core", label: "Điểm khác biệt và khó bắt chước" },
  c3_value_fits_pain: { group: "customer_value", tier: "normal", label: "Giá trị đáp ứng nỗi đau của phân khúc" },
  c3_channels_fit_segment: { group: "customer_value", tier: "normal", label: "Kênh phù hợp phân khúc" },
  c3_retention_mechanism: { group: "customer_value", tier: "normal", label: "Cách thu hút và giữ chân khách" },
  c3_revenue_concrete: { group: "money_model", tier: "normal", label: "Nguồn thu và cách tính tiền cụ thể" },
  c3_cost_quantified: { group: "money_model", tier: "normal", label: "Khoản chi chính được gọi tên" },
  c3_revenue_vs_cost: { group: "money_model", tier: "normal", label: "Doanh thu và chi phí không mâu thuẫn" },
  c3_resources_to_activities: { group: "operations", tier: "normal", label: "Nguồn lực đủ cho hoạt động chính" },
  c3_activities_create_value: { group: "operations", tier: "normal", label: "Hoạt động chính tạo ra giá trị" },
  c3_partners_dependency: { group: "operations", tier: "normal", label: "Đối tác và mức phụ thuộc" },
  c3_bmc_complete: { group: "bmc_coherence", tier: "gate", label: "Điền đủ và hợp lý chín ô BMC" },
  c3_bmc_no_contradiction: { group: "bmc_coherence", tier: "core", label: "Chín ô liên kết chặt, không mâu thuẫn" },
  c3_swot_complete: { group: "swot_evidence", tier: "gate", label: "SWOT đủ bốn nhóm có nội dung thật" },
  c3_swot_quantified: { group: "swot_evidence", tier: "gate", label: "Yếu tố SWOT có dữ liệu định lượng" },
  c3_weakness_honest: { group: "swot_evidence", tier: "normal", label: "Điểm yếu là điểm yếu thật" },
  c3_opportunity_sourced: { group: "swot_evidence", tier: "normal", label: "Cơ hội có nguồn kiểm chứng" },
  c3_threat_competition: { group: "swot_evidence", tier: "normal", label: "Thách thức từ đối thủ hoặc giải pháp thay thế" },
  c3_strategies_complete: { group: "strategy", tier: "core", label: "Đủ bốn loại chiến lược" },
  c3_strategy_pairing: { group: "strategy", tier: "core", label: "Chiến lược truy được về yếu tố SWOT" },
  c3_strategy_actionable: { group: "strategy", tier: "normal", label: "Chiến lược làm được, có căn cứ" },
  c3_findings_grounded: { group: "conclusion", tier: "normal", label: "Phát hiện chính cụ thể, khớp phần trên" },
  c3_feasibility_evidence: { group: "conclusion", tier: "normal", label: "Khả thi có bằng chứng, nêu điều chưa chắc" },
  c3_next_steps_actionable: { group: "conclusion", tier: "normal", label: "Bước tiếp theo cụ thể" },
} as const satisfies Record<string, Cp2CheckDef<Cp3FullGroup>>;

export type Cp3FullCheckId = keyof typeof CP3_FULL_CHECKS;
export const CP3_FULL_IDS = Object.keys(CP3_FULL_CHECKS) as Cp3FullCheckId[];

/** Weights sum to 100. Kept here so a lecturer rubric change is a one-place edit. */
export const CP3_FULL_GROUP_WEIGHTS: Record<Cp3FullGroup, number> = {
  customer_value: 20,
  money_model: 20,
  operations: 10,
  bmc_coherence: 10,
  swot_evidence: 20,
  strategy: 10,
  conclusion: 10,
};

/** Question ids of the CP3 template that the audit reads and grades (the whole template). */
export const CP3_GRADED_QUESTION_IDS: readonly string[] = cp3.phases.flatMap((phase) =>
  phase.questions.map((q) => q.question_id),
);
