import type { Template } from "./types.js";

// ---------------------------------------------------------------------------
// CP3 template — Startup Checkpoint 3 (MVP + UX/UI, Business Model Canvas, SWOT).
// Structure follows the lecturer's guide "HƯỚNG DẪN MVP_BMC_SWOT": MVP/UX 30%,
// BMC 30%, SWOT with quantitative data and S-O/S-T/W-O/W-T strategies. The
// conclusion phase follows the Nexus CP3 report. Every question is
// independent (no unlock chain) because the three parts are written in parallel.
// ---------------------------------------------------------------------------

export const cp3: Template = {
  template_key: "cp3",
  title: "MVP, mô hình kinh doanh và SWOT",
  description: "Demo MVP và UX/UI, Business Model Canvas, phân tích SWOT và chiến lược.",
  phases: [
    {
      id: "mvp_ux_ui",
      title: "MVP và trải nghiệm người dùng (UX/UI)",
      unlock_requires: [],
      questions: [
        { question_id: "cp3_mvp_problem_pitch", classification: "required" },
        { question_id: "cp3_mvp_demo_script", classification: "required" },
        { question_id: "cp3_user_persona", classification: "required" },
        { question_id: "cp3_user_flow", classification: "required" },
        { question_id: "cp3_wireframe", classification: "required" },
        { question_id: "cp3_mockup", classification: "required" },
        { question_id: "cp3_ux_logic", classification: "required" },
      ],
    },
    {
      id: "business_model_canvas",
      title: "Mô hình kinh doanh (Business Model Canvas)",
      unlock_requires: [],
      questions: [
        { question_id: "cp3_bmc_customer_segments", classification: "required" },
        { question_id: "cp3_bmc_value_proposition", classification: "required" },
        { question_id: "cp3_bmc_channels", classification: "required" },
        { question_id: "cp3_bmc_customer_relationships", classification: "required" },
        { question_id: "cp3_bmc_revenue_streams", classification: "required" },
        { question_id: "cp3_bmc_key_resources", classification: "required" },
        { question_id: "cp3_bmc_key_activities", classification: "required" },
        { question_id: "cp3_bmc_key_partners", classification: "required" },
        { question_id: "cp3_bmc_cost_structure", classification: "required" },
      ],
    },
    {
      id: "swot",
      title: "Phân tích SWOT",
      unlock_requires: [],
      questions: [
        { question_id: "cp3_swot_strengths", classification: "required" },
        { question_id: "cp3_swot_weaknesses", classification: "required" },
        { question_id: "cp3_swot_opportunities", classification: "required" },
        { question_id: "cp3_swot_threats", classification: "required" },
      ],
    },
    {
      id: "chien_luoc_swot",
      title: "Chiến lược từ SWOT",
      unlock_requires: [],
      questions: [
        { question_id: "cp3_strategy_so", classification: "required" },
        { question_id: "cp3_strategy_st", classification: "required" },
        { question_id: "cp3_strategy_wo", classification: "required" },
        { question_id: "cp3_strategy_wt", classification: "required" },
      ],
    },
    {
      id: "ket_luan",
      title: "Kết luận",
      unlock_requires: [],
      questions: [
        { question_id: "cp3_key_findings", classification: "recommended" },
        { question_id: "cp3_business_feasibility", classification: "recommended" },
        { question_id: "cp3_future_development", classification: "recommended" },
      ],
    },
  ],
};
