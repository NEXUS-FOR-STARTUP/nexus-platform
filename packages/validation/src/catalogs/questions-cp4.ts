import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// CP4 questions — Startup Checkpoint 4 (preliminary pitch deck + financial plan).
// Grouped by the syllabus marking criteria: Team profile 10%, Product market fit 40%,
// Business model 20%, Operative 20%, Fundraising plan 10%, plus a 60-second elevator pitch.
// Numbers (P&L) are NOT asked here: the team computes them in the Finance tab and only
// writes conclusions in words. Same wording convention as questions.ts.
// ---------------------------------------------------------------------------

export const CP4_QUESTIONS = {
  // ── Elevator Pitch 60 giây ───────────────────────────────────────────────

  cp4_pitch_who: {
    id: "cp4_pitch_who",
    text: "Elevator Pitch — Nhóm là ai và đang làm gì?",
    explanation:
      "Một đến hai câu mở đầu: tên dự án, nhóm khách hàng chính và lĩnh vực. " +
      "Người nghe phải biết dự án thuộc loại gì ngay câu đầu tiên.",
    suggested_actions: ["Đọc to trong 10 giây mà không vấp."],
  },

  cp4_pitch_problem_solution: {
    id: "cp4_pitch_problem_solution",
    text: "Elevator Pitch — Vấn đề là gì và nhóm giải quyết bằng cách nào?",
    explanation:
      "Hai đến ba câu: nỗi đau của khách hàng (kèm một con số nếu có) và cách giải quyết khác biệt của nhóm. " +
      "Không dùng thuật ngữ mà người ngoài ngành không hiểu.",
    suggested_actions: ["Một người không thuộc ngành của bạn đọc xong vẫn nhắc lại được vấn đề."],
  },

  cp4_pitch_call_to_action: {
    id: "cp4_pitch_call_to_action",
    text: "Elevator Pitch — Nhóm kêu gọi người nghe làm gì?",
    explanation:
      "Một câu cuối: mong muốn cụ thể ở người nghe, ví dụ góp ý, giới thiệu khách hàng, kết nối cố vấn hoặc hỗ trợ nguồn lực. " +
      "Tổng cả ba phần của Elevator Pitch khoảng 60 giây.",
    suggested_actions: ["Lời kêu gọi chỉ có một việc, người nghe làm được ngay."],
  },

  // ── Hồ sơ đội ngũ (10%) ──────────────────────────────────────────────────

  cp4_team_profile: {
    id: "cp4_team_profile",
    text: "Từng thành viên phụ trách việc gì và có năng lực gì để làm việc đó?",
    explanation:
      "Mỗi thành viên một dòng: vai trò (CEO, CTO, CMO...), ngành học, kinh nghiệm hoặc thành tích liên quan. " +
      "Ghi rõ vì sao người đó phù hợp với vai trò, không chỉ ghi chức danh.",
    suggested_actions: ["Các ngành học của nhóm bổ sung cho nhau, ít nhất hai ngành khác nhau."],
  },

  cp4_vision_mission: {
    id: "cp4_vision_mission",
    text: "Tầm nhìn và sứ mệnh của dự án là gì?",
    explanation:
      "- Tầm nhìn: dự án muốn thay đổi điều gì sau 3 đến 5 năm\n" +
      "- Sứ mệnh: mỗi ngày nhóm làm gì để tiến tới tầm nhìn đó\n" +
      "Mỗi mục một đến hai câu, cụ thể, không dùng khẩu hiệu chung chung.",
    suggested_actions: ["Tầm nhìn nhất quán với vấn đề và nhóm khách hàng đã chọn."],
  },

  cp4_team_gap: {
    id: "cp4_team_gap",
    text: "Nhóm còn thiếu năng lực gì và định bổ sung bằng cách nào?",
    explanation:
      "Nêu thẳng điểm thiếu của đội ngũ hiện tại và cách bù: tuyển thêm, nhờ cố vấn, hợp tác hay học thêm. " +
      "Nhà đầu tư tin đội ngũ nhận ra điểm yếu của mình hơn đội ngũ nói mình không có điểm yếu.",
    suggested_actions: ["Mỗi điểm thiếu có một hành động bù cụ thể và thời điểm thực hiện."],
  },

  // ── Product market fit (40%) ─────────────────────────────────────────────

  cp4_pmf_problem: {
    id: "cp4_pmf_problem",
    text: "Vấn đề của khách hàng là gì và bằng chứng nào cho thấy vấn đề thật sự có?",
    explanation:
      "Nêu vấn đề, ai gặp, mức nghiêm trọng, và bằng chứng từ khảo sát hoặc phỏng vấn đã làm ở CP2 " +
      "(số người tham gia, tỷ lệ trả lời, trích dẫn tiêu biểu).",
    suggested_actions: ["Có ít nhất một con số khảo sát hoặc phỏng vấn đi kèm."],
  },

  cp4_pmf_solution_tech: {
    id: "cp4_pmf_solution_tech",
    text: "Giải pháp và công nghệ nhóm dùng là gì, và vì sao là lựa chọn phù hợp?",
    explanation:
      "- Giải pháp giải quyết vấn đề trên bằng cơ chế nào\n" +
      "- Công nghệ và công cụ chính, kèm lý do chọn\n" +
      "- Phần nào nhóm tự làm, phần nào dùng dịch vụ có sẵn",
    suggested_actions: ["Người nghe không chuyên kỹ thuật vẫn hiểu giải pháp hoạt động ra sao."],
  },

  cp4_pmf_market_size: {
    id: "cp4_pmf_market_size",
    text: "Quy mô thị trường (TAM, SAM, SOM) và khả năng mở rộng (scale-up) ra sao?",
    explanation:
      "- TAM, SAM, SOM kèm cách tính và nguồn dữ liệu\n" +
      "- SAM nên tính từ dưới lên (bottom-up) từ nhóm khách hàng nhóm thật sự tiếp cận được\n" +
      "- Dự án mở rộng sang phân khúc, địa phương hay sản phẩm nào tiếp theo\n" +
      "Giả định phải nhất quán với doanh thu ở phần Mô hình kinh doanh.",
    suggested_actions: ["Mỗi con số có nguồn hoặc phép tính, không ghi số tròn không căn cứ."],
  },

  cp4_pmf_customer_validation: {
    id: "cp4_pmf_customer_validation",
    text: "Khách hàng đã phản ứng thế nào với sản phẩm (kiểm chứng, dùng thử, sẵn sàng trả tiền)?",
    explanation:
      "Nêu kết quả thực tế: số người dùng thử, phản hồi, tỷ lệ quay lại, số người cam kết hoặc đã trả tiền. " +
      "Hội đồng thường hỏi: bằng chứng nào cho thấy khách hàng chịu trả tiền?",
    suggested_actions: ["Tách rõ lời khen với hành động thật của khách hàng."],
  },

  cp4_pmf_competitors: {
    id: "cp4_pmf_competitors",
    text: "Đối thủ và giải pháp thay thế là gì, nhóm khác họ ở điểm nào?",
    explanation:
      "Liệt kê đối thủ trực tiếp, gián tiếp và cách khách hàng đang tự xoay xở. " +
      "So sánh theo một vài tiêu chí khách hàng quan tâm, rồi nêu vị trí của nhóm.",
    suggested_actions: ["Có cả đối thủ vô hình (khách hàng không dùng gì hoặc dùng cách thủ công)."],
  },

  cp4_pmf_usp: {
    id: "cp4_pmf_usp",
    text: "Lợi thế khác biệt (USP) của nhóm là gì và vì sao khó bị sao chép?",
    explanation:
      "Một câu USP rõ ràng, kèm lý do nhóm có lợi thế này: dữ liệu, công nghệ, quan hệ, quy trình hoặc thời điểm. " +
      "Nếu rào cản thấp, nêu cách nhóm đi trước.",
    suggested_actions: ["Đối thủ lớn hơn đọc USP vẫn khó làm theo trong một năm."],
  },

  cp4_pmf_mvp_demo: {
    id: "cp4_pmf_mvp_demo",
    text: "Kịch bản demo MVP trong buổi pitch?",
    explanation:
      "MVP chỉ nên chiếm 30 đến 45 giây trong 10 phút pitch. Gợi ý: dùng clip 15 đến 20 giây, không demo bước đăng nhập. " +
      "Ghi rõ clip cho thấy tính năng cốt lõi nào và chứng minh điều gì.",
    suggested_actions: ["Có phương án dự phòng nếu mạng hoặc sản phẩm lỗi khi trình bày."],
  },

  cp4_pmf_responsible_ai_legal: {
    id: "cp4_pmf_responsible_ai_legal",
    text: "Dự án xử lý thế nào các vấn đề đạo đức, pháp lý và dùng AI có trách nhiệm?",
    explanation:
      "Nêu những rủi ro liên quan dữ liệu cá nhân, bản quyền, quy định ngành và cách nhóm kiểm soát. " +
      "Nếu dự án dùng AI: AI làm phần nào, con người chịu trách nhiệm phần nào, nhóm công khai điều đó với người dùng ra sao.",
    suggested_actions: ["Có ít nhất một quy tắc nhóm tự đặt ra và tuân thủ."],
  },

  // ── Mô hình kinh doanh (20%) ─────────────────────────────────────────────

  cp4_bm_canvas_summary: {
    id: "cp4_bm_canvas_summary",
    text: "Tóm tắt Business Model Canvas của dự án.",
    explanation:
      "Tóm tắt chín ô trong một đoạn ngắn: khách hàng, giá trị, kênh, quan hệ khách hàng, doanh thu, nguồn lực, hoạt động, đối tác, chi phí. " +
      "Bản đầy đủ đã làm ở CP3, ở đây chỉ nêu những gì thay đổi và điều quan trọng nhất.",
    suggested_actions: ["Phần thay đổi so với CP3 có lý do rõ ràng."],
  },

  cp4_bm_revenue_streams: {
    id: "cp4_bm_revenue_streams",
    text: "Dự án kiếm tiền từ những dòng doanh thu nào và dòng nào là chính?",
    explanation:
      "Mỗi dòng doanh thu ghi: ai trả tiền, trả cho cái gì, bao nhiêu và bao lâu một lần. " +
      "Nêu dòng chính ở giai đoạn đầu và dòng mở rộng sau này.",
    suggested_actions: ["Mỗi dòng có mức giá và căn cứ cho mức giá đó."],
  },

  cp4_bm_unit_economics: {
    id: "cp4_bm_unit_economics",
    text: "Chi phí để phục vụ một khách hàng và chi phí để có được một khách hàng là bao nhiêu?",
    explanation:
      "Nêu chi phí trực tiếp mỗi khách hàng (API, lưu trữ, hoàn tiền...) và chi phí thu hút khách hàng (marketing, khuyến mãi). " +
      "So với doanh thu mỗi khách hàng để thấy mô hình có lãi trên từng khách hay không.",
    suggested_actions: ["Con số lấy từ bảng ở tab Tài chính, bạn tự đọc rồi viết lại bằng lời."],
  },

  // ── Vận hành (20%) ───────────────────────────────────────────────────────

  cp4_op_roadmap: {
    id: "cp4_op_roadmap",
    text: "Lộ trình vận hành theo từng giai đoạn?",
    explanation:
      "Chia giai đoạn theo thời gian: mỗi giai đoạn có mục tiêu, việc chính, người phụ trách và kết quả mong đợi. " +
      "Giai đoạn gần nhất phải đủ cụ thể để làm ngay.",
    suggested_actions: ["Mỗi giai đoạn có một chỉ số đo được."],
  },

  cp4_op_marketing_4p: {
    id: "cp4_op_marketing_4p",
    text: "Kế hoạch marketing 4P (sản phẩm, giá, kênh phân phối, truyền thông)?",
    explanation:
      "Trả lời ngắn cho từng P: sản phẩm gì cho phân khúc nào, giá bao nhiêu, bán qua kênh nào, truyền thông thế nào. " +
      "Nhất quán với phân khúc khách hàng và mức giá ở các phần trước.",
    suggested_actions: ["Giá ở đây khớp với dòng doanh thu đã nêu."],
  },

  cp4_op_risks: {
    id: "cp4_op_risks",
    text: "Những rủi ro lớn nhất và cách nhóm kiểm soát?",
    explanation:
      "Liệt kê 3 đến 5 rủi ro lớn nhất: thị trường, kỹ thuật, tài chính, pháp lý, nhân sự. " +
      "Mỗi rủi ro ghi khả năng xảy ra, mức ảnh hưởng và phương án giảm thiểu.",
    suggested_actions: ["Có ít nhất một rủi ro từ đối thủ hoặc phụ thuộc vào bên thứ ba."],
  },

  cp4_op_pl_assumptions: {
    id: "cp4_op_pl_assumptions",
    text: "Các giả định chính đứng sau bảng P&L của nhóm là gì?",
    explanation:
      "Bảng P&L làm ở tab Tài chính. Ở đây nêu bằng lời các giả định lớn: số khách hàng, tỷ lệ chuyển đổi, đơn giá, chi phí cố định, tốc độ tăng trưởng. " +
      "Mỗi giả định ghi căn cứ (từ TAM/SAM/SOM, khảo sát hay dữ liệu thử nghiệm). Giả định về lao động của thành viên (sweat equity) phải ghi chú rõ.",
    suggested_actions: ["Người đọc không cần mở Excel vẫn hiểu số đến từ đâu."],
  },

  cp4_op_break_even: {
    id: "cp4_op_break_even",
    text: "Khi nào dự án hòa vốn và khoản lỗ lũy kế lớn nhất là bao nhiêu?",
    explanation:
      "Nhóm tự đọc từ bảng P&L của mình: kỳ đầu tiên lợi nhuận hoạt động dương, kỳ lợi nhuận lũy kế dương và mức lỗ lũy kế lớn nhất. " +
      "Viết kết luận bằng lời, kèm một câu giải thích vì sao.",
    suggested_actions: ["Các con số khớp với bảng P&L, không khớp thì xem lại cả hai."],
  },

  cp4_op_sustainability: {
    id: "cp4_op_sustainability",
    text: "Nhóm sống sót thế nào trong những tháng đầu chưa có lãi?",
    explanation:
      "Đây là câu hỏi lõi của Financial Sustainability Plan. Trả lời:\n" +
      "- Nguồn tiền nào trang trải chi phí khi chưa có lãi (tiền góp của nhóm, doanh thu sớm, hỗ trợ, vay)\n" +
      "- Nhóm kiểm soát chi phí ra sao (cắt phần nào, hoãn phần nào)\n" +
      "- Công sức không trả lương của thành viên (sweat equity) được tính thế nào\n" +
      "- Kế hoạch nếu doanh thu thấp hơn dự kiến",
    suggested_actions: ["Có một kịch bản xấu và hành động cụ thể cho kịch bản đó."],
  },

  // ── Kế hoạch gọi vốn (10%) ───────────────────────────────────────────────

  cp4_fund_path: {
    id: "cp4_fund_path",
    text: "Dự án chọn con đường tài chính nào (gọi vốn bên ngoài hay tự cấp vốn) và vì sao?",
    explanation:
      "Gọi vốn không chỉ là gọi quỹ đầu tư mạo hiểm. Nhóm có thể:\n" +
      "- Tự đầu tư, tái đầu tư từ doanh thu (bootstrapping)\n" +
      "- Nhóm sáng lập góp vốn (tiền mặt hay hiện vật, góp để làm gì)\n" +
      "- Gọi vốn thiên thần hoặc quỹ nếu dự án có khả năng tăng trưởng nhanh\n" +
      "Chọn một hướng chính và giải thích vì sao hợp với mô hình kinh doanh.",
    suggested_actions: ["Lựa chọn khớp với tốc độ tăng trưởng đã nêu ở phần Vận hành."],
  },

  cp4_fund_ask: {
    id: "cp4_fund_ask",
    text: "Nhóm cần bao nhiêu vốn, đổi lại điều gì?",
    explanation:
      "Nêu số vốn cần và hình thức: nhận vốn đổi lấy cổ phần, vốn vay hay hỗ trợ không hoàn lại. " +
      "Nếu tự cấp vốn, nêu tổng số vốn nhóm góp và từ ai. Giải thích cách nhóm ước lượng số này.",
    suggested_actions: ["Số vốn đủ chống đỡ giai đoạn lỗ lũy kế ở câu hòa vốn."],
  },

  cp4_fund_use_of_funds: {
    id: "cp4_fund_use_of_funds",
    text: "Số vốn sẽ được dùng vào những việc gì?",
    explanation:
      "Chia vốn theo hạng mục (sản phẩm, marketing, vận hành, dự phòng...) kèm tỷ lệ phần trăm và kết quả mong đợi của từng hạng mục. " +
      "Hạng mục nào mang lại doanh thu hoặc kiểm chứng giả định lớn nhất thì ưu tiên.",
    suggested_actions: ["Tổng các tỷ lệ bằng 100%."],
  },

  cp4_fund_school_support: {
    id: "cp4_fund_school_support",
    text: "Nhóm có xin hỗ trợ tài chính từ nhà trường không, và dự toán là bao nhiêu?",
    explanation:
      "Theo syllabus, sinh viên có thể xin trường hỗ trợ tài chính để thực hiện dự án. Nhóm nộp dự toán để giảng viên và cố vấn thẩm định. " +
      "Nếu có xin: nêu khoản cần, từng hạng mục chi và vì sao cần. Nếu không xin: ghi \"Không\" và nêu nguồn thay thế.",
    suggested_actions: ["Mỗi hạng mục trong dự toán có căn cứ giá cụ thể."],
  },
} satisfies Record<string, Question>;
