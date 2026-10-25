import type { Question } from "./types.js";

// ---------------------------------------------------------------------------
// CP3 questions — Startup Checkpoint 3 (Business Model Canvas, SWOT, conclusion).
// Source: the lecturer's BMC/SWOT guide (rubric). Same wording convention as
// questions.ts: one-line purpose → "Cần nêu" bullets → one "Không đạt" / "Đạt" pair.
// Examples use one running project (study-group booking) as illustration only.
// ---------------------------------------------------------------------------

export const CP3_QUESTIONS = {
  // ── Mô hình kinh doanh ────────────────────────────────────────────────────

  cp3_bmc_customer_segments: {
    id: "cp3_bmc_customer_segments",
    text: "Nhóm giải quyết nhu cầu gì, cho ai, ở đâu?",
    explanation:
      "Chọn một nhóm khách hàng đủ hẹp để nhóm biết đi gặp ai. Cần nêu:\n" +
      "- Khách hàng là ai (đặc điểm cụ thể)\n" +
      "- Họ ở đâu\n" +
      "- Quy mô khoảng bao nhiêu người\n" +
      "Không đạt: \"Sinh viên.\"\n" +
      "Đạt: \"Sinh viên năm 2 đến 3 quanh ba trường đại học ở Thủ Đức, hay học nhóm 3 đến 6 người. " +
      "Khoảng 60.000 sinh viên, nhóm nhắm 5% trong năm đầu.\"",
    suggested_actions: ["Có ít nhất hai trong ba ý: ai, ở đâu, quy mô."],
  },

  cp3_bmc_value_proposition: {
    id: "cp3_bmc_value_proposition",
    text: "Sản phẩm mang lại lợi ích độc đáo gì cho khách hàng?",
    explanation:
      "Nêu điều khiến khách chọn nhóm thay vì cách họ đang dùng. Cần nêu:\n" +
      "- Lợi ích chính, viết trong một hai câu\n" +
      "- Hơn cách khách đang dùng ở điểm nào\n" +
      "- Vì sao đối thủ khó sao chép\n" +
      "Không đạt: \"Tiện lợi, nhanh, giá tốt.\"\n" +
      "Đạt: \"Xem bàn trống và ổ điện của các quán quanh trường rồi giữ bàn trong 10 phút, thay vì nhắn hỏi từng quán. " +
      "Khó sao chép vì nhóm đã ký thỏa thuận chia sẻ dữ liệu bàn với 5 quán.\"",
    suggested_actions: ["Có một đối tượng để so sánh (cách khách đang làm hoặc một đối thủ)."],
  },

  cp3_bmc_channels: {
    id: "cp3_bmc_channels",
    text: "Nhóm quảng bá và bán hàng qua những kênh nào?",
    explanation:
      "Tách hai loại kênh. Cần nêu:\n" +
      "- Kênh truyền thông: khách biết đến nhóm ở đâu\n" +
      "- Kênh bán hàng: khách mua hoặc dùng ở đâu\n" +
      "- Vì sao khách của nhóm có mặt ở kênh đó\n" +
      "Không đạt: \"Facebook, TikTok.\"\n" +
      "Đạt: \"Truyền thông: hội nhóm Facebook của từng trường, vì sinh viên hỏi chỗ học ở đó hằng ngày. " +
      "Bán hàng: đặt và thanh toán ngay trong ứng dụng.\"",
    suggested_actions: ["Có cả kênh truyền thông lẫn kênh bán hàng."],
  },

  cp3_bmc_customer_relationships: {
    id: "cp3_bmc_customer_relationships",
    text: "Nhóm thu hút và giữ chân khách hàng bằng cách nào?",
    explanation:
      "Trả lời cả hai việc. Cần nêu:\n" +
      "- Cách thu hút khách dùng lần đầu\n" +
      "- Điều khiến khách quay lại hoặc ở lại\n" +
      "Không đạt: \"Chăm sóc khách hàng tốt.\"\n" +
      "Đạt: \"Thu hút: tặng một lượt giữ bàn miễn phí khi giới thiệu bạn. " +
      "Giữ chân: tích điểm mỗi lần đặt, đủ 10 lần được giữ bàn ưu tiên.\"",
    suggested_actions: ["Cách giữ chân là một việc làm cụ thể, không chỉ là mục tiêu."],
  },

  cp3_bmc_revenue_streams: {
    id: "cp3_bmc_revenue_streams",
    text: "Dự án thu tiền từ đâu và với mức giá bao nhiêu?",
    explanation:
      "Nêu từng nguồn thu và cách tính tiền. Cần nêu:\n" +
      "- Nguồn thu chính (bán hàng, phí dịch vụ, hoa hồng, gói đăng ký...)\n" +
      "- Đơn vị tính (theo lần, tháng, gói) và mức giá\n" +
      "- Mức giá là giá thử nghiệm hay đã chốt, và dựa vào đâu\n" +
      "Không đạt: \"Bán ứng dụng cho sinh viên.\"\n" +
      "Đạt: \"Thu hoa hồng 8% mỗi lượt đặt bàn của quán đối tác, khoảng 9.600 đồng mỗi lượt, " +
      "và gói thành viên 29.000 đồng mỗi tháng. Giá thử nghiệm, dựa trên khảo sát 25 sinh viên nói trả được 20 đến 40 nghìn mỗi tháng.\"",
    suggested_actions: ["Mỗi nguồn thu có đơn vị tính và con số giá."],
  },

  cp3_bmc_key_resources: {
    id: "cp3_bmc_key_resources",
    text: "Nhóm cần những nguồn lực chính nào?",
    explanation:
      "Liệt kê nguồn lực thật sự cần để chạy các hoạt động chính. Cần nêu:\n" +
      "- Nhân lực\n" +
      "- Tài chính, và vốn đến từ đâu (tự có, vay, góp vốn)\n" +
      "- Công nghệ, thiết bị, mặt bằng nếu có\n" +
      "Không đạt: \"Con người và tiền.\"\n" +
      "Đạt: \"Nhân lực: 4 thành viên, 2 người lập trình. Tài chính: 40 triệu, trong đó 60% vốn tự có, 40% vay gia đình. " +
      "Công nghệ: máy chủ đám mây và cổng thanh toán.\"",
    suggested_actions: ["Mỗi nguồn lực phục vụ một hoạt động ở câu sau."],
  },

  cp3_bmc_key_activities: {
    id: "cp3_bmc_key_activities",
    text: "Nhóm làm những việc chính nào, và làm như thế nào?",
    explanation:
      "Nêu những việc quyết định mô hình chạy được. Cần nêu:\n" +
      "- Việc tạo ra giá trị cho khách\n" +
      "- Việc tạo ra doanh thu\n" +
      "- Cách làm cụ thể (ai làm, bao lâu một lần)\n" +
      "Không đạt: \"Phát triển sản phẩm, marketing.\"\n" +
      "Đạt: \"Cập nhật bàn trống của 5 quán mỗi ngày qua ứng dụng quán. " +
      "Đăng bài trong hội nhóm trường mỗi tuần. Chốt thêm quán đối tác mỗi tháng.\"",
    suggested_actions: ["Có việc tạo ra doanh thu, không chỉ việc làm sản phẩm."],
  },

  cp3_bmc_key_partners: {
    id: "cp3_bmc_key_partners",
    text: "Ai là nhà cung cấp, đối tác và cố vấn chính của nhóm?",
    explanation:
      "Với mỗi đối tác, nêu ngắn gọn:\n" +
      "- Họ giúp nhóm điều gì\n" +
      "- Nhóm phụ thuộc họ đến mức nào, và nếu mất thì thay bằng gì\n" +
      "Nếu nhóm tự làm gần hết, nói rõ như vậy.\n" +
      "Không đạt: \"Các quán cà phê và nhà tài trợ.\"\n" +
      "Đạt: \"5 quán đối tác cung cấp dữ liệu bàn, phụ thuộc cao, dự phòng là nhập tay. " +
      "Một giảng viên cố vấn góp ý mô hình giá, phụ thuộc thấp.\"",
    suggested_actions: ["Đối tác nào nhóm phụ thuộc nhiều nhất thì có phương án thay thế."],
  },

  cp3_bmc_cost_structure: {
    id: "cp3_bmc_cost_structure",
    text: "Chi phí đầu tư ban đầu và chi phí vận hành chính gồm những khoản nào?",
    explanation:
      "Tách hai nhóm và gọi tên từng khoản. Cần nêu:\n" +
      "- Chi phí đầu tư ban đầu\n" +
      "- Chi phí vận hành định kỳ (cố định hoặc tăng theo số khách)\n" +
      "- Con số ước tính cho các khoản lớn nhất\n" +
      "Không đạt: \"Chi phí marketing và nhân sự.\"\n" +
      "Đạt: \"Ban đầu: 15 triệu làm ứng dụng. Mỗi tháng: máy chủ 1,5 triệu, quảng cáo 3 triệu, " +
      "phí cổng thanh toán 2% mỗi giao dịch.\"",
    suggested_actions: ["Khoản chi nào cũng gắn với một hoạt động ở câu trước."],
  },

  // ── Phân tích SWOT ────────────────────────────────────────────────────────

  cp3_swot_strengths: {
    id: "cp3_swot_strengths",
    text: "Điểm mạnh nội tại của nhóm là gì?",
    explanation:
      "Điểm mạnh là thứ nhóm đang có, kèm số liệu chứng minh. Cần nêu:\n" +
      "- Mỗi điểm mạnh một dòng (nên đánh mã S1, S2... để ghép ở phần chiến lược, không bắt buộc)\n" +
      "- Mỗi điểm có số liệu hoặc ví dụ kiểm chứng được\n" +
      "Không đạt: \"Nhóm làm việc chăm chỉ.\"\n" +
      "Đạt: \"S1: 20 trong 25 sinh viên dùng thử nói tìm chỗ nhanh hơn trước (khảo sát tháng 10).\"",
    suggested_actions: ["Mỗi điểm mạnh có một con số hoặc ví dụ có nguồn."],
  },

  cp3_swot_weaknesses: {
    id: "cp3_swot_weaknesses",
    text: "Điểm yếu nội tại của nhóm là gì?",
    explanation:
      "Điểm yếu là hạn chế thật của nhóm, không phải điểm mạnh nói lại. Cần nêu:\n" +
      "- Mỗi điểm yếu một dòng (nên đánh mã W1, W2... để ghép ở phần chiến lược, không bắt buộc)\n" +
      "- Mỗi điểm có số liệu hoặc ví dụ cụ thể\n" +
      "Không đạt: \"Nhóm quá cầu toàn.\"\n" +
      "Đạt: \"W1: chưa có thành viên làm kinh doanh, 3 cuộc đàm phán với quán đều do nhóm kỹ thuật làm và chưa chốt được.\"",
    suggested_actions: ["Điểm yếu nào cũng là điều nhóm thật sự gặp, không né tránh."],
  },

  cp3_swot_opportunities: {
    id: "cp3_swot_opportunities",
    text: "Cơ hội bên ngoài nào đang có lợi cho dự án?",
    explanation:
      "Cơ hội là yếu tố bên ngoài nhóm, như nhu cầu thị trường, xu hướng, khoảng trống đối thủ chưa lấp. Cần nêu:\n" +
      "- Mỗi cơ hội một dòng (nên đánh mã O1, O2... để ghép ở phần chiến lược, không bắt buộc)\n" +
      "- Mỗi cơ hội có số liệu và nguồn (khảo sát, báo cáo, ngày)\n" +
      "Không đạt: \"Thị trường học nhóm đang phát triển.\"\n" +
      "Đạt: \"O1: 18 trong 25 sinh viên khảo sát học nhóm ít nhất hai lần mỗi tuần (khảo sát của nhóm, tháng 10).\"",
    suggested_actions: ["Mỗi cơ hội ghi rõ lấy số liệu từ đâu."],
  },

  cp3_swot_threats: {
    id: "cp3_swot_threats",
    text: "Thách thức bên ngoài nào có thể làm dự án thất bại?",
    explanation:
      "Thách thức là yếu tố bên ngoài bất lợi, nên có đối thủ hoặc giải pháp thay thế. Cần nêu:\n" +
      "- Mỗi thách thức một dòng (nên đánh mã T1, T2... để ghép ở phần chiến lược, không bắt buộc)\n" +
      "- Mỗi thách thức có số liệu hoặc ví dụ cụ thể\n" +
      "Không đạt: \"Có nhiều đối thủ.\"\n" +
      "Đạt: \"T1: ứng dụng đặt bàn lớn như Google Maps đã cho xem giờ đông, khách có thể không cần thêm ứng dụng mới.\"",
    suggested_actions: ["Có ít nhất một đối thủ hoặc giải pháp thay thế được gọi tên."],
  },

  // ── Chiến lược từ SWOT ────────────────────────────────────────────────────

  cp3_strategy_so: {
    id: "cp3_strategy_so",
    text: "Nhóm dùng điểm mạnh nào để tận dụng cơ hội nào?",
    explanation:
      "Ghép điểm mạnh với cơ hội thành hành động. Nói rõ dùng điểm mạnh và cơ hội nào (bằng mã như \"S1 + O1\" hoặc bằng tên), rồi nêu hành động làm được trong thời gian dự án.\n" +
      "Không đạt: \"Phát huy điểm mạnh để nắm bắt cơ hội.\"\n" +
      "Đạt: \"S1 + O1: dùng kết quả 20/25 sinh viên thích để thuyết phục thêm 5 quán ký thỏa thuận thử nghiệm trong tháng 12.\"",
    suggested_actions: ["Người đọc truy được điểm mạnh và cơ hội mà chiến lược dựa vào."],
  },

  cp3_strategy_st: {
    id: "cp3_strategy_st",
    text: "Nhóm dùng điểm mạnh nào để đối phó thách thức nào?",
    explanation:
      "Ghép điểm mạnh với thách thức để giảm tác động xấu. Nói rõ dùng điểm mạnh và thách thức nào (bằng mã hoặc bằng tên), rồi nêu hành động.\n" +
      "Không đạt: \"Dùng điểm mạnh để vượt qua đối thủ.\"\n" +
      "Đạt: \"S1 + T1: dùng kết quả 20/25 sinh viên nói tìm chỗ nhanh hơn để đăng bài so sánh trực tiếp với cách xem giờ đông trên Google Maps, trong tuần 1.\"",
    suggested_actions: ["Hành động cụ thể, không chỉ nói chung chung về cạnh tranh."],
  },

  cp3_strategy_wo: {
    id: "cp3_strategy_wo",
    text: "Nhóm khắc phục điểm yếu nào để nắm bắt cơ hội nào?",
    explanation:
      "Ghép điểm yếu với cơ hội: nhóm cần sửa gì để đủ sức nắm cơ hội. Nói rõ điểm yếu và cơ hội nào (bằng mã hoặc bằng tên), rồi nêu hành động.\n" +
      "Không đạt: \"Cải thiện điểm yếu để nắm cơ hội.\"\n" +
      "Đạt: \"W1 + O1: mời một bạn khoa Kinh doanh vào nhóm đàm phán với quán, chốt 3 quán đầu tiên trong tháng 12.\"",
    suggested_actions: ["Hành động sửa được điểm yếu đã nêu, không chỉ nhắc lại nó."],
  },

  cp3_strategy_wt: {
    id: "cp3_strategy_wt",
    text: "Nhóm giảm điểm yếu nào để tránh thách thức nào?",
    explanation:
      "Ghép điểm yếu với thách thức để giảm rủi ro lớn nhất. Nói rõ điểm yếu và thách thức nào (bằng mã hoặc bằng tên), rồi nêu hành động. " +
      "Nếu nhóm chọn bỏ một hướng, nêu rõ lý do.\n" +
      "Không đạt: \"Cố gắng hơn để không thua đối thủ.\"\n" +
      "Đạt: \"W1 + T1: chưa đủ người đàm phán nên chỉ làm một khu vực quanh một trường, tránh đối đầu trực tiếp với ứng dụng lớn.\"",
    suggested_actions: ["Rủi ro được giảm bằng việc làm cụ thể, có thể bao gồm bỏ một hướng."],
  },

  // ── Kết luận ──────────────────────────────────────────────────────────────

  cp3_business_feasibility: {
    id: "cp3_business_feasibility",
    text: "Vì sao nhóm tin dự án khả thi về mặt kinh doanh?",
    explanation:
      "Nêu hai đến ba lý do, mỗi lý do kèm bằng chứng. Cần nêu:\n" +
      "- Lý do và bằng chứng (nhu cầu, chi phí, khách sẵn sàng trả tiền)\n" +
      "- Điều còn chưa chắc, nhóm sẽ kiểm chứng thế nào\n" +
      "Không đạt: \"Dự án khả thi vì thị trường lớn.\"\n" +
      "Đạt: \"Khách sẵn sàng trả: 18 trong 25 sinh viên nói trả được 29.000 đồng mỗi tháng. " +
      "Chưa chắc: quán có chịu chia sẻ dữ liệu lâu dài, sẽ thử với 5 quán trong 2 tháng.\"",
    suggested_actions: ["Có nói điều chưa chắc, không chỉ nói điều tốt."],
  },

  cp3_future_development: {
    id: "cp3_future_development",
    text: "Nhóm sẽ làm gì tiếp theo trong ngắn hạn, trung hạn và dài hạn?",
    explanation:
      "Chia ba mốc, mỗi mốc có kết quả mong đợi đo được. Cần nêu:\n" +
      "- Ngắn hạn: việc làm ngay sau checkpoint này\n" +
      "- Trung hạn: mở rộng tính năng, khu vực hoặc dịch vụ\n" +
      "- Dài hạn: tầm nhìn của sản phẩm\n" +
      "Không đạt: \"Phát triển thêm nhiều tính năng.\"\n" +
      "Đạt: \"Ngắn hạn: ký thêm 5 quán trong tháng 12. Trung hạn: mở rộng sang 3 trường, đạt 1.000 lượt đặt mỗi tháng. " +
      "Dài hạn: thành ứng dụng đặt chỗ học nhóm toàn TP.HCM.\"",
    suggested_actions: ["Mốc ngắn hạn làm được ngay trong học kỳ này."],
  },
} satisfies Record<string, Question>;
