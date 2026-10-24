import type { Template } from "./types.js";

// ---------------------------------------------------------------------------
// Pitch deck template — the 10 sections of the demo pitch (10 minutes), the 60-second
// elevator pitch and a Q&A rehearsal. One phase per slide so the docx reads as a
// slide-by-slide script; the team builds its own deck from it. Phases are independent
// (no unlock chain). Phase titles carry no number: the docx generator prefixes
// "Phần n:", so the first ten phases already match sections 1-10 of the pitch.
// ---------------------------------------------------------------------------

export const pitch: Template = {
  template_key: "pitch",
  title: "Pitch deck",
  description: "Nội dung bài pitch 10 mục, elevator pitch 60 giây và chuẩn bị hỏi đáp.",
  phases: [
    {
      id: "intro",
      title: "Giới thiệu dự án",
      unlock_requires: [],
      questions: [{ question_id: "pitch_vision_mission", classification: "required" }],
    },
    {
      id: "problem",
      title: "Vấn đề và khách hàng",
      unlock_requires: [],
      questions: [{ question_id: "pitch_pmf_problem", classification: "required" }],
    },
    {
      id: "solution",
      title: "Giải pháp và công nghệ",
      unlock_requires: [],
      questions: [
        { question_id: "pitch_pmf_solution_tech", classification: "required" },
        { question_id: "pitch_pmf_usp", classification: "required" },
        { question_id: "pitch_pmf_responsible_ai_legal", classification: "recommended" },
      ],
    },
    {
      id: "market",
      title: "Thị trường và đối thủ",
      unlock_requires: [],
      questions: [
        { question_id: "pitch_pmf_market_size", classification: "required" },
        { question_id: "pitch_pmf_competitors", classification: "required" },
      ],
    },
    {
      id: "business_model",
      title: "Mô hình kinh doanh",
      unlock_requires: [],
      questions: [
        { question_id: "pitch_bm_canvas_summary", classification: "required" },
        { question_id: "pitch_bm_revenue", classification: "required" },
      ],
    },
    {
      id: "marketing",
      title: "Tiếp thị và bán hàng",
      unlock_requires: [],
      questions: [{ question_id: "pitch_op_marketing_4p", classification: "required" }],
    },
    {
      id: "finance",
      title: "Tài chính",
      unlock_requires: [],
      questions: [{ question_id: "pitch_finance_summary", classification: "required" }],
    },
    {
      id: "team",
      title: "Đội ngũ",
      unlock_requires: [],
      questions: [
        { question_id: "pitch_team_profile", classification: "required" },
        { question_id: "pitch_team_gap", classification: "recommended" },
      ],
    },
    {
      id: "results_funds",
      title: "Kết quả đạt được và nguồn vốn",
      unlock_requires: [],
      questions: [
        { question_id: "pitch_pmf_customer_validation", classification: "required" },
        { question_id: "pitch_pmf_mvp_demo", classification: "recommended" },
        { question_id: "pitch_capital_plan", classification: "required" },
      ],
    },
    {
      id: "ask",
      title: "Kêu gọi hành động",
      unlock_requires: [],
      questions: [{ question_id: "pitch_ask", classification: "required" }],
    },
    {
      id: "elevator",
      title: "Phụ lục A. Elevator pitch 60 giây",
      unlock_requires: [],
      questions: [
        { question_id: "pitch_who", classification: "recommended" },
        { question_id: "pitch_problem_solution", classification: "recommended" },
        { question_id: "pitch_call_to_action", classification: "recommended" },
      ],
    },
    {
      id: "extra",
      title: "Phụ lục B. Bổ sung cho bài nộp",
      unlock_requires: [],
      questions: [
        { question_id: "pitch_op_roadmap", classification: "recommended" },
        { question_id: "pitch_op_risks", classification: "recommended" },
      ],
    },
    {
      id: "qa",
      title: "Phụ lục C. Chuẩn bị hỏi đáp",
      unlock_requires: [],
      questions: [
        { question_id: "pitch_qa_team", classification: "supplemental" },
        { question_id: "pitch_qa_market", classification: "supplemental" },
        { question_id: "pitch_qa_model", classification: "supplemental" },
        { question_id: "pitch_qa_operation", classification: "supplemental" },
        { question_id: "pitch_qa_funding", classification: "supplemental" },
      ],
    },
  ],
};
