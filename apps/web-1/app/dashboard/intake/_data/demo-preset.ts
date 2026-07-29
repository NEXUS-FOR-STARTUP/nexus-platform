import type { PresetOption } from "@/components/ui/DemoDataFAB";
import type { IntakeData } from "../_types/intake.types";

export const NEXUS_INTAKE_PRESET: IntakeData = {
  package_id: "",
  current_blocker:
    "Nhóm đã hoàn thành 4 CP với điểm tốt nhưng chưa có doanh thu thật từ 9 team đã hỗ trợ (đều miễn phí do GV chuyển đến). Cần kiểm chứng willingness-to-pay và chuyển từ Concierge MVP sang Web App MVP. Cạnh tranh với ChatGPT/Gemini đang ngày càng mạnh.",
  current_situations: [
    "Đã test MVP với khách hàng thật (9 team)",
    "Đã phỏng vấn khách hàng (25 người)",
    "Đã có quy trình audit + template + checklist",
    "Đang xây web app (Next.js + Hono + Prisma)",
    "Đã có Lean Canvas + SWOT + kế hoạch tài chính 10 quý",
    "Chưa có doanh thu",
  ],
  case_summary:
    "Nexus là dịch vụ audit và refine ý tưởng khởi nghiệp cho sinh viên EXE101. Khách hàng: team FPT gặp khó ở CP1. Pain: không biết lỗi gốc, không biết sửa gì trước. Giải pháp: audit có cấu trúc → report lỗi + hướng sửa → re-audit. Bằng chứng: 9 team cải thiện từ ~3.5 lên >=8/10. Mô hình KD: 3 gói 149K-599K, bootstrapping. Tech: Next.js 16 + Hono + Prisma + AI SDK.",
  contact: {
    full_name: "Phùng Lưu Hoàng Long",
    student_code: "SE190377",
    team_role: "Project Manager & Tech Lead",
    zalo: "",
    email: "",
    telegram: "",
  },
  team_context: {
    group_no: "13",
    project_name: "Nexus",
    team_status_summary:
      "Nhóm 6 người (3 CNPM + 3 Truyền thông ĐPT). Đã hoàn thành CP1-CP4 môn EXE101 kỳ Summer 2026. Đã hỗ trợ 9 team EXE101 cải thiện điểm CP1 từ ~3.5 lên >=8.0. Đang chuyển từ Concierge MVP sang Web App MVP.",
  },
  support_needs: {
    primary_need: "team_fit",
    extra_notes:
      "Team có đủ năng lực scale không? (3 CNPM + 3 Truyền thông). Rủi ro phụ thuộc founder. Cần thêm vai trò gì khi mở rộng? Đánh giá mô hình doanh thu 149K-599K.",
  },
  documents: [],
  lecturer_feedback:
    'CP2: "Làm web app hẳn hoi, không chỉ Google Form + Sheet". CP3: "Đừng phụ thuộc rubric — xây tiêu chí đánh giá riêng". CP4: "Không oversell — Nexus hỗ trợ, không cam kết điểm".',
  expected_outputs:
    "Báo cáo team-fit: điểm mạnh/yếu, gaps, rủi ro, vai trò cần bổ sung.",
  boundary_confirmations: ["no_nda", "self_reviewed", "agree_tos"],
  school: "FPT University HCMC",
  course_context: "EXE101 - Summer 2026",
};

export const DEMO_PRESETS: PresetOption[] = [
  {
    label: "Nexus - Nhóm 13 EXE101",
    description: "Dịch vụ audit idea khởi nghiệp cho sinh viên FPT",
    data: NEXUS_INTAKE_PRESET,
  },
];
