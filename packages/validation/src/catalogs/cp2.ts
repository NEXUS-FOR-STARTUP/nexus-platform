import type { Template } from "./types.js";

// ---------------------------------------------------------------------------
// CP2 template — Startup Checkpoint 2 (market research), Fall26 standard.
// Audit gate: 2 direct interviews (expert or target customer). Survey is optional.
// Not asked: AI disclosure, Harvard references, appendix, report format, Porter's
// five forces, debate prep — none are graded, so none are in the template.
// ---------------------------------------------------------------------------

export const cp2: Template = {
  template_key: "cp2",
  title: "Nghiên cứu thị trường",
  description: "Nghiên cứu thị trường và khách hàng.",
  cover_image: "/cp2.png",
  phases: [
    {
      id: "tong_quan_y_tuong",
      title: "Tổng quan ý tưởng và cơ hội",
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
      title: "Khám phá khách hàng",
      unlock_requires: ["cp2_problem_need"],
      questions: [
        { question_id: "cp2_research_objectives", classification: "required" },
        { question_id: "cp2_customer_discovery_process", classification: "required" },
        { question_id: "cp2_expert_interviews", classification: "required" },
        { question_id: "cp2_survey", classification: "recommended" },
        { question_id: "cp2_question_bank", classification: "recommended" },
        { question_id: "cp2_pain_point_interviews", classification: "supplemental" },
      ],
    },
    {
      id: "quy_mo_thi_truong",
      title: "Quy mô và cấu trúc thị trường",
      unlock_requires: ["cp2_research_objectives"],
      questions: [
        { question_id: "cp2_tam_sam_som", classification: "required" },
        { question_id: "cp2_competitive_analysis", classification: "required" },
        { question_id: "cp2_invisible_competitors", classification: "required" },
        { question_id: "cp2_competitor_criteria_table", classification: "supplemental" },
      ],
    },
    {
      id: "phan_hoi_dieu_chinh",
      title: "Phản hồi và điều chỉnh",
      unlock_requires: ["cp2_solution"],
      questions: [
        { question_id: "cp2_iteration_refinement", classification: "required" },
        { question_id: "cp2_surprises_pivot", classification: "required" },
      ],
    },
    {
      id: "pmf_4p",
      title: "Product-Market Fit và 4P",
      unlock_requires: ["cp2_iteration_refinement"],
      questions: [
        { question_id: "cp2_pmf_signals", classification: "required" },
        { question_id: "cp2_marketing_4p", classification: "required" },
      ],
    },
  ],
};
