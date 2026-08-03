import type { PresetOption } from "@/components/ui/DemoDataFAB";

export const NEXUS_PRESET = {
  blanks: {
    projectName: "Nexus",
    field: "EdTech - Hỗ trợ khởi nghiệp",
    targetCustomer:
      "team sinh viên FPT học EXE101 gặp khó khăn ở Checkpoint 1 (chưa có idea, idea mơ hồ, hoặc đã rớt CP1)",
    problem:
      "không biết lỗi gốc của ý tưởng nằm ở đâu và không biết sửa phần nào trước — ChatGPT chung chung, bạn bè thiếu nhất quán, giảng viên quá bận",
    solution:
      "dịch vụ audit ý tưởng có cấu trúc: nhận tài liệu, chỉ ra lỗi gốc và thứ tự ưu tiên sửa, re-audit sau mỗi lần team chỉnh sửa — không làm bài hộ, không chọn idea thay",
    mvp: "Concierge MVP (Google Form + Sheet + Zalo + AI prompt nội bộ) — đã test 9 team, điểm CP1 từ ~3.5 lên >=8/10",
  },
  members: [
    {
      major: "Công nghệ phần mềm",
      strengths: ["quản lý dự án", "full-stack development", "thiết kế kiến trúc hệ thống", "thiết kế database", "AI prompt engineering"],
      experience: ["Project Manager & Tech Lead Nexus", "xây dựng quy trình audit", "trực tiếp hỗ trợ 9 team EXE101"],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: ["full-stack development", "bảo mật hệ thống", "kiểm tra an ninh ứng dụng"],
      experience: ["Technical Member Nexus", "phát triển hệ thống", "phụ trách bảo mật"],
    },
    {
      major: "Truyền thông đa phương tiện",
      strengths: ["sáng tạo nội dung", "phân tích thị trường", "lập kế hoạch marketing", "thiết kế Canva"],
      experience: ["Marketing Member Nexus", "phỏng vấn khách hàng EXE101"],
    },
    {
      major: "Truyền thông đa phương tiện",
      strengths: ["nghiên cứu thị trường", "phân tích customer insight", "content marketing", "social media"],
      experience: ["Marketing Member Nexus", "thực hiện 16/25 cuộc phỏng vấn sâu"],
    },
    {
      major: "Truyền thông đa phương tiện",
      strengths: ["lập kế hoạch ngân sách", "phân tích dữ liệu tài chính", "hỗ trợ sales", "tổ chức sự kiện"],
      experience: ["Finance Member Nexus", "xây dựng P&L và dự báo tài chính 10 quý"],
    },
    {
      major: "Công nghệ phần mềm",
      strengths: ["thiết kế visual", "thiết kế logo banner", "Figma", "Canva", "PowerPoint"],
      experience: ["Design Member Nexus", "thiết kế visual identity và slide pitch deck"],
    },
  ],
};

export const DEMO_PRESETS: PresetOption[] = [
  {
    label: "Nexus - Nhóm 13 EXE101",
    description: "Dịch vụ audit idea khởi nghiệp cho sinh viên FPT",
    data: NEXUS_PRESET,
  },
];
