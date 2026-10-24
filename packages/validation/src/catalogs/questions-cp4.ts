import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// CP4 questions — financial plan (revenue and price, P&L assumptions, break-even,
// survival plan, sources of funds). Pitch content lives in questions-pitch.ts.
// Numbers (P&L) are NOT asked here: the team computes them in the Excel P&L file and
// only writes conclusions in words. Same wording convention as questions-cp3.ts:
// one-line purpose → "Cần nêu" bullets → one "Không đạt" / "Đạt" pair.
// Examples use one running project (study-group booking) as illustration only.
// ---------------------------------------------------------------------------

export const CP4_QUESTIONS = {
  // ── Doanh thu và giá ──────────────────────────────────────────────────────

  cp4_bm_revenue_streams: {
    id: "cp4_bm_revenue_streams",
    text: "Dự án có những dòng doanh thu nào và dòng nào là chính?",
    explanation:
      "Mỗi dòng doanh thu cần đủ ai trả, trả bao nhiêu. Cần nêu:\n" +
      "- Ai trả tiền và trả cho cái gì\n" +
      "- Mức giá và bao lâu thu một lần\n" +
      "- Dòng chính ở giai đoạn đầu, dòng mở rộng sau này\n" +
      "Không đạt: \"Bán ứng dụng cho sinh viên.\"\n" +
      "Đạt: \"Dòng chính: quán trả hoa hồng 8% mỗi lượt giữ bàn, khoảng 9.600 đồng. " +
      "Dòng mở rộng: sinh viên trả gói thành viên 29.000 đồng mỗi tháng từ năm hai.\"",
    suggested_actions: ["Mỗi dòng có mức giá và căn cứ cho mức giá đó."],
  },

  cp4_bm_unit_economics: {
    id: "cp4_bm_unit_economics",
    text: "Một khách hàng tốn bao nhiêu để phục vụ và để có được?",
    explanation:
      "Cho biết mô hình có lãi trên từng khách hay không. Cần nêu:\n" +
      "- Chi phí phục vụ một khách (máy chủ, thanh toán, hoàn tiền...)\n" +
      "- Chi phí để có một khách mới (tiếp thị, khuyến mãi)\n" +
      "- So với doanh thu mỗi khách\n" +
      "Số lấy từ file Excel P&L, bạn đọc rồi viết lại bằng lời.\n" +
      "Không đạt: \"Chi phí thấp, lãi cao.\"\n" +
      "Đạt: \"Phục vụ khoảng 1.500 đồng mỗi lượt. Có một khách mới tốn 20.000 đồng khuyến mãi. " +
      "Mỗi khách mang về khoảng 19.000 đồng mỗi tháng (2 lượt) nên hoàn vốn sau khoảng một tháng.\"",
    suggested_actions: ["Có so sánh chi phí có được khách với doanh thu mỗi khách."],
  },

  // ── Giả định và sinh tồn ──────────────────────────────────────────────────

  cp4_op_pl_assumptions: {
    id: "cp4_op_pl_assumptions",
    text: "Các giả định chính đứng sau bảng P&L của nhóm là gì?",
    explanation:
      "Người đọc không cần mở Excel vẫn hiểu số đến từ đâu. Cần nêu:\n" +
      "- Số khách, tỷ lệ chuyển đổi, đơn giá\n" +
      "- Chi phí cố định và tốc độ tăng trưởng\n" +
      "- Căn cứ mỗi giả định (quy mô thị trường, khảo sát hoặc dữ liệu thử nghiệm)\n" +
      "- Công sức không trả lương của thành viên, ghi chú rõ\n" +
      "Không đạt: \"Tăng trưởng 20% mỗi tháng.\"\n" +
      "Đạt: \"Năm một đạt 1% của 60.000 sinh viên (600 người), mỗi người 2 lượt mỗi tháng, hoa hồng 9.600 đồng mỗi lượt. " +
      "Chi phí 15 triệu mỗi tháng. Bốn thành viên không nhận lương trong năm đầu.\"",
    suggested_actions: ["Mỗi giả định có căn cứ, khớp với quy mô thị trường đã nêu."],
  },

  cp4_op_break_even: {
    id: "cp4_op_break_even",
    text: "Khi nào dự án hòa vốn và khoản lỗ lũy kế lớn nhất là bao nhiêu?",
    explanation:
      "Đọc từ bảng P&L của nhóm rồi viết kết luận bằng lời. Cần nêu:\n" +
      "- Tháng đầu tiên lợi nhuận hoạt động dương\n" +
      "- Tháng lợi nhuận lũy kế dương\n" +
      "- Mức lỗ lũy kế lớn nhất\n" +
      "- Một câu giải thích vì sao\n" +
      "Không đạt: \"Dự án sẽ hòa vốn sớm.\"\n" +
      "Đạt: \"Lợi nhuận hoạt động dương từ tháng 13, lũy kế dương từ tháng 26, lỗ lũy kế lớn nhất 42 triệu ở tháng 12. " +
      "Vì chi phí máy chủ tăng chậm hơn số lượt giữ bàn.\"",
    suggested_actions: ["Các con số khớp với bảng P&L, lệch thì xem lại cả hai."],
  },

  cp4_op_sustainability: {
    id: "cp4_op_sustainability",
    text: "Nhóm sống sót thế nào trong những tháng đầu chưa có lãi?",
    explanation:
      "Đây là câu hỏi lõi của kế hoạch sinh tồn tài chính. Cần nêu:\n" +
      "- Nguồn tiền trang trải chi phí khi chưa có lãi (vốn góp của nhóm, doanh thu sớm, hỗ trợ, vay)\n" +
      "- Cách kiểm soát chi phí: cắt hoặc hoãn việc gì\n" +
      "- Công sức không trả lương của thành viên được tính thế nào\n" +
      "- Kế hoạch nếu doanh thu thấp hơn dự kiến\n" +
      "Không đạt: \"Nhóm sẽ cố gắng tiết kiệm.\"\n" +
      "Đạt: \"Nhóm góp 50 triệu, đủ đến khi dự án có lãi hoạt động ở tháng 13. Hoãn thuê người đến khi có 100 khách trả tiền. " +
      "Nếu doanh thu chỉ bằng một nửa dự kiến, nhóm cắt tiếp thị và kéo dài thêm 5 tháng.\"",
    suggested_actions: ["Có một kịch bản xấu và hành động cụ thể cho kịch bản đó."],
  },

  // ── Nguồn vốn (tuỳ chọn) ──────────────────────────────────────────────────

  cp4_fund_path: {
    id: "cp4_fund_path",
    text: "Dự án lấy vốn từ nguồn nào và vì sao?",
    explanation:
      "Nhóm nào cũng có nguồn vốn, không riêng nhóm nhận vốn từ bên ngoài. Cần nêu:\n" +
      "- Nguồn chính: tự đầu tư, tái đầu tư từ doanh thu, vốn góp của nhóm sáng lập, nhà đầu tư thiên thần hoặc quỹ\n" +
      "- Vì sao nguồn này hợp với mô hình và tốc độ tăng trưởng\n" +
      "Không đạt: \"Nhận vốn từ nhà đầu tư.\"\n" +
      "Đạt: \"Vốn góp của nhóm 50 triệu rồi tái đầu tư doanh thu. Không nhận vốn ngoài vì mô hình tăng trưởng vừa phải, " +
      "cần nhiều thời gian để có bằng chứng khách trả tiền.\"",
    suggested_actions: ["Lựa chọn khớp với tốc độ tăng trưởng trong bảng P&L."],
  },

  cp4_fund_ask: {
    id: "cp4_fund_ask",
    text: "Nhóm cần bao nhiêu vốn và đổi lại điều gì?",
    explanation:
      "Nêu số vốn và cách ước lượng. Cần nêu:\n" +
      "- Số vốn cần và hình thức: đổi cổ phần, vốn vay hoặc hỗ trợ không hoàn lại\n" +
      "- Nếu tự cấp vốn: tổng số nhóm góp và từ ai\n" +
      "- Cách nhóm ước lượng số này\n" +
      "Không đạt: \"Cần khoảng 500 triệu.\"\n" +
      "Đạt: \"Cần 50 triệu, do 4 thành viên góp đều, không đổi cổ phần. " +
      "Số này gồm lỗ lũy kế lớn nhất 42 triệu cộng 8 triệu dự phòng.\"",
    suggested_actions: ["Số vốn đủ chống đỡ khoản lỗ lũy kế ở câu hòa vốn."],
  },

  cp4_fund_use_of_funds: {
    id: "cp4_fund_use_of_funds",
    text: "Số vốn sẽ dùng vào những việc gì?",
    explanation:
      "Chia vốn theo hạng mục, ưu tiên việc mang lại doanh thu hoặc kiểm chứng giả định lớn nhất. Cần nêu:\n" +
      "- Hạng mục (sản phẩm, tiếp thị, vận hành, dự phòng)\n" +
      "- Tỷ lệ phần trăm từng hạng mục\n" +
      "- Kết quả mong đợi của từng hạng mục\n" +
      "Không đạt: \"Dùng để phát triển sản phẩm và marketing.\"\n" +
      "Đạt: \"50% sản phẩm để hoàn thiện đồng bộ bàn trống. 30% tiếp thị để có 600 người dùng. 20% vận hành và dự phòng.\"",
    suggested_actions: ["Tổng các tỷ lệ bằng 100%."],
  },

  cp4_fund_school_support: {
    id: "cp4_fund_school_support",
    text: "Nhóm có xin nhà trường hỗ trợ tài chính không, và dự toán bao nhiêu?",
    explanation:
      "Theo quy định môn học, sinh viên có thể xin trường hỗ trợ tài chính, dự toán do giảng viên và cố vấn thẩm định. Cần nêu:\n" +
      "- Có xin hay không\n" +
      "- Nếu có: khoản cần và từng hạng mục chi, vì sao cần\n" +
      "- Nếu không: nguồn thay thế\n" +
      "Không đạt: \"Cần trường hỗ trợ thêm.\"\n" +
      "Đạt: \"Xin 5 triệu: 3 triệu chạy thử với 100 người dùng, 2 triệu in tài liệu. Giá lấy từ báo giá của hai đơn vị.\"",
    suggested_actions: ["Mỗi hạng mục trong dự toán có căn cứ giá cụ thể."],
  },
} satisfies Record<string, Question>;
