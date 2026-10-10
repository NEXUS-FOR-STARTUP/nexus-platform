import type { Template } from "./types.js";

// ---------------------------------------------------------------------------
// CP2 template — Startup Checkpoint 2 (market research + paired debate).
// Authored from plan section 9 only (the reconciled rubric: 5 phases + cross-cutting
// mandatory items + debate prep). No rubric content is invented here.
// Auto-fail items (2 expert interviews ≥6 months, survey ≥100 respondents, AI
// disclosure statement) are classification "required".
// ---------------------------------------------------------------------------

export const cp2: Template = {
  template_key: "cp2",
  title: "Nghiên cứu thị trường và chuẩn bị debate",
  description: "Nghiên cứu thị trường, khách hàng và chuẩn bị debate.",
  cover_image: "/cp2.png",
  phases: [
    {
      id: "tong_quan_y_tuong",
      title: "Tổng quan ý tưởng & cơ hội",
      unlock_requires: [],
      questions: [
        { question_id: "cp2_problem_need", classification: "required" },
        { question_id: "cp2_solution", classification: "required" },
        { question_id: "cp2_opportunity", classification: "required" },
        { question_id: "cp2_vpc_customer_profile", classification: "required" },
        { question_id: "cp2_vpc_value_map", classification: "required" },
      ],
    },
    {
      id: "customer_discovery",
      title: "Khám phá khách hàng (Customer Discovery)",
      unlock_requires: ["cp2_problem_need"],
      questions: [
        { question_id: "cp2_research_objectives", classification: "required" },
        { question_id: "cp2_customer_discovery_process", classification: "required" },
        { question_id: "cp2_expert_interviews", classification: "required" },
        { question_id: "cp2_survey", classification: "required" },
        { question_id: "cp2_question_bank", classification: "recommended" },
        { question_id: "cp2_pain_point_interviews", classification: "supplemental" },
      ],
    },
    {
      id: "quy_mo_thi_truong",
      title: "Quy mô thị trường & cấu trúc",
      unlock_requires: ["cp2_research_objectives"],
      questions: [
        { question_id: "cp2_tam_sam_som", classification: "required" },
        { question_id: "cp2_porters_five_forces", classification: "required" },
        { question_id: "cp2_competitive_analysis", classification: "required" },
        { question_id: "cp2_invisible_competitors", classification: "required" },
        { question_id: "cp2_competitor_criteria_table", classification: "supplemental" },
      ],
    },
    {
      id: "mvp_demo",
      title: "Trình diễn MVP & vòng lặp tinh chỉnh",
      unlock_requires: ["cp2_solution"],
      questions: [
        { question_id: "cp2_mvp_demo", classification: "required" },
        { question_id: "cp2_iteration_refinement", classification: "required" },
        { question_id: "cp2_surprises_pivot", classification: "required" },
      ],
    },
    {
      id: "pmf_4p",
      title: "PMF ban đầu & 4P",
      unlock_requires: ["cp2_mvp_demo"],
      questions: [
        { question_id: "cp2_pmf_signals", classification: "required" },
        { question_id: "cp2_marketing_4p", classification: "required" },
      ],
    },
    {
      id: "cross_cutting",
      title: "Yêu cầu bắt buộc của báo cáo",
      unlock_requires: [],
      questions: [
        { question_id: "cp2_ai_disclosure", classification: "required" },
        { question_id: "cp2_harvard_referencing", classification: "required" },
        { question_id: "cp2_appendix", classification: "required" },
        { question_id: "cp2_format", classification: "required" },
      ],
    },
    {
      id: "debate_prep",
      title: "Chuẩn bị phản biện (Debate)",
      unlock_requires: ["cp2_expert_interviews"],
      questions: [
        { question_id: "cp2_debate_defense", classification: "recommended" },
        { question_id: "cp2_debate_attack", classification: "recommended" },
      ],
    },
  ],
};
