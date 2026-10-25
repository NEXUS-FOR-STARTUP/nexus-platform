import type { Template } from "./types.js";

// ---------------------------------------------------------------------------
// CP4 template — financial plan. Three independent phases (no unlock chain):
// revenue and price, P&L assumptions + survival plan, sources of funds.
// The P&L numbers live in the Excel P&L file; this template only holds the written
// conclusions. Pitch content lives in pitch.ts.
// ---------------------------------------------------------------------------

export const cp4: Template = {
  template_key: "cp4",
  title: "Kế hoạch tài chính",
  description: "Doanh thu và giá, giả định P&L, điểm hòa vốn, kế hoạch sinh tồn và nguồn vốn.",
  phases: [
    {
      id: "revenue",
      title: "Doanh thu và giá",
      unlock_requires: [],
      questions: [
        { question_id: "cp4_bm_revenue_streams", classification: "required" },
        { question_id: "cp4_bm_unit_economics", classification: "required" },
      ],
    },
    {
      id: "sustainability",
      title: "Giả định và sinh tồn",
      unlock_requires: [],
      questions: [
        { question_id: "cp4_op_pl_assumptions", classification: "required" },
        { question_id: "cp4_op_break_even", classification: "required" },
        { question_id: "cp4_op_sustainability", classification: "required" },
      ],
    },
    {
      id: "funding",
      title: "Nguồn vốn (tuỳ chọn)",
      unlock_requires: [],
      questions: [
        { question_id: "cp4_fund_track", classification: "supplemental" },
        { question_id: "cp4_fund_path", classification: "supplemental" },
        { question_id: "cp4_fund_ask", classification: "supplemental" },
        { question_id: "cp4_fund_use_of_funds", classification: "supplemental" },
        { question_id: "cp4_fund_school_support", classification: "supplemental" },
      ],
    },
  ],
};
