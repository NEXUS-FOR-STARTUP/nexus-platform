/**
 * CP2 audit criteria. The ids mirror the tables in
 * `data/system-prompts/cp2_full_review_v1.md` and `cp2_questionnaire_review_v1.md`
 * (a test keeps them in sync). The model decides each criterion's status;
 * `scoreCp2Report` computes scores and verdicts from these constants.
 */
export type Cp2Tier = "gate" | "core" | "normal";
export type Cp2FullGroup = "evidence" | "market" | "customer" | "product" | "competition" | "compliance";
export type Cp2QuestionnaireGroup = "alignment" | "interview" | "survey" | "ethics";

export interface Cp2CheckDef<G extends string> {
  group: G;
  tier: Cp2Tier;
  label: string;
}

export const CP2_FULL_CHECKS = {
  fr_problem_situation: { group: "customer", tier: "normal", label: "Vấn đề và tình huống" },
  fr_segment_narrow: { group: "customer", tier: "core", label: "Khách hàng mục tiêu đủ hẹp" },
  fr_vpc_grounded: { group: "customer", tier: "normal", label: "Hồ sơ khách hàng dẫn từ dữ liệu" },
  fr_value_map_fit: { group: "customer", tier: "normal", label: "Bản đồ giá trị khớp hồ sơ khách hàng" },
  fr_research_questions: { group: "evidence", tier: "normal", label: "Câu hỏi nghiên cứu" },
  fr_interview_scale_method: { group: "evidence", tier: "core", label: "Quy mô và phương pháp phỏng vấn" },
  fr_interview_quality: { group: "evidence", tier: "core", label: "Chất lượng phỏng vấn" },
  fr_insight_traceable: { group: "evidence", tier: "normal", label: "Insight truy được về dữ liệu" },
  fr_expert_gate: { group: "evidence", tier: "gate", label: "Phỏng vấn chuyên gia đạt mức tối thiểu" },
  fr_expert_learning: { group: "evidence", tier: "normal", label: "Điều học được từ chuyên gia" },
  fr_survey_gate: { group: "evidence", tier: "gate", label: "Khảo sát đạt mức tối thiểu" },
  fr_survey_design: { group: "evidence", tier: "normal", label: "Thiết kế khảo sát" },
  fr_survey_sampling: { group: "evidence", tier: "normal", label: "Mẫu khảo sát và giới hạn kết luận" },
  fr_hypothesis_validation: { group: "evidence", tier: "core", label: "Kiểm chứng giả thuyết ban đầu" },
  fr_tam_sam: { group: "market", tier: "normal", label: "TAM và SAM" },
  fr_som_bottom_up: { group: "market", tier: "core", label: "SOM tính từ dưới lên" },
  fr_som_rates: { group: "market", tier: "core", label: "Tỷ lệ chuyển đổi có căn cứ" },
  fr_calc_consistency: { group: "market", tier: "core", label: "Phép tính nhất quán" },
  fr_no_example_copy: { group: "market", tier: "normal", label: "Không chép số liệu ví dụ" },
  fr_five_forces: { group: "competition", tier: "normal", label: "Năm lực cạnh tranh" },
  fr_competitor_framework: { group: "competition", tier: "normal", label: "Bốn nhóm đối thủ" },
  fr_invisible_competitors: { group: "competition", tier: "normal", label: "Đối thủ vô hình" },
  fr_mvp_evidence: { group: "product", tier: "normal", label: "MVP và minh chứng" },
  fr_iteration_traceable: { group: "product", tier: "normal", label: "Tinh chỉnh theo phản hồi" },
  fr_pivot_honest: { group: "product", tier: "normal", label: "Bất ngờ và quyết định pivot" },
  fr_pmf_signals: { group: "product", tier: "normal", label: "Tín hiệu PMF" },
  fr_4p_grounded: { group: "product", tier: "normal", label: "4P có căn cứ" },
  fr_ai_disclosure: { group: "compliance", tier: "gate", label: "Công bố dùng AI" },
  fr_harvard: { group: "compliance", tier: "normal", label: "Trích dẫn Harvard" },
  fr_appendix: { group: "compliance", tier: "normal", label: "Phụ lục" },
} as const satisfies Record<string, Cp2CheckDef<Cp2FullGroup>>;

export const CP2_QUESTIONNAIRE_CHECKS = {
  qr_research_link: { group: "alignment", tier: "normal", label: "Câu hỏi bám câu hỏi nghiên cứu" },
  qr_target_screening: { group: "alignment", tier: "core", label: "Đúng người, tìm được người" },
  qr_analysis_plan: { group: "alignment", tier: "normal", label: "Kế hoạch dùng dữ liệu" },
  qr_past_behavior: { group: "interview", tier: "core", label: "Phỏng vấn hỏi hành vi đã xảy ra" },
  qr_no_pitch_no_lead: { group: "interview", tier: "core", label: "Không dẫn dắt, không chào hàng" },
  qr_commitment_probe: { group: "interview", tier: "normal", label: "Có bước kiểm tra cam kết" },
  qr_expert_plan: { group: "interview", tier: "normal", label: "Kế hoạch phỏng vấn chuyên gia" },
  qr_survey_minimum: { group: "survey", tier: "gate", label: "Mức tối thiểu của rubric khảo sát" },
  qr_wording: { group: "survey", tier: "normal", label: "Câu chữ khảo sát" },
  qr_scales: { group: "survey", tier: "normal", label: "Thang đo" },
  qr_options: { group: "survey", tier: "normal", label: "Phương án lựa chọn" },
  qr_ethics_pilot: { group: "ethics", tier: "normal", label: "Đồng thuận và thử trước" },
} as const satisfies Record<string, Cp2CheckDef<Cp2QuestionnaireGroup>>;

export const CP2_FULL_GROUP_WEIGHTS: Record<Cp2FullGroup, number> = {
  evidence: 30,
  market: 20,
  customer: 15,
  product: 15,
  competition: 10,
  compliance: 10,
};

export const CP2_QUESTIONNAIRE_GROUP_WEIGHTS: Record<Cp2QuestionnaireGroup, number> = {
  alignment: 30,
  interview: 35,
  survey: 25,
  ethics: 10,
};

/** Verdict labels, best to worst, per report kind. */
export const CP2_VERDICTS = {
  full: { ready: "SẴN SÀNG BẢO VỆ", needs_work: "CẦN BỔ SUNG", blocked: "CHƯA ĐỦ YÊU CẦU BẮT BUỘC" },
  questionnaire: { ready: "SẴN SÀNG ĐI KHẢO SÁT", needs_work: "CẦN SỬA TRƯỚC KHI PHÁT", blocked: "CHƯA NÊN PHÁT" },
} as const;

export type Cp2ReportKind = keyof typeof CP2_VERDICTS;

/** `schema` value written by the model in report.json -> how it is checked and scored. */
export const CP2_SCHEMAS = {
  cp2_questionnaire_v1: {
    kind: "questionnaire",
    checks: CP2_QUESTIONNAIRE_CHECKS as Record<string, Cp2CheckDef<string>>,
    weights: CP2_QUESTIONNAIRE_GROUP_WEIGHTS as Record<string, number>,
  },
  cp2_full_v1: {
    kind: "full",
    checks: CP2_FULL_CHECKS as Record<string, Cp2CheckDef<string>>,
    weights: CP2_FULL_GROUP_WEIGHTS as Record<string, number>,
  },
  cp2_full_resubmit_v1: {
    kind: "full",
    checks: CP2_FULL_CHECKS as Record<string, Cp2CheckDef<string>>,
    weights: CP2_FULL_GROUP_WEIGHTS as Record<string, number>,
  },
} as const;

export type Cp2SchemaId = keyof typeof CP2_SCHEMAS;
export const CP2_SCHEMA_IDS = Object.keys(CP2_SCHEMAS) as [Cp2SchemaId, ...Cp2SchemaId[]];
