import type { Template } from "./types.js";

// ---------------------------------------------------------------------------
// CP1 template — Startup Checkpoint 1 (idea validation).
// Authored from E:/FPT/Semester_7/EXE101/prompt/TEMPLATE_STARTUP_CHECKPOINT1_V2.docx
// (plan ground-truth row 22). Dedup per plan section 5: §3.3 (data vs assumption)
// is merged with §7 (evidence/assumptions) into cp1_evidence_assumptions; §9 summary
// and the pre-submit checklist are DERIVED from already-answered fields, so they are
// NOT added as new questions. Core fields = required; others recommended/supplemental.
// ---------------------------------------------------------------------------

export const cp1: Template = {
  template_key: "cp1",
  title: "Startup Checkpoint 1 — Mô tả ý tưởng",
  phases: [
    {
      id: "thong_tin_nhom",
      title: "Thông tin nhóm",
      unlock_requires: [],
      questions: [
        { question_id: "cp1_team_name", classification: "recommended" },
        { question_id: "cp1_team_members", classification: "recommended" },
        { question_id: "cp1_idea_name", classification: "required" },
      ],
    },
    {
      id: "khach_hang_muc_tieu",
      title: "Khách hàng mục tiêu",
      unlock_requires: [],
      questions: [
        { question_id: "cp1_primary_customer", classification: "required" },
        { question_id: "cp1_non_priority_customer", classification: "recommended" },
        { question_id: "cp1_role_breakdown", classification: "recommended" },
      ],
    },
    {
      id: "cau_chuyen_khach_hang",
      title: "Câu chuyện khách hàng",
      unlock_requires: ["cp1_primary_customer"],
      questions: [
        { question_id: "cp1_customer_story", classification: "recommended" },
      ],
    },
    {
      id: "pain_point",
      title: "Pain Point",
      unlock_requires: ["cp1_primary_customer"],
      questions: [
        { question_id: "cp1_main_problem", classification: "required" },
        { question_id: "cp1_problem_severity", classification: "required" },
      ],
    },
    {
      id: "cach_giai_quyet_hien_tai",
      title: "Cách khách hàng đang giải quyết hiện tại",
      unlock_requires: ["cp1_main_problem"],
      questions: [
        { question_id: "cp1_current_alternatives", classification: "required" },
        { question_id: "cp1_alternatives_analysis", classification: "recommended" },
        { question_id: "cp1_required_improvement", classification: "required" },
      ],
    },
    {
      id: "giai_phap",
      title: "Giải pháp",
      unlock_requires: ["cp1_main_problem"],
      questions: [
        { question_id: "cp1_solution_description", classification: "required" },
        { question_id: "cp1_solution_mechanism", classification: "required" },
        { question_id: "cp1_core_features", classification: "recommended" },
        { question_id: "cp1_out_of_scope", classification: "recommended" },
      ],
    },
    {
      id: "mvp",
      title: "MVP / Bản thử nghiệm đầu tiên",
      unlock_requires: ["cp1_solution_description"],
      questions: [
        { question_id: "cp1_riskiest_assumption", classification: "required" },
        { question_id: "cp1_mvp_definition", classification: "required" },
        { question_id: "cp1_mvp_test_plan", classification: "required" },
        { question_id: "cp1_mvp_pass_fail", classification: "required" },
      ],
    },
    {
      id: "bang_chung_gia_dinh",
      title: "Bằng chứng và giả định",
      unlock_requires: [],
      questions: [
        { question_id: "cp1_evidence_assumptions", classification: "required" },
      ],
    },
    {
      id: "mo_hinh_doanh_thu",
      title: "Mô hình doanh thu dự kiến",
      unlock_requires: ["cp1_solution_description"],
      questions: [
        { question_id: "cp1_revenue_model", classification: "recommended" },
      ],
    },
  ],
};
