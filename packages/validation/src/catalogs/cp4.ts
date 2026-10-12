import type { Template } from "./types.js";

// ---------------------------------------------------------------------------
// CP4 template — Startup Checkpoint 4 (preliminary pitch deck + financial plan).
// Phases follow the syllabus marking criteria: Team profile 10%, Product market fit 40%,
// Business model 20%, Operative 20%, Fundraising plan 10%. Phases are independent
// (no unlock chain) because the sections are written in parallel. The P&L numbers
// live in the Finance tab; this template only holds the written parts.
// ---------------------------------------------------------------------------

export const cp4: Template = {
  template_key: "cp4",
  title: "Pitch deck và kế hoạch tài chính",
  description: "Hồ sơ đội ngũ, product market fit, mô hình kinh doanh, vận hành và kế hoạch gọi vốn.",
  phases: [
    {
      id: "elevator_pitch",
      title: "Elevator Pitch 60 giây",
      unlock_requires: [],
      questions: [
        { question_id: "cp4_pitch_who", classification: "recommended" },
        { question_id: "cp4_pitch_problem_solution", classification: "recommended" },
        { question_id: "cp4_pitch_call_to_action", classification: "recommended" },
      ],
    },
    {
      id: "team_profile",
      title: "Hồ sơ đội ngũ",
      unlock_requires: [],
      questions: [
        { question_id: "cp4_team_profile", classification: "required" },
        { question_id: "cp4_vision_mission", classification: "required" },
        { question_id: "cp4_team_gap", classification: "recommended" },
      ],
    },
    {
      id: "product_market_fit",
      title: "Product market fit",
      unlock_requires: [],
      questions: [
        { question_id: "cp4_pmf_problem", classification: "required" },
        { question_id: "cp4_pmf_solution_tech", classification: "required" },
        { question_id: "cp4_pmf_market_size", classification: "required" },
        { question_id: "cp4_pmf_customer_validation", classification: "required" },
        { question_id: "cp4_pmf_competitors", classification: "required" },
        { question_id: "cp4_pmf_usp", classification: "required" },
        { question_id: "cp4_pmf_mvp_demo", classification: "required" },
        { question_id: "cp4_pmf_responsible_ai_legal", classification: "recommended" },
      ],
    },
    {
      id: "business_model",
      title: "Mô hình kinh doanh",
      unlock_requires: [],
      questions: [
        { question_id: "cp4_bm_canvas_summary", classification: "required" },
        { question_id: "cp4_bm_revenue_streams", classification: "required" },
        { question_id: "cp4_bm_unit_economics", classification: "required" },
      ],
    },
    {
      id: "operations",
      title: "Vận hành",
      unlock_requires: [],
      questions: [
        { question_id: "cp4_op_roadmap", classification: "required" },
        { question_id: "cp4_op_marketing_4p", classification: "required" },
        { question_id: "cp4_op_risks", classification: "required" },
        { question_id: "cp4_op_pl_assumptions", classification: "required" },
        { question_id: "cp4_op_break_even", classification: "required" },
        { question_id: "cp4_op_sustainability", classification: "required" },
      ],
    },
    {
      id: "fundraising",
      title: "Kế hoạch gọi vốn",
      unlock_requires: [],
      questions: [
        { question_id: "cp4_fund_path", classification: "required" },
        { question_id: "cp4_fund_ask", classification: "required" },
        { question_id: "cp4_fund_use_of_funds", classification: "required" },
        { question_id: "cp4_fund_school_support", classification: "recommended" },
      ],
    },
  ],
};
