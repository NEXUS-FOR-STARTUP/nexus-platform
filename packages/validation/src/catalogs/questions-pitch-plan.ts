import type { Question } from "./types.js";

// Pitch deck sections 6-10: marketing, finance, team, results and funds, call to action. Same wording convention as questions-pitch.ts.

export const PITCH_PLAN_QUESTIONS = {
  // ── 6. Tiếp thị và bán hàng ───────────────────────────────────────────────

  pitch_op_marketing_4p: {
    id: "pitch_op_marketing_4p",
    text: "Kế hoạch tiếp thị và bán hàng của nhóm ra sao?",
    explanation:
      "Trả lời ngắn cho từng việc, nhất quán với khách hàng và mức giá ở các mục trước. Cần nêu:\n" +
      "- Sản phẩm, giá, kênh phân phối, truyền thông (4P)\n" +
      "- Cách bán hàng: ai bán, bán ở đâu, chốt đơn thế nào\n" +
      "- Mục tiêu số khách trong 3 tháng đầu\n" +
      "Không đạt: \"Quảng cáo Facebook và TikTok.\"\n" +
      "Đạt: \"Đăng trong hội nhóm của từng trường, tặng một lượt giữ bàn khi giới thiệu bạn. " +
      "Đặt và thanh toán trong ứng dụng. Mục tiêu 600 người dùng trong năm đầu.\"",
    suggested_actions: ["Giá ở đây khớp với dòng doanh thu đã nêu."],
  },

  // ── 7. Tài chính ──────────────────────────────────────────────────────────

  pitch_finance_summary: {
    id: "pitch_finance_summary",
    text: "Tình hình tài chính của dự án tóm lại thế nào?",
    explanation:
      "Chỉ nêu kết luận, số chi tiết nằm trong file Excel P&L. Cần nêu:\n" +
      "- Doanh thu, chi phí, lợi nhuận theo kỳ\n" +
      "- Khi nào hòa vốn\n" +
      "- Khoản lỗ lũy kế lớn nhất và vì sao chịu được\n" +
      "Không đạt: \"Dự án có lãi sau một thời gian.\"\n" +
      "Đạt: \"Doanh thu năm một 138 triệu, chi phí 180 triệu, lỗ 42 triệu. Lợi nhuận dương từ tháng 13, hòa vốn lũy kế ở tháng 26, " +
      "lỗ lũy kế lớn nhất 42 triệu, trang trải bằng vốn góp 50 triệu của nhóm.\"",
    suggested_actions: ["Các con số khớp với file Excel P&L."],
  },

  // ── 8. Đội ngũ ────────────────────────────────────────────────────────────

  pitch_team_profile: {
    id: "pitch_team_profile",
    text: "Từng thành viên phụ trách việc gì và có năng lực gì để làm việc đó?",
    explanation:
      "Mỗi thành viên một dòng, chứng minh người đó hợp với vai trò. Cần nêu:\n" +
      "- Vai trò và ngành học\n" +
      "- Kinh nghiệm hoặc thành tích liên quan\n" +
      "- Vì sao người đó phù hợp, không chỉ ghi chức danh\n" +
      "Không đạt: \"An: CEO. Bình: CTO.\"\n" +
      "Đạt: \"An, CEO, ngành Quản trị kinh doanh, từng quản lý câu lạc bộ 40 người. " +
      "Bình, CTO, ngành Kỹ thuật phần mềm, đã làm 2 ứng dụng đang có người dùng.\"",
    suggested_actions: ["Các ngành học của nhóm bổ sung cho nhau, ít nhất hai ngành khác nhau."],
  },

  pitch_team_gap: {
    id: "pitch_team_gap",
    text: "Nhóm còn thiếu năng lực gì và định bổ sung bằng cách nào?",
    explanation:
      "Nêu thẳng điểm thiếu, nhà đầu tư tin đội ngũ biết điểm yếu của mình. Cần nêu:\n" +
      "- Điểm thiếu của đội ngũ hiện tại\n" +
      "- Cách bù: tuyển thêm, nhờ cố vấn, hợp tác hay học thêm\n" +
      "- Thời điểm thực hiện\n" +
      "Không đạt: \"Nhóm không thiếu gì.\"\n" +
      "Đạt: \"Chưa có người làm bán hàng với quán. Nhờ một giảng viên cố vấn kết nối quán trong tháng này và tuyển một bạn phụ trách đối tác vào quý sau.\"",
    suggested_actions: ["Mỗi điểm thiếu có một hành động bù cụ thể và thời điểm."],
  },

  // ── 9. Kết quả đạt được và nguồn vốn ──────────────────────────────────────

  pitch_pmf_customer_validation: {
    id: "pitch_pmf_customer_validation",
    text: "Khách hàng đã phản ứng thế nào với sản phẩm?",
    explanation:
      "Nêu hành động thật của khách, không chỉ lời khen. Cần nêu:\n" +
      "- Số người dùng thử và phản hồi\n" +
      "- Tỷ lệ quay lại, số người cam kết hoặc đã trả tiền\n" +
      "- Bằng chứng nào cho thấy khách chịu trả tiền\n" +
      "Không đạt: \"Mọi người đều khen hay.\"\n" +
      "Đạt: \"40 sinh viên dùng thử trong 2 tuần, 22 người quay lại lần hai, 9 người đã mua gói thành viên thử nghiệm.\"",
    suggested_actions: ["Tách rõ lời khen với hành động thật của khách."],
  },

  pitch_pmf_mvp_demo: {
    id: "pitch_pmf_mvp_demo",
    text: "Nhóm trình bày bản thử (MVP) trong buổi pitch thế nào?",
    explanation:
      "Bản thử chỉ nên chiếm 30 đến 45 giây trong 10 phút. Gợi ý dùng clip 15 đến 20 giây, bỏ qua bước đăng nhập. Cần nêu:\n" +
      "- Clip cho thấy tính năng cốt lõi nào\n" +
      "- Clip chứng minh điều gì\n" +
      "- Phương án dự phòng nếu mạng hoặc sản phẩm lỗi\n" +
      "Không đạt: \"Demo toàn bộ ứng dụng.\"\n" +
      "Đạt: \"Clip 18 giây: chọn quán, thấy bàn trống, giữ bàn thành công. Chứng minh việc giữ bàn mất dưới 20 giây. Có sẵn clip tải về máy nếu mạng lỗi.\"",
    suggested_actions: ["Có clip dự phòng chạy được khi không có mạng."],
  },

  pitch_capital_plan: {
    id: "pitch_capital_plan",
    text: "Dự án lấy vốn từ đâu, cần bao nhiêu và dùng vào việc gì?",
    explanation:
      "Mọi nhóm đều trả lời, kể cả nhóm không nhận vốn từ bên ngoài. Cần nêu:\n" +
      "- Nguồn vốn: vốn tự có, tái đầu tư từ doanh thu, vốn góp của nhóm hoặc nhà đầu tư\n" +
      "- Số tiền và vì sao đúng số đó\n" +
      "- Dùng vào việc gì, chia theo tỷ lệ\n" +
      "Không đạt: \"Cần 500 triệu để phát triển.\"\n" +
      "Đạt: \"Nhóm góp 50 triệu tiền mặt, không nhận vốn ngoài. Số này đủ trang trải mức lỗ lũy kế lớn nhất là 42 triệu cộng 8 triệu dự phòng. " +
      "Dùng 50% sản phẩm, 30% tiếp thị, 20% vận hành.\"",
    suggested_actions: ["Số vốn đủ chống đỡ khoản lỗ lũy kế lớn nhất ở mục Tài chính."],
  },

  // ── 10. Kêu gọi hành động ─────────────────────────────────────────────────

  pitch_ask: {
    id: "pitch_ask",
    text: "Nhóm kêu gọi hội đồng và nhà đầu tư làm điều gì?",
    explanation:
      "Slide cuối chỉ nên có một việc người nghe làm được ngay. Cần nêu:\n" +
      "- Một yêu cầu cụ thể: vốn, kết nối khách hàng, cố vấn hoặc nguồn lực\n" +
      "- Con số hoặc mốc thời gian nếu có\n" +
      "- Vì sao yêu cầu này giúp dự án đi tiếp\n" +
      "Không đạt: \"Mong mọi người ủng hộ.\"\n" +
      "Đạt: \"Nhóm cần giới thiệu thêm 5 quán đối tác ở khu đại học khác trong 2 tháng tới, để thử mô hình ngoài Thủ Đức.\"",
    suggested_actions: ["Lời kêu gọi chỉ có một việc."],
  },
} satisfies Record<string, Question>;
